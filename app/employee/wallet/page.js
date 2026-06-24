"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import toast from "react-hot-toast";
import {
  FaArrowLeft,
  FaWallet,
  FaPlus,
  FaShoppingBag,
  FaCreditCard,
} from "react-icons/fa";
import { groupBuyableProductsByCategory } from "@/lib/productCatalog";

const DEFAULT_IMAGE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Crect fill='%23e5e7eb' width='200' height='200'/%3E%3Ctext fill='%239ca3af' font-family='sans-serif' font-size='14' x='50%25' y='50%25' text-anchor='middle' dy='.3em'%3ENo Image%3C/text%3E%3C/svg%3E";

function formatCurrency(n) {
  const v = Number(n) || 0;
  return `₹${v.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return "—";
  }
}

const PURCHASE_STATUS = {
  completed: { label: "Deducted", className: "bg-emerald-100 text-emerald-800" },
  pending: { label: "Pending", className: "bg-amber-100 text-amber-800" },
  cancelled: { label: "Rejected", className: "bg-slate-200 text-slate-600" },
};

export default function EmployeeWalletPage() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [productGroups, setProductGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [paying, setPaying] = useState(false);
  const [razorpayReady, setRazorpayReady] = useState(false);
  const [activeForm, setActiveForm] = useState(null); // "add" | "purchase"
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [purchaseSubmitting, setPurchaseSubmitting] = useState(null);
  const [purchaseHistory, setPurchaseHistory] = useState([]);
  const [purchaseSummary, setPurchaseSummary] = useState(null);
  const [purchasesLoading, setPurchasesLoading] = useState(true);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [monthFilter, setMonthFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const loadWallet = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/employee/wallet", { cache: "no-store" });
      if (res.status === 401) {
        router.push("/employee/login");
        return;
      }
      const json = await res.json();
      setData(json);
    } finally {
      setLoading(false);
    }
  }, [router]);

  const loadProducts = useCallback(async () => {
    setProductsLoading(true);
    try {
      const res = await fetch("/api/product?includeChildren=true", { cache: "no-store" });
      const list = await res.json();
      const active = Array.isArray(list) ? list.filter((p) => p.active) : [];
      setProductGroups(groupBuyableProductsByCategory(active));
    } catch {
      setProductGroups([]);
    } finally {
      setProductsLoading(false);
    }
  }, []);

  const loadPurchases = useCallback(async (overrides = {}) => {
    setPurchasesLoading(true);
    try {
      const params = new URLSearchParams();
      const from = overrides.from !== undefined ? overrides.from : fromDate;
      const to = overrides.to !== undefined ? overrides.to : toDate;
      const month = overrides.month !== undefined ? overrides.month : monthFilter;
      const status = overrides.status !== undefined ? overrides.status : statusFilter;

      if (month) params.set("month", month);
      else {
        if (from) params.set("from", from);
        if (to) params.set("to", to);
      }
      if (status && status !== "all") params.set("status", status);

      const res = await fetch(`/api/employee/wallet/purchases?${params.toString()}`, {
        cache: "no-store",
      });
      if (res.status === 401) {
        router.push("/employee/login");
        return;
      }
      const json = await res.json();
      setPurchaseHistory(json.purchases || []);
      setPurchaseSummary(json.summary || null);
    } finally {
      setPurchasesLoading(false);
    }
  }, [fromDate, toDate, monthFilter, statusFilter, router]);

  useEffect(() => {
    loadWallet();
    loadProducts();
  }, [loadWallet, loadProducts]);

  useEffect(() => {
    loadPurchases({ from: "", to: "", month: "", status: "all" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.Razorpay) {
      setRazorpayReady(true);
      return;
    }
    const existing = document.querySelector(
      'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
    );
    if (existing) {
      existing.addEventListener("load", () => setRazorpayReady(true));
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => setRazorpayReady(true);
    document.body.appendChild(script);
  }, []);

  const resetForm = () => {
    setAmount("");
    setDescription("");
    setActiveForm(null);
  };

  const handleRazorpayPay = async () => {
    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount < 1) {
      toast.error("Minimum online payment is ₹1");
      return;
    }
    if (!razorpayReady || !window.Razorpay) {
      toast.error("Payment gateway is loading, please try again");
      return;
    }

    setPaying(true);
    try {
      const orderRes = await fetch("/api/employee/wallet/razorpay/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: numericAmount }),
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
        name: "Veyona",
        description: "Wallet top-up",
        order_id: orderData.orderId,
        prefill: {
          name: orderData.employee?.name || "",
          email: orderData.employee?.email || "",
          contact: orderData.employee?.phone || "",
        },
        handler: async (response) => {
          try {
            const verifyRes = await fetch("/api/employee/wallet/razorpay/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                transactionId: orderData.transactionId,
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
            toast.success("Payment successful — wallet updated");
            resetForm();
            await loadWallet();
          } catch {
            toast.error("Payment verification failed");
          }
        },
        modal: {
          ondismiss: () => toast.error("Payment cancelled"),
        },
        theme: { color: "#0d9488" },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch {
      toast.error("Could not open payment gateway");
    } finally {
      setPaying(false);
    }
  };

  const handleManualPurchaseSubmit = async (e) => {
    e.preventDefault();
    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      toast.error("Enter a valid amount");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/employee/wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "product_purchase",
          amount: numericAmount,
          description,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.message || "Could not save");
        return;
      }
      toast.success("Purchase sent to admin for deduction");
      resetForm();
      await loadWallet();
    } catch {
      toast.error("Network error");
    } finally {
      setSaving(false);
    }
  };

  const handleProductPurchase = async (product) => {
    if (!confirm(`Request purchase of "${product.pathLabel || product.name}" for ${formatCurrency(product.price)}?`)) {
      return;
    }

    setPurchaseSubmitting(product._id);
    try {
      const res = await fetch("/api/employee/wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "product_purchase",
          productId: product._id,
          description: product.pathLabel || product.name,
          amount: product.price,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.message || "Could not submit purchase");
        return;
      }
      toast.success("Purchase sent to admin");
      await Promise.all([loadWallet(), loadPurchases()]);
    } catch {
      toast.error("Network error");
    } finally {
      setPurchaseSubmitting(null);
    }
  };

  const totalProducts = useMemo(
    () => productGroups.reduce((n, g) => n + g.products.length, 0),
    [productGroups]
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500">
        Loading…
      </div>
    );
  }

  const balance = data?.balance || 0;
  const totalEarnings = data?.totalEarnings || 0;

  const applyPurchaseFilters = () => {
    loadPurchases();
  };

  const clearPurchaseFilters = () => {
    setFromDate("");
    setToDate("");
    setMonthFilter("");
    setStatusFilter("all");
    loadPurchases({ from: "", to: "", month: "", status: "all" });
  };

  const onMonthChange = (value) => {
    setMonthFilter(value);
    if (value) {
      setFromDate("");
      setToDate("");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto px-4 py-6 sm:py-10">
        <Link
          href="/employee/dashboard"
          className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 mb-6"
        >
          <FaArrowLeft /> Back to dashboard
        </Link>

        <h1 className="text-2xl font-bold text-slate-900 mb-1 flex items-center gap-2">
          <FaWallet className="text-teal-600" /> My Wallet
        </h1>
        <p className="text-slate-500 text-sm mb-6">
          Add funds online via Razorpay, or buy products from our catalog. Cash deposits are added by admin only.
        </p>

        <div className="bg-gradient-to-br from-teal-600 to-emerald-700 text-white rounded-2xl p-6 shadow-md mb-5">
          <div className="text-xs uppercase tracking-wider opacity-80 mb-1">
            Total earnings
          </div>
          <div className="text-4xl font-bold">{formatCurrency(totalEarnings)}</div>
          <div className="mt-4 pt-4 border-t border-white/20">
            <div className="text-xs opacity-80">Available balance</div>
            <div className="text-2xl font-bold">{formatCurrency(balance)}</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <button
            type="button"
            onClick={() => {
              resetForm();
              setActiveForm("add");
            }}
            className={`flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm transition ${
              activeForm === "add"
                ? "bg-teal-600 text-white shadow-md"
                : "bg-white border border-slate-200 text-slate-800 hover:border-teal-300"
            }`}
          >
            <FaPlus /> Add funds online
          </button>
          <button
            type="button"
            onClick={() => {
              resetForm();
              setActiveForm("purchase");
            }}
            className={`flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm transition ${
              activeForm === "purchase"
                ? "bg-rose-600 text-white shadow-md"
                : "bg-white border border-slate-200 text-slate-800 hover:border-rose-300"
            }`}
          >
            <FaShoppingBag /> Other purchase
          </button>
        </div>

        {activeForm === "add" && (
          <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-6 space-y-4">
            <h2 className="font-semibold text-slate-900">Add funds online</h2>
            <p className="text-xs text-slate-500">
              Pay securely via Razorpay. Balance updates automatically after payment.
            </p>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Amount (₹)
              </label>
              <input
                type="number"
                min="1"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={resetForm}
                className="flex-1 py-2.5 rounded-lg border border-slate-200 text-slate-700 text-sm font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRazorpayPay}
                disabled={paying || !razorpayReady}
                className="flex-1 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold disabled:opacity-60 flex items-center justify-center gap-2"
              >
                <FaCreditCard />
                {paying ? "Opening…" : "Pay with Razorpay"}
              </button>
            </div>
          </div>
        )}

        {activeForm === "purchase" && (
          <form
            onSubmit={handleManualPurchaseSubmit}
            className="bg-white rounded-2xl border border-slate-200 p-5 mb-6 space-y-4"
          >
            <h2 className="font-semibold text-slate-900">Report other purchase</h2>
            <p className="text-xs text-slate-500 -mt-2">
              For items not listed below. Admin will deduct from your wallet.
            </p>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Amount (₹)</label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Details</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                maxLength={500}
                placeholder="Product name or details"
                className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm resize-none"
                required
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={resetForm}
                className="flex-1 py-2.5 rounded-lg border border-slate-200 text-slate-700 text-sm font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 py-2.5 rounded-lg bg-slate-900 text-white text-sm font-semibold disabled:opacity-60"
              >
                {saving ? "Saving…" : "Submit"}
              </button>
            </div>
          </form>
        )}

        {/* Products catalog */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden mb-6">
          <div className="px-4 py-3 border-b border-slate-100 bg-[color:var(--bg-cream,#faf8f5)]">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--accent-brown,#8b5e3c)]">
              Our products
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {productsLoading ? "Loading…" : `${totalProducts} products available`}
            </p>
          </div>

          {productsLoading ? (
            <div className="p-10 text-center text-slate-400">Loading products…</div>
          ) : productGroups.length === 0 ? (
            <div className="p-10 text-center text-slate-400">No products available.</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {productGroups.map((group) => (
                <div key={group.categoryId} className="p-4">
                  <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-800 mb-3 px-1 border-l-4 border-[var(--accent-terracotta,#c67b5c)] pl-3">
                    {group.categoryName}
                  </h3>
                  <ul className="space-y-2">
                    {group.products.map((product) => {
                      const showPath =
                        product.pathLabel && product.pathLabel !== product.name;
                      return (
                        <li
                          key={product._id}
                          className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-100 hover:border-[var(--accent-terracotta)] hover:bg-slate-50 transition"
                        >
                          <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-gray-100 shrink-0 border border-slate-200">
                            <Image
                              src={product.image || DEFAULT_IMAGE}
                              alt={product.name}
                              fill
                              className="object-cover"
                              sizes="56px"
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-semibold text-sm text-slate-900 truncate">
                              {product.name}
                            </div>
                            {showPath && (
                              <div className="text-[11px] text-slate-500 truncate">
                                {product.pathLabel}
                              </div>
                            )}
                            <div className="text-sm font-bold text-emerald-600 mt-0.5">
                              {formatCurrency(product.price)}
                            </div>
                          </div>
                          <button
                            type="button"
                            disabled={purchaseSubmitting === product._id}
                            onClick={() => handleProductPurchase(product)}
                            className="shrink-0 px-3 py-2 bg-rose-600 text-white text-xs font-bold rounded-lg hover:bg-rose-700 disabled:opacity-50"
                          >
                            {purchaseSubmitting === product._id ? "…" : "Buy"}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Purchase history */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-900">My purchase history</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              All products you requested — filter by date or month
            </p>
          </div>

          <div className="p-4 border-b border-slate-100 bg-slate-50 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-500 mb-1">Month</label>
                <input
                  type="month"
                  value={monthFilter}
                  onChange={(e) => onMonthChange(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white"
                >
                  <option value="all">All</option>
                  <option value="completed">Deducted</option>
                  <option value="pending">Pending</option>
                  <option value="cancelled">Rejected</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">From date</label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => {
                    setFromDate(e.target.value);
                    if (e.target.value) setMonthFilter("");
                  }}
                  disabled={Boolean(monthFilter)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white disabled:opacity-50"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">To date</label>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => {
                    setToDate(e.target.value);
                    if (e.target.value) setMonthFilter("");
                  }}
                  disabled={Boolean(monthFilter)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white disabled:opacity-50"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={applyPurchaseFilters}
                className="px-4 py-2 bg-teal-600 text-white text-sm font-semibold rounded-lg"
              >
                Apply filter
              </button>
              <button
                type="button"
                onClick={clearPurchaseFilters}
                className="px-4 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-semibold rounded-lg"
              >
                Clear
              </button>
            </div>
            {purchaseSummary && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                <div className="bg-white rounded-lg p-2 border border-slate-200">
                  <div className="text-[10px] uppercase text-slate-500">Records</div>
                  <div className="font-bold text-slate-900">{purchaseSummary.count}</div>
                </div>
                <div className="bg-white rounded-lg p-2 border border-emerald-200">
                  <div className="text-[10px] uppercase text-emerald-600">Deducted</div>
                  <div className="font-bold text-emerald-700">
                    {formatCurrency(purchaseSummary.completedTotal)}
                  </div>
                </div>
                <div className="bg-white rounded-lg p-2 border border-amber-200">
                  <div className="text-[10px] uppercase text-amber-600">Pending</div>
                  <div className="font-bold text-amber-700">
                    {formatCurrency(purchaseSummary.pendingTotal)}
                  </div>
                </div>
                <div className="bg-white rounded-lg p-2 border border-slate-200">
                  <div className="text-[10px] uppercase text-slate-500">Rejected</div>
                  <div className="font-bold text-slate-600">
                    {formatCurrency(purchaseSummary.cancelledTotal)}
                  </div>
                </div>
              </div>
            )}
          </div>

          {purchasesLoading ? (
            <div className="p-10 text-center text-slate-400">Loading purchases…</div>
          ) : purchaseHistory.length === 0 ? (
            <div className="p-10 text-center text-slate-400">No purchases in this period.</div>
          ) : (
            <ul className="divide-y divide-slate-100 max-h-[420px] overflow-y-auto">
              {purchaseHistory.map((p) => {
                const st = PURCHASE_STATUS[p.status] || PURCHASE_STATUS.pending;
                return (
                  <li key={p._id} className="px-4 py-3 hover:bg-slate-50">
                    <div className="flex justify-between gap-2 items-start">
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-slate-900 break-words">
                          {p.description}
                        </div>
                        <div className="text-xs text-slate-500 mt-1">{formatDate(p.createdAt)}</div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-sm font-bold text-rose-600">
                          −{formatCurrency(p.amount)}
                        </div>
                        <span
                          className={`inline-block mt-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${st.className}`}
                        >
                          {st.label}
                        </span>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
