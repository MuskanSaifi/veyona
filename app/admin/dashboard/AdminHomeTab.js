"use client";

import { useEffect, useState } from "react";
import * as styles from "./styles";

const metricCardBase = (accent) => ({
  ...styles.card,
  display: "flex",
  flexDirection: "column",
  gap: "12px",
  padding: "22px 22px 20px",
  background:
    accent === "peach"
      ? "linear-gradient(135deg, #fff7ed 0%, #fffbeb 50%, #fefce8 100%)"
      : accent === "mint"
      ? "linear-gradient(135deg, #ecfdf5 0%, #e0f2fe 50%, #eef2ff 100%)"
      : accent === "lavender"
      ? "linear-gradient(135deg, #f5f3ff 0%, #eef2ff 50%, #fdf2ff 100%)"
      : "linear-gradient(135deg, #f9fafb 0%, #f3f4f6 50%, #e5e7eb 100%)",
  border: "none",
});

const metricHeaderRow = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
};

const metricLabelStyle = {
  fontSize: "13px",
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "#6b7280",
};

const metricNumberStyle = {
  fontSize: "34px",
  fontWeight: 700,
  color: "#0f172a",
};

const metricPillRow = {
  display: "flex",
  flexWrap: "wrap",
  gap: "6px",
  marginTop: "4px",
};

const metricPill = {
  fontSize: "11px",
  padding: "4px 10px",
  borderRadius: "999px",
  background: "rgba(15,23,42,0.06)",
  color: "#334155",
  cursor: "pointer",
  border: "1px solid rgba(148,163,184,0.35)",
};

const metricPillStatic = {
  ...metricPill,
  cursor: "default",
  opacity: 0.9,
};

