"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function UserOrdersPage() {
  const router = useRouter();
  useEffect(() => {
    // If you later add product orders, replace this page with real data.
  }, []);
  return (
    <div className="max-w-3xl mx-auto px-4 md:px-6 py-10">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-extrabold text-slate-900">My orders</h1>
        <p className="text-slate-600 mt-2">
          Orders feature will appear here once product checkout is enabled.
        </p>
        <button
          className="mt-6 rounded-xl bg-blue-600 text-white font-bold px-5 py-3 hover:bg-blue-700"
          onClick={() => router.push("/")}
        >
          Go to Home
        </button>
      </div>
    </div>
  );
}

