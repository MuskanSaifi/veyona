"use client";

import { useEffect, useState } from "react";
import * as styles from "./styles";

const DEFAULTS = {
  happyCustomersEnabled: true,
  happyCustomersCount: 0,
  happyCustomersLabel: "Happy Customers",
  happyCustomersSuffix: "+",
};

export default function SiteSettingsTab() {
  const [form, setForm] = useState(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/site-settings");
        const data = await res.json();
        setForm({
          happyCustomersEnabled:
            data?.happyCustomersEnabled ?? DEFAULTS.happyCustomersEnabled,
          happyCustomersCount: Number(data?.happyCustomersCount ?? 0),
          happyCustomersLabel:
            data?.happyCustomersLabel ?? DEFAULTS.happyCustomersLabel,
          happyCustomersSuffix:
            data?.happyCustomersSuffix ?? DEFAULTS.happyCustomersSuffix,
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch("/api/admin/site-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          happyCustomersEnabled: !!form.happyCustomersEnabled,
          happyCustomersCount: Math.max(0, Number(form.happyCustomersCount) || 0),
          happyCustomersLabel: form.happyCustomersLabel.trim(),
          happyCustomersSuffix: form.happyCustomersSuffix.trim(),
        }),
      });
      if (!res.ok) throw new Error("Save failed");
      setSaved(true);
    } catch (err) {
      console.error(err);
      alert("Could not save settings. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        <p>Loading…</p>
      </div>
    );
  }

  const previewCount = Math.max(0, Number(form.happyCustomersCount) || 0);

  return (
    <div>
      <div style={styles.pageHeader}>
        <h2 style={styles.pageTitle}>Site Settings</h2>
      </div>

      <p style={{ marginBottom: 24, color: "#64748b", fontSize: 14 }}>
        Manage the small strip at the top of the site header. Set the number
        you want shown publicly as your <strong>Happy Customers</strong> count.
      </p>

      <div
        style={{
          background: "#fff",
          borderRadius: 16,
          padding: 32,
          boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
          maxWidth: 760,
        }}
      >
        <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8, color: "#1e293b" }}>
          Happy Customers strip
        </h3>
        <p style={{ fontSize: 13, color: "#64748b", marginBottom: 20 }}>
          Shown to all visitors in the site header. Set count to <code>0</code> or
          uncheck "Enabled" to hide the strip entirely.
        </p>

        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 20,
            cursor: "pointer",
          }}
        >
          <input
            type="checkbox"
            checked={form.happyCustomersEnabled}
            onChange={(e) =>
              setForm({ ...form, happyCustomersEnabled: e.target.checked })
            }
            style={{ width: 18, height: 18 }}
          />
          <span style={{ fontWeight: 600, color: "#334155" }}>
            Show strip in header
          </span>
        </label>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 160px",
            gap: 16,
            marginBottom: 16,
          }}
        >
          <div>
            <label style={fieldLabel}>Happy customers count</label>
            <input
              type="number"
              min={0}
              value={form.happyCustomersCount}
              onChange={(e) =>
                setForm({ ...form, happyCustomersCount: e.target.value })
              }
              placeholder="e.g. 10000"
              style={{ ...styles.inputStyle, marginBottom: 0 }}
            />
            <div style={fieldHint}>
              Whole number. Shown in the header with optional suffix (e.g. "+").
            </div>
          </div>
          <div>
            <label style={fieldLabel}>Suffix</label>
            <input
              type="text"
              maxLength={8}
              value={form.happyCustomersSuffix}
              onChange={(e) =>
                setForm({ ...form, happyCustomersSuffix: e.target.value })
              }
              placeholder="+"
              style={{ ...styles.inputStyle, marginBottom: 0 }}
            />
            <div style={fieldHint}>Optional. e.g. <code>+</code>, <code>K+</code></div>
          </div>
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={fieldLabel}>Label</label>
          <input
            type="text"
            value={form.happyCustomersLabel}
            onChange={(e) =>
              setForm({ ...form, happyCustomersLabel: e.target.value })
            }
            placeholder="Happy Customers"
            style={{ ...styles.inputStyle, marginBottom: 0 }}
          />
          <div style={fieldHint}>Displayed right after the number.</div>
        </div>

        {/* Live preview */}
        <div
          style={{
            background:
              "linear-gradient(90deg, var(--accent-terracotta, #AD6E5E) 0%, var(--accent-coral, #F28F79) 100%)",
            color: "#fff",
            textAlign: "center",
            padding: "10px 16px",
            borderRadius: 10,
            fontWeight: 600,
            marginBottom: 24,
          }}
        >
          Preview:{" "}
          <strong>
            {previewCount.toLocaleString("en-IN")}
            {form.happyCustomersSuffix || ""}
          </strong>{" "}
          {form.happyCustomersLabel || "Happy Customers"}
        </div>

        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              ...styles.submitButton,
              opacity: saving ? 0.7 : 1,
              cursor: saving ? "not-allowed" : "pointer",
              flex: "0 0 auto",
              padding: "12px 28px",
            }}
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
          {saved && (
            <span style={{ color: "#16a34a", fontWeight: 600 }}>
              ✓ Saved. Refresh the homepage to see the update.
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

const fieldLabel = {
  display: "block",
  marginBottom: 6,
  fontWeight: 600,
  color: "#475569",
  fontSize: 14,
};

const fieldHint = {
  fontSize: 12,
  color: "#94a3b8",
  marginTop: 6,
};