export default function AdminHomeTab({ setActiveTab }) {
  const [metrics, setMetrics] = useState({
    banners: 0,
    activeBanners: 0,
    categories: 0,
    services: 0,
    products: 0,
    salons: 0,
    employees: 0,
    todaysAppointments: 0,
    totalAppointments: 0,
    blogs: 0,
    testimonials: 0,
    featuredProfessionals: 0,
    contactEnquiriesNew: 0,
    contactEnquiriesTotal: 0,
    careerNew: 0,
    careerTotal: 0,
    partnerNew: 0,
    partnerTotal: 0,
    chatbotNew: 0,
    chatbotTotal: 0,
    coupons: 0,
    activeCoupons: 0,
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [
          bannerRes,
          categoryRes,
          serviceRes,
          productRes,
          salonRes,
          employeeRes,
          appointmentRes,
          blogRes,
          testimonialRes,
          featuredRes,
          contactRes,
          careerRes,
          partnerRes,
          chatbotRes,
          couponRes,
        ] = await Promise.all([
          fetch("/api/banner"),
          fetch("/api/category"),
          fetch("/api/service"),
          fetch("/api/product"),
          fetch("/api/salon"),
          fetch("/api/employee"),
          fetch("/api/appointment"),
          fetch("/api/blog"),
          fetch("/api/testimonial"),
          fetch("/api/featured-professional"),
          fetch("/api/contact-enquiry"),
          fetch("/api/careers"),
          fetch("/api/partners"),
          fetch("/api/chatbot"),
          fetch("/api/coupon"),
        ]);

        const [
          banners = [],
          categories = [],
          services = [],
          products = [],
          salons = [],
          employees = [],
          appointments = [],
          blogs = [],
          testimonials = [],
          featured = [],
          contactEnquiries = [],
          careerApplications = [],
          partnerRequests = [],
          chatbotSubmissions = [],
          coupons = [],
        ] = await Promise.all([
          bannerRes.json(),
          categoryRes.json(),
          serviceRes.json(),
          productRes.json(),
          salonRes.json(),
          employeeRes.json(),
          appointmentRes.json(),
          blogRes.json(),
          testimonialRes.json(),
          featuredRes.json(),
          contactRes.json(),
          careerRes.json(),
          partnerRes.json(),
          chatbotRes.json(),
          couponRes.json(),
        ]);

        const today = new Date();
        const isSameDay = (date) => {
          const d = new Date(date);
          return (
            d.getFullYear() === today.getFullYear() &&
            d.getMonth() === today.getMonth() &&
            d.getDate() === today.getDate()
          );
        };

        setMetrics({
          banners: banners.length,
          activeBanners: banners.filter((b) => b.active).length,
          categories: categories.length,
          services: services.length,
          products: products.length,
          salons: salons.length,
          employees: employees.length,
          todaysAppointments: appointments.filter((a) => isSameDay(a.date || a.createdAt)).length,
          totalAppointments: appointments.length,
          blogs: blogs.length,
          testimonials: testimonials.length,
          featuredProfessionals: featured.length,
          contactEnquiriesNew: contactEnquiries.filter((c) => c.status === "new").length,
          contactEnquiriesTotal: contactEnquiries.length,
          careerNew: careerApplications.filter((c) => c.status === "new").length,
          careerTotal: careerApplications.length,
          partnerNew: partnerRequests.filter((p) => p.status === "new").length,
          partnerTotal: partnerRequests.length,
          chatbotNew: chatbotSubmissions.filter((s) => s.status === "new").length,
          chatbotTotal: chatbotSubmissions.length,
          coupons: Array.isArray(coupons) ? coupons.length : 0,
          activeCoupons: Array.isArray(coupons)
            ? coupons.filter((c) => c.active && (!c.expiresAt || new Date(c.expiresAt) > new Date())).length
            : 0,
        });
      } catch (e) {
        // Fail silently, keep defaults
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, []);

  return (
    <div>
      <div style={styles.pageHeader}>
        <h2 style={styles.pageTitle}>Admin Overview</h2>
      </div>

      {loading ? (
        <div style={styles.emptyState}>
          <p style={styles.emptyStateText}>Loading overview...</p>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: "22px",
          }}
        >
          {/* Content overview */}
          <div style={metricCardBase("peach")}>
            <div style={metricHeaderRow}>
              <span style={metricLabelStyle}>Website Content</span>
              <span
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "999px",
                  background:
                    "radial-gradient(circle at 30% 20%, #fed7aa 0%, #fb923c 35%, #f97316 100%)",
                  boxShadow: "0 6px 14px rgba(248,113,22,0.35)",
                }}
              />
            </div>
            <div style={metricNumberStyle}>
              {metrics.banners + metrics.blogs + metrics.testimonials}
            </div>
            <div style={metricPillRow}>
              <span style={metricPill}>
                Banners: {metrics.banners} (Active: {metrics.activeBanners})
              </span>
              <span style={metricPill}>Blogs: {metrics.blogs}</span>
              <span style={metricPill}>Testimonials: {metrics.testimonials}</span>
            </div>
          </div>

          {/* Services & Products */}
          <div style={metricCardBase("mint")}>
            <div style={metricHeaderRow}>
              <span style={metricLabelStyle}>Services & Products</span>
              <span
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "999px",
                  background:
                    "radial-gradient(circle at 30% 20%, #bbf7d0 0%, #4ade80 35%, #22c55e 100%)",
                  boxShadow: "0 6px 14px rgba(34,197,94,0.35)",
                }}
              />
            </div>
            <div style={metricNumberStyle}>{metrics.categories} Categories</div>
            <div style={metricPillRow}>
              <span style={metricPill}>Services: {metrics.services}</span>
              <span style={metricPill}>Products: {metrics.products}</span>
            </div>
          </div>

          {/* Locations & Team */}
          <div style={metricCardBase("lavender")}>
            <div style={metricHeaderRow}>
              <span style={metricLabelStyle}>Locations & Team</span>
              <span
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "999px",
                  background:
                    "radial-gradient(circle at 30% 20%, #e9d5ff 0%, #a855f7 35%, #7c3aed 100%)",
                  boxShadow: "0 6px 14px rgba(124,58,237,0.35)",
                }}
              />
            </div>
            <div style={metricNumberStyle}>{metrics.salons}</div>
            <div style={metricPillRow}>
              <span
                style={metricPillStatic}
              >
                Salons / Clinics
              </span>
              <span
                style={metricPill}
                onClick={() => setActiveTab && setActiveTab("employees")}
              >
                Employees: {metrics.employees}
              </span>
              <span style={metricPillStatic}>
                Featured Professionals: {metrics.featuredProfessionals}
              </span>
            </div>
          </div>

          {/* Appointments */}
          <div
            style={{ ...metricCardBase(), cursor: setActiveTab ? "pointer" : "default" }}
            onClick={() => setActiveTab && setActiveTab("appointments")}
          >
            <div style={metricHeaderRow}>
              <span style={metricLabelStyle}>Appointments</span>
              <span
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "999px",
                  background:
                    "radial-gradient(circle at 30% 20%, #fee2e2 0%, #f97373 35%, #ef4444 100%)",
                  boxShadow: "0 6px 14px rgba(239,68,68,0.35)",
                }}
              />
            </div>
            <div style={metricNumberStyle}>{metrics.todaysAppointments}</div>
            <div style={metricPillRow}>
              <span
                style={metricPill}
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveTab && setActiveTab("appointments");
                }}
              >
                Today
              </span>
              <span
                style={metricPill}
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveTab && setActiveTab("appointments");
                }}
              >
                Total: {metrics.totalAppointments}
              </span>
            </div>
          </div>

          {/* Coupons */}
          <div style={metricCardBase("lavender")}>
            <div style={metricHeaderRow}>
              <span style={metricLabelStyle}>Coupons</span>
              <span
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "999px",
                  background:
                    "radial-gradient(circle at 30% 20%, #e9d5ff 0%, #c084fc 35%, #a855f7 100%)",
                  boxShadow: "0 6px 14px rgba(168,85,247,0.35)",
                }}
              />
            </div>
            <div style={metricNumberStyle}>{metrics.coupons}</div>
            <div style={metricPillRow}>
              <span
                style={metricPill}
                onClick={() => setActiveTab && setActiveTab("coupons")}
              >
                Active: {metrics.activeCoupons}
              </span>
              <span style={metricPillStatic}>Total: {metrics.coupons}</span>
            </div>
          </div>

          {/* Enquiries & Leads */}
          <div style={metricCardBase("mint")}>
            <div style={metricHeaderRow}>
              <span style={metricLabelStyle}>Enquiries & Leads</span>
              <span
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "999px",
                  background:
                    "radial-gradient(circle at 30% 20%, #bae6fd 0%, #38bdf8 35%, #0ea5e9 100%)",
                  boxShadow: "0 6px 14px rgba(14,165,233,0.35)",
                }}
              />
            </div>
            <div style={metricNumberStyle}>
              {metrics.contactEnquiriesNew +
                metrics.careerNew +
                metrics.partnerNew +
                metrics.chatbotNew}
            </div>
            <div style={metricPillRow}>
              <span
                style={metricPill}
                onClick={() =>
                  setActiveTab && setActiveTab("contact-enquiries")
                }
              >
                Contact: {metrics.contactEnquiriesNew} new /{" "}
                {metrics.contactEnquiriesTotal} total
              </span>
              <span
                style={metricPill}
                onClick={() =>
                  setActiveTab && setActiveTab("career-applications")
                }
              >
                Careers: {metrics.careerNew} new / {metrics.careerTotal} total
              </span>
              <span
                style={metricPill}
                onClick={() =>
                  setActiveTab && setActiveTab("partner-requests")
                }
              >
                Partners: {metrics.partnerNew} new / {metrics.partnerTotal} total
              </span>
              <span
                style={metricPill}
                onClick={() => setActiveTab && setActiveTab("chatbot-data")}
              >
                Chatbot: {metrics.chatbotNew} new / {metrics.chatbotTotal} total
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

