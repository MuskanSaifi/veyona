"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import * as styles from "./styles";
import cardStyles from "./AppointmentTab.module.css";

const fetchOpts = { credentials: "include" };

function paymentPlanLabel(plan) {
  switch (plan) {
    case "full":
      return "Full payment";
    case "half":
      return "Half / advance";
    case "book_now_pay_later":
      return "Book now, pay later";
    case "pay_at_salon":
      return "Pay at salon";
    default:
      return "Half / advance";
  }
}

export default function AppointmentTab() {
  const PAGE_SIZE = 10;
  const router = useRouter();
  const [appointments, setAppointments] = useState([]);
  const [viewMoreApt, setViewMoreApt] = useState(null);
  const [filter, setFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  const [serviceTypeFilter, setServiceTypeFilter] = useState("all");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("all");
  const [paymentPlanFilter, setPaymentPlanFilter] = useState("all");
  const [refundFilter, setRefundFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  /** Pending → confirmed: admin must pick employee in modal before WhatsApp / final confirm. */
  const [confirmFlow, setConfirmFlow] = useState(null);
  const [confirmSearch, setConfirmSearch] = useState("");
  const [confirmEmployeeId, setConfirmEmployeeId] = useState("");
  const [confirmEmpList, setConfirmEmpList] = useState([]);
  const [confirmEmpLoading, setConfirmEmpLoading] = useState(false);

  const fetchAppointments = async () => {
    const res = await fetch("/api/appointment", fetchOpts);
    const data = await res.json();
    setAppointments(data);
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const updateStatus = async (id, status, employeeId) => {
    const body = { status };
    if (employeeId) body.employee = employeeId;
    const res = await fetch(`/api/appointment/${id}`, {
      ...fetchOpts,
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (res.status === 401) {
      toast.error("Session expired. Please log in again.");
      router.push("/admin/login");
      return;
    }
    if (res.ok) {
      toast.success("Status updated");
      setConfirmFlow(null);
      fetchAppointments();
    } else {
      toast.error(data.message || `Failed to update status (${res.status})`);
    }
  };

  const openConfirmEmployeeModal = (apt) => {
    setViewMoreApt(null);
    setConfirmFlow({ apt });
    setConfirmSearch("");
    const existing = apt.employee?._id?.toString?.() || apt.employee?.toString?.() || "";
    setConfirmEmployeeId(existing);
    setConfirmEmpList([]);
    setConfirmEmpLoading(true);
    const aptSalonId = apt.salon?._id?.toString?.() || apt.salon?.toString?.() || null;

    // Full org list so admin can assign the lead to anyone (not only this booking's salon).
    fetch(`/api/employee`, fetchOpts)
      .then((r) => r.json())
      .then((data) => {
        const raw = Array.isArray(data) ? data : [];
        const sameSalonRank = (em) => {
          if (!aptSalonId) return 0;
          const sid = em.salon?._id?.toString?.() || em.salon?.toString?.() || "";
          return sid === aptSalonId ? 1 : 0;
        };
        raw.sort((a, b) => {
          const s = sameSalonRank(b) - sameSalonRank(a);
          if (s !== 0) return s;
          const ac = a.active === b.active ? 0 : a.active ? -1 : 1;
          if (ac !== 0) return ac;
          return (a.name || "").localeCompare(b.name || "", undefined, { sensitivity: "base" });
        });
        setConfirmEmpList(raw);
      })
      .catch(() => toast.error("Could not load employees"))
      .finally(() => setConfirmEmpLoading(false));
  };

  const handleAppointmentStatusChange = (apt, newStatus) => {
    const prev = apt.status || "pending";
    if (newStatus === "confirmed" && prev !== "confirmed") {
      openConfirmEmployeeModal(apt);
      return;
    }
    updateStatus(apt._id, newStatus);
  };

  const employeeMatchesConfirmSearch = (em, rawQ) => {
    const q = rawQ.trim().toLowerCase();
    if (!q) return true;
    const name = (em.name || "").toLowerCase();
    const email = (em.email || "").toLowerCase();
    const phoneRaw = String(em.phone || "").toLowerCase();
    const phoneDigits = phoneRaw.replace(/\D/g, "");
    const qDigits = q.replace(/\D/g, "");
    const salon = (em.salon?.name || "").toLowerCase();
    if (name.includes(q) || email.includes(q) || phoneRaw.includes(q) || salon.includes(q)) return true;
    if (qDigits.length >= 3 && phoneDigits.includes(qDigits)) return true;
    return false;
  };

  const submitConfirmWithEmployee = async () => {
    if (!confirmFlow?.apt) return;
    if (!confirmEmployeeId) {
      toast.error("Please select an employee first.");
      return;
    }
    await updateStatus(confirmFlow.apt._id, "confirmed", confirmEmployeeId);
  };

  const statusSelectValue = (apt) =>
    confirmFlow && confirmFlow.apt && confirmFlow.apt._id === apt._id
      ? "pending"
      : apt.status || "pending";

  const addCashPayment = async (id, onSuccess) => {
    const raw = prompt("Enter cash amount received (₹):");
    if (!raw) return;
    const amount = Number(raw);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("Invalid amount");
      return;
    }
    const res = await fetch(`/api/appointment/${id}`, {
      ...fetchOpts,
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cashPaidDelta: amount }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.status === 401) {
      toast.error("Session expired. Please log in again.");
      router.push("/admin/login");
      return;
    }
    if (!res.ok) {
      toast.error(data.message || "Could not update cash payment");
      return;
    }
    toast.success("Cash payment updated");
    fetchAppointments();
    onSuccess?.();
  };

  const markRefundProcessed = async (id, onSuccess) => {
    const note = prompt("Optional refund note / reference ID:");
    const res = await fetch(`/api/appointment/${id}`, {
      ...fetchOpts,
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "mark_refund_processed",
        refundNote: note || "",
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.status === 401) {
      toast.error("Session expired. Please log in again.");
      router.push("/admin/login");
      return;
    }
    if (!res.ok) {
      toast.error(data.message || "Could not mark refund as processed");
      return;
    }
    toast.success("Refund marked as processed");
    fetchAppointments();
    onSuccess?.();
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this appointment?")) return;
    await fetch(`/api/appointment/${id}`, { ...fetchOpts, method: "DELETE" });
    toast.success("Appointment deleted");
    fetchAppointments();
  };

  const getDerivedStatus = (apt) => {
    const baseStatus = apt.status || "pending";
    if (baseStatus === "completed" || baseStatus === "cancelled" || baseStatus === "expired") {
      return baseStatus;
    }
    const d = new Date(apt.date);
    const [h = 0, m = 0] = String(apt.time || "").split(":").map(Number);
    d.setHours(h, m, 0, 0);
    const now = new Date();
    if (d.getTime() < now.getTime()) {
      return "expired";
    }
    return baseStatus;
  };

  const filteredAppointments = appointments.filter((apt) => {
    const status = getDerivedStatus(apt);
    if (filter !== "all" && status !== filter) return false;
    if (dateFilter) {
      const aptDate = new Date(apt.date).toISOString().split("T")[0];
      if (aptDate !== dateFilter) return false;
    }

    const isVideo = apt.service?.isVideoConsultation;
    if (serviceTypeFilter === "video-consultation") {
      if (!isVideo) return false;
    } else if (serviceTypeFilter === "home-service") {
      if (isVideo) return false;
    }

    const paymentStatus = apt.payment?.status || "unpaid";
    if (paymentStatusFilter !== "all" && paymentStatus !== paymentStatusFilter) {
      return false;
    }

    const paymentPlan = apt.payment?.plan || "half";
    if (paymentPlanFilter !== "all" && paymentPlan !== paymentPlanFilter) {
      return false;
    }

    if (refundFilter !== "all") {
      const refundStatus = apt.refund?.status || "not_required";
      if (refundFilter === "pending" && refundStatus !== "pending") return false;
      if (refundFilter === "processed" && refundStatus !== "processed") return false;
      if (refundFilter === "not_required" && refundStatus !== "not_required") return false;
    }

    return true;
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [filter, dateFilter, serviceTypeFilter, paymentStatusFilter, paymentPlanFilter, refundFilter]);

  const sortedAppointments = [...filteredAppointments].sort((a, b) => {
    const da = new Date(a.date);
    const db = new Date(b.date);
    const [aH = 0, aM = 0] = (a.time || "").split(":").map(Number);
    const [bH = 0, bM = 0] = (b.time || "").split(":").map(Number);
    const aTime = da.getTime() + aH * 60 * 60 * 1000 + aM * 60 * 1000;
    const bTime = db.getTime() + bH * 60 * 60 * 1000 + bM * 60 * 1000;
    // Newest first
    return bTime - aTime;
  });
  const totalPages = Math.max(1, Math.ceil(sortedAppointments.length / PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * PAGE_SIZE;
  const paginatedAppointments = sortedAppointments.slice(startIndex, startIndex + PAGE_SIZE);

  const refundPendingCount = appointments.filter(
    (apt) => (apt.status || "pending") === "cancelled" && (apt.refund?.status || "not_required") === "pending"
  ).length;
  const refundProcessedCount = appointments.filter(
    (apt) => (apt.status || "pending") === "cancelled" && (apt.refund?.status || "not_required") === "processed"
  ).length;
  const cancelledCount = appointments.filter((apt) => (apt.status || "pending") === "cancelled").length;
  const totalAppointmentsCount = appointments.length;

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return { bg: "#fef3c7", color: "#92400e" };
      case "confirmed":
        return { bg: "#d1fae5", color: "#166534" };
      case "completed":
        return { bg: "#dbeafe", color: "#1e40af" };
      case "cancelled":
        return { bg: "#fee2e2", color: "#991b1b" };
      case "expired":
        return { bg: "#e5e7eb", color: "#4b5563" };
      default:
        return { bg: "#f3f4f6", color: "#6b7280" };
    }
  };

  const getServiceItems = (apt) => {
    const items =
      Array.isArray(apt?.services) && apt.services.length > 0
        ? apt.services.map((x) => ({
            name: x?.name || x?.service?.name || "Service",
            qty: Math.max(1, Number(x?.quantity) || 1),
            image: x?.service?.image || apt?.service?.image || null,
          }))
        : [
            {
              name: apt?.service?.name || "Service",
              qty: Math.max(1, Number(apt?.quantity) || 1),
              image: apt?.service?.image || null,
            },
          ];
    return (items || []).filter(Boolean);
  };

  return (
    <div>
      <div style={styles.pageHeader}>
        <h2 style={styles.pageTitle}>Appointments</h2>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            style={{
              padding: "12px 16px",
              border: "2px solid #e2e8f0",
              borderRadius: "10px",
              fontSize: "15px",
              fontWeight: 500,
              background: "white",
              cursor: "pointer",
            }}
          />
          <select
            value={serviceTypeFilter}
            onChange={(e) => setServiceTypeFilter(e.target.value)}
            style={{
              padding: "12px 20px",
              border: "2px solid #e2e8f0",
              borderRadius: "10px",
              fontSize: "15px",
              fontWeight: 500,
              background: "white",
              cursor: "pointer",
            }}
          >
            <option value="all">All Service Types</option>
            <option value="home-service">Home Service</option>
            <option value="video-consultation">Video Consultation</option>
          </select>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{
              padding: "12px 20px",
              border: "2px solid #e2e8f0",
              borderRadius: "10px",
              fontSize: "15px",
              fontWeight: 500,
              background: "white",
              cursor: "pointer",
            }}
          >
            <option value="all">All Appointments</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="expired">Expired (time passed)</option>
          </select>
          <select
            value={paymentStatusFilter}
            onChange={(e) => setPaymentStatusFilter(e.target.value)}
            style={{
              padding: "12px 20px",
              border: "2px solid #e2e8f0",
              borderRadius: "10px",
              fontSize: "15px",
              fontWeight: 500,
              background: "white",
              cursor: "pointer",
            }}
          >
            <option value="all">All Payment Status</option>
            <option value="unpaid">Unpaid</option>
            <option value="partial">Partial</option>
            <option value="paid">Paid</option>
          </select>
          <select
            value={paymentPlanFilter}
            onChange={(e) => setPaymentPlanFilter(e.target.value)}
            style={{
              padding: "12px 20px",
              border: "2px solid #e2e8f0",
              borderRadius: "10px",
              fontSize: "15px",
              fontWeight: 500,
              background: "white",
              cursor: "pointer",
            }}
          >
            <option value="all">All Plans</option>
            <option value="full">Full Payment</option>
            <option value="half">Half / Advance</option>
          </select>
          <select
            value={refundFilter}
            onChange={(e) => setRefundFilter(e.target.value)}
            style={{
              padding: "12px 20px",
              border: "2px solid #e2e8f0",
              borderRadius: "10px",
              fontSize: "15px",
              fontWeight: 500,
              background: "white",
              cursor: "pointer",
            }}
          >
            <option value="all">All Refund Status</option>
            <option value="pending">Refund Pending</option>
            <option value="processed">Refund Processed</option>
            <option value="not_required">No Refund Required</option>
          </select>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 12,
          marginBottom: 14,
        }}
      >
        <div
          style={{
            background: "#fff7ed",
            border: "1px solid #fed7aa",
            borderRadius: 12,
            padding: "12px 14px",
          }}
        >
          <div style={{ fontSize: 12, color: "#9a3412", fontWeight: 700, textTransform: "uppercase" }}>
            Pending Refunds
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: "#c2410c", marginTop: 4 }}>
            {refundPendingCount}
          </div>
        </div>
        <div
          style={{
            background: "#f0fdf4",
            border: "1px solid #bbf7d0",
            borderRadius: 12,
            padding: "12px 14px",
          }}
        >
          <div style={{ fontSize: 12, color: "#166534", fontWeight: 700, textTransform: "uppercase" }}>
            Refund Processed
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: "#15803d", marginTop: 4 }}>
            {refundProcessedCount}
          </div>
        </div>
        <div
          style={{
            background: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: 12,
            padding: "12px 14px",
          }}
        >
          <div style={{ fontSize: 12, color: "#991b1b", fontWeight: 700, textTransform: "uppercase" }}>
            Cancelled Appointments
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: "#dc2626", marginTop: 4 }}>
            {cancelledCount}
          </div>
        </div>
        <div
          style={{
            background: "#eff6ff",
            border: "1px solid #bfdbfe",
            borderRadius: 12,
            padding: "12px 14px",
          }}
        >
          <div style={{ fontSize: 12, color: "#1e3a8a", fontWeight: 700, textTransform: "uppercase" }}>
            Total Appointments
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: "#1d4ed8", marginTop: 4 }}>
            {totalAppointmentsCount}
          </div>
        </div>
      </div>

      {filteredAppointments.length === 0 ? (
        <div style={styles.emptyState}>
          <p style={styles.emptyStateText}>
            {appointments.length === 0
              ? "No appointments yet."
              : "No appointments match the selected filters."}
          </p>
        </div>
      ) : (
        <>
        {/* Mobile cards */}
        <div className={cardStyles.mobileCards}>
          {paginatedAppointments.map((apt) => {
            const status = getDerivedStatus(apt);
            const statusColors = getStatusColor(status);
            const serviceItems = getServiceItems(apt);
            const serviceNames = serviceItems.map((s) => s?.name).filter(Boolean);
            const subtotal = apt.pricing?.subtotal ?? apt.totalPrice ?? apt.service?.price ?? 0;
            const discount = apt.pricing?.discountAmount ?? 0;
            const total = apt.pricing?.totalPayable ?? subtotal - discount;
            const paidOnline = apt.payment?.paidOnline ?? 0;
            const paidCash = apt.payment?.paidCash ?? 0;
            const paid = paidOnline + paidCash;
            const remaining = Math.max(0, total - paid);
            return (
              <div key={apt._id} className={cardStyles.card}>
                <div className={cardStyles.cardHeader}>
                  <div>
                    <div className={cardStyles.cardCustomer}>{apt.customer?.name || "N/A"}</div>
                    <div className={cardStyles.cardMeta}>
                      {new Date(apt.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} • {apt.time}
                    </div>
                  </div>
                  <span
                    className={cardStyles.cardBadge}
                    style={{ background: statusColors.bg, color: statusColors.color }}
                  >
                    {status}
                  </span>
                </div>
                <div className={cardStyles.cardSummary}>
                  <strong>
                    {serviceItems.length > 0
                      ? serviceItems.map((s) => `${s.name} (x${s.qty})`).join(", ")
                      : "N/A"}
                  </strong>
                  <br />
                  Total: ₹{total} • Remaining: ₹{remaining}
                </div>
                <button
                  type="button"
                  className={cardStyles.viewMoreBtn}
                  onClick={() => setViewMoreApt(apt)}
                >
                  View More
                </button>
              </div>
            );
          })}
        </div>

        {/* Desktop table */}
        <div
          className={cardStyles.tableWrapper}
          style={{ ...styles.table.wrapper, height: 500, maxHeight: 500, overflowY: "auto" }}
        >
          <table style={styles.table.table}>
            <thead>
              <tr>
                <th style={styles.table.th}>Customer</th>
                <th style={styles.table.th}>Contact</th>
                <th style={styles.table.th}>Salon</th>
                <th style={styles.table.th}>Employee</th>
                <th style={styles.table.th}>Service</th>
                <th style={styles.table.th}>Location</th>
                <th style={styles.table.th}>Date & Time</th>
                <th style={styles.table.th}>Status</th>
                <th style={styles.table.th}>Payment</th>
                <th style={styles.table.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedAppointments.map((apt) => {
                const status = getDerivedStatus(apt);
                const statusColors = getStatusColor(status);
                const serviceItems = getServiceItems(apt);
                const serviceNames = serviceItems.map((s) => s?.name).filter(Boolean);
                const isMulti = serviceNames.length > 1;
                const refundStatus = apt.refund?.status || "not_required";
                const isRefundPending = status === "cancelled" && refundStatus === "pending";
                return (
                  <tr key={apt._id}>
                    <td style={styles.table.td}>
                      <p style={styles.table.text}>{apt.customer?.name || "N/A"}</p>
                    </td>
                    <td style={styles.table.td}>
                      <p style={styles.table.textSmall}>{apt.customer?.phone || "N/A"}</p>
                      <p style={styles.table.textSmall}>{apt.customer?.email || "N/A"}</p>
                    </td>
                    <td style={styles.table.td}>
                      <p style={styles.table.textSmall}>{apt.salon?.name || "N/A"}</p>
                    </td>
                    <td style={styles.table.td}>
                      <p style={styles.table.textSmall}>
                        {apt.employee?.name || "N/A"}
                        {apt.employee?.specialization && (
                          <span style={{ color: "#64748b", fontSize: "11px" }}> ({apt.employee.specialization})</span>
                        )}
                      </p>
                    </td>
                    <td style={styles.table.td}>
                      <div style={{ textAlign: "left", fontSize: 12, lineHeight: 1.5 }}>
                        <div style={{ fontWeight: 600, color: "#111827" }}>
                          {serviceItems.length > 0
                            ? serviceItems.map((s) => `${s.name} (x${s.qty})`).join(", ")
                            : "N/A"}
                        </div>
                        {isMulti && (
                          <ul style={{ marginTop: 4, paddingLeft: 16, fontSize: 11, color: "#6b7280" }}>
                            {serviceItems.map((s) => (
                              <li key={`${s.name}-${s.qty}`}>
                                {s.name} (x{s.qty})
                              </li>
                            ))}
                          </ul>
                        )}
                        {(apt.service?.price != null || apt.service?.originalPrice != null) && (
                          <div style={{ marginTop: 4 }}>
                            {apt.service?.originalPrice != null &&
                              apt.service.originalPrice > (apt.service?.price ?? 0) && (
                                <p
                                  style={{
                                    ...styles.table.textSmall,
                                    color: "#9ca3af",
                                    textDecoration: "line-through",
                                    marginBottom: 2,
                                  }}
                                >
                                  MRP: ₹{apt.service.originalPrice}
                                </p>
                              )}
                            {apt.service?.price != null && (
                              <p
                                style={{
                                  ...styles.table.textSmall,
                                  color: "var(--accent-terracotta)",
                                  fontWeight: 600,
                                }}
                              >
                                Selling price: ₹{apt.service.price}
                              </p>
                            )}
                          </div>
                        )}
                        <span
                          style={{
                            display: "inline-block",
                            marginTop: 4,
                            padding: "3px 8px",
                            borderRadius: 6,
                            fontSize: 11,
                            fontWeight: 600,
                            background: apt.service?.isVideoConsultation ? "#dbeafe" : "#dcfce7",
                            color: apt.service?.isVideoConsultation ? "#1d4ed8" : "#166534",
                          }}
                        >
                          Type:{" "}
                          {apt.service?.isVideoConsultation ? "Video consultation" : "Home service"}
                        </span>
                      </div>
                    </td>
                    <td style={styles.table.td}>
                      <p
                        style={{
                          ...styles.table.textSmall,
                          maxWidth: "180px",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                        title={apt.location || undefined}
                      >
                        {apt.service?.isVideoConsultation ? "—" : (apt.location || "—")}
                      </p>
                    </td>
                    <td style={styles.table.td}>
                      <div style={{ textAlign: "left", fontSize: 12, lineHeight: 1.4 }}>
                        <p style={styles.table.textSmall}>
                          <strong>Date:</strong>{" "}
                          {new Date(apt.date).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                        <p style={styles.table.textSmall}>
                          <strong>Time:</strong> {apt.time}
                        </p>
                        {apt.notes && (
                          <p
                            style={{
                              ...styles.table.textSmall,
                              maxWidth: "200px",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              marginTop: "4px",
                              fontStyle: "italic",
                            }}
                            title={apt.notes}
                          >
                            Note: {apt.notes}
                          </p>
                        )}
                      </div>
                    </td>
                    <td style={styles.table.td}>
                      <span
                        style={{
                          ...styles.table.status,
                          background: statusColors.bg,
                          color: statusColors.color,
                        }}
                      >
                        {status}
                      </span>
                    </td>
                    <td style={styles.table.td}>
                      {(() => {
                        const subtotal = apt.pricing?.subtotal ?? apt.totalPrice ?? apt.service?.price ?? 0;
                        const discount = apt.pricing?.discountAmount ?? 0;
                        const couponCode = apt.pricing?.couponCode;
                        const total = apt.pricing?.totalPayable ?? subtotal - discount;
                        const paidOnline = apt.payment?.paidOnline ?? 0;
                        const paidCash = apt.payment?.paidCash ?? 0;
                        const paid = paidOnline + paidCash;
                        const remaining = Math.max(0, total - paid);
                        const paymentStatus = apt.payment?.status || "unpaid";
                        const paymentPlan = apt.payment?.plan || "half";

                        let statusBg = "#fee2e2";
                        let statusColor = "#991b1b";
                        if (paymentStatus === "partial") {
                          statusBg = "#fef3c7";
                          statusColor = "#92400e";
                        } else if (paymentStatus === "paid") {
                          statusBg = "#dcfce7";
                          statusColor = "#166534";
                        }

                        return (
                          <div style={{ fontSize: 12, lineHeight: 1.6, textAlign: "left" }}>
                            <div><strong>Booking amount:</strong> ₹{subtotal}</div>
                            {couponCode && discount > 0 && (
                              <div style={{ color: "#059669", fontWeight: 600, marginTop: 2 }}>
                                Coupon {couponCode}: -₹{discount}
                              </div>
                            )}
                            <div style={{ marginTop: 2, fontWeight: 600, color: "#111827" }}>
                              Total to collect: ₹{total}
                            </div>
                            <div style={{ marginTop: 4, color: "#065f46", fontWeight: 500 }}>
                              Paid online: ₹{paidOnline}
                            </div>
                            <div style={{ marginTop: 1, color: "#065f46", fontWeight: 500 }}>
                              Paid in cash: ₹{paidCash}
                            </div>
                            <div
                              style={{
                                marginTop: 2,
                                color: remaining > 0 ? "#b91c1c" : "#16a34a",
                                fontWeight: 600,
                              }}
                            >
                              Remaining due: ₹{remaining}
                            </div>
                            <div style={{ marginTop: 4, fontSize: 11, color: "#4b5563" }}>
                              Plan: {paymentPlanLabel(paymentPlan)}
                            </div>
                            <span
                              style={{
                                display: "inline-flex",
                                marginTop: 6,
                                padding: "4px 10px",
                                borderRadius: 999,
                                background: statusBg,
                                color: statusColor,
                                fontSize: 11,
                                fontWeight: 700,
                                textTransform: "uppercase",
                                letterSpacing: "0.04em",
                              }}
                            >
                              {paymentStatus}
                            </span>
                          </div>
                        );
                      })()}
                    </td>
                    <td style={styles.table.td}>
                      <div style={styles.table.actions}>
                        {isRefundPending && (
                          <button
                            onClick={() => markRefundProcessed(apt._id)}
                            style={{
                              ...styles.table.btn,
                              background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                              minWidth: "170px",
                            }}
                          >
                            Mark Refund Processed
                          </button>
                        )}
                        <select
                          value={statusSelectValue(apt)}
                          onChange={(e) => handleAppointmentStatusChange(apt, e.target.value)}
                          style={{
                            ...styles.table.btn,
                            background: "white",
                            color: "#1f2937",
                            border: "2px solid #e2e8f0",
                            padding: "8px 12px",
                            minWidth: "120px",
                            fontSize: "13px",
                            cursor: "pointer",
                          }}
                        >
                          <option value="pending">Pending</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                        <button
                          onClick={() => addCashPayment(apt._id)}
                          style={{
                            ...styles.table.btn,
                            background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                            minWidth: "110px",
                          }}
                        >
                          Add Cash
                        </button>
                        <button
                          onClick={() => handleDelete(apt._id)}
                          style={{
                            ...styles.table.btn,
                            background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                            minWidth: "80px",
                          }}
                        >
                          Delete
                        </button>
                        {isRefundPending && (
                          <span
                            style={{
                              padding: "6px 10px",
                              borderRadius: 999,
                              background: "#fef3c7",
                              color: "#92400e",
                              fontSize: 11,
                              fontWeight: 700,
                              textTransform: "uppercase",
                            }}
                          >
                            User Cancelled - Refund Pending
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div
            style={{
              marginTop: 14,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 10,
              flexWrap: "wrap",
            }}
          >
            <div style={{ fontSize: 13, color: "#64748b" }}>
              Showing {startIndex + 1}-
              {Math.min(startIndex + PAGE_SIZE, sortedAppointments.length)} of {sortedAppointments.length}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={safeCurrentPage === 1}
                style={{
                  ...styles.table.btn,
                  background: safeCurrentPage === 1 ? "#cbd5e1" : "#1f2937",
                  minWidth: 90,
                  cursor: safeCurrentPage === 1 ? "not-allowed" : "pointer",
                }}
              >
                Previous
              </button>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#334155" }}>
                Page {safeCurrentPage} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={safeCurrentPage === totalPages}
                style={{
                  ...styles.table.btn,
                  background: safeCurrentPage === totalPages ? "#cbd5e1" : "#1f2937",
                  minWidth: 70,
                  cursor: safeCurrentPage === totalPages ? "not-allowed" : "pointer",
                }}
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Detail modal (mobile) */}
        {viewMoreApt && (
          <div
            className={cardStyles.modalOverlay}
            onClick={() => setViewMoreApt(null)}
          >
            <div className={cardStyles.modal} onClick={(e) => e.stopPropagation()}>
              <div className={cardStyles.modalHeader}>
                <h3 className={cardStyles.modalTitle}>Appointment Details</h3>
                <button
                  type="button"
                  className={cardStyles.modalClose}
                  onClick={() => setViewMoreApt(null)}
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>
              <div className={cardStyles.modalBody}>
                {(() => {
                  const apt = viewMoreApt;
                  const status = getDerivedStatus(apt);
                  const statusColors = getStatusColor(status);
                  const multiServices = Array.isArray(apt.services) && apt.services.length > 0
                    ? apt.services
                    : (apt.service ? [apt.service] : []);
                  const serviceNames = multiServices.map((s) => s?.name).filter(Boolean);
                  const subtotal = apt.pricing?.subtotal ?? apt.totalPrice ?? apt.service?.price ?? 0;
                  const discount = apt.pricing?.discountAmount ?? 0;
                  const total = apt.pricing?.totalPayable ?? subtotal - discount;
                  const paidOnline = apt.payment?.paidOnline ?? 0;
                  const paidCash = apt.payment?.paidCash ?? 0;
                  const paid = paidOnline + paidCash;
                  const remaining = Math.max(0, total - paid);
                  const paymentStatus = apt.payment?.status || "unpaid";
                  const paymentPlan = apt.payment?.plan || "half";
                  const refundStatus = apt.refund?.status || "not_required";
                  const isRefundPending = status === "cancelled" && refundStatus === "pending";
                  let payStatusBg = "#fee2e2";
                  let payStatusColor = "#991b1b";
                  if (paymentStatus === "partial") {
                    payStatusBg = "#fef3c7";
                    payStatusColor = "#92400e";
                  } else if (paymentStatus === "paid") {
                    payStatusBg = "#dcfce7";
                    payStatusColor = "#166534";
                  }
                  return (
                    <>
                      <div className={cardStyles.detailRow}>
                        <span className={cardStyles.detailLabel}>Customer</span>
                        <span className={cardStyles.detailValue}>{apt.customer?.name || "N/A"}</span>
                        <span style={{ fontSize: 13, color: "#64748b" }}>
                          {apt.customer?.phone || "—"} {apt.customer?.email && `• ${apt.customer.email}`}
                        </span>
                      </div>
                      <div className={cardStyles.detailRow}>
                        <span className={cardStyles.detailLabel}>Salon</span>
                        <span className={cardStyles.detailValue}>{apt.salon?.name || "N/A"}</span>
                      </div>
                      <div className={cardStyles.detailRow}>
                        <span className={cardStyles.detailLabel}>Employee</span>
                        <span className={cardStyles.detailValue}>
                          {apt.employee?.name || "N/A"}
                          {apt.employee?.specialization && ` (${apt.employee.specialization})`}
                        </span>
                      </div>
                      <div className={cardStyles.detailSection}>
                        <div className={cardStyles.detailSectionTitle}>Service</div>
                        <div className={cardStyles.detailValue}>{serviceNames.length > 0 ? serviceNames.join(", ") : "N/A"}</div>
                        <span
                          style={{
                            display: "inline-block",
                            marginTop: 6,
                            padding: "4px 10px",
                            borderRadius: 6,
                            fontSize: 11,
                            fontWeight: 600,
                            background: apt.service?.isVideoConsultation ? "#dbeafe" : "#dcfce7",
                            color: apt.service?.isVideoConsultation ? "#1d4ed8" : "#166534",
                          }}
                        >
                          {apt.service?.isVideoConsultation ? "Video consultation" : "Home service"}
                        </span>
                        {apt.location && !apt.service?.isVideoConsultation && (
                          <div style={{ marginTop: 8, fontSize: 13, color: "#64748b" }}>Location: {apt.location}</div>
                        )}
                        {apt.notes && (
                          <div style={{ marginTop: 6, fontSize: 13, fontStyle: "italic", color: "#64748b" }}>Note: {apt.notes}</div>
                        )}
                      </div>
                      <div className={cardStyles.detailRow}>
                        <span className={cardStyles.detailLabel}>Date & Time</span>
                        <span className={cardStyles.detailValue}>
                          {new Date(apt.date).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" })} at {apt.time}
                        </span>
                      </div>
                      <div className={cardStyles.detailRow}>
                        <span className={cardStyles.detailLabel}>Status</span>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "6px 14px",
                            borderRadius: 999,
                            fontSize: 13,
                            fontWeight: 600,
                            background: statusColors.bg,
                            color: statusColors.color,
                          }}
                        >
                          {status}
                        </span>
                      </div>
                      <div className={cardStyles.detailSection}>
                        <div className={cardStyles.detailSectionTitle}>Payment</div>
                        <div style={{ fontSize: 14, lineHeight: 1.8 }}>
                          <div>Booking amount: ₹{subtotal}</div>
                          {apt.pricing?.couponCode && discount > 0 && (
                            <div style={{ color: "#059669", fontWeight: 600 }}>Coupon {apt.pricing.couponCode}: -₹{discount}</div>
                          )}
                          <div style={{ fontWeight: 600 }}>Total to collect: ₹{total}</div>
                          <div style={{ color: "#065f46" }}>Paid online: ₹{paidOnline}</div>
                          <div style={{ color: "#065f46" }}>Paid in cash: ₹{paidCash}</div>
                          <div style={{ color: remaining > 0 ? "#b91c1c" : "#16a34a", fontWeight: 600 }}>Remaining due: ₹{remaining}</div>
                          <div style={{ fontSize: 12, color: "#64748b" }}>Plan: {paymentPlanLabel(paymentPlan)}</div>
                          <span
                            style={{
                              display: "inline-block",
                              marginTop: 8,
                              padding: "4px 12px",
                              borderRadius: 999,
                              background: payStatusBg,
                              color: payStatusColor,
                              fontSize: 11,
                              fontWeight: 700,
                              textTransform: "uppercase",
                            }}
                          >
                            {paymentStatus}
                          </span>
                        </div>
                      </div>
                      <div className={cardStyles.modalActions}>
                        {isRefundPending && (
                          <button
                            type="button"
                            className={cardStyles.addCashModalBtn}
                            style={{ background: "#d97706" }}
                            onClick={() => markRefundProcessed(apt._id, () => setViewMoreApt(null))}
                          >
                            Mark Refund Processed
                          </button>
                        )}
                        <select
                          value={statusSelectValue(apt)}
                          onChange={async (e) => {
                            const v = e.target.value;
                            if (v === "confirmed" && (apt.status || "pending") !== "confirmed") {
                              setViewMoreApt(null);
                              openConfirmEmployeeModal(apt);
                              return;
                            }
                            await updateStatus(apt._id, v);
                            setViewMoreApt(null);
                          }}
                        >
                          <option value="pending">Pending</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                        <button
                          type="button"
                          className={cardStyles.addCashModalBtn}
                          onClick={() => addCashPayment(apt._id, () => setViewMoreApt(null))}
                        >
                          Add Cash
                        </button>
                        <button
                          type="button"
                          className={cardStyles.deleteModalBtn}
                          onClick={() => {
                            handleDelete(apt._id);
                            setViewMoreApt(null);
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        )}

        {confirmFlow && (
          <div
            className={cardStyles.modalOverlay}
            onClick={() => setConfirmFlow(null)}
            role="presentation"
          >
            <div className={cardStyles.modal} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
              <div className={cardStyles.modalHeader}>
                <h3 className={cardStyles.modalTitle}>Confirm appointment</h3>
                <button
                  type="button"
                  className={cardStyles.modalClose}
                  onClick={() => setConfirmFlow(null)}
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>
              <div className={cardStyles.modalBody}>
                <p style={{ fontSize: 14, color: "#475569", marginBottom: 12, lineHeight: 1.5 }}>
                  Choose any team member for this booking (all employees are listed; this appointment’s salon
                  appears first). WhatsApp to the customer and the selected employee is sent only after you
                  confirm.
                </p>
                <label style={{ display: "block", marginBottom: 6, fontWeight: 600 }}>Search employees</label>
                <input
                  value={confirmSearch}
                  onChange={(e) => setConfirmSearch(e.target.value)}
                  placeholder="Name, phone, email or salon…"
                  style={{
                    width: "100%",
                    padding: 10,
                    borderRadius: 8,
                    border: "1px solid #e2e8f0",
                    marginBottom: 12,
                    fontSize: 14,
                  }}
                />
                {confirmEmpLoading ? (
                  <p style={{ color: "#64748b" }}>Loading…</p>
                ) : (
                  <div
                    style={{
                      maxHeight: "min(52vh, 360px)",
                      overflowY: "auto",
                      border: "1px solid #e2e8f0",
                      borderRadius: 8,
                    }}
                  >
                    {confirmEmpList.filter((em) => employeeMatchesConfirmSearch(em, confirmSearch)).length ===
                    0 ? (
                      <p style={{ padding: 12, color: "#94a3b8" }}>
                        {confirmEmpList.length === 0
                          ? "No employees found."
                          : "No employees match your search."}
                      </p>
                    ) : (
                      confirmEmpList
                        .filter((em) => employeeMatchesConfirmSearch(em, confirmSearch))
                        .map((em) => (
                          <label
                            key={em._id}
                            style={{
                              display: "flex",
                              gap: 10,
                              padding: "10px 12px",
                              borderBottom: "1px solid #f1f5f9",
                              cursor: "pointer",
                              alignItems: "center",
                              background:
                                confirmEmployeeId === em._id.toString() ? "#fff7ed" : "white",
                            }}
                          >
                            <input
                              type="radio"
                              name="confirmEmployee"
                              checked={confirmEmployeeId === em._id.toString()}
                              onChange={() => setConfirmEmployeeId(em._id.toString())}
                            />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontWeight: 700, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                                <span>{em.name}</span>
                                {!em.active && (
                                  <span
                                    style={{
                                      fontSize: 11,
                                      fontWeight: 600,
                                      color: "#b45309",
                                      background: "#fef3c7",
                                      padding: "2px 8px",
                                      borderRadius: 999,
                                    }}
                                  >
                                    Inactive
                                  </span>
                                )}
                              </div>
                              <div style={{ fontSize: 12, color: "#64748b" }}>
                                {em.phone} · {em.email}
                              </div>
                              {em.salon?.name ? (
                                <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>{em.salon.name}</div>
                              ) : null}
                            </div>
                          </label>
                        ))
                    )}
                  </div>
                )}
              </div>
              <div className={`${cardStyles.modalActions} ${cardStyles.confirmEmployeeModalActions}`}>
                <button
                  type="button"
                  className={cardStyles.confirmModalBtnSecondary}
                  onClick={() => setConfirmFlow(null)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className={cardStyles.confirmModalBtnPrimary}
                  onClick={submitConfirmWithEmployee}
                >
                  Confirm with selected employee
                </button>
              </div>
            </div>
          </div>
        )}

        </>
      )}
    </div>
  );
}
