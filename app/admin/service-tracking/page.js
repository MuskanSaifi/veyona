"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FaArrowLeft, FaUserClock, FaStar } from "react-icons/fa";

const STATUS_STYLES = {
  pending: { bg: "bg-amber-100", text: "text-amber-800", label: "Pending OTP" },
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
  if (minutes == null) return "—";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h <= 0) return `${m} min`;
  return `${h}h ${m}m`;
}

export default function AdminServiceTrackingPage() {
  const router = useRouter();
  const [tab, setTab] = useState("services");
  const [services, setServices] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");

  const load = async () => {
    setLoading(true);
    try {
      const [sRes, fRes] = await Promise.all([
        fetch(`/api/admin/service-tracking/services`, { cache: "no-store" }),
        fetch(`/api/admin/service-tracking/feedbacks`, { cache: "no-store" }),
      ]);
      if (sRes.status === 401 || fRes.status === 401) {
        router.push("/admin/login");
        return;
      }
      const [s, f] = await Promise.all([sRes.json(), fRes.json()]);
      setServices(Array.isArray(s) ? s : []);
      setFeedbacks(Array.isArray(f) ? f : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filteredServices = useMemo(
    () =>
      statusFilter === "all"
        ? services
        : services.filter((s) => s.status === statusFilter),
    [services, statusFilter]
  );

  const stats = useMemo(() => {
    const total = services.length;
    const completed = services.filter((s) => s.status === "completed").length;
    const inProgress = services.filter((s) => s.status === "in_progress").length;
    const avgRating =
      feedbacks.length > 0
        ? (
            feedbacks.reduce((acc, f) => acc + (Number(f.rating) || 0), 0) /
            feedbacks.length
          ).toFixed(2)
        : "—";
    return { total, completed, inProgress, avgRating };
  }, [services, feedbacks]);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 py-6 sm:py-10">
        <Link
          href="/admin/dashboard"
          className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 mb-4"
        >
          <FaArrowLeft /> Admin dashboard
        </Link>

        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-1 flex items-center gap-3">
          <FaUserClock className="text-blue-600" /> Service tracking
        </h1>
        <p className="text-slate-500 mb-6">
          Monitor employee field visits and customer feedback.
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <StatCard label="Total visits" value={stats.total} />
          <StatCard label="In progress" value={stats.inProgress} accent="text-blue-600" />
          <StatCard label="Completed" value={stats.completed} accent="text-emerald-600" />
          <StatCard label="Avg rating" value={stats.avgRating} accent="text-amber-500" />
        </div>

        <div className="flex items-center gap-2 mb-4">
          <TabBtn active={tab === "services"} onClick={() => setTab("services")}>
            Services
          </TabBtn>
          <TabBtn active={tab === "feedbacks"} onClick={() => setTab("feedbacks")}>
            Feedbacks
          </TabBtn>
        </div>

        {tab === "services" ? (
          <ServicesTable
            services={filteredServices}
            loading={loading}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
          />
        ) : (
          <FeedbacksTable feedbacks={feedbacks} loading={loading} />
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, accent = "text-slate-900" }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4">
      <div className="text-xs uppercase tracking-wider text-slate-500">{label}</div>
      <div className={`text-2xl font-bold mt-1 ${accent}`}>{value}</div>
    </div>
  );
}

function TabBtn({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
        active
          ? "bg-blue-600 text-white"
          : "bg-white text-slate-700 border border-slate-200 hover:border-blue-300"
      }`}
    >
      {children}
    </button>
  );
}

function ServicesTable({ services, loading, statusFilter, setStatusFilter }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-slate-100">
        <div className="text-sm font-semibold text-slate-700">
          All service visits ({services.length})
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white"
        >
          <option value="all">All</option>
          <option value="pending">Pending</option>
          <option value="in_progress">In progress</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {loading ? (
        <div className="p-10 text-center text-slate-400">Loading…</div>
      ) : services.length === 0 ? (
        <div className="p-10 text-center text-slate-400">No services found.</div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <Th>Employee</Th>
                  <Th>Customer</Th>
                  <Th>Service</Th>
                  <Th>Start</Th>
                  <Th>End</Th>
                  <Th>Duration</Th>
                  <Th>Status</Th>
                </tr>
              </thead>
              <tbody>
                {services.map((v) => {
                  const style = STATUS_STYLES[v.status] || STATUS_STYLES.pending;
                  return (
                    <tr key={v._id} className="border-t border-slate-100 hover:bg-slate-50">
                      <Td>
                        <div className="font-medium text-slate-900">
                          {v.employee?.name || "—"}
                        </div>
                        <div className="text-xs text-slate-500">{v.employee?.phone || ""}</div>
                      </Td>
                      <Td>
                        <div className="font-medium text-slate-900">
                          {v.customer?.name || "—"}
                        </div>
                        <div className="text-xs text-slate-500">{v.customer?.phone || ""}</div>
                      </Td>
                      <Td>{v.serviceLabel || "—"}</Td>
                      <Td>{formatDate(v.startTime)}</Td>
                      <Td>{formatDate(v.endTime)}</Td>
                      <Td className="font-semibold">{formatDuration(v.durationMinutes)}</Td>
                      <Td>
                        <span
                          className={`text-xs font-semibold px-2.5 py-1 rounded-full ${style.bg} ${style.text}`}
                        >
                          {style.label}
                        </span>
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden divide-y divide-slate-100">
            {services.map((v) => {
              const style = STATUS_STYLES[v.status] || STATUS_STYLES.pending;
              return (
                <div key={v._id} className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-900 truncate">
                        {v.customer?.name || "—"}
                      </div>
                      <div className="text-xs text-slate-500 truncate">
                        by {v.employee?.name || "—"}
                      </div>
                    </div>
                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${style.bg} ${style.text}`}
                    >
                      {style.label}
                    </span>
                  </div>
                  {v.serviceLabel ? (
                    <div className="text-xs text-slate-600 mt-1">{v.serviceLabel}</div>
                  ) : null}
                  <div className="text-xs text-slate-500 mt-2 grid grid-cols-2 gap-1">
                    <div>Start: {formatDate(v.startTime)}</div>
                    <div>End: {formatDate(v.endTime)}</div>
                    <div className="col-span-2 font-medium text-slate-700">
                      Duration: {formatDuration(v.durationMinutes)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function FeedbacksTable({ feedbacks, loading }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100 text-sm font-semibold text-slate-700">
        All feedbacks ({feedbacks.length})
      </div>

      {loading ? (
        <div className="p-10 text-center text-slate-400">Loading…</div>
      ) : feedbacks.length === 0 ? (
        <div className="p-10 text-center text-slate-400">No feedbacks yet.</div>
      ) : (
        <>
          {/* Desktop */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <Th>Rating</Th>
                  <Th>Customer</Th>
                  <Th>Employee</Th>
                  <Th>Service</Th>
                  <Th>Duration</Th>
                  <Th>Comment</Th>
                  <Th>Submitted</Th>
                </tr>
              </thead>
              <tbody>
                {feedbacks.map((f) => (
                  <tr key={f._id} className="border-t border-slate-100 hover:bg-slate-50">
                    <Td>
                      <RatingStars rating={f.rating} />
                    </Td>
                    <Td>{f.serviceVisit?.customer?.name || "—"}</Td>
                    <Td>{f.serviceVisit?.employee?.name || "—"}</Td>
                    <Td>{f.serviceVisit?.serviceLabel || "—"}</Td>
                    <Td>{formatDuration(f.serviceVisit?.durationMinutes)}</Td>
                    <Td className="max-w-xs">
                      <div className="text-slate-700 line-clamp-3">{f.comment || "—"}</div>
                    </Td>
                    <Td>{formatDate(f.createdAt)}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile */}
          <div className="md:hidden divide-y divide-slate-100">
            {feedbacks.map((f) => (
              <div key={f._id} className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <RatingStars rating={f.rating} />
                  <div className="text-xs text-slate-500 shrink-0">
                    {formatDate(f.createdAt)}
                  </div>
                </div>
                <div className="text-sm">
                  <div className="font-semibold text-slate-900">
                    {f.serviceVisit?.customer?.name || "—"}
                  </div>
                  <div className="text-xs text-slate-500">
                    by {f.serviceVisit?.employee?.name || "—"}
                    {f.serviceVisit?.serviceLabel ? ` • ${f.serviceVisit.serviceLabel}` : ""}
                  </div>
                </div>
                {f.comment ? (
                  <div className="text-sm text-slate-700 italic mt-2">“{f.comment}”</div>
                ) : null}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function RatingStars({ rating }) {
  const r = Number(rating) || 0;
  return (
    <div className="inline-flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <FaStar
          key={n}
          className={n <= r ? "text-amber-400" : "text-slate-200"}
        />
      ))}
      <span className="text-xs text-slate-500 ml-1">{r}/5</span>
    </div>
  );
}

function Th({ children }) {
  return (
    <th className="text-left text-xs uppercase tracking-wider font-semibold px-4 py-3 whitespace-nowrap">
      {children}
    </th>
  );
}

function Td({ children, className = "" }) {
  return <td className={`px-4 py-3 align-top text-slate-700 ${className}`}>{children}</td>;
}
