"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  FaPlay,
  FaStop,
  FaUserClock,
  FaPhone,
  FaUser,
  FaArrowLeft,
  FaCheckCircle,
} from "react-icons/fa";

const STATUS_STYLES = {
  pending: { bg: "bg-amber-100", text: "text-amber-800", label: "Awaiting OTP" },
  in_progress: { bg: "bg-blue-100", text: "text-blue-800", label: "In progress" },
  completed: { bg: "bg-emerald-100", text: "text-emerald-800", label: "Completed" },
  cancelled: { bg: "bg-rose-100", text: "text-rose-800", label: "Cancelled" },
};

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
  if (!minutes && minutes !== 0) return "—";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h <= 0) return `${m} min`;
  return `${h}h ${m}m`;
}

export default function EmployeeServiceTrackingPage() {
  const router = useRouter();

  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    serviceLabel: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchVisits = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/service-tracking/list`, { cache: "no-store" });
      if (res.status === 401) {
        router.push("/employee/login");
        return;
      }
      const data = await res.json();
      setVisits(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Failed to load visits");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVisits();
  }, []);

  const activeVisit = useMemo(
    () => visits.find((v) => v.status === "pending" || v.status === "in_progress"),
    [visits]
  );

  const filteredVisits = useMemo(() => {
    if (filter === "all") return visits;
    return visits.filter((v) => v.status === filter);
  }, [visits, filter]);

  const onSubmitNew = async (e) => {
    e.preventDefault();
    const name = form.name.trim();
    const phone = form.phone.replace(/\D/g, "").slice(-10);

    if (!name) return toast.error("Customer name is required");
    if (phone.length !== 10) return toast.error("Enter a valid 10-digit phone");

    setSubmitting(true);
    try {
      const res = await fetch(`/api/service-tracking/start-service`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: {
            name,
            phone,
            email: form.email.trim() || undefined,
          },
          serviceLabel: form.serviceLabel.trim() || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.message || "Could not start service");
        if (data.activeServiceId) {
          router.push(`/employee/service-tracking/${data.activeServiceId}`);
        }
        return;
      }
      toast.success("OTP sent to customer on SMS");
      router.push(`/employee/service-tracking/${data.serviceId}`);
    } catch {
      toast.error("Network error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto px-4 py-6 sm:py-10">
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/employee/dashboard"
            className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
          >
            <FaArrowLeft /> Back to dashboard
          </Link>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-1 flex items-center gap-3">
          <FaUserClock className="text-blue-600" /> Service time tracking
        </h1>
        <p className="text-slate-500 mb-8">
          Start a customer visit with SMS OTP verification and record service duration.
        </p>

        {activeVisit ? (
          <ActiveVisitCard visit={activeVisit} />
        ) : (
          <NewVisitForm
            form={form}
            setForm={setForm}
            onSubmit={onSubmitNew}
            submitting={submitting}
          />
        )}

        <div className="mt-10">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-slate-800">Recent visits</h2>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white"
            >
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {loading ? (
            <div className="bg-white rounded-2xl p-10 text-center text-slate-400 border border-slate-200">
              Loading…
            </div>
          ) : filteredVisits.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 text-center text-slate-400 border border-slate-200">
              No visits yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {filteredVisits.map((v) => (
                <VisitListItem key={v._id} visit={v} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function NewVisitForm({ form, setForm, onSubmit, submitting }) {
  return (
    <form
      onSubmit={onSubmit}
      className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6"
    >
      <h2 className="text-lg font-semibold text-slate-800 mb-4">Start a new visit</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Customer name *">
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="John Doe"
            className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </Field>

        <Field label="Customer phone *">
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="10-digit phone"
            maxLength={15}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </Field>

        <Field label="Customer email (optional)">
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="customer@example.com"
            className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </Field>

        <Field label="Service / job description (optional)">
          <input
            type="text"
            value={form.serviceLabel}
            onChange={(e) => setForm({ ...form, serviceLabel: e.target.value })}
            placeholder="e.g. AC service, Hair color + spa"
            className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </Field>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="mt-5 w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold px-5 py-2.5 rounded-lg transition"
      >
        <FaPlay /> {submitting ? "Sending OTP…" : "Start service & send OTP"}
      </button>
    </form>
  );
}

function ActiveVisitCard({ visit }) {
  const style = STATUS_STYLES[visit.status] || STATUS_STYLES.pending;
  return (
    <div className="bg-white rounded-2xl border border-blue-200 shadow-sm p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="text-xs uppercase tracking-wider text-slate-500 mb-1">
            Active visit
          </div>
          <div className="flex items-center gap-2 text-slate-900 font-semibold text-lg">
            <FaUser className="text-blue-600" /> {visit.customer?.name || "Customer"}
          </div>
          <div className="text-sm text-slate-600 flex items-center gap-2 mt-1">
            <FaPhone /> {visit.customer?.phone || "—"}
          </div>
          {visit.serviceLabel ? (
            <div className="text-sm text-slate-600 mt-1">{visit.serviceLabel}</div>
          ) : null}
        </div>
        <span
          className={`text-xs font-semibold px-3 py-1 rounded-full ${style.bg} ${style.text}`}
        >
          {style.label}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <Link
          href={`/employee/service-tracking/${visit._id}`}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-lg"
        >
          {visit.status === "pending" ? "Enter OTP" : "Manage visit"}
        </Link>
      </div>
    </div>
  );
}

function VisitListItem({ visit }) {
  const style = STATUS_STYLES[visit.status] || STATUS_STYLES.pending;
  return (
    <Link
      href={`/employee/service-tracking/${visit._id}`}
      className="bg-white rounded-xl border border-slate-200 p-4 hover:border-blue-300 transition flex items-start justify-between gap-3"
    >
      <div className="min-w-0">
        <div className="font-semibold text-slate-900 truncate flex items-center gap-2">
          {visit.status === "completed" && (
            <FaCheckCircle className="text-emerald-500 shrink-0" />
          )}
          {visit.customer?.name || "Customer"}
        </div>
        <div className="text-xs text-slate-500 mt-0.5">
          {visit.customer?.phone || "—"}
          {visit.serviceLabel ? ` • ${visit.serviceLabel}` : ""}
        </div>
        <div className="text-xs text-slate-500 mt-1">
          {visit.status === "completed"
            ? `${formatDate(visit.startTime)} → ${formatDate(visit.endTime)} (${formatDuration(
                visit.durationMinutes
              )})`
            : `Created ${formatDate(visit.createdAt)}`}
        </div>
      </div>
      <span
        className={`text-xs font-semibold px-3 py-1 rounded-full shrink-0 ${style.bg} ${style.text}`}
      >
        {style.label}
      </span>
    </Link>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
        {label}
      </span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
