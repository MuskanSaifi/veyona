"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import {
  setBookingServices,
  addBookingService,
  removeBookingService,
} from "@/lib/bookingCartSlice";
import { computeOrderTotals } from "@/lib/cartPricing";

// Placeholder when service has no image
const DEFAULT_SERVICE_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Crect fill='%23e5e7eb' width='80' height='80'/%3E%3Ctext fill='%239ca3af' font-family='sans-serif' font-size='10' x='50%25' y='50%25' text-anchor='middle' dy='.3em'%3ENo Image%3C/text%3E%3C/svg%3E";

function ServicePriceDisplay({ service, compact }) {
  if (!service || service.price == null) return null;
  const orig = service.originalPrice;
  const showStrike = orig != null && Number(orig) > Number(service.price);
  return (
    <div
      style={{
        marginTop: compact ? 4 : 6,
        display: "flex",
        alignItems: "center",
        gap: 8,
        flexWrap: "wrap",
      }}
    >
      {showStrike && (
        <span
          style={{
            fontSize: compact ? 11 : 12,
            color: "#9ca3af",
            textDecoration: "line-through",
          }}
        >
          ₹{orig}
        </span>
      )}
      <span
        style={{
          fontSize: compact ? 13 : 14,
          fontWeight: 700,
          color: "var(--accent-terracotta)",
        }}
      >
        ₹{service.price}
      </span>
    </div>
  );
}

