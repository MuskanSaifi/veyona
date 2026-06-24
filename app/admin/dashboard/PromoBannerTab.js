"use client";

import { useEffect, useState } from "react";
import * as styles from "./styles";

const PLACEMENT_OPTIONS = [
  { value: "homepage", label: "Homepage only" },
  { value: "sitewide", label: "Sitewide (all pages)" },
];

function formatDate(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-IN", { dateStyle: "medium" });
  } catch {
    return "—";
  }
}

function toInputDate(iso) {
  if (!iso) return "";
  try {
    return new Date(iso).toISOString().slice(0, 10);
  } catch {
    return "";
  }
}

const emptyForm = {
  title: "",
  subtitle: "",
  badge: "",
  linkUrl: "",
  linkLabel: "Book Now",
  placement: "homepage",
  startDate: "",
  endDate: "",
  sortOrder: 0,
  image: null,
};

export default function PromoBannerTab() {
  const [promos, setPromos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(null);

  const fetchPromos = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/promotional-banner?all=true");
      const data = await res.json();
      setPromos(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPromos();
  }, []);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setPreview(null);
    setShowModal(true);
  };

  const openEdit = (p) => {
    setEditing(p);
    setForm({
      title: p.title || "",
      subtitle: p.subtitle || "",
      badge: p.badge || "",
      linkUrl: p.linkUrl || "",
      linkLabel: p.linkLabel || "Book Now",
      placement: p.placement || "homepage",
      startDate: toInputDate(p.startDate),
      endDate: toInputDate(p.endDate),
      sortOrder: Number(p.sortOrder) || 0,
      image: null,
    });
    setPreview(p.image || null);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditing(null);
    setForm(emptyForm);
    setPreview(null);
  };

  const handleImageChange = (file) => {
    setForm((f) => ({ ...f, image: file }));
    if (file) {
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      alert("Title is required");
      return;
    }
    if (!editing && !form.image) {
      alert("Please upload a promotional image");
      return;
    }

    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("title", form.title.trim());
      fd.append("subtitle", form.subtitle.trim());
      fd.append("badge", form.badge.trim());
      fd.append("linkUrl", form.linkUrl.trim());
      fd.append("linkLabel", form.linkLabel.trim() || "Book Now");
      fd.append("placement", form.placement);
      fd.append("sortOrder", String(form.sortOrder ?? 0));
      if (form.startDate) fd.append("startDate", form.startDate);
      if (form.endDate) fd.append("endDate", form.endDate);
      if (form.image) fd.append("image", form.image);

      const url = editing
        ? `/api/promotional-banner/${editing._id}`
        : "/api/promotional-banner";
      const res = await fetch(url, {
        method: editing ? "PUT" : "POST",
        body: fd,
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.message || "Could not save");
        return;
      }
      await fetchPromos();
      closeModal();
    } catch {
      alert("Network error");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (p) => {
    await fetch(`/api/promotional-banner/${p._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !p.active }),
    });
    fetchPromos();
  };

  const deletePromo = async (id) => {
    if (!confirm("Delete this promotional banner?")) return;
    await fetch(`/api/promotional-banner/${id}`, { method: "DELETE" });
    fetchPromos();
  };

  return (
    <div>
      <div style={styles.pageHeader}>
        <div>
          <h2 style={styles.pageTitle}>Promotional Banners</h2>
          <p style={{ margin: "6px 0 0", color: "#64748b", fontSize: 14 }}>
            Seasonal offers, bridal packages &amp; featured promotions on the website
          </p>
        </div>
        <button style={styles.addButton} onClick={openAdd}>
          + Add Promotion
        </button>
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>Loading…</div>
      ) : promos.length === 0 ? (
        <div style={styles.emptyState}>
          <p style={styles.emptyStateText}>No promotions yet. Add your first offer!</p>
        </div>
      ) : (
        <div style={styles.table.wrapper}>
          <table style={styles.table.table}>
            <thead>
              <tr>
                <th style={styles.table.th}>Image</th>
                <th style={styles.table.th}>Title</th>
                <th style={styles.table.th}>Badge</th>
                <th style={styles.table.th}>Schedule</th>
                <th style={styles.table.th}>Placement</th>
                <th style={styles.table.th}>Order</th>
                <th style={styles.table.th}>Status</th>
                <th style={styles.table.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {promos.map((p) => (
                <tr key={p._id}>
                  <td style={styles.table.td}>
                    {p.image ? (
                      <img src={p.image} alt="" style={styles.table.image} />
                    ) : (
                      "—"
                    )}
                  </td>
                  <td style={{ ...styles.table.td, textAlign: "left", maxWidth: 200 }}>
                    <div style={{ fontWeight: 600 }}>{p.title}</div>
                    {p.subtitle && (
                      <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
                        {p.subtitle}
                      </div>
                    )}
                  </td>
                  <td style={styles.table.td}>{p.badge || "—"}</td>
                  <td style={{ ...styles.table.td, fontSize: 12 }}>
                    {p.startDate || p.endDate ? (
                      <>
                        {formatDate(p.startDate)} → {formatDate(p.endDate)}
                      </>
                    ) : (
                      "Always on"
                    )}
                  </td>
                  <td style={styles.table.td}>{p.placement}</td>
                  <td style={styles.table.td}>{p.sortOrder ?? 0}</td>
                  <td style={styles.table.td}>
                    <span
                      style={{
                        ...styles.table.status,
                        background: p.active ? "#dcfce7" : "#fee2e2",
                        color: p.active ? "#166534" : "#991b1b",
                      }}
                    >
                      {p.active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td style={styles.table.td}>
                    <div style={styles.table.actions}>
                      <button
                        style={{ ...styles.table.btn, background: "var(--accent-terracotta)" }}
                        onClick={() => openEdit(p)}
                      >
                        Edit
                      </button>
                      <button
                        style={{
                          ...styles.table.btn,
                          background: p.active ? "#f59e0b" : "#10b981",
                        }}
                        onClick={() => toggleActive(p)}
                      >
                        {p.active ? "Deactivate" : "Activate"}
                      </button>
                      <button
                        style={{ ...styles.table.btn, background: "#ef4444" }}
                        onClick={() => deletePromo(p._id)}
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
        <div style={styles.modalOverlay} onClick={closeModal}>
          <div
            style={{ ...styles.modal, maxWidth: 520, maxHeight: "90vh", overflowY: "auto" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={styles.modalTitle}>
              {editing ? "Edit Promotion" : "Add Promotion"}
            </h3>

            <form onSubmit={handleSubmit}>
              <label style={labelStyle}>Title *</label>
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Bridal Glow Package"
                style={styles.inputStyle}
                required
              />

              <label style={labelStyle}>Subtitle / description</label>
              <textarea
                value={form.subtitle}
                onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                placeholder="e.g. Complete bridal makeover — hair, skin & makeup"
                rows={2}
                style={{ ...styles.inputStyle, resize: "vertical" }}
              />

              <label style={labelStyle}>Badge label</label>
              <input
                value={form.badge}
                onChange={(e) => setForm({ ...form, badge: e.target.value })}
                placeholder="e.g. Limited Time, Bridal Special"
                style={styles.inputStyle}
              />

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={labelStyle}>Link URL</label>
                  <input
                    value={form.linkUrl}
                    onChange={(e) => setForm({ ...form, linkUrl: e.target.value })}
                    placeholder="/book or https://..."
                    style={styles.inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Button text</label>
                  <input
                    value={form.linkLabel}
                    onChange={(e) => setForm({ ...form, linkLabel: e.target.value })}
                    placeholder="Book Now"
                    style={styles.inputStyle}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={labelStyle}>Start date (optional)</label>
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    style={styles.inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>End date (optional)</label>
                  <input
                    type="date"
                    value={form.endDate}
                    onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                    style={styles.inputStyle}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={labelStyle}>Show on</label>
                  <select
                    value={form.placement}
                    onChange={(e) => setForm({ ...form, placement: e.target.value })}
                    style={styles.selectStyle}
                  >
                    {PLACEMENT_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Sort order</label>
                  <input
                    type="number"
                    value={form.sortOrder}
                    onChange={(e) =>
                      setForm({ ...form, sortOrder: Math.floor(Number(e.target.value) || 0) })
                    }
                    style={styles.inputStyle}
                  />
                </div>
              </div>

              <label style={labelStyle}>Promotional image {!editing && "*"}</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleImageChange(e.target.files?.[0] || null)}
                style={{ ...styles.inputStyle, padding: 12 }}
              />
              {preview && (
                <img
                  src={preview}
                  alt="Preview"
                  style={{
                    width: "100%",
                    maxHeight: 160,
                    objectFit: "cover",
                    borderRadius: 12,
                    marginTop: 8,
                    marginBottom: 12,
                  }}
                />
              )}

              <div style={styles.modalButtons}>
                <button type="button" onClick={closeModal} style={styles.cancelButton}>
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    ...styles.submitButton,
                    opacity: saving ? 0.7 : 1,
                    cursor: saving ? "not-allowed" : "pointer",
                  }}
                >
                  {saving ? "Saving…" : editing ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const labelStyle = {
  display: "block",
  fontWeight: 600,
  marginBottom: 6,
  marginTop: 12,
  color: "#475569",
  fontSize: 13,
};
