"use client";
import { useEffect, useState, Suspense, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import { setBookingServices } from "@/lib/bookingCartSlice";
import { store } from "@/lib/store";
import LocationPickerModal from "@/app/components/LocationPickerModal";
import {
  CART_FREE_SERVICE_THRESHOLD,
  CART_SERVICE_CHARGE_AMOUNT,
  computeOrderTotals,
} from "@/lib/cartPricing";
import {
  getIndianStates,
  getStateByName,
  getCitiesForStateCode,
} from "@/lib/indiaLocations";
import styles from "./book.module.css";

const BOOK_SERVICE_PLACEHOLDER_IMG =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Crect fill='%23e5e7eb' width='120' height='120'/%3E%3Ctext fill='%239ca3af' font-family='sans-serif' font-size='11' x='50%25' y='50%25' text-anchor='middle' dy='.3em'%3ENo Image%3C/text%3E%3C/svg%3E";

function formatTimeSlot12h(time24) {
  const [hStr, mStr] = (time24 || "").split(":");
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  if (Number.isNaN(h) || Number.isNaN(m)) return time24 || "";
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${String(hour12).padStart(2, "0")}:${String(m).padStart(2, "0")} ${period}`;
}

function serviceIdStr(id) {
  if (id == null || id === "") return "";
  return String(id).trim();
}

function salonIdFromEmployee(emp) {
  if (!emp?.salon) return "";
  const s = emp.salon;
  return serviceIdStr(s._id || s);
}

function BookPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const dispatch = useDispatch();
  const bookingServiceIds = useSelector((state) => state.bookingCart.serviceIds) || [];
  const idsKey = useMemo(
    () => [...bookingServiceIds].map((x) => String(x)).sort().join(","),
    [bookingServiceIds]
  );

  const serviceId = searchParams.get("service");
  const servicesParam = searchParams.get("services"); // comma-separated for multi-service bookings
  const quantityParam = searchParams.get("quantity"); // for single-service flow
  const serviceQuantitiesParam = searchParams.get("serviceQuantities"); // id:qty,id:qty for multi-service

  const [service, setService] = useState(null); // primary service (first)
  const [servicesList, setServicesList] = useState([]); // all selected services
  const [loadingCart, setLoadingCart] = useState(true);
  const [employees, setEmployees] = useState([]);
  const [fallbackSalonId, setFallbackSalonId] = useState(null);
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
  const [slotsReason, setSlotsReason] = useState(null);
  const [paymentPlan, setPaymentPlan] = useState("half"); // "half" | "full" | "book_now_pay_later"
  const [couponInput, setCouponInput] = useState("");
  const [couponApplied, setCouponApplied] = useState(null); // { code, discountAmount, totalAfterDiscount }
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [user, setUser] = useState(null);
  const [razorpayReady, setRazorpayReady] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);

  const indianStates = useMemo(() => getIndianStates(), []);

  const selectedStateCode = useMemo(() => {
    const st = getStateByName(formData.state);
    return st?.isoCode || "";
  }, [formData.state, indianStates]);

  const cityOptions = useMemo(() => {
    if (!selectedStateCode) return [];
    const names = getCitiesForStateCode(selectedStateCode).map((c) => c.name);
    const current = (formData.city || "").trim();
    if (current && !names.some((n) => n.toLowerCase() === current.toLowerCase())) {
      return [current, ...names];
    }
    return names;
  }, [selectedStateCode, formData.city]);

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
    fetchUser();
  }, []);

  // Visiting /book?service=… or ?services=… merges into the global cart (add from anywhere).
  useEffect(() => {
    const fromUrl = servicesParam
      ? servicesParam
          .split(",")
          .map((id) => id.trim())
          .filter(Boolean)
          .map((id) => serviceIdStr(id))
          .filter(Boolean)
      : serviceId
      ? [serviceIdStr(serviceId)].filter(Boolean)
      : [];
    if (fromUrl.length === 0) return;
    const cur = (store.getState().bookingCart.serviceIds || []).map((x) => serviceIdStr(x)).filter(Boolean);
    const merged = [...new Set([...cur, ...fromUrl])];
    const hasNew = fromUrl.some((id) => !cur.includes(id));
    if (merged.length > cur.length || hasNew) {
      dispatch(setBookingServices(merged));
    }
  }, [serviceId, servicesParam, dispatch]);

  // Load services from the cart (Redux / localStorage), not only from URL.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const ids = (store.getState().bookingCart.serviceIds || [])
        .map((x) => serviceIdStr(x))
        .filter(Boolean);
      if (!ids.length) {
        if (!cancelled) {
          setServicesList([]);
          setService(null);
          setLoadingCart(false);
        }
        return;
      }
      if (!cancelled) setLoadingCart(true);
      try {
        const parsedQty = (() => {
          const map = {};
          if (serviceQuantitiesParam) {
            const pairs = String(serviceQuantitiesParam)
              .split(",")
              .map((x) => x.trim())
              .filter(Boolean);
            for (const p of pairs) {
              const [id, qtyStr] = p.split(":");
              const idNorm = serviceIdStr(id);
              const q = Math.floor(Number(qtyStr));
              if (idNorm && Number.isFinite(q)) map[idNorm] = Math.max(1, Math.min(20, q));
            }
          } else if (serviceId && quantityParam) {
            const idNorm = serviceIdStr(serviceId);
            const q = Math.floor(Number(quantityParam));
            if (idNorm && Number.isFinite(q)) map[idNorm] = Math.max(1, Math.min(20, q));
          }
          const reduxQty = store.getState().bookingCart?.quantities || {};
          for (const s of ids) {
            const sid = serviceIdStr(s);
            if (!sid || map[sid] != null) continue;
            const fromRedux = reduxQty[sid];
            if (fromRedux != null) map[sid] = Math.max(1, Math.min(20, Math.floor(Number(fromRedux))));
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
        if (cancelled) return;
        if (!validServices.length) {
          toast.error("Selected services could not be loaded");
          dispatch(setBookingServices([]));
          setServicesList([]);
          setService(null);
          return;
        }
        setServicesList(validServices);
        setService(validServices[0]);
        setServiceQty((prev) => {
          const next = { ...(prev || {}) };
          for (const s of validServices) {
            const sid = serviceIdStr(s._id);
            if (!sid) continue;
            const fromUrl = parsedQty?.[sid];
            if (fromUrl != null) next[sid] = fromUrl;
            else if (next[sid] == null) next[sid] = 1;
          }
          for (const k of Object.keys(next)) {
            if (!validServices.some((s) => serviceIdStr(s._id) === serviceIdStr(k))) {
              delete next[k];
            }
          }
          return next;
        });
      } catch (error) {
        toast.error("Error loading services");
        console.error(error);
      } finally {
        if (!cancelled) setLoadingCart(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [idsKey, serviceQuantitiesParam, quantityParam, serviceId, dispatch]);

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
    const key = serviceIdStr(id);
    const raw = Number(serviceQty?.[key]);
    const q = Number.isFinite(raw) ? Math.floor(raw) : 1;
    return Math.max(1, Math.min(20, q));
  };

  const removeServiceFromCart = (svc) => {
    const sid = serviceIdStr(svc?._id);
    if (!sid) return;
    const updated = servicesList.filter((item) => serviceIdStr(item._id) !== sid);
    if (updated.length === 0) {
      dispatch(setBookingServices([]));
      setServicesList([]);
      setService(null);
      setServiceQty({});
      setTimeSlots([]);
      setFormData((prev) => ({ ...prev, time: "" }));
      toast.success("Cart cleared. Add more services from anywhere on the site.");
      router.push("/services");
      return;
    }
    setServicesList(updated);
    setService(updated[0]);
    setServiceQty((prev) => {
      const next = { ...(prev || {}) };
      delete next[sid];
      for (const keep of updated) {
        const kid = serviceIdStr(keep._id);
        if (kid && next[kid] == null) next[kid] = 1;
      }
      return next;
    });
    setTimeSlots([]);
    setFormData((prev) => ({ ...prev, time: "" }));
    dispatch(setBookingServices(updated.map((x) => serviceIdStr(x._id)).filter(Boolean)));
    if (updated.length === 1) {
      const only = serviceIdStr(updated[0]._id);
      router.replace(`/book?service=${only}&quantity=${getQtyForService(only)}`);
    } else {
      const idList = updated.map((x) => serviceIdStr(x._id)).filter(Boolean);
      const pairs = idList.map((id) => `${id}:${getQtyForService(id)}`).join(",");
      router.replace(`/book?services=${idList.join(",")}&serviceQuantities=${encodeURIComponent(pairs)}`);
    }
  };

  const baseSubtotal = (servicesList || []).reduce(
    (sum, s) => sum + (Number(s.price) || 0) * getQtyForService(s._id),
    0
  );
  const subtotal = baseSubtotal;
  const discountAmount = Number(couponApplied?.discountAmount || 0);
  const { serviceCharge, totalPayable } = computeOrderTotals({
    subtotal,
    discountAmount,
  });
  const isDentalService = service?.category?.type === "dentist";
  /** In-person home/salon visit: full address required. Video & dental still show map for easy entry (optional). */
  const needsStructuredCustomerAddress =
    !service?.isVideoConsultation && !isDentalService;
  const videoConsultNamesInCart = (servicesList || [])
    .filter((s) => s.isVideoConsultation)
    .map((s) => s.name)
    .filter(Boolean);
  const hasVideoConsultMixWithOthers =
    videoConsultNamesInCart.length > 0 && (servicesList?.length || 0) > 1;
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
    if (formData.date && employees.length > 0) {
      fetchTimeSlots();
    } else {
      setTimeSlots([]);
      setSlotsReason(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.date, employees.length, JSON.stringify(serviceQty)]);

  const fetchEmployees = async () => {
    const primaryServiceId = serviceIdStr(service?._id || serviceId);
    if (!primaryServiceId) return;
    try {
      setFallbackSalonId(null);
      const res = await fetch(`/api/employee?serviceId=${primaryServiceId}`);
      const data = await res.json();
      let list = (data || []).filter((emp) => emp.active);

      if (list.length === 0) {
        const type = service?.category?.type;
        if (type) {
          const sr = await fetch(`/api/salon?type=${type}`);
          const salons = await sr.json();
          const activeSalons = (salons || []).filter((s) => s.active);
          if (activeSalons[0]?._id) setFallbackSalonId(activeSalons[0]._id);
          const collected = [];
          for (const sal of activeSalons.slice(0, 12)) {
            const er = await fetch(`/api/employee?salonId=${sal._id}`);
            const emps = er.ok ? await er.json() : [];
            for (const e of emps || []) {
              if (e.active) collected.push(e);
            }
          }
          const seen = new Set();
          list = collected.filter((e) => {
            const id = e._id?.toString();
            if (!id || seen.has(id)) return false;
            seen.add(id);
            return true;
          });
        }
      }

      setEmployees(list);
      if (list.length > 0) {
        const firstId = serviceIdStr(list[0]._id);
        const salonFromList = list.map(salonIdFromEmployee).find(Boolean) || null;
        setFormData((prev) => ({ ...prev, employee: firstId }));
        if (salonFromList) {
          setFallbackSalonId(salonFromList);
        } else {
          const catId =
            service?.category?._id || service?.category || servicesList[0]?.category?._id;
          const catType =
            service?.category?.type || servicesList[0]?.category?.type;
          const salonUrl = catId
            ? `/api/salon?categoryId=${catId}`
            : catType
            ? `/api/salon?type=${catType}`
            : null;
          if (salonUrl) {
            const sr = await fetch(salonUrl);
            const salons = sr.ok ? await sr.json() : [];
            if (salons?.[0]?._id) setFallbackSalonId(serviceIdStr(salons[0]._id));
          }
        }
      } else {
        setFormData((prev) => ({ ...prev, employee: "" }));
      }
    } catch (error) {
      console.error("Error fetching employees:", error);
    }
  };

  const fetchTimeSlots = async () => {
    if (!formData.date || employees.length === 0) {
      setTimeSlots([]);
      setSlotsReason(null);
      return;
    }
    setLoadingSlots(true);
    setSlotsReason(null);
    try {
      const ids =
        servicesList.length > 0
          ? servicesList.map((s) => serviceIdStr(s._id)).filter(Boolean)
          : servicesParam
            ? servicesParam.split(",").map((id) => serviceIdStr(id)).filter(Boolean)
            : serviceId
              ? [serviceIdStr(serviceId)].filter(Boolean)
              : [];
      const employeeIds = employees
        .map((e) => serviceIdStr(e._id))
        .filter(Boolean);
      const params = new URLSearchParams({
        employeeIds: employeeIds.join(","),
        date: formData.date,
      });
      if (ids.length === 1) {
        params.append("serviceId", ids[0]);
        params.append("quantity", String(getQtyForService(ids[0])));
      } else if (ids.length > 1) {
        params.append("serviceIds", ids.join(","));
        const pairs = ids.map((id) => `${id}:${getQtyForService(id)}`).join(",");
        params.append("serviceQuantities", pairs);
      }

      const res = await fetch(
        `/api/appointment/available-slots?${params.toString()}`
      );
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || "Could not load time slots");
        setTimeSlots([]);
        setSlotsReason(null);
        return;
      }
      const slots = data.slots || [];
      setTimeSlots(slots);
      setSlotsReason(data.reason || null);
      setFormData((prev) => {
        const matched = slots.find((s) => s.time === prev.time && s.available);
        return {
          ...prev,
          time: matched ? prev.time : "",
          employee: matched?.employeeIds?.[0] || prev.employee,
        };
      });
    } catch (error) {
      console.error("Error fetching time slots:", error);
      toast.error("Error loading available time slots");
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.customerName || !formData.customerEmail || !formData.customerPhone || !formData.date || !formData.time) {
      toast.error("Please fill all required fields");
      return;
    }
    // Home / salon visit: structured address required (video & dental: section visible but optional)
    if (needsStructuredCustomerAddress) {
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

    if (hasVideoConsultMixWithOthers) {
      toast.error(
        `Video consultation cannot be combined with other services. In your cart as video: ${videoConsultNamesInCart.join(
          ", "
        )}. Remove those or remove the other services.`
      );
      return;
    }

    const empId = serviceIdStr(formData.employee);
    const selectedEmp = employees.find(
      (e) => serviceIdStr(e._id) === empId
    );
    let salonId =
      salonIdFromEmployee(selectedEmp) || serviceIdStr(fallbackSalonId);

    if (!salonId) {
      const primary = service || servicesList[0];
      const catId = primary?.category?._id || primary?.category;
      const catType = primary?.category?.type;
      const salonUrl = catId
        ? `/api/salon?categoryId=${catId}`
        : catType
        ? `/api/salon?type=${catType}`
        : null;
      if (salonUrl) {
        const sr = await fetch(salonUrl);
        const salons = sr.ok ? await sr.json() : [];
        salonId = serviceIdStr(salons?.[0]?._id);
      }
    }

    if (!salonId) {
      toast.error(
        "No salon linked to this booking. Admin: add an active salon and link employees to it."
      );
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
          employee: formData.employee || undefined,
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
          location: isDentalService
            ? clinicAddress
            : formData.location?.trim()
            ? formData.location.trim()
            : undefined,
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
      if (paymentPlan === "book_now_pay_later") {
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

  if (loadingCart) {
    return (
      <div style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p>Loading your services…</p>
      </div>
    );
  }

  if (!service || servicesList.length === 0) {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <h1 className={styles.title}>Book Appointment</h1>
          <p style={{ color: "#6b7280", marginBottom: 12 }}>Your booking cart is empty.</p>
          <p style={{ color: "#374151", lineHeight: 1.6 }}>
            Browse{" "}
            <a href="/services" style={{ color: "var(--accent-terracotta)", fontWeight: 700 }}>
              All Services
            </a>
            , the homepage, or the header menu — use <strong>Add to cart</strong> or <strong>Book</strong> on any
            service. Everything you add stays in this cart until you finish booking.
          </p>
        </div>
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
            {(servicesList.length > 1
              ? (servicesList || []).some((s) => s.isVideoConsultation)
              : !!service?.isVideoConsultation) && (
              <span
                style={{
                  padding: "4px 10px",
                  background: "#dbeafe",
                  color: "#1d4ed8",
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                Video consultation in cart
              </span>
            )}
          </div>
          {hasVideoConsultMixWithOthers && (
            <div
              style={{
                marginTop: 12,
                marginBottom: 4,
                padding: "12px 14px",
                borderRadius: 10,
                background: "#fffbeb",
                border: "1px solid #fcd34d",
                color: "#92400e",
                fontSize: 14,
                lineHeight: 1.5,
              }}
            >
              <strong>These cannot be booked together.</strong> Video:{" "}
              <strong>{videoConsultNamesInCart.join(", ")}</strong>. Remove the video service(s) or remove the
              other services, then book separately.
            </div>
          )}
          {servicesList.length > 0 ? (
            <div className={styles.servicesList}>
              {servicesList.map((s) => (
                <div
                  key={serviceIdStr(s._id)}
                  className={styles.serviceRow}
                >
                  <div className={styles.serviceLeft}>
                    <img
                      src={s.image || BOOK_SERVICE_PLACEHOLDER_IMG}
                      alt=""
                      className={styles.serviceImg}
                    />
                    <div className={styles.serviceText}>
                      <div className={styles.serviceName}>{s.name}</div>
                      {s.isVideoConsultation && (
                        <div style={{ marginTop: 6 }}>
                          <span
                            style={{
                              display: "inline-block",
                              padding: "3px 8px",
                              background: "#dbeafe",
                              color: "#1d4ed8",
                              borderRadius: 6,
                              fontSize: 11,
                              fontWeight: 700,
                              letterSpacing: 0.02,
                            }}
                          >
                            Video consultation
                          </span>
                        </div>
                      )}
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
                            [serviceIdStr(s._id)]: Math.max(1, getQtyForService(s._id) - 1),
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
                            [serviceIdStr(s._id)]: Number.isFinite(v) ? Math.max(1, Math.min(20, v)) : 1,
                          }));
                        }}
                        className={styles.qtyInput}
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setServiceQty((prev) => ({
                            ...(prev || {}),
                            [serviceIdStr(s._id)]: Math.min(20, getQtyForService(s._id) + 1),
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
                    onClick={() => removeServiceFromCart(s)}
                    className={styles.removeBtn}
                  >
                    Remove
                  </button>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
          {servicesList.length === 1 && service?.description && (
            <p style={{ color: "#6b7280", marginBottom: 15, marginTop: 4 }}>{service.description}</p>
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

          <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>
                {needsStructuredCustomerAddress ? "Address details *" : "Your address"}
              </label>
              <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 10, lineHeight: 1.45 }}>
                {isDentalService
                  ? "Use the map to fill your details quickly. Your visit is at the clinic above; this address is optional and for contact or records."
                  : service?.isVideoConsultation
                  ? "Use the map to fill your details quickly. Address is optional for video consultations but helps our team coordinate."
                  : "Choose a point on the map for an accurate address. Required for home or salon visits."}
              </p>

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
                  Map auto-fills street, city, state and pincode
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
                    House / Building / Street{needsStructuredCustomerAddress ? " *" : ""}
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
                    required={needsStructuredCustomerAddress}
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
                    Pincode{needsStructuredCustomerAddress ? " *" : ""}
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
                    required={needsStructuredCustomerAddress}
                  />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: 6, fontSize: 14, fontWeight: 500 }}>
                    State{needsStructuredCustomerAddress ? " *" : ""}
                  </label>
                  <select
                    value={selectedStateCode}
                    onChange={(e) => {
                      const code = e.target.value;
                      const st = indianStates.find((s) => s.isoCode === code);
                      recomputeLocation({
                        state: st?.name || "",
                        city: "",
                      });
                    }}
                    style={inputStyle}
                    required={needsStructuredCustomerAddress}
                  >
                    <option value="">Select state</option>
                    {indianStates.map((s) => (
                      <option key={s.isoCode} value={s.isoCode}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: 6, fontSize: 14, fontWeight: 500 }}>
                    City{needsStructuredCustomerAddress ? " *" : ""}
                  </label>
                  <select
                    value={formData.city}
                    onChange={(e) =>
                      recomputeLocation({
                        city: e.target.value,
                      })
                    }
                    style={{
                      ...inputStyle,
                      opacity: selectedStateCode ? 1 : 0.7,
                    }}
                    disabled={!selectedStateCode}
                    required={needsStructuredCustomerAddress}
                  >
                    <option value="">
                      {selectedStateCode ? "Select city" : "Select state first"}
                    </option>
                    {cityOptions.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
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

          <h3 style={{ fontSize: 20, fontWeight: 600, marginTop: 30, marginBottom: 20 }}>Appointment Details</h3>

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
                const y = d.getFullYear();
                const m = String(d.getMonth() + 1).padStart(2, "0");
                const day = String(d.getDate()).padStart(2, "0");
                return `${y}-${m}-${day}`;
              })()}
              required
            />
          </div>

          {employees.length > 0 && (
            <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 16, lineHeight: 1.5 }}>
              A professional will be assigned automatically from available staff for your selected time.
            </p>
          )}

          {employees.length > 0 && formData.date && (
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>
                Select time slot *
              </label>
              {loadingSlots ? (
                <p style={{ color: "#6b7280" }}>Loading available slots...</p>
              ) : timeSlots.length === 0 ? (
                <p style={{ color: "#ef4444" }}>
                  {slotsReason === "duration_exceeds_hours"
                    ? "This service needs more time than we can fit in one day (9 AM – 8 PM). Try reducing quantity or contact us."
                    : slotsReason === "all_past"
                    ? "No more slots left today. Please pick a future date."
                    : "No available slots for this date. Try another date."}
                </p>
              ) : (
                <>
                  {timeSlots.every((s) => !s.available) && (
                    <p style={{ color: "#ef4444", marginBottom: 8 }}>
                      All slots are booked for this date. Please try another date.
                    </p>
                  )}
                  <select
                    value={formData.time}
                    onChange={(e) => {
                      const time = e.target.value;
                      const slot = timeSlots.find(
                        (s) => s.time === time && s.available
                      );
                      setFormData({
                        ...formData,
                        time,
                        employee: slot?.employeeIds?.[0] || formData.employee,
                      });
                    }}
                    style={inputStyle}
                    required
                  >
                    <option value="">Select a time</option>
                    {timeSlots.map((slot) => (
                      <option
                        key={slot.time}
                        value={slot.time}
                        disabled={!slot.available}
                      >
                        {formatTimeSlot12h(slot.time)}
                        {!slot.available
                          ? slot.exceedsBusinessHours
                            ? " (Not enough time)"
                            : slot.afterCutoff
                            ? " (After 6:30 not allowed)"
                            : " (Booked)"
                          : ""}
                      </option>
                    ))}
                  </select>
                </>
              )}
            </div>
          )}

          {employees.length === 0 && formData.date && (
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>
                Preferred time *
              </label>
              <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 8 }}>
                No staff linked to this service online. Choose your preferred time; the salon will assign a professional when they confirm your booking.
              </p>
              <input
                type="time"
                step={300}
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                style={inputStyle}
                required
              />
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
          <div
            style={{
              marginBottom: 26,
              background: "#fff",
              border: "1px solid #e5e7eb",
              borderRadius: 14,
              padding: "18px 20px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 10, alignItems: "baseline" }}>
              <span style={{ color: "#4b5563", fontWeight: 500, fontSize: 15 }}>Subtotal</span>
              <span style={{ color: "#111827", fontWeight: 600, fontSize: 15 }}>₹{subtotal}</span>
            </div>
            {serviceCharge > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 10 }}>
                <span style={{ color: "#4b5563", fontSize: 14 }}>Service charge</span>
                <span style={{ color: "#111827", fontWeight: 600, fontSize: 14 }}>₹{serviceCharge}</span>
              </div>
            )}
            {subtotal > 0 && subtotal < CART_FREE_SERVICE_THRESHOLD && (
              <p style={{ margin: "0 0 10px", fontSize: 12, color: "#6b7280", lineHeight: 1.45 }}>
                Orders below ₹{CART_FREE_SERVICE_THRESHOLD} include a ₹{CART_SERVICE_CHARGE_AMOUNT} service charge.
              </p>
            )}
            {discountAmount > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 10 }}>
                <span style={{ color: "#4b5563", fontSize: 14 }}>
                  Discount{couponApplied?.code ? ` (${couponApplied.code})` : ""}
                </span>
                <span style={{ color: "#16a34a", fontWeight: 600, fontSize: 14 }}>-₹{discountAmount}</span>
              </div>
            )}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
                paddingTop: 12,
                marginTop: 4,
                borderTop: "1px solid #e5e7eb",
                alignItems: "baseline",
              }}
            >
              <span style={{ color: "#111827", fontWeight: 700, fontSize: 17 }}>Total</span>
              <span style={{ color: "var(--accent-terracotta)", fontWeight: 800, fontSize: 20 }}>₹{totalPayable}</span>
            </div>

            <div style={{ marginTop: 18 }}>
              <div style={{ fontWeight: 600, marginBottom: 8, color: "#374151", fontSize: 14 }}>Coupon</div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "stretch" }}>
                <input
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value)}
                  placeholder="Enter code"
                  style={{ ...inputStyle, flex: "1 1 200px", minWidth: 0, padding: "11px 14px" }}
                />
                <button
                  type="button"
                  onClick={applyCoupon}
                  disabled={applyingCoupon || !couponInput.trim()}
                  style={{
                    padding: "11px 18px",
                    borderRadius: 10,
                    border: "1px solid #d1d5db",
                    background: applyingCoupon ? "#e5e7eb" : "#f9fafb",
                    color: "#374151",
                    cursor: applyingCoupon ? "not-allowed" : "pointer",
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                  }}
                >
                  {applyingCoupon ? "Applying…" : "Apply"}
                </button>
                {couponApplied?.code && (
                  <button
                    type="button"
                    onClick={() => setCouponApplied(null)}
                    style={{
                      padding: "11px 16px",
                      borderRadius: 10,
                      border: "1px solid #fecaca",
                      background: "#fef2f2",
                      color: "#b91c1c",
                      cursor: "pointer",
                      fontWeight: 600,
                      whiteSpace: "nowrap",
                    }}
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>

            <div style={{ marginTop: 20 }}>
              <div style={{ fontWeight: 700, marginBottom: 10, color: "#111827", fontSize: 15 }}>Payment method</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                  {
                    value: "half",
                    title: "50% advance now",
                    hint: `Pay ₹${Math.ceil(totalPayable / 2)} online · remaining ₹${Math.max(0, totalPayable - Math.ceil(totalPayable / 2))} at visit`,
                  },
                  {
                    value: "full",
                    title: "Pay full amount now",
                    hint: `₹${totalPayable} online`,
                  },
                  {
                    value: "book_now_pay_later",
                    title: "Book now, pay later",
                    hint: "No online payment now — pay when you visit or as the salon confirms",
                  },
                ].map((opt) => (
                  <label
                    key={opt.value}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 12,
                      cursor: "pointer",
                      padding: "12px 14px",
                      borderRadius: 10,
                      border:
                        paymentPlan === opt.value
                          ? "2px solid var(--accent-terracotta)"
                          : "1px solid #e5e7eb",
                      background: paymentPlan === opt.value ? "#fffaf8" : "#fafafa",
                      transition: "border-color 0.15s, background 0.15s",
                    }}
                  >
                    <input
                      type="radio"
                      name="paymentPlan"
                      value={opt.value}
                      checked={paymentPlan === opt.value}
                      onChange={() => setPaymentPlan(opt.value)}
                      style={{ marginTop: 3, flexShrink: 0 }}
                    />
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: "block", fontWeight: 600, color: "#111827", fontSize: 15 }}>{opt.title}</span>
                      <span style={{ display: "block", fontSize: 13, color: "#6b7280", marginTop: 2, lineHeight: 1.4 }}>{opt.hint}</span>
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 15 }}>
            <button
              type="submit"
              disabled={
                loading ||
                !formData.date ||
                !formData.time ||
                hasVideoConsultMixWithOthers
              }
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
              {loading ? "Processing..." : paymentPlan === "book_now_pay_later" ? "Book appointment" : "Book & pay"}
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
