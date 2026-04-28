"use client";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import * as styles from "./styles";
import mobile from "./AdminMobileCards.module.css";

export default function CategoryTab() {
  const [categories, setCategories] = useState([]);
  const [salons, setSalons] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [viewMore, setViewMore] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "salon",
    salons: [],
    image: null,
  });

  const fetchCategories = async () => {
    const res = await fetch("/api/category");
    const data = await res.json();
    setCategories(Array.isArray(data) ? data : []);
  };

  const fetchSalons = async () => {
    const res = await fetch("/api/salon");
    const data = await res.json();
    setSalons(Array.isArray(data) ? data : []);
  };

  useEffect(() => {
    fetchCategories();
    fetchSalons();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name) {
      toast.error("Name is required");
      return;
    }

    const data = new FormData();
    data.append("name", formData.name);
    data.append("description", formData.description || "");
    data.append("type", formData.type);
    data.append("salons", JSON.stringify(formData.salons || []));
    if (formData.image) {
      data.append("image", formData.image);
    }

    try {
      if (editing) {
        await fetch(`/api/category/${editing._id}`, {
          method: "PUT",
          body: data,
        });
        toast.success("Category updated");
      } else {
        await fetch("/api/category", {
          method: "POST",
          body: data,
        });
        toast.success("Category added");
      }
      fetchCategories();
      setShowModal(false);
      setEditing(null);
      setFormData({ name: "", description: "", type: "salon", salons: [], image: null });
    } catch (error) {
      toast.error("Error saving category");
    }
  };

  const handleEdit = (cat) => {
    setEditing(cat);
    setFormData({
      name: cat.name,
      description: cat.description || "",
      type: cat.type,
      salons: Array.isArray(cat.salons) ? cat.salons.map((s) => (typeof s === "object" ? s._id : s)) : [],
      image: null,
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this category?")) return;
    await fetch(`/api/category/${id}`, { method: "DELETE" });
    toast.success("Category deleted");
    fetchCategories();
  };

  const toggleActive = async (id, active) => {
    const data = new FormData();
    data.append("active", !active);
    await fetch(`/api/category/${id}`, {
      method: "PUT",
      body: data,
    });
    fetchCategories();
  };

  return (
    <div>
      <div style={styles.pageHeader}>
        <h2 style={styles.pageTitle}>Categories</h2>
        <button
          onClick={() => {
            setEditing(null);
            setFormData({ name: "", description: "", type: "salon", salons: [], image: null });
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
          <span>+</span> Add Category
        </button>
      </div>

      {categories.length === 0 ? (
        <div style={styles.emptyState}>
          <p style={styles.emptyStateText}>No categories yet. Add your first category!</p>
        </div>
      ) : (
        <>
        {/* Mobile cards */}
        <div className={mobile.mobileCards}>
          {categories.map((cat) => {
            const statusBg = cat.active ? "#dcfce7" : "#fee2e2";
            const statusColor = cat.active ? "#166534" : "#991b1b";
            let typeBg = "#fef3c7";
            let typeColor = "#92400e";
            if (cat.type === "dentist") {
              typeBg = "#dbeafe";
              typeColor = "#1e40af";
            } else if (cat.type === "tattoo") {
              typeBg = "#fce7f3";
              typeColor = "#9f1239";
            }
            return (
              <div key={cat._id} className={mobile.card}>
                <div className={mobile.cardHeader}>
                  <div>
                    <div className={mobile.cardTitle}>{cat.name}</div>
                    <div className={mobile.cardMeta}>
                      <span style={{ display: "inline-block", padding: "2px 10px", borderRadius: 999, background: typeBg, color: typeColor, fontWeight: 700, fontSize: 12 }}>
                        {cat.type}
                      </span>
                      {" "}• {new Date(cat.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <span className={mobile.badge} style={{ background: statusBg, color: statusColor }}>
                    {cat.active ? "Active" : "Inactive"}
                  </span>
                </div>
                <div className={mobile.summary}>
                  <strong>Description:</strong> {cat.description || "—"}
                </div>
                <button type="button" className={mobile.viewMoreBtn} onClick={() => setViewMore(cat)}>
                  View More
                </button>
              </div>
            );
          })}
        </div>

        {/* Desktop table */}
        <div className={mobile.hideOnMobile} style={styles.table.wrapper}>
          <table style={styles.table.table}>
            <thead>
              <tr>
                <th style={styles.table.th}>Image</th>
                <th style={styles.table.th}>Name</th>
                <th style={styles.table.th}>Description</th>
                <th style={styles.table.th}>Type</th>
                <th style={styles.table.th}>Status</th>
                <th style={styles.table.th}>Created</th>
                <th style={styles.table.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => (
                <tr key={cat._id}>
                  <td style={styles.table.td}>
                    {cat.image ? (
                      <img src={cat.image} alt={cat.name} style={styles.table.image} />
                    ) : (
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
                    )}
                  </td>
                  <td style={styles.table.td}>
                    <p style={styles.table.text}>{cat.name}</p>
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
                      {cat.description || "N/A"}
                    </p>
                  </td>
                  <td style={styles.table.td}>
                    <span
                      style={{
                        ...styles.table.status,
                        background: cat.type === "salon" ? "#fef3c7" : cat.type === "dentist" ? "#dbeafe" : "#fce7f3",
                        color: cat.type === "salon" ? "#92400e" : cat.type === "dentist" ? "#1e40af" : "#9f1239",
                      }}
                    >
                      {cat.type}
                    </span>
                  </td>
                  <td style={styles.table.td}>
                    <span
                      style={{
                        ...styles.table.status,
                        background: cat.active ? "#dcfce7" : "#fee2e2",
                        color: cat.active ? "#166534" : "#991b1b",
                      }}
                    >
                      {cat.active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td style={styles.table.td}>
                    <p style={styles.table.textSmall}>
                      {new Date(cat.createdAt).toLocaleDateString()}
                    </p>
                  </td>
                  <td style={styles.table.td}>
                    <div style={styles.table.actions}>
                      <button
                        onClick={() => handleEdit(cat)}
                        style={{
                          ...styles.table.btn,
                          background: "linear-gradient(135deg, var(--accent-terracotta) 0%, var(--accent-coral) 100%)",
                        }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => toggleActive(cat._id, cat.active)}
                        style={{
                          ...styles.table.btn,
                          background: cat.active
                            ? "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)"
                            : "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                        }}
                      >
                        {cat.active ? "Deactivate" : "Activate"}
                      </button>
                      <button
                        onClick={() => handleDelete(cat._id)}
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
              <div className={mobile.modalTitle}>Category Details</div>
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
                <div className={mobile.detailLabel}>Type</div>
                <div className={mobile.detailValue}>{viewMore.type}</div>
              </div>
              <div className={mobile.detailRow}>
                <div className={mobile.detailLabel}>Description</div>
                <div className={mobile.detailValue}>{viewMore.description || "—"}</div>
              </div>
              <div className={mobile.detailRow}>
                <div className={mobile.detailLabel}>Created</div>
                <div className={mobile.detailValue}>{new Date(viewMore.createdAt).toLocaleDateString()}</div>
              </div>
              <div className={mobile.detailSection}>
                <div className={mobile.detailSectionTitle}>Status</div>
                <div style={{ fontSize: 14 }}> {viewMore.active ? "Active" : "Inactive"} </div>
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
            <h3 style={styles.modalTitle}>{editing ? "Edit Category" : "Add Category"}</h3>
            <form onSubmit={handleSubmit}>
              <input
                type="text"
                placeholder="Category Name"
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
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                style={styles.selectStyle}
                required
              >
                <option value="salon">Salon</option>
                <option value="dentist">Dentist</option>
                <option value="tattoo">Tattoo</option>
              </select>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", marginBottom: 8, fontWeight: 600, color: "#475569", fontSize: 14 }}>
                  Locations (Salons/Clinics) for this category
                </label>
                <p style={{ fontSize: 12, color: "#64748b", marginBottom: 8 }}>
                  Select which salons offer this category. If none selected, salons matching the type above will be used.
                </p>
                <div style={{ maxHeight: 180, overflowY: "auto", border: "2px solid #e2e8f0", borderRadius: 10, padding: 12 }}>
                  {salons.length === 0 ? (
                    <p style={{ fontSize: 13, color: "#64748b" }}>No salons yet. Add salons in Salons & Clinics first.</p>
                  ) : (
                    salons.map((salon) => (
                      <label key={salon._id} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, cursor: "pointer" }}>
                        <input
                          type="checkbox"
                          checked={(formData.salons || []).includes(salon._id)}
                          onChange={(e) => {
                            const ids = formData.salons || [];
                            const next = e.target.checked
                              ? [...ids, salon._id]
                              : ids.filter((id) => id !== salon._id);
                            setFormData({ ...formData, salons: next });
                          }}
                        />
                        <span style={{ fontSize: 14 }}>{salon.name} {salon.city && `(${salon.city})`}</span>
                      </label>
                    ))
                  )}
                </div>
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setFormData({ ...formData, image: e.target.files[0] })}
                style={styles.inputStyle}
              />
              {editing?.image && (
                <p style={{ fontSize: "13px", color: "#64748b", marginTop: "-12px", marginBottom: "16px" }}>
                  Current image will be replaced
                </p>
              )}
              <div style={styles.modalButtons}>
                <button type="submit" style={styles.submitButton}>
                  {editing ? "Update" : "Add"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditing(null);
                    setFormData({ name: "", description: "", type: "salon", salons: [], image: null });
                  }}
                  style={styles.cancelButton}
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
