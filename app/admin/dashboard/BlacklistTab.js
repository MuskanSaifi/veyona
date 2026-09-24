"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

function formatDate(d) {
  if (!d) return "";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return "";
  return dt.toLocaleString("en-IN", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const emptyCustomer = { phone: "", email: "", name: "", reason: "" };

export default function BlacklistTab() {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [role, setRole] = useState(null);
  const [filter, setFilter] = useState("all");
  const [includeInactive, setIncludeInactive] = useState(false);
  const [query, setQuery] = useState("");
  const [customerForm, setCustomerForm] = useState(emptyCustomer);
  const [savingCustomer, setSavingCustomer] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [employeeId, setEmployeeId] = useState("");
  const [employeeReason, setEmployeeReason] = useState("");
  const [savingEmployee, setSavingEmployee] = useState(false);
  const [unblacklistingId, setUnblacklistingId] = useState(null);

  const isAdmin = role === "admin";

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter === "customer" || filter === "employee") params.set("type", filter);
      if (includeInactive) params.set("includeInactive", "1");
      if (query.trim()) params.set("q", query.trim());
      const res = await fetch(`/api/admin/blacklist?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || "Could not load blacklist");
        setItems([]);
        return;
      }
      setItems(Array.isArray(data.items) ? data.items : []);
      if (data.role) setRole(data.role);
    } catch {
      toast.error("Could not load blacklist");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [filter, includeInactive, query]);

  const fetchEmployees = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const res = await fetch("/api/admin/employees");
      const data = await res.json();
      if (!res.ok) return;
      const list = Array.isArray(data) ? data : [];
      setEmployees(list.filter((e) => e.active !== false));
    } catch {
      /* ignore */
    }
  }, [isAdmin]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  useEffect(() => {
    if (isAdmin) fetchEmployees();
  }, [isAdmin, fetchEmployees]);

  const counts = useMemo(() => {
    const active = items.filter((i) => i.active);
    return {
      all: active.length,
      customer: active.filter((i) => i.type === "customer").length,
      employee: active.filter((i) => i.type === "employee").length,
    };
  }, [items]);

  const addCustomer = async (e) => {
    e.preventDefault();
    if (!customerForm.phone.trim()) {
      toast.error("Phone is required");
      return;
    }
    setSavingCustomer(true);
    try {
      const res = await fetch("/api/admin/blacklist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "customer",
          phone: customerForm.phone.trim(),
          email: customerForm.email.trim(),
          name: customerForm.name.trim(),
          reason: customerForm.reason.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || "Failed to blacklist");
        return;
      }
      toast.success(data.message || "Customer blacklisted");
      setCustomerForm(emptyCustomer);
      fetchList();
    } catch {
      toast.error("Failed to blacklist");
    } finally {
      setSavingCustomer(false);
    }
  };

  const addEmployee = async (e) => {
    e.preventDefault();
    if (!employeeId) {
      toast.error("Select an employee");
      return;
    }
    setSavingEmployee(true);
    try {
      const res = await fetch("/api/admin/blacklist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "employee",
          employeeId,
          reason: employeeReason.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || "Failed to blacklist");
        return;
      }
      toast.success(data.message || "Employee blacklisted");
      setEmployeeId("");
      setEmployeeReason("");
      fetchList();
      fetchEmployees();
    } catch {
      toast.error("Failed to blacklist");
    } finally {
      setSavingEmployee(false);
    }
  };

  const unblacklist = async (id) => {
    if (!window.confirm("Remove this entry from the blacklist?")) return;
    setUnblacklistingId(id);
    try {
      const res = await fetch(`/api/admin/blacklist/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || "Could not unblacklist");
        return;
      }
      toast.success(data.message || "Unblacklisted");
      fetchList();
      if (isAdmin) fetchEmployees();
    } catch {
      toast.error("Could not unblacklist");
    } finally {
      setUnblacklistingId(null);
    }
  };

  const inputStyle = {
    width: "100%",
    padding: 12,
    borderRadius: 12,
    border: "1px solid #d1d5db",
    background: "white",
    boxSizing: "border-box",
  };

  const btnPrimary = {
    padding: "12px 16px",
    borderRadius: 12,
    border: "none",
    background: "var(--accent-terracotta)",
    color: "white",
    fontWeight: 800,
    cursor: "pointer",
  };

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto" }}>
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>Blacklist</h2>
          <div style={{ color: "#6b7280", marginTop: 6, fontSize: 13 }}>
            Block customers from booking/login, and (admin) disable employees.
          </div>
        </div>
        <button
          type="button"
          onClick={() => fetchList()}
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

      <div style={{ marginTop: 16, display: "flex", gap: 8, flexWrap: "wrap" }}>
        {[
          { key: "all", label: `All (${counts.all})` },
          { key: "customer", label: `Customers (${counts.customer})` },
          { key: "employee", label: `Employees (${counts.employee})` },
        ].map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setFilter(t.key)}
            style={{
              padding: "8px 14px",
              borderRadius: 999,
              border: filter === t.key ? "none" : "1px solid #e5e7eb",
              background: filter === t.key ? "var(--accent-terracotta)" : "white",
              color: filter === t.key ? "white" : "#111827",
              fontWeight: 700,
              cursor: "pointer",
              fontSize: 13,
            }}
          >
            {t.label}
          </button>
        ))}
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontSize: 13,
            color: "#4b5563",
            marginLeft: 8,
          }}
        >
          <input
            type="checkbox"
            checked={includeInactive}
            onChange={(e) => setIncludeInactive(e.target.checked)}
          />
          Show inactive
        </label>
      </div>

      <div
        style={{
          marginTop: 16,
          display: "grid",
          gridTemplateColumns: isAdmin ? "1fr 1fr" : "1fr",
          gap: 16,
        }}
      >
        <form
          onSubmit={addCustomer}
          style={{
            padding: 16,
            borderRadius: 14,
            border: "1px solid #e5e7eb",
            background: "#fafafa",
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          <div style={{ fontWeight: 800, fontSize: 15 }}>Blacklist customer</div>
          <input
            style={inputStyle}
            placeholder="Phone (required)"
            value={customerForm.phone}
            onChange={(e) =>
              setCustomerForm((f) => ({ ...f, phone: e.target.value }))
            }
          />
          <input
            style={inputStyle}
            placeholder="Email (optional)"
            value={customerForm.email}
            onChange={(e) =>
              setCustomerForm((f) => ({ ...f, email: e.target.value }))
            }
          />
          <input
            style={inputStyle}
            placeholder="Name (optional)"
            value={customerForm.name}
            onChange={(e) =>
              setCustomerForm((f) => ({ ...f, name: e.target.value }))
            }
          />
          <input
            style={inputStyle}
            placeholder="Reason (optional)"
            value={customerForm.reason}
            onChange={(e) =>
              setCustomerForm((f) => ({ ...f, reason: e.target.value }))
            }
          />
          <button
            type="submit"
            disabled={savingCustomer}
            style={{
              ...btnPrimary,
              opacity: savingCustomer ? 0.6 : 1,
              cursor: savingCustomer ? "not-allowed" : "pointer",
            }}
          >
            {savingCustomer ? "Saving…" : "Blacklist customer"}
          </button>
        </form>

        {isAdmin && (
          <form
            onSubmit={addEmployee}
            style={{
              padding: 16,
              borderRadius: 14,
              border: "1px solid #e5e7eb",
              background: "#fafafa",
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            <div style={{ fontWeight: 800, fontSize: 15 }}>Blacklist employee</div>
            <select
              style={inputStyle}
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
            >
              <option value="">Select employee…</option>
              {employees.map((emp) => (
                <option key={emp._id} value={emp._id}>
                  {emp.name || emp.email} {emp.phone ? `(${emp.phone})` : ""}
                </option>
              ))}
            </select>
            <input
              style={inputStyle}
              placeholder="Reason (optional)"
              value={employeeReason}
              onChange={(e) => setEmployeeReason(e.target.value)}
            />
            <button
              type="submit"
              disabled={savingEmployee}
              style={{
                ...btnPrimary,
                opacity: savingEmployee ? 0.6 : 1,
                cursor: savingEmployee ? "not-allowed" : "pointer",
              }}
            >
              {savingEmployee ? "Saving…" : "Blacklist employee"}
            </button>
          </form>
        )}
      </div>

      <div style={{ marginTop: 16, display: "flex", gap: 10, flexWrap: "wrap" }}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search name / phone / email / reason"
          style={{ ...inputStyle, flex: 1, minWidth: 240 }}
        />
        <button type="button" onClick={() => fetchList()} style={btnPrimary}>
          Search
        </button>
      </div>

      <div style={{ marginTop: 16, overflowX: "auto" }}>
        {loading ? (
          <div style={{ padding: 24, color: "#6b7280" }}>Loading…</div>
        ) : items.length === 0 ? (
          <div style={{ padding: 24, color: "#6b7280" }}>No blacklist entries.</div>
        ) : (
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: 13,
              background: "white",
            }}
          >
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "2px solid #e5e7eb" }}>
                <th style={{ padding: 10 }}>Type</th>
                <th style={{ padding: 10 }}>Name</th>
                <th style={{ padding: 10 }}>Phone</th>
                <th style={{ padding: 10 }}>Email</th>
                <th style={{ padding: 10 }}>Reason</th>
                <th style={{ padding: 10 }}>Blacklisted by</th>
                <th style={{ padding: 10 }}>Date</th>
                <th style={{ padding: 10 }}>Status</th>
                <th style={{ padding: 10 }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {items.map((row) => (
                <tr key={row._id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                  <td style={{ padding: 10, textTransform: "capitalize" }}>
                    {row.type}
                  </td>
                  <td style={{ padding: 10 }}>{row.name || "—"}</td>
                  <td style={{ padding: 10 }}>{row.phone || "—"}</td>
                  <td style={{ padding: 10 }}>{row.email || "—"}</td>
                  <td style={{ padding: 10, maxWidth: 160 }}>{row.reason || "—"}</td>
                  <td style={{ padding: 10 }}>
                    {row.createdByName || "—"}
                    {row.createdByRole ? (
                      <span style={{ color: "#6b7280" }}> ({row.createdByRole})</span>
                    ) : null}
                  </td>
                  <td style={{ padding: 10 }}>{formatDate(row.createdAt)}</td>
                  <td style={{ padding: 10 }}>
                    <span
                      style={{
                        color: row.active ? "#b91c1c" : "#6b7280",
                        fontWeight: 700,
                      }}
                    >
                      {row.active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td style={{ padding: 10 }}>
                    {row.active ? (
                      <button
                        type="button"
                        disabled={unblacklistingId === row._id}
                        onClick={() => unblacklist(row._id)}
                        style={{
                          padding: "6px 10px",
                          borderRadius: 8,
                          border: "1px solid #d1d5db",
                          background: "white",
                          fontWeight: 700,
                          cursor:
                            unblacklistingId === row._id ? "not-allowed" : "pointer",
                          fontSize: 12,
                        }}
                      >
                        {unblacklistingId === row._id ? "…" : "Unblacklist"}
                      </button>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
