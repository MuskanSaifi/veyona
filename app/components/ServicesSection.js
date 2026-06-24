"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import {
  incrementBookingService,
  decrementBookingService,
  selectBookingQty,
} from "@/lib/bookingCartSlice";
import { FaChevronDown, FaChevronRight } from "react-icons/fa";
import {
  buildChildrenMap,
  getRootServices,
  isBookableLeafService,
  normalizeServiceId,
} from "@/lib/serviceTree";

// Default placeholder image - using a data URL as fallback
const DEFAULT_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Crect fill='%23e5e7eb' width='200' height='200'/%3E%3Ctext fill='%239ca3af' font-family='sans-serif' font-size='14' x='50%25' y='50%25' text-anchor='middle' dy='.3em'%3ENo Image%3C/text%3E%3C/svg%3E";

function ServicePriceLabels({ service, size = "sm" }) {
  if (service.price == null) return null;
  const hasDiscount =
    service.originalPrice != null && Number(service.originalPrice) > Number(service.price);
  const textSm = size === "sm" ? "text-xs" : "text-xs sm:text-sm";
  return (
    <span className={`${textSm} font-semibold text-green-600 flex items-center gap-1.5 flex-wrap`}>
      {hasDiscount && (
        <span className="text-gray-400 line-through font-normal">₹{service.originalPrice}</span>
      )}
      <span>₹{service.price}</span>
    </span>
  );
}

function ServiceCartControls({ serviceId, serviceName, variant = "parent" }) {
  const dispatch = useDispatch();
  const qty = useSelector((state) => selectBookingQty(state, serviceId));

  const stop = (e) => e.stopPropagation();

  const handleAdd = (e) => {
    stop(e);
    dispatch(incrementBookingService(serviceId));
    toast.success("Added to cart");
  };

  const handleIncrement = (e) => {
    stop(e);
    if (qty >= 20) {
      toast.error("Maximum 20 per service");
      return;
    }
    dispatch(incrementBookingService(serviceId));
    toast.success("Added to cart");
  };

  const handleDecrement = (e) => {
    stop(e);
    dispatch(decrementBookingService(serviceId));
  };

  const isParent = variant === "parent";
  const btnSize = isParent
    ? "w-10 h-10 sm:w-11 sm:h-11 text-lg sm:text-xl"
    : "w-9 h-9 sm:w-10 sm:h-10 text-base sm:text-lg";
  const bookClass = isParent
    ? "px-3.5 py-2 bg-gradient-to-r from-[var(--accent-terracotta)] to-[var(--accent-coral)] text-white text-sm sm:text-base font-semibold rounded-lg hover:shadow-md transition-all duration-200 whitespace-nowrap min-w-[56px] text-center"
    : "px-3 py-1.5 bg-[var(--accent-terracotta)] text-white text-sm font-semibold rounded-md hover:opacity-90 transition-all duration-200 whitespace-nowrap min-w-[48px] text-center";

  return (
    <div className="inline-flex items-center gap-1.5 sm:gap-2 flex-shrink-0 touch-manipulation" onClick={stop}>
      <button
        type="button"
        onClick={handleDecrement}
        disabled={qty === 0}
        className={`${btnSize} rounded-full border-2 border-gray-300 bg-white font-bold text-gray-800 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-50 active:scale-95 transition-all shadow-sm`}
        aria-label={`Decrease quantity for ${serviceName}`}
      >
        −
      </button>
      {qty > 0 ? (
        <span
          className={`${bookClass} inline-flex items-center justify-center`}
          aria-label={`${qty} in cart`}
        >
          {qty}
        </span>
      ) : (
        <button type="button" onClick={handleAdd} className={bookClass} aria-label={`Add ${serviceName} to cart`}>
          Book
        </button>
      )}
      <button
        type="button"
        onClick={qty === 0 ? handleAdd : handleIncrement}
        className={`${btnSize} rounded-full border-2 border-gray-300 bg-white font-bold text-gray-800 flex items-center justify-center hover:bg-gray-50 active:scale-95 transition-all shadow-sm`}
        aria-label={`Increase quantity for ${serviceName}`}
      >
        +
      </button>
    </div>
  );
}

