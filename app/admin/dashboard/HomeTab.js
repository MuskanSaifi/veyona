"use client";
import { useEffect, useState } from "react";
import BannerModal from "./BannerModal";
import BannerEditModal from "./BannerEditModal";
import * as styles from "./styles";

export default function HomeTab() {
  const [banners, setBanners] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editBanner, setEditBanner] = useState(null);

  const fetchBanners = async () => {
    const res = await fetch("/api/banner");
    const data = await res.json();
    setBanners(data);
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const toggleStatus = async (id, active) => {
    await fetch(`/api/banner/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !active }),
    });
    fetchBanners();
  };

  const deleteBanner = async (id) => {
    if (!confirm("Delete this banner?")) return;
    await fetch(`/api/banner/${id}`, { method: "DELETE" });
    fetchBanners();
  };

  return (
    <div>
      {/* Header */}
      <div style={styles.pageHeader}>
        <h2 style={styles.pageTitle}>Home Banners</h2>
        <button onClick={() => setShowModal(true)} style={styles.addButton}>
          + Add Banner
        </button>
      </div>

      {/* TABLE */}
      {banners.length === 0 ? (
        <div style={styles.emptyState}>
          <p style={styles.emptyStateText}>
            No banners yet. Add your first banner!
          </p>
        </div>
      ) : (
        <div style={table.wrapper}>
          <table style={table.table}>
          <thead>
  <tr>
    <th style={table.th}>Desktop Preview</th>
    <th style={table.th}>Mobile Preview</th>
    <th style={table.th}>Order</th>
    <th style={table.th}>Status</th>
    <th style={table.th}>Created</th>
    <th style={table.th}>Actions</th>
  </tr>
</thead>

<tbody>
  {banners.map((b) => (
    <tr key={b._id}>
      <td style={table.td}>
        <img src={b.image} alt="Desktop Banner" style={table.image} />
      </td>
      <td style={table.td}>
        <img 
          src={b.mobileImage || b.image} 
          alt="Mobile Banner" 
          style={table.image} 
        />
        {!b.mobileImage && (
          <p style={{ fontSize: "11px", color: "#64748b", marginTop: "4px" }}>
            Using desktop image
          </p>
        )}
      </td>

      <td style={table.td}>
        <span style={{ fontWeight: 700, color: "#0f172a" }}>
          {Number.isFinite(Number(b.sortOrder)) ? Number(b.sortOrder) : 0}
        </span>
      </td>

      <td style={table.td}>
        <span
          style={{
            ...table.status,
            background: b.active ? "#dcfce7" : "#fee2e2",
            color: b.active ? "#166534" : "#991b1b",
          }}
        >
          {b.active ? "Active" : "Inactive"}
        </span>
      </td>

      <td style={table.td}>
        {new Date(b.createdAt).toLocaleDateString()}
      </td>

      <td style={table.td}>
        <div style={table.actions}>
          <button
            style={{ ...table.btn, background: "var(--accent-terracotta)" }}
            onClick={() => setEditBanner(b)}
          >
            Edit
          </button>
          <button
            style={{
              ...table.btn,
              background: b.active ? "#f59e0b" : "#10b981",
            }}
            onClick={() => toggleStatus(b._id, b.active)}
          >
            {b.active ? "Deactivate" : "Activate"}
          </button>

          <button
            style={{ ...table.btn, background: "#ef4444" }}
            onClick={() => deleteBanner(b._id)}
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
      )}

      {showModal && (
        <BannerModal
          onClose={() => setShowModal(false)}
          refresh={fetchBanners}
        />
      )}

      {editBanner && (
        <BannerEditModal
          banner={editBanner}
          onClose={() => setEditBanner(null)}
          refresh={fetchBanners}
        />
      )}
    </div>
  );
}
const table = {
  wrapper: {
    background: "#fff",
    borderRadius: "16px",
    padding: "12px 0",
    boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
  },

  table: {
    width: "100%",
    borderCollapse: "separate",
    borderSpacing: "0 12px", // row gap (important)
  },

  th: {
    textAlign: "center",
    fontSize: "15px",
    fontWeight: 700,
    color: "#0f172a",
    padding: "14px",
  },

  td: {
    textAlign: "center",
    verticalAlign: "middle",
    padding: "18px",
    background: "#fff",
  },
  image: {
    width: "240px",
    height: "100px",
    objectFit: "cover",
    borderRadius: "14px",
    display: "block",
    margin: "0 auto", // center image
  },

  status: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minWidth: "90px",
    padding: "8px 16px",
    borderRadius: "999px",
    fontSize: "14px",
    fontWeight: 600,
  },

  actions: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "14px",
  },
  
  btn: {
    padding: "10px 18px",
    border: "none",
    borderRadius: "12px",
    color: "#fff",
    fontWeight: 600,
    cursor: "pointer",
    minWidth: "110px", // 🔥 equal button width
  },
}  