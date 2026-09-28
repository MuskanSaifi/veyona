"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

const DEFAULT_IMAGE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='280'%3E%3Crect fill='%23e7e5e4' width='400' height='280'/%3E%3C/svg%3E";

function AdBody({ promo }) {
  return (
    <>
      <div className="relative h-[150px] sm:h-[168px] bg-stone-200">
        <Image
          src={promo.image || DEFAULT_IMAGE}
          alt={promo.title || "Offer"}
          fill
          className="object-cover"
          sizes="220px"
        />
      </div>
      <div
        className="px-3.5 pt-3.5 pb-4 text-white"
        style={{ background: "var(--accent-terracotta)" }}
      >
        {promo.badge && (
          <div className="text-[10px] font-bold uppercase tracking-wider text-white/80 mb-1">
            {promo.badge}
          </div>
        )}
        {promo.title && (
          <div className="text-[15px] leading-snug font-bold">{promo.title}</div>
        )}
        {promo.subtitle && (
          <p className="mt-1 text-[12px] leading-snug text-white/90 line-clamp-3">
            {promo.subtitle}
          </p>
        )}
        {promo.linkUrl && (
          <span className="mt-3 inline-flex items-center justify-center rounded-md bg-white px-3 py-1.5 text-[12px] font-bold text-gray-900">
            {promo.linkLabel || "Book Now"}
          </span>
        )}
      </div>
    </>
  );
}

export default function PromoBannersSection({ placement = "homepage" }) {
  const [promos, setPromos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);
  const [closed, setClosed] = useState(false);

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

  useEffect(() => {
    if (promos.length < 2 || closed) return undefined;
    const timer = setInterval(() => {
      setIndex((current) => (current + 1) % promos.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [promos.length, closed]);

  if (loading || closed || promos.length === 0) return null;

  const promo = promos[index] || promos[0];
  const href = promo.linkUrl?.trim();
  const cardClass =
    "block w-[200px] sm:w-[220px] overflow-hidden rounded-xl bg-white shadow-[0_10px_30px_rgba(15,23,42,0.22)]";

  const card = href ? (
    href.startsWith("http") ? (
      <a href={href} target="_blank" rel="noopener noreferrer" className={cardClass}>
        <AdBody promo={promo} />
      </a>
    ) : (
      <Link href={href} className={cardClass}>
        <AdBody promo={promo} />
      </Link>
    )
  ) : (
    <div className={cardClass}>
      <AdBody promo={promo} />
    </div>
  );

  return (
    <aside
      className="fixed z-[900] right-4 sm:right-6 top-[62%] -translate-y-1/2"
      aria-label="Promotion"
    >
      <button
        type="button"
        aria-label="Close offer"
        onClick={() => setClosed(true)}
        className="absolute -top-2 -right-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-white text-gray-700 text-sm shadow-md border border-gray-200"
      >
        ×
      </button>
      {card}
      {promos.length > 1 && (
        <div className="mt-2 flex justify-center gap-1.5">
          {promos.map((item, dotIndex) => (
            <button
              key={item._id}
              type="button"
              aria-label={`Show offer ${dotIndex + 1}`}
              onClick={() => setIndex(dotIndex)}
              className={`h-1.5 rounded-full ${
                dotIndex === index ? "w-4 bg-[var(--accent-terracotta)]" : "w-1.5 bg-gray-300"
              }`}
            />
          ))}
        </div>
      )}
    </aside>
  );
}
