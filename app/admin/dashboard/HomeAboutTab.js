"use client";
import { useEffect, useState } from "react";
import * as styles from "./styles";

export default function HomeAboutTab() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    subtitle: "",
    title: "",
    description: "",
  });
  const [file, setFile] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (data) {
      setForm({
        subtitle: data.subtitle || "",
        title: data.title || "",
        description: data.description || "",
      });
    }
  }, [data]);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/home-about");
      const d = await res.json();
      setData(d);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (data?._id) {
        if (file) {
          const fd = new FormData();
          fd.append("image", file);
          fd.append("subtitle", form.subtitle);
          fd.append("title", form.title);
          fd.append("description", form.description);
          await fetch("/api/home-about", {
            method: "PUT",
            body: fd,
          });
        } else {
          await fetch("/api/home-about", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              subtitle: form.subtitle,
              title: form.title,
              description: form.description,
            }),
          });
        }
      } else {
        const fd = new FormData();
        if (file) fd.append("image", file);
        fd.append("subtitle", form.subtitle);
        fd.append("title", form.title);
        fd.append("description", form.description);
        await fetch("/api/home-about", {
          method: "POST",
          body: fd,
        });
      }
      fetchData();
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
        <h2 style={styles.pageTitle}>Home About Section</h2>
      </div>

      <p style={{ marginBottom: 24, color: "#64748b", fontSize: 14 }}>
        This section appears below the banner on the homepage. Left: image, Right: content.
      </p>

      <div
        style={{
          background: "#fff",
          borderRadius: 16,
          padding: 32,
          boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
          maxWidth: 700,
        }}
      >
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: "block", marginBottom: 8, fontWeight: 600, color: "#475569", fontSize: 14 }}>
            Subtitle (e.g. "We Provide")
          </label>
          <input
            type="text"
            value={form.subtitle}
            onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
            placeholder="We Provide"
            style={styles.inputStyle}
          />
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: "block", marginBottom: 8, fontWeight: 600, color: "#475569", fontSize: 14 }}>
            Title (e.g. "Welcome to Spa Center")
          </label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Welcome to Spa Center"
            style={styles.inputStyle}
          />
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: "block", marginBottom: 8, fontWeight: 600, color: "#475569", fontSize: 14 }}>
            Description
          </label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Spread over two floors, our beautiful spa offers..."
            rows={5}
            style={{ ...styles.inputStyle, resize: "vertical" }}
          />
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={{ display: "block", marginBottom: 8, fontWeight: 600, color: "#475569", fontSize: 14 }}>
            Image (Left side)
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            style={{ ...styles.inputStyle, padding: 12, cursor: "pointer" }}
          />
          {data?.image && !file && (
            <p style={{ fontSize: 12, color: "#64748b", marginTop: 8 }}>
              Current image in use. Select new file to replace.
            </p>
          )}
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            ...styles.submitButton,
            opacity: saving ? 0.7 : 1,
            cursor: saving ? "not-allowed" : "pointer",
          }}
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
}
