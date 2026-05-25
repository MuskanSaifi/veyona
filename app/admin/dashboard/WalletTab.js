"use client";

import { useEffect, useMemo, useState } from "react";
import * as styles from "./styles";

const CATEGORY_OPTIONS = [
  { value: "service_commission", label: "Service commission" },
  { value: "bonus", label: "Bonus" },
  { value: "incentive", label: "Incentive" },
  { value: "tip", label: "Tip" },
  { value: "penalty", label: "Penalty" },
  { value: "withdrawal", label: "Withdrawal" },
  { value: "adjustment", label: "Adjustment" },
  { value: "refund", label: "Refund" },
  { value: "other", label: "Other" },
];

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

export default function WalletTab() {
  const [summary, setSummary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const [selectedEmployee, setSelectedEmployee] = useState(null); // employee row
  const [employeeTxns, setEmployeeTxns] = useState([]);
  const [employeeLoading, setEmployeeLoading] = useState(false);

  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState({
    type: "credit",
    amount: "",
    category: "adjustment",
    description: "",
  });
  const [saving, setSaving] = useState(false);

  const loadSummary = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/wallet/summary", { cache: "no-store" });
      const data = await res.json();
      setSummary(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSummary();
  }, []);

  const loadEmployeeTxns = async (employeeId) => {
    setEmployeeLoading(true);
    try {
      const res = await fetch(
        `/api/admin/wallet/transactions?employee=${employeeId}&limit=200`,
        { cache: "no-store" }
      );
      const data = await res.json();
      setEmployeeTxns(data.transactions || []);
    } finally {
      setEmployeeLoading(false);
    }
  };

  const openEmployee = (row) => {
    setSelectedEmployee(row);
    loadEmployeeTxns(row.employee.id);
  };

  const closeEmployee = () => {
    setSelectedEmployee(null);
    setEmployeeTxns([]);
  };

  const filteredSummary = useMemo(() => {
    if (!searchQuery.trim()) return summary;
    const q = searchQuery.toLowerCase();
    return summary.filter(
      (r) =>
        r.employee.name?.toLowerCase().includes(q) ||
        r.employee.email?.toLowerCase().includes(q) ||
        r.employee.phone?.toLowerCase().includes(q)
    );
  }, [summary, searchQuery]);

  const totals = useMemo(() => {
    return summary.reduce(
      (acc, r) => {
        acc.balance += r.balance;
        acc.credit += r.totalCredit;
        acc.debit += r.totalDebit;
        return acc;
      },
      { balance: 0, credit: 0, debit: 0 }
    );
  }, [summary]);

  const handleAddTransaction = async (e) => {
    e.preventDefault();
    if (!selectedEmployee) return;
    const amount = Number(form.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      alert("Enter a positive amount");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/wallet/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: selectedEmployee.employee.id,
          type: form.type,
          amount,
          category: form.category,
          description: form.description,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.message || "Could not save transaction");
        return;
      }
      setShowAddModal(false);
      setForm({ type: "credit", amount: "", category: "adjustment", description: "" });
      await Promise.all([
        loadSummary(),
        loadEmployeeTxns(selectedEmployee.employee.id),
      ]);
      // Refresh selectedEmployee row from summary
      const refreshed = await fetch("/api/admin/wallet/summary", { cache: "no-store" });
      const list = await refreshed.json();
      const found = list.find(
        (r) => String(r.employee.id) === String(selectedEmployee.employee.id)
      );
      if (found) setSelectedEmployee(found);
    } catch {
      alert("Network error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div style={styles.pageHeader}>
        <h2 style={styles.pageTitle}>Employee Wallets</h2>
      </div>

      {/* Totals strip */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 16,
          marginBottom: 24,
        }}
      >
        <StatCard label="Total balance" value={formatCurrency(totals.balance)} color="#0f172a" />
        <StatCard label="Total credited" value={formatCurrency(totals.credit)} color="#16a34a" />
        <StatCard label="Total debited" value={formatCurrency(totals.debit)} color="#dc2626" />
        <StatCard label="Employees" value={summary.length} color="#0f172a" />
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search employee by name, email or phone"
          style={{
            ...styles.inputStyle,
            marginBottom: 0,
            maxWidth: 360,
            flex: 1,
          }}
        />
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>Loading…</div>
      ) : filteredSummary.length === 0 ? (
        <div style={styles.emptyState}>
          <p style={styles.emptyStateText}>No employees found.</p>
        </div>
      ) : (
        <div style={styles.table.wrapper}>
          <table style={styles.table.table}>
            <thead>
              <tr>
                <th style={styles.table.th}>Employee</th>
                <th style={styles.table.th}>Phone</th>
                <th style={{ ...styles.table.th, textAlign: "right" }}>Credits</th>
                <th style={{ ...styles.table.th, textAlign: "right" }}>Debits</th>
                <th style={{ ...styles.table.th, textAlign: "right" }}>Balance</th>
                <th style={styles.table.th}>Txns</th>
                <th style={styles.table.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSummary.map((row) => (
                <tr key={row.employee.id}>
                  <td style={{ ...styles.table.td, textAlign: "left" }}>
                    <div style={{ fontWeight: 600, color: "#0f172a" }}>
                      {row.employee.name}
                    </div>
                    <div style={styles.table.textSmall}>{row.employee.email}</div>
                  </td>
                  <td style={styles.table.td}>{row.employee.phone || "—"}</td>
                  <td style={{ ...styles.table.td, textAlign: "right", color: "#16a34a", fontWeight: 600 }}>
                    {formatCurrency(row.totalCredit)}
                  </td>
                  <td style={{ ...styles.table.td, textAlign: "right", color: "#dc2626", fontWeight: 600 }}>
                    {formatCurrency(row.totalDebit)}
                  </td>
                  <td style={{ ...styles.table.td, textAlign: "right", fontWeight: 700, fontSize: 16 }}>
                    {formatCurrency(row.balance)}
                  </td>
                  <td style={styles.table.td}>{row.transactionCount}</td>
                  <td style={styles.table.td}>
                    <button
                      onClick={() => openEmployee(row)}
                      style={{
                        ...styles.linkButton,
                        padding: "8px 16px",
                        fontSize: 13,
                      }}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedEmployee && (
        <div style={styles.modalOverlay} onClick={closeEmployee}>
          <div
            style={{ ...styles.modal, maxWidth: 760 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 22, color: "#1e293b" }}>
                  {selectedEmployee.employee.name}
                </h3>
                <div style={{ color: "#64748b", fontSize: 13, marginTop: 4 }}>
                  {selectedEmployee.employee.email} · {selectedEmployee.employee.phone || "—"}
                </div>
              </div>
              <button
                onClick={closeEmployee}
                style={{ background: "transparent", border: "none", fontSize: 24, cursor: "pointer", color: "#64748b" }}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: 12,
                marginBottom: 20,
              }}
            >
              <MiniStat label="Balance" value={formatCurrency(selectedEmployee.balance)} accent="#0f172a" />
              <MiniStat label="Credits" value={formatCurrency(selectedEmployee.totalCredit)} accent="#16a34a" />
              <MiniStat label="Debits" value={formatCurrency(selectedEmployee.totalDebit)} accent="#dc2626" />
            </div>

            <button
              onClick={() => setShowAddModal(true)}
              style={{ ...styles.addButton, marginBottom: 16 }}
            >
              + Add transaction
            </button>

            {employeeLoading ? (
              <div style={{ padding: 24, textAlign: "center", color: "#94a3b8" }}>
                Loading transactions…
              </div>
            ) : employeeTxns.length === 0 ? (
              <div style={{ padding: 24, textAlign: "center", color: "#94a3b8" }}>
                No transactions yet.
              </div>
            ) : (
              <div style={{ maxHeight: 360, overflowY: "auto", border: "1px solid #e2e8f0", borderRadius: 12 }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead style={{ background: "#f8fafc", position: "sticky", top: 0 }}>
                    <tr>
                      <th style={txnTh}>When</th>
                      <th style={txnTh}>Type</th>
                      <th style={txnTh}>Category</th>
                      <th style={txnTh}>Description</th>
                      <th style={{ ...txnTh, textAlign: "right" }}>Amount</th>
                      <th style={txnTh}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employeeTxns.map((t) => (
                      <tr key={t._id} style={{ borderTop: "1px solid #f1f5f9" }}>
                        <td style={txnTd}>{formatDate(t.createdAt)}</td>
                        <td style={txnTd}>
                          <span
                            style={{
                              fontWeight: 600,
                              color: t.type === "credit" ? "#16a34a" : "#dc2626",
                            }}
                          >
                            {t.type}
                          </span>
                        </td>
                        <td style={txnTd}>{t.category}</td>
                        <td style={{ ...txnTd, maxWidth: 200, color: "#475569" }}>
                          {t.description || "—"}
                        </td>
                        <td
                          style={{
                            ...txnTd,
                            textAlign: "right",
                            fontWeight: 600,
                            color: t.type === "credit" ? "#16a34a" : "#dc2626",
                          }}
                        >
                          {t.type === "credit" ? "+" : "−"}
                          {formatCurrency(t.amount)}
                        </td>
                        <td style={txnTd}>{t.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Add transaction sub-modal */}
            {showAddModal && (
              <div
                style={{ ...styles.modalOverlay, zIndex: 1100 }}
                onClick={() => setShowAddModal(false)}
              >
                <div
                  style={{ ...styles.modal, maxWidth: 480 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <h3 style={styles.modalTitle}>Add wallet transaction</h3>
                  <form onSubmit={handleAddTransaction}>
                    <label style={{ display: "block", fontWeight: 600, marginBottom: 6, color: "#475569", fontSize: 13 }}>
                      Type
                    </label>
                    <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
                      {["credit", "debit"].map((t) => (
                        <button
                          type="button"
                          key={t}
                          onClick={() => setForm({ ...form, type: t })}
                          style={{
                            flex: 1,
                            padding: "10px",
                            border: "2px solid",
                            borderColor: form.type === t
                              ? (t === "credit" ? "#16a34a" : "#dc2626")
                              : "#e2e8f0",
                            background: form.type === t
                              ? (t === "credit" ? "#ecfdf5" : "#fef2f2")
                              : "#fff",
                            color: form.type === t
                              ? (t === "credit" ? "#15803d" : "#b91c1c")
                              : "#334155",
                            borderRadius: 10,
                            fontWeight: 600,
                            cursor: "pointer",
                            textTransform: "capitalize",
                          }}
                        >
                          {t === "credit" ? "Credit (+)" : "Debit (−)"}
                        </button>
                      ))}
                    </div>

                    <label style={{ display: "block", fontWeight: 600, marginBottom: 6, color: "#475569", fontSize: 13 }}>
                      Amount (₹)
                    </label>
                    <input
                      type="number"
                      min={0}
                      step={0.01}
                      value={form.amount}
                      onChange={(e) => setForm({ ...form, amount: e.target.value })}
                      placeholder="0.00"
                      style={styles.inputStyle}
                      required
                    />

                    <label style={{ display: "block", fontWeight: 600, marginBottom: 6, color: "#475569", fontSize: 13 }}>
                      Category
                    </label>
                    <select
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                      style={styles.selectStyle}
                    >
                      {CATEGORY_OPTIONS.map((c) => (
                        <option key={c.value} value={c.value}>
                          {c.label}
                        </option>
                      ))}
                    </select>

                    <label style={{ display: "block", fontWeight: 600, marginBottom: 6, color: "#475569", fontSize: 13 }}>
                      Description (optional)
                    </label>
                    <textarea
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      rows={3}
                      maxLength={500}
                      placeholder="e.g. Commission for May 24 home service"
                      style={styles.textareaStyle}
                    />

                    <div style={styles.modalButtons}>
                      <button
                        type="button"
                        onClick={() => setShowAddModal(false)}
                        style={styles.cancelButton}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={saving}
                        style={{
                          ...styles.submitButton,
                          opacity: saving ? 0.7 : 1,
                          cursor: saving ? "not-allowed" : "pointer",
                        }}
                      >
                        {saving ? "Saving…" : "Save transaction"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div
      style={{
        background: "#fff",
        padding: "18px 20px",
        borderRadius: 14,
        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
        border: "1px solid #e2e8f0",
      }}
    >
      <div style={{ fontSize: 12, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ fontSize: 22, fontWeight: 700, color }}>{value}</div>
    </div>
  );
}

function MiniStat({ label, value, accent }) {
  return (
    <div
      style={{
        background: "#f8fafc",
        padding: "12px 16px",
        borderRadius: 10,
        border: "1px solid #e2e8f0",
      }}
    >
      <div style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>
        {label}
      </div>
      <div style={{ fontSize: 18, fontWeight: 700, color: accent, marginTop: 4 }}>
        {value}
      </div>
    </div>
  );
}

const txnTh = {
  textAlign: "left",
  padding: "10px 12px",
  fontSize: 11,
  fontWeight: 700,
  color: "#475569",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};

const txnTd = {
  padding: "10px 12px",
  color: "#1f2937",
};
