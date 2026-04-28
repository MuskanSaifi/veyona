"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Link from "next/link";
import styles from "./register.module.css";

export default function UserRegister() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
  });
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState("register"); // "register" or "otp"
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.name.trim()) {
      toast.error("Please enter your name");
      return;
    }

    if (!formData.phone || formData.phone.length !== 10) {
      toast.error("Please enter a valid 10-digit phone number");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/user/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || "Error registering");
        return;
      }

      toast.success("Registration successful! OTP sent to your phone.");
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
        body: JSON.stringify({ phone: formData.phone, otp }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || "Invalid OTP");
        return;
      }

      toast.success("Registration and login successful 🎉");
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
        <h2 className={styles.heading}>User Registration</h2>
        <p className={styles.subtitle}>Create your account to book appointments</p>

        {step === "register" ? (
          <form onSubmit={handleRegister} className={styles.form}>
            <div>
              <label className={styles.label}>Full Name *</label>
              <input
                type="text"
                placeholder="Enter your full name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={styles.input}
                required
              />
            </div>

            <div>
              <label className={styles.label}>Mobile Number *</label>
              <input
                type="tel"
                placeholder="Enter 10-digit mobile number"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, "").slice(0, 10) })}
                className={styles.input}
                required
                maxLength={10}
              />
            </div>

            <div>
              <label className={styles.label}>Email (Optional)</label>
              <input
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={styles.input}
              />
            </div>

            <button className={styles.button} disabled={loading || !formData.name || formData.phone.length !== 10}>
              {loading ? "Registering..." : "Register & Send OTP"}
            </button>

            <p className={styles.loginLink}>
              Already have an account?{" "}
              <Link href="/user/login" className={styles.link}>
                Login here
              </Link>
            </p>
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
              <p className={styles.phoneInfo}>OTP sent to: {formData.phone}</p>
            </div>

            <button className={styles.button} disabled={loading || otp.length !== 4}>
              {loading ? "Verifying..." : "Verify OTP & Login"}
            </button>

            <button
              type="button"
              onClick={() => {
                setStep("register");
                setOtp("");
              }}
              className={styles.linkButton}
            >
              Back to Registration
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

