"use client";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import * as styles from "./styles";

export default function AppDownloadTab() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [file, setFile] = useState(null);
  const [form, setForm] = useState({
    title: "Get the Salon & Clinic App",
    description: "We'll send you the app link soon—just open it on your phone to download.",
    subtitle: "Available soon on iOS and Android",
    downloadText: "Download our app soon — Salon & Clinic booking made easy.",
    shareButtonText: "Share App Link",
    googlePlayUrl: "#",
    appStoreUrl: "#",
    footerText: "Or you can also access our services at www.veyona.in from your mobile phone.",
    websiteUrl: "https://www.veyona.in",
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (data) {
      setForm({
        title: data.title || "Get the Salon & Clinic App",
        description: data.description || "We'll send you the app link soon—just open it on your phone to download.",
        subtitle: data.subtitle || "Available soon on iOS and Android",
        downloadText: data.downloadText || "Download our app soon — Salon & Clinic booking made easy.",
        shareButtonText: data.shareButtonText || "Share App Link",
        googlePlayUrl: data.googlePlayUrl || "#",
        appStoreUrl: data.appStoreUrl || "#",
        footerText: data.footerText || "Or you can also access our services at www.veyona.in from your mobile phone.",
        websiteUrl: data.websiteUrl || "https://www.veyona.in",
      });
    }
  }, [data]);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/app-download");
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
        const fd = new FormData();
        fd.append("title", form.title);
        fd.append("description", form.description);
        fd.append("subtitle", form.subtitle);
        fd.append("downloadText", form.downloadText);
        fd.append("shareButtonText", form.shareButtonText);
        fd.append("googlePlayUrl", form.googlePlayUrl);
        fd.append("appStoreUrl", form.appStoreUrl);
        fd.append("footerText", form.footerText);
        fd.append("websiteUrl", form.websiteUrl);
        if (file) fd.append("image", file);

        await fetch("/api/app-download", { method: "PUT", body: fd });
      } else {
        const fd = new FormData();
        fd.append("title", form.title);
        fd.append("description", form.description);
        fd.append("subtitle", form.subtitle);
        fd.append("downloadText", form.downloadText);
        fd.append("shareButtonText", form.shareButtonText);
        fd.append("googlePlayUrl", form.googlePlayUrl);
        fd.append("appStoreUrl", form.appStoreUrl);
        fd.append("footerText", form.footerText);
        fd.append("websiteUrl", form.websiteUrl);
        if (file) fd.append("image", file);

        await fetch("/api/app-download", { method: "POST", body: fd });
      }
      toast.success("Saved successfully");
      setFile(null);
      fetchData();
    } catch (err) {
      toast.error(err.message || "Failed to save");
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
        <h2 style={styles.pageTitle}>App Download Section</h2>
      </div>

      <p style={{ marginBottom: 24, color: "#64748b", fontSize: 14 }}>
        Edit the "Get the Salon & Clinic App" section on the homepage. Text and image are editable.
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
            Title
          </label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Get the Salon & Clinic App"
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
            placeholder="We'll send you the app link soon..."
            rows={3}
            style={{ ...styles.inputStyle, resize: "vertical" }}
          />
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: "block", marginBottom: 8, fontWeight: 600, color: "#475569", fontSize: 14 }}>
            Subtitle (e.g. "Available soon on iOS and Android")
          </label>
          <input
            type="text"
            value={form.subtitle}
            onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
            placeholder="Available soon on iOS and Android"
            style={styles.inputStyle}
          />
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: "block", marginBottom: 8, fontWeight: 600, color: "#475569", fontSize: 14 }}>
            Download Text
          </label>
          <input
            type="text"
            value={form.downloadText}
            onChange={(e) => setForm({ ...form, downloadText: e.target.value })}
            placeholder="Download our app soon — Salon & Clinic booking made easy."
            style={styles.inputStyle}
          />
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: "block", marginBottom: 8, fontWeight: 600, color: "#475569", fontSize: 14 }}>
            Share Button Text
          </label>
          <input
            type="text"
            value={form.shareButtonText}
            onChange={(e) => setForm({ ...form, shareButtonText: e.target.value })}
            placeholder="Share App Link"
            style={styles.inputStyle}
          />
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: "block", marginBottom: 8, fontWeight: 600, color: "#475569", fontSize: 14 }}>
            Google Play URL
          </label>
          <input
            type="url"
            value={form.googlePlayUrl}
            onChange={(e) => setForm({ ...form, googlePlayUrl: e.target.value })}
            placeholder="https://play.google.com/..."
            style={styles.inputStyle}
          />
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: "block", marginBottom: 8, fontWeight: 600, color: "#475569", fontSize: 14 }}>
            App Store URL
          </label>
          <input
            type="url"
            value={form.appStoreUrl}
            onChange={(e) => setForm({ ...form, appStoreUrl: e.target.value })}
            placeholder="https://apps.apple.com/..."
            style={styles.inputStyle}
          />
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: "block", marginBottom: 8, fontWeight: 600, color: "#475569", fontSize: 14 }}>
            Footer Text
          </label>
          <input
            type="text"
            value={form.footerText}
            onChange={(e) => setForm({ ...form, footerText: e.target.value })}
            placeholder="Or you can also access our services at www.veyona.in..."
            style={styles.inputStyle}
          />
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: "block", marginBottom: 8, fontWeight: 600, color: "#475569", fontSize: 14 }}>
            Website URL
          </label>
          <input
            type="url"
            value={form.websiteUrl}
            onChange={(e) => setForm({ ...form, websiteUrl: e.target.value })}
            placeholder="https://www.veyona.in"
            style={styles.inputStyle}
          />
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={{ display: "block", marginBottom: 8, fontWeight: 600, color: "#475569", fontSize: 14 }}>
            Image (Left side - Salon/Clinic photos)
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
