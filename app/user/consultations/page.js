"use client";
import { useRouter } from "next/navigation";

export default function UserConsultationsPage() {
  const router = useRouter();
  return (
    <div className="max-w-3xl mx-auto px-4 md:px-6 py-10">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-extrabold text-slate-900">My consultations</h1>
        <p className="text-slate-600 mt-2">
          Your booked services and consultations are shown in your dashboard.
        </p>
        <button
          className="mt-6 rounded-xl bg-blue-600 text-white font-bold px-5 py-3 hover:bg-blue-700"
          onClick={() => router.push("/user/dashboard")}
        >
          Open Dashboard
        </button>
      </div>
    </div>
  );
}

