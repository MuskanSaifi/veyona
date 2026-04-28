"use client";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import * as styles from "./styles";

const DEFAULT_FAQS = [
  { question: "What services does Veyona offer?", answer: "Veyona offers premium salon services like haircuts, facials, styling, and grooming, along with professional dental services including cleaning, whitening, root canal treatments, and cosmetic dentistry." },
  { question: "Do I need to book an appointment in advance?", answer: "Yes, we recommend booking an appointment in advance to ensure availability with our expert salon stylists and certified dentists." },
  { question: "Are your dental treatments safe and hygienic?", answer: "Absolutely. We follow strict sterilization protocols and use modern dental equipment." },
  { question: "Can I book both salon and dental services together?", answer: "Yes, you can book salon and dental services together for a complete wellness experience." },
  { question: "Do you have an app for booking services?", answer: "Yes, Veyona is available on Android and iOS for easy booking and management." },
];

export default function FaqTab() {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ question: "", answer: "", order: 0 });

  const fetchFaqs = async () => {
    try {
      const res = await fetch("/api/faq?all=true");
      const data = await res.json();
      setFaqs(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error("Failed to fetch FAQs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFaqs();
  }, []);

  useEffect(() => {
    if (editing) {
      setForm({
        question: editing.question || "",
        answer: editing.answer || "",
        order: editing.order ?? 0,
      });
    } else {
      setForm({ question: "", answer: "", order: faqs.length });
    }
  }, [editing, faqs.length]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.question.trim() || !form.answer.trim()) {
      toast.error("Question and answer are required");
      return;
    }
    try {
      if (editing) {
        await fetch(`/api/faq/${editing._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        toast.success("FAQ updated");
      } else {
        await fetch("/api/faq", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        toast.success("FAQ added");
      }
      setOpen(false);
      setEditing(null);
      fetchFaqs();
    } catch (err) {
      toast.error(err.message || "Failed to save");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this FAQ?")) return;
    try {
      await fetch(`/api/faq/${id}`, { method: "DELETE" });
      toast.success("FAQ deleted");
      fetchFaqs();
    } catch (err) {
      toast.error("Failed to delete");
    }
  };

  const loadDefaults = async () => {
    if (!confirm("Add default FAQs? This will add 5 pre-defined questions.")) return;
    try {
      for (let i = 0; i < DEFAULT_FAQS.length; i++) {
        await fetch("/api/faq", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...DEFAULT_FAQS[i], order: i }),
        });
      }
      toast.success("Default FAQs added");
      fetchFaqs();
    } catch (err) {
      toast.error("Failed to add defaults");
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
        <h2 style={styles.pageTitle}>FAQ Section</h2>
        <div style={{ display: "flex", gap: 12 }}>
          {faqs.length === 0 && (
            <button onClick={loadDefaults} style={styles.cancelButton}>
              Load Default FAQs
            </button>
          )}
          <button onClick={() => { setEditing(null); setOpen(true); }} style={styles.addButton}>
            + Add FAQ
          </button>
        </div>
      </div>

      <p style={{ marginBottom: 24, color: "#64748b", fontSize: 14 }}>
        Manage Frequently Asked Questions shown on the homepage.
      </p>

      {faqs.length === 0 ? (
        <div style={styles.emptyState}>
          <p style={styles.emptyStateText}>No FAQs yet. Add one or load default FAQs.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {faqs.map((faq, i) => (
            <div
              key={faq._id}
              style={{
                ...styles.card,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: 16,
              }}
            >
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 600, color: "#1e293b", marginBottom: 8 }}>
                  {faq.question}
                </p>
                <p style={{ color: "#64748b", fontSize: 14, lineHeight: 1.5 }}>
                  {faq.answer}
                </p>
              </div>
              <div style={styles.actionButtons}>
                <button
                  onClick={() => { setEditing(faq); setOpen(true); }}
                  style={styles.editButton}
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(faq._id)}
                  style={styles.deleteButton}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {open && (
        <div style={styles.modalOverlay} onClick={() => setOpen(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 style={styles.modalTitle}>{editing ? "Edit FAQ" : "Add FAQ"}</h3>
            <form onSubmit={handleSave}>
              <label style={{ display: "block", marginBottom: 8, fontWeight: 600, color: "#475569", fontSize: 14 }}>
                Question
              </label>
              <input
                type="text"
                value={form.question}
                onChange={(e) => setForm({ ...form, question: e.target.value })}
                placeholder="What services does Veyona offer?"
                style={styles.inputStyle}
                required
              />
              <label style={{ display: "block", marginBottom: 8, fontWeight: 600, color: "#475569", fontSize: 14 }}>
                Answer
              </label>
              <textarea
                value={form.answer}
                onChange={(e) => setForm({ ...form, answer: e.target.value })}
                placeholder="Veyona offers..."
                rows={4}
                style={styles.textareaStyle}
                required
              />
              <div style={styles.modalButtons}>
                <button type="button" onClick={() => setOpen(false)} style={styles.cancelButton}>
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
