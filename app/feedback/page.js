"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { FaPhoneAlt, FaSearch, FaRegSmile, FaCheckCircle } from "react-icons/fa";

/**
 * Public feedback landing page.
 *
 * Reached when the WhatsApp feedback template uses a STATIC button URL
 * (https://<domain>/feedback). The customer enters their phone number; we
 * look up their most recent completed visit pending feedback and forward
 * them to /feedback/<visitId> where they can rate it.
 */
export default function FeedbackLandingPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null); // "none" | "all_done" | { visits: [...] }

  const onPhoneChange = (e) => {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
    setPhone(digits);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (phone.length !== 10) {
      toast.error("Please enter a valid 10-digit number");
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch(`/api/service-tracking/public/find-by-phone`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.message || "Could not look up your service");
        return;
      }

      if (data.match === "single") {
        router.push(`/feedback/${data.visit.id}`);
        return;
      }
      setResult(data);
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Shell>
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-blue-100 text-blue-600 mb-3">
          <FaRegSmile className="text-2xl" />
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
          Share your feedback
        </h1>
        <p className="text-slate-500 mt-1">
          Enter the phone number you booked the service with to leave a rating.
        </p>
      </div>

      {!result && (
        <form onSubmit={submit} className="space-y-4">
          <label className="block">
            <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
              Mobile number
            </span>
            <div className="mt-1 flex items-stretch border border-slate-300 rounded-lg focus-within:ring-2 focus-within:ring-blue-500 overflow-hidden">
              <span className="inline-flex items-center gap-2 px-3 bg-slate-50 text-slate-500 text-sm border-r border-slate-200">
                <FaPhoneAlt className="text-xs" />
                +91
              </span>
              <input
                type="tel"
                inputMode="numeric"
                autoComplete="tel"
                value={phone}
                onChange={onPhoneChange}
                placeholder="10-digit mobile number"
                className="flex-1 px-3 py-2 focus:outline-none"
                maxLength={10}
                required
              />
            </div>
          </label>

          <button
            type="submit"
            disabled={loading || phone.length !== 10}
            className="w-full inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold px-5 py-3 rounded-lg transition"
          >
            <FaSearch />
            {loading ? "Looking up…" : "Find my service"}
          </button>
        </form>
      )}

      {result?.match === "none" && (
        <div className="text-center py-4">
          <p className="text-slate-700 font-semibold mb-1">
            No recent service found
          </p>
          <p className="text-sm text-slate-500 mb-4">
            We couldn&apos;t find a completed service for{" "}
            <span className="font-medium">+91 {phone}</span> in the last 60 days.
            Please double-check the number you booked with.
          </p>
          <button
            onClick={() => setResult(null)}
            className="text-blue-600 font-medium hover:underline"
          >
            Try a different number
          </button>
        </div>
      )}

      {result?.match === "all_done" && (
        <div className="text-center py-4">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 mb-3">
            <FaCheckCircle className="text-2xl" />
          </div>
          <p className="text-slate-800 font-semibold mb-1">
            All caught up!
          </p>
          <p className="text-sm text-slate-500">
            You&apos;ve already submitted feedback for all your recent services.
            Thank you!
          </p>
        </div>
      )}

      {result?.match === "multiple" && (
        <div>
          <p className="text-sm text-slate-600 mb-3">
            We found more than one service pending feedback. Please pick the one
            you&apos;d like to rate:
          </p>
          <ul className="space-y-2">
            {result.visits.map((v) => (
              <li key={v.id}>
                <button
                  onClick={() => router.push(`/feedback/${v.id}`)}
                  className="w-full text-left border border-slate-200 hover:border-blue-400 hover:bg-blue-50 rounded-lg px-4 py-3 transition"
                >
                  <div className="font-semibold text-slate-900">
                    {v.serviceLabel || "Service"}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {v.employeeName && <>By {v.employeeName} · </>}
                    {formatDate(v.completedAt)}
                  </div>
                </button>
              </li>
            ))}
          </ul>
          <button
            onClick={() => setResult(null)}
            className="mt-4 text-blue-600 text-sm font-medium hover:underline"
          >
            ← Use a different number
          </button>
        </div>
      )}
    </Shell>
  );
}

function formatDate(iso) {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    return d.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

function Shell({ children }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-slate-50 flex items-start justify-center px-4 py-10">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
        {children}
      </div>
    </div>
  );
}
