"use client";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import * as styles from "./styles";
import mobile from "./AdminMobileCards.module.css";

export default function ReelTab() {
  const [reels, setReels] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [videoPreview, setVideoPreview] = useState(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    video: null,
  });

  /* ---------------- FETCH REELS ---------------- */
  const fetchReels = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/reels");
      if (res.ok) {
        const data = await res.json();
        setReels(data);
      }
    } catch (error) {
      toast.error("Failed to fetch reels");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReels();
  }, []);

  /* ---------------- HELPERS ---------------- */
  const reset = () => {
    setForm({
      title: "",
      description: "",
      video: null,
    });
    setVideoPreview(null);
    setEditing(null);
    setOpen(false);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setForm((p) => ({ ...p, video: file }));
      setVideoPreview(URL.createObjectURL(file));
    }
  };

  /* ---------------- SUBMIT ---------------- */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.video) {
      toast.error("Title and video are required");
      return;
    }

    const formData = new FormData();
    formData.append("title", form.title);
    formData.append("description", form.description);
    formData.append("video", form.video);

    try {
      setLoading(true);
      const res = await fetch("/api/reels", {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        toast.success("Reel uploaded successfully");
        reset();
        fetchReels();
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to upload reel");
      }
    } catch (error) {
      toast.error("Failed to upload reel");
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- DELETE ---------------- */
  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this reel?")) return;

    try {
      setLoading(true);
      const res = await fetch(`/api/reels/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Reel deleted successfully");
        fetchReels();
      } else {
        toast.error("Failed to delete reel");
      }
    } catch (error) {
      toast.error("Failed to delete reel");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Reels Management</h1>
        <button
          style={styles.addButton}
          onClick={() => setOpen(true)}
        >
          Add Reel
        </button>
      </div>

      {/* LIST */}
      <div style={styles.list}>
        {loading && <p>Loading...</p>}
        {reels.map((reel) => (
          <div key={reel._id} style={styles.item}>
            <div style={styles.itemContent}>
              <h3>{reel.title}</h3>
              <p>{reel.description}</p>
              <video src={reel.video} controls width="200" />
            </div>
            <div style={styles.itemActions}>
              <button
                style={styles.deleteButton}
                onClick={() => handleDelete(reel._id)}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL */}
      {open && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <h2>Add Reel</h2>
            <form onSubmit={handleSubmit}>
              <div style={styles.formGroup}>
                <label>Title</label>
                <input
                  type="text"
                  style={styles.inputStyle}
                  value={form.title}
                  onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                  required
                />
              </div>
              <div style={styles.formGroup}>
                <label>Description</label>
                <textarea
                  style={styles.textareaStyle}
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                />
              </div>
              <div style={styles.formGroup}>
                <label>Video</label>
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleFileChange}
                  required
                />
                {videoPreview && (
                  <video src={videoPreview} controls width="200" />
                )}
              </div>
              <div style={styles.modalActions}>
                <button type="button" style={styles.cancelButton} onClick={reset}>
                  Cancel
                </button>
                <button type="submit" style={styles.submitButton} disabled={loading}>
                  {loading ? "Uploading..." : "Upload"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}