"use client";
import { FaAward, FaUsers, FaClock, FaShieldAlt, FaHeart, FaStar } from "react-icons/fa";

export default function WhyChooseUs() {
  const features = [
    {
      icon: FaAward,
      title: "Award Winning",
      description: "Recognized for excellence in beauty and dental care services",
      color: "#f59e0b",
    },
    {
      icon: FaUsers,
      title: "Expert Team",
      description: "Certified professionals with years of experience",
      color: "#AD6E5E",
    },
    {
      icon: FaClock,
      title: "Flexible Timing",
      description: "Open 7 days a week with convenient appointment slots",
      color: "#10b981",
    },
    {
      icon: FaShieldAlt,
      title: "Safe & Hygienic",
      description: "Strict hygiene protocols and sanitized equipment",
      color: "#ef4444",
    },
    {
      icon: FaHeart,
      title: "Customer Care",
      description: "Dedicated to your satisfaction and comfort",
      color: "#ec4899",
    },
    {
      icon: FaStar,
      title: "Premium Quality",
      description: "Using only the best products and latest techniques",
      color: "#fbbf24",
    },
  ];

  return (
    <section
      className="py-8 md:py-10 px-4 md:px-6"
      style={{ background: "var(--bg-cream)" }}
    >
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-6 md:mb-8">
          <h2
            className="text-2xl md:text-3xl font-bold mb-2"
            style={{ color: "var(--text-dark)" }}
          >
            Why Choose Us
          </h2>
          <p
            className="text-sm md:text-base max-w-xl mx-auto"
            style={{ color: "var(--text-muted)" }}
          >
            Experience the difference with our commitment to excellence and
            customer satisfaction
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="group relative rounded-xl overflow-hidden transition-all duration-300 ease-out cursor-default
                  hover:-translate-y-1.5 hover:shadow-xl hover:shadow-black/8
                  hover:scale-[1.02] active:scale-[0.99]"
                style={{
                  background: "#FAF7F2",
                  boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
                }}
              >
                {/* Subtle border glow on hover */}
                <div
                  className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                  style={{
                    boxShadow: `inset 0 0 0 2px ${feature.color}40`,
                  }}
                />
                {/* Icon area */}
                <div
                  className="w-full py-4 flex items-center justify-center"
                  style={{
                    background: "#ffffff",
                    borderBottom: "1px solid var(--border-light)",
                  }}
                >
                  <div
                    className="w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center transition-all duration-300
                      group-hover:scale-110 group-hover:shadow-lg"
                    style={{
                      background: `${feature.color}20`,
                    }}
                  >
                    <Icon
                      className="text-xl md:text-2xl"
                      style={{ color: feature.color }}
                    />
                  </div>
                </div>
                {/* Content */}
                <div className="px-5 py-4 md:py-5 text-center">
                  <h3
                    className="text-base md:text-lg font-bold mb-1.5"
                    style={{ color: "var(--text-dark)" }}
                  >
                    {feature.title}
                  </h3>
                  <p
                    className="text-xs md:text-sm leading-relaxed"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {feature.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

