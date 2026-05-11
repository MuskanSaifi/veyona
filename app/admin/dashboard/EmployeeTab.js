// app/admin/dashboard/EmployeeTab.js
"use client";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import * as styles from "./styles";
import mobile from "./AdminMobileCards.module.css";

export default function EmployeeTab() {
  const [employees, setEmployees] = useState([]);
  const [salons, setSalons] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [viewMore, setViewMore] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    salon: "",
    categories: [],
    services: [],
    experience: "",
    image: null,
  });
  const [categoryServices, setCategoryServices] = useState([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [listSearch, setListSearch] = useState("");

  const fetchEmployees = async () => {
    const res = await fetch("/api/employee");
    const data = await res.json();
    setEmployees(Array.isArray(data) ? data : []);
  };

  const employeeListMatches = (emp, rawQ) => {
    const q = rawQ.trim().toLowerCase();
    if (!q) return true;
    const name = (emp.name || "").toLowerCase();
    const email = (emp.email || "").toLowerCase();
    const phoneRaw = String(emp.phone || "").toLowerCase();
    const phoneDigits = phoneRaw.replace(/\D/g, "");
    const qDigits = q.replace(/\D/g, "");
    const salon = (emp.salon?.name || "").toLowerCase();
    if (name.includes(q) || email.includes(q) || phoneRaw.includes(q) || salon.includes(q)) return true;
    if (qDigits.length >= 3 && phoneDigits.includes(qDigits)) return true;
    return false;
  };

  const fetchSalons = async () => {
    const res = await fetch("/api/salon");
    const data = await res.json();
    setSalons(data || []);
  };

  const fetchCategories = async () => {
    const res = await fetch("/api/category");
    const data = await res.json();
    setCategories(data || []);
  };

  useEffect(() => {
    fetchEmployees();
    fetchSalons();
    fetchCategories();
  }, []);

  const handleCategoryToggle = (categoryId) => {
    const newCategories = formData.categories.includes(categoryId)
      ? formData.categories.filter((id) => id !== categoryId)
      : [...formData.categories, categoryId];
    setFormData({
      ...formData,
      categories: newCategories,
      services: [],
    });
    fetchServicesForCategories(newCategories);
  };

  const fetchServicesForCategories = async (categoryIds) => {
    if (!categoryIds?.length) {
      setCategoryServices([]);
      setLoadingServices(false);
      return;
    }
    setLoadingServices(true);
    try {
      // Need all services (including children) to correctly compute leaf/bookable services
      const res = await fetch(
        `/api/service?categoryIds=${categoryIds.join(",")}&includeChildren=true`
      );
      const data = await res.json();
      const allServices = data || [];
      const leafServices = allServices.filter((s) => {
        if (!s.price || !s.duration) return false;
        const hasChildren = allServices.some(
          (o) => (o.parentService?._id || o.parentService)?.toString() === s._id?.toString()
        );
        return !hasChildren;
      });
      setCategoryServices(leafServices);
    } catch (err) {
      setCategoryServices([]);
    } finally {
      setLoadingServices(false);
    }
  };

  const handleServiceToggle = (serviceId) => {
    setFormData({
      ...formData,
      services: formData.services.includes(serviceId)
        ? formData.services.filter((id) => id !== serviceId)
        : [...formData.services, serviceId],
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.phone) {
      toast.error("Name, email and phone are required");
      return;
    }

    const data = new FormData();
    data.append("name", formData.name);
    data.append("email", formData.email);
    if (formData.password) {
      data.append("password", formData.password);
    }
    data.append("phone", formData.phone);
    if (formData.salon) {
      data.append("salon", formData.salon);
    } else if (salons[0]?._id) {
      data.append("salon", salons[0]._id);
    }
    data.append("categories", formData.categories.join(","));
    data.append("services", formData.services.join(","));
    if (formData.experience) {
      data.append("experience", formData.experience);
    }
    if (formData.image) {
      data.append("image", formData.image);
    }

    try {
      if (editing) {
        await fetch(`/api/employee/${editing._id}`, {
          method: "PUT",
          body: data,
        });
        toast.success("Employee updated");
      } else {
        await fetch("/api/employee", {
          method: "POST",
          body: data,
        });
        toast.success("Employee added");
      }
      fetchEmployees();
      setShowModal(false);
      setEditing(null);
      setFormData({
        name: "",
        email: "",
        password: "",
        phone: "",
        salon: salons[0]?._id || "",
        categories: [],
        services: [],
        experience: "",
        image: null,
      });
    } catch (error) {
      toast.error("Error saving employee");
    }
  };

  const handleEdit = (employee) => {
    setEditing(employee);
    const catIds = employee.categories?.map((c) => c._id || c) || [];
    setFormData({
      name: employee.name,
      email: employee.email,
      password: "",
      phone: employee.phone,
      salon: employee.salon?._id || employee.salon || salons[0]?._id || "",
      categories: catIds,
      services: employee.services?.map((s) => s._id || s) || [],
      experience: employee.experience?.toString() || "",
      image: null,
    });
    setShowModal(true);
    fetchServicesForCategories(catIds);
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this employee?")) return;
    await fetch(`/api/employee/${id}`, { method: "DELETE" });
    toast.success("Employee deleted");
    fetchEmployees();
  };

  const toggleActive = async (id, active) => {
    const data = new FormData();
    data.append("active", !active);
    await fetch(`/api/employee/${id}`, {
      method: "PUT",
      body: data,
    });
    fetchEmployees();
  };

  const safeEmployees = Array.isArray(employees) ? employees : [];
  const filteredEmployees = safeEmployees.filter((e) => employeeListMatches(e, listSearch));

  return (
    <div>
      <div style={styles.pageHeader}>
        <h2 style={styles.pageTitle}>Employees</h2>
        <button
          onClick={() => {
            setEditing(null);
            setFormData({
              name: "",
              email: "",
              password: "",
              phone: "",
              salon: salons[0]?._id || "",
              categories: [],
              services: [],
              experience: "",
              image: null,
            });
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
          <span>+</span> Add Employee
        </button>
      </div>

      {safeEmployees.length > 0 && (
        <div style={{ marginBottom: 16, maxWidth: 420 }}>
          <label htmlFor="employee-list-search" style={{ display: "block", fontWeight: 600, marginBottom: 6, color: "#374151", fontSize: 14 }}>
            Search employees
          </label>
          <input
            id="employee-list-search"
            type="search"
            value={listSearch}
            onChange={(e) => setListSearch(e.target.value)}
            placeholder="Name, email, phone or salon…"
            style={{
              width: "100%",
              padding: "10px 14px",
              borderRadius: 10,
              border: "1px solid #e5e7eb",
              fontSize: 15,
              boxSizing: "border-box",
            }}
          />
        </div>
      )}

      {safeEmployees.length === 0 ? (
        <div style={styles.emptyState}>
          <p style={styles.emptyStateText}>No employees yet. Add your first employee!</p>
        </div>
      ) : filteredEmployees.length === 0 ? (
        <div style={styles.emptyState}>
          <p style={styles.emptyStateText}>No employees match your search.</p>
        </div>
      ) : (
        <>
        {/* Mobile cards */}
        <div className={mobile.mobileCards}>
          {filteredEmployees.map((employee) => {
            const statusBg = employee.active ? "#dcfce7" : "#fee2e2";
            const statusColor = employee.active ? "#166534" : "#991b1b";
            const salonName = employee.salon?.name || "N/A";
            const spec = employee.services?.length > 0
              ? `${employee.services.length} service${employee.services.length > 1 ? "s" : ""}`
              : "N/A";
            return (
              <div key={employee._id} className={mobile.card}>
                <div className={mobile.cardHeader}>
                  <div>
                    <div className={mobile.cardTitle}>{employee.name}</div>
                    <div className={mobile.cardMeta}>
                      {salonName} • {spec}
                    </div>
                  </div>
                  <span className={mobile.badge} style={{ background: statusBg, color: statusColor }}>
                    {employee.active ? "Active" : "Inactive"}
                  </span>
                </div>
                <div className={mobile.summary}>
                  <strong>Phone:</strong> {employee.phone}
                  <br />
                  <strong>Email:</strong> {employee.email}
                  {employee.experience ? (
                    <>
                      <br />
                      <strong>Experience:</strong> {employee.experience} years
                    </>
                  ) : null}
                </div>
                <button type="button" className={mobile.viewMoreBtn} onClick={() => setViewMore(employee)}>
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
                <th style={styles.table.th}>Email</th>
                <th style={styles.table.th}>Phone</th>
                <th style={styles.table.th}>Salon</th>
                <th style={styles.table.th}>Specialization</th>
                <th style={styles.table.th}>Status</th>
                <th style={styles.table.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.map((employee) => (
                <tr key={employee._id}>
                  <td style={styles.table.td}>
                    {employee.image ? (
                      <img src={employee.image} alt={employee.name} style={styles.table.avatar} />
                    ) : (
                      <div
                        style={{
                          width: "50px",
                          height: "50px",
                          borderRadius: "50%",
                          background: "linear-gradient(135deg, var(--accent-terracotta) 0%, var(--accent-coral) 100%)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "white",
                          fontSize: "20px",
                          fontWeight: "bold",
                          margin: "0 auto",
                        }}
                      >
                        {employee.name?.charAt(0)?.toUpperCase() || "?"}
                      </div>
                    )}
                  </td>
                  <td style={styles.table.td}>
                    <p style={styles.table.text}>{employee.name}</p>
                    {employee.experience && (
                      <p style={styles.table.textSmall}>{employee.experience} years exp.</p>
                    )}
                  </td>
                  <td style={styles.table.td}>
                    <p style={styles.table.textSmall}>{employee.email}</p>
                  </td>
                  <td style={styles.table.td}>
                    <p style={styles.table.text}>{employee.phone}</p>
                  </td>
                  <td style={styles.table.td}>
                    <p style={styles.table.textSmall}>{employee.salon?.name || "N/A"}</p>
                  </td>
                  <td style={styles.table.td}>
                    {employee.services?.length > 0 ? (
                      <p style={styles.table.textSmall}>
                        {employee.services.length} service{employee.services.length > 1 ? "s" : ""} (specialization)
                      </p>
                    ) : (
                      <p style={styles.table.textSmall}>N/A</p>
                    )}
                  </td>
                  <td style={styles.table.td}>
                    <span
                      style={{
                        ...styles.table.status,
                        background: employee.active ? "#dcfce7" : "#fee2e2",
                        color: employee.active ? "#166534" : "#991b1b",
                      }}
                    >
                      {employee.active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td style={styles.table.td}>
                    <div style={styles.table.actions}>
                      <button
                        onClick={() => handleEdit(employee)}
                        style={{
                          ...styles.table.btn,
                          background: "linear-gradient(135deg, var(--accent-terracotta) 0%, var(--accent-coral) 100%)",
                        }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => toggleActive(employee._id, employee.active)}
                        style={{
                          ...styles.table.btn,
                          background: employee.active
                            ? "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)"
                            : "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                        }}
                      >
                        {employee.active ? "Deactivate" : "Activate"}
                      </button>
                      <button
                        onClick={() => handleDelete(employee._id)}
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
              <div className={mobile.modalTitle}>Employee Details</div>
              <button type="button" className={mobile.modalClose} onClick={() => setViewMore(null)} aria-label="Close">
                ✕
              </button>
            </div>
            <div className={mobile.modalBody}>
              <div className={mobile.detailRow}>
                <div className={mobile.detailLabel}>Name</div>
                <div className={mobile.detailValue}>{viewMore.name}</div>
              </div>
              <div className={mobile.detailSection}>
                <div className={mobile.detailSectionTitle}>Contact</div>
                <div style={{ fontSize: 14, lineHeight: 1.7 }}>
                  <div>Phone: {viewMore.phone}</div>
                  <div>Email: {viewMore.email}</div>
                </div>
              </div>
              <div className={mobile.detailSection}>
                <div className={mobile.detailSectionTitle}>Work</div>
                <div style={{ fontSize: 14, lineHeight: 1.7 }}>
                  <div>Salon: {viewMore.salon?.name || "N/A"}</div>
                  <div>Experience: {viewMore.experience ? `${viewMore.experience} years` : "—"}</div>
                  <div>
                    Specialization: {viewMore.services?.length > 0
                      ? `${viewMore.services.length} service${viewMore.services.length > 1 ? "s" : ""}`
                      : "—"}
                  </div>
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
            <h3 style={styles.modalTitle}>{editing ? "Edit Employee" : "Add Employee"}</h3>
            <form onSubmit={handleSubmit} style={{ maxHeight: "70vh", overflowY: "auto" }}>
              <input
                type="text"
                placeholder="Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                style={styles.inputStyle}
                required
              />
              <input
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                style={styles.inputStyle}
                required
              />
              <input
                type="password"
                placeholder={editing ? "New password (leave blank to keep current)" : "Password"}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                style={styles.inputStyle}
                required={!editing}
                minLength={editing ? undefined : 6}
              />
              <input
                type="tel"
                placeholder="Phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                style={styles.inputStyle}
                required
              />
              {/* Salon/Clinic is now assigned automatically for home services, so we hide the field */}
              <div>
                <label style={{ display: "block", marginBottom: 10, fontWeight: 500 }}>Categories (Select multiple):</label>
                <div style={{ maxHeight: 200, overflowY: "auto", border: "1px solid #ddd", borderRadius: 6, padding: 10 }}>
                  {categories.map((category) => (
                    <label key={category._id} style={{ display: "flex", alignItems: "center", marginBottom: 8, cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={formData.categories.includes(category._id)}
                        onChange={() => handleCategoryToggle(category._id)}
                        style={{ marginRight: 8 }}
                      />
                      <span>{category.name} ({category.type})</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label style={{ display: "block", marginBottom: 10, fontWeight: 500 }}>
                  Specialization
                  <span style={{ fontSize: 12, color: "#6b7280", marginLeft: 4 }}>
                    (Keep all unchecked to mark expert in all services of selected categories)
                  </span>
                </label>
                <div
                  style={{
                    maxHeight: 200,
                    overflowY: "auto",
                    border: "1px solid #ddd",
                    borderRadius: 6,
                    padding: 10,
                    opacity: formData.categories.length ? 1 : 0.6,
                    pointerEvents: formData.categories.length ? "auto" : "none",
                  }}
                >
                  {formData.categories.length === 0 ? (
                    <p style={{ color: "#6b7280", fontSize: 14 }}>Select categories first to see services (optional)</p>
                  ) : loadingServices ? (
                    <p style={{ color: "#6b7280", fontSize: 14 }}>Loading services...</p>
                  ) : categoryServices.length === 0 ? (
                    <p style={{ color: "#6b7280", fontSize: 14 }}>No bookable services in selected categories</p>
                  ) : (
                    categoryServices.map((service) => (
                      <label key={service._id} style={{ display: "flex", alignItems: "center", marginBottom: 8, cursor: "pointer" }}>
                        <input
                          type="checkbox"
                          checked={formData.services.includes(service._id)}
                          onChange={() => handleServiceToggle(service._id)}
                          style={{ marginRight: 8 }}
                        />
                        <span>{service.name} {service.price && `(₹${service.price})`}</span>
                      </label>
                    ))
                  )}
                </div>
              </div>
              <input
                type="number"
                placeholder="Experience (years, Optional)"
                value={formData.experience}
                onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                style={styles.inputStyle}
              />
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setFormData({ ...formData, image: e.target.files[0] })}
                style={styles.inputStyle}
              />
              {editing?.image && <p style={{ fontSize: 12, color: "#666" }}>Current image will be replaced</p>}
              <div style={styles.modalButtons}>
                <button type="submit" style={styles.submitButton}>
                  {editing ? "Update" : "Add"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditing(null);
                    setFormData({
                      name: "",
                      email: "",
                      password: "",
                      phone: "",
                      salon: "",
                      categories: [],
                      services: [],
                      experience: "",
                      image: null,
                    });
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