function ServiceTreeNode({
  service,
  depth,
  childrenMap,
  expandedServices,
  toggleService,
}) {
  const id = normalizeServiceId(service._id);
  const children = childrenMap.get(id) || [];
  const hasChildren = children.length > 0;
  const isExpanded = expandedServices.has(id);
  const canBook = isBookableLeafService(service, childrenMap);
  const isRoot = depth === 0;

  const imageSize = isRoot
    ? "w-12 h-12 sm:w-14 sm:h-14 rounded-lg"
    : depth === 1
      ? "w-10 h-10 sm:w-12 sm:h-12 rounded-md"
      : "w-8 h-8 sm:w-10 sm:h-10 rounded";

  const titleClass = isRoot
    ? "text-base sm:text-lg font-bold"
    : depth === 1
      ? "text-sm sm:text-base font-semibold"
      : "text-xs sm:text-sm font-medium";

  const row = (
    <div
      className={`flex items-center justify-between gap-2 ${hasChildren ? "cursor-pointer" : ""}`}
      onClick={() => hasChildren && toggleService(id)}
    >
      <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
        <div
          className={`relative ${imageSize} overflow-hidden flex-shrink-0 bg-gray-100 border border-gray-200`}
        >
          <Image
            src={service.image || DEFAULT_IMAGE}
            alt={service.name}
            fill
            className="object-cover"
            onError={(e) => {
              e.target.src = DEFAULT_IMAGE;
            }}
          />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className={`${titleClass} text-gray-900 leading-tight`}>{service.name}</h3>
          {canBook && (
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <span className="text-xs text-gray-600">{service.duration} min</span>
              <ServicePriceLabels service={service} />
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {canBook && (
          <ServiceCartControls
            serviceId={service._id}
            serviceName={service.name}
            variant={isRoot ? "parent" : "child"}
          />
        )}
        {hasChildren && (
          <button
            type="button"
            className="p-1.5 hover:bg-gray-200 rounded transition-colors touch-manipulation"
            onClick={(e) => {
              e.stopPropagation();
              toggleService(id);
            }}
          >
            {isExpanded ? (
              <FaChevronDown className="w-4 h-4 text-gray-700" />
            ) : (
              <FaChevronRight className="w-4 h-4 text-gray-700" />
            )}
          </button>
        )}
      </div>
    </div>
  );

  if (isRoot) {
    return (
      <div className="group bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-200 hover:border-[var(--accent-terracotta)]">
        <div
          className={`p-3 sm:p-4 ${hasChildren ? "hover:bg-[color:var(--bg-cream)]" : ""} transition-colors`}
        >
          {row}
        </div>
        {hasChildren && isExpanded && (
          <div className="border-t border-gray-200 bg-gray-50 p-2 sm:p-3 space-y-2">
            {children.map((child) => (
              <ServiceTreeNode
                key={normalizeServiceId(child._id)}
                service={child}
                depth={depth + 1}
                childrenMap={childrenMap}
                expandedServices={expandedServices}
                toggleService={toggleService}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={`bg-white rounded-lg border border-gray-200 hover:border-[var(--accent-brown)] transition-colors ${
        depth > 1 ? "ml-2 sm:ml-3 border-l-2 border-l-[var(--border-light)]" : ""
      }`}
      style={{ marginLeft: depth > 1 ? Math.min(depth * 8, 32) : 0 }}
    >
      <div className="p-2 sm:p-3">{row}</div>
      {hasChildren && isExpanded && (
        <div className="px-2 pb-2 sm:px-3 sm:pb-3 space-y-1.5">
          {children.map((child) => (
            <ServiceTreeNode
              key={normalizeServiceId(child._id)}
              service={child}
              depth={depth + 1}
              childrenMap={childrenMap}
              expandedServices={expandedServices}
              toggleService={toggleService}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function ServicesSection({ category, typeFilter }) {
  const [services, setServices] = useState([]);
  const [expandedServices, setExpandedServices] = useState(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (category) {
      fetchServices();
    }
  }, [category?._id, typeFilter]);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/service?categoryId=${category._id}&includeChildren=true`);
      const data = await res.json();
      const activeServices = data.filter((s) => s.active);
      setServices(activeServices);
    } catch (error) {
      console.error("Error fetching services:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleService = (serviceId) => {
    const key = normalizeServiceId(serviceId);
    const newExpanded = new Set(expandedServices);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedServices(newExpanded);
  };

  const childrenMap = buildChildrenMap(services);
  const rootServices = getRootServices(services);

  if (loading) {
    return (
      <section className="w-full py-16 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--accent-terracotta)]"></div>
            <p className="mt-4 text-gray-600">Loading services...</p>
          </div>
        </div>
      </section>
    );
  }

  if (rootServices.length === 0) {
    return null;
  }

  return (
    <section className="w-full py-4 sm:py-6 bg-gradient-to-b from-white via-gray-50 to-white" id="services">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header - Compact */}
        <div className="text-center mb-4 sm:mb-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            {category?.name || "Our Services"}
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-[var(--accent-terracotta)] to-[var(--accent-coral)] mx-auto rounded-full"></div>
        </div>

        {/* Services Grid - Compact Spacing */}
        <div className="space-y-2 sm:space-y-3">
          {rootServices.map((service) => (
            <ServiceTreeNode
              key={normalizeServiceId(service._id)}
              service={service}
              depth={0}
              childrenMap={childrenMap}
              expandedServices={expandedServices}
              toggleService={toggleService}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

