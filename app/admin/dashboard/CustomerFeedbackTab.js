"use client";
import { useEffect, useMemo, useState } from "react";
import { FaStar } from "react-icons/fa";
import * as styles from "./styles";
import mobile from "./AdminMobileCards.module.css";

/**
 * Customer Feedback admin tab.
 *
 * Reads from /api/admin/service-tracking/feedbacks (admin-only).
 * Lets the admin filter by star rating and search by customer / employee
 * name or phone, see aggregate stats, and view full feedback details.
 */
export default function CustomerFeedbackTab() {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ratingFilter, setRatingFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/service-tracking/feedbacks", {
        cache: "no-store",
      });
      const data = await res.json().catch(() => []);
      setFeedbacks(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return feedbacks.filter((f) => {
      if (ratingFilter !== "all" && Number(f.rating) !== Number(ratingFilter)) {
        return false;
      }
      if (!q) return true;
      const v = f.serviceVisit || {};
      const haystack = [
        v.customer?.name,
        v.customer?.phone,
        v.employee?.name,
        v.employee?.phone,
        v.serviceLabel,
        f.comment,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [feedbacks, ratingFilter, search]);

  const stats = useMemo(() => {
    const total = feedbacks.length;
    const sum = feedbacks.reduce((acc, f) => acc + (Number(f.rating) || 0), 0);
    const avg = total > 0 ? (sum / total).toFixed(2) : "—";
    const fiveStar = feedbacks.filter((f) => Number(f.rating) === 5).length;
    const lowStar = feedbacks.filter((f) => Number(f.rating) <= 2).length;
    return { total, avg, fiveStar, lowStar };
  }, [feedbacks]);

  return (
    <div>
      <div style={styles.pageHeader}>
        <div>
          <h2 style={styles.pageTitle}>Customer Feedback</h2>
          <p style={{ color: "#64748b", margin: "6px 0 0", fontSize: 14 }}>
            All ratings and comments submitted by customers after a completed service.
          </p>
        </div>
      </div>

      {/* Stat cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 16,
          marginBottom: 24,
        }}
      >
        <StatCard label="Total feedbacks" value={stats.total} />
        <StatCard label="Average rating" value={stats.avg} accent="#f59e0b" />
        <StatCard label="5-star" value={stats.fiveStar} accent="#10b981" />
        <StatCard label="≤ 2 stars" value={stats.lowStar} accent="#ef4444" />
      </div>

      {/* Filters */}
      <div
        style={{
          display: "flex",
          gap: 12,
          flexWrap: "wrap",
          marginBottom: 20,
          alignItems: "center",
        }}
      >
        <input
          type="text"
          placeholder="Search by customer, employee, service…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            flex: "1 1 280px",
            padding: "12px 16px",
            border: "2px solid #e2e8f0",
            borderRadius: 10,
            fontSize: 14,
            background: "white",
          }}
        />
        <select
          value={ratingFilter}
          onChange={(e) => setRatingFilter(e.target.value)}
          style={{
            padding: "12px 20px",
            border: "2px solid #e2e8f0",
            borderRadius: 10,
            fontSize: 14,
            fontWeight: 500,
            background: "white",
            cursor: "pointer",
          }}
        >
          <option value="all">All ratings</option>
          <option value="5">5 stars</option>
          <option value="4">4 stars</option>
          <option value="3">3 stars</option>
          <option value="2">2 stars</option>
          <option value="1">1 star</option>
        </select>
      </div>

      {loading ? (
        <div style={styles.emptyState}>
          <p style={styles.emptyStateText}>Loading feedback…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div style={styles.emptyState}>
          <p style={styles.emptyStateText}>
            {feedbacks.length === 0
              ? "No customer feedback yet."
              : "No feedback matches the current filters."}
          </p>
        </div>
      ) : (
        <>
          {/* Mobile cards */}
          <div className={mobile.mobileCards}>
            {filtered.map((f) => {
              const v = f.serviceVisit || {};
              return (
                <div key={f._id} className={mobile.card}>
                  <div className={mobile.cardHeader}>
                    <div>
                      <div className={mobile.cardTitle}>
                        {v.customer?.name || "—"}
                      </div>
                      <div className={mobile.cardMeta}>
                        {formatDateTime(f.createdAt)}
                      </div>
                    </div>
                    <RatingStars rating={f.rating} />
                  </div>
                  <div className={mobile.summary}>
                    <strong>Employee:</strong> {v.employee?.name || "—"}
                    <br />
                    <strong>Service:</strong> {v.serviceLabel || "—"}
                    {f.comment ? (
                      <>
                        <br />
                        <strong>Comment:</strong>{" "}
                        <span style={{ fontStyle: "italic" }}>
                          “{truncate(f.comment, 90)}”
                        </span>
                      </>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    className={mobile.viewMoreBtn}
                    onClick={() => setSelected(f)}
                  >
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
                  <th style={styles.table.th}>Rating</th>
                  <th style={styles.table.th}>Customer</th>
                  <th style={styles.table.th}>Employee</th>
                  <th style={styles.table.th}>Service</th>
                  <th style={styles.table.th}>Comment</th>
                  <th style={styles.table.th}>Submitted</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((f) => {
                  const v = f.serviceVisit || {};
                  return (
                    <tr
                      key={f._id}
                      onClick={() => setSelected(f)}
                      style={{
                        cursor: "pointer",
                        backgroundColor:
                          selected?._id === f._id ? "#f8fafc" : "white",
                      }}
                      onMouseEnter={(e) => {
                        if (selected?._id !== f._id) {
                          e.currentTarget.style.backgroundColor = "#f1f5f9";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selected?._id !== f._id) {
                          e.currentTarget.style.backgroundColor = "white";
                        }
                      }}
                    >
                      <td style={styles.table.td}>
                        <RatingStars rating={f.rating} />
                      </td>
                      <td style={styles.table.td}>
                        <p style={styles.table.text}>
                          {v.customer?.name || "—"}
                        </p>
                        <p style={styles.table.textSmall}>
                          {v.customer?.phone || ""}
                        </p>
                      </td>
                      <td style={styles.table.td}>
                        <p style={styles.table.text}>
                          {v.employee?.name || "—"}
                        </p>
                        <p style={styles.table.textSmall}>
                          {v.employee?.phone || ""}
                        </p>
                      </td>
                      <td style={styles.table.td}>
                        <p style={styles.table.textSmall}>
                          {v.serviceLabel || "—"}
                        </p>
                      </td>
                      <td style={styles.table.td}>
                        <p
                          style={{
                            ...styles.table.textSmall,
                            maxWidth: 280,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            fontStyle: f.comment ? "italic" : "normal",
                          }}
                          title={f.comment}
                        >
                          {f.comment ? `“${f.comment}”` : "—"}
                        </p>
                      </td>
                      <td style={styles.table.td}>
                        <p style={styles.table.textSmall}>
                          {formatDateTime(f.createdAt)}
                        </p>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {selected && (
        <FeedbackDetailModal
          feedback={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}

function StatCard({ label, value, accent = "#1e293b" }) {
  return (
    <div
      style={{
        background: "white",
        border: "1px solid #e2e8f0",
        borderRadius: 16,
        padding: 20,
        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          color: "#64748b",
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 28, fontWeight: 700, color: accent, marginTop: 6 }}>
        {value}
      </div>
    </div>
  );
}

function RatingStars({ rating }) {
  const r = Number(rating) || 0;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 2 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <FaStar
          key={n}
          style={{
            color: n <= r ? "#f59e0b" : "#e2e8f0",
            fontSize: 14,
          }}
        />
      ))}
      <span
        style={{
          fontSize: 12,
          color: "#64748b",
          marginLeft: 6,
          fontWeight: 600,
        }}
      >
        {r}/5
      </span>
    </span>
  );
}

function FeedbackDetailModal({ feedback, onClose }) {
  const v = feedback.serviceVisit || {};
  return (
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
      onClick={onClose}
    >
      <div
        style={{
          background: "white",
          borderRadius: 16,
          padding: 32,
          maxWidth: 600,
          width: "100%",
          maxHeight: "90vh",
          overflow: "auto",
          boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)",
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
          <h3 style={{ fontSize: 22, fontWeight: 700, color: "#1f2937" }}>
            Feedback details
          </h3>
          <button
            onClick={onClose}
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

        <Field label="Rating">
          <RatingStars rating={feedback.rating} />
        </Field>

        <Field label="Customer">
          {v.customer?.name || "—"}
          {v.customer?.phone ? (
            <span style={{ color: "#64748b", marginLeft: 8, fontSize: 14 }}>
              ({v.customer.phone})
            </span>
          ) : null}
        </Field>

        <Field label="Employee">
          {v.employee?.name || "—"}
          {v.employee?.phone ? (
            <span style={{ color: "#64748b", marginLeft: 8, fontSize: 14 }}>
              ({v.employee.phone})
            </span>
          ) : null}
        </Field>

        <Field label="Service">{v.serviceLabel || "—"}</Field>

        <Field label="Duration">
          {formatDuration(v.durationMinutes)}
        </Field>

        <Field label="Service window">
          {formatDateTime(v.startTime)}{" "}
          <span style={{ color: "#94a3b8" }}>→</span>{" "}
          {formatDateTime(v.endTime)}
        </Field>

        <Field label="Customer comment">
          {feedback.comment ? (
            <span
              style={{
                fontStyle: "italic",
                color: "#374151",
                whiteSpace: "pre-wrap",
                lineHeight: 1.6,
              }}
            >
              “{feedback.comment}”
            </span>
          ) : (
            <span style={{ color: "#94a3b8" }}>No comment provided.</span>
          )}
        </Field>

        <Field label="Submitted">{formatDateTime(feedback.createdAt)}</Field>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: "#64748b",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 15, color: "#1f2937", marginTop: 4 }}>
        {children}
      </div>
    </div>
  );
}

function truncate(str, n) {
  if (!str) return "";
  return str.length > n ? `${str.slice(0, n)}…` : str;
}

function formatDateTime(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

function formatDuration(minutes) {
  if (minutes == null || minutes === "") return "—";
  const m = Number(minutes);
  if (!Number.isFinite(m)) return "—";
  const h = Math.floor(m / 60);
  const rest = m % 60;
  if (h <= 0) return `${rest} min`;
  return `${h}h ${rest}m`;
}
