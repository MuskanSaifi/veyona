"use client";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function UserReferPage() {
  const router = useRouter();
  const msg =
    "Hey! Try Veyona for salon & clinic services.\n\nBook here: https://veyona.in/\n\nGreat professionals, easy booking.";
  return (
    <div className="max-w-3xl mx-auto px-4 md:px-6 py-10">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-extrabold text-slate-900">Refer a friend</h1>
        <p className="text-slate-600 mt-2">Share this message on WhatsApp.</p>
        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-slate-800 text-sm">
          {msg}
        </div>
        <div className="mt-5 flex gap-3 flex-wrap">
          <a
            className="rounded-xl bg-blue-600 text-white font-bold px-5 py-3 hover:bg-blue-700"
            href={`https://wa.me/?text=${encodeURIComponent(msg)}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Share on WhatsApp
          </a>
          <button
            className="rounded-xl bg-slate-100 text-slate-800 font-bold px-5 py-3 hover:bg-slate-200"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(msg);
                toast.success("Copied");
              } catch {
                toast.error("Could not copy");
              }
            }}
          >
            Copy text
          </button>
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

