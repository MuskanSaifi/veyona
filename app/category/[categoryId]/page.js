
"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import ServicesSection from "@/app/components/ServicesSection";
import ProductsSection from "@/app/components/ProductsSection";
import { FaArrowLeft, FaPhone, FaEnvelope, FaWhatsapp } from "react-icons/fa";

export default function CategoryPage() {
  const params = useParams();
  const router = useRouter();
  const categoryId = params.categoryId;
  const [category, setCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("salon");

  useEffect(() => {
    if (categoryId) {
      fetchCategory();
    }
  }, [categoryId]);

  const fetchCategory = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/category/${categoryId}`);
      if (!res.ok) {
        throw new Error("Category not found");
      }
      const data = await res.json();
      setCategory(data);
      setTypeFilter(data.type || "salon");
    } catch (error) {
      console.error("Error fetching category:", error);
      router.push("/");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 border-4 border-[var(--border-light)] rounded-full"></div>
            <div className="absolute inset-0 border-4 border-[var(--accent-terracotta)] rounded-full border-t-transparent animate-spin"></div>
          </div>
          <p className="text-gray-600 text-lg font-medium">Loading category...</p>
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-24 h-24 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-12 h-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Category Not Found</h1>
          <p className="text-gray-600 mb-8">The category you're looking for doesn't exist.</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--accent-terracotta)] text-white font-semibold rounded-lg hover:opacity-90 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <FaArrowLeft /> Go back to Home
          </Link>
        </div>
      </div>
    );
  }

  const gradientClass = category.type === "dentist" 
    ? "bg-gradient-to-br from-blue-600 via-cyan-600 to-teal-600"
    : category.type === "tattoo"
    ? "bg-gradient-to-br from-pink-600 via-rose-600 to-red-600"
    : "bg-gradient-to-br from-[var(--accent-terracotta)] via-[var(--accent-coral)] to-[var(--accent-brown)]";

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* Enhanced Category Hero Section */}
      <section className={`relative ${gradientClass} overflow-hidden`}>
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }}></div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-20">
          {/* Back Button */}
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-white/90 hover:text-white mb-8 sm:mb-10 text-sm sm:text-base font-medium transition-all group"
          >
            <FaArrowLeft className="group-hover:-translate-x-1 transition-transform" />
            Back
          </button>

          <div className="text-center">
            {/* Category Image - Large and Prominent */}
            {category.image && (
              <div className="relative inline-block mb-6 sm:mb-8">
                <div className="relative w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl ring-4 ring-white/30 transform hover:scale-105 transition-transform duration-300">
                  <Image
                    src={category.image}
                    alt={category.name}
                    fill
                    className="object-cover"
                    priority
                  />
                </div>
              </div>
            )}

            {/* Category Title - Large and Bold */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-white mb-4 sm:mb-6 tracking-tight px-2 uppercase">
              {category.name}
            </h1>

            {/* Category Description */}
            {category.description && (
              <p className="text-base sm:text-lg md:text-xl text-white/95 max-w-3xl mx-auto leading-relaxed mb-8 sm:mb-10 px-4">
                {category.description}
              </p>
            )}

            {/* Call to Action Buttons */}
            <div className="flex flex-wrap gap-3 sm:gap-4 justify-center items-center mt-6 sm:mt-8 px-4">
              <div className="px-5 py-2.5 sm:px-6 sm:py-3 md:px-8 md:py-3 bg-white/25 backdrop-blur-md rounded-full text-white text-sm sm:text-base md:text-lg font-bold border-2 border-white/40 shadow-lg hover:bg-white/35 hover:scale-110 transition-all duration-300 cursor-default">
                Premium Quality
              </div>
              <div className="px-5 py-2.5 sm:px-6 sm:py-3 md:px-8 md:py-3 bg-white/25 backdrop-blur-md rounded-full text-white text-sm sm:text-base md:text-lg font-bold border-2 border-white/40 shadow-lg hover:bg-white/35 hover:scale-110 transition-all duration-300 cursor-default">
                Expert Care
              </div>
              <div className="px-5 py-2.5 sm:px-6 sm:py-3 md:px-8 md:py-3 bg-white/25 backdrop-blur-md rounded-full text-white text-sm sm:text-base md:text-lg font-bold border-2 border-white/40 shadow-lg hover:bg-white/35 hover:scale-110 transition-all duration-300 cursor-default">
                Best Prices
              </div>
            </div>
          </div>
        </div>

        {/* Wave Separator */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-12 md:h-20">
            <path d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="rgb(249 250 251)" />
          </svg>
        </div>
      </section>

      {/* Services Section */}
      {category && (
        <div className="relative -mt-8 sm:-mt-10 md:-mt-12 lg:-mt-16">
          <ServicesSection category={category} typeFilter={typeFilter} />
        </div>
      )}

      {/* Products Section */}
      {category && (
        <div className="relative">
          <ProductsSection category={category} typeFilter={typeFilter} />
        </div>
      )}

      {/* Enhanced Call to Action Section */}
      <section className="relative py-12 sm:py-16 md:py-20 bg-gradient-to-br from-white via-[color:var(--bg-cream)] to-[color:var(--border-light)] overflow-hidden">
        {/* Background Decoration */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[color:var(--accent-terracotta)]/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-200/30 rounded-full blur-3xl"></div>

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-block px-4 py-2 bg-[color:var(--accent-terracotta)]/20 text-[var(--accent-terracotta)] rounded-full text-sm font-semibold mb-6">
            Need Assistance?
          </div>
          
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-3 sm:mb-4 px-4">
            We're Here to Help You
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-gray-600 mb-8 sm:mb-10 md:mb-12 max-w-2xl mx-auto leading-relaxed px-4">
            Our expert team is ready to assist you in finding the perfect service or product for your needs.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-5 md:gap-6 mb-8 sm:mb-10 md:mb-12 px-4">
            {/* Contact Card */}
            <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-2 border border-gray-100">
              <div className="w-16 h-16 bg-[color:var(--accent-terracotta)]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaPhone className="text-2xl" style={{ color: "var(--accent-terracotta)" }} />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Call Us</h3>
              <p className="text-gray-600 text-sm mb-4">Speak directly with our team</p>
              <a
                href="tel:+919009390054"
                className="font-semibold transition-colors hover:opacity-80"
                style={{ color: "var(--accent-terracotta)" }}
              >
                +91 90093 90054
              </a>
            </div>

            {/* WhatsApp Card */}
            <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-2 border border-gray-100">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaWhatsapp className="text-green-600 text-2xl" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">WhatsApp</h3>
              <p className="text-gray-600 text-sm mb-4">Quick enquiry via WhatsApp</p>
              <a
                href="https://wa.me/919009390054"
                target="_blank"
                rel="noopener noreferrer"
                className="text-green-600 font-semibold hover:text-green-700 transition-colors"
              >
                Chat Now
              </a>
            </div>

            {/* Email Card */}
            <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-2 border border-gray-100">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaEnvelope className="text-purple-600 text-2xl" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Email Us</h3>
              <p className="text-gray-600 text-sm mb-4">Send us a detailed message</p>
              <Link
                href="/contact"
                className="text-purple-600 font-semibold hover:text-purple-700 transition-colors"
              >
                Contact Form
              </Link>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/book"
              className="px-8 py-4 bg-gradient-to-r from-[var(--accent-terracotta)] to-[var(--accent-coral)] text-white font-semibold rounded-xl hover:opacity-90 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Book Appointment
            </Link>
            <Link
              href="/contact"
              className="px-8 py-4 bg-white border-2 font-semibold rounded-xl transition-all shadow-md hover:shadow-lg transform hover:scale-105 hover:bg-[color:var(--bg-cream)]"
              style={{ borderColor: "var(--accent-terracotta)", color: "var(--accent-terracotta)" }}
            >
              Get in Touch
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

