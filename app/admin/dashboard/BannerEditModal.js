"use client";
import { useState, useEffect } from "react";
import * as styles from "./styles";

export default function BannerEditModal({ banner, onClose, refresh }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [sortOrder, setSortOrder] = useState(0);
  const [file, setFile] = useState(null);
  const [mobileFile, setMobileFile] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (banner) {
      setTitle(banner.title || "");
      setDescription(banner.description || "");
      setSortOrder(Number.isFinite(Number(banner.sortOrder)) ? Number(banner.sortOrder) : 0);
    }
  }, [banner]);

  const updateBanner = async () => {
    if (!banner?._id) return;

    setLoading(true);
    try {
      const hasFiles = file || mobileFile;
      if (hasFiles) {
        const formData = new FormData();
        formData.append("title", title.trim());
        formData.append("description", description.trim());
        formData.append("sortOrder", String(sortOrder ?? 0));
        if (file) formData.append("image", file);
        if (mobileFile) formData.append("mobileImage", mobileFile);

        await fetch(`/api/banner/${banner._id}`, {
          method: "PUT",
          body: formData,
        });
      } else {
        await fetch(`/api/banner/${banner._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: title.trim() || null,
            description: description.trim() || null,
            sortOrder,
          }),
        });
      }
      refresh();
      onClose();
    } catch (error) {
      console.error("Error updating banner:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!banner) return null;

  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h3 style={styles.modalTitle}>Edit Banner</h3>

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
            Banner Title
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
            Banner Description
          </label>
          <textarea
            placeholder="e.g. Experience advanced skin rejuvenation"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
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
            Replace Desktop Image (Optional)
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            style={{
              ...styles.inputStyle,
              padding: "12px",
              cursor: "pointer",
            }}
          />
          {banner.image && !file && (
            <p style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>
              Current image will be kept if not changed
            </p>
          )}
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
            Replace Mobile Image (Optional)
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setMobileFile(e.target.files?.[0] || null)}
            style={{
              ...styles.inputStyle,
              padding: "12px",
              cursor: "pointer",
            }}
          />
          {!banner.mobileImage && !mobileFile && (
            <p style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>
              Desktop image is used on mobile
            </p>
          )}
        </div>

        <div style={styles.modalButtons}>
          <button
            onClick={updateBanner}
            disabled={loading}
            style={{
              ...styles.submitButton,
              opacity: loading ? 0.6 : 1,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Saving..." : "Save"}
          </button>

          <button
            onClick={onClose}
            style={styles.cancelButton}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
