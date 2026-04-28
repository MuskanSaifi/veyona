"use client";
import { useEffect, useState } from "react";
import Image from "next/image";

export default function FeaturedProfessionals() {
  const [professionals, setProfessionals] = useState([]);

  useEffect(() => {
    fetchProfessionals();
  }, []);

  const fetchProfessionals = async () => {
    try {
      const res = await fetch("/api/featured-professional");
      const data = await res.json();
      setProfessionals(data.slice(0, 4)); // Show top 4
    } catch (error) {
      console.error("Error fetching professionals:", error);
    }
  };

  if (professionals.length === 0) return null;

  return (
    <section style={{ background: "linear-gradient(135deg, #dc2626 0%, #991b1b 100%)", padding: "60px 20px", marginBottom: 60 }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 20 }}>
          {professionals.map((prof) => (
            <div
              key={prof._id}
              style={{
                background: "white",
                borderRadius: 12,
                overflow: "hidden",
                boxShadow: "0 4px 6px rgba(0,0,0,0.2)",
              }}
            >
              {prof.image && (
                <div style={{ position: "relative", width: "100%", height: 200 }}>
                  <Image
                    src={prof.image}
                    alt={prof.name}
                    fill
                    style={{ objectFit: "cover" }}
                  />
                </div>
              )}
              <div style={{ padding: 20 }}>
                <h3 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8, color: "#1f2937" }}>
                  {prof.name}
                </h3>
                <p style={{ fontSize: 14, fontWeight: 500, color: "#dc2626", marginBottom: 8 }}>
                  {prof.title}
                </p>
                <p style={{ fontSize: 14, color: "#6b7280", lineHeight: 1.6 }}>
                  {prof.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}










