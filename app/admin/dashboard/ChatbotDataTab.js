"use client";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import * as styles from "./styles";
import mobile from "./AdminMobileCards.module.css";

export default function ChatbotDataTab() {
  const [submissions, setSubmissions] = useState([]);
  const [filter, setFilter] = useState("all");
  const [selectedSubmission, setSelectedSubmission] = useState(null);

  const fetchSubmissions = async () => {
    const res = await fetch("/api/chatbot");
    const data = await res.json();
    setSubmissions(data);
  };

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const updateStatus = async (id, status) => {
    await fetch(`/api/chatbot/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    toast.success("Status updated");
    fetchSubmissions();
    if (selectedSubmission && selectedSubmission._id === id) {
      setSelectedSubmission({ ...selectedSubmission, status });
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this chatbot submission?")) return;
    await fetch(`/api/chatbot/${id}`, { method: "DELETE" });
    toast.success("Submission deleted");
    fetchSubmissions();
    if (selectedSubmission && selectedSubmission._id === id) {
      setSelectedSubmission(null);
    }
  };

  const filteredSubmissions = filter === "all" 
    ? submissions 
    : submissions.filter((sub) => sub.status === filter);

  const getStatusColor = (status) => {
    switch (status) {
      case "new":
        return { bg: "#fef3c7", color: "#92400e" };
      case "contacted":
        return { bg: "#dbeafe", color: "#1e40af" };
      case "resolved":
        return { bg: "#dcfce7", color: "#166534" };
      default:
        return { bg: "#f3f4f6", color: "#374151" };
    }
  };

  return (
    <div>
      <div style={styles.pageHeader}>
        <h2 style={styles.pageTitle}>Chatbot Data</h2>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={() => setFilter("all")}
              style={{
                ...styles.filterButton,
                background: filter === "all" ? "var(--accent-terracotta)" : "#e5e7eb",
                color: filter === "all" ? "white" : "#374151",
              }}
            >
              All
            </button>
            <button
              onClick={() => setFilter("new")}
              style={{
                ...styles.filterButton,
                background: filter === "new" ? "var(--accent-terracotta)" : "#e5e7eb",
                color: filter === "new" ? "white" : "#374151",
              }}
            >
              New
            </button>
            <button
              onClick={() => setFilter("contacted")}
              style={{
                ...styles.filterButton,
                background: filter === "contacted" ? "var(--accent-terracotta)" : "#e5e7eb",
                color: filter === "contacted" ? "white" : "#374151",
              }}
            >
              Contacted
            </button>
            <button
              onClick={() => setFilter("resolved")}
              style={{
                ...styles.filterButton,
                background: filter === "resolved" ? "var(--accent-terracotta)" : "#e5e7eb",
                color: filter === "resolved" ? "white" : "#374151",
              }}
            >
              Resolved
            </button>
          </div>
        </div>
      </div>

      {filteredSubmissions.length === 0 ? (
        <div style={styles.emptyState}>
          <p style={styles.emptyStateText}>
            No chatbot submissions yet.
          </p>
        </div>
      ) : (
        <>
        {/* Mobile cards */}
        <div className={mobile.mobileCards}>
          {filteredSubmissions.map((submission) => {
            const statusColors = getStatusColor(submission.status);
            return (
              <div key={submission._id} className={mobile.card}>
                <div className={mobile.cardHeader}>
                  <div>
                    <div className={mobile.cardTitle}>{submission.name}</div>
                    <div className={mobile.cardMeta}>
                      {submission.phone || "—"} • {new Date(submission.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <span className={mobile.badge} style={{ background: statusColors.bg, color: statusColors.color }}>
                    {submission.status}
                  </span>
                </div>
                <div className={mobile.summary}>
                  <strong>Email:</strong> {submission.email || "—"}
                  <br />
                  <strong>Questions:</strong> {submission.selectedQuestions?.length || 0}
                </div>
                <button type="button" className={mobile.viewMoreBtn} onClick={() => setSelectedSubmission(submission)}>
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
                <th style={styles.table.th}>Questions</th>
                <th style={styles.table.th}>Status</th>
                <th style={styles.table.th}>Date</th>
                <th style={styles.table.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSubmissions.map((submission) => {
                const statusColors = getStatusColor(submission.status);
                return (
                  <tr key={submission._id}>
                    <td style={styles.table.td}>
                      <p style={styles.table.text}>{submission.name}</p>
                    </td>
                    <td style={styles.table.td}>
                      <p style={styles.table.text}>{submission.email}</p>
                    </td>
                    <td style={styles.table.td}>
                      <p style={styles.table.text}>
                        {submission.phone || "N/A"}
                      </p>
                    </td>
                    <td style={styles.table.td}>
                      <button
                        onClick={() => setSelectedSubmission(submission)}
                        style={{
                          ...styles.table.linkButton,
                          padding: "6px 12px",
                          fontSize: "13px",
                        }}
                      >
                        View ({submission.selectedQuestions?.length || 0})
                      </button>
                    </td>
                    <td style={styles.table.td}>
                      <select
                        value={submission.status}
                        onChange={(e) =>
                          updateStatus(submission._id, e.target.value)
                        }
                        style={{
                          ...styles.table.status,
                          background: statusColors.bg,
                          color: statusColors.color,
                          border: "none",
                          padding: "6px 12px",
                          borderRadius: "6px",
                          cursor: "pointer",
                          fontSize: "13px",
                          fontWeight: "600",
                        }}
                      >
                        <option value="new">New</option>
                        <option value="contacted">Contacted</option>
                        <option value="resolved">Resolved</option>
                      </select>
                    </td>
                    <td style={styles.table.td}>
                      <p style={styles.table.textSmall}>
                        {new Date(submission.createdAt).toLocaleDateString()}
                      </p>
                    </td>
                    <td style={styles.table.td}>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button
                          onClick={() => setSelectedSubmission(submission)}
                          style={styles.table.actionButton}
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleDelete(submission._id)}
                          style={{
                            ...styles.table.actionButton,
                            background: "#ef4444",
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

      {/* Modal for viewing submission details */}
      {selectedSubmission && (
        <div
          style={styles.modalOverlay}
          onClick={() => setSelectedSubmission(null)}
        >
          <div
            style={styles.modal}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={styles.modalTitle}>Chatbot Submission Details</h3>
            
            <div style={{ marginBottom: "20px" }}>
              <h4 style={{ marginBottom: "12px", color: "#374151" }}>
                Contact Information
              </h4>
              <div style={styles.modalInfo}>
                <p><strong>Name:</strong> {selectedSubmission.name}</p>
                <p><strong>Email:</strong> {selectedSubmission.email}</p>
                <p><strong>Phone:</strong> {selectedSubmission.phone || "N/A"}</p>
                <p><strong>Status:</strong> 
                  <span
                    style={{
                      ...styles.table.status,
                      ...getStatusColor(selectedSubmission.status),
                      marginLeft: "8px",
                      padding: "4px 8px",
                      borderRadius: "4px",
                      fontSize: "12px",
                    }}
                  >
                    {selectedSubmission.status}
                  </span>
                </p>
                <p><strong>Submitted:</strong>{" "}
                  {new Date(selectedSubmission.createdAt).toLocaleString()}
                </p>
              </div>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <h4 style={{ marginBottom: "12px", color: "#374151" }}>
                Selected Questions & Answers
              </h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {selectedSubmission.selectedQuestions?.map((qa, index) => (
                  <div
                    key={index}
                    style={{
                      padding: "12px",
                      background: "#f9fafb",
                      borderRadius: "8px",
                      border: "1px solid #e5e7eb",
                    }}
                  >
                    <p style={{ margin: "0 0 6px 0", fontWeight: "600", color: "var(--accent-terracotta)" }}>
                      {qa.question}
                    </p>
                    <p style={{ margin: 0, color: "#374151" }}>
                      {qa.answer}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {selectedSubmission.message && (
              <div style={{ marginBottom: "20px" }}>
                <h4 style={{ marginBottom: "12px", color: "#374151" }}>
                  Additional Message
                </h4>
                <p style={{
                  padding: "12px",
                  background: "#f9fafb",
                  borderRadius: "8px",
                  border: "1px solid #e5e7eb",
                  margin: 0,
                  color: "#374151",
                }}>
                  {selectedSubmission.message}
                </p>
              </div>
            )}

            <div style={styles.modalButtons}>
              <button
                onClick={() => setSelectedSubmission(null)}
                style={styles.cancelButton}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
