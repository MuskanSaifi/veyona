"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import FeaturedProfessionals from "./components/FeaturedProfessionals";
import Testimonials from "./components/Testimonials";
import AppDownload from "./components/AppDownload";
import TopBlogs from "./components/TopBlogs";
import FaqSection from "./components/FaqSection";
import BookSection from "./components/BookSection";
import WhyChooseUs from "./components/WhyChooseUs";
import TrustSignals from "./components/TrustSignals";
import StatsSection from "./components/StatsSection";
import CategoriesSection from "./components/CategoriesSection";
import VideoSection from "./components/VideoSection";
import ServicesSection from "./components/ServicesSection";
import AllProductsSection from "./components/AllProductsSection";
import ShortAboutSection from "./components/ShortAboutSection";

export default function Home() {
  const [banners, setBanners] = useState([]);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [isBannerHovered, setIsBannerHovered] = useState(false);

  useEffect(() => {
    fetchBanners();
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const checkMobile = () => {
    setIsMobile(window.innerWidth <= 768);
  };

  // Auto-slide banners
  useEffect(() => {
    if (banners.length <= 1) return;
    if (isBannerHovered) return; // Pause on hover
    // Desktop UX: avoid auto-changing banners
    if (!isMobile) return;

    const interval = setInterval(() => {
      setCurrentBannerIndex((prev) => (prev + 1) % banners.length);
    }, 5000); // Change banner every 5 seconds

    return () => clearInterval(interval);
  }, [banners.length, isBannerHovered, isMobile]);

  const fetchBanners = async () => {
    try {
      const res = await fetch("/api/banner");
      const data = await res.json();
      const activeBanners = data.filter((b) => b.active);
      setBanners(activeBanners);
    } catch (error) {
      console.error("Error fetching banners:", error);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-cream)" }}>
      {/* Banners Section with Slider */}
      {banners.length > 0 && (
        <section 
          className="banner-section"
          style={{ 
            marginBottom: "clamp(30px, 6vw, 60px)", 
            marginTop: 0, 
            paddingTop: 0,
            position: "relative", 
            width: "100%",
            display: "block",
          }}
        >
          <div 
            className="banner-container"
            style={{ 
              position: "relative", 
              width: "100%", 
              height: "clamp(300px, 50vw, 600px)", 
              overflow: "hidden",
            }}
            onMouseEnter={() => setIsBannerHovered(true)}
            onMouseLeave={() => setIsBannerHovered(false)}
          >
            {banners.map((banner, index) => (
              <div
                key={banner._id}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  opacity: index === currentBannerIndex ? 1 : 0,
                  transition: "opacity 0.8s ease-in-out",
                  zIndex: index === currentBannerIndex ? 2 : 1,
                  pointerEvents: index === currentBannerIndex ? "auto" : "none",
                }}
              >
                <Image
                  src={isMobile && banner.mobileImage ? banner.mobileImage : banner.image}
                  alt={banner.title || `Banner ${index + 1}`}
                  fill
                  className="banner-image"
                  style={{ 
                    // Full-width banner without side bars
                    objectFit: "cover",
                    objectPosition: "center center",
                  }}
                  priority={index === 0}
                  quality={90}
                  sizes="100vw"
                />
                {/* Title & Description overlay - like Laser Skin Resurfacing banner */}
                {(banner.title || banner.description) && (
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.4) 100%)",
                      padding: "clamp(20px, 4vw, 40px)",
                      textAlign: "center",
                    }}
                  >
                    {banner.title && (
                      <h1
                        style={{
                          fontSize: "clamp(28px, 5vw, 48px)",
                          fontWeight: 600,
                          color: "#fff",
                          margin: 0,
                          marginBottom: banner.description ? "clamp(8px, 2vw, 16px)" : 0,
                          textShadow: "0 2px 12px rgba(0,0,0,0.5)",
                          letterSpacing: "0.02em",
                        }}
                      >
                        {banner.title}
                      </h1>
                    )}
                    {banner.description && (
                      <p
                        style={{
                          fontSize: "clamp(14px, 2.5vw, 20px)",
                          color: "rgba(255,255,255,0.95)",
                          margin: 0,
                          maxWidth: "600px",
                          textShadow: "0 1px 8px rgba(0,0,0,0.5)",
                          lineHeight: 1.5,
                        }}
                      >
                        {banner.description}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}

            {/* Navigation Arrows */}
            {banners.length > 1 && (
              <>
                <button
                  onClick={() =>
                    setCurrentBannerIndex(
                      (prev) => (prev - 1 + banners.length) % banners.length
                    )
                  }
                  className="banner-nav-btn"
                  style={{
                    position: "absolute",
                    left: "clamp(10px, 2vw, 20px)",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "rgba(255, 255, 255, 0.9)",
                    border: "none",
                    width: "clamp(40px, 6vw, 50px)",
                    height: "clamp(40px, 6vw, 50px)",
                    borderRadius: "50%",
                    cursor: "pointer",
                    zIndex: 10,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "clamp(20px, 3vw, 24px)",
                    color: "var(--accent-terracotta)",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "var(--accent-coral)";
                    e.currentTarget.style.color = "white";
                    e.currentTarget.style.transform = "translateY(-50%) scale(1.1)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(255, 255, 255, 0.9)";
                    e.currentTarget.style.color = "var(--accent-terracotta)";
                    e.currentTarget.style.transform = "translateY(-50%) scale(1)";
                  }}
                  aria-label="Previous banner"
                >
                  ‹
                </button>
                <button
                  onClick={() =>
                    setCurrentBannerIndex((prev) => (prev + 1) % banners.length)
                  }
                  className="banner-nav-btn"
                  style={{
                    position: "absolute",
                    right: "clamp(10px, 2vw, 20px)",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "rgba(255, 255, 255, 0.9)",
                    border: "none",
                    width: "clamp(40px, 6vw, 50px)",
                    height: "clamp(40px, 6vw, 50px)",
                    borderRadius: "50%",
                    cursor: "pointer",
                    zIndex: 10,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "clamp(20px, 3vw, 24px)",
                    color: "var(--accent-terracotta)",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "var(--accent-coral)";
                    e.currentTarget.style.color = "white";
                    e.currentTarget.style.transform = "translateY(-50%) scale(1.1)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(255, 255, 255, 0.9)";
                    e.currentTarget.style.color = "var(--accent-terracotta)";
                    e.currentTarget.style.transform = "translateY(-50%) scale(1)";
                  }}
                  aria-label="Next banner"
                >
                  ›
                </button>
              </>
            )}

            {/* Dots Indicator */}
            {banners.length > 1 && (
              <div
                style={{
                  position: "absolute",
                  bottom: "clamp(12px, 2vw, 20px)",
                  left: "50%",
                  transform: "translateX(-50%)",
                  display: "flex",
                  gap: "clamp(6px, 1.5vw, 10px)",
                  zIndex: 10,
                }}
              >
                {banners.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentBannerIndex(index)}
                    style={{
                      width: index === currentBannerIndex ? "clamp(24px, 4vw, 30px)" : "clamp(8px, 1.5vw, 12px)",
                      height: "clamp(8px, 1.5vw, 12px)",
                      borderRadius: 6,
                      border: "none",
                      background:
                        index === currentBannerIndex
                          ? "var(--accent-coral)"
                          : "rgba(255, 255, 255, 0.5)",
                      cursor: "pointer",
                      transition: "all 0.3s",
                    }}
                    aria-label={`Go to banner ${index + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Short About Section - dynamic (image left, content right) */}
      <ShortAboutSection />

      {/* Our Services - 2x2 simple cards (Beauty, Aesthetics, Dental, Tattoo) */}
      <section className="w-full py-14 md:py-20" style={{ background: "var(--bg-cream)" }}>
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-3xl md:text-4xl font-bold mb-3 text-gray-900">
            Our Services
          </h2>
          <p className="text-center text-gray-600 max-w-2xl mx-auto mb-10 text-sm md:text-base">
            Spread over two floors, our beautiful spa offers a soothing environment in which you can rest, relax and feel completely rejuvenated.
          </p>
          <CategoriesSection
            types={["salon", "dentist", "tattoo"]}
            useLink={true}
            showHeader={false}
            showChildren={false}
            simpleLayout={true}
          />
        </div>
      </section>

      {/* Products Section - Show all products */}
      <AllProductsSection />

      {/* Book Appointment Section */}
      <BookSection />

      {/* Why Choose Us Section */}
      <WhyChooseUs />

      {/* Trust Building Section */}
      <TrustSignals />

      {/* Featured Professionals Section */}
      <FeaturedProfessionals />

      {/* Testimonials Section */}
      <Testimonials />

      {/* Top Blogs Section */}
      <TopBlogs />

       {/* Video Section */}
       {/* <VideoSection
        videoSrc="/vedio.mp4" // Add your video path here
        posterImage="/images/video-poster.jpg" // Optional: Add poster image
        title="Experience Veyona"
        description="Your trusted partner for premium salon and dental care services"
      /> */}

      <FaqSection />

      {/* App Download Section */}
      <AppDownload />
      
       {/* Stats Section */}
       <StatsSection />
    </div>
  );
}
