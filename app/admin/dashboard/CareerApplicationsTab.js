"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import * as styles from "./styles";
import mobile from "./AdminMobileCards.module.css";

export default function CareerApplicationsTab() {
  const [applications, setApplications] = useState([]);
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState(null);

  const fetchApplications = async () => {
    try {
      const res = await fetch("/api/careers");
      const data = await res.json();
      setApplications(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Failed to load applications");
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const updateStatus = async (id, status) => {
    try {
      await fetch(`/api/careers/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      toast.success("Status updated");
      fetchApplications();
      if (selected && selected._id === id) {
        setSelected({ ...selected, status });
      }
    } catch {
      toast.error("Failed to update status");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this application?")) return;
    try {
      await fetch(`/api/careers/${id}`, { method: "DELETE" });
      toast.success("Application deleted");
      fetchApplications();
      if (selected && selected._id === id) {
        setSelected(null);
      }
    } catch {
      toast.error("Failed to delete application");
    }
  };

  const filtered =
    filter === "all"
      ? applications
      : applications.filter((app) => app.status === filter);

  const getStatusBadge = (status) => {
    switch (status) {
      case "new":
        return { bg: "#dbeafe", color: "#1d4ed8", label: "New" };
      case "in-review":
        return { bg: "#fef3c7", color: "#92400e", label: "In Review" };
      case "shortlisted":
        return { bg: "#dcfce7", color: "#166534", label: "Shortlisted" };
      case "rejected":
        return { bg: "#fee2e2", color: "#b91c1c", label: "Rejected" };
      case "hired":
        return { bg: "#e0f2fe", color: "#0369a1", label: "Hired" };
      default:
        return { bg: "#e5e7eb", color: "#4b5563", label: status };
    }
  };

  const newCount = applications.filter((a) => a.status === "new").length;

  return (
    <div>
      <div style={styles.pageHeader}>
        <div>
          <h2 style={styles.pageTitle}>Career Applications</h2>
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
          <option value="all">All Applications</option>
          <option value="new">New</option>
          <option value="in-review">In Review</option>
          <option value="shortlisted">Shortlisted</option>
          <option value="rejected">Rejected</option>
          <option value="hired">Hired</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div style={styles.emptyState}>
          <p style={styles.emptyStateText}>
            {filter === "all"
              ? "No applications yet."
              : `No ${filter} applications found.`}
          </p>
        </div>
      ) : (
        <>
        {/* Mobile cards */}
        <div className={mobile.mobileCards}>
          {filtered.map((app) => {
            const badge = getStatusBadge(app.status);
            return (
              <div key={app._id} className={mobile.card}>
                <div className={mobile.cardHeader}>
                  <div>
                    <div className={mobile.cardTitle}>{app.fullName}</div>
                    <div className={mobile.cardMeta}>
                      {app.role || "—"} • {app.preferredLocation || "—"}
                    </div>
                  </div>
                  <span className={mobile.badge} style={{ background: badge.bg, color: badge.color }}>
                    {badge.label}
                  </span>
                </div>
                <div className={mobile.summary}>
                  <strong>Email:</strong> {app.email || "—"}
                  <br />
                  <strong>Experience:</strong> {app.experience || "—"}
                  <br />
                  <strong>Date:</strong> {new Date(app.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </div>
                <button type="button" className={mobile.viewMoreBtn} onClick={() => setSelected(app)}>
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
                <th style={styles.table.th}>Role</th>
                <th style={styles.table.th}>Experience</th>
                <th style={styles.table.th}>Location</th>
                <th style={styles.table.th}>Date</th>
                <th style={styles.table.th}>Status</th>
                <th style={styles.table.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((app) => {
                const badge = getStatusBadge(app.status);
                return (
                  <tr
                    key={app._id}
                    onClick={() => setSelected(app)}
                    style={{
                      cursor: "pointer",
                      backgroundColor:
                        selected?._id === app._id ? "#f8fafc" : "white",
                    }}
                    onMouseEnter={(e) => {
                      if (selected?._id !== app._id) {
                        e.currentTarget.style.backgroundColor = "#f1f5f9";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selected?._id !== app._id) {
                        e.currentTarget.style.backgroundColor = "white";
                      }
                    }}
                  >
                    <td style={styles.table.td}>
                      <p style={styles.table.text}>{app.fullName}</p>
                      <p
                        style={{
                          ...styles.table.textSmall,
                          color: "#6b7280",
                        }}
                      >
                        {app.email}
                      </p>
                    </td>
                    <td style={styles.table.td}>
                      <p style={styles.table.textSmall}>{app.role}</p>
                    </td>
                    <td style={styles.table.td}>
                      <p style={styles.table.textSmall}>
                        {app.experience || "—"}
                      </p>
                    </td>
                    <td style={styles.table.td}>
                      <p style={styles.table.textSmall}>
                        {app.preferredLocation || "—"}
                      </p>
                    </td>
                    <td style={styles.table.td}>
                      <p style={styles.table.textSmall}>
                        {new Date(app.createdAt).toLocaleDateString("en-IN", {
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
                        {new Date(app.createdAt).toLocaleTimeString("en-IN", {
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
                          value={app.status}
                          onChange={(e) =>
                            updateStatus(app._id, e.target.value)
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
                          <option value="shortlisted">Shortlisted</option>
                          <option value="rejected">Rejected</option>
                          <option value="hired">Hired</option>
                        </select>
                        <button
                          onClick={() => handleDelete(app._id)}
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
                Candidate Details
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
              <DetailField label="Full Name">
                {selected.fullName}
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
                <DetailField label="Phone">
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
              <DetailField label="Role Applied For">
                {selected.role}
              </DetailField>
              {selected.experience && (
                <DetailField label="Experience">
                  {selected.experience}
                </DetailField>
              )}
              {selected.preferredLocation && (
                <DetailField label="Preferred Location">
                  {selected.preferredLocation}
                </DetailField>
              )}
              {selected.source && (
                <DetailField label="How they heard about Veyona">
                  {selected.source}
                </DetailField>
              )}
              {selected.message && (
                <DetailField label="Note / Portfolio Links">
                  <span
                    style={{
                      whiteSpace: "pre-wrap",
                      lineHeight: 1.6,
                    }}
                  >
                    {selected.message}
                  </span>
                </DetailField>
              )}
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
                <option value="shortlisted">Shortlisted</option>
                <option value="rejected">Rejected</option>
                <option value="hired">Hired</option>
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

