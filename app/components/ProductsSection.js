"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { FaChevronDown, FaChevronRight, FaShoppingCart } from "react-icons/fa";

// Default placeholder image - using a data URL as fallback
const DEFAULT_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Crect fill='%23e5e7eb' width='200' height='200'/%3E%3Ctext fill='%239ca3af' font-family='sans-serif' font-size='14' x='50%25' y='50%25' text-anchor='middle' dy='.3em'%3ENo Image%3C/text%3E%3C/svg%3E";

export default function ProductsSection({ category, typeFilter }) {
  const [products, setProducts] = useState([]);
  const [expandedProducts, setExpandedProducts] = useState(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (category) {
      fetchProducts();
    }
  }, [category?._id, typeFilter]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/product?categoryId=${category._id}&includeChildren=true`);
      const data = await res.json();
      const activeProducts = data.filter((p) => p.active);
      setProducts(activeProducts);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  // Group products by parent
  const organizeProducts = () => {
    const parentProducts = products.filter((p) => !p.parentProduct);
    const childProductsMap = new Map();

    products.forEach((product) => {
      if (product.parentProduct) {
        const parentId =
          typeof product.parentProduct === "string"
            ? product.parentProduct
            : product.parentProduct._id;

        if (!childProductsMap.has(parentId)) {
          childProductsMap.set(parentId, []);
        }
        childProductsMap.get(parentId).push(product);
      }
    });

    return { parentProducts, childProductsMap };
  };

  const toggleProduct = (productId) => {
    const newExpanded = new Set(expandedProducts);
    if (newExpanded.has(productId)) {
      newExpanded.delete(productId);
    } else {
      newExpanded.add(productId);
    }
    setExpandedProducts(newExpanded);
  };

  // Check if product is buyable (has price)
  const isBuyable = (product) => {
    return product.price && product.price > 0;
  };

  const { parentProducts, childProductsMap } = organizeProducts();

  if (loading) {
    return (
      <section className="w-full py-16 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--accent-terracotta)]"></div>
            <p className="mt-4 text-gray-600">Loading products...</p>
          </div>
        </div>
      </section>
    );
  }

  if (parentProducts.length === 0) {
    return null;
  }

  return (
    <section className="w-full py-16 bg-gradient-to-b from-gray-50 to-white" id="products">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            {category?.name || "Our Products"}
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-green-600 to-emerald-600 mx-auto rounded-full"></div>
        </div>

        {/* Products Grid */}
        <div className="space-y-4">
          {parentProducts.map((parentProduct) => {
            const children = childProductsMap.get(parentProduct._id) || [];
            const hasChildren = children.length > 0;
            const isExpanded = expandedProducts.has(parentProduct._id);
            const canBuy = isBuyable(parentProduct);

            return (
              <div
                key={parentProduct._id}
                className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100"
              >
                {/* Parent Product Header */}
                <div
                  className={`p-6 cursor-pointer ${
                    hasChildren ? "hover:bg-gray-50" : ""
                  } transition-colors`}
                  onClick={() => hasChildren && toggleProduct(parentProduct._id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100">
                        <Image
                          src={parentProduct.image || DEFAULT_IMAGE}
                          alt={parentProduct.name}
                          fill
                          className="object-cover"
                          onError={(e) => {
                            e.target.src = DEFAULT_IMAGE;
                          }}
                        />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
                          {parentProduct.name}
                        </h3>
                        {parentProduct.description && (
                          <p className="text-gray-600 text-sm md:text-base line-clamp-2">
                            {parentProduct.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {canBuy && (
                        <button
                          className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-lg hover:shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center gap-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            const message = `Hello! I'm interested in purchasing:\n\nProduct: ${parentProduct.name}\nPrice: ₹${parentProduct.price}${parentProduct.description ? `\nDescription: ${parentProduct.description}` : ''}\n\nPlease provide more details.`;
                            window.open(`https://wa.me/919009390054?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
                          }}
                        >
                          <FaShoppingCart className="w-4 h-4" />
                          Buy Now
                        </button>
                      )}
                      {hasChildren && (
                        <div className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                          {isExpanded ? (
                            <FaChevronDown className="w-6 h-6 text-gray-700" />
                          ) : (
                            <FaChevronRight className="w-6 h-6 text-gray-700" />
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Children Products */}
                {hasChildren && isExpanded && (
                  <div className="border-t border-gray-100 bg-gray-50">
                    <div className="p-6 space-y-4">
                      {children.map((child, index) => {
                        const grandChildren =
                          childProductsMap.get(
                            typeof child._id === "string"
                              ? child._id
                              : child._id.toString()
                          ) || [];
                        const hasGrandChildren = grandChildren.length > 0;
                        const isChildExpanded = expandedProducts.has(
                          typeof child._id === "string" ? child._id : child._id.toString()
                        );
                        const canBuyChild = isBuyable(child);

                        return (
                          <div
                            key={child._id || index}
                            className="bg-white rounded-xl p-4 border border-gray-200 hover:border-green-300 transition-all"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3 flex-1">
                                <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
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
                                <div className="w-2 h-2 rounded-full bg-green-600 flex-shrink-0"></div>
                                <div className="flex-1">
                                  <h4 className="text-lg font-semibold text-gray-900 mb-1">
                                    {child.name}
                                  </h4>
                                  {child.description && (
                                    <p className="text-sm text-gray-600 line-clamp-1">
                                      {child.description}
                                    </p>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-3">
                                {canBuyChild && (
                                  <button
                                    className="px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transform hover:scale-105 transition-all duration-200 text-sm flex items-center gap-2"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const message = `Hello! I'm interested in purchasing:\n\nProduct: ${child.name}\nPrice: ₹${child.price}${child.description ? `\nDescription: ${child.description}` : ''}\n\nPlease provide more details.`;
                                      window.open(`https://wa.me/919009390054?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
                                    }}
                                  >
                                    <FaShoppingCart className="w-3 h-3" />
                                    Buy
                                  </button>
                                )}
                                {hasGrandChildren && (
                                  <button
                                    onClick={() =>
                                      toggleProduct(
                                        typeof child._id === "string"
                                          ? child._id
                                          : child._id.toString()
                                      )
                                    }
                                    className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                                  >
                                    {isChildExpanded ? (
                                      <FaChevronDown className="w-4 h-4 text-gray-700" />
                                    ) : (
                                      <FaChevronRight className="w-4 h-4 text-gray-700" />
                                    )}
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Grand Children Products */}
                            {hasGrandChildren && isChildExpanded && (
                              <div className="mt-4 ml-6 space-y-2 border-l-2 border-green-200 pl-4">
                                {grandChildren.map((grandChild, gIndex) => {
                                  const canBuyGrandChild = isBuyable(grandChild);
                                  return (
                                    <div
                                      key={grandChild._id || gIndex}
                                      className="bg-gray-50 rounded-lg p-3 border border-gray-200 flex items-center justify-between gap-3"
                                    >
                                      <div className="flex items-center gap-3 flex-1">
                                        <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
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
                                        <div className="flex-1">
                                          <h5 className="text-base font-medium text-gray-800">
                                            {grandChild.name}
                                          </h5>
                                          {grandChild.description && (
                                            <p className="text-xs text-gray-600 mt-1">
                                              {grandChild.description}
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                      {canBuyGrandChild && (
                                        <button
                                          className="px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 transform hover:scale-105 transition-all duration-200 flex items-center gap-1.5"
                                          onClick={() => {
                                            const message = `Hello! I'm interested in purchasing:\n\nProduct: ${grandChild.name}\nPrice: ₹${grandChild.price}${grandChild.description ? `\nDescription: ${grandChild.description}` : ''}\n\nPlease provide more details.`;
                                            window.open(`https://wa.me/919009390054?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
                                          }}
                                        >
                                          <FaShoppingCart className="w-3 h-3" />
                                          Buy
                                        </button>
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

