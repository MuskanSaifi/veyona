"use client";

import { useEffect, useState } from "react";
import * as styles from "./styles";

const defaultState = {
  kicker: "Trust & Safety",
  title: "Why Customers Trust Veyona for Home Services",
  description: "",
  trustPoints: [
    { title: "Background-Verified Professionals", text: "" },
    { title: "Hygiene & Safety First", text: "" },
    { title: "Trusted by Thousands", text: "" },
  ],
  quickReviews: [
    { name: "", city: "", review: "" },
    { name: "", city: "", review: "" },
    { name: "", city: "", review: "" },
  ],
  beforeAfterItems: [
    { beforeImage: "", afterImage: "", beforeLabel: "Before", afterLabel: "After" },
    { beforeImage: "", afterImage: "", beforeLabel: "Before", afterLabel: "After" },
  ],
};

export default function TrustSignalsTab() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(defaultState);
  const [beforeFiles, setBeforeFiles] = useState({});
  const [afterFiles, setAfterFiles] = useState({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/trust-signals");
      const data = await res.json();
      if (data?._id) {
        setForm({
          kicker: data.kicker || defaultState.kicker,
          title: data.title || defaultState.title,
          description: data.description || "",
          trustPoints: data.trustPoints?.length ? data.trustPoints : defaultState.trustPoints,
          quickReviews: data.quickReviews?.length ? data.quickReviews : defaultState.quickReviews,
          beforeAfterItems: data.beforeAfterItems?.length ? data.beforeAfterItems : defaultState.beforeAfterItems,
        });
      }
    } catch (error) {
      console.error("Failed to fetch trust signals:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateArrayField = (key, index, field, value) => {
    setForm((prev) => {
      const updated = [...prev[key]];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, [key]: updated };
    });
  };

  const addRow = (key, row) => {
    setForm((prev) => ({ ...prev, [key]: [...prev[key], row] }));
  };

  const removeRow = (key, index) => {
    setForm((prev) => ({
      ...prev,
      [key]: prev[key].filter((_, i) => i !== index),
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("kicker", form.kicker || "");
      fd.append("title", form.title || "");
      fd.append("description", form.description || "");
      fd.append("trustPoints", JSON.stringify(form.trustPoints || []));
      fd.append("quickReviews", JSON.stringify(form.quickReviews || []));
      fd.append("beforeAfterItems", JSON.stringify(form.beforeAfterItems || []));

      Object.entries(beforeFiles).forEach(([idx, file]) => {
        if (file) fd.append(`beforeImageFile_${idx}`, file);
      });
      Object.entries(afterFiles).forEach(([idx, file]) => {
        if (file) fd.append(`afterImageFile_${idx}`, file);
      });

      const res = await fetch("/api/trust-signals", {
        method: "PUT",
        body: fd,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Save failed");
      }
      await fetchData();
      setBeforeFiles({});
      setAfterFiles({});
      alert("Trust section saved successfully.");
    } catch (error) {
      console.error(error);
      alert(error.message || "Could not save trust section");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div style={{ padding: 30 }}>Loading trust settings...</div>;
  }

  return (
    <div>
      <div style={styles.pageHeader}>
        <h2 style={styles.pageTitle}>Trust Section</h2>
      </div>

      <p style={{ marginBottom: 18, color: "#64748b", fontSize: 14 }}>
        Manage trust points, reviews, and before/after images for homepage trust section.
      </p>

      <div style={{ background: "#fff", borderRadius: 14, padding: 20, border: "1px solid #e2e8f0" }}>
        <input
          style={styles.inputStyle}
          value={form.kicker}
          onChange={(e) => setForm((p) => ({ ...p, kicker: e.target.value }))}
          placeholder="Kicker"
        />
        <input
          style={styles.inputStyle}
          value={form.title}
          onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
          placeholder="Section title"
        />
        <textarea
          style={styles.textareaStyle}
          value={form.description}
          onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
          placeholder="Description"
        />

        <h3 style={{ margin: "20px 0 10px", fontSize: 18 }}>Trust Points</h3>
        {form.trustPoints.map((item, idx) => (
          <div key={`tp-${idx}`} style={{ border: "1px solid #e2e8f0", borderRadius: 10, padding: 12, marginBottom: 10 }}>
            <input
              style={styles.inputStyle}
              value={item.title || ""}
              onChange={(e) => updateArrayField("trustPoints", idx, "title", e.target.value)}
              placeholder="Point title"
            />
            <textarea
              style={styles.textareaStyle}
              value={item.text || ""}
              onChange={(e) => updateArrayField("trustPoints", idx, "text", e.target.value)}
              placeholder="Point text"
            />
            <button onClick={() => removeRow("trustPoints", idx)} style={styles.deleteButton}>Remove</button>
          </div>
        ))}
        <button
          onClick={() => addRow("trustPoints", { title: "", text: "" })}
          style={{ ...styles.addButton, marginBottom: 14 }}
        >
          Add Trust Point
        </button>

        <h3 style={{ margin: "14px 0 10px", fontSize: 18 }}>Quick Reviews</h3>
        {form.quickReviews.map((item, idx) => (
          <div key={`rv-${idx}`} style={{ border: "1px solid #e2e8f0", borderRadius: 10, padding: 12, marginBottom: 10 }}>
            <input
              style={styles.inputStyle}
              value={item.name || ""}
              onChange={(e) => updateArrayField("quickReviews", idx, "name", e.target.value)}
              placeholder="Customer name"
            />
            <input
              style={styles.inputStyle}
              value={item.city || ""}
              onChange={(e) => updateArrayField("quickReviews", idx, "city", e.target.value)}
              placeholder="City"
            />
            <textarea
              style={styles.textareaStyle}
              value={item.review || ""}
              onChange={(e) => updateArrayField("quickReviews", idx, "review", e.target.value)}
              placeholder="Review text"
            />
            <button onClick={() => removeRow("quickReviews", idx)} style={styles.deleteButton}>Remove</button>
          </div>
        ))}
        <button
          onClick={() => addRow("quickReviews", { name: "", city: "", review: "" })}
          style={{ ...styles.addButton, marginBottom: 14 }}
        >
          Add Review
        </button>

        <h3 style={{ margin: "14px 0 10px", fontSize: 18 }}>Before / After Images</h3>
        {form.beforeAfterItems.map((item, idx) => (
          <div key={`ba-${idx}`} style={{ border: "1px solid #e2e8f0", borderRadius: 10, padding: 12, marginBottom: 10 }}>
            <input
              style={styles.inputStyle}
              value={item.beforeLabel || ""}
              onChange={(e) => updateArrayField("beforeAfterItems", idx, "beforeLabel", e.target.value)}
              placeholder="Before label"
            />
            <input
              style={styles.inputStyle}
              value={item.afterLabel || ""}
              onChange={(e) => updateArrayField("beforeAfterItems", idx, "afterLabel", e.target.value)}
              placeholder="After label"
            />
            <input
              style={styles.inputStyle}
              value={item.beforeImage || ""}
              onChange={(e) => updateArrayField("beforeAfterItems", idx, "beforeImage", e.target.value)}
              placeholder="Before image URL (optional)"
            />
            <input
              type="file"
              accept="image/*"
              style={{ ...styles.inputStyle, padding: 10 }}
              onChange={(e) => setBeforeFiles((prev) => ({ ...prev, [idx]: e.target.files?.[0] || null }))}
            />
            <input
              style={styles.inputStyle}
              value={item.afterImage || ""}
              onChange={(e) => updateArrayField("beforeAfterItems", idx, "afterImage", e.target.value)}
              placeholder="After image URL (optional)"
            />
            <input
              type="file"
              accept="image/*"
              style={{ ...styles.inputStyle, padding: 10 }}
              onChange={(e) => setAfterFiles((prev) => ({ ...prev, [idx]: e.target.files?.[0] || null }))}
            />
            <button onClick={() => removeRow("beforeAfterItems", idx)} style={styles.deleteButton}>Remove</button>
          </div>
        ))}
        <button
          onClick={() =>
            addRow("beforeAfterItems", { beforeImage: "", afterImage: "", beforeLabel: "Before", afterLabel: "After" })
          }
          style={{ ...styles.addButton, marginBottom: 14 }}
        >
          Add Before/After Pair
        </button>

        <button
          onClick={handleSave}
          disabled={saving}
          style={{ ...styles.submitButton, opacity: saving ? 0.7 : 1, cursor: saving ? "not-allowed" : "pointer" }}
        >
          {saving ? "Saving..." : "Save Trust Section"}
        </button>
      </div>
    </div>
  );
}
