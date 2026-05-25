"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  FaArrowLeft,
  FaArrowUp,
  FaArrowDown,
  FaWallet,
  FaCircle,
} from "react-icons/fa";

const CATEGORY_LABELS = {
  service_commission: "Service commission",
  bonus: "Bonus",
  incentive: "Incentive",
  tip: "Tip",
  penalty: "Penalty",
  withdrawal: "Withdrawal",
  adjustment: "Adjustment",
  refund: "Refund",
  other: "Other",
};

const STATUS_STYLES = {
  completed: { bg: "bg-emerald-100", text: "text-emerald-800" },
  pending: { bg: "bg-amber-100", text: "text-amber-800" },
  cancelled: { bg: "bg-slate-200", text: "text-slate-600" },
};

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

function formatCurrency(n) {
  const v = Number(n) || 0;
  return `₹${v.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default function EmployeeWalletPage() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/employee/wallet?limit=200", {
          cache: "no-store",
        });
        if (res.status === 401) {
          router.push("/employee/login");
          return;
        }
        const json = await res.json();
        setData(json);
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  const filtered = useMemo(() => {
    const list = data?.transactions || [];
    if (filter === "all") return list;
    return list.filter((t) => t.type === filter);
  }, [data, filter]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500">
        Loading…
      </div>
    );
  }

  const balance = data?.balance || 0;
  const totalCredit = data?.totalCredit || 0;
  const totalDebit = data?.totalDebit || 0;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto px-4 py-6 sm:py-10">
        <Link
          href="/employee/dashboard"
          className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 mb-6"
        >
          <FaArrowLeft /> Back to dashboard
        </Link>

        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-1 flex items-center gap-3">
          <FaWallet className="text-blue-600" /> My wallet
        </h1>
        <p className="text-slate-500 mb-6">
          Track your earnings, bonuses and deductions.
        </p>

        {/* Balance card */}
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-2xl p-6 sm:p-8 shadow-md mb-5">
          <div className="text-xs uppercase tracking-wider opacity-80 mb-1">
            Current balance
          </div>
          <div className="text-4xl sm:text-5xl font-bold">
            {formatCurrency(balance)}
          </div>
          <div className="text-xs opacity-80 mt-2">
            {data?.count || 0} transactions
          </div>
        </div>

        {/* Credit / Debit totals */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-white rounded-2xl p-4 border border-slate-200">
            <div className="text-xs uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-2">
              <FaArrowUp className="text-emerald-500" /> Credits
            </div>
            <div className="text-xl sm:text-2xl font-bold text-emerald-600">
              {formatCurrency(totalCredit)}
            </div>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-slate-200">
            <div className="text-xs uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-2">
              <FaArrowDown className="text-rose-500" /> Debits
            </div>
            <div className="text-xl sm:text-2xl font-bold text-rose-600">
              {formatCurrency(totalDebit)}
            </div>
          </div>
        </div>

        {/* Transactions */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <div className="text-sm font-semibold text-slate-700">
              Transactions
            </div>
            <div className="flex items-center gap-1 text-xs">
              {["all", "credit", "debit"].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                    filter === f
                      ? "bg-blue-600 text-white"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {f[0].toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="p-10 text-center text-slate-400">
              No transactions yet.
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {filtered.map((t) => {
                const isCredit = t.type === "credit";
                const status = STATUS_STYLES[t.status] || STATUS_STYLES.completed;
                return (
                  <li
                    key={t._id}
                    className="px-4 py-4 flex items-start gap-3 hover:bg-slate-50"
                  >
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                        isCredit
                          ? "bg-emerald-100 text-emerald-600"
                          : "bg-rose-100 text-rose-600"
                      }`}
                    >
                      {isCredit ? <FaArrowUp /> : <FaArrowDown />}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="font-semibold text-slate-900">
                          {CATEGORY_LABELS[t.category] || t.category}
                        </div>
                        <div
                          className={`font-bold ${
                            isCredit ? "text-emerald-600" : "text-rose-600"
                          }`}
                        >
                          {isCredit ? "+" : "−"}
                          {formatCurrency(t.amount)}
                        </div>
                      </div>
                      {t.description ? (
                        <div className="text-sm text-slate-600 mt-0.5 break-words">
                          {t.description}
                        </div>
                      ) : null}
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-1.5">
                        <span>{formatDate(t.createdAt)}</span>
                        <FaCircle className="text-[4px] text-slate-300" />
                        <span
                          className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${status.bg} ${status.text}`}
                        >
                          {t.status}
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
