"use client";

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

function formatDate(d) {
  if (!d) return "";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return "";
  return dt.toLocaleString("en-IN", { year: "numeric", month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

export default function UsersTab() {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(null);

  const selected = useMemo(() => users.find((u) => u._id === selectedId) || null, [users, selectedId]);

  const fetchUsers = async (q) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q?.trim()) params.set("q", q.trim());
      params.set("limit", "500");
      const res = await fetch(`/api/admin/users?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || "Could not load users");
        setUsers([]);
        return;
      }
      setUsers(Array.isArray(data.users) ? data.users : []);
    } catch (e) {
      toast.error("Could not load users");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers("");
  }, []);

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>Users</h2>
          <div style={{ color: "#6b7280", marginTop: 6, fontSize: 13 }}>
            Total loaded: <b>{users.length}</b>
          </div>
        </div>
        <button
          type="button"
          onClick={() => fetchUsers(query)}
          style={{
            padding: "10px 14px",
            borderRadius: 10,
            border: "1px solid #d1d5db",
            background: "white",
            fontWeight: 800,
            cursor: "pointer",
          }}
        >
          Refresh
        </button>
      </div>

      <div style={{ marginTop: 16, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name / phone / email"
          style={{
            flex: 1,
            minWidth: 280,
            padding: 12,
            borderRadius: 12,
            border: "1px solid #d1d5db",
            background: "white",
          }}
        />
        <button
          type="button"
          onClick={() => fetchUsers(query)}
          disabled={loading}
          style={{
            padding: "12px 16px",
            borderRadius: 12,
            border: "none",
            background: loading ? "#9ca3af" : "var(--accent-terracotta)",
            color: "white",
            fontWeight: 900,
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Searching..." : "Search"}
        </button>
        <button
          type="button"
          onClick={() => {
            setQuery("");
            fetchUsers("");
          }}
          disabled={loading}
          style={{
            padding: "12px 16px",
            borderRadius: 12,
            border: "1px solid #e5e7eb",
            background: "white",
            color: "#111827",
            fontWeight: 800,
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          Clear
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: selected ? "1.2fr 0.8fr" : "1fr", gap: 14, marginTop: 16 }}>
        <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: 14, overflow: "hidden" }}>
          <div style={{ padding: 12, borderBottom: "1px solid #e5e7eb", background: "#f9fafb", fontWeight: 900 }}>
            User list
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#fff" }}>
                  {["Name", "Phone", "Email", "Verified", "OTP", "OTP Expiry", "Created"].map((h) => (
                    <th
                      key={h}
                      style={{
                        textAlign: "left",
                        padding: "10px 12px",
                        fontSize: 12,
                        color: "#6b7280",
                        borderBottom: "1px solid #e5e7eb",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const isActive = u._id === selectedId;
                  return (
                    <tr
                      key={u._id}
                      onClick={() => setSelectedId(isActive ? null : u._id)}
                      style={{
                        cursor: "pointer",
                        background: isActive ? "rgba(173,110,94,0.08)" : "white",
                      }}
                    >
                      <td style={{ padding: "10px 12px", borderBottom: "1px solid #f3f4f6", fontWeight: 800, color: "#111827" }}>
                        {u.name || "—"}
                      </td>
                      <td style={{ padding: "10px 12px", borderBottom: "1px solid #f3f4f6", whiteSpace: "nowrap" }}>
                        {u.phone || "—"}
                      </td>
                      <td style={{ padding: "10px 12px", borderBottom: "1px solid #f3f4f6" }}>
                        {u.email || "—"}
                      </td>
                      <td style={{ padding: "10px 12px", borderBottom: "1px solid #f3f4f6", whiteSpace: "nowrap" }}>
                        {u.isVerified ? "Yes" : "No"}
                      </td>
                      <td style={{ padding: "10px 12px", borderBottom: "1px solid #f3f4f6", fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace" }}>
                        {u.otp || "—"}
                      </td>
                      <td style={{ padding: "10px 12px", borderBottom: "1px solid #f3f4f6", whiteSpace: "nowrap" }}>
                        {formatDate(u.otpExpiry) || "—"}
                      </td>
                      <td style={{ padding: "10px 12px", borderBottom: "1px solid #f3f4f6", whiteSpace: "nowrap" }}>
                        {formatDate(u.createdAt) || "—"}
                      </td>
                    </tr>
                  );
                })}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ padding: 18, color: "#6b7280" }}>
                      {loading ? "Loading..." : "No users found."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {selected && (
          <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: 14, padding: 14 }}>
            <div style={{ fontWeight: 900, fontSize: 14, marginBottom: 10 }}>User details</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 10, fontSize: 13 }}>
              <div><b>ID:</b> <span style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace" }}>{selected._id}</span></div>
              <div><b>Name:</b> {selected.name || "—"}</div>
              <div><b>Phone:</b> {selected.phone || "—"}</div>
              <div><b>Email:</b> {selected.email || "—"}</div>
              <div><b>Verified:</b> {selected.isVerified ? "Yes" : "No"}</div>
              <div><b>OTP:</b> <span style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace" }}>{selected.otp || "—"}</span></div>
              <div><b>OTP Expiry:</b> {formatDate(selected.otpExpiry) || "—"}</div>
              <div><b>Address:</b> {selected.address || "—"}</div>
              <div>
                <b>Saved addresses:</b>
                <div style={{ marginTop: 6, display: "grid", gap: 6 }}>
                  {(selected.savedAddresses || []).length === 0 ? (
                    <span style={{ color: "#6b7280" }}>—</span>
                  ) : (
                    (selected.savedAddresses || []).map((a, idx) => (
                      <div key={idx} style={{ padding: 10, borderRadius: 10, border: "1px solid #e5e7eb", background: "#f9fafb" }}>
                        <div style={{ fontWeight: 900 }}>{a.label || `Address ${idx + 1}`}{idx === (selected.defaultAddressIndex ?? 0) ? " (default)" : ""}</div>
                        <div style={{ color: "#374151", marginTop: 2 }}>{a.address}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
              <div><b>Created:</b> {formatDate(selected.createdAt) || "—"}</div>
              <div><b>Updated:</b> {formatDate(selected.updatedAt) || "—"}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

