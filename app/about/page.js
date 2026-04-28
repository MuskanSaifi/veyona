"use client";
import { useEffect, useState } from "react";
import Image from "next/image";

export default function AboutPage() {
  const [pageContent, setPageContent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPageContent();
  }, []);

  const fetchPageContent = async () => {
    try {
      const res = await fetch("/api/page-content/about");
      if (res.ok) {
        const data = await res.json();
        setPageContent(data);
      }
    } catch (error) {
      console.error("Error fetching page content:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p>Loading...</p>
      </div>
    );
  }

  const heroTitle = pageContent?.heroTitle || "About Veyona";
  const heroDescription = pageContent?.heroDescription || "Your trusted partner for premium salon and dental care services.";
  const content = pageContent?.content || "<p>Content is being updated...</p>";

  return (
    <div style={{ minHeight: "100vh", background: "#ffffff" }}>
      {/* Hero Section */}
      <section
        style={{
          background: "linear-gradient(135deg, var(--accent-terracotta) 0%, var(--accent-coral) 100%)",
          color: "white",
          padding: "120px 20px 80px",
          textAlign: "center",
        }}
      >
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <h1
            style={{
              fontSize: "clamp(32px, 5vw, 56px)",
              fontWeight: 700,
              marginBottom: 20,
            }}
          >
            {heroTitle}
          </h1>
          <p
            style={{
              fontSize: "clamp(16px, 2vw, 20px)",
              opacity: 0.95,
              lineHeight: 1.8,
            }}
          >
            {heroDescription}
          </p>
        </div>
      </section>

      {/* Content Section */}
      <section style={{ padding: "80px 20px", background: "#f9fafb" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div
            style={{
              background: "white",
              padding: 60,
              borderRadius: 20,
              boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
            }}
          >
            <div
              dangerouslySetInnerHTML={{ __html: content }}
              style={{
                fontSize: 16,
                lineHeight: 1.8,
                color: "#4b5563",
              }}
            />
            {pageContent?.lastUpdated && (
              <p style={{ fontSize: 14, color: "#9ca3af", marginTop: 30, paddingTop: 20, borderTop: "1px solid #e5e7eb" }}>
                Last updated: {new Date(pageContent.lastUpdated).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
