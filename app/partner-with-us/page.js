"use client";

import { useState } from "react";
import toast from "react-hot-toast";

export default function PartnerWithUsPage() {
  const [formData, setFormData] = useState({
    businessName: "",
    contactName: "",
    email: "",
    phone: "",
    businessType: "",
    location: "",
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
      const res = await fetch("/api/partners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || "Failed to submit request. Please try again.");
        return;
      }

      toast.success("Thank you! Our partnerships team will get in touch soon.");
      setFormData({
        businessName: "",
        contactName: "",
        email: "",
        phone: "",
        businessType: "",
        location: "",
        message: "",
        source: "",
      });
    } catch (error) {
      console.error("Error submitting partner request:", error);
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
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
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
            Partner With Veyona
          </p>
          <h1
            style={{
              fontSize: "clamp(32px, 5vw, 52px)",
              fontWeight: 700,
              marginBottom: 18,
            }}
          >
            Grow Your Beauty, Dental & Wellness Business With Us
          </h1>
          <p
            style={{
              fontSize: "clamp(16px, 2vw, 20px)",
              opacity: 0.96,
              lineHeight: 1.8,
            }}
          >
            Join Veyona as a franchise, clinic partner or service collaborator. We provide
            brand, marketing and operations support so you can focus on world‑class
            client experience.
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
          {/* Left: Info */}
          <div>
            <h2
              style={{
                fontSize: 32,
                fontWeight: 700,
                color: "#111827",
                marginBottom: 16,
              }}
            >
              Partnership Opportunities
            </h2>
            <p
              style={{
                fontSize: 16,
                color: "#4b5563",
                lineHeight: 1.8,
                marginBottom: 28,
              }}
            >
              We collaborate with salons, dermatology & dental clinics, wellness studios,
              real estate projects and corporate offices to deliver premium beauty and
              wellness services under the Veyona brand.
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
                gap: 18,
                marginBottom: 30,
              }}
            >
              {[
                {
                  title: "Franchise & Studios",
                  body: "Launch a Veyona flagship or boutique studio in your city with full training and brand support.",
                },
                {
                  title: "Clinic Partnerships",
                  body: "Integrate advanced dental, skin and laser services with our protocols and specialists.",
                },
                {
                  title: "Corporate & Real Estate",
                  body: "On‑site wellness centers and experience zones for offices, townships and premium projects.",
                },
                {
                  title: "Channel Collaborations",
                  body: "Influencers, agencies and vendors who want to co‑create campaigns and experiences.",
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
                background: "#e0f2fe",
                border: "1px solid #bae6fd",
              }}
            >
              <p
                style={{
                  fontSize: 14,
                  color: "#0f172a",
                  lineHeight: 1.7,
                }}
              >
                Ideal partners have{" "}
                <strong>existing or upcoming spaces in Tier‑1 / Tier‑2 cities</strong>,
                strong focus on hygiene, and a passion for delivering memorable client
                experiences.
              </p>
            </div>
          </div>

          {/* Right: Partner Form */}
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
              Share Your Details
            </h2>
            <p
              style={{
                fontSize: 14,
                color: "#6b7280",
                marginBottom: 22,
              }}
            >
              Tell us a bit about your business and what kind of partnership you are
              exploring. We usually respond within 2–3 working days.
            </p>

            <form onSubmit={handleSubmit}>
              {/* Business & Contact Name */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
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
                    Business / Brand Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.businessName}
                    onChange={handleChange("businessName")}
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
                    Contact Person *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.contactName}
                    onChange={handleChange("contactName")}
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

              {/* Email & Phone */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
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
                    Phone / WhatsApp
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
              </div>

              {/* Business Type & Location */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
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
                    Business Type
                  </label>
                  <input
                    type="text"
                    placeholder="Salon, clinic, wellness, real estate, corporate, etc."
                    value={formData.businessType}
                    onChange={handleChange("businessType")}
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
                    City / Location
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Noida, Delhi NCR"
                    value={formData.location}
                    onChange={handleChange("location")}
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
                  How did you hear about Veyona?
                </label>
                <input
                  type="text"
                  placeholder="Instagram, friend, event, etc."
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
                  Tell us about your space & partnership idea *
                </label>
                <textarea
                  rows={5}
                  required
                  placeholder="Share current setup, size, approximate footfall, services you offer today, and what kind of collaboration you are exploring."
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
                {loading ? "Submitting..." : "Submit Partnership Request"}
              </button>

              <p
                style={{
                  marginTop: 10,
                  fontSize: 12,
                  color: "#9ca3af",
                  textAlign: "center",
                }}
              >
                By submitting, you agree to our privacy policy and allow our team to
                contact you via phone, WhatsApp or email.
              </p>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}

