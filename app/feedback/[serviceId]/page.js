"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import toast from "react-hot-toast";
import { FaStar, FaCheckCircle } from "react-icons/fa";

export default function FeedbackPage() {
  const params = useParams();
  const serviceId = params?.serviceId;

  const [visit, setVisit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!serviceId) return;
    (async () => {
      try {
        const res = await fetch(`/api/service-tracking/public/${serviceId}`, {
          cache: "no-store",
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(data.message || "Feedback link is invalid");
          return;
        }
        setVisit(data);
        if (data.feedbackSubmitted) setSubmitted(true);
      } catch {
        setError("Network error. Please try again.");
      } finally {
        setLoading(false);
      }
    })();
  }, [serviceId]);

  const submit = async (e) => {
    e.preventDefault();
    if (rating < 1 || rating > 5) {
      toast.error("Please select a rating");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/service-tracking/submit-feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId,
          rating,
          comment: comment.trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.message || "Could not submit feedback");
        return;
      }
      toast.success("Thanks for your feedback!");
      setSubmitted(true);
    } catch {
      toast.error("Network error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <FeedbackShell><p className="text-center text-slate-500">Loading…</p></FeedbackShell>;
  }

  if (error) {
    return (
      <FeedbackShell>
        <div className="text-center">
          <div className="text-rose-600 font-semibold mb-2">{error}</div>
          <p className="text-sm text-slate-500">
            If you believe this is a mistake, please contact the service provider.
          </p>
        </div>
      </FeedbackShell>
    );
  }

  if (submitted) {
    return (
      <FeedbackShell>
        <div className="text-center py-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mb-4">
            <FaCheckCircle className="text-3xl" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">Thank you!</h1>
          <p className="text-slate-600">
            Your feedback has been recorded. We appreciate you taking the time to share it.
          </p>
        </div>
      </FeedbackShell>
    );
  }

  return (
    <FeedbackShell>
      <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mb-1">
        How was your service?
      </h1>
      <p className="text-slate-500 mb-5">
        Hi {visit?.customerName || "there"} — please rate your experience
        {visit?.employeeName ? ` with ${visit.employeeName}` : ""}.
      </p>

      <form onSubmit={submit}>
        <div className="flex items-center justify-center gap-2 mb-6">
          {[1, 2, 3, 4, 5].map((n) => {
            const active = (hover || rating) >= n;
            return (
              <button
                key={n}
                type="button"
                onMouseEnter={() => setHover(n)}
                onMouseLeave={() => setHover(0)}
                onClick={() => setRating(n)}
                aria-label={`${n} star`}
                className="p-1 transition transform hover:scale-110"
              >
                <FaStar
                  className={`text-4xl sm:text-5xl ${
                    active ? "text-amber-400" : "text-slate-200"
                  }`}
                />
              </button>
            );
          })}
        </div>

        <label className="block mb-5">
          <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
            Comment (optional)
          </span>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
            maxLength={1000}
            placeholder="Tell us what we did well, or how we can improve…"
            className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </label>

        <button
          type="submit"
          disabled={submitting || rating < 1}
          className="w-full inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold px-5 py-3 rounded-lg transition"
        >
          {submitting ? "Submitting…" : "Submit feedback"}
        </button>
      </form>
    </FeedbackShell>
  );
}

function FeedbackShell({ children }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-slate-50 flex items-start justify-center px-4 py-10">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
        {children}
      </div>
    </div>
  );
}
