"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function UserProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "", avatar: "" });
  const [avatarPreview, setAvatarPreview] = useState("");

  const displayAvatar = useMemo(() => avatarPreview || form.avatar || "", [avatarPreview, form.avatar]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/user/me");
        if (res.status === 401) {
          router.push("/user/login");
          return;
        }
        const data = await res.json();
        const u = data.user || {};
        setForm({
          name: u.name || "",
          email: u.email || "",
          phone: u.phone || "",
          avatar: u.avatar || "",
        });
      } catch (e) {
        toast.error("Could not load profile");
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  const pickImage = () => fileRef.current?.click();

  const uploadAvatar = async (file) => {
    if (!file) return;
    const isImage = String(file.type || "").startsWith("image/");
    if (!isImage) {
      toast.error("Please select an image");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be <= 2MB");
      return;
    }

    const localUrl = URL.createObjectURL(file);
    setAvatarPreview(localUrl);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/user/avatar", { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.message || "Could not upload image");
        setAvatarPreview("");
        return;
      }
      setForm((p) => ({ ...p, avatar: data.avatar || p.avatar }));
      toast.success("Profile photo updated");
    } catch {
      toast.error("Could not upload image");
      setAvatarPreview("");
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/user/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name, email: form.email }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.message || "Could not save");
        return;
      }
      toast.success("Profile updated");
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
    <div className="max-w-5xl mx-auto px-4 md:px-6 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Profile card */}
        <div className="lg:col-span-1">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h1 className="text-xl font-extrabold text-slate-900">Account</h1>
                <p className="text-sm text-slate-600 mt-1">Manage your profile & settings</p>
              </div>
              <button
                type="button"
                onClick={() => router.push("/user/dashboard")}
                className="rounded-xl bg-slate-100 text-slate-800 font-extrabold px-4 py-2 hover:bg-slate-200"
              >
                Dashboard
              </button>
            </div>

            <div className="mt-5 flex items-center gap-4">
              <div className="relative">
                <div className="w-20 h-20 rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 flex items-center justify-center">
                  {displayAvatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={displayAvatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-slate-500 font-extrabold text-xl">
                      {(form.name || "U").slice(0, 1).toUpperCase()}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={pickImage}
                  disabled={uploading}
                  className="absolute -bottom-2 -right-2 rounded-xl bg-blue-600 text-white text-xs font-extrabold px-3 py-2 hover:bg-blue-700 disabled:opacity-60"
                >
                  {uploading ? "Uploading..." : "Edit"}
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => uploadAvatar(e.target.files?.[0])}
                />
              </div>
              <div className="min-w-0">
                <div className="font-extrabold text-slate-900 truncate">{form.name || "User"}</div>
                <div className="text-sm text-slate-600 truncate">{form.email || "—"}</div>
                <div className="text-sm text-slate-600 mt-1">+91 {form.phone || "—"}</div>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => router.push("/user/addresses")}
                className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 font-extrabold hover:bg-slate-100 text-left"
              >
                My addresses
                <div className="text-xs text-slate-600 font-semibold mt-1">Manage saved locations</div>
              </button>
              <button
                type="button"
                onClick={() => router.push("/user/refer")}
                className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 font-extrabold hover:bg-slate-100 text-left"
              >
                Refer & earn
                <div className="text-xs text-slate-600 font-semibold mt-1">Invite friends</div>
              </button>
            </div>
          </div>
        </div>

        {/* Right: Edit form */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6 shadow-sm">
            <h2 className="text-2xl font-extrabold text-slate-900">Update profile</h2>
            <p className="text-sm text-slate-600 mt-1">Keep your details up to date.</p>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-1">
                <label className="block text-sm font-semibold text-slate-700 mb-1">Name</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-300"
                  placeholder="Your name"
                />
              </div>
              <div className="md:col-span-1">
                <label className="block text-sm font-semibold text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-300"
                  placeholder="you@example.com"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-slate-700 mb-1">Mobile number</label>
                <input
                  value={form.phone ? `+91 ${form.phone}` : ""}
                  disabled
                  className="w-full rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 text-slate-600"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-6">
              <button
                type="button"
                onClick={save}
                disabled={saving}
                className="flex-1 rounded-xl bg-blue-600 text-white font-extrabold py-3 hover:bg-blue-700 disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save changes"}
              </button>
              <button
                type="button"
                onClick={() => router.back()}
                className="rounded-xl bg-slate-100 text-slate-800 font-extrabold px-5 py-3 hover:bg-slate-200"
              >
                Back
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-3">
              Profile photo supports JPG/PNG/WebP up to 2MB.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

