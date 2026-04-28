"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { FaChevronDown, FaChevronRight, FaArrowRight } from "react-icons/fa";

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

  // Group services by parent
  const organizeServices = () => {
    const parentServices = services.filter((s) => !s.parentService);
    const childServicesMap = new Map();

    services.forEach((service) => {
      if (service.parentService) {
        const parentId =
          typeof service.parentService === "string"
            ? service.parentService
            : service.parentService._id;

        if (!childServicesMap.has(parentId)) {
          childServicesMap.set(parentId, []);
        }
        childServicesMap.get(parentId).push(service);
      }
    });

    return { parentServices, childServicesMap };
  };

  const toggleService = (serviceId) => {
    const newExpanded = new Set(expandedServices);
    if (newExpanded.has(serviceId)) {
      newExpanded.delete(serviceId);
    } else {
      newExpanded.add(serviceId);
    }
    setExpandedServices(newExpanded);
  };

  // Check if service is bookable (has price and duration)
  // Services with parent can also be bookable if they have price and duration
  const isBookable = (service) => {
    return service.price && service.duration;
  };

  const { parentServices, childServicesMap } = organizeServices();

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

  if (parentServices.length === 0) {
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
          {parentServices.map((parentService) => {
            const children = childServicesMap.get(parentService._id) || [];
            const hasChildren = children.length > 0;
            const isExpanded = expandedServices.has(parentService._id);
            const canBook = isBookable(parentService);

            return (
              <div
                key={parentService._id}
                className="group bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-200 hover:border-[var(--accent-terracotta)]"
              >
                {/* Parent Service Header */}
                <div
                  className={`relative p-3 sm:p-4 cursor-pointer ${
                    hasChildren ? "hover:bg-[color:var(--bg-cream)]" : ""
                  } transition-colors`}
                  onClick={() => hasChildren && toggleService(parentService._id)}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {/* Service Image - Compact */}
                      <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100 border border-gray-200">
                        <Image
                          src={parentService.image || DEFAULT_IMAGE}
                          alt={parentService.name}
                          fill
                          className="object-cover"
                          onError={(e) => {
                            e.target.src = DEFAULT_IMAGE;
                          }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base sm:text-lg font-bold text-gray-900 leading-tight group-hover:[color:var(--accent-terracotta)] transition-colors">
                          {parentService.name}
                        </h3>
                        {canBook && (
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className="text-xs text-gray-600">
                              {parentService.duration} min
                            </span>
                            <ServicePriceLabels service={parentService} />
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {canBook && (
                        <Link
                          href={`/book?service=${parentService._id}`}
                          className="px-3 py-1.5 bg-gradient-to-r from-[var(--accent-terracotta)] to-[var(--accent-coral)] text-white text-xs sm:text-sm font-semibold rounded-lg hover:shadow-md transform hover:scale-105 transition-all duration-200 flex items-center gap-1 whitespace-nowrap"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <span>Book</span>
                          <FaArrowRight className="w-3 h-3" />
                        </Link>
                      )}
                      {hasChildren && (
                        <button
                          type="button"
                          className="p-1.5 hover:bg-gray-200 rounded transition-colors touch-manipulation"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleService(parentService._id);
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
                </div>

                {/* Children Services */}
                {hasChildren && isExpanded && (
                  <div className="border-t border-gray-200 bg-gray-50">
                    <div className="p-2 sm:p-3 space-y-2">
                      {children.map((child, index) => {
                        const grandChildren =
                          childServicesMap.get(
                            typeof child._id === "string"
                              ? child._id
                              : child._id.toString()
                          ) || [];
                        const hasGrandChildren = grandChildren.length > 0;
                        const isChildExpanded = expandedServices.has(
                          typeof child._id === "string" ? child._id : child._id.toString()
                        );
                        const canBookChild = isBookable(child);

                        return (
                          <div
                            key={child._id || index}
                            className="bg-white rounded-lg p-2 sm:p-3 border border-gray-200 hover:border-[var(--accent-brown)] transition-colors"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-md overflow-hidden flex-shrink-0 bg-gray-100 border border-gray-200">
                                  <Image
                                    src={child.image || DEFAULT_IMAGE}
                                    alt={child.name}
                                    fill
                                    className="object-cover"
                                    onError={(e) => {
                                      e.target.src = DEFAULT_IMAGE;
                                    }}
                                  />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="text-sm sm:text-base font-semibold text-gray-900 leading-tight">
                                    {child.name}
                                  </h4>
                                  {canBookChild && (
                                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                      <span className="text-xs text-gray-600">
                                        {child.duration} min
                                      </span>
                                      <ServicePriceLabels service={child} />
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 flex-shrink-0">
                                {canBookChild && (
                                  <Link
                                    href={`/book?service=${child._id}`}
                                    className="px-2.5 py-1 bg-[var(--accent-terracotta)] text-white text-xs font-semibold rounded-md hover:opacity-90 transform hover:scale-105 transition-all duration-200 flex items-center gap-1 whitespace-nowrap"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <FaArrowRight className="w-2.5 h-2.5" />
                                    <span>Book</span>
                                  </Link>
                                )}
                                {hasGrandChildren && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleService(
                                        typeof child._id === "string"
                                          ? child._id
                                          : child._id.toString()
                                      );
                                    }}
                                    className="p-1 hover:bg-gray-200 rounded transition-colors"
                                  >
                                    {isChildExpanded ? (
                                      <FaChevronDown className="w-3.5 h-3.5 text-gray-700" />
                                    ) : (
                                      <FaChevronRight className="w-3.5 h-3.5 text-gray-700" />
                                    )}
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Grand Children Services */}
                            {hasGrandChildren && isChildExpanded && (
                              <div className="mt-2 ml-3 sm:ml-4 space-y-1.5 border-l-2 border-[var(--border-light)] pl-2 sm:pl-3">
                                {grandChildren.map((grandChild, gIndex) => {
                                  const canBookGrandChild = isBookable(grandChild);
                                  return (
                                    <div
                                      key={grandChild._id || gIndex}
                                      className="bg-gray-50 rounded-md p-2 border border-gray-200 hover:border-[var(--accent-brown)] flex items-center justify-between gap-2 transition-colors"
                                    >
                                      <div className="flex items-center gap-2 flex-1 min-w-0">
                                        <div className="relative w-8 h-8 sm:w-10 sm:h-10 rounded overflow-hidden flex-shrink-0 bg-gray-100 border border-gray-200">
                                          <Image
                                            src={grandChild.image || DEFAULT_IMAGE}
                                            alt={grandChild.name}
                                            fill
                                            className="object-cover"
                                            onError={(e) => {
                                              e.target.src = DEFAULT_IMAGE;
                                            }}
                                          />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <h5 className="text-xs sm:text-sm font-medium text-gray-800 leading-tight">
                                            {grandChild.name}
                                          </h5>
                                          {canBookGrandChild && (
                                            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                              <span className="text-xs text-gray-600">
                                                {grandChild.duration} min
                                              </span>
                                              <ServicePriceLabels service={grandChild} />
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                      {canBookGrandChild && (
                                        <Link
                                          href={`/book?service=${grandChild._id}`}
                                          className="px-2 py-1 bg-[var(--accent-terracotta)] text-white text-xs font-semibold rounded-md hover:opacity-90 transform hover:scale-105 transition-all duration-200 flex items-center gap-1 whitespace-nowrap flex-shrink-0"
                                        >
                                          <FaArrowRight className="w-2.5 h-2.5" />
                                          <span>Book</span>
                                        </Link>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

