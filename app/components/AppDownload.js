"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import toast from "react-hot-toast";
import { FaGooglePlay, FaApple, FaUsers } from "react-icons/fa";
import { HiDevicePhoneMobile } from "react-icons/hi2";

function FooterTextWithLink({ text, url }) {
  const displayUrl = (url || "").replace(/^https?:\/\//, "");
  if (!displayUrl || !text?.includes(displayUrl)) {
    return <>{text}</>;
  }
  const parts = text.split(displayUrl);
  const href = url?.startsWith("http") ? url : `https://${url}`;
  return (
    <>
      {parts[0]}
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        style={{ color: "var(--accent-terracotta)", textDecoration: "none", fontWeight: 500 }}
        onMouseEnter={(e) => { e.currentTarget.style.textDecoration = "underline"; }}
        onMouseLeave={(e) => { e.currentTarget.style.textDecoration = "none"; }}
      >
        {displayUrl}
      </a>
      {parts[1]}
    </>
  );
}

const DEFAULTS = {
  title: "Get the Salon & Clinic App",
  description: "We'll send you the app link soon—just open it on your phone to download.",
  subtitle: "Available soon on iOS and Android",
  downloadText: "Download our app soon — Salon & Clinic booking made easy.",
  shareButtonText: "Share App Link",
  googlePlayUrl: "#",
  appStoreUrl: "#",
  footerText: "Or you can also access our services at www.veyona.in from your mobile phone.",
  websiteUrl: "https://www.veyona.in",
};

export default function AppDownload() {
  const [phone, setPhone] = useState("");
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch("/api/app-download")
      .then((res) => res.json())
      .then((d) => setData(d))
      .catch(() => setData(null));
  }, []);

  const config = data ? { ...DEFAULTS, ...data } : DEFAULTS;
  const imageSrc = data?.image || "/images/enquiry-now2.png";

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!phone || phone.length < 10) {
      toast.error("Please enter a valid phone number");
      return;
    }
    toast.success("App link will be sent to your phone!");
    setPhone("");
  };

  return (
    <section
      style={{
        background: "linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)",
        padding: "clamp(60px, 8vw, 80px) clamp(20px, 4vw, 40px)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Decorative Background Elements */}
      <div
        style={{
          position: "absolute",
          top: "-50px",
          right: "-50px",
          width: "300px",
          height: "300px",
          background: "linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)",
          borderRadius: "50%",
          filter: "blur(60px)",
          zIndex: 0,
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "-50px",
          left: "-50px",
          width: "250px",
          height: "250px",
          background: "linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.1) 100%)",
          borderRadius: "50%",
          filter: "blur(60px)",
          zIndex: 0,
        }}
      />

      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "clamp(40px, 6vw, 60px)",
          alignItems: "center",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Left Side - Image */}
        <div
          style={{
            position: "relative",
            width: "100%",
            height: "clamp(350px, 50vw, 500px)",
            borderRadius: "20px",
            overflow: "hidden",
            border: "1px solid rgba(255, 255, 255, 0.2)",
          }}
        >
          <Image
            src={imageSrc}
            alt="Salon & Clinic Team"
            fill
            style={{ objectFit: "cover" }}
            priority
            onError={(e) => {
              e.target.style.display = "none";
              if (e.target.nextSibling) e.target.nextSibling.style.display = "flex";
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(135deg, var(--accent-terracotta) 0%, var(--accent-coral) 50%, var(--accent-brown) 100%)",
              display: "none",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontSize: "clamp(20px, 3vw, 24px)",
              fontWeight: "bold",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            <FaUsers style={{ fontSize: "48px" }} />
            <span>Team Photo</span>
          </div>
        </div>

        {/* Right Side - Content */}
        <div>
          <div style={{ marginBottom: "clamp(24px, 4vw, 32px)" }}>
            <h2
              style={{
                fontSize: "clamp(28px, 5vw, 42px)",
                fontWeight: "bold",
                marginBottom: "16px",
                color: "#1f2937",
                lineHeight: 1.2,
                background: "linear-gradient(135deg, var(--accent-terracotta) 0%, var(--accent-coral) 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              {config.title}
            </h2>
            <p
              style={{
                fontSize: "clamp(16px, 2.5vw, 18px)",
                color: "#6b7280",
                lineHeight: 1.7,
                marginBottom: "8px",
              }}
            >
              {config.description}
            </p>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginTop: "12px",
                flexWrap: "wrap",
              }}
            >
              <HiDevicePhoneMobile style={{ fontSize: "20px", color: "var(--accent-terracotta)" }} />
              <span style={{ fontSize: "14px", color: "#9ca3af" }}>
                {config.subtitle}
              </span>
            </div>
          </div>

          {/* Phone Number Form */}
          <form onSubmit={handleSubmit} style={{ marginBottom: "clamp(24px, 4vw, 32px)" }}>
            <div
              style={{
                display: "flex",
                gap: "12px",
                flexWrap: "wrap",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "0 clamp(12px, 2vw, 16px)",
                  background: "white",
                  border: "2px solid #e5e7eb",
                  borderRadius: "12px",
                  fontSize: "clamp(14px, 2vw, 16px)",
                  fontWeight: 500,
                  color: "#1f2937",
                  boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
                  transition: "all 0.2s ease",
                  minWidth: "80px",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "var(--accent-terracotta)";
                  e.currentTarget.style.boxShadow = "0 4px 8px rgba(173, 110, 94, 0.2)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "#e5e7eb";
                  e.currentTarget.style.boxShadow = "0 2px 4px rgba(0, 0, 0, 0.05)";
                }}
              >
                <span style={{ marginRight: "8px", fontSize: "18px" }}>🇮🇳</span>
                <span>+91</span>
              </div>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                placeholder="Enter Mobile Number"
                style={{
                  flex: 1,
                  minWidth: "200px",
                  padding: "clamp(12px, 2vw, 16px)",
                  border: "2px solid #e5e7eb",
                  borderRadius: "12px",
                  fontSize: "clamp(14px, 2vw, 16px)",
                  fontFamily: "inherit",
                  transition: "all 0.2s ease",
                  boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "var(--accent-terracotta)";
                  e.target.style.boxShadow = "0 4px 12px rgba(99, 102, 241, 0.15)";
                  e.target.style.outline = "none";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "#e5e7eb";
                  e.target.style.boxShadow = "0 2px 4px rgba(0, 0, 0, 0.05)";
                }}
                required
                maxLength={10}
              />
              <button
                type="submit"
                style={{
                  padding: "clamp(12px, 2vw, 16px) clamp(20px, 4vw, 30px)",
                  background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                  color: "white",
                  border: "none",
                  borderRadius: "12px",
                  fontSize: "clamp(14px, 2vw, 16px)",
                  fontWeight: 600,
                  cursor: "pointer",
                  boxShadow: "0 4px 12px rgba(239, 68, 68, 0.3)",
                  transition: "all 0.2s ease",
                  whiteSpace: "nowrap",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 6px 16px rgba(239, 68, 68, 0.4)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(239, 68, 68, 0.3)";
                }}
              >
                {config.shareButtonText}
              </button>
            </div>
          </form>

          {/* App Store Buttons */}
          <div style={{ marginBottom: "clamp(20px, 3vw, 24px)" }}>
            <p
              style={{
                fontSize: "clamp(14px, 2vw, 16px)",
                color: "#6b7280",
                marginBottom: "16px",
                fontWeight: 500,
              }}
            >
              {config.downloadText}
            </p>
            <div
              style={{
                display: "flex",
                gap: "12px",
                flexWrap: "wrap",
              }}
            >
              <a
                href={config.googlePlayUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "12px 20px",
                  background: "#000",
                  color: "white",
                  borderRadius: "12px",
                  textDecoration: "none",
                  fontSize: "clamp(12px, 1.5vw, 14px)",
                  fontWeight: 500,
                  transition: "all 0.2s ease",
                  boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 6px 12px rgba(0, 0, 0, 0.3)";
                  e.currentTarget.style.background = "#1a1a1a";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.2)";
                  e.currentTarget.style.background = "#000";
                }}
              >
                <FaGooglePlay style={{ fontSize: "20px" }} />
                <span>GET IT ON</span>
                <span style={{ fontWeight: 700, fontSize: "16px" }}>Google Play</span>
              </a>
              <a
                href={config.appStoreUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "12px 20px",
                  background: "#000",
                  color: "white",
                  borderRadius: "12px",
                  textDecoration: "none",
                  fontSize: "clamp(12px, 1.5vw, 14px)",
                  fontWeight: 500,
                  transition: "all 0.2s ease",
                  boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 6px 12px rgba(0, 0, 0, 0.3)";
                  e.currentTarget.style.background = "#1a1a1a";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.2)";
                  e.currentTarget.style.background = "#000";
                }}
              >
                <FaApple style={{ fontSize: "20px" }} />
                <span>Download on the</span>
                <span style={{ fontWeight: 700, fontSize: "16px" }}>App Store</span>
              </a>
            </div>
          </div>

          {/* Footer Text */}
          <p style={{ fontSize: "clamp(12px, 1.5vw, 14px)", color: "#9ca3af", lineHeight: 1.6, margin: 0 }}>
            <FooterTextWithLink text={config.footerText} url={config.websiteUrl} />
          </p>
        </div>
      </div>
    </section>
  );
}
