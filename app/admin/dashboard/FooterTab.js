"use client";
import { useEffect, useState } from "react";
import * as styles from "./styles";

export default function FooterTab() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    description: "",
    phone: "",
    email: "",
    address: "",
    hours: "",
    copyright: "",
    facebookUrl: "",
    instagramUrl: "",
    threadsUrl: "",
    linkedinUrl: "",
  });
  const [file, setFile] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (data) {
      setForm({
        description: data.description || "",
        phone: data.phone || "",
        email: data.email || "",
        address: data.address || "",
        hours: data.hours || "",
        copyright: data.copyright || "",
        facebookUrl: data.facebookUrl || "",
        instagramUrl: data.instagramUrl || "",
        threadsUrl: data.threadsUrl || "",
        linkedinUrl: data.linkedinUrl || "",
      });
    }
  }, [data]);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/footer");
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
          fd.append("logo", file);
          Object.entries(form).forEach(([k, v]) => fd.append(k, v ?? ""));
          await fetch("/api/footer", { method: "PUT", body: fd });
        } else {
          await fetch("/api/footer", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(form),
          });
        }
      } else {
        const fd = new FormData();
        if (file) fd.append("logo", file);
        Object.entries(form).forEach(([k, v]) => fd.append(k, v ?? ""));
        await fetch("/api/footer", { method: "POST", body: fd });
      }
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
        <h2 style={styles.pageTitle}>Footer Settings</h2>
      </div>

      <p style={{ marginBottom: 24, color: "#64748b", fontSize: 14 }}>
        Update logo, description, contact info, and social links for the site footer.
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
          <label style={{ display: "block", marginBottom: 8, fontWeight: 600, color: "#475569", fontSize: 14 }}>Logo</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            style={{ ...styles.inputStyle, padding: 12, cursor: "pointer" }}
          />
          {data?.logo && !file && (
            <p style={{ fontSize: 12, color: "#64748b", marginTop: 8 }}>
              Current logo in use. Select new file to replace.
            </p>
          )}
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: "block", marginBottom: 8, fontWeight: 600, color: "#475569", fontSize: 14 }}>Description</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Your trusted partner for premium salon and dental care services..."
            rows={3}
            style={{ ...styles.inputStyle, resize: "vertical" }}
          />
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: "block", marginBottom: 8, fontWeight: 600, color: "#475569", fontSize: 14 }}>Contact Info</label>
          <input
            type="text"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="+91 90093 90054"
            style={styles.inputStyle}
          />
          <input
            type="text"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="info@veyona.in"
            style={{ ...styles.inputStyle, marginTop: 12 }}
          />
          <input
            type="text"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            placeholder="Noida"
            style={{ ...styles.inputStyle, marginTop: 12 }}
          />
          <input
            type="text"
            value={form.hours}
            onChange={(e) => setForm({ ...form, hours: e.target.value })}
            placeholder="Mon-Sat: 9 AM - 8 PM"
            style={{ ...styles.inputStyle, marginTop: 12 }}
          />
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: "block", marginBottom: 8, fontWeight: 600, color: "#475569", fontSize: 14 }}>Social Links</label>
          <input
            type="url"
            value={form.facebookUrl}
            onChange={(e) => setForm({ ...form, facebookUrl: e.target.value })}
            placeholder="Facebook URL"
            style={styles.inputStyle}
          />
          <input
            type="url"
            value={form.instagramUrl}
            onChange={(e) => setForm({ ...form, instagramUrl: e.target.value })}
            placeholder="Instagram URL"
            style={{ ...styles.inputStyle, marginTop: 12 }}
          />
          <input
            type="url"
            value={form.threadsUrl}
            onChange={(e) => setForm({ ...form, threadsUrl: e.target.value })}
            placeholder="Threads URL"
            style={{ ...styles.inputStyle, marginTop: 12 }}
          />
          <input
            type="url"
            value={form.linkedinUrl}
            onChange={(e) => setForm({ ...form, linkedinUrl: e.target.value })}
            placeholder="LinkedIn URL"
            style={{ ...styles.inputStyle, marginTop: 12 }}
          />
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={{ display: "block", marginBottom: 8, fontWeight: 600, color: "#475569", fontSize: 14 }}>Copyright Text</label>
          <input
            type="text"
            value={form.copyright}
            onChange={(e) => setForm({ ...form, copyright: e.target.value })}
            placeholder="Veyona.in Salon & Clinic. All rights reserved."
            style={styles.inputStyle}
          />
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
