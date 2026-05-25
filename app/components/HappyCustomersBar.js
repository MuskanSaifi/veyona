"use client";

import { useEffect, useRef, useState } from "react";
import { FaHeart, FaSmileBeam } from "react-icons/fa";

/**
 * Thin announcement-style strip rendered at the very top of the site header.
 * Shows the admin-configured "Happy Customers" count, animated up from 0.
 *
 * Returns null when disabled or count is 0 so the header stays clean.
 */
export default function HappyCustomersBar() {
  const [settings, setSettings] = useState(null);
  const [display, setDisplay] = useState(0);
  const animatedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/site-settings", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) setSettings(data);
      } catch {
        // silently ignore — the bar is non-critical chrome
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Count-up animation: 0 → target over ~1.4s, easeOutCubic.
  useEffect(() => {
    if (!settings || animatedRef.current) return;
    const target = Number(settings.happyCustomersCount) || 0;
    if (target <= 0) return;
    animatedRef.current = true;

    const start = performance.now();
    const duration = 1400;

    let raf;
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(target * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [settings]);

  if (!settings) return null;
  if (!settings.happyCustomersEnabled) return null;
  if (!settings.happyCustomersCount || settings.happyCustomersCount <= 0) return null;

  return (
    <div
      style={{
        background:
          "linear-gradient(90deg, var(--accent-terracotta, #AD6E5E) 0%, var(--accent-coral, #F28F79) 100%)",
        color: "#fff",
        textAlign: "center",
        padding: "8px 16px",
        fontSize: "13px",
        fontWeight: 600,
        letterSpacing: "0.02em",
        lineHeight: 1.4,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "10px",
        flexWrap: "wrap",
      }}
      aria-label={`${settings.happyCustomersCount}${settings.happyCustomersSuffix || ""} ${settings.happyCustomersLabel}`}
    >
      <FaSmileBeam style={{ fontSize: 16, flexShrink: 0 }} />
      <span>
        <strong style={{ fontSize: 15, marginRight: 2 }}>
          {display.toLocaleString("en-IN")}
          {settings.happyCustomersSuffix || ""}
        </strong>{" "}
        {settings.happyCustomersLabel}
      </span>
      <FaHeart style={{ fontSize: 14, flexShrink: 0, color: "#ffe4e1" }} />
    </div>
  );
}
