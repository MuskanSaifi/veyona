"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { FaMapMarkerAlt, FaUser, FaCalendarAlt, FaClock, FaRupeeSign, FaStickyNote, FaDownload } from "react-icons/fa";
import styles from "./dashboard.module.css";

const DEFAULT_SERVICE_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Crect fill='%23e5e7eb' width='80' height='80'/%3E%3Ctext fill='%239ca3af' font-family='sans-serif' font-size='10' x='50%25' y='50%25' text-anchor='middle' dy='.3em'%3ENo Image%3C/text%3E%3C/svg%3E";

function getAppointmentServiceItems(apt) {
  const list =
    Array.isArray(apt?.services) && apt.services.length > 0
      ? apt.services
          .map((x) => ({
            name: x?.name || x?.service?.name || "Service",
            image: x?.service?.image || DEFAULT_SERVICE_IMAGE,
            qty: Math.max(1, Number(x?.quantity) || 1),
          }))
          .filter(Boolean)
      : [
          {
            name: apt?.service?.name || "Service",
            image: apt?.service?.image || DEFAULT_SERVICE_IMAGE,
            qty: Math.max(1, Number(apt?.quantity) || 1),
          },
        ];

  return list.length ? list : [];
}

function getLocation(salon) {
  if (!salon) return null;
  const parts = [salon.address, salon.city, salon.state, salon.pincode].filter(Boolean);
  return parts.length ? parts.join(", ") : null;
}

function getDentalClinicAddress(service) {
  if (!service) return null;
  if (service.clinicAddress) return service.clinicAddress;
  const clinic = service.clinic;
  if (!clinic) return null;
  const parts = [clinic.address, clinic.city, clinic.state, clinic.pincode].filter(Boolean);
  return parts.length ? parts.join(", ") : null;
}

