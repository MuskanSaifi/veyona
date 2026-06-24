"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

const DEFAULT_IMAGE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='360'%3E%3Crect fill='%23f3e8e2' width='600' height='360'/%3E%3Ctext fill='%23a16207' font-family='sans-serif' font-size='20' x='50%25' y='50%25' text-anchor='middle' dy='.3em'%3EOffer%3C/text%3E%3C/svg%3E";

function PromoLink({ promo, children }) {
  const href = promo.linkUrl?.trim();
  if (!href) return children;
  const isExternal = href.startsWith("http");
  if (isExternal) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className="block h-full">
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className="block h-full">
      {children}
    </Link>
  );
}

export default function PromoBannersSection({ placement = "homepage", title = "Special Offers" }) {
  const [promos, setPromos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const params = new URLSearchParams();
        if (placement) params.set("placement", placement);
        const res = await fetch(`/api/promotional-banner?${params.toString()}`);
        const data = await res.json();
        setPromos(Array.isArray(data) ? data : []);
      } catch {
        setPromos([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [placement]);

  if (loading || promos.length === 0) return null;

  return (
    <section className="w-full py-12 md:py-16" style={{ background: "var(--bg-cream)" }}>
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 md:mb-10">
          <h2 className="text-2xl md:text-4xl font-bold text-gray-900 mb-2">{title}</h2>
          <div className="w-20 h-1 bg-gradient-to-r from-[var(--accent-terracotta)] to-[var(--accent-coral)] mx-auto rounded-full" />
        </div>

        <div
          className={`grid gap-5 md:gap-6 ${
            promos.length === 1
              ? "grid-cols-1 max-w-2xl mx-auto"
              : promos.length === 2
                ? "grid-cols-1 md:grid-cols-2"
                : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
          }`}
        >
          {promos.map((promo) => (
            <article
              key={promo._id}
              className="group relative overflow-hidden rounded-2xl bg-white shadow-[0_16px_40px_rgba(15,23,42,0.08)] border border-white/80 hover:shadow-[0_24px_56px_rgba(15,23,42,0.12)] transition-all duration-300 hover:-translate-y-1"
            >
              <PromoLink promo={promo}>
                <div className="relative h-44 sm:h-48 md:h-52 overflow-hidden bg-slate-100">
                  <Image
                    src={promo.image || DEFAULT_IMAGE}
                    alt={promo.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  {promo.badge && (
                    <span className="absolute top-3 left-3 px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wider bg-[var(--accent-coral)] text-white shadow-md">
                      {promo.badge}
                    </span>
                  )}
                </div>

                <div className="p-4 sm:p-5">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 leading-tight mb-1.5 group-hover:text-[var(--accent-terracotta)] transition-colors">
                    {promo.title}
                  </h3>
                  {promo.subtitle && (
                    <p className="text-sm text-gray-600 line-clamp-2 mb-4">{promo.subtitle}</p>
                  )}
                  {promo.linkUrl && (
                    <span className="inline-flex items-center text-sm font-semibold text-[var(--accent-terracotta)]">
                      {promo.linkLabel || "Book Now"}
                      <span className="ml-1 transition-transform group-hover:translate-x-1">→</span>
                    </span>
                  )}
                </div>
              </PromoLink>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
