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

export default function PageContentTab({ pageType, pageTitle }) {
  const [pageContent, setPageContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "",
    heroTitle: "",
    heroDescription: "",
    content: "",
    metaTitle: "",
    metaDescription: "",
    metaKeywords: "",
    active: true,
  });

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

  useEffect(() => {
    fetchPageContent();
  }, [pageType]);

  useEffect(() => {
    if (pageContent && editor) {
      setForm({
        title: pageContent.title || "",
        heroTitle: pageContent.heroTitle || pageContent.title || "",
        heroDescription: pageContent.heroDescription || "",
        content: pageContent.content || "",
        metaTitle: pageContent.metaTitle || "",
        metaDescription: pageContent.metaDescription || "",
        metaKeywords: pageContent.metaKeywords || "",
        active: pageContent.active !== false,
      });
      editor.commands.setContent(pageContent.content || "");
    }
  }, [pageContent, editor]);

  const fetchPageContent = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/page-content/${pageType}`);
      if (res.ok) {
        const data = await res.json();
        setPageContent(data);
      } else if (res.status === 404) {
        // Page content doesn't exist yet, use empty form
        setPageContent(null);
        setForm({
          title: pageTitle,
          heroTitle: pageTitle,
          heroDescription: "",
          content: "",
          metaTitle: "",
          metaDescription: "",
          metaKeywords: "",
          active: true,
        });
        if (editor) editor.commands.setContent("");
      }
    } catch (error) {
      toast.error("Failed to fetch page content");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    
    if (!form.title || !form.content) {
      toast.error("Title and content are required");
      return;
    }

    try {
      setSaving(true);
      const res = await fetch(`/api/page-content/${pageType}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const error = await res.json();
        toast.error(error.message || "Save failed");
        return;
      }

      const data = await res.json();
      setPageContent(data);
      toast.success("Page content saved successfully");
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setSaving(false);
    }
  };

  const ToolbarButton = ({ onClick, active, children, title }) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      style={{
        padding: "6px 12px",
        margin: "2px",
        border: "1px solid #e2e8f0",
        borderRadius: "6px",
        background: active ? "var(--accent-terracotta)" : "transparent",
        color: active ? "white" : "#374151",
        cursor: "pointer",
        fontSize: "14px",
        fontWeight: active ? 600 : 400,
      }}
    >
      {children}
    </button>
  );

  if (loading) {
    return (
      <div style={styles.emptyState}>
        <p style={styles.emptyStateText}>Loading...</p>
      </div>
    );
  }

  return (
    <div>
      <div style={styles.pageHeader}>
        <h2 style={styles.pageTitle}>{pageTitle} Management</h2>
      </div>

      <form onSubmit={handleSave}>
        <div style={{ background: "white", padding: "32px", borderRadius: "16px", boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}>
          {/* Basic Information */}
          <div style={{ marginBottom: "32px" }}>
            <h3 style={{ fontSize: "20px", fontWeight: 600, marginBottom: "20px", color: "#1f2937" }}>
              Basic Information
            </h3>
            <input
              type="text"
              placeholder="Page Title *"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              style={styles.inputStyle}
              required
            />
            <input
              type="text"
              placeholder="Hero Title"
              value={form.heroTitle}
              onChange={(e) => setForm({ ...form, heroTitle: e.target.value })}
              style={styles.inputStyle}
            />
            <textarea
              placeholder="Hero Description"
              value={form.heroDescription}
              onChange={(e) => setForm({ ...form, heroDescription: e.target.value })}
              style={styles.textareaStyle}
              rows={3}
            />
          </div>

          {/* Content Editor */}
          <div style={{ marginBottom: "32px" }}>
            <h3 style={{ fontSize: "20px", fontWeight: 600, marginBottom: "16px", color: "#1f2937" }}>
              Content *
            </h3>
            <div style={{ border: "1px solid #e2e8f0", borderRadius: "8px", marginBottom: "16px" }}>
              <div style={{ padding: "12px", borderBottom: "1px solid #e2e8f0", background: "#f9fafb", display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <ToolbarButton
                  onClick={() => editor?.chain().focus().toggleBold().run()}
                  active={editor?.isActive("bold")}
                  title="Bold"
                >
                  <strong>B</strong>
                </ToolbarButton>
                <ToolbarButton
                  onClick={() => editor?.chain().focus().toggleItalic().run()}
                  active={editor?.isActive("italic")}
                  title="Italic"
                >
                  <em>I</em>
                </ToolbarButton>
                <ToolbarButton
                  onClick={() => editor?.chain().focus().toggleUnderline().run()}
                  active={editor?.isActive("underline")}
                  title="Underline"
                >
                  <u>U</u>
                </ToolbarButton>
                {[1, 2, 3].map((level) => (
                  <ToolbarButton
                    key={level}
                    onClick={() => editor?.chain().focus().toggleHeading({ level }).run()}
                    active={editor?.isActive("heading", { level })}
                    title={`Heading ${level}`}
                  >
                    H{level}
                  </ToolbarButton>
                ))}
                <ToolbarButton
                  onClick={() => editor?.chain().focus().toggleBulletList().run()}
                  active={editor?.isActive("bulletList")}
                  title="Bullet List"
                >
                  •
                </ToolbarButton>
                <ToolbarButton
                  onClick={() => editor?.chain().focus().toggleOrderedList().run()}
                  active={editor?.isActive("orderedList")}
                  title="Numbered List"
                >
                  1.
                </ToolbarButton>
                <ToolbarButton
                  onClick={() => {
                    const url = window.prompt("Enter URL:");
                    if (url) editor?.chain().focus().setLink({ href: url }).run();
                  }}
                  active={editor?.isActive("link")}
                  title="Link"
                >
                  🔗
                </ToolbarButton>
              </div>
              <div style={{ padding: "16px", minHeight: "300px" }}>
                {editor && <EditorContent editor={editor} />}
              </div>
            </div>
          </div>

          {/* SEO Information */}
          <div style={{ marginBottom: "32px" }}>
            <h3 style={{ fontSize: "20px", fontWeight: 600, marginBottom: "20px", color: "#1f2937" }}>
              SEO Information
            </h3>
            <input
              type="text"
              placeholder="Meta Title"
              value={form.metaTitle}
              onChange={(e) => setForm({ ...form, metaTitle: e.target.value })}
              style={styles.inputStyle}
            />
            <textarea
              placeholder="Meta Description"
              value={form.metaDescription}
              onChange={(e) => setForm({ ...form, metaDescription: e.target.value })}
              style={styles.textareaStyle}
              rows={2}
            />
            <input
              type="text"
              placeholder="Meta Keywords (comma-separated)"
              value={form.metaKeywords}
              onChange={(e) => setForm({ ...form, metaKeywords: e.target.value })}
              style={styles.inputStyle}
            />
          </div>

          {/* Save Button */}
          <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
            <button
              type="submit"
              disabled={saving}
              style={{
                ...styles.submitButton,
                opacity: saving ? 0.7 : 1,
                cursor: saving ? "not-allowed" : "pointer",
              }}
            >
              {saving ? "Saving..." : "Save Content"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