export default function UserDashboard() {
  const router = useRouter();
  const [appointments, setAppointments] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [razorpayReady, setRazorpayReady] = useState(false);
  const [sortOrder, setSortOrder] = useState("desc"); // "desc" = newest first

  useEffect(() => {
    fetchUser();
    fetchAppointments();
  }, []);

  // Load Razorpay checkout script once
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.Razorpay) {
      setRazorpayReady(true);
      return;
    }
    const existing = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
    if (existing) {
      existing.addEventListener("load", () => setRazorpayReady(true));
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => setRazorpayReady(true);
    script.onerror = () => {
      toast.error("Could not load payment gateway");
      setRazorpayReady(false);
    };
    document.body.appendChild(script);
  }, []);

  const fetchUser = async () => {
    try {
      const res = await fetch("/api/user/me");
      if (res.status === 401) {
        router.push("/user/login");
        return;
      }
      const data = await res.json();
      setUser(data.user);
    } catch (error) {
      console.error("Error fetching user:", error);
      router.push("/user/login");
    }
  };

  const fetchAppointments = async () => {
    try {
      const res = await fetch("/api/user/appointments");
      if (res.status === 401) {
        router.push("/user/login");
        return;
      }
      const data = await res.json();
      setAppointments(data);
    } catch (error) {
      console.error("Error fetching appointments:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePayNow = async (apt) => {
    if (!razorpayReady) {
      toast.error("Payment gateway is still loading, please try again");
      return;
    }
    try {
      const res = await fetch("/api/payments/razorpay/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appointmentId: apt._id, mode: "remaining" }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || "Could not start payment");
        return;
      }

      const options = {
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        name: "Veyona Salon & Clinic",
        description: "Pay remaining amount",
        order_id: data.orderId,
        prefill: {
          name: apt.customer?.name || user?.name || "",
          email: apt.customer?.email || "",
          contact: apt.customer?.phone || user?.phone || "",
        },
        notes: {
          appointmentId: apt._id,
        },
        handler: async (response) => {
          try {
            const verifyRes = await fetch("/api/payments/razorpay/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                appointmentId: apt._id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });
            const verifyData = await verifyRes.json();
            if (!verifyRes.ok) {
              toast.error(verifyData.message || "Payment verification failed");
              return;
            }
            toast.success("Payment successful!");
            fetchAppointments();
            const amountRupees = Number(data.amount || 0) / 100;
            router.push(`/payment-success?amount=${encodeURIComponent(amountRupees.toFixed(2))}`);
          } catch (e) {
            toast.error("Payment verification failed");
          }
        },
        modal: {
          ondismiss: () => {
            toast("Payment not completed.");
          },
        },
        theme: {
          color: "#AD6E5E",
        },
      };


      // eslint-disable-next-line no-undef
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      toast.error("Could not start payment");
    }
  };

  const logout = async () => {
    try {
      await fetch("/api/user/logout");
      toast.success("Logged out successfully");
      router.push("/user/login");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "#f59e0b";
      case "confirmed":
        return "#10b981";
      case "completed":
        return "var(--accent-terracotta)";
      case "cancelled":
        return "#ef4444";
      case "expired":
        return "#6b7280";
      default:
        return "#6b7280";
    }
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

  const handleCancel = async (apt) => {
    if (
      !confirm(
        "Cancel this appointment?\nIf online payment was made, refund will be processed within 24 hours."
      )
    )
      return;
    try {
      const res = await fetch(`/api/user/appointments/${apt._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.message || "Could not cancel appointment");
        return;
      }
      if (data?.refund?.required) {
        toast.success("Appointment cancelled. Refund will be processed within 24 hours.");
      } else {
        toast.success("Appointment cancelled.");
      }
      fetchAppointments();
    } catch (error) {
      toast.error("Could not cancel appointment");
    }
  };

  const handleDownloadInvoice = (appointmentId) => {
    window.open(`/api/user/invoice/${appointmentId}`, "_blank");
  };

  const isUpcoming = (apt) => {
    const d = new Date(apt.date);
    const [h = 0, m = 0] = String(apt.time || "").split(":").map(Number);
    d.setHours(h, m, 0, 0);
    const now = new Date();
    return d.getTime() >= now.getTime();
  };

  const visibleAppointments = appointments.filter((apt) => {
    const status = getDerivedStatus(apt);
    // Show upcoming bookings even if admin/employee already marked them "completed".
    // (Otherwise user sees "no appointments" despite having a paid booking.)
    return ["pending", "confirmed", "completed"].includes(status) && isUpcoming(apt);
  });

  const pastAppointments = appointments.filter((apt) => {
    const status = getDerivedStatus(apt);
    return status === "cancelled" || status === "expired" || !isUpcoming(apt);
  });

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <p>Loading your appointments...</p>
        </div>
      </div>
    );
  }

  const sortedAppointments = [...visibleAppointments].sort((a, b) => {
    const da = new Date(a.date);
    const db = new Date(b.date);
    const [aH = 0, aM = 0] = (a.time || "").split(":").map(Number);
    const [bH = 0, bM = 0] = (b.time || "").split(":").map(Number);
    const aTime = da.getTime() + aH * 60 * 60 * 1000 + aM * 60 * 1000;
    const bTime = db.getTime() + bH * 60 * 60 * 1000 + bM * 60 * 1000;
    return sortOrder === "desc" ? bTime - aTime : aTime - bTime;
  });

  const sortedPastAppointments = [...pastAppointments].sort((a, b) => {
    const da = new Date(a.date);
    const db = new Date(b.date);
    const [aH = 0, aM = 0] = (a.time || "").split(":").map(Number);
    const [bH = 0, bM = 0] = (b.time || "").split(":").map(Number);
    const aTime = da.getTime() + aH * 60 * 60 * 1000 + aM * 60 * 1000;
    const bTime = db.getTime() + bH * 60 * 60 * 1000 + bM * 60 * 1000;
    return sortOrder === "desc" ? bTime - aTime : aTime - bTime;
  });

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>My Dashboard</h1>
          {user && (
            <div className={styles.userInfo}>
              {user.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.avatar} alt={user.name || "User"} className={styles.userAvatar} />
              ) : (
                <div className={styles.userAvatarFallback}>
                  <FaUser className={styles.userIcon} />
                </div>
              )}
              <div>
                <div className={styles.userName}>{user.name || "User"}</div>
                <div className={styles.userMeta}>{user.phone}</div>
              </div>
            </div>
          )}
        </div>
        <button className={styles.logoutBtn} onClick={logout}>
          Logout
        </button>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>My Appointments</h2>

        {visibleAppointments.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>📅</div>
            <p className={styles.emptyText}>No upcoming appointments</p>
            <p className={styles.emptySubtext}>Book your next appointment and it will appear here.</p>
            <button onClick={() => router.push("/")} className={styles.bookButton}>
              Book an Appointment
            </button>
          </div>
        ) : (
          <>
            <div className={styles.sortRow}>
              <span className={styles.sortLabel}>Sort by date</span>
              <select
                className={styles.sortSelect}
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
              >
                <option value="desc">Newest first</option>
                <option value="asc">Oldest first</option>
              </select>
            </div>

            {/* Desktop table */}
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th className={styles.th}>Service</th>
                    <th className={styles.th}>Date</th>
                    <th className={styles.th}>Time</th>
                    <th className={styles.th}>Location</th>
                    <th className={styles.th}>Payment</th>
                    <th className={styles.th}>Appointment Status</th>
                    <th className={styles.th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedAppointments.map((apt) => {
                    const location = getLocation(apt.salon);
                    const dentalClinicAddress = getDentalClinicAddress(apt.service);
                    const serviceItems = getAppointmentServiceItems(apt);
                    const subtotal = apt.pricing?.subtotal ?? apt.totalPrice ?? apt.service?.price ?? 0;
                    const discount = apt.pricing?.discountAmount ?? 0;
                    const total = apt.pricing?.totalPayable ?? subtotal - discount;
                    const paidOnline = apt.payment?.paidOnline ?? 0;
                    const paidCash = apt.payment?.paidCash ?? 0;
                    const paid = paidOnline + paidCash;
                    const remaining = Math.max(0, total - paid);
                    const status = getDerivedStatus(apt);
                    return (
                      <tr key={apt._id}>
                        <td className={styles.td}>
                          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                              {serviceItems.slice(0, 2).map((s, idx) => (
                                <div key={`${apt._id}-svc-${idx}`} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                  <img
                                    src={s.image || DEFAULT_SERVICE_IMAGE}
                                    alt=""
                                    style={{ width: 40, height: 40, borderRadius: 10, objectFit: "cover", flexShrink: 0 }}
                                  />
                                  <div style={{ minWidth: 0 }}>
                                    <div style={{ fontWeight: 800, lineHeight: 1.2 }}>
                                      {s.name}
                                    </div>
                                    <div style={{ marginTop: 4 }}>
                                      <span
                                        style={{
                                          fontSize: 12,
                                          fontWeight: 900,
                                          background: "#eff6ff",
                                          color: "#1d4ed8",
                                          border: "1px solid #bfdbfe",
                                          padding: "2px 8px",
                                          borderRadius: 999,
                                        }}
                                      >
                                        Qty: {s.qty}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                              {serviceItems.length > 2 && (
                                <div style={{ fontSize: 12, color: "#6b7280", fontWeight: 700 }}>
                                  +{serviceItems.length - 2} more
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className={styles.td}>
                          {new Date(apt.date).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                        <td className={styles.td}>{apt.time}</td>
                        <td className={styles.td}>
                          {dentalClinicAddress
                            ? dentalClinicAddress
                            : apt.service?.isVideoConsultation
                            ? "Video Consultation"
                            : (apt.location || location || "—")}
                        </td>
                        <td className={styles.td}>
                          <div style={{ fontSize: 12, lineHeight: 1.7, textAlign: "left" }}>
                            <div><strong>Booking amount:</strong> ₹{subtotal}</div>
                            {discount > 0 && (
                              <div style={{ color: "#059669", fontWeight: 600 }}>
                                Coupon {apt.pricing?.couponCode ? `(${apt.pricing.couponCode})` : ""}: -₹{discount}
                              </div>
                            )}
                            <div style={{ marginTop: 2 }}><strong>Total to pay:</strong> ₹{total}</div>
                            <div style={{ marginTop: 4 }}>
                              <span style={{ color: "#16a34a" }}>Paid online:</span> ₹{paidOnline}
                            </div>
                            <div>
                              <span style={{ color: "#16a34a" }}>Paid in cash:</span> ₹{paidCash}
                            </div>
                            <div style={{ marginTop: 2, color: remaining > 0 ? "#b91c1c" : "#16a34a", fontWeight: 600 }}>
                              Remaining due: ₹{remaining}
                            </div>
                          </div>
                        </td>
                        <td className={styles.td}>
                          <span
                            className={styles.status}
                            style={{
                              background: getStatusColor(status) + "22",
                              color: getStatusColor(status),
                            }}
                          >
                            {status.toUpperCase()}
                          </span>
                        </td>
                        <td className={styles.td}>
                          <div className={styles.tableActions}>
                            {(paidOnline + paidCash) > 0 && (
                              <button
                                type="button"
                                className={styles.payNowTableBtn}
                                style={{ background: "#2563eb" }}
                                onClick={() => handleDownloadInvoice(apt._id)}
                                title="Download invoice"
                              >
                                <FaDownload style={{ marginRight: 6 }} />
                                Invoice
                              </button>
                            )}
                            {remaining > 0 && status !== "cancelled" && status !== "expired" && (
                              <button
                                type="button"
                                className={styles.payNowTableBtn}
                                onClick={() => handlePayNow(apt)}
                              >
                                Pay Now
                              </button>
                            )}
                            {status !== "cancelled" && status !== "expired" && (
                              <button
                                type="button"
                                className={styles.payNowTableBtn}
                                style={{ background: "#ef4444" }}
                                onClick={() => handleCancel(apt)}
                              >
                                Cancel
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile / tablet cards */}
            <div className={styles.grid}>
            {sortedAppointments.map((apt) => {
              const location = getLocation(apt.salon);
              const dentalClinicAddress = getDentalClinicAddress(apt.service);
              const serviceItems = getAppointmentServiceItems(apt);
              const status = getDerivedStatus(apt);
              return (
                <div key={apt._id} className={styles.card}>
                  <div className={styles.cardHeader}>
                    <div className={styles.cardHeaderLeft}>
                      <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                        <img
                          src={serviceItems?.[0]?.image || apt.service?.image || DEFAULT_SERVICE_IMAGE}
                          alt=""
                          style={{
                            width: 56,
                            height: 56,
                            objectFit: "cover",
                            borderRadius: 12,
                            flexShrink: 0,
                          }}
                        />
                        <div>
                          <h3 className={styles.serviceName}>
                            {serviceItems.length > 1 ? "Selected Services" : (serviceItems?.[0]?.name || apt.service?.name || "N/A")}
                          </h3>
                          {serviceItems.length > 0 && (
                            <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 6 }}>
                              {serviceItems.slice(0, 3).map((s, idx) => (
                                <div key={`${apt._id}-m-s-${idx}`} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                  <img
                                    src={s.image || DEFAULT_SERVICE_IMAGE}
                                    alt=""
                                    style={{ width: 34, height: 34, borderRadius: 10, objectFit: "cover", flexShrink: 0 }}
                                  />
                                  <div style={{ minWidth: 0, flex: 1 }}>
                                    <div style={{ fontSize: 13, fontWeight: 800, color: "#0f172a", lineHeight: 1.2 }}>
                                      {s.name}
                                    </div>
                                  </div>
                                  <span
                                    style={{
                                      fontSize: 12,
                                      fontWeight: 900,
                                      background: "#eff6ff",
                                      color: "#1d4ed8",
                                      border: "1px solid #bfdbfe",
                                      padding: "2px 8px",
                                      borderRadius: 999,
                                      flexShrink: 0,
                                    }}
                                  >
                                    Qty {s.qty}
                                  </span>
                                </div>
                              ))}
                              {serviceItems.length > 3 && (
                                <div style={{ fontSize: 12, color: "#6b7280", fontWeight: 700 }}>
                                  +{serviceItems.length - 3} more
                                </div>
                              )}
                            </div>
                          )}
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
                            {apt.service?.isVideoConsultation ? "Video Consultation" : "Home Service"}
                          </span>
                        </div>
                      </div>
                      <div className={styles.location}>
                        <FaMapMarkerAlt className={styles.locationIcon} />
                        <span>
                          {dentalClinicAddress
                            ? dentalClinicAddress
                            : apt.service?.isVideoConsultation
                            ? "Video Consultation"
                            : (apt.location || location || "—")}
                        </span>
                      </div>
                    </div>
                    <span
                      className={styles.status}
                      style={{
                        background: getStatusColor(status) + "22",
                        color: getStatusColor(status),
                      }}
                    >
                      {status.toUpperCase()}
                    </span>
                  </div>

                  <div className={styles.details}>
                    {/* <div className={styles.detailRow}>
                      <FaUser className={styles.detailIcon} />
                      <span className={styles.label}>Employee</span>
                      <span className={styles.value}>{apt.employee?.name || "N/A"}</span>
                    </div> */}
                    <div className={styles.detailRow}>
                      <FaCalendarAlt className={styles.detailIcon} />
                      <span className={styles.label}>Date</span>
                      <span className={styles.value}>
                        {new Date(apt.date).toLocaleDateString("en-IN", {
                          weekday: "short",
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                    <div className={styles.detailRow}>
                      <FaClock className={styles.detailIcon} />
                      <span className={styles.label}>Time</span>
                      <span className={styles.value}>{apt.time}</span>
                    </div>
                    <div className={styles.detailRow}>
                      <FaRupeeSign className={styles.detailIcon} />
                      <span className={styles.label}>Payment</span>
                      <div className={styles.valuePrice} style={{ display: "flex", flexDirection: "column", gap: 3, alignItems: "flex-start" }}>
                        {(() => {
                          const subtotal = apt.pricing?.subtotal ?? apt.totalPrice ?? apt.service?.price ?? 0;
                          const discount = apt.pricing?.discountAmount ?? 0;
                          const total = apt.pricing?.totalPayable ?? subtotal - discount;
                          const paidOnline = apt.payment?.paidOnline ?? 0;
                          const paidCash = apt.payment?.paidCash ?? 0;
                          const paid = paidOnline + paidCash;
                          const remaining = Math.max(0, total - paid);
                          const paymentStatus = (apt.payment?.status || "unpaid").toUpperCase();
                          return (
                            <>
                              <span style={{ fontSize: 13 }}><strong>Booking:</strong> ₹{subtotal}</span>
                              {discount > 0 && (
                                <span style={{ fontSize: 12, color: "#059669", fontWeight: 600 }}>
                                  Coupon {apt.pricing?.couponCode ? `(${apt.pricing.couponCode})` : ""}: -₹{discount}
                                </span>
                              )}
                              <span style={{ fontSize: 13 }}><strong>Total to pay:</strong> ₹{total}</span>
                              <span style={{ fontSize: 13, color: "#16a34a" }}>Paid online: ₹{paidOnline}</span>
                              <span style={{ fontSize: 13, color: "#16a34a" }}>Paid in cash: ₹{paidCash}</span>
                              <span
                                style={{
                                  fontSize: 13,
                                  color: remaining > 0 ? "#b91c1c" : "#16a34a",
                                  fontWeight: 600,
                                }}
                              >
                                Remaining due: ₹{remaining}
                              </span>
                              <span style={{ fontSize: 11, color: "#4b5563" }}>Payment status: {paymentStatus}</span>
                              {(paidOnline + paidCash) > 0 && (
                                <button
                                  type="button"
                                  onClick={() => handleDownloadInvoice(apt._id)}
                                  style={{
                                    marginTop: 6,
                                    padding: "8px 14px",
                                    borderRadius: 999,
                                    border: "none",
                                    background: "#2563eb",
                                    color: "white",
                                    fontSize: 13,
                                    fontWeight: 600,
                                    cursor: "pointer",
                                  }}
                                >
                                  Download Invoice
                                </button>
                              )}
                              {remaining > 0 && status !== "cancelled" && status !== "expired" && (
                                <button
                                  type="button"
                                  onClick={() => handlePayNow(apt)}
                                  style={{
                                    marginTop: 6,
                                    padding: "8px 14px",
                                    borderRadius: 999,
                                    border: "none",
                                    background: "#10b981",
                                    color: "white",
                                    fontSize: 13,
                                    fontWeight: 600,
                                    cursor: "pointer",
                                  }}
                                >
                                  Pay Now
                                </button>
                              )}
                              {status !== "cancelled" && status !== "expired" && (
                                <button
                                  type="button"
                                  onClick={() => handleCancel(apt)}
                                  style={{
                                    marginTop: 6,
                                    padding: "8px 14px",
                                    borderRadius: 999,
                                    border: "none",
                                    background: "#ef4444",
                                    color: "white",
                                    fontSize: 13,
                                    fontWeight: 600,
                                    cursor: "pointer",
                                  }}
                                >
                                  Cancel
                                </button>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    </div>
                    {apt.notes && (
                      <div className={styles.notes}>
                        <FaStickyNote className={styles.detailIcon} />
                        <div>
                          <span className={styles.label}>Notes</span>
                          <p className={styles.notesText}>{apt.notes}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          </>
        )}

        {sortedPastAppointments.length > 0 && (
          <div className={styles.pastSection}>
            <h2 className={styles.sectionTitle}>Past / cancelled appointments</h2>
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th className={styles.th}>Service</th>
                    <th className={styles.th}>Date</th>
                    <th className={styles.th}>Time</th>
                    <th className={styles.th}>Status</th>
                    <th className={styles.th}>Refund</th>
                    <th className={styles.th}>Invoice</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedPastAppointments.map((apt) => {
                    const status = getDerivedStatus(apt);
                    const paidOnline = apt.payment?.paidOnline ?? 0;
                    const paidCash = apt.payment?.paidCash ?? 0;
                    return (
                      <tr key={apt._id}>
                        <td className={styles.td}>{apt.service?.name || "N/A"}</td>
                        <td className={styles.td}>
                          {new Date(apt.date).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                        <td className={styles.td}>{apt.time}</td>
                        <td className={styles.td}>
                          <span
                            className={styles.status}
                            style={{
                              background: getStatusColor(status) + "22",
                              color: getStatusColor(status),
                            }}
                          >
                            {status.toUpperCase()}
                          </span>
                        </td>
                        <td className={styles.td}>
                          {status === "cancelled" ? (
                            <div style={{ fontSize: 12, lineHeight: 1.6 }}>
                              <div style={{ color: "#4b5563" }}>
                                {apt.cancellation?.cancelledBy === "user"
                                  ? "Cancelled by you"
                                  : "Cancelled"}
                              </div>
                              {apt.refund?.status === "pending" && (
                                <div style={{ color: "#92400e", fontWeight: 600 }}>
                                  Refund Pending (24 hrs)
                                </div>
                              )}
                              {apt.refund?.status === "processed" && (
                                <div style={{ color: "#166534", fontWeight: 600 }}>
                                  Refund Processed
                                </div>
                              )}
                              {apt.refund?.status === "not_required" && (
                                <div style={{ color: "#4b5563" }}>No refund required</div>
                              )}
                            </div>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className={styles.td}>
                          {(paidOnline + paidCash) > 0 ? (
                            <button
                              type="button"
                              className={styles.payNowTableBtn}
                              style={{ background: "#2563eb" }}
                              onClick={() => handleDownloadInvoice(apt._id)}
                            >
                              <FaDownload style={{ marginRight: 6 }} />
                              Invoice
                            </button>
                          ) : (
                            "—"
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

