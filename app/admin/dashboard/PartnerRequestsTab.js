"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import * as styles from "./styles";
import mobile from "./AdminMobileCards.module.css";

export default function PartnerRequestsTab() {
  const [requests, setRequests] = useState([]);
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState(null);

  const fetchRequests = async () => {
    try {
      const res = await fetch("/api/partners");
      const data = await res.json();
      setRequests(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Failed to load partner requests");
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const updateStatus = async (id, status) => {
    try {
      await fetch(`/api/partners/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      toast.success("Status updated");
      fetchRequests();
      if (selected && selected._id === id) {
        setSelected({ ...selected, status });
      }
    } catch {
      toast.error("Failed to update status");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this partner request?")) return;
    try {
      await fetch(`/api/partners/${id}`, { method: "DELETE" });
      toast.success("Request deleted");
      fetchRequests();
      if (selected && selected._id === id) {
        setSelected(null);
      }
    } catch {
      toast.error("Failed to delete request");
    }
  };

  const filtered =
    filter === "all"
      ? requests
      : requests.filter((r) => r.status === filter);

  const getStatusBadge = (status) => {
    switch (status) {
      case "new":
        return { bg: "#dbeafe", color: "#1d4ed8", label: "New" };
      case "in-review":
        return { bg: "#fef3c7", color: "#92400e", label: "In Review" };
      case "approved":
        return { bg: "#dcfce7", color: "#166534", label: "Approved" };
      case "rejected":
        return { bg: "#fee2e2", color: "#b91c1c", label: "Rejected" };
      default:
        return { bg: "#e5e7eb", color: "#4b5563", label: status };
    }
  };

  const newCount = requests.filter((r) => r.status === "new").length;

  return (
    <div>
      <div style={styles.pageHeader}>
        <div>
          <h2 style={styles.pageTitle}>Partner With Us Requests</h2>
          {newCount > 0 && (
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
              {newCount} New
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
          <option value="all">All Requests</option>
          <option value="new">New</option>
          <option value="in-review">In Review</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div style={styles.emptyState}>
          <p style={styles.emptyStateText}>
            {filter === "all"
              ? "No partner requests yet."
              : `No ${filter} partner requests found.`}
          </p>
        </div>
      ) : (
        <>
        {/* Mobile cards */}
        <div className={mobile.mobileCards}>
          {filtered.map((req) => {
            const badge = getStatusBadge(req.status);
            return (
              <div key={req._id} className={mobile.card}>
                <div className={mobile.cardHeader}>
                  <div>
                    <div className={mobile.cardTitle}>{req.businessName}</div>
                    <div className={mobile.cardMeta}>
                      {req.businessType || "—"} • {req.location || "—"}
                    </div>
                  </div>
                  <span className={mobile.badge} style={{ background: badge.bg, color: badge.color }}>
                    {badge.label}
                  </span>
                </div>
                <div className={mobile.summary}>
                  <strong>Contact:</strong> {req.contactName || "—"}
                  <br />
                  <strong>Email:</strong> {req.email || "—"}
                  <br />
                  <strong>Date:</strong> {new Date(req.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </div>
                <button type="button" className={mobile.viewMoreBtn} onClick={() => setSelected(req)}>
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
                <th style={styles.table.th}>Business</th>
                <th style={styles.table.th}>Contact</th>
                <th style={styles.table.th}>Type</th>
                <th style={styles.table.th}>Location</th>
                <th style={styles.table.th}>Date</th>
                <th style={styles.table.th}>Status</th>
                <th style={styles.table.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((req) => {
                const badge = getStatusBadge(req.status);
                return (
                  <tr
                    key={req._id}
                    onClick={() => setSelected(req)}
                    style={{
                      cursor: "pointer",
                      backgroundColor:
                        selected?._id === req._id ? "#f8fafc" : "white",
                    }}
                    onMouseEnter={(e) => {
                      if (selected?._id !== req._id) {
                        e.currentTarget.style.backgroundColor = "#f1f5f9";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selected?._id !== req._id) {
                        e.currentTarget.style.backgroundColor = "white";
                      }
                    }}
                  >
                    <td style={styles.table.td}>
                      <p style={styles.table.text}>{req.businessName}</p>
                    </td>
                    <td style={styles.table.td}>
                      <p style={styles.table.textSmall}>{req.contactName}</p>
                      <p
                        style={{
                          ...styles.table.textSmall,
                          color: "#6b7280",
                        }}
                      >
                        {req.email}
                      </p>
                    </td>
                    <td style={styles.table.td}>
                      <p style={styles.table.textSmall}>
                        {req.businessType || "—"}
                      </p>
                    </td>
                    <td style={styles.table.td}>
                      <p style={styles.table.textSmall}>
                        {req.location || "—"}
                      </p>
                    </td>
                    <td style={styles.table.td}>
                      <p style={styles.table.textSmall}>
                        {new Date(req.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                      <p
                        style={{
                          ...styles.table.textSmall,
                          fontSize: "11px",
                          color: "#94a3b8",
                        }}
                      >
                        {new Date(req.createdAt).toLocaleTimeString("en-IN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </td>
                    <td style={styles.table.td}>
                      <span
                        style={{
                          ...styles.table.status,
                          background: badge.bg,
                          color: badge.color,
                        }}
                      >
                        {badge.label}
                      </span>
                    </td>
                    <td
                      style={styles.table.td}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div style={styles.table.actions}>
                        <select
                          value={req.status}
                          onChange={(e) =>
                            updateStatus(req._id, e.target.value)
                          }
                          style={{
                            ...styles.table.btn,
                            background: "white",
                            color: "#1f2937",
                            border: "2px solid #e2e8f0",
                            padding: "8px 12px",
                            minWidth: "130px",
                            fontSize: "13px",
                            cursor: "pointer",
                          }}
                        >
                          <option value="new">New</option>
                          <option value="in-review">In Review</option>
                          <option value="approved">Approved</option>
                          <option value="rejected">Rejected</option>
                        </select>
                        <button
                          onClick={() => handleDelete(req._id)}
                          style={{
                            ...styles.table.btn,
                            background:
                              "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
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
      {selected && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: 20,
          }}
          onClick={() => setSelected(null)}
        >
          <div
            style={{
              background: "white",
              borderRadius: 16,
              padding: 32,
              maxWidth: 640,
              width: "100%",
              maxHeight: "90vh",
              overflow: "auto",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 24,
              }}
            >
              <h3
                style={{
                  fontSize: 24,
                  fontWeight: 700,
                  color: "#111827",
                }}
              >
                Partner Details
              </h3>
              <button
                onClick={() => setSelected(null)}
                style={{
                  background: "#f3f4f6",
                  border: "none",
                  borderRadius: 8,
                  width: 32,
                  height: 32,
                  cursor: "pointer",
                  fontSize: 20,
                  color: "#6b7280",
                }}
              >
                ×
              </button>
            </div>

            <div style={{ display: "grid", gap: 18 }}>
              <DetailField label="Business / Brand Name">
                {selected.businessName}
              </DetailField>
              <DetailField label="Contact Person">
                {selected.contactName}
              </DetailField>
              <DetailField label="Email">
                <a
                  href={`mailto:${selected.email}`}
                  style={{
                    color: "var(--accent-terracotta)",
                    textDecoration: "none",
                  }}
                >
                  {selected.email}
                </a>
              </DetailField>
              {selected.phone && (
                <DetailField label="Phone / WhatsApp">
                  <a
                    href={`tel:${selected.phone}`}
                    style={{
                      color: "var(--accent-terracotta)",
                      textDecoration: "none",
                    }}
                  >
                    {selected.phone}
                  </a>
                </DetailField>
              )}
              {selected.businessType && (
                <DetailField label="Business Type">
                  {selected.businessType}
                </DetailField>
              )}
              {selected.location && (
                <DetailField label="City / Location">
                  {selected.location}
                </DetailField>
              )}
              {selected.source && (
                <DetailField label="How they heard about Veyona">
                  {selected.source}
                </DetailField>
              )}
              <DetailField label="Partnership Idea / Details">
                <span
                  style={{
                    whiteSpace: "pre-wrap",
                    lineHeight: 1.6,
                  }}
                >
                  {selected.message}
                </span>
              </DetailField>
              <DetailField label="Submitted On">
                {new Date(selected.createdAt).toLocaleString("en-IN", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </DetailField>
            </div>

            <div
              style={{
                marginTop: 24,
                display: "flex",
                justifyContent: "flex-end",
                gap: 12,
              }}
            >
              <select
                value={selected.status}
                onChange={(e) => {
                  updateStatus(selected._id, e.target.value);
                  setSelected({ ...selected, status: e.target.value });
                }}
                style={{
                  padding: "10px 16px",
                  border: "2px solid #e2e8f0",
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 500,
                  background: "white",
                  cursor: "pointer",
                }}
              >
                <option value="new">New</option>
                <option value="in-review">In Review</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
              <button
                onClick={() => handleDelete(selected._id)}
                style={{
                  padding: "10px 20px",
                  background:
                    "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                  color: "white",
                  border: "none",
                  borderRadius: 8,
                  fontSize: 14,
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

function DetailField({ label, children }) {
  return (
    <div>
      <div
        style={{
          fontSize: 12,
          fontWeight: 600,
          color: "#6b7280",
          textTransform: "uppercase",
          letterSpacing: "0.04em",
        }}
      >
        {label}
      </div>
      <div
        style={{
          marginTop: 4,
          fontSize: 15,
          color: "#111827",
        }}
      >
        {children}
      </div>
    </div>
  );
}

