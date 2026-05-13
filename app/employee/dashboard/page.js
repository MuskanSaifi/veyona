// app/employee/dashboard/page.js
"use client";
import { useEffect, useState } from "react";

const DEFAULT_SERVICE_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48'%3E%3Crect fill='%23e5e7eb' width='48' height='48'/%3E%3Ctext fill='%239ca3af' font-family='sans-serif' font-size='8' x='50%25' y='50%25' text-anchor='middle' dy='.3em'%3ENo Image%3C/text%3E%3C/svg%3E";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { FaPhone, FaEnvelope, FaUser, FaCalendarAlt, FaClock, FaRupeeSign } from "react-icons/fa";
import styles from "./dashboard.module.css";

export default function EmployeeDashboard() {
  const router = useRouter();
  const [appointments, setAppointments] = useState([]);
  const [employee, setEmployee] = useState(null);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetchAppointments();
  }, [filter]);

  const fetchAppointments = async () => {
    try {
      let url = "/api/employee/appointments";
      if (filter !== "all") {
        url += `?status=${filter}`;
      }
      const res = await fetch(url);
      
      if (res.status === 401) {
        router.push("/employee/login");
        return;
      }
      
      const data = await res.json();
      setAppointments(data);
    } catch (error) {
      console.error("Error fetching appointments:", error);
    }
  };

  const addCashPayment = async (id) => {
    const raw = prompt("Enter cash amount received (₹):");
    if (!raw) return;
    const amount = Number(raw);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("Invalid amount");
      return;
    }
    try {
      const res = await fetch(`/api/appointment/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cashPaidDelta: amount }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.message || "Could not update cash payment");
        return;
      }
      toast.success("Cash payment updated");
      fetchAppointments();
    } catch (error) {
      toast.error("Error updating cash payment");
    }
  };
  const updateStatus = async (id, status) => {
    if (status !== "confirmed" && status !== "completed") {
      return;
    }
    try {
      const res = await fetch(`/api/appointment/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        toast.success("Status updated");
        fetchAppointments();
      } else {
        toast.error(data.message || "Failed to update status");
      }
    } catch (error) {
      toast.error("Error updating status");
    }
  };

  const logout = async () => {
    await fetch("/api/employee/logout");
    router.push("/employee/login");
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return { bg: "#fef3c7", color: "#92400e" };
      case "confirmed":
        return { bg: "#d1fae5", color: "#065f46" };
      case "completed":
        return { bg: "#ddd6fe", color: "#5b21b6" };
      case "cancelled":
        return { bg: "#fee2e2", color: "#991b1b" };
      default:
        return { bg: "#f3f4f6", color: "#374151" };
    }
  };

  const filteredAppointments = filter === "all" 
    ? appointments 
    : appointments.filter((apt) => apt.status === filter);

  const getServiceItems = (apt) => {
    const items =
      Array.isArray(apt?.services) && apt.services.length > 0
        ? apt.services.map((x) => ({
            name: x?.name || x?.service?.name || "Service",
            qty: Math.max(1, Number(x?.quantity) || 1),
            image: x?.service?.image || apt?.service?.image || DEFAULT_SERVICE_IMAGE,
          }))
        : [
            {
              name: apt?.service?.name || "Service",
              qty: Math.max(1, Number(apt?.quantity) || 1),
              image: apt?.service?.image || DEFAULT_SERVICE_IMAGE,
            },
          ];
    return (items || []).filter(Boolean);
  };

  const formatTrackTime = (iso) => {
    if (!iso) return "—";
    try {
      return new Date(iso).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
    } catch {
      return "—";
    }
  };

  const sendServiceTracking = async (aptId, trackingAction) => {
    try {
      const res = await fetch(`/api/appointment/${aptId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trackingAction }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.message || "Could not update");
        return;
      }
      toast.success(trackingAction === "start_service" ? "Service started" : "Service ended");
      fetchAppointments();
    } catch {
      toast.error("Network error");
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Employee Dashboard</h1>
          <p className={styles.subtitle}>Manage your appointments and leads</p>
        </div>
        <button className={styles.logoutBtn} onClick={logout}>
          Logout
        </button>
      </div>

      <div className={styles.filters}>
        <button
          className={`${styles.filterBtn} ${filter === "all" ? styles.active : ""}`}
          onClick={() => setFilter("all")}
        >
          All
        </button>
        <button
          className={`${styles.filterBtn} ${filter === "confirmed" ? styles.active : ""}`}
          onClick={() => setFilter("confirmed")}
        >
          Confirmed
        </button>
        <button
          className={`${styles.filterBtn} ${filter === "completed" ? styles.active : ""}`}
          onClick={() => setFilter("completed")}
        >
          Completed
        </button>
      </div>

      {filteredAppointments.length === 0 ? (
        <div className={styles.empty}>
          <p>No appointments found</p>
        </div>
      ) : (
        <>
        {/* Desktop table */}
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>Customer</th>
                <th className={styles.th}>Service</th>
                <th className={styles.th}>Date & Time</th>
                <th className={styles.th}>Price</th>
                <th className={styles.th}>Payment</th>
                <th className={styles.th}>Status</th>
                <th className={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAppointments.map((apt) => {
                const statusStyle = getStatusColor(apt.status);
                const serviceItems = getServiceItems(apt);
                const serviceNames = serviceItems.map((s) => s?.name).filter(Boolean);
                const isMulti = serviceNames.length > 1;
                return (
                  <tr key={apt._id} className={styles.tr}>
                    <td className={styles.td}>
                      <div className={styles.customerCell}>
                        {apt.customer?.name ? (
                          <div className={styles.avatar}>
                            {apt.customer.name.charAt(0).toUpperCase()}
                          </div>
                        ) : (
                          <div className={styles.avatar}>
                            <FaUser />
                          </div>
                        )}
                        <div className={styles.customerInfo}>
                          <div className={styles.customerName}>
                            {apt.customer?.name || "N/A"}
                          </div>
                          <div className={styles.customerDetails}>
                            <span><FaPhone style={{ fontSize: "12px" }} /> {apt.customer?.phone || "N/A"}</span>
                            {apt.customer?.email && (
                              <span><FaEnvelope style={{ fontSize: "12px" }} /> {apt.customer.email}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className={styles.td}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12, justifyContent: "flex-start" }}>
                        <img
                          src={serviceItems?.[0]?.image || DEFAULT_SERVICE_IMAGE}
                          alt=""
                          style={{
                            width: 48,
                            height: 48,
                            objectFit: "cover",
                            borderRadius: 10,
                            flexShrink: 0,
                          }}
                        />
                        <div style={{ textAlign: "left" }}>
                          <div className={styles.serviceName}>
                            {serviceItems.length > 0
                              ? serviceItems.map((s) => `${s.name} (x${s.qty})`).join(", ")
                              : "N/A"}
                          </div>
                          {isMulti && (
                            <ul style={{ marginTop: 4, paddingLeft: 16, fontSize: 11, color: "#6b7280" }}>
                              {serviceItems.map((s) => (
                                <li key={`${s.name}-${s.qty}`}>{s.name} (x{s.qty})</li>
                              ))}
                            </ul>
                          )}
                          <span
                            style={{
                              display: "inline-block",
                              marginTop: 4,
                              padding: "3px 8px",
                              borderRadius: 6,
                              fontSize: 10,
                              fontWeight: 600,
                              background: apt.service?.isVideoConsultation ? "#dbeafe" : "#dcfce7",
                              color: apt.service?.isVideoConsultation ? "#1d4ed8" : "#166534",
                            }}
                          >
                            {apt.service?.isVideoConsultation ? "Video Consultation" : "Home Service"}
                          </span>
                          {apt.notes && (
                            <div className={styles.notes}>Note: {apt.notes}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className={styles.td}>
                      <div>{new Date(apt.date).toLocaleDateString()}</div>
                      <div className={styles.time}>{apt.time}</div>
                    </td>
                    <td className={styles.td}>
                      <div>
                        {apt.service?.originalPrice != null && apt.service.originalPrice > (apt.service?.price ?? 0) && (
                          <div className={styles.notes} style={{ textDecoration: "line-through", marginBottom: 2 }}>₹{apt.service.originalPrice}</div>
                        )}
                        <div className={styles.price}>
                          ₹{apt.totalPrice != null ? apt.totalPrice : (apt.service?.price || "N/A")}
                        </div>
                      </div>
                    </td>
                  <td className={styles.td}>
                    {(() => {
                      const subtotal = apt.pricing?.subtotal ?? apt.totalPrice ?? apt.service?.price ?? 0;
                      const discount = apt.pricing?.discountAmount ?? 0;
                      const couponCode = apt.pricing?.couponCode;
                      const total = apt.pricing?.totalPayable ?? subtotal - discount;
                      const paidOnline = apt.payment?.paidOnline ?? 0;
                      const paidCash = apt.payment?.paidCash ?? 0;
                      const paid = paidOnline + paidCash;
                      const remaining = Math.max(0, total - paid);
                      return (
                        <div className={styles.notes}>
                          <div>Total: ₹{total}</div>
                          {couponCode && discount > 0 && (
                            <div style={{ color: "#059669", fontWeight: 600 }}>Coupon: {couponCode} (₹{discount} off)</div>
                          )}
                          <div>Paid: ₹{paid} (O ₹{paidOnline}, C ₹{paidCash})</div>
                          <div>Remaining: ₹{remaining}</div>
                          <div>Status: {apt.payment?.status || "unpaid"}</div>
                        </div>
                      );
                    })()}
                  </td>
                    <td className={styles.td}>
                      <span
                        className={styles.status}
                        style={{
                          background: statusStyle.bg,
                          color: statusStyle.color,
                        }}
                      >
                        {apt.status}
                      </span>
                    </td>
                    <td className={styles.td}>
                      <select
                        value={apt.status === "completed" ? "completed" : "confirmed"}
                        onChange={(e) => updateStatus(apt._id, e.target.value)}
                        className={styles.statusSelect}
                      >
                        <option value="confirmed">Confirmed</option>
                        <option value="completed">Completed</option>
                      </select>
                    <button
                      className={styles.statusSelect}
                      style={{ marginTop: 6, backgroundColor: "#10b981", color: "white" }}
                      onClick={() => addCashPayment(apt._id)}
                    >
                      Add Cash
                    </button>
                    {(apt.status === "confirmed" || apt.status === "completed") && (
                      <div style={{ marginTop: 10, textAlign: "left", maxWidth: 200 }}>
                        <div style={{ fontSize: 11, color: "#64748b", lineHeight: 1.5 }}>
                          <div>Started: {formatTrackTime(apt.serviceStartedAt)}</div>
                          <div>Ended: {formatTrackTime(apt.serviceEndedAt)}</div>
                        </div>
                        {apt.status === "confirmed" && !apt.serviceStartedAt && (
                          <button
                            type="button"
                            className={styles.statusSelect}
                            style={{ marginTop: 6, width: "100%", backgroundColor: "#2563eb", color: "white" }}
                            onClick={() => sendServiceTracking(apt._id, "start_service")}
                          >
                            Start service
                          </button>
                        )}
                        {apt.status === "confirmed" && apt.serviceStartedAt && !apt.serviceEndedAt && (
                          <button
                            type="button"
                            className={styles.statusSelect}
                            style={{ marginTop: 6, width: "100%", backgroundColor: "#7c3aed", color: "white" }}
                            onClick={() => sendServiceTracking(apt._id, "end_service")}
                          >
                            End service
                          </button>
                        )}
                      </div>
                    )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className={styles.cardGrid}>
          {filteredAppointments.map((apt) => {
            const statusStyle = getStatusColor(apt.status);
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
              <div key={apt._id} className={styles.card}>
                <div className={styles.cardHeader}>
                  <div className={styles.cardCustomer}>
                    {apt.customer?.name ? (
                      <div className={styles.avatar}>{apt.customer.name.charAt(0).toUpperCase()}</div>
                    ) : (
                      <div className={styles.avatar}><FaUser /></div>
                    )}
                    <div className={styles.customerInfo}>
                      <div className={styles.customerName}>{apt.customer?.name || "N/A"}</div>
                      <div className={styles.customerDetails}>
                        <span><FaPhone style={{ fontSize: "11px" }} /> {apt.customer?.phone || "N/A"}</span>
                        {apt.customer?.email && (
                          <span><FaEnvelope style={{ fontSize: "11px" }} /> {apt.customer.email}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <span
                    className={styles.status}
                    style={{ background: statusStyle.bg, color: statusStyle.color }}
                  >
                    {apt.status}
                  </span>
                </div>
                <div className={styles.cardBody}>
                  <div className={styles.cardService}>
                    <img
                      src={serviceItems?.[0]?.image || DEFAULT_SERVICE_IMAGE}
                      alt=""
                      className={styles.cardServiceImg}
                    />
                    <div>
                      <div className={styles.serviceName}>
                        {serviceItems.length > 0
                          ? serviceItems.map((s) => `${s.name} (x${s.qty})`).join(", ")
                          : "N/A"}
                      </div>
                      <span
                        style={{
                          display: "inline-block",
                          marginTop: 4,
                          padding: "3px 8px",
                          borderRadius: 6,
                          fontSize: 10,
                          fontWeight: 600,
                          background: apt.service?.isVideoConsultation ? "#dbeafe" : "#dcfce7",
                          color: apt.service?.isVideoConsultation ? "#1d4ed8" : "#166534",
                        }}
                      >
                        {apt.service?.isVideoConsultation ? "Video Consultation" : "Home Service"}
                      </span>
                      {apt.notes && <div className={styles.notes}>Note: {apt.notes}</div>}
                    </div>
                  </div>
                  <div className={styles.cardRow}>
                    <FaCalendarAlt className={styles.cardIcon} />
                    <span>{new Date(apt.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                  </div>
                  <div className={styles.cardRow}>
                    <FaClock className={styles.cardIcon} />
                    <span>{apt.time}</span>
                  </div>
                  <div className={styles.cardRow}>
                    <FaRupeeSign className={styles.cardIcon} />
                    <div className={styles.cardPayment}>
                      <span>Total: ₹{total}</span>
                      {discount > 0 && <span style={{ color: "#059669" }}>Coupon: -₹{discount}</span>}
                      <span>Paid: ₹{paid}</span>
                      <span style={{ color: remaining > 0 ? "#b91c1c" : "#16a34a", fontWeight: 600 }}>Remaining: ₹{remaining}</span>
                    </div>
                  </div>
                </div>
                <div className={styles.cardActions}>
                  <select
                    value={apt.status === "completed" ? "completed" : "confirmed"}
                    onChange={(e) => updateStatus(apt._id, e.target.value)}
                    className={styles.statusSelect}
                  >
                    <option value="confirmed">Confirmed</option>
                    <option value="completed">Completed</option>
                  </select>
                  <button
                    className={styles.addCashBtn}
                    onClick={() => addCashPayment(apt._id)}
                  >
                    Add Cash
                  </button>
                  {(apt.status === "confirmed" || apt.status === "completed") && (
                    <div style={{ marginTop: 10, width: "100%" }}>
                      <div style={{ fontSize: 11, color: "#64748b", marginBottom: 6 }}>
                        Started: {formatTrackTime(apt.serviceStartedAt)}
                        <br />
                        Ended: {formatTrackTime(apt.serviceEndedAt)}
                      </div>
                      {apt.status === "confirmed" && !apt.serviceStartedAt && (
                        <button
                          type="button"
                          className={styles.addCashBtn}
                          style={{ backgroundColor: "#2563eb", width: "100%" }}
                          onClick={() => sendServiceTracking(apt._id, "start_service")}
                        >
                          Start service
                        </button>
                      )}
                      {apt.status === "confirmed" && apt.serviceStartedAt && !apt.serviceEndedAt && (
                        <button
                          type="button"
                          className={styles.addCashBtn}
                          style={{ backgroundColor: "#7c3aed", width: "100%", marginTop: 6 }}
                          onClick={() => sendServiceTracking(apt._id, "end_service")}
                        >
                          End service
                        </button>
                      )}
                    </div>
                  )}
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

