"use client";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import * as styles from "./styles";
import mobile from "./AdminMobileCards.module.css";

export default function CouponTab() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [usageFor, setUsageFor] = useState(null);
  const [usageList, setUsageList] = useState([]);
  const [viewMore, setViewMore] = useState(null);
  const [form, setForm] = useState({
    code: "",
    type: "percent",
    value: "",
    maxDiscount: "",
    minOrderAmount: "",
    usageLimit: "",
    expiresAt: "",
    validForDays: "",
    validForHours: "",
    active: true,
  });

  const fetchCoupons = async () => {
    try {
      const res = await fetch("/api/coupon");
      const data = await res.json();
      setCoupons(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error("Failed to fetch coupons");
    } finally {
      setLoading(false);
    }
  };

  const fetchUsage = async (code) => {
    try {
      const res = await fetch(`/api/appointment?couponCode=${encodeURIComponent(code)}`);
      const data = await res.json();
      setUsageList(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error("Failed to fetch usage");
      setUsageList([]);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  useEffect(() => {
    if (editing) {
      setForm({
        code: editing.code || "",
        type: editing.type || "percent",
        value: String(editing.value ?? ""),
        maxDiscount: editing.maxDiscount != null ? String(editing.maxDiscount) : "",
        minOrderAmount: editing.minOrderAmount != null ? String(editing.minOrderAmount) : "",
        usageLimit: editing.usageLimit != null ? String(editing.usageLimit) : "",
        expiresAt: editing.expiresAt ? new Date(editing.expiresAt).toISOString().slice(0, 16) : "",
        validForDays: editing.validForDays != null ? String(editing.validForDays) : "",
        validForHours: editing.validForHours != null ? String(editing.validForHours) : "",
        active: editing.active !== false,
      });
    } else {
      setForm({
        code: "",
        type: "percent",
        value: "",
        maxDiscount: "",
        minOrderAmount: "",
        usageLimit: "",
        expiresAt: "",
        validForDays: "",
        validForHours: "",
        active: true,
      });
    }
  }, [editing]);

  const handleSave = async (e) => {
    e.preventDefault();
    const code = form.code.trim().toUpperCase();
    if (!code) {
      toast.error("Coupon code is required");
      return;
    }
    const val = Number(form.value);
    if (!Number.isFinite(val) || val < 0) {
      toast.error("Valid discount value is required");
      return;
    }

    const payload = {
      code,
      type: form.type,
      value: val,
      active: form.active,
    };
    if (form.maxDiscount) payload.maxDiscount = Number(form.maxDiscount);
    if (form.minOrderAmount) payload.minOrderAmount = Number(form.minOrderAmount);
    if (form.usageLimit) payload.usageLimit = Number(form.usageLimit);
    if (form.expiresAt) payload.expiresAt = form.expiresAt;
    payload.validForDays = form.validForDays === "" ? null : Number(form.validForDays) || 0;
    payload.validForHours = form.validForHours === "" ? null : Number(form.validForHours) || 0;

    try {
      if (editing) {
        const res = await fetch(`/api/coupon/${editing._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) {
          toast.error(data.message || "Update failed");
          return;
        }
        toast.success("Coupon updated");
      } else {
        const res = await fetch("/api/coupon", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) {
          toast.error(data.message || "Create failed");
          return;
        }
        toast.success("Coupon added");
      }
      setShowModal(false);
      setEditing(null);
      fetchCoupons();
    } catch (err) {
      toast.error(err.message || "Failed to save");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this coupon?")) return;
    try {
      const res = await fetch(`/api/coupon/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || "Delete failed");
        return;
      }
      toast.success("Coupon deleted");
      fetchCoupons();
      if (usageFor) setUsageFor(null);
    } catch (err) {
      toast.error("Failed to delete");
    }
  };

  const openUsage = (c) => {
    setUsageFor(c);
    fetchUsage(c.code);
  };

  const discountLabel = (c) => {
    if (c.type === "percent") {
      const max = c.maxDiscount != null ? ` (max ₹${c.maxDiscount})` : "";
      return `${c.value}% off${max}`;
    }
    return `₹${c.value} off`;
  };

  const getEffectiveExpiryTime = (c) => {
    if (!c) return null;
    if (c.expiresAt) return new Date(c.expiresAt).getTime();
    const days = Number(c.validForDays) || 0;
    const hours = Number(c.validForHours) || 0;
    if (days === 0 && hours === 0) return null;
    const createdAt = c.createdAt ? new Date(c.createdAt).getTime() : Date.now();
    return createdAt + days * 24 * 60 * 60 * 1000 + hours * 60 * 60 * 1000;
  };
  const isExpired = (c) => {
    const t = getEffectiveExpiryTime(c);
    return t != null && t < Date.now();
  };

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        <p>Loading coupons...</p>
      </div>
    );
  }

  return (
    <div>
      <div style={styles.pageHeader}>
        <h2 style={styles.pageTitle}>Coupon Codes</h2>
        <button
          onClick={() => { setEditing(null); setShowModal(true); }}
          style={styles.addButton}
        >
          + Add Coupon
        </button>
      </div>

      <p style={{ marginBottom: 24, color: "#64748b", fontSize: 14 }}>
        Manage discount coupons. Users can apply these while booking.
      </p>

      {coupons.length === 0 ? (
        <div style={styles.emptyState}>
          <p style={styles.emptyStateText}>No coupons yet. Add one to offer discounts.</p>
        </div>
      ) : (
        <>
        {/* Mobile cards */}
        <div className={mobile.mobileCards}>
          {coupons.map((c) => {
            const expired = isExpired(c);
            const statusText = !c.active ? "Inactive" : expired ? "Expired" : "Active";
            const statusBg = !c.active ? "#fee2e2" : expired ? "#fef3c7" : "#d1fae5";
            const statusColor = !c.active ? "#991b1b" : expired ? "#92400e" : "#065f46";
            return (
              <div key={c._id} className={mobile.card}>
                <div className={mobile.cardHeader}>
                  <div>
                    <div className={mobile.cardTitle} style={{ fontFamily: "monospace" }}>{c.code}</div>
                    <div className={mobile.cardMeta}>
                      {discountLabel(c)} • Used: {(c.usedCount || 0)}{c.usageLimit ? `/${c.usageLimit}` : ""}
                    </div>
                  </div>
                  <span className={mobile.badge} style={{ background: statusBg, color: statusColor }}>
                    {statusText}
                  </span>
                </div>
                <div className={mobile.summary}>
                  <strong>Min order:</strong> {c.minOrderAmount > 0 ? `₹${c.minOrderAmount}` : "—"}
                  <br />
                  <strong>Expiry:</strong>{" "}
                  {c.expiresAt
                    ? new Date(c.expiresAt).toLocaleDateString()
                    : (c.validForDays || c.validForHours)
                      ? `Valid: ${c.validForDays || 0}d ${c.validForHours || 0}h`
                      : "—"}
                </div>
                <button type="button" className={mobile.viewMoreBtn} onClick={() => setViewMore(c)}>
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
                <th style={styles.table.th}>Code</th>
                <th style={styles.table.th}>Discount</th>
                <th style={styles.table.th}>Min Order</th>
                <th style={styles.table.th}>Used</th>
                <th style={styles.table.th}>Status</th>
                <th style={styles.table.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((c) => (
                <tr key={c._id}>
                  <td style={styles.table.td}>
                    <span style={{ fontWeight: 700, fontFamily: "monospace" }}>{c.code}</span>
                  </td>
                  <td style={styles.table.td}>{discountLabel(c)}</td>
                  <td style={styles.table.td}>
                    {c.minOrderAmount > 0 ? `₹${c.minOrderAmount}` : "—"}
                  </td>
                  <td style={styles.table.td}>
                    {c.usedCount || 0}
                    {c.usageLimit != null && c.usageLimit > 0 && ` / ${c.usageLimit}`}
                  </td>
                  <td style={styles.table.td}>
                    <span
                      style={{
                        ...styles.table.status,
                        background: !c.active
                          ? "#fee2e2"
                          : isExpired(c)
                            ? "#fef3c7"
                            : "#d1fae5",
                        color: !c.active ? "#991b1b" : isExpired(c) ? "#92400e" : "#065f46",
                      }}
                    >
                      {!c.active ? "Inactive" : isExpired(c) ? "Expired" : "Active"}
                    </span>
                    {(c.expiresAt || c.validForDays || c.validForHours) && !isExpired(c) && (
                      <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>
                        {c.expiresAt
                          ? `Expires: ${new Date(c.expiresAt).toLocaleDateString()}`
                          : ((c.validForDays > 0) || (c.validForHours > 0))
                            ? `Valid for ${c.validForDays || 0}d ${c.validForHours || 0}h`
                            : null}
                      </div>
                    )}
                  </td>
                  <td style={styles.table.td}>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      <button
                        onClick={() => openUsage(c)}
                        style={{
                          ...styles.table.btn,
                          background: "#e0e7ff",
                          color: "#3730a3",
                        }}
                      >
                        View Usage
                      </button>
                      <button
                        onClick={() => { setEditing(c); setShowModal(true); }}
                        style={{
                          ...styles.table.btn,
                          background: "linear-gradient(135deg, var(--accent-terracotta) 0%, var(--accent-coral) 100%)",
                        }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(c._id)}
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
              <div className={mobile.modalTitle}>Coupon Details</div>
              <button type="button" className={mobile.modalClose} onClick={() => setViewMore(null)} aria-label="Close">✕</button>
            </div>
            <div className={mobile.modalBody}>
              <div className={mobile.detailRow}>
                <div className={mobile.detailLabel}>Code</div>
                <div className={mobile.detailValue} style={{ fontFamily: "monospace", fontWeight: 700 }}>{viewMore.code}</div>
              </div>
              <div className={mobile.detailRow}>
                <div className={mobile.detailLabel}>Discount</div>
                <div className={mobile.detailValue}>{discountLabel(viewMore)}</div>
              </div>
              <div className={mobile.detailSection}>
                <div className={mobile.detailSectionTitle}>Rules</div>
                <div style={{ fontSize: 14, lineHeight: 1.8 }}>
                  <div>Min order: {viewMore.minOrderAmount > 0 ? `₹${viewMore.minOrderAmount}` : "—"}</div>
                  <div>Usage: {(viewMore.usedCount || 0)}{viewMore.usageLimit ? ` / ${viewMore.usageLimit}` : ""}</div>
                  <div>
                    Expiry: {viewMore.expiresAt
                      ? new Date(viewMore.expiresAt).toLocaleString()
                      : (viewMore.validForDays || viewMore.validForHours)
                        ? `Valid: ${viewMore.validForDays || 0}d ${viewMore.validForHours || 0}h`
                        : "—"}
                  </div>
                  <div>Status: {!viewMore.active ? "Inactive" : isExpired(viewMore) ? "Expired" : "Active"}</div>
                </div>
              </div>
              <div className={mobile.modalActions}>
                <button type="button" className={mobile.primaryBtn} onClick={() => { setEditing(viewMore); setShowModal(true); setViewMore(null); }}>
                  Edit
                </button>
                <button type="button" className={mobile.warnBtn} onClick={() => { openUsage(viewMore); setViewMore(null); }}>
                  View Usage
                </button>
                <button type="button" className={mobile.dangerBtn} onClick={() => { handleDelete(viewMore._id); setViewMore(null); }}>
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Usage modal */}
      {usageFor && (
        <div style={styles.modalOverlay} onClick={() => setUsageFor(null)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 style={styles.modalTitle}>Coupon usage: {usageFor.code}</h3>
            <p style={{ color: "#64748b", fontSize: 14, marginBottom: 16 }}>
              Appointments where this coupon was used (discount applied)
            </p>
            {usageList.length === 0 ? (
              <p style={{ color: "#94a3b8" }}>No usage yet.</p>
            ) : (
              <div style={{ maxHeight: 400, overflowY: "auto" }}>
                {usageList.map((apt) => {
                  const disc = apt.pricing?.discountAmount ?? 0;
                  const total = apt.pricing?.totalPayable ?? 0;
                  return (
                    <div
                      key={apt._id}
                      style={{
                        padding: "12px 16px",
                        border: "1px solid #e2e8f0",
                        borderRadius: 8,
                        marginBottom: 8,
                        background: "#f8fafc",
                      }}
                    >
                      <div style={{ fontWeight: 600 }}>{apt.customer?.name || "N/A"}</div>
                      <div style={{ fontSize: 12, color: "#64748b" }}>
                        {apt.customer?.phone || apt.customer?.email || ""} •{" "}
                        {new Date(apt.date).toLocaleDateString()} {apt.time}
                      </div>
                      <div style={{ fontSize: 13, marginTop: 4, color: "#059669", fontWeight: 500 }}>
                        Discount: ₹{disc} (Total: ₹{total})
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <div style={styles.modalButtons}>
              <button onClick={() => setUsageFor(null)} style={styles.cancelButton}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit modal */}
      {showModal && (
        <div style={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 style={styles.modalTitle}>{editing ? "Edit Coupon" : "Add Coupon"}</h3>
            <form onSubmit={handleSave}>
              <label style={{ display: "block", marginBottom: 8, fontWeight: 600, color: "#475569", fontSize: 14 }}>
                Coupon Code *
              </label>
              <input
                type="text"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                placeholder="SAVE20"
                style={styles.inputStyle}
                required
                disabled={!!editing}
              />

              <label style={{ display: "block", marginBottom: 8, fontWeight: 600, color: "#475569", fontSize: 14 }}>
                Discount Type
              </label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                style={styles.selectStyle}
              >
                <option value="percent">Percentage off</option>
                <option value="fixed">Fixed amount off (₹)</option>
              </select>

              <label style={{ display: "block", marginBottom: 8, fontWeight: 600, color: "#475569", fontSize: 14 }}>
                Discount Value * {form.type === "percent" ? "(e.g. 10 for 10%)" : "(e.g. 100 for ₹100 off)"}
              </label>
              <input
                type="number"
                min={0}
                step={form.type === "percent" ? 1 : 1}
                value={form.value}
                onChange={(e) => setForm({ ...form, value: e.target.value })}
                placeholder={form.type === "percent" ? "10" : "100"}
                style={styles.inputStyle}
                required
              />

              {form.type === "percent" && (
                <>
                  <label style={{ display: "block", marginBottom: 8, fontWeight: 600, color: "#475569", fontSize: 14 }}>
                    Max Discount (₹) – optional
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={form.maxDiscount}
                    onChange={(e) => setForm({ ...form, maxDiscount: e.target.value })}
                    placeholder="500"
                    style={styles.inputStyle}
                  />
                </>
              )}

              <label style={{ display: "block", marginBottom: 8, fontWeight: 600, color: "#475569", fontSize: 14 }}>
                Min Order Amount (₹) – optional
              </label>
              <input
                type="number"
                min={0}
                value={form.minOrderAmount}
                onChange={(e) => setForm({ ...form, minOrderAmount: e.target.value })}
                placeholder="500"
                style={styles.inputStyle}
              />

              <label style={{ display: "block", marginBottom: 8, fontWeight: 600, color: "#475569", fontSize: 14 }}>
                Usage Limit – optional
              </label>
              <input
                type="number"
                min={0}
                value={form.usageLimit}
                onChange={(e) => setForm({ ...form, usageLimit: e.target.value })}
                placeholder="100"
                style={styles.inputStyle}
              />

              <label style={{ display: "block", marginBottom: 8, fontWeight: 600, color: "#475569", fontSize: 14 }}>
                Expires At – optional (fixed date)
              </label>
              <input
                type="datetime-local"
                value={form.expiresAt}
                onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                style={styles.inputStyle}
              />

              <p style={{ fontSize: 13, color: "#64748b", margin: "-8px 0 16px" }}>
                Or set validity duration (from creation):
              </p>
              <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: "block", marginBottom: 6, fontWeight: 600, color: "#475569", fontSize: 13 }}>
                    Valid for Days
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={form.validForDays}
                    onChange={(e) => setForm({ ...form, validForDays: e.target.value })}
                    placeholder="e.g. 7"
                    style={styles.inputStyle}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: "block", marginBottom: 6, fontWeight: 600, color: "#475569", fontSize: 13 }}>
                    Valid for Hours
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={form.validForHours}
                    onChange={(e) => setForm({ ...form, validForHours: e.target.value })}
                    placeholder="e.g. 12"
                    style={styles.inputStyle}
                  />
                </div>
              </div>

              <label style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) => setForm({ ...form, active: e.target.checked })}
                />
                <span style={{ fontWeight: 500 }}>Active</span>
              </label>

              <div style={styles.modalButtons}>
                <button type="button" onClick={() => setShowModal(false)} style={styles.cancelButton}>
                  Cancel
                </button>
                <button type="submit" style={styles.submitButton}>
                  {editing ? "Update" : "Add"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
