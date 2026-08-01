"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  FaArrowLeft,
  FaUser,
  FaPhone,
  FaPlay,
  FaStop,
  FaRedo,
  FaShareAlt,
  FaCheckCircle,
} from "react-icons/fa";

function formatDate(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return "—";
  }
}

function formatDuration(minutes) {
  if (minutes == null) return "—";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h <= 0) return `${m} min`;
  return `${h}h ${m}m`;
}

function diffMinutes(fromIso) {
  if (!fromIso) return 0;
  return Math.max(0, Math.floor((Date.now() - new Date(fromIso).getTime()) / 60000));
}

export default function ServiceVisitDetailPage() {
  const params = useParams();
  const router = useRouter();
  const visitId = params?.id;

  const [visit, setVisit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [otpDigits, setOtpDigits] = useState(["", "", "", ""]);
  const [otpExpiresAt, setOtpExpiresAt] = useState(null);
  const [now, setNow] = useState(Date.now());

  const inputsRef = useRef([]);

  const fetchVisit = useCallback(async () => {
    try {
      const res = await fetch(`/api/service-tracking/visit/${visitId}`, {
        cache: "no-store",
      });
      if (res.status === 401) {
        router.push("/employee/login");
        return;
      }
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || "Could not load visit");
        return;
      }
      setVisit(data);
      setOtpExpiresAt(data.otpExpiresAt || null);
    } catch {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  }, [visitId, router]);

  useEffect(() => {
    if (!visitId) return;
    fetchVisit();
  }, [visitId, fetchVisit]);

  // ticker for the OTP countdown + service running clock
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const otpSecondsLeft = useMemo(() => {
    if (!otpExpiresAt) return 0;
    return Math.max(0, Math.floor((new Date(otpExpiresAt).getTime() - now) / 1000));
  }, [otpExpiresAt, now]);

  const runningMinutes = useMemo(() => {
    if (!visit?.startTime || visit.status !== "in_progress") return 0;
    return diffMinutes(visit.startTime);
  }, [visit, now]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleOtpChange = (index, value) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...otpDigits];
    next[index] = digit;
    setOtpDigits(next);
    if (digit && index < 3) inputsRef.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const verifyOtp = async () => {
    const code = otpDigits.join("");
    if (code.length !== 4) {
      toast.error("Enter the 4-digit OTP");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/service-tracking/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serviceId: visitId, code }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.message || "Invalid OTP");
        return;
      }
      toast.success("OTP verified — service started");
      setOtpDigits(["", "", "", ""]);
      await fetchVisit();
    } catch {
      toast.error("Network error");
    } finally {
      setBusy(false);
    }
  };

  const resendOtp = async () => {
    setBusy(true);
    try {
      const res = await fetch(`/api/service-tracking/generate-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serviceId: visitId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.message || "Could not resend OTP");
        return;
      }
      toast.success("New OTP sent on SMS");
      setOtpDigits(["", "", "", ""]);
      setOtpExpiresAt(data.otpExpiresAt);
    } catch {
      toast.error("Network error");
    } finally {
      setBusy(false);
    }
  };

  const endService = async () => {
    if (!confirm("End this service now? The customer will receive a feedback link on WhatsApp.")) {
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/service-tracking/end-service`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serviceId: visitId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.message || "Could not end service");
        return;
      }
      toast.success("Service ended — feedback link sent");
      await fetchVisit();
    } catch {
      toast.error("Network error");
    } finally {
      setBusy(false);
    }
  };

  const copyFeedbackLink = async () => {
    const base = typeof window !== "undefined" ? window.location.origin : "";
    const url = `${base}/feedback/${visitId}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Feedback link copied");
    } catch {
      toast.error("Could not copy link");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500">
        Loading…
      </div>
    );
  }

  if (!visit) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500">
        Visit not found.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-2xl mx-auto px-4 py-6 sm:py-10">
        <Link
          href="/employee/service-tracking"
          className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 mb-6"
        >
          <FaArrowLeft /> Back
        </Link>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6 mb-5">
          <div className="text-xs uppercase tracking-wider text-slate-500 mb-1">Customer</div>
          <div className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <FaUser className="text-blue-600" /> {visit.customer?.name}
          </div>
          <div className="text-sm text-slate-600 mt-1 flex items-center gap-2">
            <FaPhone /> {visit.customer?.phone}
          </div>
          {visit.serviceLabel ? (
            <div className="text-sm text-slate-600 mt-1">Service: {visit.serviceLabel}</div>
          ) : null}
          <div className="text-xs text-slate-400 mt-2">Created {formatDate(visit.createdAt)}</div>
        </div>

        {visit.status === "pending" && (
          <PendingOtpPanel
            otpDigits={otpDigits}
            inputsRef={inputsRef}
            handleOtpChange={handleOtpChange}
            handleOtpKeyDown={handleOtpKeyDown}
            otpSecondsLeft={otpSecondsLeft}
            verifyOtp={verifyOtp}
            resendOtp={resendOtp}
            busy={busy}
          />
        )}

        {visit.status === "in_progress" && (
          <InProgressPanel
            startTime={visit.startTime}
            runningMinutes={runningMinutes}
            endService={endService}
            busy={busy}
          />
        )}

        {visit.status === "completed" && (
          <CompletedPanel visit={visit} copyFeedbackLink={copyFeedbackLink} />
        )}
      </div>
    </div>
  );
}

function PendingOtpPanel({
  otpDigits,
  inputsRef,
  handleOtpChange,
  handleOtpKeyDown,
  otpSecondsLeft,
  verifyOtp,
  resendOtp,
  busy,
}) {
  const expired = otpSecondsLeft <= 0;
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6">
      <h2 className="text-lg font-semibold text-slate-800 mb-1">Verify OTP</h2>
      <p className="text-sm text-slate-500 mb-4">
        Ask the customer for the 4-digit OTP they received on SMS.
      </p>

      <div className="flex items-center justify-center gap-3 mb-4">
        {[0, 1, 2, 3].map((i) => (
          <input
            key={i}
            ref={(el) => (inputsRef.current[i] = el)}
            inputMode="numeric"
            type="tel"
            value={otpDigits[i]}
            onChange={(e) => handleOtpChange(i, e.target.value)}
            onKeyDown={(e) => handleOtpKeyDown(i, e)}
            className="w-14 h-14 text-center text-2xl font-bold border-2 border-slate-300 rounded-xl focus:outline-none focus:border-blue-500"
            maxLength={1}
          />
        ))}
      </div>

      <div className="text-center text-xs text-slate-500 mb-4">
        {expired ? (
          <span className="text-rose-600 font-semibold">OTP expired — please resend</span>
        ) : (
          <>
            Expires in{" "}
            <span className="font-semibold text-slate-700">
              {Math.floor(otpSecondsLeft / 60)}:{String(otpSecondsLeft % 60).padStart(2, "0")}
            </span>
          </>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          type="button"
          onClick={verifyOtp}
          disabled={busy || expired || otpDigits.join("").length !== 4}
          className="flex-1 inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold px-5 py-3 rounded-lg"
        >
          <FaPlay /> Verify & start
        </button>
        <button
          type="button"
          onClick={resendOtp}
          disabled={busy}
          className="inline-flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold px-5 py-3 rounded-lg"
        >
          <FaRedo /> Resend OTP
        </button>
      </div>
    </div>
  );
}

function InProgressPanel({ startTime, runningMinutes, endService, busy }) {
  return (
    <div className="bg-white rounded-2xl border border-blue-200 shadow-sm p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">Service in progress</h2>
          <div className="text-xs text-slate-500 mt-1">Started {formatDate(startTime)}</div>
        </div>
        <span className="text-xs font-semibold px-3 py-1 rounded-full bg-blue-100 text-blue-800">
          Running
        </span>
      </div>

      <div className="bg-slate-50 rounded-xl p-5 text-center mb-5">
        <div className="text-xs uppercase tracking-wider text-slate-500 mb-1">
          Running for
        </div>
        <div className="text-4xl font-bold text-slate-900">
          {formatDuration(runningMinutes)}
        </div>
      </div>

      <button
        type="button"
        onClick={endService}
        disabled={busy}
        className="w-full inline-flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-60 text-white font-semibold px-5 py-3 rounded-lg"
      >
        <FaStop /> End service
      </button>
    </div>
  );
}

function CompletedPanel({ visit, copyFeedbackLink }) {
  const feedbackUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/feedback/${visit.id}`
      : `/feedback/${visit.id}`;

  return (
    <div className="bg-white rounded-2xl border border-emerald-200 shadow-sm p-5 sm:p-6">
      <div className="flex items-center gap-2 text-emerald-700 font-semibold mb-3">
        <FaCheckCircle /> Service completed
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <Stat label="Started" value={formatDate(visit.startTime)} />
        <Stat label="Ended" value={formatDate(visit.endTime)} />
        <Stat label="Duration" value={formatDuration(visit.durationMinutes)} />
        <Stat
          label="Feedback"
          value={visit.feedback ? `${visit.feedback.rating} / 5` : "Awaiting"}
        />
      </div>

      <div className="mt-5 border-t border-slate-100 pt-4">
        <div className="text-xs uppercase tracking-wider text-slate-500 mb-2">
          Feedback link
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <code className="text-xs bg-slate-100 px-3 py-2 rounded-lg break-all flex-1">
            {feedbackUrl}
          </code>
          <button
            onClick={copyFeedbackLink}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-3 py-2 rounded-lg"
          >
            <FaShareAlt /> Copy
          </button>
        </div>
        <p className="text-xs text-slate-500 mt-2">
          {visit.feedbackSentAt
            ? `Sent on WhatsApp at ${formatDate(visit.feedbackSentAt)}.`
            : "WhatsApp send was not confirmed — share the link manually if needed."}
        </p>
      </div>

      {visit.feedback ? (
        <div className="mt-5 bg-slate-50 rounded-xl p-4">
          <div className="text-xs uppercase tracking-wider text-slate-500 mb-1">
            Customer feedback
          </div>
          <div className="text-amber-500 font-bold text-lg">
            {"★".repeat(visit.feedback.rating)}
            <span className="text-slate-300">
              {"★".repeat(5 - visit.feedback.rating)}
            </span>
          </div>
          {visit.feedback.comment ? (
            <div className="text-sm text-slate-700 mt-2 italic">
              “{visit.feedback.comment}”
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="bg-slate-50 rounded-xl p-3">
      <div className="text-[10px] uppercase tracking-wider text-slate-500">{label}</div>
      <div className="text-sm font-semibold text-slate-900 mt-1">{value}</div>
    </div>
  );
}
