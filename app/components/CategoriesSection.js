"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FaShoppingCart } from "react-icons/fa";

const DEFAULT_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Crect fill='%23e5e7eb' width='200' height='200'/%3E%3Ctext fill='%239ca3af' font-family='sans-serif' font-size='14' x='50%25' y='50%25' text-anchor='middle' dy='.3em'%3ENo Image%3C/text%3E%3C/svg%3E";

export default function CategoriesSection({
  typeFilter,
  onCategorySelect,
  selectedCategory,
  useLink = true,
  showHeader = true,
  showChildren = true,
  compactLayout = false,
  simpleLayout = false, // Simple card: image + title + description + Explore link only (no services list)
  types = null, // ['salon','dentist','tattoo'] to fetch all - use stable ref
}) {
  const [categories, setCategories] = useState([]);
  const [categoryData, setCategoryData] = useState(new Map());
  const router = useRouter();
  const typesKey = types ? types.join(",") : "";

  useEffect(() => {
    fetchCategories();
  }, [typeFilter, typesKey]);

  useEffect(() => {
    if (showChildren && !simpleLayout && categories.length > 0) {
      fetchCategoryChildren();
    }
  }, [categories, showChildren, simpleLayout]);

  const fetchCategories = async () => {
    try {
      const typesToFetch =
        types && Array.isArray(types) && types.length > 0 ? types : [typeFilter];
      const results = await Promise.all(
        typesToFetch.map((t) => fetch(`/api/category?type=${t}`).then((r) => r.json()))
      );
      const merged = results.flat().filter((c) => c.active);
      setCategories(merged);

      if (!useLink && !selectedCategory && merged.length > 0) {
        onCategorySelect?.(merged[0]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCategoryChildren = async () => {
    const dataMap = new Map();
    
    // Use Promise.allSettled to handle errors gracefully and continue with successful requests
    const results = await Promise.allSettled(
      categories.map(async (category) => {
        try {
          // Fetch services and products in parallel for each category
          // API routes have caching headers, so browser will cache responses
          const [servicesRes, productsRes] = await Promise.all([
            fetch(`/api/service?categoryId=${category._id}&includeChildren=true`),
            fetch(`/api/product?categoryId=${category._id}&includeChildren=true`)
          ]);

          const [servicesData, productsData] = await Promise.all([
            servicesRes.json(),
            productsRes.json()
          ]);
          
          // Get bookable services (with price and duration)
          const bookableServices = servicesData
            .filter((s) => s.active && s.price && s.duration)
            .slice(0, 8); // Limit to 8 services

          // Get buyable products (with price, no parent)
          const buyableProducts = productsData
            .filter((p) => p.active && p.price && p.price > 0 && !p.parentProduct)
            .slice(0, 8); // Limit to 8 products

          if (bookableServices.length > 0 || buyableProducts.length > 0) {
            return {
              categoryId: category._id,
              data: {
                services: bookableServices,
                products: buyableProducts,
              }
            };
          }
          return null;
        } catch (error) {
          console.error(`Error fetching data for category ${category._id}:`, error);
          return null;
        }
      })
    );

    // Process results and populate map
    results.forEach((result) => {
      if (result.status === 'fulfilled' && result.value) {
        dataMap.set(result.value.categoryId, result.value.data);
      }
    });

    setCategoryData(dataMap);
  };

  const handleCategoryClick = (category) => {
    if (useLink) {
      // Navigate to dedicated category page
      router.push(`/category/${category._id}`);
    } else {
      // Old behavior - call onCategorySelect callback
      onCategorySelect?.(category);
    }
  };

  if (!categories.length) return null;

  const isBookable = (service) => {
    return service.price && service.duration;
  };

  return (
    <section className="w-full">
      {/* Header */}
      <div className={`w-full ${compactLayout ? "px-0" : "px-4"}`}>
        {showHeader && (
        <h2 className="text-center text-3xl md:text-4xl font-bold mb-10">
          Our Categories
        </h2>
        )}

        {/* Grid - simpleLayout: 2x2, else 1 or 2 cols */}
        <div className={`grid animate-fade-in ${
          simpleLayout ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6" :
          categories.length === 1 ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2"
        } ${compactLayout ? "gap-4 lg:gap-5" : "gap-6 lg:gap-8"}`}>
          {categories.map((category) => {
            const isActive = selectedCategory?._id === category._id;
            const childrenData = categoryData.get(category._id);
            const hasChildren = childrenData && (childrenData.services.length > 0 || childrenData.products.length > 0);

            /* Simple card: image + title + description + Explore link only */
            if (simpleLayout && useLink) {
              return (
                <Link
                  key={category._id}
                  href={`/category/${category._id}`}
                  className="group block rounded-[2rem] overflow-hidden bg-white shadow-[0_20px_60px_rgba(15,23,42,0.08)] border border-transparent transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_80px_rgba(15,23,42,0.12)] hover:border-[rgba(59,130,246,0.12)]"
                >
                  <div className="relative h-56 sm:h-64 overflow-hidden bg-slate-100">
                    <Image
                      src={category.image || DEFAULT_IMAGE}
                      alt={category.name}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-6 bg-white">
                    <h3 className="text-lg sm:text-xl font-bold uppercase tracking-[0.35em] text-gray-900 mb-3">
                      {category.name}
                    </h3>
                    <p className="text-sm text-gray-600 leading-6 mb-6 min-h-[5rem]">
                      {category.description || `Veyona provides premium ${category.name.toLowerCase()} services with expert care and soothing environments.`}
                    </p>
                    <div className="flex items-center gap-2 text-sm font-semibold text-[var(--accent-terracotta)]">
                      <span>Explore Services</span>
                      <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
                    </div>
                  </div>
                </Link>
              );
            }

            const categoryCard = (
              <>
                {/* Image - Larger to fill space */}
                <div className="relative h-64 sm:h-72 overflow-hidden">
                  <Image
                    src={category.image}
                    alt={category.name}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                  />

                  {/* Overlay */}
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-black/30 transition" />
                </div>

                {/* Content */}
                <div className="p-6">
                  <h3 className="text-xl md:text-2xl font-bold mb-2 line-clamp-2">
                    {category.name}
                  </h3>

                  {category.description && (
                    <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                      {category.description}
                    </p>
                  )}

                  {/* Show children if available */}
                  {showChildren && hasChildren && (
                    <div className="mt-4 space-y-4">
                      {/* Services */}
                      {childrenData.services.length > 0 && (
                        <div>
                          <h4 className="text-sm font-bold text-gray-700 uppercase mb-3 tracking-wide">
                            Services
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {childrenData.services.map((service) => (
                              <Link
                                key={service._id}
                                href={`/book?service=${service._id}`}
                                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-[#F5F0E6] transition-all group border border-transparent hover:border-[var(--accent-brown)]"
                                onClick={(e) => {
                                  if (useLink) {
                                    e.stopPropagation();
                                  }
                                }}
                              >
                                <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-gray-200">
                                  <Image
                                    src={service.image || DEFAULT_IMAGE}
                                    alt={service.name}
                                    fill
                                    className="object-cover group-hover:scale-110 transition-transform"
                                    onError={(e) => {
                                      e.target.src = DEFAULT_IMAGE;
                                    }}
                                  />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-semibold text-gray-800 truncate group-hover:text-[#AD6E5E]">
                                    {service.name}
                                  </div>
                                  <div className="text-xs text-gray-500 mt-0.5">
                                    {service.duration} min
                                  </div>
                                </div>
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Products */}
                      {childrenData.products.length > 0 && (
                        <div>
                          <h4 className="text-sm font-bold text-gray-700 uppercase mb-3 tracking-wide">
                            Products
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {childrenData.products.map((product) => (
                              <a
                                key={product._id}
                                href={`https://wa.me/919009390054?text=${encodeURIComponent(`Hello! I'm interested in purchasing:\n\nProduct: ${product.name}\nPrice: ₹${product.price}${product.description ? `\nDescription: ${product.description}` : ''}\n\nPlease provide more details.`)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-green-50 transition-all group border border-transparent hover:border-green-200"
                                onClick={(e) => {
                                  if (useLink) {
                                    e.stopPropagation();
                                  }
                                }}
                              >
                                <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-gray-200">
                                  <Image
                                    src={product.image || DEFAULT_IMAGE}
                                    alt={product.name}
                                    fill
                                    className="object-cover group-hover:scale-110 transition-transform"
                                    onError={(e) => {
                                      e.target.src = DEFAULT_IMAGE;
                                    }}
                                  />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-semibold text-gray-800 truncate group-hover:text-green-600">
                                    {product.name}
                                  </div>
                                  {product.price != null && (
                                    <div className="flex items-center gap-1.5 mt-0.5 text-xs">
                                      {product.originalPrice != null && product.originalPrice > product.price && (
                                        <span className="text-gray-400 line-through">₹{product.originalPrice}</span>
                                      )}
                                      <span className="font-semibold text-green-700">₹{product.price}</span>
                                    </div>
                                  )}
                                </div>
                              </a>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* View More Link */}
                      {useLink && (
                        <Link
                          href={`/category/${category._id}`}
                          className="block text-center text-sm font-semibold text-[#AD6E5E] hover:text-[#F28F79] mt-4 pt-4 border-t border-gray-200 hover:bg-[#F5F0E6] py-2 rounded-b-lg transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          View All →
                        </Link>
                      )}
                    </div>
                  )}
                </div>
              </>
            );

            if (useLink) {
              return (
                <div
                  key={category._id}
                  className={`group rounded-2xl overflow-hidden bg-white transition-all duration-500
                    ${isActive ? "ring-4 ring-[#AD6E5E] shadow-2xl scale-105" : "hover:shadow-2xl hover:scale-[1.02]"}
                    border border-gray-100 hover:border-[var(--accent-brown)]`}
                >
                  <Link
                    href={`/category/${category._id}`}
                    className="block"
                  >
                    <div className="relative h-64 sm:h-72 overflow-hidden bg-gradient-to-br from-[#F5F0E6] to-[#e8e4dc]">
                      <Image
                        src={category.image}
                        alt={category.name}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-110"
                        priority={false}
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent group-hover:from-black/70 transition" />
                      {/* Category Badge */}
                      <div className="absolute top-4 left-4 px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-bold text-[#AD6E5E] uppercase tracking-wide">
                        {category.name}
                      </div>
                    </div>
                    <div className="p-6 bg-gradient-to-b from-white to-gray-50">
                      <h3 className="text-xl md:text-2xl font-bold mb-2 line-clamp-2 text-gray-900 group-hover:text-[#AD6E5E] transition-colors">
                        {category.name}
                      </h3>
                      <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                        {category.description || `Explore ${category.name} services.`}
                      </p>
                      {/* View More Indicator */}
                      <div className="flex items-center text-[#AD6E5E] font-semibold text-sm group-hover:gap-2 transition-all">
                        <span>Explore Services</span>
                        <span className="ml-1 group-hover:ml-2 transition-all">→</span>
                      </div>
                    </div>
                  </Link>
                  {showChildren && hasChildren && (
                    <div className="px-5 pb-5 bg-white border-t border-gray-100">
                      {childrenData.services.length > 0 && (
                        <div className="mb-4 pt-4">
                          <h4 className="text-xs font-bold text-[#AD6E5E] uppercase mb-3 tracking-wider flex items-center gap-2">
                            <span className="w-1 h-4 bg-[var(--accent-terracotta)] rounded-full"></span>
                            Services
                          </h4>
                          <div className="grid grid-cols-2 gap-x-3 gap-y-2.5">
                            {childrenData.services.map((service, idx) => (
                              <Link
                                key={service._id}
                                href={`/book?service=${service._id}`}
                                className="flex items-center gap-2.5 p-2.5 min-w-0 bg-gradient-to-r from-gray-50 to-[#F5F0E6]/50 rounded-xl hover:from-[#F5F0E6] hover:to-[#e8e4dc] transition-all group border border-gray-200 hover:border-[#AD6E5E]/40 hover:shadow-md"
                                style={{ animationDelay: `${idx * 50}ms` }}
                              >
                                <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-lg overflow-hidden flex-shrink-0 bg-gray-200 ring-2 ring-white group-hover:ring-[#AD6E5E]/30 transition-all">
                                  <Image
                                    src={service.image || DEFAULT_IMAGE}
                                    alt={service.name}
                                    fill
                                    className="object-cover group-hover:scale-110 transition-transform duration-300"
                                    onError={(e) => {
                                      e.target.src = DEFAULT_IMAGE;
                                    }}
                                  />
                                </div>
                                <div className="flex-1 min-w-0 overflow-hidden">
                                  <div className="text-xs sm:text-sm font-semibold text-gray-800 line-clamp-2 group-hover:text-[#AD6E5E] transition-colors leading-tight">
                                    {service.name}
                                  </div>
                                  <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-1 flex-shrink-0">
                                    <span>⏱</span>
                                    <span>{service.duration} min</span>
                                  </div>
                                </div>
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}

                      {childrenData.products.length > 0 && (
                        <div className="mb-4">
                          <h4 className="text-xs font-bold text-green-600 uppercase mb-3 tracking-wider flex items-center gap-2">
                            <span className="w-1 h-4 bg-green-600 rounded-full"></span>
                            Products
                          </h4>
                          <div className="grid grid-cols-2 gap-x-3 gap-y-2.5">
                            {childrenData.products.map((product, idx) => (
                              <a
                                key={product._id}
                                href={`https://wa.me/919009390054?text=${encodeURIComponent(`Hello! I'm interested in purchasing:\n\nProduct: ${product.name}\nPrice: ₹${product.price}${product.description ? `\nDescription: ${product.description}` : ''}\n\nPlease provide more details.`)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2.5 p-2.5 min-w-0 bg-gradient-to-r from-gray-50 to-green-50/30 rounded-xl hover:from-green-50 hover:to-green-100 transition-all group border border-gray-200 hover:border-green-300 hover:shadow-md"
                                style={{ animationDelay: `${idx * 50}ms` }}
                              >
                                <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-lg overflow-hidden flex-shrink-0 bg-gray-200 ring-2 ring-white group-hover:ring-green-200 transition-all">
                                  <Image
                                    src={product.image || DEFAULT_IMAGE}
                                    alt={product.name}
                                    fill
                                    className="object-cover group-hover:scale-110 transition-transform duration-300"
                                    onError={(e) => {
                                      e.target.src = DEFAULT_IMAGE;
                                    }}
                                  />
                                </div>
                                <div className="flex-1 min-w-0 overflow-hidden">
                                  <div className="text-xs sm:text-sm font-semibold text-gray-800 line-clamp-2 group-hover:text-green-600 transition-colors leading-tight">
                                    {product.name}
                                  </div>
                                  {product.price != null && (
                                    <div className="text-xs mt-0.5 flex items-center gap-1 flex-shrink-0">
                                      {product.originalPrice != null && product.originalPrice > product.price && (
                                        <span className="text-gray-400 line-through">₹{product.originalPrice}</span>
                                      )}
                                      <span className="font-semibold text-green-700">₹{product.price}</span>
                                    </div>
                                  )}
                                  <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-1 flex-shrink-0">
                                    <span>🛒</span>
                                    <span>Buy Now</span>
                                  </div>
                                </div>
                              </a>
                            ))}
                          </div>
                        </div>
                      )}

                      <Link
                        href={`/category/${category._id}`}
                        className="block text-center text-sm font-semibold text-[#AD6E5E] hover:text-[#F28F79] mt-4 pt-4 border-t-2 border-gray-200 hover:bg-gradient-to-r hover:from-[#F5F0E6] hover:to-[#e8e4dc] py-3 rounded-xl transition-all transform hover:scale-[1.02] hover:shadow-sm"
                      >
                        <span className="flex items-center justify-center gap-2">
                          View All Services & Products
                          <span className="text-lg">→</span>
                        </span>
                </Link>
                    </div>
                  )}
                </div>
              );
            }

            return (
              <div
                key={category._id}
                onClick={() => handleCategoryClick(category)}
                className={`group rounded-2xl overflow-hidden bg-white cursor-pointer transition-all duration-300
                  ${isActive ? "ring-4 ring-[#AD6E5E] shadow-xl" : "hover:shadow-xl"}`}
              >
                {categoryCard}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
