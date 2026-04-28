// app/components/Testimonials.js
"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { FaStar, FaQuoteLeft, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { HiStar } from "react-icons/hi";

export default function Testimonials() {
  const [testimonials, setTestimonials] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    fetchTestimonials();
  }, []);

  const fetchTestimonials = async () => {
    try {
      const res = await fetch("/api/testimonial");
      const data = await res.json();
      setTestimonials(data);
    } catch (error) {
      console.error("Error fetching testimonials:", error);
    }
  };

  // Responsive items per view
  const getItemsPerView = () => {
    if (typeof window !== "undefined") {
      if (window.innerWidth < 640) return 1; // Mobile
      if (window.innerWidth < 1024) return 2; // Tablet
      return 3; // Desktop
    }
    return 3;
  };

  const [itemsPerView, setItemsPerView] = useState(3);

  useEffect(() => {
    const handleResize = () => {
      setItemsPerView(getItemsPerView());
    };

    if (typeof window !== "undefined") {
      setItemsPerView(getItemsPerView());
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }
  }, []);

  // Auto-slide testimonials
  useEffect(() => {
    if (testimonials.length <= itemsPerView) return;
    if (isHovered) return; // Pause on hover

    const interval = setInterval(() => {
      setCurrentIndex((prev) => {
        const maxIndex = Math.max(0, testimonials.length - itemsPerView);
        return prev >= maxIndex ? 0 : prev + 1;
      });
    }, 4000); // Change testimonials every 4 seconds

    return () => clearInterval(interval);
  }, [testimonials.length, itemsPerView, isHovered]);

  const nextTestimonial = () => {
    if (testimonials.length <= itemsPerView) return;
    setCurrentIndex((prev) => {
      const maxIndex = Math.max(0, testimonials.length - itemsPerView);
      return prev >= maxIndex ? 0 : prev + 1;
    });
  };

  const prevTestimonial = () => {
    if (testimonials.length <= itemsPerView) return;
    setCurrentIndex((prev) => {
      const maxIndex = Math.max(0, testimonials.length - itemsPerView);
      return prev <= 0 ? maxIndex : prev - 1;
    });
  };

  if (testimonials.length === 0) return null;

  // Calculate average rating
  const averageRating = testimonials.reduce((sum, t) => sum + t.rating, 0) / testimonials.length;

  return (
    <section
      style={{
        padding: "clamp(40px, 6vw, 60px) clamp(16px, 4vw, 20px)",
        background: "linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto", position: "relative", zIndex: 1 }}>
        {/* Header Section */}
        <div
          style={{
            textAlign: "center",
            marginBottom: "clamp(30px, 5vw, 50px)",
          }}
        >
          <h2
            style={{
              fontSize: "clamp(24px, 5vw, 42px)",
              fontWeight: "bold",
              marginBottom: "clamp(16px, 3vw, 20px)",
              color: "#1f2937",
              lineHeight: 1.2,
            }}
          >
            Love from our customers
          </h2>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "clamp(8px, 2vw, 12px)",
              marginBottom: "12px",
              flexWrap: "wrap",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "clamp(6px, 1.5vw, 8px)",
              }}
            >
              <FaStar
                style={{
                  fontSize: "clamp(24px, 4vw, 36px)",
                  color: "#fbbf24",
                }}
              />
              <span
                style={{
                  fontSize: "clamp(24px, 4vw, 36px)",
                  fontWeight: "bold",
                  color: "#1f2937",
                }}
              >
                {averageRating.toFixed(1)}
              </span>
            </div>
            <div
              style={{
                height: "clamp(30px, 4vw, 40px)",
                width: "2px",
                background: "#e5e7eb",
              }}
            />
            <p
              style={{
                fontSize: "clamp(14px, 2.5vw, 18px)",
                color: "#6b7280",
                margin: 0,
              }}
            >
              {testimonials.length} {testimonials.length === 1 ? "Review" : "Reviews"}
            </p>
          </div>
        </div>

        {/* Testimonials Container with Sliding */}
        <div
          style={{
            overflow: "hidden",
            marginBottom: "clamp(30px, 4vw, 40px)",
            position: "relative",
            width: "100%",
          }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <div
            style={{
              display: "flex",
              gap: "clamp(16px, 3vw, 24px)",
              transform: `translateX(-${currentIndex * (100 / itemsPerView)}%)`,
              transition: "transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          >
            {testimonials.map((testimonial, idx) => (
              <div
                key={testimonial._id}
                style={{
                  background: "white",
                  padding: "clamp(20px, 3vw, 28px)",
                  borderRadius: "16px",
                  boxShadow: "0 4px 6px rgba(0,0,0,0.07), 0 2px 4px rgba(0,0,0,0.06)",
                  transition: "all 0.3s ease",
                  border: "1px solid #e5e7eb",
                  display: "flex",
                  flexDirection: "column",
                  height: "100%",
                  position: "relative",
                  overflow: "hidden",
                  flexShrink: 0,
                  width: `calc((100% - ${(itemsPerView - 1) * 24}px) / ${itemsPerView})`,
                  minWidth: "280px",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-4px)";
                  e.currentTarget.style.boxShadow = "0 12px 24px rgba(0,0,0,0.12), 0 4px 8px rgba(0,0,0,0.08)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 4px 6px rgba(0,0,0,0.07), 0 2px 4px rgba(0,0,0,0.06)";
                }}
              >
                {/* Quote Icon */}
                <div
                  style={{
                    position: "absolute",
                    top: "clamp(12px, 2vw, 16px)",
                    right: "clamp(12px, 2vw, 16px)",
                    color: "#f3f4f6",
                    zIndex: 0,
                  }}
                >
                  <FaQuoteLeft style={{ fontSize: "clamp(36px, 5vw, 48px)" }} />
                </div>

                {/* Customer Info */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    marginBottom: "clamp(16px, 2.5vw, 20px)",
                    position: "relative",
                    zIndex: 1,
                    gap: "clamp(12px, 2vw, 16px)",
                  }}
                >
                  {testimonial.customerImage ? (
                    <div
                      style={{
                        position: "relative",
                        width: "clamp(50px, 6vw, 60px)",
                        height: "clamp(50px, 6vw, 60px)",
                        borderRadius: "50%",
                        overflow: "hidden",
                        border: "3px solid #f3f4f6",
                        flexShrink: 0,
                      }}
                    >
                      <Image
                        src={testimonial.customerImage}
                        alt={testimonial.customerName}
                        fill
                        style={{ objectFit: "cover" }}
                      />
                    </div>
                  ) : (
                    <div
                      style={{
                        width: "clamp(50px, 6vw, 60px)",
                        height: "clamp(50px, 6vw, 60px)",
                        borderRadius: "50%",
                        background: "linear-gradient(135deg, var(--accent-terracotta) 0%, var(--accent-coral) 100%)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "white",
                        fontSize: "clamp(20px, 3vw, 24px)",
                        fontWeight: "bold",
                        flexShrink: 0,
                      }}
                    >
                      {testimonial.customerName?.charAt(0)?.toUpperCase() || "?"}
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h4
                      style={{
                        fontSize: "clamp(16px, 2.5vw, 18px)",
                        fontWeight: 600,
                        marginBottom: "clamp(4px, 1vw, 6px)",
                        color: "#1f2937",
                        lineHeight: 1.2,
                      }}
                    >
                      {testimonial.customerName}
                    </h4>
                    <div style={{ display: "flex", gap: "2px", alignItems: "center", flexWrap: "wrap" }}>
                      {[...Array(5)].map((_, i) => (
                        <FaStar
                          key={i}
                          style={{
                            color: i < testimonial.rating ? "#fbbf24" : "#e5e7eb",
                            fontSize: "clamp(12px, 2vw, 16px)",
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Review Text */}
                <p
                  style={{
                    fontSize: "clamp(14px, 2vw, 15px)",
                    color: "#374151",
                    lineHeight: 1.7,
                    margin: 0,
                    flex: 1,
                    position: "relative",
                    zIndex: 1,
                  }}
                >
                  {testimonial.review}
                </p>

                {/* Service/Employee Info */}
                {(testimonial.service || testimonial.employee) && (
                  <div
                    style={{
                      marginTop: "clamp(12px, 2vw, 16px)",
                      paddingTop: "clamp(12px, 2vw, 16px)",
                      borderTop: "1px solid #e5e7eb",
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "clamp(6px, 1vw, 8px)",
                      position: "relative",
                      zIndex: 1,
                    }}
                  >
                    {testimonial.service && (
                      <span
                        style={{
                          display: "inline-block",
                          padding: "clamp(4px, 1vw, 6px) clamp(10px, 2vw, 12px)",
                          background: "#fef3c7",
                          color: "#92400e",
                          borderRadius: "20px",
                          fontSize: "clamp(11px, 1.5vw, 12px)",
                          fontWeight: 500,
                        }}
                      >
                        {testimonial.service}
                      </span>
                    )}
                    {testimonial.employee && (
                      <span
                        style={{
                          display: "inline-block",
                          padding: "clamp(4px, 1vw, 6px) clamp(10px, 2vw, 12px)",
                          background: "#dbeafe",
                          color: "var(--accent-terracotta)",
                          borderRadius: "20px",
                          fontSize: "clamp(11px, 1.5vw, 12px)",
                          fontWeight: 500,
                        }}
                      >
                        {testimonial.employee?.name || "Employee"}
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Navigation Controls */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "clamp(12px, 3vw, 20px)",
            flexWrap: "wrap",
          }}
        >
          <button
            onClick={prevTestimonial}
            disabled={testimonials.length <= itemsPerView}
            style={{
              width: "clamp(40px, 5vw, 48px)",
              height: "clamp(40px, 5vw, 48px)",
              borderRadius: "50%",
              border: "2px solid var(--accent-terracotta)",
              background: testimonials.length <= itemsPerView ? "#f3f4f6" : "white",
              color: testimonials.length <= itemsPerView ? "#9ca3af" : "var(--accent-terracotta)",
              cursor: testimonials.length <= itemsPerView ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.2s ease",
              boxShadow: "0 2px 4px rgba(99, 102, 241, 0.2)",
            }}
            onMouseEnter={(e) => {
              if (testimonials.length > itemsPerView) {
                e.currentTarget.style.background = "var(--accent-terracotta)";
                e.currentTarget.style.color = "white";
                e.currentTarget.style.transform = "scale(1.1)";
              }
            }}
            onMouseLeave={(e) => {
              if (testimonials.length > itemsPerView) {
                e.currentTarget.style.background = "white";
                e.currentTarget.style.color = "var(--accent-terracotta)";
                e.currentTarget.style.transform = "scale(1)";
              }
            }}
            aria-label="Previous testimonial"
          >
            <FaChevronLeft style={{ fontSize: "clamp(14px, 2vw, 18px)" }} />
          </button>

          {/* Progress Indicator */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "clamp(6px, 1.5vw, 8px)",
              minWidth: "clamp(100px, 15vw, 120px)",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                flex: 1,
                height: "4px",
                background: "#e5e7eb",
                borderRadius: "2px",
                position: "relative",
                overflow: "hidden",
                maxWidth: "200px",
              }}
            >
              <div
                style={{
                  width: testimonials.length > itemsPerView 
                    ? `${((currentIndex + itemsPerView) / testimonials.length) * 100}%`
                    : "100%",
                  height: "100%",
                  background: "linear-gradient(90deg, var(--accent-terracotta) 0%, var(--accent-coral) 100%)",
                  borderRadius: "2px",
                  transition: "width 0.5s ease",
                }}
              />
            </div>
            <span
              style={{
                color: "#6b7280",
                fontSize: "clamp(12px, 2vw, 14px)",
                fontWeight: 500,
                minWidth: "clamp(40px, 6vw, 50px)",
                textAlign: "center",
              }}
            >
              {testimonials.length > itemsPerView 
                ? `${Math.min(currentIndex + itemsPerView, testimonials.length)}/${testimonials.length}`
                : `${testimonials.length}/${testimonials.length}`
              }
            </span>
          </div>

          <button
            onClick={nextTestimonial}
            disabled={testimonials.length <= itemsPerView}
            style={{
              width: "clamp(40px, 5vw, 48px)",
              height: "clamp(40px, 5vw, 48px)",
              borderRadius: "50%",
              border: "2px solid var(--accent-terracotta)",
              background: testimonials.length <= itemsPerView ? "#f3f4f6" : "white",
              color: testimonials.length <= itemsPerView ? "#9ca3af" : "var(--accent-terracotta)",
              cursor: testimonials.length <= itemsPerView ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.2s ease",
              boxShadow: "0 2px 4px rgba(99, 102, 241, 0.2)",
            }}
            onMouseEnter={(e) => {
              if (testimonials.length > itemsPerView) {
                e.currentTarget.style.background = "var(--accent-terracotta)";
                e.currentTarget.style.color = "white";
                e.currentTarget.style.transform = "scale(1.1)";
              }
            }}
            onMouseLeave={(e) => {
              if (testimonials.length > itemsPerView) {
                e.currentTarget.style.background = "white";
                e.currentTarget.style.color = "var(--accent-terracotta)";
                e.currentTarget.style.transform = "scale(1)";
              }
            }}
            aria-label="Next testimonial"
          >
            <FaChevronRight style={{ fontSize: "clamp(14px, 2vw, 18px)" }} />
          </button>
        </div>
      </div>
    </section>
  );
}
