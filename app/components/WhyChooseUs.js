"use client";
import Image from "next/image";
import {
  FaAward,
  FaUsers,
  FaClock,
  FaShieldAlt,
  FaHeart,
  FaStar,
  FaCheckCircle,
} from "react-icons/fa";

export default function WhyChooseUs() {
  const features = [
    {
      icon: FaAward,
      title: "Award Winning",
      description: "Recognized for excellence in beauty and clinical care services.",
      color: "#fbbf24",
      img: "/images/award.jpg",
    },
    {
      icon: FaUsers,
      title: "Expert Team",
      description: "Certified professionals with years of experience and continuous training.",
      color: "#2563eb",
      img: "/images/team-photo.jpg",
    },
    {
      icon: FaClock,
      title: "Flexible Timing",
      description: "Open 7 days a week with convenient appointment slots.",
      color: "#14b8a6",
      img: "/images/flexible-timing.jpg",
    },
    {
      icon: FaShieldAlt,
      title: "Safe & Hygienic",
      description: "We follow strict protocols and maintain a completely clean environment.",
      color: "#ef4444",
      img: "/images/safe-hygineic.jpg",
    },
    {
      icon: FaHeart,
      title: "Customer Care",
      description: "Dedicated support and personal attention at every step.",
      color: "#ec4899",
      img: "/images/customer-care.jpg",
    },
    {
      icon: FaStar,
      title: "Premium Quality",
      description: "We use high-quality tools and luxury products for best results.",
      color: "#f97316",
      img: "/images/premium-quality.jpg",
    },
  ];

  const highlights = [
    { icon: FaCheckCircle, title: "Trusted by Thousands", subtitle: "Happy customers across the city" },
    { icon: FaCheckCircle, title: "Certified & Approved", subtitle: "Clinically tested & safe" },
    { icon: FaCheckCircle, title: "Easy Booking", subtitle: "Book appointments in minutes" },
    { icon: FaCheckCircle, title: "100% Satisfaction", subtitle: "Your satisfaction is our priority" },
  ];

  return (
    <section className="py-10 md:py-16 px-4 md:px-6 bg-[var(--bg-cream)]">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-xs md:text-sm uppercase tracking-[0.35em] text-[#c47f00] font-semibold mb-4">
            WHY CHOOSE US
          </p>
          <h2 className="text-3xl md:text-5xl font-semibold text-[#0f172a] mb-4">
            Why Choose Us
          </h2>
          <p className="mx-auto max-w-2xl text-sm md:text-base text-[#475569] leading-8">
            Experience the difference with our commitment to excellence and customer satisfaction.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="flex flex-col sm:flex-row items-center gap-4 rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className="w-12 h-12 rounded-3xl flex items-center justify-center"
                      style={{ background: `${feature.color}15` }}
                    >
                      <Icon className="text-xl" style={{ color: feature.color }} />
                    </div>
                    <h3 className="text-lg font-bold text-[#0f172a]">{feature.title}</h3>
                  </div>
                  <p className="text-sm leading-7 text-[#475569]">{feature.description}</p>
                </div>
                <div className="w-full sm:w-44 h-40 overflow-hidden rounded-3xl border border-slate-200 bg-slate-100">
                  <Image src={feature.img} alt={feature.title} width={320} height={320} className="h-full w-full object-cover" />
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {highlights.map((item, index) => {
            const Icon = item.icon;
            return (
              <div key={index} className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm flex items-start gap-4">
                <div className="w-12 h-12 rounded-[18px] bg-[#eef2ff] text-[#4338ca] flex items-center justify-center">
                  <Icon className="text-lg" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-[#0f172a]">{item.title}</h4>
                  <p className="text-sm text-[#64748b] mt-1">{item.subtitle}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

