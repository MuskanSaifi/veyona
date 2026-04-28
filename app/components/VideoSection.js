"use client";
import { useRef, useEffect } from "react";

export default function VideoSection({ videoSrc, posterImage, title, description }) {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch((error) => {
        console.log("Autoplay prevented:", error);
      });
    }
  }, []);

  return (
    <section
      style={{
        position: "relative",
        width: "100%",
        marginBottom: "clamp(40px, 6vw, 60px)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "clamp(400px, 50vh, 600px)",
          background: "#000",
        }}
      >
        <video
          ref={videoRef}
          autoPlay
          loop
          muted
          playsInline
          poster={posterImage}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        >
          <source src={videoSrc} type="video/mp4" />
          Your browser does not support the video tag.
        </video>

        {/* Optional Overlay with Text */}
        {(title || description) && (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.5) 100%)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              padding: "clamp(20px, 4vw, 40px)",
              textAlign: "center",
              color: "white",
            }}
          >
            {title && (
              <h2
                style={{
                  fontSize: "clamp(28px, 5vw, 48px)",
                  fontWeight: "bold",
                  marginBottom: "clamp(12px, 2vw, 20px)",
                  textShadow: "2px 2px 8px rgba(0,0,0,0.5)",
                }}
              >
                {title}
              </h2>
            )}
            {description && (
              <p
                style={{
                  fontSize: "clamp(16px, 2.5vw, 20px)",
                  maxWidth: "800px",
                  textShadow: "1px 1px 4px rgba(0,0,0,0.5)",
                  lineHeight: 1.6,
                }}
              >
                {description}
              </p>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

