"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

export default function BlogPage() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all"); // all, featured
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchBlogs();
  }, []);

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/blog");
      if (!res.ok) {
        throw new Error("Failed to fetch blogs");
      }
      const data = await res.json();
      setBlogs(data);
    } catch (error) {
      console.error("Error fetching blogs:", error);
      setError("Failed to load blogs. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  // Filter and search blogs
  const filteredBlogs = blogs.filter((blog) => {
    const matchesFilter = filter === "all" || (filter === "featured" && blog.featured);
    const matchesSearch =
      !searchQuery ||
      blog.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      blog.excerpt?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      blog.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      blog.tags?.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  if (loading) {
    return (
      <div style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "24px", marginBottom: "12px" }}>📝</div>
          <p style={{ fontSize: "18px", color: "#6b7280" }}>Loading blogs...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", padding: "40px" }}>
          <p style={{ fontSize: "18px", color: "#ef4444", marginBottom: "20px" }}>{error}</p>
          <button
            onClick={fetchBlogs}
            style={{
              padding: "12px 24px",
              background: "var(--accent-terracotta)",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "16px",
              fontWeight: 500,
            }}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "80vh", background: "#f9fafb", padding: "30px 16px" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <h1
            style={{
              fontSize: "48px",
              fontWeight: "bold",
              marginBottom: "16px",
              background: "linear-gradient(135deg, var(--accent-terracotta) 0%, var(--accent-coral) 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Our Blog
          </h1>
          <p style={{ textAlign: "center", color: "#6b7280", fontSize: "18px", maxWidth: "600px", margin: "0 auto" }}>
            Discover the latest tips, trends, and insights from our beauty experts
          </p>
        </div>

        {/* Filters and Search */}
        <div
          style={{
            display: "flex",
            gap: "16px",
            marginBottom: "40px",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div style={{ display: "flex", gap: "8px", background: "white", padding: "8px", borderRadius: "12px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
            <button
              onClick={() => setFilter("all")}
              style={{
                padding: "10px 20px",
                borderRadius: "8px",
                border: "none",
                background: filter === "all" ? "var(--accent-terracotta)" : "transparent",
                color: filter === "all" ? "white" : "#6b7280",
                cursor: "pointer",
                fontWeight: 500,
                transition: "all 0.2s",
              }}
            >
              All Blogs
            </button>
            <button
              onClick={() => setFilter("featured")}
              style={{
                padding: "10px 20px",
                borderRadius: "8px",
                border: "none",
                background: filter === "featured" ? "var(--accent-terracotta)" : "transparent",
                color: filter === "featured" ? "white" : "#6b7280",
                cursor: "pointer",
                fontWeight: 500,
                transition: "all 0.2s",
              }}
            >
              ⭐ Featured
            </button>
          </div>
          <input
            type="text"
            placeholder="Search blogs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              flex: 1,
              minWidth: "250px",
              maxWidth: "400px",
              padding: "12px 16px",
              border: "2px solid #e5e7eb",
              borderRadius: "12px",
              fontSize: "16px",
              outline: "none",
              transition: "border-color 0.2s",
            }}
            onFocus={(e) => (e.target.style.borderColor = "var(--accent-terracotta)")}
            onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")}
          />
        </div>

        {/* Blog Grid */}
        {filteredBlogs.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px", background: "white", borderRadius: "16px", border: "2px dashed #e5e7eb" }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>📝</div>
            <p style={{ fontSize: "18px", color: "#9ca3af", marginBottom: "8px" }}>
              {searchQuery ? "No blogs found matching your search." : "No blogs available yet."}
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                style={{
                  marginTop: "16px",
                  padding: "8px 16px",
                  background: "#f3f4f6",
                  color: "var(--accent-terracotta)",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "14px",
                }}
              >
                Clear Search
              </button>
            )}
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
              gap: "24px",
            }}
          >
            {filteredBlogs.map((blog) => (
              <Link
                key={blog._id}
                href={`/blog/${blog.slug}`}
                style={{
                  background: "white",
                  borderRadius: "16px",
                  overflow: "hidden",
                  boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  textDecoration: "none",
                  color: "inherit",
                  display: "flex",
                  flexDirection: "column",
                  border: "1px solid #e5e7eb",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-8px)";
                  e.currentTarget.style.boxShadow = "0 12px 24px rgba(0,0,0,0.15)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 4px 6px rgba(0,0,0,0.1)";
                }}
              >
                {blog.image && (
                  <div style={{ position: "relative", width: "100%", height: "220px", overflow: "hidden" }}>
                    <Image
                      src={blog.image}
                      alt={blog.title}
                      fill
                      style={{ objectFit: "contain" }}
                    />
                    {blog.featured && (
                      <div
                        style={{
                          position: "absolute",
                          top: "12px",
                          right: "12px",
                          background: "rgba(99, 102, 241, 0.9)",
                          color: "white",
                          padding: "6px 12px",
                          borderRadius: "20px",
                          fontSize: "12px",
                          fontWeight: 600,
                        }}
                      >
                        ⭐ Featured
                      </div>
                    )}
                  </div>
                )}
                <div style={{ padding: "20px", flex: 1, display: "flex", flexDirection: "column" }}>
                  <div style={{ display: "flex", gap: "8px", marginBottom: "10px", flexWrap: "wrap" }}>
                    {blog.category && (
                      <span
                        style={{
                          display: "inline-block",
                          padding: "6px 12px",
                          background: "#fef3c7",
                          color: "#92400e",
                          borderRadius: "20px",
                          fontSize: "12px",
                          fontWeight: 600,
                        }}
                      >
                        {blog.category}
                      </span>
                    )}
                  </div>
                  <h2
                    style={{
                      fontSize: "22px",
                      fontWeight: 700,
                      marginBottom: "10px",
                      color: "#1f2937",
                      lineHeight: 1.3,
                    }}
                  >
                    {blog.title}
                  </h2>
                  <p
                    style={{
                      color: "#6b7280",
                      fontSize: "14px",
                      lineHeight: 1.6,
                      marginBottom: "14px",
                      flex: 1,
                    }}
                  >
                    {blog.excerpt || "Read more about this topic..."}
                  </p>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      fontSize: "13px",
                      color: "#9ca3af",
                      paddingTop: "16px",
                      borderTop: "1px solid #e5e7eb",
                    }}
                  >
                    <span style={{ fontWeight: 500 }}>By {blog.author}</span>
                    <span>{new Date(blog.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                  </div>
                  {blog.views > 0 && (
                    <div style={{ fontSize: "12px", color: "#9ca3af", marginTop: "8px" }}>
                      👁️ {blog.views} views
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
