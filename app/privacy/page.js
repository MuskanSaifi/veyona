"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function PrivacyPolicyPage() {
  const [pageContent, setPageContent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPageContent();
  }, []);

  const fetchPageContent = async () => {
    try {
      const res = await fetch("/api/page-content/privacy");
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

  const heroTitle = pageContent?.heroTitle || "Privacy Policy";
  const heroDescription = pageContent?.heroDescription || "Your privacy is important to us. This policy explains how we collect, use, and protect your personal information.";
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
          {pageContent?.lastUpdated && (
            <p style={{ fontSize: 14, opacity: 0.9, marginTop: 10 }}>
              Last updated: {new Date(pageContent.lastUpdated).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          )}
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

            <div
              style={{
                marginTop: 40,
                paddingTop: 30,
                borderTop: "1px solid #e5e7eb",
                textAlign: "center",
              }}
            >
              <Link
                href="/"
                style={{
                  display: "inline-block",
                  padding: "12px 30px",
                  background: "linear-gradient(135deg, var(--accent-terracotta) 0%, var(--accent-coral) 100%)",
                  color: "white",
                  textDecoration: "none",
                  borderRadius: 8,
                  fontSize: 16,
                  fontWeight: 600,
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = "translateY(-2px)";
                  e.target.style.boxShadow =
                    "0 10px 20px rgba(173, 110, 94, 0.3)";
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = "translateY(0)";
                  e.target.style.boxShadow = "none";
                }}
              >
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
