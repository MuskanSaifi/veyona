"use client";
import { useRouter } from "next/navigation";

export default function UserRatePage() {
  const router = useRouter();
  return (
    <div className="max-w-3xl mx-auto px-4 md:px-6 py-10">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-extrabold text-slate-900">Rate us</h1>
        <p className="text-slate-600 mt-2">
          Thanks! You can leave a review after your appointment, or share your feedback with us on WhatsApp.
        </p>
        <div className="mt-6 flex gap-3 flex-wrap">
          <a
            className="rounded-xl bg-blue-600 text-white font-bold px-5 py-3 hover:bg-blue-700"
            href={`https://wa.me/919009390054?text=${encodeURIComponent("Hi Veyona team! I want to share feedback about my experience.")}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Send feedback on WhatsApp
          </a>
          <button
            className="rounded-xl bg-slate-100 text-slate-800 font-bold px-5 py-3 hover:bg-slate-200"
            onClick={() => router.push("/")}
          >
            Back
          </button>
        </div>
      </div>
    </div>
  );
}

