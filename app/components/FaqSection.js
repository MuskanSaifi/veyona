"use client";

import { useState, useEffect } from "react";

const DEFAULT_TITLE = "Frequently Asked Questions";
const DEFAULT_SUBTITLE = "Everything you need to know about Veyona Salon & Dental Clinic";

export default function FaqSection() {
  const [activeIndex, setActiveIndex] = useState(null);
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/faq")
      .then((res) => res.json())
      .then((data) => {
        setFaqs(Array.isArray(data) ? data : []);
      })
      .catch(() => setFaqs([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading || faqs.length === 0) {
    return null;
  }

  return (
    <section className="bg-[#f9fafb] py-20">
      <div className="max-w-4xl mx-auto px-4">

        {/* Heading */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
            {DEFAULT_TITLE}
          </h2>
          <p className="text-gray-600 mt-3">
            {DEFAULT_SUBTITLE}
          </p>
        </div>

        {/* FAQ */}
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={faq._id || index}
              className="bg-white rounded-xl border border-gray-100 shadow-sm"
            >
              <button
                onClick={() =>
                  setActiveIndex(activeIndex === index ? null : index)
                }
                className="w-full flex justify-between items-center p-5 text-left"
              >
                <span className="font-semibold text-gray-900">
                  {faq.question}
                </span>

                {/* Arrow */}
                <span
                  className={`text-xl transition-transform duration-300 ${
                    activeIndex === index ? "rotate-180" : ""
                  }`}
                  style={{ color: "var(--accent-terracotta)" }}
                >
                  ▼
                </span>
              </button>

              {activeIndex === index && (
                <div className="px-5 pb-5 text-gray-600">
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
