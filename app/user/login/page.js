"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import styles from "./login.module.css";

export default function UserLogin() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState("phone"); // "phone" or "otp"
  const [loading, setLoading] = useState(false);

  const handleSendOTP = async (e) => {
    e.preventDefault();
    
    if (!phone || phone.length !== 10) {
      toast.error("Please enter a valid 10-digit phone number");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/user/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || "Error sending OTP");
        return;
      }

      toast.success("OTP sent successfully!");
      setStep("otp");
    } catch (err) {
      toast.error("Something went wrong!");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    
    if (!otp || otp.length !== 4) {
      toast.error("Please enter a valid 4-digit OTP");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/user/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, otp }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || "Invalid OTP");
        return;
      }

      toast.success("Login successful 🎉");
      router.push("/user/dashboard");
    } catch (err) {
      toast.error("Something went wrong!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h2 className={styles.heading}>User Login</h2>
        <p className={styles.subtitle}>Login with your mobile number</p>
        
        <p className={styles.registerLink}>
          Don't have an account?{" "}
          <Link href="/user/register" className={styles.link}>
            Register here
          </Link>
        </p>

        {step === "phone" ? (
          <form onSubmit={handleSendOTP} className={styles.form}>
            <div>
              <label className={styles.label}>Mobile Number</label>
              <input
                type="tel"
                placeholder="Enter 10-digit mobile number"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                className={styles.input}
                required
                maxLength={10}
              />
            </div>

            <button className={styles.button} disabled={loading || phone.length !== 10}>
              {loading ? "Sending OTP..." : "Send OTP"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOTP} className={styles.form}>
            <div>
              <label className={styles.label}>Enter OTP</label>
              <input
                type="text"
                placeholder="Enter 4-digit OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 4))}
                className={styles.input}
                required
                maxLength={4}
                autoFocus
              />
              <p className={styles.hint}>Enter the 4-digit OTP sent to your phone</p>
            </div>

            <button className={styles.button} disabled={loading || otp.length !== 4}>
              {loading ? "Verifying..." : "Verify OTP"}
            </button>

            <button
              type="button"
              onClick={() => {
                setStep("phone");
                setOtp("");
              }}
              className={styles.linkButton}
            >
              Change Phone Number
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