export default function BookSection() {
  const router = useRouter();
  const dispatch = useDispatch();
  const reduxServiceIds = useSelector((state) => state.bookingCart.serviceIds) || [];
  const reduxQuantities = useSelector((state) => state.bookingCart.quantities) || {};
  /** Latest selected category id — avoids stale closure in fetchServices after await. */
  const selectedCategoryIdRef = useRef(null);
  /** Active booking categories from admin (one tab per category — correct services per tab). */
  const [bookCategories, setBookCategories] = useState([]);
  const [activeBookCategoryId, setActiveBookCategoryId] = useState(null);
  const [services, setServices] = useState([]);
  const [salons, setSalons] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedSalon, setSelectedSalon] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [loading, setLoading] = useState(false);
  const [serviceSearchQuery, setServiceSearchQuery] = useState("");
  const [serviceDropdownOpen, setServiceDropdownOpen] = useState(false);
  const serviceDropdownRef = useRef(null);
  const serviceSearchInputRef = useRef(null);
  const [cartServices, setCartServices] = useState([]);
  const [cartQty, setCartQty] = useState({}); // { [serviceId]: number }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (serviceDropdownRef.current && !serviceDropdownRef.current.contains(e.target)) {
        setServiceDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (serviceDropdownOpen) {
      setServiceSearchQuery("");
      setTimeout(() => serviceSearchInputRef.current?.focus(), 50);
    }
  }, [serviceDropdownOpen]);

  // Load all active categories once; each becomes a "Select type" tab with its admin name.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/category");
        const data = await res.json();
        if (cancelled) return;
        const active = Array.isArray(data) ? data.filter((c) => c.active) : [];
        const order = { salon: 0, dentist: 1, tattoo: 2 };
        active.sort((a, b) => {
          const ta = order[a.type] ?? 99;
          const tb = order[b.type] ?? 99;
          if (ta !== tb) return ta - tb;
          const ca = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const cb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          if (ca !== cb) return ca - cb;
          return String(a.name || "").localeCompare(String(b.name || ""), undefined, {
            sensitivity: "base",
          });
        });
        setBookCategories(active);
        setActiveBookCategoryId((prev) => {
          const ids = new Set(active.map((c) => String(c._id)));
          if (prev && ids.has(prev)) return prev;
          const firstSalon = active.find((c) => c.type === "salon");
          if (firstSalon) return String(firstSalon._id);
          return active[0] ? String(active[0]._id) : null;
        });
      } catch (error) {
        console.error("Error fetching book categories:", error);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!activeBookCategoryId || bookCategories.length === 0) {
      setSelectedCategory(null);
      setServices([]);
      setSelectedService(null);
      return;
    }
    const cat = bookCategories.find((c) => String(c._id) === activeBookCategoryId);
    setSelectedCategory(cat || null);
    if (!cat) setSelectedService(null);
  }, [activeBookCategoryId, bookCategories]);

  useEffect(() => {
    selectedCategoryIdRef.current = selectedCategory?._id
      ? String(selectedCategory._id)
      : null;
  }, [selectedCategory]);

  // Load services for the selected category for all types (including dentist)
  useEffect(() => {
    if (selectedCategory) {
      setSelectedService(null);
      setSelectedSalon(null);
      setSelectedEmployee(null);
      fetchServices(String(selectedCategory._id));
    } else {
      setServices([]);
      setSelectedService(null);
    }
  }, [selectedCategory]);

  useEffect(() => {
    if (selectedService) {
      fetchSalons();
    } else {
      setSalons([]);
      setEmployees([]);
    }
  }, [selectedService]);

  useEffect(() => {
    if (selectedSalon && selectedService) {
      fetchEmployees();
    } else {
      setEmployees([]);
    }
  }, [selectedSalon, selectedService]);

  // Sync cart from Redux when returning to page (e.g. from /book)
  useEffect(() => {
    if (reduxServiceIds.length === 0) return;
    (async () => {
      try {
        const results = await Promise.all(
          reduxServiceIds.map((id) =>
            fetch(`/api/service/${id}`).then((r) => (r.ok ? r.json() : null)).catch(() => null)
          )
        );
        const valid = results.filter(Boolean);
        if (valid.length > 0) {
          setCartServices(valid);
          setCartQty((prev) => {
            const next = { ...(prev || {}) };
            for (const s of valid) {
              if (s?._id) {
                const key = String(s._id);
                const fromRedux = reduxQuantities[key];
                next[key] = fromRedux != null ? Math.max(1, Math.min(20, Math.floor(Number(fromRedux)))) : (next[key] ?? 1);
              }
            }
            // remove qty entries that are no longer in cart
            for (const k of Object.keys(next)) {
              if (!valid.some((x) => x?._id?.toString?.() === k?.toString?.())) {
                delete next[k];
              }
            }
            return next;
          });
        }
      } catch (e) {}
    })();
  }, [reduxServiceIds.join(","), JSON.stringify(reduxQuantities)]); // Sync when Redux cart changes

  const getQtyForCart = (id) => {
    const raw = Number(cartQty?.[id]);
    const q = Number.isFinite(raw) ? Math.floor(raw) : 1;
    return Math.max(1, Math.min(20, q));
  };

  const fetchCategories = async () => {
    try {
      const currentType = typeFilter;
      const baseType = currentType.startsWith("salon-") ? "salon" : currentType;
      const subSegment = currentType.startsWith("salon-")
        ? typeFilter.split("-")[1]
        : null;

      const res = await fetch(`/api/category?type=${baseType}`);
      const data = await res.json();
      // If user switched type while this request was in-flight, ignore this response
      if (currentType !== typeFilter) return;
      let activeCategories = data.filter((cat) => cat.active);

      // For salon segments, narrow down by category name (flexible; DB names vary)
      if (subSegment === "beauty" || subSegment === "aesthetics") {
        const narrowed = activeCategories.filter((cat) =>
          salonCategoryMatchesSegment(cat.name, subSegment)
        );
        // If nothing matched naming rules, show all salon categories so booking still works
        activeCategories = narrowed.length > 0 ? narrowed : activeCategories;
      }

      // Dental UX: don't show unrelated salon/clinic groupings as categories.
      if (baseType === "dentist") {
        activeCategories = activeCategories.filter((cat) => {
          const n = (cat.name || "").toLowerCase();
          if (n.includes("salon") || n.includes("clinic")) return false;
          return true;
        });
      }

      setCategories(activeCategories);
      if (activeCategories.length === 0) {
        setServices([]);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchServices = async (categoryId) => {
    const requestedId = String(categoryId);
    try {
      // Fetch all services including children to check for parent-child relationships
      const res = await fetch(`/api/service?categoryId=${requestedId}&includeChildren=true`);
      const data = await res.json();
      // Ignore stale responses (tab switch / category change while fetch was in flight)
      if (selectedCategoryIdRef.current !== requestedId) {
        return;
      }
      const activeServices = data.filter((s) => s.active);
      
      // Get all service IDs to check which ones are parents
      const allServiceIds = new Set(activeServices.map(s => s._id.toString()));
      
      // Find which services are parents (have children)
      const parentServiceIds = new Set();
      activeServices.forEach(service => {
        if (service.parentService) {
          const parentId = typeof service.parentService === 'string' 
            ? service.parentService 
            : service.parentService._id?.toString();
          if (parentId && allServiceIds.has(parentId)) {
            parentServiceIds.add(parentId);
          }
        }
      });
      
      // Filter to only show bookable services (leaf nodes - have price, duration, and are NOT parents)
      const bookableServices = activeServices.filter((service) => {
        const serviceId = service._id.toString();
        const hasPriceAndDuration =
          service.price != null &&
          Number(service.price) >= 0 &&
          service.duration != null &&
          Number(service.duration) >= 0;
        const isNotParent = !parentServiceIds.has(serviceId);
        // Only show services that are bookable AND are not parent services
        return hasPriceAndDuration && isNotParent;
      });
      
      setServices(bookableServices);
      setServiceSearchQuery("");
      // Don't auto-select a service; keep dropdown showing placeholder until user picks.
      setSelectedService(null);
    } catch (error) {
      console.error("Error fetching services:", error);
    }
  };

  const fetchSalons = async () => {
    if (!selectedService) return;
    try {
      const serviceType =
        selectedService.category?.type ||
        (await fetch(`/api/service/${selectedService._id}`).then((r) => r.json()).then((d) => d.category?.type));
      if (serviceType) {
        const salonRes = await fetch(`/api/salon?type=${serviceType}`);
        const salonData = await salonRes.json();
        const activeSalons = salonData.filter((s) => s.active);
        setSalons(activeSalons);
        if (activeSalons.length > 0 && !selectedSalon) {
          setSelectedSalon(activeSalons[0]);
        } else {
          setSelectedSalon(null);
        }
      }
    } catch (error) {
      console.error("Error fetching salons:", error);
    }
  };

  const fetchEmployees = async () => {
    if (!selectedSalon || !selectedService) return;
    try {
      // API filters employees by service's category
      const res = await fetch(
        `/api/employee?salonId=${selectedSalon._id}&serviceId=${selectedService._id}`
      );
      const data = await res.json();
      const availableEmployees = (data || []).filter((emp) => emp.active);
      setEmployees(availableEmployees);
      if (availableEmployees.length > 0 && !selectedEmployee) {
        setSelectedEmployee(availableEmployees[0]);
      } else {
        setSelectedEmployee(null);
      }
    } catch (error) {
      console.error("Error fetching employees:", error);
    }
  };

  const addServiceToCart = (service) => {
    if (!service) return;
    if (cartServices.some((s) => s._id === service._id)) {
      toast("Service already in cart");
      return;
    }
    setCartServices((prev) => [...prev, service]);
    setCartQty((prev) => ({ ...(prev || {}), [service._id]: 1 }));
    dispatch(addBookingService(service._id));
    toast.success("Service added to cart");
  };

  const handleBookNow = () => {
    // If multiple services in cart, book them together
    if (cartServices.length > 1) {
      const ids = cartServices.map((s) => s._id).join(",");
      const pairs = cartServices
        .map((s) => `${s._id}:${getQtyForCart(s._id)}`)
        .join(",");
      router.push(`/book?services=${ids}&serviceQuantities=${encodeURIComponent(pairs)}`);
      return;
    }

    // If exactly one in cart, use that single service
    if (cartServices.length === 1) {
      const only = cartServices[0];
      router.push(`/book?service=${only._id}&quantity=${getQtyForCart(only._id)}`);
      return;
    }

    // Fallback: single selected service
    if (!selectedService) {
      toast.error("Please select a service");
      return;
    }
    router.push(`/book?service=${selectedService._id}`);
  };

  const inputStyle = {
    padding: "12px 16px",
    fontSize: 15,
    cursor: "pointer",
    color: "var(--text-dark)",
    background: "var(--bg-cream)",
    border: "1px solid var(--border-light)",
  };

  const labelStyle = {
    display: "block",
    marginBottom: 8,
    fontWeight: 600,
    color: "#222222",
    fontSize: 15,
  };

  return (
    <section
      id="book-appointment"
      className="py-10 md:py-14 px-4 md:px-6"
      style={{ background: "#ffffff" }}
    >
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8 md:mb-10">
          <h2
            className="text-2xl md:text-3xl font-bold mb-2"
            style={{ color: "var(--text-dark)" }}
          >
            Book Your Appointment
          </h2>
          <p
            className="text-sm md:text-base"
            style={{ color: "var(--text-muted)" }}
          >
            Select service, salon, and employee to book your appointment
          </p>
        </div>
        <div
          className="rounded-2xl p-6 md:p-8 lg:p-10 border border-[var(--border-light)] transition-shadow duration-300 hover:shadow-lg"
          style={{
            background: "#ffffff",
            boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
          }}
        >

          {/* Select type: one tab per admin category (name + services match that category) */}
          <div className="mb-6">
            <label style={labelStyle}>Select type</label>
            {bookCategories.length === 0 ? (
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                No active categories yet. Add categories in the admin panel.
              </p>
            ) : (
              <div className="flex gap-3 flex-wrap">
                {bookCategories.map((cat) => {
                  const id = String(cat._id);
                  const isActive = activeBookCategoryId === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      title={cat.name || ""}
                      onClick={() => {
                        setActiveBookCategoryId(id);
                        setServices([]);
                        setServiceDropdownOpen(false);
                        setServiceSearchQuery("");
                        setSelectedService(null);
                        setSelectedSalon(null);
                        setSelectedEmployee(null);
                        setCartServices([]);
                        setCartQty({});
                        dispatch(setBookingServices([]));
                      }}
                      className="flex-1 min-w-[100px] py-3 px-4 rounded-xl font-medium text-[14px] sm:text-[15px] transition-all duration-200 hover:border-[var(--accent-terracotta)]/50 leading-snug text-center"
                      style={{
                        background: isActive ? "var(--bg-footer-dark)" : "transparent",
                        color: isActive ? "#ffffff" : "var(--text-dark)",
                        border: isActive ? "none" : "1px solid var(--border-light)",
                      }}
                    >
                      {cat.name || "Category"}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Form grid - 2 columns on desktop */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Select Service - Searchable Dropdown */}
            {services.length > 0 && (
              <div ref={serviceDropdownRef} className="relative lg:col-span-2">

                <label style={labelStyle}>Select Service</label>

                {/* Dropdown trigger */}
                <button
                  type="button"
                  onClick={() => setServiceDropdownOpen((v) => !v)}
                  className="mt-2 w-full rounded-xl border border-[var(--border-light)] px-4 py-3 text-left flex items-center justify-between gap-3"
                  style={{
                    background: "var(--bg-cream)",
                    boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-dark)" }}>
                      Select service
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                      Tap to choose
                    </div>
                  </div>
                  <div style={{ fontSize: 18, lineHeight: 1, color: "#6b7280" }}>
                    {serviceDropdownOpen ? "▴" : "▾"}
                  </div>
                </button>

                {/* Dropdown panel */}
                {serviceDropdownOpen && (
                  <div
                    className="mt-2 rounded-xl border border-[var(--border-light)] overflow-hidden"
                    style={{
                      background: "#ffffff",
                      boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
                    }}
                  >
                    {/* Search input */}
                    <div className="p-2 border-b border-[var(--border-light)] bg-white">
                      <input
                        ref={serviceSearchInputRef}
                        type="text"
                        placeholder="Search service..."
                        value={serviceSearchQuery}
                        onChange={(e) => setServiceSearchQuery(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full rounded-lg px-3 py-2 text-sm border border-[var(--border-light)] focus:ring-2 focus:ring-[var(--accent-terracotta)]/30 focus:border-[var(--accent-terracotta)] outline-none"
                        style={{ background: "var(--bg-cream)" }}
                      />
                    </div>

                    {/* Scrollable service list (1 item per row) */}
                    <div className="overflow-y-auto" style={{ maxHeight: 300 }}>
                      <div style={{ padding: 12 }} className="grid grid-cols-1 gap-3">
                        {services
                          .filter((service) => {
                            const searchLower = serviceSearchQuery.toLowerCase().trim();
                            if (!searchLower) return true;
                            const label = `${service.name} ${service.duration || ""}`.toLowerCase();
                            return label.includes(searchLower);
                          })
                          .map((service) => {
                            const label = `${service.name}${service.duration != null && service.duration > 0 ? ` - Pre Book Now (${service.duration} min)` : ""}`;
                            const isSelected = selectedService?._id === service._id;
                            const inCart = cartServices.some((s) => s._id === service._id);
                            return (
                              <div
                                key={service._id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedService(service);
                                  setSelectedSalon(null);
                                  setSelectedEmployee(null);
                                  setServiceSearchQuery("");
                                  addServiceToCart(service);
                                  setServiceDropdownOpen(false);
                                }}
                                className="px-3 py-3 cursor-pointer transition-colors hover:bg-[var(--accent-terracotta)]/10"
                                style={{
                                  background: isSelected ? "rgba(173, 110, 94, 0.15)" : "transparent",
                                  border: isSelected ? "1px solid var(--accent-terracotta)" : "1px solid transparent",
                                  borderRadius: 12,
                                }}
                              >
                                <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                                  <img
                                    src={service.image || DEFAULT_SERVICE_IMAGE}
                                    alt=""
                                    style={{
                                      width: 36,
                                      height: 36,
                                      objectFit: "cover",
                                      borderRadius: 8,
                                      flexShrink: 0,
                                    }}
                                  />
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <span
                                      style={{
                                        fontSize: 13,
                                        lineHeight: 1.2,
                                        wordBreak: "break-word",
                                        display: "block",
                                      }}
                                    >
                                      {label}
                                    </span>
                                    <ServicePriceDisplay service={service} />
                                  </div>
                                </div>
                                {inCart && (
                                  <div
                                    style={{
                                      marginTop: 8,
                                      fontSize: 11,
                                      padding: "2px 8px",
                                      borderRadius: 999,
                                      background: "#dcfce7",
                                      color: "#166534",
                                      fontWeight: 600,
                                      width: "fit-content",
                                    }}
                                  >
                                    In cart
                                  </div>
                                )}
                              </div>
                            );
                          })}
                      </div>

                      {services.filter((s) => {
                        const q = serviceSearchQuery.toLowerCase().trim();
                        if (!q) return true;
                        return `${s.name} ${s.duration || ""}`.toLowerCase().includes(q);
                      }).length === 0 && (
                        <div className="px-4 py-6 text-center text-sm" style={{ color: "var(--text-muted)" }}>
                          No service found. Try different search.
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Selected service below (UX requirement) */}
                <div style={{ marginTop: 10, fontSize: 14, color: "#374151" }}>
                  <span style={{ fontWeight: 600 }}>Selected service:</span>{" "}
                  {selectedService ? (
                    <>
                      <span>{selectedService.name}</span>
                      <ServicePriceDisplay service={selectedService} compact />
                    </>
                  ) : (
                    "None"
                  )}
                </div>
              </div>
            )}

            {/* Home service: location will be taken later on booking page, so we don't show salon/employee here */}
          </div>

          {/* Cart summary + Book Appointment Now Button */}
          <div className="mt-8 space-y-4">
            {cartServices.length > 0 && (
              <div
                className="rounded-2xl px-4 py-4 text-sm border"
                style={{
                  background:
                    "linear-gradient(135deg, color-mix(in srgb, var(--accent-terracotta) 12%, transparent) 0%, rgba(255,255,255,1) 55%, color-mix(in srgb, var(--accent-terracotta) 8%, transparent) 100%)",
                  borderColor: "color-mix(in srgb, var(--accent-terracotta) 25%, transparent)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                  <div>
                    <div style={{ fontWeight: 800, color: "#111827", fontSize: 13, letterSpacing: 0.2 }}>
                      Selected services
                    </div>
                    <div style={{ color: "#6b7280", fontSize: 12, marginTop: 2 }}>
                      Tap a card to remove
                    </div>
                  </div>
                  <div style={{ fontWeight: 800, color: "#111827" }}>
                    {(() => {
                      const cartSubtotal = cartServices.reduce(
                        (sum, x) => sum + (Number(x.price) || 0) * getQtyForCart(x._id),
                        0
                      );
                      const { serviceCharge, totalPayable } = computeOrderTotals({ subtotal: cartSubtotal });
                      return (
                        <>
                          Total{" "}
                          <span style={{ color: "var(--accent-terracotta)" }}>₹{totalPayable}</span>
                          {serviceCharge > 0 && (
                            <div style={{ fontSize: 11, fontWeight: 500, color: "#6b7280", marginTop: 2 }}>
                              incl. ₹{serviceCharge} service charge
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>

                <div
                  className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3"
                  style={{ width: "100%" }}
                >
                  {cartServices.map((s) => (
                    <button
                      key={s._id}
                      type="button"
                      onClick={() => {
                        setCartServices((prev) => prev.filter((item) => item._id !== s._id));
                        setCartQty((prev) => {
                          const next = { ...(prev || {}) };
                          delete next[s._id];
                          return next;
                        });
                        dispatch(removeBookingService(s._id));
                      }}
                      className="text-left rounded-xl border p-3 transition-all hover:shadow-sm"
                      style={{
                        background: "rgba(255,255,255,0.85)",
                        borderColor: "rgba(209,213,219,0.9)",
                        cursor: "pointer",
                      }}
                      title="Remove service"
                    >
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                        <img
                          src={s.image || DEFAULT_SERVICE_IMAGE}
                          alt=""
                          style={{ width: 40, height: 40, borderRadius: 10, objectFit: "cover", flexShrink: 0 }}
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 800, color: "#111827", fontSize: 13, lineHeight: 1.2 }}>
                            {s.name}
                          </div>
                          <div style={{ marginTop: 8, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                            <div
                              onClick={(e) => e.stopPropagation()}
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 8,
                                border: "1px solid rgba(209,213,219,0.9)",
                                borderRadius: 999,
                                padding: "4px 8px",
                                background: "#fff",
                              }}
                            >
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setCartQty((prev) => ({
                                    ...(prev || {}),
                                    [s._id]: Math.max(1, getQtyForCart(s._id) - 1),
                                  }));
                                }}
                                style={{
                                  width: 26,
                                  height: 26,
                                  borderRadius: 999,
                                  border: "1px solid #e5e7eb",
                                  background: "#f8fafc",
                                  cursor: "pointer",
                                  fontWeight: 900,
                                }}
                                aria-label={`Decrease quantity for ${s.name}`}
                              >
                                −
                              </button>
                              <input
                                type="number"
                                min={1}
                                max={20}
                                value={getQtyForCart(s._id)}
                                onChange={(e) => {
                                  const v = Math.floor(Number(e.target.value));
                                  setCartQty((prev) => ({
                                    ...(prev || {}),
                                    [s._id]: Number.isFinite(v) ? Math.max(1, Math.min(20, v)) : 1,
                                  }));
                                }}
                                style={{
                                  width: 46,
                                  textAlign: "center",
                                  border: "none",
                                  outline: "none",
                                  fontWeight: 800,
                                  color: "#0f172a",
                                }}
                                onClick={(e) => e.stopPropagation()}
                              />
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setCartQty((prev) => ({
                                    ...(prev || {}),
                                    [s._id]: Math.min(20, getQtyForCart(s._id) + 1),
                                  }));
                                }}
                                style={{
                                  width: 26,
                                  height: 26,
                                  borderRadius: 999,
                                  border: "1px solid #e5e7eb",
                                  background: "#f8fafc",
                                  cursor: "pointer",
                                  fontWeight: 900,
                                }}
                                aria-label={`Increase quantity for ${s.name}`}
                              >
                                +
                              </button>
                            </div>
                            <div style={{ fontWeight: 900, color: "var(--accent-terracotta)" }}>
                              ₹{(Number(s.price) || 0) * getQtyForCart(s._id)}
                            </div>
                          </div>
                          <div style={{ marginTop: 6, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                              {s.originalPrice != null && Number(s.originalPrice) > Number(s.price) && (
                                <span style={{ textDecoration: "line-through", color: "#9ca3af", fontSize: 12 }}>
                                  ₹{s.originalPrice}
                                </span>
                              )}
                              {s.price != null && (
                                <span style={{ fontWeight: 900, color: "var(--accent-terracotta)", fontSize: 13 }}>
                                  ₹{s.price}
                                </span>
                              )}
                            </div>
                            <span
                              style={{
                                fontSize: 12,
                                fontWeight: 900,
                                color: "#991b1b",
                                background: "#fee2e2",
                                border: "1px solid #fecaca",
                                padding: "2px 8px",
                                borderRadius: 999,
                              }}
                            >
                              Remove
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-col md:flex-row gap-3">
              <button
                onClick={handleBookNow}
                disabled={loading || (!selectedService && cartServices.length === 0)}
                className="flex-1 py-4 rounded-xl font-semibold text-base md:text-lg transition-all duration-200
                  hover:opacity-90 hover:shadow-md active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed text-center"
                style={{
                  background: "var(--bg-footer-dark)",
                  color: "#ffffff",
                  border: "none",
                  cursor: loading ? "not-allowed" : "pointer",
                }}
              >
                {loading
                  ? "Processing..."
                  : cartServices.length > 1
                  ? `Book ${cartServices.length} services together`
                  : selectedService?.isVideoConsultation
                  ? "Book Video Consultation"
                  : "Book Appointment Now"}
              </button>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

