"use client";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { compressImageFile, formatFileSize, parseUploadErrorResponse } from "@/lib/compressImageClient";
import { getServiceImageSrc } from "@/lib/serviceImage";
import * as styles from "./styles";
import mobile from "./AdminMobileCards.module.css";

export default function ServiceTab() {
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [dentalClinics, setDentalClinics] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [viewMore, setViewMore] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;
  const [imageCompressing, setImageCompressing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    originalPrice: "",
    duration: "",
    category: "",
    parentService: "",
    clinic: "",
    order: "",
    image: null,
    isVideoConsultation: false,
  });

  const handleImageSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      setFormData((prev) => ({ ...prev, image: null }));
      return;
    }
    setImageCompressing(true);
    try {
      const compressed = await compressImageFile(file);
      setFormData((prev) => ({ ...prev, image: compressed }));
      if (compressed.size < file.size) {
        toast.success(`Image optimized: ${formatFileSize(file.size)} → ${formatFileSize(compressed.size)}`);
      }
    } catch (err) {
      console.error("Image compression failed:", err);
      setFormData((prev) => ({ ...prev, image: file }));
      toast.error("Could not optimize image. Original file will be used — keep it under 1MB.");
    } finally {
      setImageCompressing(false);
    }
  };

  const fetchServices = async () => {
    const res = await fetch("/api/admin/services", { cache: "no-store" });
    const data = await res.json();
    setServices(Array.isArray(data) ? data : []);
  };

  const fetchCategories = async () => {
    const res = await fetch("/api/category");
    const data = await res.json();
    setCategories(data);
  };

  const fetchDentalClinics = async () => {
    const res = await fetch("/api/salon?type=dentist");
    const data = await res.json();
    setDentalClinics(Array.isArray(data) ? data : []);
  };

  useEffect(() => {
    fetchServices();
    fetchCategories();
    fetchDentalClinics();
  }, []);

  const selectedCategoryType =
    categories.find((c) => c._id === formData.category)?.type ||
    categories.find((c) => c._id?.toString() === formData.category)?.type ||
    "";

  useEffect(() => {
    if (selectedCategoryType !== "dentist" && formData.clinic) {
      setFormData((prev) => ({ ...prev, clinic: "" }));
    }
  }, [selectedCategoryType, formData.clinic]);

  useEffect(() => {
    // Clear parent service if category changes
    if (formData.category && editing) {
      // Keep parent service if it's in the same category
      const currentParent = services.find(s => s._id === formData.parentService);
      if (currentParent && currentParent.category !== formData.category) {
        setFormData(prev => ({ ...prev, parentService: "" }));
      }
    }
  }, [formData.category]);

  const filteredServices = services.filter((service) => {
    if (categoryFilter !== "all") {
      const catId = service.category?._id || service.category;
      if (catId !== categoryFilter) return false;
    }
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filteredServices.length / pageSize));
  const currentPageSafe = Math.min(currentPage, totalPages);
  const startIndex = (currentPageSafe - 1) * pageSize;
  const paginatedServices = filteredServices.slice(startIndex, startIndex + pageSize);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.category) {
      toast.error("Name and category are required");
      return;
    }

    // Check if this service (if editing) has any children
    let hasChildren = false;
    if (editing) {
      hasChildren = services.some(s => {
        const parentId = typeof s.parentService === "string" 
          ? s.parentService 
          : s.parentService?._id;
        return parentId === editing._id;
      });
    }

    // IMPORTANT: If service has children, it CANNOT have price/duration (it's a grouping service)
    if (hasChildren && (formData.price || formData.duration)) {
      toast.error("This service has children, so it cannot have price and duration. Only leaf services (services without children) can be bookable.");
      return;
    }

    // No strict validation for top-level services
    // Service can be created with or without price/duration
    // If no price/duration, it will be a grouping service (can add children later)
    // If price/duration provided, it will be bookable leaf node (unless children added later)
    // Backend will handle removing price/duration if children are added

    setSaving(true);

    try {
      const data = new FormData();
      data.append("name", formData.name);
      data.append("description", formData.description || "");
      if (formData.price) data.append("price", formData.price);
      if (formData.originalPrice) data.append("originalPrice", formData.originalPrice);
      if (formData.duration) data.append("duration", formData.duration);
      data.append("category", formData.category);
      if (formData.parentService) {
        data.append("parentService", formData.parentService);
      }
      if (selectedCategoryType === "dentist" && formData.clinic) {
        data.append("clinic", formData.clinic);
      } else if (editing) {
        data.append("clinic", "null");
      }
      if (formData.order) {
        data.append("order", formData.order);
      }
      if (formData.image && formData.image.size > 0) {
        let imageFile = formData.image;
        try {
          imageFile = await compressImageFile(formData.image);
        } catch (err) {
          console.error("Image compression failed:", err);
          toast.error("Could not process image. Try a JPG/PNG under 5MB.");
          return;
        }
        data.append("image", imageFile);
      }
      data.append("isVideoConsultation", formData.isVideoConsultation ? "true" : "false");

      let response;
      if (editing) {
        response = await fetch(`/api/service/${editing._id}`, {
          method: "PUT",
          body: data,
        });
      } else {
        response = await fetch("/api/service", {
          method: "POST",
          body: data,
        });
      }

      let result = {};
      const text = await response.text();
      try {
        result = text ? JSON.parse(text) : {};
      } catch {
        result = { message: text || "Server error" };
      }

      if (!response.ok) {
        toast.error(parseUploadErrorResponse(text, response.status));
        return;
      }

      toast.success(editing ? "Service updated successfully" : "Service added successfully");
      if (result?._id) {
        setServices((prev) => {
          const exists = prev.some((s) => s._id === result._id);
          if (exists) {
            return prev.map((s) => (s._id === result._id ? { ...s, ...result } : s));
          }
          return [result, ...prev];
        });
      }
      fetchServices();
      setShowModal(false);
      setEditing(null);
      setFormData({ name: "", description: "", price: "", originalPrice: "", duration: "", category: "", parentService: "", clinic: "", order: "", image: null, isVideoConsultation: false });
    } catch (error) {
      console.error("Error saving service:", error);
      toast.error("Error saving service. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (service) => {
    setEditing(service);
    
    // Check if this service has any children
    const hasChildren = services.some(s => {
      const parentId = typeof s.parentService === "string" 
        ? s.parentService 
        : s.parentService?._id;
      return parentId === service._id;
    });
    
    setFormData({
      name: service.name,
      description: service.description || "",
      // If service has children, don't allow price/duration (it's a grouping service)
      price: hasChildren ? "" : (service.price ? service.price.toString() : ""),
      originalPrice: hasChildren ? "" : (service.originalPrice ? service.originalPrice.toString() : ""),
      duration: hasChildren ? "" : (service.duration ? service.duration.toString() : ""),
      category: service.category._id || service.category,
      parentService: service.parentService?._id || service.parentService || "",
      clinic: service.clinic?._id || service.clinic || "",
      order: service.order ? service.order.toString() : "",
      image: null,
      isVideoConsultation: !!service.isVideoConsultation,
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this service?")) return;
    await fetch(`/api/service/${id}`, { method: "DELETE" });
    toast.success("Service deleted");
    fetchServices();
  };

  const toggleActive = async (id, active) => {
    const data = new FormData();
    data.append("active", !active);
    await fetch(`/api/service/${id}`, {
      method: "PUT",
      body: data,
    });
    fetchServices();
  };

  return (
    <div>
      <div style={styles.pageHeader}>
        <h2 style={styles.pageTitle}>Services</h2>
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setCurrentPage(1);
            }}
            style={{
              padding: "10px 16px",
              border: "2px solid #e2e8f0",
              borderRadius: "10px",
              fontSize: "14px",
              fontWeight: 500,
              background: "white",
              cursor: "pointer",
              minWidth: "180px",
            }}
          >
            <option value="all">All Categories</option>
            {categories.map((cat) => (
              <option key={cat._id} value={cat._id}>
                {cat.name}
              </option>
            ))}
          </select>
          <button
            onClick={() => {
              setEditing(null);
              setFormData({ name: "", description: "", price: "", originalPrice: "", duration: "", category: "", parentService: "", clinic: "", order: "", image: null, isVideoConsultation: false });
              setShowModal(true);
            }}
            style={styles.addButton}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 6px 16px rgba(99, 102, 241, 0.4)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 4px 12px rgba(99, 102, 241, 0.3)";
            }}
          >
            <span>+</span> Add Service
          </button>
        </div>
      </div>

      {services.length === 0 ? (
        <div style={styles.emptyState}>
          <p style={styles.emptyStateText}>No services yet. Add your first service!</p>
        </div>
      ) : (
        <>
        {/* Mobile cards */}
        <div className={mobile.mobileCards}>
          {paginatedServices.map((service) => {
            const statusBg = service.active ? "#dcfce7" : "#fee2e2";
            const statusColor = service.active ? "#166534" : "#991b1b";
            const priceLabel = service.price ? `₹${service.price}` : "N/A";
            const durationLabel = service.duration ? `${service.duration} min` : "N/A";
            return (
              <div key={service._id} className={mobile.card}>
                <div className={mobile.cardHeader}>
                  <div>
                    <div className={mobile.cardTitle}>{service.name}</div>
                    <div className={mobile.cardMeta}>
                      {service.category?.name || "N/A"} • {durationLabel}
                    </div>
                  </div>
                  <span className={mobile.badge} style={{ background: statusBg, color: statusColor }}>
                    {service.active ? "Active" : "Inactive"}
                  </span>
                </div>
                <div className={mobile.summary}>
                  <strong>Price:</strong> {priceLabel}
                  {service.isVideoConsultation ? (
                    <>
                      <br />
                      <strong>Type:</strong> Video consultation
                    </>
                  ) : null}
                </div>
                <button type="button" className={mobile.viewMoreBtn} onClick={() => setViewMore(service)}>
                  View More
                </button>
              </div>
            );
          })}
        </div>

        {/* Desktop table */}
        <div className={mobile.hideOnMobile} style={styles.table.wrapper}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "0 24px 8px",
              fontSize: 13,
              color: "#6b7280",
            }}
          >
            <span>
              Showing{" "}
              <strong>
                {filteredServices.length === 0 ? 0 : startIndex + 1}-
                {Math.min(startIndex + pageSize, filteredServices.length)}
              </strong>{" "}
              of <strong>{filteredServices.length}</strong> services
            </span>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <button
                type="button"
                disabled={currentPageSafe <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                style={{
                  padding: "6px 10px",
                  borderRadius: 999,
                  border: "1px solid #e5e7eb",
                  background: currentPageSafe <= 1 ? "#f9fafb" : "#ffffff",
                  color: currentPageSafe <= 1 ? "#9ca3af" : "#111827",
                  fontSize: 12,
                  cursor: currentPageSafe <= 1 ? "not-allowed" : "pointer",
                }}
              >
                Prev
              </button>
              <span>
                Page <strong>{currentPageSafe}</strong> / {totalPages}
              </span>
              <button
                type="button"
                disabled={currentPageSafe >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                style={{
                  padding: "6px 10px",
                  borderRadius: 999,
                  border: "1px solid #e5e7eb",
                  background: currentPageSafe >= totalPages ? "#f9fafb" : "#ffffff",
                  color: currentPageSafe >= totalPages ? "#9ca3af" : "#111827",
                  fontSize: 12,
                  cursor: currentPageSafe >= totalPages ? "not-allowed" : "pointer",
                }}
              >
                Next
              </button>
            </div>
          </div>
          <table style={styles.table.table}>
            <thead>
              <tr>
                <th style={styles.table.th}>Image</th>
                <th style={styles.table.th}>Name</th>
                <th style={styles.table.th}>Description</th>
                <th style={styles.table.th}>Price</th>
                <th style={styles.table.th}>Duration</th>
                <th style={styles.table.th}>Category</th>
                <th style={styles.table.th}>Parent Service</th>
                <th style={styles.table.th}>Video Consultation</th>
                <th style={styles.table.th}>Status</th>
                <th style={styles.table.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedServices.map((service) => (
                <tr key={service._id}>
                  <td style={styles.table.td}>
                    <ServiceTableImage service={service} />
                  </td>
                  <td style={styles.table.td}>
                    <p style={styles.table.text}>{service.name}</p>
                  </td>
                  <td style={styles.table.td}>
                    <p
                      style={{
                        ...styles.table.textSmall,
                        maxWidth: "300px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {service.description || "N/A"}
                    </p>
                  </td>
                  <td style={styles.table.td}>
                    <div>
                      {service.originalPrice != null && service.originalPrice > (service.price || 0) && (
                        <p style={{ ...styles.table.textSmall, color: "#9ca3af", textDecoration: "line-through", marginBottom: 2 }}>
                          ₹{service.originalPrice}
                        </p>
                      )}
                      <p style={{ ...styles.table.text, color: "var(--accent-terracotta)", fontWeight: 600 }}>
                        {service.price ? `₹${service.price}` : "N/A"}
                      </p>
                    </div>
                  </td>
                  <td style={styles.table.td}>
                    <p style={styles.table.text}>{service.duration ? `${service.duration} min` : "N/A"}</p>
                  </td>
                  <td style={styles.table.td}>
                    <p style={styles.table.textSmall}>
                      {service.category?.name || "N/A"}
                    </p>
                  </td>
                  <td style={styles.table.td}>
                    <p style={styles.table.textSmall}>
                      {service.parentService?.name || "—"}
                    </p>
                  </td>
                  <td style={styles.table.td}>
                    <span
                      style={{
                        ...styles.table.status,
                        background: service.isVideoConsultation ? "#dbeafe" : "#f3f4f6",
                        color: service.isVideoConsultation ? "#1d4ed8" : "#6b7280",
                      }}
                    >
                      {service.isVideoConsultation ? "Yes" : "No"}
                    </span>
                  </td>
                  <td style={styles.table.td}>
                    <span
                      style={{
                        ...styles.table.status,
                        background: service.active ? "#dcfce7" : "#fee2e2",
                        color: service.active ? "#166534" : "#991b1b",
                      }}
                    >
                      {service.active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td style={styles.table.td}>
                    <div style={styles.table.actions}>
                      <button
                        onClick={() => handleEdit(service)}
                        style={{
                          ...styles.table.btn,
                          background: "linear-gradient(135deg, var(--accent-terracotta) 0%, var(--accent-coral) 100%)",
                        }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => toggleActive(service._id, service.active)}
                        style={{
                          ...styles.table.btn,
                          background: service.active
                            ? "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)"
                            : "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                        }}
                      >
                        {service.active ? "Deactivate" : "Activate"}
                      </button>
                      <button
                        onClick={() => handleDelete(service._id)}
                        style={{
                          ...styles.table.btn,
                          background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </>
      )}

      {viewMore && (
        <div className={mobile.modalOverlay} onClick={() => setViewMore(null)}>
          <div className={mobile.modal} onClick={(e) => e.stopPropagation()}>
            <div className={mobile.modalHeader}>
              <div className={mobile.modalTitle}>Service Details</div>
              <button type="button" className={mobile.modalClose} onClick={() => setViewMore(null)} aria-label="Close">
                ✕
              </button>
            </div>
            <div className={mobile.modalBody}>
              <div className={mobile.detailRow}>
                <div className={mobile.detailLabel}>Name</div>
                <div className={mobile.detailValue}>{viewMore.name}</div>
              </div>
              <div className={mobile.detailRow}>
                <div className={mobile.detailLabel}>Category</div>
                <div className={mobile.detailValue}>{viewMore.category?.name || "N/A"}</div>
              </div>
              <div className={mobile.detailRow}>
                <div className={mobile.detailLabel}>Description</div>
                <div className={mobile.detailValue}>{viewMore.description || "—"}</div>
              </div>
              <div className={mobile.detailSection}>
                <div className={mobile.detailSectionTitle}>Pricing</div>
                <div style={{ fontSize: 14, lineHeight: 1.7 }}>
                  <div>Original: {viewMore.originalPrice ? `₹${viewMore.originalPrice}` : "—"}</div>
                  <div>Selling: {viewMore.price ? `₹${viewMore.price}` : "—"}</div>
                  <div>Duration: {viewMore.duration ? `${viewMore.duration} min` : "—"}</div>
                </div>
              </div>
              <div className={mobile.detailSection}>
                <div className={mobile.detailSectionTitle}>Other</div>
                <div style={{ fontSize: 14, lineHeight: 1.7 }}>
                  <div>Parent service: {viewMore.parentService?.name || "—"}</div>
                  <div>Video consultation: {viewMore.isVideoConsultation ? "Yes" : "No"}</div>
                  <div>Status: {viewMore.active ? "Active" : "Inactive"}</div>
                </div>
              </div>
              <div className={mobile.modalActions}>
                <button
                  type="button"
                  className={mobile.primaryBtn}
                  onClick={() => {
                    setViewMore(null);
                    handleEdit(viewMore);
                  }}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className={mobile.warnBtn}
                  onClick={() => {
                    toggleActive(viewMore._id, viewMore.active);
                    setViewMore(null);
                  }}
                >
                  {viewMore.active ? "Deactivate" : "Activate"}
                </button>
                <button
                  type="button"
                  className={mobile.dangerBtn}
                  onClick={() => {
                    handleDelete(viewMore._id);
                    setViewMore(null);
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div style={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 style={styles.modalTitle}>{editing ? "Edit Service" : "Add Service"}</h3>
            <form onSubmit={handleSubmit}>
              <input
                type="text"
                placeholder="Service Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                style={styles.inputStyle}
                required
              />
              <textarea
                placeholder="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                style={styles.textareaStyle}
                rows={3}
              />
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value, parentService: "", clinic: "" })}
                style={styles.selectStyle}
                required
              >
                <option value="">Select Category</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.name} ({cat.type})
                  </option>
                ))}
              </select>
              {selectedCategoryType === "dentist" && (
                <select
                  value={formData.clinic}
                  onChange={(e) => setFormData({ ...formData, clinic: e.target.value })}
                  style={styles.selectStyle}
                >
                  <option value="">Select Clinic (Optional)</option>
                  {dentalClinics.map((clinic) => (
                    <option key={clinic._id} value={clinic._id}>
                      {clinic.name} {clinic.city ? `(${clinic.city})` : ""}
                    </option>
                  ))}
                </select>
              )}
              {/* SubCategory removed */}
              <select
                value={formData.parentService}
                onChange={(e) => {
                  const parentSelected = e.target.value;
                  // Don't auto-clear price/duration when parent is selected
                  // Child services CAN be bookable if they are leaf nodes
                  // Price/duration will only be removed if children are added later
                  setFormData({ 
                    ...formData, 
                    parentService: parentSelected
                  });
                }}
                style={styles.selectStyle}
                disabled={!formData.category}
              >
                <option value="">Select Parent Service (Optional - for nested services)</option>
                {services
                  .filter((s) => {
                    // Same category
                    const sameCategory = s.category && 
                      (s.category._id === formData.category || s.category === formData.category);
                    
                    if (!sameCategory) return false;
                    
                    // Not the current service being edited
                    const notSelf = !editing || s._id !== editing._id;
                    if (!notSelf) return false;
                    
                    // Prevent circular reference: can't select a service that has this service as its parent (directly or indirectly)
                    if (editing) {
                      let currentServiceId = editing._id;
                      let checkParent = s.parentService?._id || s.parentService;
                      
                      // Check all ancestors to prevent circular reference
                      while (checkParent) {
                        if (checkParent === currentServiceId) {
                          return false; // Circular reference found
                        }
                        const parentService = services.find(ps => {
                          const psId = typeof ps._id === "string" ? ps._id : ps._id?.toString();
                          return psId === (typeof checkParent === "string" ? checkParent : checkParent?.toString());
                        });
                        if (!parentService || !parentService.parentService) break;
                        checkParent = parentService.parentService?._id || parentService.parentService;
                      }
                      
                      // Also check if current service is already a parent of this service
                      const currentServiceChildren = services.filter(child => {
                        const childParentId = typeof child.parentService === "string" 
                          ? child.parentService 
                          : child.parentService?._id;
                        return childParentId === currentServiceId;
                      });
                      
                      if (currentServiceChildren.some(child => {
                        const childId = typeof child._id === "string" ? child._id : child._id?.toString();
                        const sId = typeof s._id === "string" ? s._id : s._id?.toString();
                        return childId === sId;
                      })) {
                        return false; // Can't select a child as parent
                      }
                    }
                    
                    // Allow all services (grouping or leaf nodes) to be selected as parent
                    // Backend will handle removing price/duration from selected parent
                    return true;
                  })
                  .map((parent) => {
                    // Check if this potential parent has children
                    const hasChildren = services.some(child => {
                      const childParentId = typeof child.parentService === "string" 
                        ? child.parentService 
                        : child.parentService?._id;
                      const parentId = typeof parent._id === "string" ? parent._id : parent._id?.toString();
                      return childParentId === parentId && child._id !== (editing?._id || "");
                    });
                    
                    const isLeafNode = parent.price && parent.duration && !hasChildren;
                    const isGrouping = !parent.price && !parent.duration;
                    const hasChildrenAndPrice = hasChildren && parent.price && parent.duration;
                    
                    let label = parent.name;
                    if (parent.parentService) {
                      label += " (Sub-parent";
                      if (isLeafNode) label += " - leaf node, price/duration will be removed)";
                      else if (hasChildren) label += " - has children)";
                      else label += ")";
                    } else if (isGrouping) {
                      label += " (Parent - grouping service)";
                    } else if (isLeafNode) {
                      label += " (Leaf node - price/duration will be removed when selected as parent)";
                    } else if (hasChildrenAndPrice) {
                      label += " (Has children but also has price - will be fixed)";
                    } else {
                      label += " (Parent)";
                    }
                    
                    return (
                      <option key={parent._id} value={parent._id}>
                        {label}
                      </option>
                    );
                  })}
              </select>
              {(() => {
                // Check if current service (if editing) has children
                const hasChildren = editing ? services.some(s => {
                  const parentId = typeof s.parentService === "string" 
                    ? s.parentService 
                    : s.parentService?._id;
                  return parentId === editing._id;
                }) : false;

                // If service has children, it cannot have price/duration (grouping service)
                if (hasChildren) {
                  return (
                    <div>
                      <div style={{ display: "flex", gap: 10 }}>
                        <input
                          type="number"
                          placeholder="Price (Not allowed - has children)"
                          value=""
                          disabled
                          style={{ ...styles.inputStyle, flex: 1, backgroundColor: "#f3f4f6", cursor: "not-allowed" }}
                        />
                        <input
                          type="number"
                          placeholder="Duration (Not allowed - has children)"
                          value=""
                          disabled
                          style={{ ...styles.inputStyle, flex: 1, backgroundColor: "#f3f4f6", cursor: "not-allowed" }}
                        />
                      </div>
                      <p style={{ fontSize: "12px", color: "#dc2626", marginTop: "4px", fontStyle: "italic" }}>
                        ⚠ This service has children, so it cannot have price and duration. Only leaf services (services without children) can be bookable.
                      </p>
                    </div>
                  );
                }

                // If service has a parent, it CAN have price/duration (if it's a leaf node)
                // But it's not required - can be added later or can be a grouping service
                if (formData.parentService) {
                  return (
                    <div>
                      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                        <input
                          type="number"
                          placeholder="Original Price (optional)"
                          value={formData.originalPrice}
                          onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })}
                          style={{ ...styles.inputStyle, flex: "1 1 120px" }}
                        />
                        <input
                          type="number"
                          placeholder="Discounted Price (selling price)"
                          value={formData.price}
                          onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                          style={{ ...styles.inputStyle, flex: "1 1 120px" }}
                        />
                        <input
                          type="number"
                          placeholder="Duration (minutes)"
                          value={formData.duration}
                          onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                          style={{ ...styles.inputStyle, flex: "1 1 120px" }}
                        />
                      </div>
                      <p style={{ fontSize: "12px", color: "#f59e0b", marginTop: "4px", fontStyle: "italic" }}>
                        ℹ️ Child service: Add price/duration ONLY if this is a leaf node (final level, no children). If you add children later, price/duration will be automatically removed.
                      </p>
                    </div>
                  );
                }

                // No parent - top-level service
                // Can have price/duration (bookable leaf node) OR no price/duration (grouping service)
                return (
                  <div>
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                      <input
                        type="number"
                        placeholder="Original Price (optional)"
                        value={formData.originalPrice}
                        onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })}
                        style={{ ...styles.inputStyle, flex: "1 1 120px" }}
                      />
                      <input
                        type="number"
                        placeholder="Discounted Price (selling price)"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        style={{ ...styles.inputStyle, flex: "1 1 120px" }}
                      />
                      <input
                        type="number"
                        placeholder="Duration (minutes)"
                        value={formData.duration}
                        onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                        style={{ ...styles.inputStyle, flex: "1 1 120px" }}
                      />
                    </div>
                    <p style={{ fontSize: "12px", color: "#059669", marginTop: "4px", fontStyle: "italic" }}>
                      ✓ Top-level service: Add price/duration to make it bookable (leaf node). Leave empty to create a grouping service (you can add children later). If you add children later, price/duration will be automatically removed.
                    </p>
                  </div>
                );
              })()}
              <input
                type="number"
                placeholder="Order (for sorting, optional)"
                value={formData.order}
                onChange={(e) => setFormData({ ...formData, order: e.target.value })}
                style={styles.inputStyle}
              />
              <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", marginBottom: 12 }}>
                <input
                  type="checkbox"
                  checked={formData.isVideoConsultation}
                  onChange={(e) => setFormData({ ...formData, isVideoConsultation: e.target.checked })}
                  style={{ width: 18, height: 18 }}
                />
                <span style={{ fontSize: 14 }}>Video Consultation Service (user selects date/time only, no location required)</span>
              </label>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/*"
                onChange={handleImageSelect}
                disabled={imageCompressing}
                style={styles.inputStyle}
              />
              {imageCompressing && (
                <p style={{ fontSize: 13, color: "#64748b", marginTop: -12, marginBottom: 16 }}>
                  Optimizing image…
                </p>
              )}
              {formData.image && !imageCompressing && (
                <p style={{ fontSize: 13, color: "#64748b", marginTop: -12, marginBottom: 16 }}>
                  Selected: {formData.image.name} ({formatFileSize(formData.image.size)})
                </p>
              )}
              {editing?.image && getServiceImageSrc(editing) && !formData.image && (
                <div style={{ marginBottom: 16 }}>
                  <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 8px" }}>Current image</p>
                  <img
                    src={getServiceImageSrc(editing)}
                    alt={editing.name}
                    style={{ ...styles.table.image, width: 180, height: 80 }}
                  />
                </div>
              )}
              {editing?.image && formData.image && (
                <p style={{ fontSize: 13, color: "#64748b", marginTop: -12, marginBottom: 16 }}>
                  New image will replace the current one
                </p>
              )}
              <div style={styles.modalButtons}>
                <button
                  type="submit"
                  disabled={imageCompressing || saving}
                  style={{
                    ...styles.submitButton,
                    opacity: imageCompressing || saving ? 0.75 : 1,
                    cursor: imageCompressing || saving ? "not-allowed" : "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    minWidth: 120,
                  }}
                >
                  {saving && <span className={mobile.btnSpinner} aria-hidden="true" />}
                  {saving
                    ? editing
                      ? "Updating..."
                      : "Adding..."
                    : editing
                      ? "Update"
                      : "Add"}
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => {
                    if (saving) return;
                    setShowModal(false);
                    setEditing(null);
                    setFormData({ name: "", description: "", price: "", originalPrice: "", duration: "", category: "", parentService: "", clinic: "", order: "", image: null, isVideoConsultation: false });
                  }}
                  style={{
                    ...styles.cancelButton,
                    opacity: saving ? 0.6 : 1,
                    cursor: saving ? "not-allowed" : "pointer",
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function ServiceTableImage({ service }) {
  const src = getServiceImageSrc(service);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (!src || failed) {
    return (
      <div
        style={{
          width: "240px",
          height: "100px",
          borderRadius: "14px",
          background: "linear-gradient(135deg, var(--accent-terracotta) 0%, var(--accent-coral) 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          fontSize: "14px",
          fontWeight: "bold",
          margin: "0 auto",
        }}
      >
        No Image
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={service.name}
      style={styles.table.image}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
    />
  );
}
