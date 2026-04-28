"use client";
import { FaUsers, FaAward, FaStar, FaSmile } from "react-icons/fa";
import { useEffect, useMemo, useRef, useState } from "react";

export default function StatsSection() {
  const stats = useMemo(
    () => [
      { icon: FaUsers, target: 10000, suffix: "+", label: "Satisfied Customers", color: "var(--accent-terracotta)" },
      { icon: FaAward, target: 15, suffix: "+", label: "Years Experience", color: "#f59e0b" },
      { icon: FaStar, target: 4.9, suffix: "", label: "Average Rating", color: "#fbbf24" },
      { icon: FaSmile, target: 50, suffix: "+", label: "Expert Staff", color: "#10b981" },
    ],
    []
  );

  const wrapRef = useRef(null);
  const [started, setStarted] = useState(false);
  const [values, setValues] = useState(stats.map(() => 0));

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) setStarted(true);
      },
      { threshold: 0.25 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!started) return;
    const start = performance.now();
    const duration = 1400;

    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setValues(stats.map((s) => s.target * eased));
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [started, stats]);

  const format = (idx) => {
    const s = stats[idx];
    const v = values[idx] ?? 0;
    if (s.target >= 1000) {
      const k = Math.floor(v / 1000);
      return `${k}K${s.suffix}`;
    }
    if (Number.isInteger(s.target)) return `${Math.floor(v)}${s.suffix}`;
    return `${(v || 0).toFixed(1)}${s.suffix}`;
  };

  return (
    <section
      className="relative overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #2d2d2d 0%, #1a1a1a 50%, #252525 100%)",
      }}
    >
      {/* Subtle pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
          backgroundSize: "24px 24px",
        }}
      />

      <div ref={wrapRef} className="relative max-w-6xl mx-auto px-4 md:px-6 py-10 md:py-12">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={index}
                className="group flex flex-col items-center text-center
                  px-4 py-6 rounded-xl
                  transition-all duration-300 ease-out
                  hover:bg-white/5 hover:scale-[1.02]
                  border border-white/5 hover:border-white/10"
              >
                <div
                  className="w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center mb-4
                    transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg"
                  style={{
                    background: `${stat.color}22`,
                    boxShadow: `0 4px 20px ${stat.color}30`,
                  }}
                >
                  <Icon
                    className="text-2xl md:text-3xl"
                    style={{ color: stat.color }}
                  />
                </div>
                <span className="text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight mb-1 text-white">
                  {format(index)}
                </span>
                <p className="text-sm md:text-base text-white/80 font-medium">
                  {stat.label}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
