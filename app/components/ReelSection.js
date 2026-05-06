"use client";
import { useEffect, useState } from "react";

export default function ReelSection() {
  const [reels, setReels] = useState([]);

  useEffect(() => {
    fetchReels();
  }, []);

  const fetchReels = async () => {
    try {
      const res = await fetch("/api/reels");
      if (res.ok) {
        const data = await res.json();
        setReels(data);
      }
    } catch (error) {
      console.error("Error fetching reels:", error);
    }
  };

  if (reels.length === 0) return null;

  return (
    <section style={{ padding: "clamp(40px, 8vw, 80px) 0", background: "var(--bg-white)" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 20px" }}>
        <h2 style={{ textAlign: "center", marginBottom: "40px", fontSize: "clamp(24px, 4vw, 36px)", color: "var(--text-dark)" }}>
          Our Reels
        </h2>
        <div style={{ display: "flex", gap: "20px", overflowX: "auto", paddingBottom: "20px" }}>
          {reels.map((reel) => (
            <div key={reel._id} style={{ minWidth: "300px", flexShrink: 0 }}>
              <video
                src={reel.video}
                controls
                autoPlay
                muted
                loop
                style={{ width: "100%", height: "200px", objectFit: "cover", borderRadius: "8px" }}
              />
              <h3 style={{ marginTop: "10px", fontSize: "18px" }}>{reel.title}</h3>
              <p style={{ color: "var(--text-muted)" }}>{reel.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}