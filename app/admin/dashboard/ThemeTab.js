"use client";
import { useEffect, useMemo, useState } from "react";
import * as styles from "./styles";

const DEFAULTS = {
  bgCream: "#F5F0E6",
  bgCharcoal: "#333333",
  bgFooterDark: "#222222",
  accentTerracotta: "#AD6E5E",
  accentCoral: "#F28F79",
  accentBrown: "#B59A7E",
  textDark: "#222222",
  textMuted: "#5c5c5c",
  borderLight: "#e8e4dc",
};

export default function ThemeTab() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(DEFAULTS);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (data) {
      setForm({
        bgCream: data.bgCream || DEFAULTS.bgCream,
        bgCharcoal: data.bgCharcoal || DEFAULTS.bgCharcoal,
        bgFooterDark: data.bgFooterDark || DEFAULTS.bgFooterDark,
        accentTerracotta: data.accentTerracotta || DEFAULTS.accentTerracotta,
        accentCoral: data.accentCoral || DEFAULTS.accentCoral,
        accentBrown: data.accentBrown || DEFAULTS.accentBrown,
        textDark: data.textDark || DEFAULTS.textDark,
        textMuted: data.textMuted || DEFAULTS.textMuted,
        borderLight: data.borderLight || DEFAULTS.borderLight,
      });
    }
  }, [data]);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/theme");
      const d = await res.json();
      setData(d);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const rows = useMemo(
    () => [
      { key: "bgCream", label: "Background (Cream)" },
      { key: "bgCharcoal", label: "Background (Charcoal)" },
      { key: "bgFooterDark", label: "Footer Dark" },
      { key: "accentTerracotta", label: "Accent (Terracotta)" },
      { key: "accentCoral", label: "Accent (Coral)" },
      { key: "accentBrown", label: "Accent (Brown)" },
      { key: "textDark", label: "Text (Dark)" },
      { key: "textMuted", label: "Text (Muted)" },
      { key: "borderLight", label: "Border (Light)" },
    ],
    []
  );

  const handleSave = async () => {
    setSaving(true);
    try {
      const method = data?._id ? "PUT" : "POST";
      await fetch("/api/theme", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      await fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div>
      <div style={styles.pageHeader}>
        <h2 style={styles.pageTitle}>Theme Settings</h2>
      </div>

      <p style={{ marginBottom: 24, color: "#64748b", fontSize: 14 }}>
        Update your website theme colors. Changes apply across the site (all pages) via CSS variables.
      </p>

      <div
        style={{
          background: "#fff",
          borderRadius: 16,
          padding: 32,
          boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
          maxWidth: 720,
        }}
      >
        {rows.map((r) => (
          <div
            key={r.key}
            style={{ display: "grid", gridTemplateColumns: "1fr 160px", gap: 12, alignItems: "center", marginBottom: 16 }}
          >
            <div>
              <label style={{ display: "block", marginBottom: 6, fontWeight: 600, color: "#475569", fontSize: 14 }}>
                {r.label}
              </label>
              <input
                type="text"
                value={form[r.key]}
                onChange={(e) => setForm({ ...form, [r.key]: e.target.value })}
                placeholder={DEFAULTS[r.key]}
                style={{ ...styles.inputStyle, marginBottom: 0 }}
              />
              <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 6 }}>
                Example: <code>{DEFAULTS[r.key]}</code>
              </div>
            </div>

            <input
              type="color"
              value={/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(form[r.key]) ? form[r.key] : DEFAULTS[r.key]}
              onChange={(e) => setForm({ ...form, [r.key]: e.target.value })}
              style={{ width: "100%", height: 44, border: "2px solid #e2e8f0", borderRadius: 10, background: "#fff", padding: 6 }}
              aria-label={`${r.label} color picker`}
            />
          </div>
        ))}

        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            ...styles.submitButton,
            opacity: saving ? 0.7 : 1,
            cursor: saving ? "not-allowed" : "pointer",
          }}
        >
          {saving ? "Saving..." : "Save Theme"}
        </button>
      </div>
    </div>
  );
}

