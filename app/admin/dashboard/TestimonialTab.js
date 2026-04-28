"use client";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import * as styles from "./styles";
import mobile from "./AdminMobileCards.module.css";

export default function TestimonialTab() {
  const [testimonials, setTestimonials] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [services, setServices] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [viewMore, setViewMore] = useState(null);

  const [form, setForm] = useState({
    customerName: "",
    customerImage: null,
    rating: 5,
    review: "",
    service: "",
    employee: "",
    active: true,
  });

  /* ---------------- FETCH DATA ---------------- */
  const fetchTestimonials = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/testimonial?all=true");
      if (res.ok) {
    const data = await res.json();
        setTestimonials(data);
      }
    } catch (error) {
      toast.error("Failed to fetch testimonials");
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await fetch("/api/employee");
      if (res.ok) {
        const data = await res.json();
        setEmployees(data);
      }
    } catch (error) {
      console.error("Error fetching employees:", error);
    }
  };

  const fetchServices = async () => {
    try {
      const res = await fetch("/api/service");
      if (res.ok) {
        const data = await res.json();
        setServices(data);
      }
    } catch (error) {
      console.error("Error fetching services:", error);
    }
  };

  useEffect(() => {
    fetchTestimonials();
    fetchEmployees();
    fetchServices();
  }, []);

  /* ---------------- RESET FORM ---------------- */
  const reset = () => {
    setForm({
      customerName: "",
      customerImage: null,
      rating: 5,
      review: "",
      service: "",
      employee: "",
      active: true,
    });
    setImagePreview(null);
    setEditing(null);
  };

  /* ---------------- IMAGE HANDLING ---------------- */
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setForm({ ...form, customerImage: file });
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  /* ---------------- SAVE TESTIMONIAL ---------------- */
  const saveTestimonial = async (e) => {
    e.preventDefault();

    if (!form.customerName || !form.review) {
      toast.error("Customer name and review are required");
      return;
    }

    if (form.rating < 1 || form.rating > 5) {
      toast.error("Rating must be between 1 and 5");
      return;
    }

    try {
      setLoading(true);
      const fd = new FormData();
      fd.append("customerName", form.customerName);
      fd.append("rating", form.rating.toString());
      fd.append("review", form.review);
      fd.append("service", form.service || "");
      fd.append("employee", form.employee || "");
      fd.append("active", form.active.toString());

      if (form.customerImage instanceof File) {
        fd.append("customerImage", form.customerImage);
      }

      const res = await fetch(
        editing ? `/api/testimonial/${editing._id}` : "/api/testimonial",
        { method: editing ? "PUT" : "POST", body: fd }
      );

      if (!res.ok) {
        const error = await res.json();
        toast.error(error.message || "Save failed");
        return;
      }

      toast.success(editing ? "Testimonial updated successfully" : "Testimonial created successfully");
      fetchTestimonials();
      setOpen(false);
      reset();
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- DELETE TESTIMONIAL ---------------- */
  const deleteTestimonial = async (id) => {
    if (!confirm("Are you sure you want to delete this testimonial permanently?")) return;

    try {
      const res = await fetch(`/api/testimonial/${id}`, { method: "DELETE" });
      if (!res.ok) {
        toast.error("Delete failed");
        return;
      }

      toast.success("Testimonial deleted successfully");
      fetchTestimonials();
    } catch (error) {
      toast.error("Delete failed");
    }
  };

  /* ---------------- EDIT TESTIMONIAL ---------------- */
  const editTestimonial = (testimonial) => {
    setEditing(testimonial);
    setForm({
      customerName: testimonial.customerName || "",
      customerImage: null,
      rating: testimonial.rating || 5,
      review: testimonial.review || "",
      service: testimonial.service || "",
      employee: testimonial.employee?._id || testimonial.employee || "",
      active: testimonial.active !== undefined ? testimonial.active : true,
    });
    setImagePreview(testimonial.customerImage || null);
    setOpen(true);
  };

  return (
    <div>
      <div style={styles.pageHeader}>
        <h2 style={styles.pageTitle}>Testimonials</h2>
        <button
          onClick={() => {
            reset();
            setOpen(true);
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
          <span>+</span> Add Testimonial
        </button>
          </div>

      {loading && testimonials.length === 0 ? (
        <div style={styles.emptyState}>
          <p style={styles.emptyStateText}>Loading testimonials...</p>
          </div>
      ) : testimonials.length === 0 ? (
        <div style={styles.emptyState}>
          <p style={styles.emptyStateText}>No testimonials yet. Add your first testimonial!</p>
        </div>
      ) : (
        <>
        {/* Mobile cards */}
        <div className={mobile.mobileCards}>
          {testimonials.map((t) => (
            <div key={t._id} className={mobile.card}>
              <div className={mobile.cardHeader}>
                <div>
                  <div className={mobile.cardTitle}>{t.customerName || "Customer"}</div>
                  <div className={mobile.cardMeta}>
                    Rating: {t.rating || 0}/5 • {t.active ? "Active" : "Inactive"}
                  </div>
                </div>
                <span className={mobile.badge} style={{ background: t.active ? "#dcfce7" : "#fee2e2", color: t.active ? "#166534" : "#991b1b" }}>
                  {t.active ? "Active" : "Inactive"}
                </span>
              </div>
              <div className={mobile.summary}>
                <strong>Review:</strong> {t.review ? (t.review.length > 90 ? `${t.review.slice(0, 90)}…` : t.review) : "—"}
              </div>
              <button type="button" className={mobile.viewMoreBtn} onClick={() => setViewMore(t)}>
                View More
              </button>
            </div>
          ))}
        </div>

        {/* Desktop table */}
        <div className={mobile.hideOnMobile} style={styles.table.wrapper}>
          <table style={styles.table.table}>
            <thead>
              <tr>
                <th style={styles.table.th}>Image</th>
                <th style={styles.table.th}>Customer</th>
                <th style={styles.table.th}>Rating</th>
                <th style={styles.table.th}>Review</th>
                <th style={styles.table.th}>Service/Employee</th>
                <th style={styles.table.th}>Status</th>
                <th style={styles.table.th}>Created</th>
                <th style={styles.table.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {testimonials.map((t) => (
                <tr key={t._id}>
                  <td style={styles.table.td}>
                    {t.customerImage ? (
                      <img
                        src={t.customerImage}
                  alt={t.customerName}
                        style={styles.table.avatar}
                      />
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
                        {t.customerName?.charAt(0)?.toUpperCase() || "?"}
                      </div>
                    )}
                  </td>
                  <td style={styles.table.td}>
                    <p style={styles.table.text}>{t.customerName}</p>
                  </td>
                  <td style={styles.table.td}>
                    <div style={{ display: "flex", gap: "2px", justifyContent: "center", alignItems: "center", flexWrap: "wrap" }}>
                    {[...Array(5)].map((_, i) => (
                      <span
                        key={i}
                          style={{
                            color: i < t.rating ? "#fbbf24" : "#e5e7eb",
                            fontSize: "16px",
                          }}
                      >
                        ★
                      </span>
                    ))}
                      <span style={{ marginLeft: "6px", color: "#64748b", fontSize: "12px" }}>
                        ({t.rating}/5)
                      </span>
                    </div>
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
                      {t.review}
                    </p>
                  </td>
                  <td style={styles.table.td}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px", alignItems: "center" }}>
                      {t.service && (
                        <span
                          style={{
                            ...styles.table.status,
                            background: "#fef3c7",
                            color: "#92400e",
                            fontSize: "11px",
                            padding: "4px 8px",
                            minWidth: "auto",
                          }}
                        >
                          {t.service}
                        </span>
                      )}
                      {t.employee && (
                        <span
                          style={{
                            ...styles.table.status,
                            background: "#dbeafe",
                            color: "#1e40af",
                            fontSize: "11px",
                            padding: "4px 8px",
                            minWidth: "auto",
                          }}
                        >
                          {t.employee?.name || "Employee"}
                        </span>
                      )}
                      {!t.service && !t.employee && (
                        <span style={styles.table.textSmall}>N/A</span>
                      )}
                    </div>
                  </td>
                  <td style={styles.table.td}>
                    <span
                      style={{
                        ...styles.table.status,
                        background: t.active ? "#dcfce7" : "#fee2e2",
                        color: t.active ? "#166534" : "#991b1b",
                      }}
                    >
                      {t.active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td style={styles.table.td}>
                    <p style={styles.table.textSmall}>
                      {new Date(t.createdAt).toLocaleDateString()}
                    </p>
                  </td>
                  <td style={styles.table.td}>
                    <div style={styles.table.actions}>
                      <button
                        onClick={() => editTestimonial(t)}
                        style={{
                          ...styles.table.btn,
                          background: "linear-gradient(135deg, var(--accent-terracotta) 0%, var(--accent-coral) 100%)",
                        }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteTestimonial(t._id)}
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
              <div className={mobile.modalTitle}>Testimonial Details</div>
              <button type="button" className={mobile.modalClose} onClick={() => setViewMore(null)} aria-label="Close">✕</button>
            </div>
            <div className={mobile.modalBody}>
              <div className={mobile.detailRow}>
                <div className={mobile.detailLabel}>Customer</div>
                <div className={mobile.detailValue}>{viewMore.customerName || "—"}</div>
              </div>
              <div className={mobile.detailRow}>
                <div className={mobile.detailLabel}>Rating</div>
                <div className={mobile.detailValue}>{viewMore.rating || 0} / 5</div>
              </div>
              <div className={mobile.detailSection}>
                <div className={mobile.detailSectionTitle}>Review</div>
                <div style={{ fontSize: 14, lineHeight: 1.7 }}>{viewMore.review || "—"}</div>
              </div>
              <div className={mobile.detailRow}>
                <div className={mobile.detailLabel}>Status</div>
                <div className={mobile.detailValue}>{viewMore.active ? "Active" : "Inactive"}</div>
              </div>
              <div className={mobile.modalActions}>
                <button type="button" className={mobile.primaryBtn} onClick={() => { setViewMore(null); editTestimonial(viewMore); }}>
                  Edit
                </button>
                <button type="button" className={mobile.dangerBtn} onClick={() => { deleteTestimonial(viewMore._id); setViewMore(null); }}>
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL */}
      {open && (
        <div style={styles.modalOverlay} onClick={() => setOpen(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2 style={styles.modalTitle}>
              {editing ? "Edit Testimonial" : "Add New Testimonial"}
            </h2>

            <form onSubmit={saveTestimonial}>
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: 500 }}>
                  Customer Name *
                </label>
                <input
                  type="text"
                  value={form.customerName}
                  onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                  style={styles.inputStyle}
                  required
                  placeholder="Enter customer name"
                />
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: 500 }}>
                  Customer Image
                </label>
                {imagePreview && (
                  <img
                    src={imagePreview}
                    alt="Preview"
                    style={{
                      width: "100px",
                      height: "100px",
                      borderRadius: "50%",
                      objectFit: "cover",
                      marginBottom: "12px",
                      border: "2px solid #e2e8f0",
                    }}
                  />
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  style={styles.inputStyle}
                />
                  </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: 500 }}>
                  Rating * (1-5)
                </label>
                <select
                  value={form.rating}
                  onChange={(e) => setForm({ ...form, rating: parseInt(e.target.value) })}
                  style={styles.selectStyle}
                  required
                >
                  <option value={1}>1 Star</option>
                  <option value={2}>2 Stars</option>
                  <option value={3}>3 Stars</option>
                  <option value={4}>4 Stars</option>
                  <option value={5}>5 Stars</option>
                </select>
                </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: 500 }}>
                  Review *
                </label>
                <textarea
                  value={form.review}
                  onChange={(e) => setForm({ ...form, review: e.target.value })}
                  style={styles.textareaStyle}
                  required
                  placeholder="Enter customer review"
                  rows={4}
                />
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: 500 }}>
                  Service (Optional)
                </label>
                <input
                  type="text"
                  value={form.service}
                  onChange={(e) => setForm({ ...form, service: e.target.value })}
                  style={styles.inputStyle}
                  placeholder="Enter service name"
                />
            </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: 500 }}>
                  Employee (Optional)
                </label>
                <select
                  value={form.employee}
                  onChange={(e) => setForm({ ...form, employee: e.target.value })}
                  style={styles.selectStyle}
                >
                  <option value="">Select Employee</option>
                  {employees.map((emp) => (
                    <option key={emp._id} value={emp._id}>
                      {emp.name}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={form.active}
                    onChange={(e) => setForm({ ...form, active: e.target.checked })}
                    style={{ width: "18px", height: "18px", cursor: "pointer" }}
                  />
                  <span>Active (Show on frontend)</span>
                </label>
              </div>

              <div style={styles.modalButtons}>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    reset();
                  }}
                  style={styles.cancelButton}
                >
                  Cancel
                </button>
                <button type="submit" style={styles.submitButton} disabled={loading}>
                  {loading ? "Saving..." : editing ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
  );
}
