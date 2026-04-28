"use client";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import * as styles from "./styles";
import mobile from "./AdminMobileCards.module.css";

export default function ContactEnquiryTab() {
  const [enquiries, setEnquiries] = useState([]);
  const [filter, setFilter] = useState("all");
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);

  const fetchEnquiries = async () => {
    const res = await fetch("/api/contact-enquiry");
    const data = await res.json();
    setEnquiries(data);
  };

  useEffect(() => {
    fetchEnquiries();
  }, []);

  const updateStatus = async (id, status) => {
    await fetch(`/api/contact-enquiry/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    toast.success("Status updated");
    fetchEnquiries();
    if (selectedEnquiry && selectedEnquiry._id === id) {
      setSelectedEnquiry({ ...selectedEnquiry, status });
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this contact enquiry?")) return;
    await fetch(`/api/contact-enquiry/${id}`, { method: "DELETE" });
    toast.success("Contact enquiry deleted");
    fetchEnquiries();
    if (selectedEnquiry && selectedEnquiry._id === id) {
      setSelectedEnquiry(null);
    }
  };

  const filteredEnquiries = filter === "all" 
    ? enquiries 
    : enquiries.filter((enq) => enq.status === filter);

  const getStatusColor = (status) => {
    switch (status) {
      case "new":
        return { bg: "#dbeafe", color: "#1e40af" };
      case "read":
        return { bg: "#fef3c7", color: "#92400e" };
      case "replied":
        return { bg: "#d1fae5", color: "#166534" };
      case "resolved":
        return { bg: "#e5e7eb", color: "#6b7280" };
      default:
        return { bg: "#f3f4f6", color: "#6b7280" };
    }
  };

  const unreadCount = enquiries.filter((enq) => enq.status === "new").length;

  return (
    <div>
      <div style={styles.pageHeader}>
        <div>
          <h2 style={styles.pageTitle}>Contact Enquiries</h2>
          {unreadCount > 0 && (
            <span
              style={{
                background: "#ef4444",
                color: "white",
                borderRadius: "12px",
                padding: "4px 12px",
                fontSize: "14px",
                fontWeight: 600,
                marginLeft: "12px",
              }}
            >
              {unreadCount} New
            </span>
          )}
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{
            padding: "12px 20px",
            border: "2px solid #e2e8f0",
            borderRadius: "10px",
            fontSize: "15px",
            fontWeight: 500,
            background: "white",
            cursor: "pointer",
          }}
        >
          <option value="all">All Enquiries</option>
          <option value="new">New</option>
          <option value="read">Read</option>
          <option value="replied">Replied</option>
          <option value="resolved">Resolved</option>
        </select>
      </div>

      {filteredEnquiries.length === 0 ? (
        <div style={styles.emptyState}>
          <p style={styles.emptyStateText}>
            {filter === "all" ? "No contact enquiries yet." : `No ${filter} enquiries found.`}
          </p>
        </div>
      ) : (
        <>
        {/* Mobile cards */}
        <div className={mobile.mobileCards}>
          {filteredEnquiries.map((enq) => {
            const statusColors = getStatusColor(enq.status);
            return (
              <div key={enq._id} className={mobile.card}>
                <div className={mobile.cardHeader}>
                  <div>
                    <div className={mobile.cardTitle}>{enq.name}</div>
                    <div className={mobile.cardMeta}>
                      {new Date(enq.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} • {new Date(enq.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                  <span className={mobile.badge} style={{ background: statusColors.bg, color: statusColors.color }}>
                    {enq.status}
                  </span>
                </div>
                <div className={mobile.summary}>
                  <strong>Subject:</strong> {enq.subject || "—"}
                  <br />
                  <strong>Phone:</strong> {enq.phone || "—"}
                </div>
                <button type="button" className={mobile.viewMoreBtn} onClick={() => setSelectedEnquiry(enq)}>
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
                <th style={styles.table.th}>Name</th>
                <th style={styles.table.th}>Email</th>
                <th style={styles.table.th}>Phone</th>
                <th style={styles.table.th}>Subject</th>
                <th style={styles.table.th}>Date</th>
                <th style={styles.table.th}>Status</th>
                <th style={styles.table.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEnquiries.map((enq) => {
                const statusColors = getStatusColor(enq.status);
                return (
                  <tr 
                    key={enq._id}
                    onClick={() => setSelectedEnquiry(enq)}
                    style={{
                      cursor: "pointer",
                      backgroundColor: selectedEnquiry?._id === enq._id ? "#f8fafc" : "white",
                    }}
                    onMouseEnter={(e) => {
                      if (selectedEnquiry?._id !== enq._id) {
                        e.currentTarget.style.backgroundColor = "#f1f5f9";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedEnquiry?._id !== enq._id) {
                        e.currentTarget.style.backgroundColor = "white";
                      }
                    }}
                  >
                    <td style={styles.table.td}>
                      <p style={styles.table.text}>{enq.name}</p>
                    </td>
                    <td style={styles.table.td}>
                      <p style={styles.table.textSmall}>{enq.email}</p>
                    </td>
                    <td style={styles.table.td}>
                      <p style={styles.table.textSmall}>{enq.phone || "N/A"}</p>
                    </td>
                    <td style={styles.table.td}>
                      <p 
                        style={{
                          ...styles.table.textSmall,
                          maxWidth: "200px",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                        title={enq.subject}
                      >
                        {enq.subject}
                      </p>
                    </td>
                    <td style={styles.table.td}>
                      <p style={styles.table.textSmall}>
                        {new Date(enq.createdAt).toLocaleDateString('en-IN', { 
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </p>
                      <p style={{ ...styles.table.textSmall, fontSize: "11px", color: "#94a3b8" }}>
                        {new Date(enq.createdAt).toLocaleTimeString('en-IN', { 
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </td>
                    <td style={styles.table.td}>
                      <span
                        style={{
                          ...styles.table.status,
                          background: statusColors.bg,
                          color: statusColors.color,
                        }}
                      >
                        {enq.status}
                      </span>
                    </td>
                    <td style={styles.table.td} onClick={(e) => e.stopPropagation()}>
                      <div style={styles.table.actions}>
                        <select
                          value={enq.status}
                          onChange={(e) => updateStatus(enq._id, e.target.value)}
                          style={{
                            ...styles.table.btn,
                            background: "white",
                            color: "#1f2937",
                            border: "2px solid #e2e8f0",
                            padding: "8px 12px",
                            minWidth: "120px",
                            fontSize: "13px",
                            cursor: "pointer",
                          }}
                        >
                          <option value="new">New</option>
                          <option value="read">Read</option>
                          <option value="replied">Replied</option>
                          <option value="resolved">Resolved</option>
                        </select>
                        <button
                          onClick={() => handleDelete(enq._id)}
                          style={{
                            ...styles.table.btn,
                            background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                            minWidth: "80px",
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        </>
      )}

      {/* Detail Modal */}
      {selectedEnquiry && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "20px",
          }}
          onClick={() => setSelectedEnquiry(null)}
        >
          <div
            style={{
              background: "white",
              borderRadius: "16px",
              padding: "32px",
              maxWidth: "600px",
              width: "100%",
              maxHeight: "90vh",
              overflow: "auto",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
              <h3 style={{ fontSize: "24px", fontWeight: 700, color: "#1f2937" }}>
                Contact Enquiry Details
              </h3>
              <button
                onClick={() => setSelectedEnquiry(null)}
                style={{
                  background: "#f3f4f6",
                  border: "none",
                  borderRadius: "8px",
                  width: "32px",
                  height: "32px",
                  cursor: "pointer",
                  fontSize: "20px",
                  color: "#6b7280",
                }}
              >
                ×
              </button>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={{ fontSize: "12px", fontWeight: 600, color: "#6b7280", textTransform: "uppercase" }}>
                Name
              </label>
              <p style={{ fontSize: "16px", color: "#1f2937", marginTop: "4px" }}>
                {selectedEnquiry.name}
              </p>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={{ fontSize: "12px", fontWeight: 600, color: "#6b7280", textTransform: "uppercase" }}>
                Email
              </label>
              <p style={{ fontSize: "16px", color: "#1f2937", marginTop: "4px" }}>
                <a href={`mailto:${selectedEnquiry.email}`} style={{ color: "var(--accent-terracotta)", textDecoration: "none" }}>
                  {selectedEnquiry.email}
                </a>
              </p>
            </div>

            {selectedEnquiry.phone && (
              <div style={{ marginBottom: "20px" }}>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "#6b7280", textTransform: "uppercase" }}>
                  Phone
                </label>
                <p style={{ fontSize: "16px", color: "#1f2937", marginTop: "4px" }}>
                  <a href={`tel:${selectedEnquiry.phone}`} style={{ color: "var(--accent-terracotta)", textDecoration: "none" }}>
                    {selectedEnquiry.phone}
                  </a>
                </p>
              </div>
            )}

            <div style={{ marginBottom: "20px" }}>
              <label style={{ fontSize: "12px", fontWeight: 600, color: "#6b7280", textTransform: "uppercase" }}>
                Subject
              </label>
              <p style={{ fontSize: "16px", color: "#1f2937", marginTop: "4px", fontWeight: 600 }}>
                {selectedEnquiry.subject}
              </p>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={{ fontSize: "12px", fontWeight: 600, color: "#6b7280", textTransform: "uppercase" }}>
                Message
              </label>
              <p style={{ 
                fontSize: "15px", 
                color: "#374151", 
                marginTop: "8px",
                lineHeight: "1.6",
                whiteSpace: "pre-wrap",
              }}>
                {selectedEnquiry.message}
              </p>
            </div>

            <div style={{ marginBottom: "24px" }}>
              <label style={{ fontSize: "12px", fontWeight: 600, color: "#6b7280", textTransform: "uppercase" }}>
                Submitted On
              </label>
              <p style={{ fontSize: "14px", color: "#6b7280", marginTop: "4px" }}>
                {new Date(selectedEnquiry.createdAt).toLocaleString('en-IN', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>

            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
              <select
                value={selectedEnquiry.status}
                onChange={(e) => {
                  updateStatus(selectedEnquiry._id, e.target.value);
                  setSelectedEnquiry({ ...selectedEnquiry, status: e.target.value });
                }}
                style={{
                  padding: "10px 16px",
                  border: "2px solid #e2e8f0",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: 500,
                  background: "white",
                  cursor: "pointer",
                }}
              >
                <option value="new">New</option>
                <option value="read">Read</option>
                <option value="replied">Replied</option>
                <option value="resolved">Resolved</option>
              </select>
              <button
                onClick={() => handleDelete(selectedEnquiry._id)}
                style={{
                  padding: "10px 20px",
                  background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
