"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

export default function TopBlogs() {
  const [blogs, setBlogs] = useState([]);

  useEffect(() => {
    fetchBlogs();
  }, []);

  const fetchBlogs = async () => {
    try {
      const res = await fetch("/api/blog?limit=4");
      const data = await res.json();
      setBlogs(data);
    } catch (error) {
      console.error("Error fetching blogs:", error);
    }
  };

  if (blogs.length === 0) return null;

  return (
    <section style={{ padding: "80px 20px", background: "white" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 50 }}>
          <h2 style={{ fontSize: 42, fontWeight: "bold", marginBottom: 15, color: "#1f2937" }}>
            Latest from Our Blog
          </h2>
          <p style={{ fontSize: 18, color: "#6b7280" }}>
            Tips, trends, and insights to help you look and feel your best
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 30 }}>
          {blogs.map((blog) => (
            <Link
              key={blog._id}
              href={`/blog/${blog.slug}`}
              style={{
                background: "white",
                borderRadius: 12,
                overflow: "hidden",
                boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                cursor: "pointer",
                transition: "transform 0.2s, box-shadow 0.2s",
                textDecoration: "none",
                color: "inherit",
                display: "block",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-5px)";
                e.currentTarget.style.boxShadow = "0 8px 12px rgba(0,0,0,0.15)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 4px 6px rgba(0,0,0,0.1)";
              }}
            >
              {blog.image && (
                <div style={{ position: "relative", width: "100%", height: 200 }}>
                  <Image
                    src={blog.image}
                    alt={blog.title}
                    fill
                    style={{ objectFit: "contain" }}
                  />
                </div>
              )}
              <div style={{ padding: 24 }}>
                {blog.category && (
                  <span style={{
                    display: "inline-block",
                    padding: "4px 12px",
                    background: "#fef3c7",
                    color: "#92400e",
                    borderRadius: 20,
                    fontSize: 12,
                    fontWeight: 500,
                    marginBottom: 12,
                  }}>
                    {blog.category}
                  </span>
                )}
                <h3 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12, color: "#1f2937" }}>
                  {blog.title}
                </h3>
                <p style={{ color: "#6b7280", fontSize: 14, lineHeight: 1.6, marginBottom: 16 }}>
                  {blog.excerpt}
                </p>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12, color: "#9ca3af" }}>
                  <span>By {blog.author}</span>
                  <span>{new Date(blog.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div style={{ textAlign: "center", marginTop: 40 }}>
          <Link
            href="/blog"
            style={{
              display: "inline-block",
              padding: "14px 32px",
              background: "var(--accent-terracotta)",
              color: "white",
              borderRadius: 8,
              textDecoration: "none",
              fontSize: 16,
              fontWeight: 600,
            }}
          >
            View All Blogs
          </Link>
        </div>
      </div>
    </section>
  );
}










