"use client";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import * as styles from "./styles";
import mobile from "./AdminMobileCards.module.css";

export default function FeaturedProfessionalTab() {
  const [professionals, setProfessionals] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [viewMore, setViewMore] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    title: "",
    description: "",
    employee: "",
    order: 0,
    image: null,
  });

  const fetchProfessionals = async () => {
    const res = await fetch("/api/featured-professional");
    const data = await res.json();
    setProfessionals(data);
  };

  const fetchEmployees = async () => {
    const res = await fetch("/api/employee");
    const data = await res.json();
    setEmployees(data);
  };

  useEffect(() => {
    fetchProfessionals();
    fetchEmployees();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.title || !formData.description) {
      toast.error("Name, title, and description are required");
      return;
    }

    const data = new FormData();
    data.append("name", formData.name);
    data.append("title", formData.title);
    data.append("description", formData.description);
    data.append("employee", formData.employee || "");
    data.append("order", formData.order.toString());
    if (formData.image) {
      data.append("image", formData.image);
    }

    try {
      if (editing) {
        await fetch(`/api/featured-professional/${editing._id}`, {
          method: "PUT",
          body: data,
        });
        toast.success("Featured Professional updated");
      } else {
        await fetch("/api/featured-professional", {
          method: "POST",
          body: data,
        });
        toast.success("Featured Professional added");
      }
      fetchProfessionals();
      setShowModal(false);
      setEditing(null);
      setFormData({
        name: "",
        title: "",
        description: "",
        employee: "",
        order: 0,
        image: null,
      });
    } catch (error) {
      toast.error("Error saving professional");
    }
  };

  const handleEdit = (prof) => {
    setEditing(prof);
    setFormData({
      name: prof.name,
      title: prof.title,
      description: prof.description,
      employee: prof.employee?._id || prof.employee || "",
      order: prof.order || 0,
      image: null,
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this featured professional?")) return;
    await fetch(`/api/featured-professional/${id}`, { method: "DELETE" });
    toast.success("Professional deleted");
    fetchProfessionals();
  };

  const toggleActive = async (id, active) => {
    const data = new FormData();
    data.append("active", !active);
    await fetch(`/api/featured-professional/${id}`, {
      method: "PUT",
      body: data,
    });
    fetchProfessionals();
  };

  return (
    <div>
      <div style={styles.pageHeader}>
        <h2 style={styles.pageTitle}>Featured Professionals</h2>
        <button
          onClick={() => {
            setEditing(null);
            setFormData({
              name: "",
              title: "",
              description: "",
              employee: "",
              order: 0,
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
          <span>+</span> Add Featured Professional
        </button>
      </div>

      {professionals.length === 0 ? (
        <div style={styles.emptyState}>
          <p style={styles.emptyStateText}>No featured professionals yet. Add your first one!</p>
        </div>
      ) : (
        <>
        {/* Mobile cards */}
        <div className={mobile.mobileCards}>
          {professionals.map((prof) => {
            const statusBg = prof.active ? "#dcfce7" : "#fee2e2";
            const statusColor = prof.active ? "#166534" : "#991b1b";
            return (
              <div key={prof._id} className={mobile.card}>
                <div className={mobile.cardHeader}>
                  <div>
                    <div className={mobile.cardTitle}>{prof.name}</div>
                    <div className={mobile.cardMeta}>
                      {prof.title} • Order: {prof.order ?? 0}
                    </div>
                  </div>
                  <span className={mobile.badge} style={{ background: statusBg, color: statusColor }}>
                    {prof.active ? "Active" : "Inactive"}
                  </span>
                </div>
                <div className={mobile.summary}>
                  <strong>Employee:</strong> {prof.employee?.name || "N/A"}
                  <br />
                  <strong>Description:</strong> {prof.description ? (prof.description.length > 90 ? `${prof.description.slice(0, 90)}…` : prof.description) : "—"}
                </div>
                <button type="button" className={mobile.viewMoreBtn} onClick={() => setViewMore(prof)}>
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
                <th style={styles.table.th}>Title</th>
                <th style={styles.table.th}>Description</th>
                <th style={styles.table.th}>Employee</th>
                <th style={styles.table.th}>Order</th>
                <th style={styles.table.th}>Status</th>
                <th style={styles.table.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {professionals.map((prof) => (
                <tr key={prof._id}>
                  <td style={styles.table.td}>
                    {prof.image ? (
                      <img src={prof.image} alt={prof.name} style={styles.table.image} />
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
                    <p style={styles.table.text}>{prof.name}</p>
                  </td>
                  <td style={styles.table.td}>
                    <p style={{ ...styles.table.text, color: "#dc2626", fontWeight: 500 }}>
                      {prof.title}
                    </p>
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
                      {prof.description}
                    </p>
                  </td>
                  <td style={styles.table.td}>
                    <p style={styles.table.textSmall}>{prof.employee?.name || "N/A"}</p>
                  </td>
                  <td style={styles.table.td}>
                    <span
                      style={{
                        ...styles.table.status,
                        background: "#e0e7ff",
                        color: "#1e40af",
                        fontSize: "12px",
                        padding: "6px 12px",
                      }}
                    >
                      {prof.order || 0}
                    </span>
                  </td>
                  <td style={styles.table.td}>
                    <span
                      style={{
                        ...styles.table.status,
                        background: prof.active ? "#dcfce7" : "#fee2e2",
                        color: prof.active ? "#166534" : "#991b1b",
                      }}
                    >
                      {prof.active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td style={styles.table.td}>
                    <div style={styles.table.actions}>
                      <button
                        onClick={() => handleEdit(prof)}
                        style={{
                          ...styles.table.btn,
                          background: "linear-gradient(135deg, var(--accent-terracotta) 0%, var(--accent-coral) 100%)",
                        }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => toggleActive(prof._id, prof.active)}
                        style={{
                          ...styles.table.btn,
                          background: prof.active
                            ? "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)"
                            : "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                        }}
                      >
                        {prof.active ? "Deactivate" : "Activate"}
                      </button>
                      <button
                        onClick={() => handleDelete(prof._id)}
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
              <div className={mobile.modalTitle}>Featured Professional Details</div>
              <button type="button" className={mobile.modalClose} onClick={() => setViewMore(null)} aria-label="Close">✕</button>
            </div>
            <div className={mobile.modalBody}>
              <div className={mobile.detailRow}>
                <div className={mobile.detailLabel}>Name</div>
                <div className={mobile.detailValue}>{viewMore.name}</div>
              </div>
              <div className={mobile.detailRow}>
                <div className={mobile.detailLabel}>Title</div>
                <div className={mobile.detailValue}>{viewMore.title}</div>
              </div>
              <div className={mobile.detailRow}>
                <div className={mobile.detailLabel}>Description</div>
                <div className={mobile.detailValue}>{viewMore.description || "—"}</div>
              </div>
              <div className={mobile.detailSection}>
                <div className={mobile.detailSectionTitle}>Other</div>
                <div style={{ fontSize: 14, lineHeight: 1.8 }}>
                  <div>Employee: {viewMore.employee?.name || "N/A"}</div>
                  <div>Order: {viewMore.order ?? 0}</div>
                  <div>Status: {viewMore.active ? "Active" : "Inactive"}</div>
                </div>
              </div>
              <div className={mobile.modalActions}>
                <button type="button" className={mobile.primaryBtn} onClick={() => { setViewMore(null); handleEdit(viewMore); }}>
                  Edit
                </button>
                <button type="button" className={mobile.warnBtn} onClick={() => { toggleActive(viewMore._id, viewMore.active); setViewMore(null); }}>
                  {viewMore.active ? "Deactivate" : "Activate"}
                </button>
                <button type="button" className={mobile.dangerBtn} onClick={() => { handleDelete(viewMore._id); setViewMore(null); }}>
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
            <h3 style={styles.modalTitle}>
              {editing ? "Edit Featured Professional" : "Add Featured Professional"}
            </h3>
            <form onSubmit={handleSubmit}>
              <input
                type="text"
                placeholder="Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                style={styles.inputStyle}
                required
              />
              <input
                type="text"
                placeholder="Title (e.g., On Her Facial at Home Experience)"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                style={styles.inputStyle}
                required
              />
              <textarea
                placeholder="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                style={styles.textareaStyle}
                rows={4}
                required
              />
              <select
                value={formData.employee}
                onChange={(e) => setFormData({ ...formData, employee: e.target.value })}
                style={styles.selectStyle}
              >
                <option value="">Select Employee (Optional)</option>
                {employees.map((emp) => (
                  <option key={emp._id} value={emp._id}>
                    {emp.name}
                  </option>
                ))}
              </select>
              <input
                type="number"
                placeholder="Order (for sorting)"
                value={formData.order}
                onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                style={styles.inputStyle}
              />
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
                    setFormData({
                      name: "",
                      title: "",
                      description: "",
                      employee: "",
                      order: 0,
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
