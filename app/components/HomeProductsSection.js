"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { FaShoppingCart } from "react-icons/fa";

// Default placeholder image
const DEFAULT_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Crect fill='%23e5e7eb' width='200' height='200'/%3E%3Ctext fill='%239ca3af' font-family='sans-serif' font-size='14' x='50%25' y='50%25' text-anchor='middle' dy='.3em'%3ENo Image%3C/text%3E%3C/svg%3E";

export default function HomeProductsSection({ typeFilter }) {
  const [categories, setCategories] = useState([]);
  const [productsByCategory, setProductsByCategory] = useState(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, [typeFilter]);

  useEffect(() => {
    if (categories.length > 0) {
      fetchAllProducts();
    }
  }, [categories]);

  const fetchCategories = async () => {
    try {
      const res = await fetch(`/api/category?type=${typeFilter}`);
      const data = await res.json();
      const active = data.filter((c) => c.active);
      setCategories(active);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAllProducts = async () => {
    try {
      setLoading(true);
      const productsMap = new Map();

      await Promise.all(
        categories.map(async (category) => {
          try {
            const res = await fetch(
              `/api/product?categoryId=${category._id}&includeChildren=true`
            );
            const data = await res.json();
            const activeProducts = data.filter((p) => p.active);
            const buyableProducts = activeProducts.filter(
              (p) => p.price && p.price > 0 && !p.parentProduct
            );
            if (buyableProducts.length > 0) {
              productsMap.set(category._id, {
                category,
                products: buyableProducts.slice(0, 6), // Show max 6 products per category
              });
            }
          } catch (error) {
            console.error(`Error fetching products for category ${category._id}:`, error);
          }
        })
      );

      setProductsByCategory(productsMap);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="w-full py-16 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
            <p className="mt-4 text-gray-600">Loading products...</p>
          </div>
        </div>
      </section>
    );
  }

  if (productsByCategory.size === 0) {
    return null;
  }

  return (
    <section className="w-full py-16 bg-gradient-to-b from-gray-50 to-white" id="products">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Our Products
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-green-600 to-emerald-600 mx-auto rounded-full mb-6"></div>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Discover our premium range of products designed for your wellness
          </p>
        </div>

        {/* Products by Category */}
        <div className="space-y-16">
          {Array.from(productsByCategory.values()).map(({ category, products }) => (
            <div key={category._id}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl md:text-3xl font-bold text-gray-900">
                  {category.name}
                </h3>
                <Link
                  href={`/category/${category._id}#products`}
                  className="text-green-600 hover:text-green-700 font-semibold text-sm md:text-base flex items-center gap-2"
                >
                  View All
                  <span>→</span>
                </Link>
              </div>

              {/* Products Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {products.map((product) => (
                  <div
                    key={product._id}
                    className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 group"
                  >
                    {/* Product Image */}
                    <div className="relative h-48 overflow-hidden bg-gray-100">
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

                    {/* Product Info */}
                    <div className="p-5">
                      <h4 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                        {product.name}
                      </h4>
                      {product.description && (
                        <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                          {product.description}
                        </p>
                      )}
                      {product.price != null && (
                        <div className="flex items-center gap-2 mb-3">
                          {product.originalPrice != null && product.originalPrice > product.price && (
                            <span className="text-sm text-gray-400 line-through">₹{product.originalPrice}</span>
                          )}
                          <span className="text-lg font-semibold text-green-700">₹{product.price}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-end">
                        <a
                          href={`https://wa.me/919009390054?text=${encodeURIComponent(`Hello! I'm interested in purchasing:\n\nProduct: ${product.name}\nPrice: ₹${product.price}${product.description ? `\nDescription: ${product.description}` : ''}\n\nPlease provide more details.`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-lg hover:shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center gap-2 text-sm"
                        >
                          <FaShoppingCart className="w-4 h-4" />
                          Buy
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

