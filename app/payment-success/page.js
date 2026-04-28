"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import styles from "./payment-success.module.css";

function PaymentSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const amount = searchParams.get("amount");
  const safeAmount = Number.isFinite(Number(amount)) ? Number(amount) : null;
  const mode = (searchParams.get("mode") || "").toLowerCase();
  const isBookNowPayLater = mode === "book_now_pay_later";

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <div className={styles.check}>✓</div>
        <h1>{isBookNowPayLater ? "Booking Confirmed" : "Payment Successful"}</h1>
        {!isBookNowPayLater && safeAmount != null && <p className={styles.amount}>Rs {safeAmount.toFixed(2)}</p>}
        <p className={styles.text}>
          {isBookNowPayLater
            ? "Thank you for booking with us. Please pay during your appointment."
            : "Thank you for booking with us. Your payment is confirmed."}
        </p>

        <button
          type="button"
          className={styles.primaryBtn}
          onClick={() => router.push("/user/dashboard")}
        >
          View Booking Details
        </button>

        <button
          type="button"
          className={styles.secondaryBtn}
          onClick={() => router.push("/")}
        >
          Continue Browsing
        </button>
      </section>
    </main>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<main className={styles.page}><section className={styles.card}>Loading...</section></main>}>
      <PaymentSuccessContent />
    </Suspense>
  );
}
