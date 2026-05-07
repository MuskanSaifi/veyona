"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import toast from "react-hot-toast";
import { setBookingServices } from "@/lib/bookingCartSlice";
import LocationPickerModal from "@/app/components/LocationPickerModal";
import styles from "./book.module.css";

function formatTimeSlot12h(time24) {
  const [hStr, mStr] = (time24 || "").split(":");
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  if (Number.isNaN(h) || Number.isNaN(m)) return time24 || "";
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${String(hour12).padStart(2, "0")}:${String(m).padStart(2, "0")} ${period}`;
}

function BookPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const dispatch = useDispatch();
  const serviceId = searchParams.get("service");
  const servicesParam = searchParams.get("services"); // comma-separated for multi-service bookings
  const quantityParam = searchParams.get("quantity"); // for single-service flow
  const serviceQuantitiesParam = searchParams.get("serviceQuantities"); // id:qty,id:qty for multi-service

  const [service, setService] = useState(null); // primary service (first)
  const [servicesList, setServicesList] = useState([]); // all selected services
  const [employees, setEmployees] = useState([]);
  const [timeSlots, setTimeSlots] = useState([]);
  const [serviceQty, setServiceQty] = useState({}); // { [serviceId]: number }
  const [formData, setFormData] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    employee: "",
    date: "",
    time: "",
    notes: "",
    // Address fields (for in-person services)
    location: "", // full formatted address string sent to backend
    addressLine1: "", // house / building / street
    landmark: "",
    city: "",
    state: "",
    pincode: "",
  });
  const [loading, setLoading] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [paymentPlan, setPaymentPlan] = useState("half"); // "half" | "full" | "book_now_pay_later"
  const [couponInput, setCouponInput] = useState("");
  const [couponApplied, setCouponApplied] = useState(null); // { code, discountAmount, totalAfterDiscount }
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [user, setUser] = useState(null);
  const [razorpayReady, setRazorpayReady] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);

  const recomputeLocation = (dataOverride = {}) => {
    const data = { ...formData, ...dataOverride };
    const parts = [
      data.addressLine1,
      data.landmark,
      data.city,
      data.state,
    ].filter((x) => x && x.trim());
    const pin = (data.pincode || "").trim();
    const full = parts.length
      ? parts.join(", ") + (pin ? ` - ${pin}` : "")
      : pin || "";
    setFormData((prev) => ({ ...prev, ...dataOverride, location: full }));
  };

  const applyMapSelection = ({ location, parts }) => {
    const safe = parts || {};
    recomputeLocation({
      addressLine1: safe.addressLine1 || location || "",
      landmark: safe.landmark || "",
      city: safe.city || "",
      state: safe.state || "",
      pincode: (safe.pincode || "").replace(/\D/g, "").slice(0, 6),
    });
  };

  useEffect(() => {
    if (serviceId || servicesParam) {
      fetchServicesForBooking();
    }
    fetchUser();
  }, [serviceId, servicesParam]);

  // Sync booking services to Redux for real-time header count
  useEffect(() => {
    const ids = servicesParam
      ? servicesParam.split(",").map((id) => id.trim()).filter(Boolean)
      : serviceId
      ? [serviceId]
      : [];
    if (ids.length > 0) dispatch(setBookingServices(ids));
  }, [serviceId, servicesParam, dispatch]);

  // Load Razorpay checkout script
  useEffect(() => {
    if (paymentPlan === "book_now_pay_later") return;
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
  }, [paymentPlan]);

  const getQtyForService = (id) => {
    const raw = Number(serviceQty?.[id]);
    const q = Number.isFinite(raw) ? Math.floor(raw) : 1;
    return Math.max(1, Math.min(20, q));
  };

  const baseSubtotal = (servicesList || []).reduce(
    (sum, s) => sum + (Number(s.price) || 0) * getQtyForService(s._id),
    0
  );
  const subtotal = baseSubtotal;
  const discountAmount = Number(couponApplied?.discountAmount || 0);
  const totalPayable = Math.max(0, subtotal - discountAmount);
  const isDentalService = service?.category?.type === "dentist";
  const clinicAddress =
    service?.clinicAddress ||
    [service?.clinic?.address, service?.clinic?.city, service?.clinic?.state, service?.clinic?.pincode]
      .filter(Boolean)
      .join(", ");

  const applyCoupon = async () => {
    const code = (couponInput || "").trim().toUpperCase();
    if (!code) {
      toast.error("Enter coupon code");
      return;
    }
    if (!subtotal) {
      toast.error("Subtotal is invalid");
      return;
    }
    setApplyingCoupon(true);
    try {
      const res = await fetch("/api/coupon/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, subtotal }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || "Coupon not applicable");
        return;
      }
      setCouponApplied({
        code: data.code,
        discountAmount: data.discountAmount,
        totalAfterDiscount: data.totalAfterDiscount,
      });
      toast.success("Coupon applied");
    } catch (e) {
      toast.error("Could not apply coupon");
    } finally {
      setApplyingCoupon(false);
    }
  };

  // If user changes quantities after applying coupon, totals change — reset coupon
  useEffect(() => {
    if (couponApplied) setCouponApplied(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(serviceQty)]);

  const fetchUser = async () => {
    try {
      const res = await fetch("/api/user/me");
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        // Pre-fill form with user data and default saved address
        if (data.user) {
          const saved = data.user.savedAddresses || [];
          const defaultIdx = Math.min(data.user.defaultAddressIndex ?? 0, Math.max(0, saved.length - 1));
          const defaultAddress = saved[defaultIdx]?.address || data.user.address || "";
          setFormData((prev) => ({
            ...prev,
            customerName: data.user.name || "",
            customerEmail: data.user.email || "",
            customerPhone: data.user.phone || "",
            addressLine1: defaultAddress || "",
            landmark: "",
            city: "",
            state: "",
            pincode: "",
            location: defaultAddress || "",
          }));
        }
      }
    } catch (error) {
      // User not logged in, that's okay
    }
  };

  useEffect(() => {
    if (service) {
      fetchEmployees();
    } else {
      setEmployees([]);
    }
  }, [service]);

  useEffect(() => {
    if (formData.employee && formData.date) {
      fetchTimeSlots();
    } else {
      setTimeSlots([]);
    }
  }, [formData.employee, formData.date, JSON.stringify(serviceQty)]);

  const fetchServicesForBooking = async () => {
    try {
      const ids = (servicesParam
        ? servicesParam.split(",").filter(Boolean)
        : (serviceId ? [serviceId] : [])
      );
      if (!ids.length) return;

      const parsedQty = (() => {
        const map = {};
        if (serviceQuantitiesParam) {
          const pairs = String(serviceQuantitiesParam).split(",").map((x) => x.trim()).filter(Boolean);
          for (const p of pairs) {
            const [id, qtyStr] = p.split(":");
            const q = Math.floor(Number(qtyStr));
            if (id && Number.isFinite(q)) map[id] = Math.max(1, Math.min(20, q));
          }
        } else if (serviceId && quantityParam) {
          const q = Math.floor(Number(quantityParam));
          if (Number.isFinite(q)) map[serviceId] = Math.max(1, Math.min(20, q));
        }
        return map;
      })();

      const results = await Promise.all(
        ids.map((id) =>
          fetch(`/api/service/${id}`)
            .then((r) => (r.ok ? r.json() : null))
            .catch(() => null)
        )
      );
      const validServices = results.filter(Boolean);
      if (!validServices.length) {
        toast.error("Selected services could not be loaded");
        return;
      }
      setServicesList(validServices);
      setService(validServices[0]);
      setServiceQty((prev) => {
        const next = { ...(prev || {}) };
        for (const s of validServices) {
          if (s?._id) {
            const fromUrl = parsedQty?.[s._id];
            if (fromUrl != null) next[s._id] = fromUrl;
            else if (next[s._id] == null) next[s._id] = 1;
          }
        }
        // remove qty entries for services no longer selected
        for (const k of Object.keys(next)) {
          if (!validServices.some((s) => s?._id?.toString?.() === k?.toString?.())) {
            delete next[k];
          }
        }
        return next;
      });
    } catch (error) {
      toast.error("Error loading services");
      console.error(error);
    }
  };

  const fetchEmployees = async () => {
    const primaryServiceId = service?._id || serviceId;
    if (!primaryServiceId) return;
    try {
      const res = await fetch(`/api/employee?serviceId=${primaryServiceId}`);
      const data = await res.json();
      const availableEmployees = (data || []).filter((emp) => emp.active);
      setEmployees(availableEmployees);
      if (availableEmployees.length > 0) {
        setFormData((prev) => ({ ...prev, employee: availableEmployees[0]._id }));
      }
    } catch (error) {
      console.error("Error fetching employees:", error);
    }
  };

  const fetchTimeSlots = async () => {
    setLoadingSlots(true);
    try {
      const ids =
        servicesList.length > 0
          ? servicesList.map((s) => s._id)
          : (servicesParam
              ? servicesParam.split(",").map((id) => id.trim()).filter(Boolean)
              : (serviceId ? [serviceId] : []));
      const params = new URLSearchParams({
        employeeId: formData.employee,
        date: formData.date,
      });
      if (ids.length === 1) {
        params.append("serviceId", ids[0]);
        params.append("quantity", String(getQtyForService(ids[0])));
      } else if (ids.length > 1) {
        params.append("serviceIds", ids.join(","));
        const pairs = ids
          .map((id) => `${id}:${getQtyForService(id)}`)
          .join(",");
        params.append("serviceQuantities", pairs);
      }

      const res = await fetch(
        `/api/appointment/available-slots?${params.toString()}`
      );
      const data = await res.json();
      const slots = data.slots || [];
      setTimeSlots(slots);
      setFormData((prev) =>
        prev.time && !slots.some((s) => s.time === prev.time)
          ? { ...prev, time: "" }
          : prev
      );
    } catch (error) {
      console.error("Error fetching time slots:", error);
      toast.error("Error loading available time slots");
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.customerName || !formData.customerEmail || !formData.customerPhone || !formData.employee || !formData.date || !formData.time) {
      toast.error("Please fill all required fields");
      return;
    }

    // For non-dental in-person services, structured user address is required
    if (!service?.isVideoConsultation && !isDentalService) {
      const { addressLine1, city, state, pincode } = formData;
      if (!addressLine1?.trim() || !city?.trim() || !state?.trim() || !pincode?.trim()) {
        toast.error("Please fill complete address (building, city, state and pincode)");
        return;
      }
      const pin = (pincode || "").trim();
      if (!/^\d{6}$/.test(pin)) {
        toast.error("Please enter a valid 6-digit pincode");
        return;
      }
      if (!formData.location?.trim()) {
        toast.error("Please check your address once");
        return;
      }
    }
    if (isDentalService && !clinicAddress) {
      toast.error("Clinic address is not configured for this dental service");
      return;
    }

    const selectedEmp = employees.find((e) => e._id === formData.employee || e._id?.toString() === formData.employee);
    const salonId = selectedEmp?.salon?._id || selectedEmp?.salon;
    if (!salonId) {
      toast.error("Could not determine salon for selected employee");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/appointment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          salon: salonId,
          service: service?._id || serviceId,
          services: servicesList.length > 0
            ? servicesList.map((s) => ({
                service: s._id,
                quantity: getQtyForService(s._id),
              }))
            : undefined,
          quantity: servicesList.length === 1
            ? getQtyForService(servicesList[0]?._id || (service?._id || serviceId))
            : 1,
          location: isDentalService ? clinicAddress : (service?.isVideoConsultation ? undefined : formData.location),
          couponCode: couponApplied?.code || undefined,
          paymentPlan,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || "Error booking appointment");
        return;
      }

      // Book now, pay later (no online payment)
      if (paymentPlan === "book_now_pay_later" || paymentPlan === "pay_at_salon") {
        toast.success("Appointment booked. Pay later.");
        dispatch(setBookingServices([]));
        router.push(`/payment-success?mode=${paymentPlan}`);
        return;
      }

      if (!razorpayReady) {
        toast.error("Payment gateway is still loading, please try again");
        return;
      }

      // Create Razorpay order for onlineDue (50% or 100%)
      const orderRes = await fetch("/api/payments/razorpay/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appointmentId: data._id }),
      });
      const orderData = await orderRes.json();
      if (!orderRes.ok) {
        toast.error(orderData.message || "Could not start payment");
        return;
      }

      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Veyona Salon & Clinic",
        description: paymentPlan === "full" ? "Full payment" : "50% advance payment",
        order_id: orderData.orderId,
        prefill: {
          name: orderData.customer?.name || formData.customerName,
          email: orderData.customer?.email || formData.customerEmail,
          contact: orderData.customer?.phone || formData.customerPhone,
        },
        notes: {
          appointmentId: data._id,
        },
        handler: async (response) => {
          try {
            const verifyRes = await fetch("/api/payments/razorpay/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                appointmentId: data._id,
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
            dispatch(setBookingServices([]));
            const amountRupees = Number(orderData.amount || 0) / 100;
            router.push(`/payment-success?amount=${encodeURIComponent(amountRupees.toFixed(2))}`);
          } catch (e) {
            toast.error("Payment verification failed");
          }
        },
        modal: {
          ondismiss: () => {
            toast("Payment not completed. Booking is pending.");
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
      toast.error("Error booking appointment");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (!service) {
    return (
      <div style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>Book Appointment</h1>

        {/* Service Info */}
        <div className={styles.serviceBox}>
          <div className={styles.serviceHeader}>
            <h2 className={styles.serviceHeaderTitle}>
              {servicesList.length > 1 ? "Selected Services" : service.name}
            </h2>
            {service.isVideoConsultation && (
              <span style={{ padding: "4px 10px", background: "#dbeafe", color: "#1d4ed8", borderRadius: 6, fontSize: 12, fontWeight: 600 }}>
                Video Consultation
              </span>
            )}
          </div>
          {servicesList.length > 1 ? (
            <div className={styles.servicesList}>
              {servicesList.map((s) => (
                <div
                  key={s._id}
                  className={styles.serviceRow}
                >
                  <div className={styles.serviceLeft}>
                    <img
                      src={s.image || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Crect fill='%23e5e7eb' width='40' height='40'/%3E%3Ctext fill='%239ca3af' font-family='sans-serif' font-size='8' x='50%25' y='50%25' text-anchor='middle' dy='.3em'%3ENo Image%3C/text%3E%3C/svg%3E"}
                      alt=""
                      className={styles.serviceImg}
                    />
                    <div className={styles.serviceText}>
                      <div className={styles.serviceName}>{s.name}</div>
                      {s.duration != null && s.duration > 0 && (
                        <div className={styles.serviceMeta}>{s.duration} min</div>
                      )}
                    </div>
                  </div>
                  <div className={styles.serviceRight}>
                    <div className={styles.qtyControls}>
                      <button
                        type="button"
                        onClick={() =>
                          setServiceQty((prev) => ({
                            ...(prev || {}),
                            [s._id]: Math.max(1, getQtyForService(s._id) - 1),
                          }))
                        }
                        className={styles.qtyBtn}
                        aria-label={`Decrease quantity for ${s.name}`}
                      >
                        −
                      </button>
                      <input
                        type="number"
                        min={1}
                        max={20}
                        value={getQtyForService(s._id)}
                        onChange={(e) => {
                          const v = Math.floor(Number(e.target.value));
                          setServiceQty((prev) => ({
                            ...(prev || {}),
                            [s._id]: Number.isFinite(v) ? Math.max(1, Math.min(20, v)) : 1,
                          }));
                        }}
                        className={styles.qtyInput}
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setServiceQty((prev) => ({
                            ...(prev || {}),
                            [s._id]: Math.min(20, getQtyForService(s._id) + 1),
                          }))
                        }
                        className={styles.qtyBtn}
                        aria-label={`Increase quantity for ${s.name}`}
                      >
                        +
                      </button>
                    </div>
                  <button
                    type="button"
                    onClick={() => {
                      const updated = servicesList.filter((item) => item._id !== s._id);
                      if (!updated.length) {
                        toast.error("At least one service is required");
                        return;
                      }
                      setServicesList(updated);
                      setService(updated[0]);
                      setServiceQty((prev) => {
                        const next = { ...(prev || {}) };
                        delete next[s._id];
                        for (const keep of updated) {
                          if (keep?._id && next[keep._id] == null) next[keep._id] = 1;
                        }
                        return next;
                      });
                      setTimeSlots([]);
                      setFormData((prev) => ({ ...prev, time: "" }));
                      dispatch(setBookingServices(updated.map((x) => x._id)));
                    }}
                    className={styles.removeBtn}
                  >
                    Remove
                  </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            service.description && (
              <p style={{ color: "#6b7280", marginBottom: 15 }}>{service.description}</p>
            )
          )}
          <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
            <span style={{ fontSize: 20, fontWeight: "bold", color: "var(--accent-terracotta)" }}>
              Pre Book Now
            </span>
            {(() => {
              const priceTotal = servicesList.length > 0
                ? servicesList.reduce((sum, s) => sum + (s.price || 0) * getQtyForService(s._id), 0)
                : (service.price || 0) * getQtyForService(service?._id);
              const hasOriginal = servicesList.length === 1 && service.originalPrice != null && service.originalPrice > service.price;
              return (
                <>
                  {priceTotal > 0 && (
                    <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      {hasOriginal && (
                        <span style={{ fontSize: 18, color: "#9ca3af", textDecoration: "line-through" }}>
                          ₹{service.originalPrice}
                        </span>
                      )}
                      <span style={{ fontSize: 20, fontWeight: "bold", color: "var(--accent-terracotta)" }}>
                        ₹{priceTotal}
                      </span>
                    </span>
                  )}
                </>
              );
            })()}
            <span style={{ color: "#6b7280" }}>
              {(() => {
                const durationTotal = servicesList.length > 0
                  ? servicesList.reduce((sum, s) => sum + (s.duration || 0) * getQtyForService(s._id), 0)
                  : (service.duration || 0) * getQtyForService(service?._id);
                return `${durationTotal || 0} minutes`;
              })()}
            </span>
          </div>
          {isDentalService && (
            <div style={{ marginTop: 14, padding: 12, background: "#ecfeff", border: "1px solid #a5f3fc", borderRadius: 8 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>
                Clinic
              </div>
              <div style={{ fontSize: 14, color: "#334155" }}>
                {service?.clinic?.name || "Assigned dental clinic"}
              </div>
              <div style={{ fontSize: 13, color: "#475569", marginTop: 2 }}>
                {clinicAddress || "Clinic address not available"}
              </div>
            </div>
          )}
        </div>

        {/* Booking Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 20, padding: 12, background: user ? "#d1fae5" : "#fef3c7", borderRadius: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            {user ? (
              <span style={{ color: "#065f46", fontSize: 14 }}>
                ✓ Logged in as {user.name || user.phone}
              </span>
            ) : (
              <span style={{ color: "#92400e", fontSize: 14 }}>
                Not logged in. <a href="/user/login" style={{ color: "var(--accent-terracotta)", textDecoration: "underline", fontWeight: 600 }}>Login</a> to track your appointments.
              </span>
            )}
          </div>
          
          <h3 style={{ fontSize: 20, fontWeight: 600, marginBottom: 20 }}>Customer Information</h3>
          
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>
              Name *
            </label>
            <input
              type="text"
              value={formData.customerName}
              onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
              style={inputStyle}
              required
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>
              Email *
            </label>
            <input
              type="email"
              value={formData.customerEmail}
              onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
              style={inputStyle}
              required
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>
              Phone *
            </label>
            <input
              type="tel"
              value={formData.customerPhone}
              onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
              style={inputStyle}
              required
            />
          </div>

          {!service?.isVideoConsultation && !isDentalService && (
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>
                Address details *
              </label>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 10,
                  flexWrap: "wrap",
                  marginBottom: 10,
                }}
              >
                <div style={{ fontSize: 13, color: "#6b7280" }}>
                  Choose location from map for accurate address
                </div>
                <button
                  type="button"
                  onClick={() => setMapOpen(true)}
                  style={{
                    padding: "10px 14px",
                    borderRadius: 999,
                    border: "1px solid #bfdbfe",
                    background: "#eff6ff",
                    color: "#1d4ed8",
                    cursor: "pointer",
                    fontWeight: 800,
                  }}
                >
                  {formData.location?.trim() ? "Change on map" : "Choose on map"}
                </button>
              </div>

              {user?.savedAddresses?.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: "block", marginBottom: 6, fontSize: 14, color: "#6b7280" }}>
                    Saved addresses
                  </label>
                  <select
                    value={(() => {
                      const idx = user.savedAddresses.findIndex((a) => (a.address || "").trim() === (formData.location || "").trim());
                      return idx >= 0 ? String(idx) : "new";
                    })()}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (v === "new") {
                        recomputeLocation({
                          addressLine1: "",
                          landmark: "",
                          city: "",
                          state: "",
                          pincode: "",
                        });
                      } else {
                        const idx = parseInt(v, 10);
                        const addr = user.savedAddresses[idx]?.address || "";
                        recomputeLocation({
                          addressLine1: addr,
                          landmark: "",
                          city: "",
                          state: "",
                          pincode: "",
                        });
                      }
                    }}
                    style={{ ...inputStyle, maxWidth: 360 }}
                  >
                    {user.savedAddresses.map((a, i) => (
                      <option key={i} value={i}>
                        {a.label || `Address ${i + 1}`}
                      </option>
                    ))}
                    <option value="new">Add new address</option>
                  </select>
                </div>
              )}

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 12,
                  marginBottom: 10,
                }}
              >
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={{ display: "block", marginBottom: 6, fontSize: 14, fontWeight: 500 }}>
                    House / Building / Street *
                  </label>
                  <input
                    type="text"
                    value={formData.addressLine1}
                    onChange={(e) =>
                      recomputeLocation({
                        addressLine1: e.target.value,
                      })
                    }
                    style={inputStyle}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: 6, fontSize: 14, fontWeight: 500 }}>
                    Nearby landmark
                  </label>
                  <input
                    type="text"
                    value={formData.landmark}
                    onChange={(e) =>
                      recomputeLocation({
                        landmark: e.target.value,
                      })
                    }
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: 6, fontSize: 14, fontWeight: 500 }}>
                    City *
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) =>
                      recomputeLocation({
                        city: e.target.value,
                      })
                    }
                    style={inputStyle}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: 6, fontSize: 14, fontWeight: 500 }}>
                    State *
                  </label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) =>
                      recomputeLocation({
                        state: e.target.value,
                      })
                    }
                    style={inputStyle}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: 6, fontSize: 14, fontWeight: 500 }}>
                    Pincode *
                  </label>
                  <input
                    type="text"
                    value={formData.pincode}
                    maxLength={6}
                    inputMode="numeric"
                    onChange={(e) =>
                      recomputeLocation({
                        pincode: e.target.value.replace(/\D/g, ""),
                      })
                    }
                    style={inputStyle}
                    required
                  />
                </div>
              </div>

              <LocationPickerModal
                open={mapOpen}
                initialQuery={formData.location || formData.addressLine1 || ""}
                onClose={() => setMapOpen(false)}
                onConfirm={applyMapSelection}
              />

              {user &&
                formData.location?.trim() &&
                !user.savedAddresses?.some((a) => (a.address || "").trim() === formData.location.trim()) && (
                  <button
                    type="button"
                    onClick={async () => {
                      const addr = formData.location.trim();
                      if (!addr) return;
                      const list = [
                        ...(user.savedAddresses || []),
                        {
                          label: `Address ${(user.savedAddresses?.length || 0) + 1}`,
                          address: addr,
                        },
                      ];
                      try {
                        const res = await fetch("/api/user/me", {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            savedAddresses: list,
                            defaultAddressIndex: list.length - 1,
                          }),
                        });
                        if (res.ok) {
                          const data = await res.json();
                          setUser(data.user);
                          toast.success("Address saved for future bookings");
                        } else toast.error("Could not save address");
                      } catch (e) {
                        toast.error("Could not save address");
                      }
                    }}
                    style={{
                      marginTop: 8,
                      padding: "8px 14px",
                      fontSize: 14,
                      background: "#f3f4f6",
                      border: "1px solid #d1d5db",
                      borderRadius: 8,
                      cursor: "pointer",
                    }}
                  >
                    Save this address for future bookings
                  </button>
                )}
            </div>
          )}

          <h3 style={{ fontSize: 20, fontWeight: 600, marginTop: 30, marginBottom: 20 }}>Appointment Details</h3>

          {employees.length === 0 && (
            <p style={{ color: "#ef4444", fontSize: 14, marginBottom: 20 }}>No employees available for this service. Please ask admin to assign employees in Dashboard → Employees.</p>
          )}

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>
              Date *
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value, time: "" })}
              style={inputStyle}
              min={(() => {
                const d = new Date();
                // Allow booking from today onwards
                const y = d.getFullYear();
                const m = String(d.getMonth() + 1).padStart(2, "0");
                const day = String(d.getDate()).padStart(2, "0");
                return `${y}-${m}-${day}`;
              })()}
              required
            />
          </div>

          {formData.employee && formData.date && (
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>
                Select Time Slot *
              </label>
              {loadingSlots ? (
                <p style={{ color: "#6b7280" }}>Loading available slots...</p>
              ) : timeSlots.length === 0 ? (
                <p style={{ color: "#ef4444" }}>No available slots for this date</p>
              ) : (
                <select
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  style={inputStyle}
                  required
                >
                  <option value="">Select a time</option>
                  {timeSlots.map((slot) => (
                    <option key={slot.time} value={slot.time} disabled={!slot.available}>
                      {formatTimeSlot12h(slot.time)}
                      {!slot.available ? " (Booked)" : ""}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          <div style={{ marginBottom: 30 }}>
            <label style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>
              Notes (Optional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              style={{ ...inputStyle, minHeight: 100 }}
              rows={4}
            />
          </div>

          {/* Pricing + Coupon + Payment plan */}
          <div style={{ marginBottom: 26, background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 12, padding: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginBottom: 8 }}>
              <span style={{ color: "#374151", fontWeight: 600 }}>Subtotal</span>
              <span style={{ color: "#111827", fontWeight: 600 }}>₹{subtotal}</span>
            </div>
            {discountAmount > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginBottom: 8 }}>
                <span style={{ color: "#374151" }}>
                  Discount {couponApplied?.code ? `(${couponApplied.code})` : ""}
                </span>
                <span style={{ color: "#16a34a", fontWeight: 600 }}>-₹{discountAmount}</span>
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, paddingTop: 8, borderTop: "1px dashed #e5e7eb" }}>
              <span style={{ color: "#111827", fontWeight: 700 }}>Total</span>
              <span style={{ color: "var(--accent-terracotta)", fontWeight: 800 }}>₹{totalPayable}</span>
            </div>

            <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
              <input
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value)}
                placeholder="Coupon code"
                style={{ ...inputStyle, maxWidth: 220, padding: 10 }}
              />
              <button
                type="button"
                onClick={applyCoupon}
                disabled={applyingCoupon || !couponInput.trim()}
                style={{
                  padding: "10px 14px",
                  borderRadius: 10,
                  border: "1px solid #d1d5db",
                  background: applyingCoupon ? "#e5e7eb" : "white",
                  cursor: applyingCoupon ? "not-allowed" : "pointer",
                  fontWeight: 600,
                }}
              >
                {applyingCoupon ? "Applying..." : "Apply"}
              </button>
              {couponApplied?.code && (
                <button
                  type="button"
                  onClick={() => setCouponApplied(null)}
                  style={{
                    padding: "10px 14px",
                    borderRadius: 10,
                    border: "1px solid #fecaca",
                    background: "#fee2e2",
                    color: "#991b1b",
                    cursor: "pointer",
                    fontWeight: 700,
                  }}
                >
                  Remove coupon
                </button>
              )}
            </div>

            <div style={{ marginTop: 14 }}>
              <div style={{ fontWeight: 700, marginBottom: 8, color: "#111827" }}>Payment</div>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                  <input
                    type="radio"
                    name="paymentPlan"
                    value="half"
                    checked={paymentPlan === "half"}
                    onChange={() => setPaymentPlan("half")}
                  />
                  50% advance (₹{Math.ceil(totalPayable / 2)}) + remaining cash (₹{Math.max(0, totalPayable - Math.ceil(totalPayable / 2))})
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                  <input
                    type="radio"
                    name="paymentPlan"
                    value="full"
                    checked={paymentPlan === "full"}
                    onChange={() => setPaymentPlan("full")}
                  />
                  Full payment (₹{totalPayable})
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                  <input
                    type="radio"
                    name="paymentPlan"
                    value="book_now_pay_later"
                    checked={paymentPlan === "book_now_pay_later"}
                    onChange={() => setPaymentPlan("book_now_pay_later")}
                  />
                  Book Now, Pay Later
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                  <input
                    type="radio"
                    name="paymentPlan"
                    value="pay_at_salon"
                    checked={paymentPlan === "pay_at_salon"}
                    onChange={() => setPaymentPlan("pay_at_salon")}
                  />
                  Pay at salon (cash on visit)
                </label>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 15 }}>
            <button
              type="submit"
              disabled={loading || employees.length === 0}
              style={{
                flex: 1,
                padding: 15,
                background: loading ? "#9ca3af" : "var(--accent-terracotta)",
                color: "white",
                border: "none",
                borderRadius: 8,
                fontSize: 16,
                fontWeight: 600,
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Processing..." : paymentPlan === "book_now_pay_later" || paymentPlan === "pay_at_salon" ? "Book Appointment" : "Book & Pay"}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              style={{
                padding: "15px 30px",
                background: "#e5e7eb",
                color: "#374151",
                border: "none",
                borderRadius: 8,
                fontSize: 16,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: 12,
  border: "1px solid #d1d5db",
  borderRadius: 8,
  fontSize: 16,
  boxSizing: "border-box",
};

export default function BookPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--accent-terracotta)] mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    }>
      <BookPageContent />
    </Suspense>
  );
}
