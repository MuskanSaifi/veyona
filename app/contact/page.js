// app/contact/page.js
"use client";
import { useState } from "react";
import {
  FaPhoneAlt,
  FaEnvelope,
  FaMapMarkerAlt,
  FaClock,
  FaFacebookF,
  FaInstagram,
  FaLinkedinIn,
} from "react-icons/fa";
import { FaThreads } from "react-icons/fa6";

import toast from "react-hot-toast";
import Link from "next/link";


export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/contact-enquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || "Failed to send message. Please try again.");
        return;
      }

      toast.success("Thank you! We'll get back to you soon.");
      setFormData({
        name: "",
        email: "",
        phone: "",
        subject: "",
        message: "",
      });
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const contactInfo = [
    {
      icon: FaPhoneAlt,
      title: "Phone",
      content: "+91 90093 90054",
      link: "tel:+919009390054",
    },
    {
      icon: FaEnvelope,
      title: "Email",
      content: "info@veyona.in",
      link: "mailto:info@veyona.in",
    },
    {
      icon: FaMapMarkerAlt,
      title: "Address",
      content: "B6,7 1st floor , Sri ram palace ,Near Vinayak hospital, sector 27, Noida",
      link: "#",
    },
    {
      icon: FaClock,
      title: "Working Hours",
      content: "Mon-Sat: 9 AM - 8 PM",
      link: "#",
    },
  ];

  const socialLinks = [
    { icon: FaFacebookF, url: "https://www.facebook.com/share/1FqbHriLKc/", label: "Facebook" },
    { icon: FaInstagram, url: "https://www.instagram.com/veyona.in", label: "Instagram" },
    { icon: FaThreads, url: "https://www.threads.com/@veyona.in", label: "Threads" },
    { icon: FaLinkedinIn, url: "https://www.linkedin.com/in/veyona-in-5835643a2", label: "LinkedIn" },
  ];

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
            Get In Touch
          </h1>
          <p
            style={{
              fontSize: "clamp(16px, 2vw, 20px)",
              opacity: 0.95,
              lineHeight: 1.8,
            }}
          >
            Have a question or want to book an appointment? We'd love to hear
            from you. Send us a message and we'll respond as soon as possible.
          </p>
        </div>
      </section>

      {/* Contact Info Cards */}
      <section style={{ padding: "80px 20px", background: "#f9fafb" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
              gap: 30,
              marginBottom: 60,
            }}
          >
            {contactInfo.map((info, index) => {
              const Icon = info.icon;
              return (
                <Link
                  key={index}
                  href={info.link}
                  style={{
                    background: "white",
                    padding: 40,
                    borderRadius: 16,
                    boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                    textDecoration: "none",
                    color: "inherit",
                    transition: "all 0.3s",
                    display: "block",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-5px)";
                    e.currentTarget.style.boxShadow =
                      "0 10px 30px rgba(102, 126, 234, 0.2)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow =
                      "0 4px 20px rgba(0,0,0,0.08)";
                  }}
                >
                  <Icon
                    style={{
                      fontSize: 40,
                      color: "var(--accent-terracotta)",
                      marginBottom: 20,
                    }}
                  />
                  <h3
                    style={{
                      fontSize: 20,
                      fontWeight: 700,
                      color: "#1f2937",
                      marginBottom: 12,
                    }}
                  >
                    {info.title}
                  </h3>
                  <p
                    style={{
                      fontSize: 16,
                      color: "#6b7280",
                      lineHeight: 1.6,
                    }}
                  >
                    {info.content}
                  </p>
                </Link>
              );
            })}
          </div>

          {/* Contact Form & Map Section */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
              gap: 40,
            }}
          >
            {/* Contact Form */}
            <div
              style={{
                background: "white",
                padding: 40,
                borderRadius: 20,
                boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
              }}
            >
              <h2
                style={{
                  fontSize: 32,
                  fontWeight: 700,
                  color: "#1f2937",
                  marginBottom: 30,
                }}
              >
                Send us a Message
              </h2>
              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: 20 }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: 8,
                      fontWeight: 600,
                      color: "#374151",
                    }}
                  >
                    Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    style={{
                      width: "100%",
                      padding: 14,
                      border: "2px solid #e5e7eb",
                      borderRadius: 8,
                      fontSize: 16,
                      transition: "all 0.2s",
                      boxSizing: "border-box",
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = "var(--accent-terracotta)";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "#e5e7eb";
                    }}
                  />
                </div>

                <div style={{ marginBottom: 20 }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: 8,
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
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    style={{
                      width: "100%",
                      padding: 14,
                      border: "2px solid #e5e7eb",
                      borderRadius: 8,
                      fontSize: 16,
                      transition: "all 0.2s",
                      boxSizing: "border-box",
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = "var(--accent-terracotta)";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "#e5e7eb";
                    }}
                  />
                </div>

                <div style={{ marginBottom: 20 }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: 8,
                      fontWeight: 600,
                      color: "#374151",
                    }}
                  >
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    style={{
                      width: "100%",
                      padding: 14,
                      border: "2px solid #e5e7eb",
                      borderRadius: 8,
                      fontSize: 16,
                      transition: "all 0.2s",
                      boxSizing: "border-box",
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = "var(--accent-terracotta)";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "#e5e7eb";
                    }}
                  />
                </div>

                <div style={{ marginBottom: 20 }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: 8,
                      fontWeight: 600,
                      color: "#374151",
                    }}
                  >
                    Subject *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.subject}
                    onChange={(e) =>
                      setFormData({ ...formData, subject: e.target.value })
                    }
                    style={{
                      width: "100%",
                      padding: 14,
                      border: "2px solid #e5e7eb",
                      borderRadius: 8,
                      fontSize: 16,
                      transition: "all 0.2s",
                      boxSizing: "border-box",
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = "var(--accent-terracotta)";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "#e5e7eb";
                    }}
                  />
                </div>

                <div style={{ marginBottom: 30 }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: 8,
                      fontWeight: 600,
                      color: "#374151",
                    }}
                  >
                    Message *
                  </label>
                  <textarea
                    required
                    rows={6}
                    value={formData.message}
                    onChange={(e) =>
                      setFormData({ ...formData, message: e.target.value })
                    }
                    style={{
                      width: "100%",
                      padding: 14,
                      border: "2px solid #e5e7eb",
                      borderRadius: 8,
                      fontSize: 16,
                      fontFamily: "inherit",
                      resize: "vertical",
                      transition: "all 0.2s",
                      boxSizing: "border-box",
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = "var(--accent-terracotta)";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "#e5e7eb";
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: "100%",
                    padding: 16,
                    background:
                      "linear-gradient(135deg, var(--accent-terracotta) 0%, var(--accent-coral) 100%)",
                    color: "white",
                    border: "none",
                    borderRadius: 12,
                    fontSize: 18,
                    fontWeight: 600,
                    cursor: loading ? "not-allowed" : "pointer",
                    transition: "all 0.2s",
                    opacity: loading ? 0.7 : 1,
                  }}
                  onMouseEnter={(e) => {
                    if (!loading) {
                      e.target.style.transform = "translateY(-2px)";
                      e.target.style.boxShadow =
                        "0 10px 20px rgba(102, 126, 234, 0.3)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = "translateY(0)";
                    e.target.style.boxShadow = "none";
                  }}
                >
                  {loading ? "Sending..." : "Send Message"}
                </button>
              </form>
            </div>

            {/* Map/Info Section */}
            <div>
              <div
                style={{
                  background: "white",
                  padding: 40,
                  borderRadius: 20,
                  boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                  marginBottom: 30,
                }}
              >
                <h2
                  style={{
                    fontSize: 32,
                    fontWeight: 700,
                    color: "#1f2937",
                    marginBottom: 30,
                  }}
                >
                  Find Us
                </h2>
                <div
                  style={{
                    width: "100%",
                    height: "500px",
                    background: "#f3f4f6",
                    borderRadius: 12,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#6b7280",
                    fontSize: 18,
                    marginBottom: 30,
                  }}
                >
<iframe
  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3503.9406407166116!2d77.32536932604405!3d28.57154513684673!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x390ce55ff23f0093%3A0x51332df6cfd25f60!2sShree%20Ram%20Palace!5e0!3m2!1sen!2sin!4v1771397757298!5m2!1sen!2sin"
  width="600"
  height="450"
  style={{ border: 0 }}
  allowFullScreen
  loading="lazy"
  referrerPolicy="no-referrer-when-downgrade"
/>
                </div>
               
              </div>

              {/* Social Links */}
              <div
                style={{
                  background: "white",
                  padding: 40,
                  borderRadius: 20,
                  boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                }}
              >
                <h3
                  style={{
                    fontSize: 24,
                    fontWeight: 700,
                    color: "#1f2937",
                    marginBottom: 20,
                  }}
                >
                  Follow Us
                </h3>
                <div
                  style={{
                    display: "flex",
                    gap: 15,
                  }}
                >
                  {socialLinks.map((social, index) => {
                    const Icon = social.icon;
                    return (
                      <Link
                        key={index}
                        href={social.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={social.label}
                        style={{
                          width: 50,
                          height: 50,
                          borderRadius: "50%",
                          background: "#f3f4f6",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "var(--accent-terracotta)",
                          fontSize: 20,
                          textDecoration: "none",
                          transition: "all 0.2s",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "var(--accent-terracotta)";
                          e.currentTarget.style.color = "white";
                          e.currentTarget.style.transform = "translateY(-3px)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "#f3f4f6";
                          e.currentTarget.style.color = "var(--accent-terracotta)";
                          e.currentTarget.style.transform = "translateY(0)";
                        }}
                      >
                        <Icon />
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

