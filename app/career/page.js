"use client";

import { useState } from "react";
import toast from "react-hot-toast";

export default function CareerPage() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    role: "",
    experience: "",
    preferredLocation: "",
    message: "",
    source: "",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (field) => (e) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/careers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || "Failed to submit application. Please try again.");
        return;
      }

      toast.success("Application submitted! Our team will contact you soon.");
      setFormData({
        fullName: "",
        email: "",
        phone: "",
        role: "",
        experience: "",
        preferredLocation: "",
        message: "",
        source: "",
      });
    } catch (error) {
      console.error("Error submitting application:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-cream)" }}>
      {/* Hero Section */}
      <section
        style={{
          background:
            "linear-gradient(135deg, var(--accent-terracotta) 0%, var(--accent-coral) 100%)",
          color: "white",
          padding: "120px 20px 80px",
          textAlign: "center",
        }}
      >
        <div style={{ maxWidth: 880, margin: "0 auto" }}>
          <p
            style={{
              textTransform: "uppercase",
              letterSpacing: "0.2em",
              fontSize: 13,
              fontWeight: 600,
              marginBottom: 12,
              opacity: 0.9,
            }}
          >
            Join The Veyona Family
          </p>
          <h1
            style={{
              fontSize: "clamp(32px, 5vw, 52px)",
              fontWeight: 700,
              marginBottom: 18,
            }}
          >
            Build Your Career in Beauty & Wellness
          </h1>
          <p
            style={{
              fontSize: "clamp(16px, 2vw, 20px)",
              opacity: 0.96,
              lineHeight: 1.8,
            }}
          >
            We are always looking for passionate stylists, aestheticians, dentists, therapists,
            and support professionals who love creating confidence-boosting experiences for our guests.
          </p>
        </div>
      </section>

      {/* Content + Form */}
      <section style={{ padding: "70px 20px 90px" }}>
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(380px, 1fr))",
            gap: 40,
            alignItems: "flex-start",
          }}
        >
          {/* Left: Highlights */}
          <div>
            <h2
              style={{
                fontSize: 32,
                fontWeight: 700,
                color: "#111827",
                marginBottom: 16,
              }}
            >
              Why Work at Veyona?
            </h2>
            <p
              style={{
                fontSize: 16,
                color: "#4b5563",
                lineHeight: 1.8,
                marginBottom: 28,
              }}
            >
              At Veyona, you get a modern studio environment, premium products, structured
              training and the opportunity to grow your career across salon, dental and wellness
              services. We believe happy teams create happy clients.
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: 18,
                marginBottom: 30,
              }}
            >
              {[
                {
                  title: "Growth & Training",
                  body: "Regular upskilling workshops with senior experts and brand partners.",
                },
                {
                  title: "Premium Clients",
                  body: "Work with clients who value quality, hygiene and long‑term relationships.",
                },
                {
                  title: "Modern Workspace",
                  body: "Beautiful, well-equipped cabins with strict hygiene and safety standards.",
                },
                {
                  title: "Strong Culture",
                  body: "Supportive, performance‑driven culture that rewards professionalism.",
                },
              ].map((card) => (
                <div
                  key={card.title}
                  style={{
                    background: "#ffffff",
                    borderRadius: 16,
                    padding: 18,
                    boxShadow: "0 6px 20px rgba(15,23,42,0.06)",
                    border: "1px solid #e5e7eb",
                  }}
                >
                  <h3
                    style={{
                      fontSize: 16,
                      fontWeight: 600,
                      color: "#111827",
                      marginBottom: 8,
                    }}
                  >
                    {card.title}
                  </h3>
                  <p
                    style={{
                      fontSize: 14,
                      color: "#6b7280",
                      lineHeight: 1.6,
                    }}
                  >
                    {card.body}
                  </p>
                </div>
              ))}
            </div>

            <div
              style={{
                padding: 18,
                borderRadius: 16,
                background: "#fef3c7",
                border: "1px solid #fde68a",
              }}
            >
              <p
                style={{
                  fontSize: 14,
                  color: "#92400e",
                  lineHeight: 1.7,
                }}
              >
                We hire for{" "}
                <strong>
                  Hair Stylists, Makeup Artists, Skin Experts, Dentists, Dental Assistants,
                  Front Desk & Operations
                </strong>
                . If your role is not listed, still apply — we review every profile.
              </p>
            </div>
          </div>

          {/* Right: Application Form */}
          <div
            style={{
              background: "#ffffff",
              padding: 32,
              borderRadius: 20,
              boxShadow: "0 10px 30px rgba(15,23,42,0.08)",
              border: "1px solid #e5e7eb",
            }}
          >
            <h2
              style={{
                fontSize: 26,
                fontWeight: 700,
                color: "#111827",
                marginBottom: 10,
              }}
            >
              Apply Now
            </h2>
            <p
              style={{
                fontSize: 14,
                color: "#6b7280",
                marginBottom: 22,
              }}
            >
              Fill in your basic details and our HR team will reach out if your profile matches
              an open role.
            </p>

            <form onSubmit={handleSubmit}>
              {/* Name & Email */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                  gap: 16,
                  marginBottom: 16,
                }}
              >
                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: 6,
                      fontSize: 13,
                      fontWeight: 600,
                      color: "#374151",
                    }}
                  >
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={handleChange("fullName")}
                    style={{
                      width: "100%",
                      padding: 12,
                      borderRadius: 10,
                      border: "2px solid #e5e7eb",
                      fontSize: 14,
                      boxSizing: "border-box",
                    }}
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: 6,
                      fontSize: 13,
                      fontWeight: 600,
                      color: "#374151",
                    }}
                  >
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleChange("email")}
                    style={{
                      width: "100%",
                      padding: 12,
                      borderRadius: 10,
                      border: "2px solid #e5e7eb",
                      fontSize: 14,
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              </div>

              {/* Phone & Location */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                  gap: 16,
                  marginBottom: 16,
                }}
              >
                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: 6,
                      fontSize: 13,
                      fontWeight: 600,
                      color: "#374151",
                    }}
                  >
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange("phone")}
                    style={{
                      width: "100%",
                      padding: 12,
                      borderRadius: 10,
                      border: "2px solid #e5e7eb",
                      fontSize: 14,
                      boxSizing: "border-box",
                    }}
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: 6,
                      fontSize: 13,
                      fontWeight: 600,
                      color: "#374151",
                    }}
                  >
                    Preferred Location
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Noida, Delhi NCR"
                    value={formData.preferredLocation}
                    onChange={handleChange("preferredLocation")}
                    style={{
                      width: "100%",
                      padding: 12,
                      borderRadius: 10,
                      border: "2px solid #e5e7eb",
                      fontSize: 14,
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              </div>

              {/* Role & Experience */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                  gap: 16,
                  marginBottom: 16,
                }}
              >
                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: 6,
                      fontSize: 13,
                      fontWeight: 600,
                      color: "#374151",
                    }}
                  >
                    Role You&apos;re Applying For *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Senior Hair Stylist"
                    value={formData.role}
                    onChange={handleChange("role")}
                    style={{
                      width: "100%",
                      padding: 12,
                      borderRadius: 10,
                      border: "2px solid #e5e7eb",
                      fontSize: 14,
                      boxSizing: "border-box",
                    }}
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: 6,
                      fontSize: 13,
                      fontWeight: 600,
                      color: "#374151",
                    }}
                  >
                    Total Experience
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 3+ years in salon industry"
                    value={formData.experience}
                    onChange={handleChange("experience")}
                    style={{
                      width: "100%",
                      padding: 12,
                      borderRadius: 10,
                      border: "2px solid #e5e7eb",
                      fontSize: 14,
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              </div>

              {/* Source */}
              <div style={{ marginBottom: 16 }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: 6,
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#374151",
                  }}
                >
                  How did you hear about us?
                </label>
                <input
                  type="text"
                  placeholder="Instagram, friend, job portal, etc."
                  value={formData.source}
                  onChange={handleChange("source")}
                  style={{
                    width: "100%",
                    padding: 12,
                    borderRadius: 10,
                    border: "2px solid #e5e7eb",
                    fontSize: 14,
                    boxSizing: "border-box",
                  }}
                />
              </div>

              {/* Message */}
              <div style={{ marginBottom: 22 }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: 6,
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#374151",
                  }}
                >
                  Short Note / Portfolio Links
                </label>
                <textarea
                  rows={5}
                  placeholder="Share anything important about your skills, certifications or portfolio links."
                  value={formData.message}
                  onChange={handleChange("message")}
                  style={{
                    width: "100%",
                    padding: 12,
                    borderRadius: 10,
                    border: "2px solid #e5e7eb",
                    fontSize: 14,
                    fontFamily: "inherit",
                    resize: "vertical",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: "100%",
                  padding: 14,
                  borderRadius: 999,
                  border: "none",
                  background:
                    "linear-gradient(135deg, var(--accent-terracotta) 0%, var(--accent-coral) 100%)",
                  color: "white",
                  fontSize: 16,
                  fontWeight: 600,
                  cursor: loading ? "not-allowed" : "pointer",
                  opacity: loading ? 0.75 : 1,
                  boxShadow: "0 12px 25px rgba(248,113,113,0.35)",
                  transition: "transform 0.15s ease, box-shadow 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  if (!loading) {
                    e.currentTarget.style.transform = "translateY(-1px)";
                    e.currentTarget.style.boxShadow =
                      "0 14px 30px rgba(248,113,113,0.4)";
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow =
                    "0 12px 25px rgba(248,113,113,0.35)";
                }}
              >
                {loading ? "Submitting..." : "Submit Application"}
              </button>

              <p
                style={{
                  marginTop: 10,
                  fontSize: 12,
                  color: "#9ca3af",
                  textAlign: "center",
                }}
              >
                By submitting, you agree to our privacy policy and allow us to contact you
                on phone, WhatsApp or email.
              </p>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}

