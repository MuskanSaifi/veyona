"use client";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Heading from "@tiptap/extension-heading";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import * as styles from "./styles";
import mobile from "./AdminMobileCards.module.css";

export default function BlogTab() {
  const [blogs, setBlogs] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [viewMore, setViewMore] = useState(null);

  const [form, setForm] = useState({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    metaTitle: "",
    metaDescription: "",
    metaKeywords: "",
    author: "Admin",
    category: "",
    tags: "",
    featured: false,
    active: true,
    image: null,
  });

  /* ---------------- TIPTAP EDITOR ---------------- */
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        blockquote: true,
        codeBlock: true,
        horizontalRule: true,
      }),
      Underline,
      Image.configure({
        inline: true,
        allowBase64: false,
      }),
      Heading.configure({ levels: [1, 2, 3, 4, 5, 6] }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-blue-600 underline",
        },
      }),
    ],
    immediatelyRender: false,
    content: "",
    onUpdate: ({ editor }) => {
      setForm((p) => ({ ...p, content: editor.getHTML() }));
    },
  });

  /* ---------------- FETCH BLOGS ---------------- */
  const fetchBlogs = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/blog?limit=1000");
      if (res.ok) {
        const data = await res.json();
        setBlogs(data);
      }
    } catch (error) {
      toast.error("Failed to fetch blogs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlogs();
  }, []);

  /* ---------------- HELPERS ---------------- */
  const slugify = (v) =>
    v
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

  const reset = () => {
    setForm({
      title: "",
      slug: "",
      excerpt: "",
      content: "",
      metaTitle: "",
      metaDescription: "",
      metaKeywords: "",
      author: "Admin",
      category: "",
      tags: "",
      featured: false,
      active: true,
      image: null,
    });
    setImagePreview(null);
    editor?.commands.setContent("");
    setEditing(null);
  };

  /* ---------------- IMAGE HANDLING ---------------- */
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setForm({ ...form, image: file });
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadInlineImage = async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";

    input.onchange = async () => {
      const file = input.files[0];
      if (!file) return;

      try {
        toast.loading("Uploading image...");
        const fd = new FormData();
        fd.append("file", file);

        const res = await fetch("/api/blog/upload-content-image", {
          method: "POST",
          body: fd,
        });

        if (!res.ok) {
          toast.error("Image upload failed");
          return;
        }

        const data = await res.json();
        editor
          .chain()
          .focus()
          .setImage({
            src: data.url,
            "data-public-id": data.public_id,
          })
          .run();
        toast.dismiss();
        toast.success("Image uploaded");
      } catch (error) {
        toast.error("Image upload failed");
      }
    };
    input.click();
  };

  const setLink = () => {
    const url = window.prompt("Enter URL:");
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  /* ---------------- SAVE BLOG ---------------- */
  const saveBlog = async (e) => {
    e.preventDefault();

    if (!form.title || !form.excerpt || !form.content) {
      toast.error("Title, excerpt, and content are required");
      return;
    }

    try {
      setLoading(true);
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (v !== null && v !== undefined) {
          if (k === "image" && v instanceof File) {
            fd.append(k, v);
          } else {
            fd.append(k, String(v));
        }
        }
      });

      const res = await fetch(
        editing ? `/api/blog/${editing.slug}` : "/api/blog",
        { method: editing ? "PUT" : "POST", body: fd }
      );

      if (!res.ok) {
        const error = await res.json();
        toast.error(error.message || "Save failed");
        return;
      }

      toast.success(editing ? "Blog updated successfully" : "Blog created successfully");
      fetchBlogs();
      setOpen(false);
      reset();
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- DELETE BLOG ---------------- */
  const deleteBlog = async (slug) => {
    if (!confirm("Are you sure you want to delete this blog permanently?")) return;

    try {
      const res = await fetch(`/api/blog/${slug}`, { method: "DELETE" });
      if (!res.ok) {
        toast.error("Delete failed");
        return;
      }

      toast.success("Blog deleted successfully");
      fetchBlogs();
    } catch (error) {
      toast.error("Delete failed");
    }
  };

  /* ---------------- EDIT BLOG ---------------- */
  const editBlog = async (b) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/blog/${b.slug}?admin=true`);
      if (!res.ok) {
        toast.error("Failed to load blog details for editing");
        return;
      }
      const blog = await res.json();
      setEditing(blog);
      setForm({
        ...blog,
        tags: blog.tags?.join(", ") || "",
        image: null,
      });
      setImagePreview(blog.image || null);
      editor?.commands.setContent(blog.content || "");
      setOpen(true);
    } catch (error) {
      toast.error("Failed to load blog details");
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- TOOLBAR BUTTON ---------------- */
  const ToolbarButton = ({ onClick, active, children, title }) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      style={{
        ...toolbarBtn,
        ...(active ? toolbarBtnActive : {}),
      }}
      onMouseEnter={(e) => {
        if (!active) e.currentTarget.style.background = "#f1f5f9";
      }}
      onMouseLeave={(e) => {
        if (!active) e.currentTarget.style.background = "transparent";
      }}
    >
      {children}
    </button>
  );

  /* ---------------- UI ---------------- */
  return (
    <div>
      <div style={styles.pageHeader}>
        <h2 style={styles.pageTitle}>Blog Management</h2>
        <button
          style={styles.addButton}
          onClick={() => {
            reset();
            setOpen(true);
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "0 6px 16px rgba(99, 102, 241, 0.4)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 4px 12px rgba(99, 102, 241, 0.3)";
          }}
        >
          <span>+</span> Add New Blog
        </button>
      </div>

      {loading && blogs.length === 0 ? (
        <div style={styles.emptyState}>
          <p style={styles.emptyStateText}>Loading blogs...</p>
        </div>
      ) : blogs.length === 0 ? (
        <div style={styles.emptyState}>
          <p style={styles.emptyStateText}>No blogs yet. Create your first blog!</p>
        </div>
      ) : (
        <>
        {/* Mobile cards */}
        <div className={mobile.mobileCards}>
          {blogs.map((b) => (
            <div key={b._id} className={mobile.card}>
              <div className={mobile.cardHeader}>
                <div>
                  <div className={mobile.cardTitle}>{b.title}</div>
                  <div className={mobile.cardMeta}>
                    {(b.category || "N/A")} • {b.author || "Admin"} • {b.views || 0} views
                  </div>
                </div>
                <span className={mobile.badge} style={{ background: b.active ? "#dcfce7" : "#fee2e2", color: b.active ? "#166534" : "#991b1b" }}>
                  {b.active ? "Active" : "Inactive"}
                </span>
              </div>
              <div className={mobile.summary}>
                <strong>Created:</strong> {new Date(b.createdAt).toLocaleDateString()}
                {b.featured ? (
                  <>
                    <br />
                    <strong>Featured:</strong> Yes
                  </>
                ) : null}
              </div>
              <button type="button" className={mobile.viewMoreBtn} onClick={() => setViewMore(b)}>
                View More
              </button>
            </div>
          ))}
        </div>

        {/* Desktop table */}
        <div className={mobile.hideOnMobile} style={styles.table.wrapper}>
          <table style={styles.table.table}>
            <thead>
              <tr>
                <th style={styles.table.th}>Image</th>
                <th style={styles.table.th}>Title</th>
                <th style={styles.table.th}>Category</th>
                <th style={styles.table.th}>Author</th>
                <th style={styles.table.th}>Views</th>
                <th style={styles.table.th}>Status</th>
                <th style={styles.table.th}>Created</th>
                <th style={styles.table.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {blogs.map((b) => (
                <tr key={b._id}>
                  <td style={styles.table.td}>
                    {b.image ? (
                      <img src={b.image} alt={b.title} style={styles.table.image} />
                    ) : (
                      <div
                        style={{
                          width: "240px",
                          height: "100px",
                          borderRadius: "14px",
                          background: "linear-gradient(135deg, var(--accent-terracotta) 0%, var(--accent-coral) 100%)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "white",
                          fontSize: "14px",
                          fontWeight: "bold",
                          margin: "0 auto",
                        }}
                      >
                        No Image
                      </div>
                    )}
                  </td>
                  <td style={styles.table.td}>
                    <p style={styles.table.text}>{b.title}</p>
                    {b.featured && (
                      <span
                        style={{
                          ...styles.table.status,
                          background: "#dbeafe",
                          color: "#1e40af",
                          fontSize: "11px",
                          padding: "4px 8px",
                          minWidth: "auto",
                          marginTop: "4px",
                        }}
                      >
                        ⭐ Featured
                      </span>
                    )}
                  </td>
                  <td style={styles.table.td}>
                    {b.category ? (
                      <span
                        style={{
                          ...styles.table.status,
                          background: "#fef3c7",
                          color: "#92400e",
                          fontSize: "12px",
                          padding: "6px 12px",
                        }}
                      >
                        {b.category}
                      </span>
                    ) : (
                      <span style={styles.table.textSmall}>N/A</span>
                    )}
                  </td>
                  <td style={styles.table.td}>
                    <p style={styles.table.textSmall}>{b.author || "Admin"}</p>
                  </td>
                  <td style={styles.table.td}>
                    <p style={styles.table.textSmall}>{b.views || 0} views</p>
                  </td>
                  <td style={styles.table.td}>
                    <span
                      style={{
                        ...styles.table.status,
                        background: b.active ? "#dcfce7" : "#fee2e2",
                        color: b.active ? "#166534" : "#991b1b",
                      }}
                    >
                      {b.active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td style={styles.table.td}>
                    <p style={styles.table.textSmall}>
                      {new Date(b.createdAt).toLocaleDateString()}
                    </p>
                  </td>
                  <td style={styles.table.td}>
                    <div style={styles.table.actions}>
                      <button
                        onClick={() => editBlog(b)}
                        style={{
                          ...styles.table.btn,
                          background: "linear-gradient(135deg, var(--accent-terracotta) 0%, var(--accent-coral) 100%)",
                        }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteBlog(b.slug)}
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
              <div className={mobile.modalTitle}>Blog Details</div>
              <button type="button" className={mobile.modalClose} onClick={() => setViewMore(null)} aria-label="Close">✕</button>
            </div>
            <div className={mobile.modalBody}>
              <div className={mobile.detailRow}>
                <div className={mobile.detailLabel}>Title</div>
                <div className={mobile.detailValue}>{viewMore.title}</div>
              </div>
              <div className={mobile.detailRow}>
                <div className={mobile.detailLabel}>Slug</div>
                <div className={mobile.detailValue} style={{ fontFamily: "monospace" }}>{viewMore.slug}</div>
              </div>
              <div className={mobile.detailSection}>
                <div className={mobile.detailSectionTitle}>Meta</div>
                <div style={{ fontSize: 14, lineHeight: 1.8 }}>
                  <div>Category: {viewMore.category || "—"}</div>
                  <div>Author: {viewMore.author || "Admin"}</div>
                  <div>Views: {viewMore.views || 0}</div>
                  <div>Featured: {viewMore.featured ? "Yes" : "No"}</div>
                  <div>Status: {viewMore.active ? "Active" : "Inactive"}</div>
                  <div>Created: {new Date(viewMore.createdAt).toLocaleString()}</div>
                </div>
              </div>
              <div className={mobile.detailSection}>
                <div className={mobile.detailSectionTitle}>Excerpt</div>
                <div style={{ fontSize: 14, lineHeight: 1.7 }}>{viewMore.excerpt || "—"}</div>
              </div>
              <div className={mobile.modalActions}>
                <button type="button" className={mobile.primaryBtn} onClick={() => { setViewMore(null); editBlog(viewMore); }}>
                  Edit
                </button>
                <button type="button" className={mobile.dangerBtn} onClick={() => { deleteBlog(viewMore.slug); setViewMore(null); }}>
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {open && (
        <div style={styles.modalOverlay} onClick={() => { setOpen(false); reset(); }}>
          <div style={modalContent} onClick={(e) => e.stopPropagation()}>
            <h2 style={styles.modalTitle}>
              {editing ? "Edit Blog" : "Create New Blog"}
            </h2>
            <form onSubmit={saveBlog} style={formStyle}>
              {/* Basic Information */}
              <div style={sectionStyle}>
                <h3 style={sectionTitle}>Basic Information</h3>
                <Input
                  label="Title *"
                  value={form.title}
                  onChange={(v) => setForm({ ...form, title: v, slug: slugify(v) })}
                  required
                />
                <Input
                  label="Slug"
                  value={form.slug}
                  onChange={(v) => setForm({ ...form, slug: v })}
                />
                <Textarea
                  label="Excerpt *"
                  rows={3}
                  value={form.excerpt}
                  onChange={(v) => setForm({ ...form, excerpt: v })}
                  required
                />
                <Input
                  label="Author"
                  value={form.author}
                  onChange={(v) => setForm({ ...form, author: v })}
                />
                <Input
                  label="Category"
                  value={form.category}
                  onChange={(v) => setForm({ ...form, category: v })}
                  placeholder="e.g., Beauty Tips, Hair Care"
                />
                <Input
                  label="Tags (comma-separated)"
                  value={form.tags}
                  onChange={(v) => setForm({ ...form, tags: v })}
                  placeholder="e.g., hair, beauty, tips"
                />
              </div>

              {/* Feature Image */}
              <div style={sectionStyle}>
                <h3 style={sectionTitle}>Feature Image</h3>
                {imagePreview && (
                  <div style={{ marginBottom: "16px" }}>
                    <img
                      src={imagePreview}
                      alt="Preview"
                      style={{
                        width: "100%",
                        maxHeight: "300px",
                        objectFit: "cover",
                        borderRadius: "8px",
                        border: "2px solid #e2e8f0",
                      }}
                    />
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  style={styles.inputStyle}
                />
              </div>

              {/* Content Editor */}
              <div style={sectionStyle}>
                <h3 style={sectionTitle}>Content *</h3>
                <div style={toolbarContainer}>
                  <div style={toolbarGroup}>
                    <ToolbarButton
                      onClick={() => editor.chain().focus().toggleBold().run()}
                      active={editor?.isActive("bold")}
                      title="Bold"
                    >
                      <strong>B</strong>
                    </ToolbarButton>
                    <ToolbarButton
                      onClick={() => editor.chain().focus().toggleItalic().run()}
                      active={editor?.isActive("italic")}
                      title="Italic"
                    >
                      <em>I</em>
                    </ToolbarButton>
                    <ToolbarButton
                      onClick={() => editor.chain().focus().toggleUnderline().run()}
                      active={editor?.isActive("underline")}
                      title="Underline"
                    >
                      <u>U</u>
                    </ToolbarButton>
                  </div>

                  <div style={toolbarGroup}>
                    {[1, 2, 3].map((level) => (
                      <ToolbarButton
                        key={level}
                        onClick={() =>
                          editor.chain().focus().toggleHeading({ level }).run()
                        }
                        active={editor?.isActive("heading", { level })}
                        title={`Heading ${level}`}
                      >
                        H{level}
                      </ToolbarButton>
                    ))}
                  </div>

                  <div style={toolbarGroup}>
                    <ToolbarButton
                      onClick={() => editor.chain().focus().toggleBulletList().run()}
                      active={editor?.isActive("bulletList")}
                      title="Bullet List"
                    >
                      • List
                    </ToolbarButton>
                    <ToolbarButton
                      onClick={() => editor.chain().focus().toggleOrderedList().run()}
                      active={editor?.isActive("orderedList")}
                      title="Numbered List"
                    >
                      1. List
                    </ToolbarButton>
                    <ToolbarButton
                      onClick={() => editor.chain().focus().toggleBlockquote().run()}
                      active={editor?.isActive("blockquote")}
                      title="Quote"
                    >
                      "
                    </ToolbarButton>
                    <ToolbarButton
                      onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                      active={editor?.isActive("codeBlock")}
                      title="Code Block"
                    >
                      {'</>'}
                    </ToolbarButton>
                  </div>

                  <div style={toolbarGroup}>
                    <ToolbarButton onClick={setLink} title="Insert Link">
                      🔗 Link
                    </ToolbarButton>
                    <ToolbarButton onClick={uploadInlineImage} title="Insert Image">
                      🖼️ Image
                    </ToolbarButton>
                    <ToolbarButton
                      onClick={() => editor.chain().focus().setHorizontalRule().run()}
                      title="Horizontal Rule"
                    >
                      ─
                    </ToolbarButton>
                  </div>
                </div>
                <div style={editorContainer}>
                  <EditorContent editor={editor} />
                </div>
              </div>

              {/* SEO Settings */}
              <div style={sectionStyle}>
                <h3 style={sectionTitle}>SEO Settings</h3>
                <Input
                  label="Meta Title"
                  value={form.metaTitle}
                  onChange={(v) => setForm({ ...form, metaTitle: v })}
                />
                <Textarea
                  label="Meta Description"
                  rows={2}
                  value={form.metaDescription}
                  onChange={(v) => setForm({ ...form, metaDescription: v })}
                />
                <Input
                  label="Meta Keywords"
                  value={form.metaKeywords}
                  onChange={(v) => setForm({ ...form, metaKeywords: v })}
                  placeholder="comma-separated keywords"
                />
              </div>

              {/* Settings */}
              <div style={sectionStyle}>
                <h3 style={sectionTitle}>Settings</h3>
                <div style={checkboxContainer}>
                  <label style={checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={form.featured}
                      onChange={(e) =>
                        setForm({ ...form, featured: e.target.checked })
                      }
                      style={{ marginRight: "8px" }}
                    />
                    Featured Blog
                  </label>
                  <label style={checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={form.active}
                      onChange={(e) =>
                        setForm({ ...form, active: e.target.checked })
                      }
                      style={{ marginRight: "8px" }}
                    />
                    Active (Published)
                  </label>
                </div>
              </div>

              {/* Form Actions */}
              <div style={styles.modalButtons}>
                <button
                  type="submit"
                  style={styles.submitButton}
                  disabled={loading}
                  onMouseEnter={(e) => {
                    if (!loading) {
                      e.currentTarget.style.transform = "translateY(-2px)";
                      e.currentTarget.style.boxShadow = "0 6px 16px rgba(99, 102, 241, 0.4)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!loading) {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "0 4px 12px rgba(99, 102, 241, 0.3)";
                    }
                  }}
                >
                  {loading ? "Saving..." : editing ? "Update Blog" : "Create Blog"}
                </button>
                <button
                  type="button"
                  style={styles.cancelButton}
                  onClick={() => {
                    setOpen(false);
                    reset();
                  }}
                  disabled={loading}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------- COMPONENTS ---------------- */
const Input = ({ label, value, onChange, placeholder, required, type = "text" }) => (
  <div style={{ marginBottom: "20px" }}>
    <label style={labelStyle}>
      {label}
      {required && <span style={{ color: "#ef4444" }}> *</span>}
    </label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      required={required}
      style={styles.inputStyle}
    />
  </div>
);

const Textarea = ({ label, rows, value, onChange, placeholder, required }) => (
  <div style={{ marginBottom: "20px" }}>
    <label style={labelStyle}>
      {label}
      {required && <span style={{ color: "#ef4444" }}> *</span>}
    </label>
    <textarea
      rows={rows}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      required={required}
      style={styles.textareaStyle}
    />
  </div>
);

/* ---------------- STYLES ---------------- */
const modalContent = {
  ...styles.modal,
  width: "95%",
  maxWidth: "1000px",
  maxHeight: "95vh",
  overflowY: "auto",
};

const formStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "24px",
};

const sectionStyle = {
  padding: "20px",
  background: "#f8fafc",
  borderRadius: "12px",
  border: "1px solid #e2e8f0",
};

const sectionTitle = {
  fontSize: "18px",
  fontWeight: 600,
  marginBottom: "16px",
  color: "#1e293b",
  paddingBottom: "12px",
  borderBottom: "2px solid #e2e8f0",
};

const labelStyle = {
  display: "block",
  marginBottom: "8px",
  fontSize: "14px",
  fontWeight: 600,
  color: "#475569",
};

const toolbarContainer = {
  display: "flex",
  flexWrap: "wrap",
  gap: "8px",
  padding: "12px",
  background: "#f8fafc",
  borderRadius: "8px",
  border: "2px solid #e2e8f0",
  marginBottom: "12px",
};

const toolbarGroup = {
  display: "flex",
  gap: "4px",
  paddingRight: "12px",
  borderRight: "1px solid #cbd5e1",
};

const toolbarBtn = {
  padding: "8px 12px",
  border: "1px solid #cbd5e1",
  borderRadius: "6px",
  background: "transparent",
  cursor: "pointer",
  fontSize: "14px",
  fontWeight: 500,
  color: "#475569",
  transition: "all 0.2s ease",
  display: "flex",
  alignItems: "center",
  gap: "4px",
};

const toolbarBtnActive = {
  background: "var(--accent-terracotta)",
  color: "white",
  borderColor: "var(--accent-terracotta)",
};

const editorContainer = {
  border: "2px solid #e2e8f0",
  borderRadius: "8px",
  padding: "16px",
  minHeight: "400px",
  background: "white",
  fontSize: "16px",
  lineHeight: "1.6",
};

const checkboxContainer = {
  display: "flex",
  flexDirection: "column",
  gap: "12px",
};

const checkboxLabel = {
  display: "flex",
  alignItems: "center",
  fontSize: "15px",
  fontWeight: 500,
  color: "#475569",
  cursor: "pointer",
};
