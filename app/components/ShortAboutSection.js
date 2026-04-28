"use client";
import { useEffect, useState } from "react";
import Image from "next/image";

const DEFAULT_IMAGE = "/images/about-veyona.png";

export default function ShortAboutSection() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/home-about")
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return null;

  const image = data?.image || DEFAULT_IMAGE;
  const subtitle = data?.subtitle || "We Provide";
  const title = data?.title || "Welcome to Spa Center";
  const description = data?.description || "Spread over two floors, our beautiful spa offers a soothing environment in which you can rest, relax and feel completely rejuvenated.";

  if (data && !data.active) return null;

  return (
    <section
      className="w-full py-14 md:py-20"
      style={{ background: "#fff" }}
    >
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          {/* Left - Image (plain, no border) */}
          <div className="relative order-2 lg:order-1 flex justify-center lg:justify-start">
            <div
              className="relative max-w-[520px] w-full overflow-hidden bg-white"
              style={{
                aspectRatio: "4 / 3",
              }}
            >
              <Image
                src={image}
                alt={title}
                fill
                className="object-contain"
                sizes="(max-width: 768px) 100vw, 50vw"
                onError={(e) => {
                  e.target.src = DEFAULT_IMAGE;
                }}
              />
            </div>
          </div>

          {/* Right - Content */}
          <div className="order-1 lg:order-2">
            <p
              className="text-sm font-semibold uppercase tracking-wider mb-2"
              style={{ color: "#9ca3af" }}
            >
              {subtitle}
            </p>
            <h2
              className="text-3xl md:text-4xl font-bold mb-6"
              style={{ color: "#222222" }}
            >
              {title}
            </h2>
            <div
              className="text-gray-600 leading-relaxed whitespace-pre-line"
              style={{ fontSize: "clamp(15px, 2vw, 17px)" }}
            >
              {description}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
