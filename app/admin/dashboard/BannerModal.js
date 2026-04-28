"use client";
import { useState } from "react";
import * as styles from "./styles";

export default function BannerModal({ onClose, refresh }) {
  const [file, setFile] = useState(null);
  const [mobileFile, setMobileFile] = useState(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [sortOrder, setSortOrder] = useState(0);
  const [loading, setLoading] = useState(false);

  const uploadBanner = async () => {
    if (!file) return;

    setLoading(true);
    const formData = new FormData();
    formData.append("image", file);
    if (mobileFile) {
      formData.append("mobileImage", mobileFile);
    }
    formData.append("title", title.trim());
    formData.append("description", description.trim());
    formData.append("sortOrder", String(sortOrder ?? 0));

    try {
      await fetch("/api/banner", {
        method: "POST",
        body: formData,
      });
      refresh();
      onClose();
    } catch (error) {
      console.error("Error uploading banner:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h3 style={styles.modalTitle}>Add Banner</h3>

        <div style={{ marginBottom: "20px" }}>
          <label
            style={{
              display: "block",
              marginBottom: "8px",
              fontWeight: 600,
              color: "#475569",
              fontSize: "14px",
            }}
          >
            Banner Title (Optional)
          </label>
          <input
            type="text"
            placeholder="e.g. Laser Skin Resurfacing"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={styles.inputStyle}
          />
        </div>

        <div style={{ marginBottom: "20px" }}>
          <label
            style={{
              display: "block",
              marginBottom: "8px",
              fontWeight: 600,
              color: "#475569",
              fontSize: "14px",
            }}
          >
            Banner Description (Optional)
          </label>
          <textarea
            placeholder="e.g. Experience advanced skin rejuvenation"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            style={{ ...styles.inputStyle, resize: "vertical" }}
          />
        </div>

        <div style={{ marginBottom: "20px" }}>
          <label
            style={{
              display: "block",
              marginBottom: "8px",
              fontWeight: 600,
              color: "#475569",
              fontSize: "14px",
            }}
          >
            Banner Order (lower shows first)
          </label>
          <input
            type="number"
            value={sortOrder}
            onChange={(e) => setSortOrder(Math.floor(Number(e.target.value) || 0))}
            style={styles.inputStyle}
          />
        </div>

        <div style={{ marginBottom: "20px" }}>
          <label
            style={{
              display: "block",
              marginBottom: "8px",
              fontWeight: 600,
              color: "#475569",
              fontSize: "14px",
            }}
          >
            Upload Desktop Image *
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files[0])}
            style={{
              ...styles.inputStyle,
              padding: "12px",
              cursor: "pointer",
            }}
          />
        </div>

        <div style={{ marginBottom: "20px" }}>
          <label
            style={{
              display: "block",
              marginBottom: "8px",
              fontWeight: 600,
              color: "#475569",
              fontSize: "14px",
            }}
          >
            Upload Mobile Image (Optional)
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setMobileFile(e.target.files[0])}
            style={{
              ...styles.inputStyle,
              padding: "12px",
              cursor: "pointer",
            }}
          />
          <p style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>
            If not provided, desktop image will be used on mobile
          </p>
        </div>

        <div style={styles.modalButtons}>
          <button
            onClick={uploadBanner}
            disabled={loading || !file}
            style={{
              ...styles.submitButton,
              opacity: loading || !file ? 0.6 : 1,
              cursor: loading || !file ? "not-allowed" : "pointer",
            }}
            onMouseEnter={(e) => {
              if (!loading && file) {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 6px 16px rgba(99, 102, 241, 0.4)";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 4px 12px rgba(99, 102, 241, 0.3)";
            }}
          >
            {loading ? "Uploading..." : "Upload"}
          </button>

          <button
            onClick={onClose}
            style={styles.cancelButton}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#e2e8f0";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#f1f5f9";
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
