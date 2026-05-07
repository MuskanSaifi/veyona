"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import LocationPickerModal from "@/app/components/LocationPickerModal";

export default function UserAddressesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [items, setItems] = useState([]); // { label, address }
  const [defaultIndex, setDefaultIndex] = useState(0);
  const [mapIndex, setMapIndex] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/user/me");
        if (res.status === 401) {
          router.push("/user/login");
          return;
        }
        const data = await res.json();
        setItems(Array.isArray(data.user?.savedAddresses) ? data.user.savedAddresses : []);
        setDefaultIndex(Number.isFinite(data.user?.defaultAddressIndex) ? data.user.defaultAddressIndex : 0);
      } catch {
        toast.error("Could not load addresses");
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  const canSave = useMemo(() => {
    return items.every((x) => (x?.address || "").trim().length > 0);
  }, [items]);

  const save = async () => {
    if (!canSave) {
      toast.error("Please fill all address fields");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/user/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          savedAddresses: items,
          defaultAddressIndex: defaultIndex,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.message || "Could not save");
        return;
      }
      setItems(data.user?.savedAddresses || []);
      setDefaultIndex(data.user?.defaultAddressIndex ?? 0);
      toast.success("Addresses saved");
    } catch {
      toast.error("Could not save");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-6 py-8">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">My addresses</h1>
            <p className="text-sm text-slate-600 mt-1">Save addresses for faster bookings.</p>
          </div>
          <button
            type="button"
            onClick={() => setItems((p) => [...p, { label: `Address ${p.length + 1}`, address: "" }])}
            className="rounded-xl bg-blue-50 text-blue-700 font-extrabold px-4 py-3 border border-blue-100 hover:bg-blue-100"
          >
            + Add address
          </button>
        </div>

        {items.length === 0 && (
          <div className="mt-6 rounded-xl border border-dashed border-slate-300 p-5 text-slate-600">
            No saved addresses yet. Click “Add address”.
          </div>
        )}

        <div className="mt-6 space-y-4">
          {items.map((it, idx) => (
            <div key={idx} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    checked={idx === defaultIndex}
                    onChange={() => setDefaultIndex(idx)}
                    aria-label="Set as default"
                  />
                  <span className="text-sm font-extrabold text-slate-800">
                    {idx === defaultIndex ? "Default" : "Address"}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setItems((p) => p.filter((_, i) => i !== idx));
                    setDefaultIndex((p) => {
                      if (idx === p) return 0;
                      if (idx < p) return Math.max(0, p - 1);
                      return p;
                    });
                  }}
                  className="text-sm font-extrabold text-rose-700 bg-rose-50 border border-rose-100 px-3 py-2 rounded-xl hover:bg-rose-100"
                >
                  Remove
                </button>
              </div>

              <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-1">
                  <label className="block text-xs font-bold text-slate-600 mb-1">Label</label>
                  <input
                    value={it.label || ""}
                    onChange={(e) =>
                      setItems((p) => p.map((x, i) => (i === idx ? { ...x, label: e.target.value } : x)))
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-300"
                    placeholder="Home"
                  />
                </div>
                <div className="md:col-span-2">
                  <div className="flex items-center justify-between gap-3 mb-1">
                    <label className="block text-xs font-bold text-slate-600">Address</label>
                    <button
                      type="button"
                      onClick={() => setMapIndex(idx)}
                      className="rounded-xl border border-slate-200 bg-slate-100 text-slate-800 text-xs font-bold px-3 py-2 hover:bg-slate-200"
                    >
                      {it.address?.trim() ? "Change on map" : "Choose on map"}
                    </button>
                  </div>
                  <input
                    value={it.address || ""}
                    onChange={(e) =>
                      setItems((p) => p.map((x, i) => (i === idx ? { ...x, address: e.target.value } : x)))
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-300"
                    placeholder="House / building / street, city, state - pincode"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={save}
            disabled={saving || !canSave}
            className="flex-1 rounded-xl bg-blue-600 text-white font-bold py-3 hover:bg-blue-700 disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/user/dashboard")}
            className="rounded-xl bg-slate-100 text-slate-800 font-bold px-5 py-3 hover:bg-slate-200"
          >
            Back
          </button>
        </div>
        <LocationPickerModal
          open={mapIndex !== null}
          initialQuery={items[mapIndex]?.address || ""}
          onClose={() => setMapIndex(null)}
          onConfirm={(selection) => {
            if (mapIndex === null) return;
            setItems((p) =>
              p.map((x, i) => (i === mapIndex ? { ...x, address: selection.location || x.address } : x))
            );
            setMapIndex(null);
          }}
        />
      </div>
    </div>
  );
}

