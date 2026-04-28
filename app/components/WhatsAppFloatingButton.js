"use client";

import { FaWhatsapp } from "react-icons/fa";

export default function WhatsAppFloatingButton() {
  const phone = "919009390054"; // +91 90093 90054
  const defaultMessage =
    "Hello Veyona, I would like to know more about your services and book an appointment.";

  const handleClick = () => {
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(defaultMessage)}`;
    if (typeof window !== "undefined") {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label="Open WhatsApp chat"
      style={{
        position: "fixed",
        left: 20,
        bottom: 84,
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: 0,
        width: 56,
        height: 56,
        borderRadius: 999,
        border: "none",
        backgroundColor: "#25D366",
        color: "white",
        boxShadow: "0 0 0 0 rgba(37, 211, 102, 0.55), 0 10px 24px rgba(0,0,0,0.18)",
        cursor: "pointer",
        animation: "whatsappGlow 1.8s ease-in-out infinite",
      }}
    >
      <FaWhatsapp size={26} style={{ margin: "0 auto" }} />
      <style>{`
        @keyframes whatsappGlow {
          0% {
            box-shadow: 0 0 0 0 rgba(37, 211, 102, 0.55), 0 10px 24px rgba(0,0,0,0.18);
            transform: translateY(0);
          }
          50% {
            box-shadow: 0 0 0 10px rgba(37, 211, 102, 0), 0 14px 30px rgba(0,0,0,0.20);
            transform: translateY(-1px);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(37, 211, 102, 0), 0 10px 24px rgba(0,0,0,0.18);
            transform: translateY(0);
          }
        }
      `}</style>
    </button>
  );
}

