"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function PromoSitewideBar() {
  const pathname = usePathname();
  const [promos, setPromos] = useState([]);

  useEffect(() => {
    if (
      pathname?.startsWith("/admin") ||
      pathname?.startsWith("/employee") ||
      pathname?.startsWith("/user")
    ) {
      return;
    }
    fetch("/api/promotional-banner?placement=sitewide")
      .then((r) => r.json())
      .then((data) => setPromos(Array.isArray(data) ? data : []))
      .catch(() => setPromos([]));
  }, [pathname]);

  if (!promos.length) return null;

  return (
    <div className="w-full bg-gradient-to-r from-[var(--accent-brown)]/10 via-[var(--bg-cream)] to-[var(--accent-coral)]/10 border-b border-[var(--border-light)]">
      <div className="max-w-[1200px] mx-auto px-4 py-2.5 flex gap-3 overflow-x-auto scrollbar-hide">
        {promos.map((promo) => {
          const inner = (
            <div className="flex items-center gap-3 min-w-[260px] max-w-sm shrink-0 bg-white/90 rounded-xl px-3 py-2 border border-[var(--border-light)] shadow-sm hover:shadow-md transition-shadow">
              {promo.image && (
                <div className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0">
                  <Image
                    src={promo.image}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="48px"
                  />
                </div>
              )}
              <div className="min-w-0 flex-1">
                {promo.badge && (
                  <span className="text-[9px] font-bold uppercase tracking-wider text-[var(--accent-coral)]">
                    {promo.badge}
                  </span>
                )}
                <div className="text-sm font-semibold text-gray-900 truncate">{promo.title}</div>
              </div>
              {promo.linkUrl && (
                <span className="text-xs font-bold text-[var(--accent-terracotta)] shrink-0">
                  {promo.linkLabel || "View"} →
                </span>
              )}
            </div>
          );

          const href = promo.linkUrl?.trim();
          if (!href) {
            return <div key={promo._id}>{inner}</div>;
          }
          if (href.startsWith("http")) {
            return (
              <a key={promo._id} href={href} target="_blank" rel="noopener noreferrer">
                {inner}
              </a>
            );
          }
          return (
            <Link key={promo._id} href={href}>
              {inner}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
