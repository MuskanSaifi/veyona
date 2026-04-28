"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import styles from "./trustSignals.module.css";

const defaultTrustPoints = [
  { title: "Background-Verified Professionals", text: "Every expert is identity and skill verified before onboarding." },
  { title: "Hygiene & Safety First", text: "Sanitized tools, gloves, and strict hygiene SOPs on every visit." },
  { title: "Trusted by Thousands", text: "Growing customer base with repeat bookings and high satisfaction." },
];

const defaultQuickReviews = [
  { name: "Riya S.", city: "South Delhi", review: "Beautician was on time and very professional. Clean setup and great service." },
  { name: "Karan M.", city: "Noida", review: "Booking process was smooth and team confirmed everything quickly." },
  { name: "Neha A.", city: "Gurugram", review: "Loved the experience at home. Hygiene standards were clearly maintained." },
];

export default function TrustSignals() {
  const [data, setData] = useState(null);

  useEffect(() => {
    let ignore = false;
    const load = async () => {
      try {
        const res = await fetch("/api/trust-signals");
        if (!res.ok) return;
        const payload = await res.json();
        if (!ignore) setData(payload);
      } catch {
        // Keep fallback content if API is unavailable
      }
    };
    load();
    return () => {
      ignore = true;
    };
  }, []);

  const trustPoints = useMemo(
    () => (Array.isArray(data?.trustPoints) && data.trustPoints.length > 0 ? data.trustPoints : defaultTrustPoints),
    [data]
  );
  const quickReviews = useMemo(
    () => (Array.isArray(data?.quickReviews) && data.quickReviews.length > 0 ? data.quickReviews : defaultQuickReviews),
    [data]
  );
  const beforeAfterItems = useMemo(
    () => (Array.isArray(data?.beforeAfterItems) && data.beforeAfterItems.length > 0 ? data.beforeAfterItems : []),
    [data]
  );

  const kicker = data?.kicker || "Trust & Safety";
  const title = data?.title || "Why Customers Trust Veyona for Home Services";
  const description =
    data?.description ||
    "Real professionals, transparent process, and consistent quality so users feel confident before booking.";

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <div className={styles.header}>
          <p className={styles.kicker}>{kicker}</p>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>  

        <div className={styles.pointsGrid}>
          {trustPoints.map((point) => (
            <article key={point.title} className={styles.pointCard}>
              <h3>{point.title}</h3>
              <p>{point.text}</p>
            </article>
          ))}
        </div>

        <div className={styles.galleryWrap}>
          <div className={styles.galleryTitle}>Before / After Results</div>
          <div className={styles.galleryGrid}>
            {beforeAfterItems.length > 0 ? (
              beforeAfterItems.map((item, idx) => (
                <div key={`${item.beforeImage || "ba"}-${idx}`} className={styles.beforeAfterPair}>
                  <div className={styles.galleryCard}>
                    {item.beforeImage ? <img src={item.beforeImage} alt={item.beforeLabel || "Before"} className={styles.galleryImage} /> : <span>{item.beforeLabel || "Before"}</span>}
                    <span className={styles.galleryTag}>{item.beforeLabel || "Before"}</span>
                  </div>
                  <div className={`${styles.galleryCard} ${styles.after}`}>
                    {item.afterImage ? <img src={item.afterImage} alt={item.afterLabel || "After"} className={styles.galleryImage} /> : <span>{item.afterLabel || "After"}</span>}
                    <span className={styles.galleryTag}>{item.afterLabel || "After"}</span>
                  </div>
                </div>
              ))
            ) : (
              <>
                <div className={styles.galleryCard}>
                  <span>Before</span>
                </div>
                <div className={`${styles.galleryCard} ${styles.after}`}>
                  <span>After</span>
                </div>
                <div className={styles.galleryCard}>
                  <span>Before</span>
                </div>
                <div className={`${styles.galleryCard} ${styles.after}`}>
                  <span>After</span>
                </div>
              </>
            )}
          </div>
        </div>

        <div className={styles.reviewsWrap}>
          {quickReviews.map((item) => (
            <article key={item.name} className={styles.reviewCard}>
              <p className={styles.reviewText}>"{item.review}"</p>
              <p className={styles.reviewer}>{item.name} · {item.city}</p>
            </article>
          ))}
        </div>

        <div className={styles.ctaRow}> 
          {/* <Link href="/services" className={styles.primaryCta}>
            Explore All Services
          </Link> */}
          <Link href="/services" className={styles.secondaryCta}>
            Book Trusted Professional
          </Link>
        </div>
      </div>
    </section>
  );
}
