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
  { value: "employee_deposit", label: "Cash deposit (employee)" },
  { value: "product_purchase", label: "Product purchase" },
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

  const [pendingPurchases, setPendingPurchases] = useState([]);
  const [pendingLoading, setPendingLoading] = useState(true);
  const [actionId, setActionId] = useState(null);

  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [employeeTxns, setEmployeeTxns] = useState([]);
  const [employeeLoading, setEmployeeLoading] = useState(false);

  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState({
    type: "credit",
    amount: "",
    category: "employee_deposit",
    description: "",
  });
  const [saving, setSaving] = useState(false);

  const [purchaseRecords, setPurchaseRecords] = useState([]);
  const [purchaseSummary, setPurchaseSummary] = useState(null);
  const [purchaseLoading, setPurchaseLoading] = useState(true);
  const [purchaseEmployee, setPurchaseEmployee] = useState("");
  const [purchaseFrom, setPurchaseFrom] = useState("");
  const [purchaseTo, setPurchaseTo] = useState("");
  const [purchaseMonth, setPurchaseMonth] = useState("");
  const [purchaseStatus, setPurchaseStatus] = useState("all");

  const [modalPurchaseFrom, setModalPurchaseFrom] = useState("");
  const [modalPurchaseTo, setModalPurchaseTo] = useState("");
  const [modalPurchaseMonth, setModalPurchaseMonth] = useState("");
  const [modalPurchases, setModalPurchases] = useState([]);
  const [modalPurchaseSummary, setModalPurchaseSummary] = useState(null);
  const [modalPurchaseLoading, setModalPurchaseLoading] = useState(false);

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

  const loadPendingPurchases = async () => {
    setPendingLoading(true);
    try {
      const res = await fetch(
        "/api/admin/wallet/transactions?status=pending&category=product_purchase&limit=100",
        { cache: "no-store" }
      );
      const data = await res.json();
      setPendingPurchases(data.transactions || []);
    } finally {
      setPendingLoading(false);
    }
  };

  useEffect(() => {
    loadSummary();
    loadPendingPurchases();
    loadPurchaseRecords({ employee: "", from: "", to: "", month: "", status: "all" });
  }, []);

  const loadPurchaseRecords = async (overrides = {}) => {
    setPurchaseLoading(true);
    try {
      const params = new URLSearchParams();
      const emp =
        overrides.employee !== undefined ? overrides.employee : purchaseEmployee;
      const from = overrides.from !== undefined ? overrides.from : purchaseFrom;
      const to = overrides.to !== undefined ? overrides.to : purchaseTo;
      const month = overrides.month !== undefined ? overrides.month : purchaseMonth;
      const status = overrides.status !== undefined ? overrides.status : purchaseStatus;

      if (emp) params.set("employee", emp);
      if (month) params.set("month", month);
      else {
        if (from) params.set("from", from);
        if (to) params.set("to", to);
      }
      if (status && status !== "all") params.set("status", status);

      const res = await fetch(`/api/admin/wallet/purchases?${params.toString()}`, {
        cache: "no-store",
      });
      const data = await res.json();
      setPurchaseRecords(data.purchases || []);
      setPurchaseSummary(data.summary || null);
    } finally {
      setPurchaseLoading(false);
    }
  };

  const loadModalPurchases = async (employeeId, overrides = {}) => {
    if (!employeeId) return;
    setModalPurchaseLoading(true);
    try {
      const params = new URLSearchParams({ employee: employeeId });
      const from =
        overrides.from !== undefined ? overrides.from : modalPurchaseFrom;
      const to = overrides.to !== undefined ? overrides.to : modalPurchaseTo;
      const month =
        overrides.month !== undefined ? overrides.month : modalPurchaseMonth;

      if (month) params.set("month", month);
      else {
        if (from) params.set("from", from);
        if (to) params.set("to", to);
      }

      const res = await fetch(`/api/admin/wallet/purchases?${params.toString()}`, {
        cache: "no-store",
      });
      const data = await res.json();
      setModalPurchases(data.purchases || []);
      setModalPurchaseSummary(data.summary || null);
    } finally {
      setModalPurchaseLoading(false);
    }
  };

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
    setModalPurchaseFrom("");
    setModalPurchaseTo("");
    setModalPurchaseMonth("");
    loadEmployeeTxns(row.employee.id);
    loadModalPurchases(row.employee.id, { from: "", to: "", month: "" });
  };

  const closeEmployee = () => {
    setSelectedEmployee(null);
    setEmployeeTxns([]);
    setModalPurchases([]);
    setModalPurchaseSummary(null);
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

  const handlePurchaseAction = async (txnId, action) => {
    const label = action === "approve" ? "deduct this amount from the wallet" : "reject this purchase";
    if (!confirm(`Are you sure you want to ${label}?`)) return;

    setActionId(txnId);
    try {
      const res = await fetch(`/api/admin/wallet/transactions/${txnId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.message || "Action failed");
        return;
      }
      await Promise.all([loadPendingPurchases(), loadSummary(), loadPurchaseRecords()]);
      if (selectedEmployee) {
        await loadEmployeeTxns(selectedEmployee.employee.id);
        await loadModalPurchases(selectedEmployee.employee.id);
        const refreshed = await fetch("/api/admin/wallet/summary", { cache: "no-store" });
        const list = await refreshed.json();
        const found = list.find(
          (r) => String(r.employee.id) === String(selectedEmployee.employee.id)
        );
        if (found) setSelectedEmployee(found);
      }
    } catch {
      alert("Network error");
    } finally {
      setActionId(null);
    }
  };

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
      setForm({ type: "credit", amount: "", category: "employee_deposit", description: "" });
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

      {/* Pending product purchases */}
      <div
        style={{
          background: "#fffbeb",
          border: "1px solid #fcd34d",
          borderRadius: 14,
          padding: "16px 20px",
          marginBottom: 24,
        }}
      >
        <h3 style={{ margin: "0 0 12px", fontSize: 16, color: "#92400e", fontWeight: 700 }}>
          Pending product purchases
        </h3>
        {pendingLoading ? (
          <div style={{ color: "#b45309", fontSize: 14 }}>Loading…</div>
        ) : pendingPurchases.length === 0 ? (
          <div style={{ color: "#a16207", fontSize: 14 }}>No pending purchases.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #fde68a" }}>
                  <th style={pendingTh}>Employee</th>
                  <th style={pendingTh}>Product</th>
                  <th style={{ ...pendingTh, textAlign: "right" }}>Amount</th>
                  <th style={pendingTh}>Submitted</th>
                  <th style={pendingTh}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingPurchases.map((p) => (
                  <tr key={p._id} style={{ borderTop: "1px solid #fef3c7" }}>
                    <td style={pendingTd}>
                      <div style={{ fontWeight: 600 }}>{p.employee?.name || "—"}</div>
                      <div style={{ fontSize: 11, color: "#78716c" }}>
                        {p.employee?.phone || p.employee?.email || ""}
                      </div>
                    </td>
                    <td style={{ ...pendingTd, maxWidth: 220 }}>{p.description}</td>
                    <td style={{ ...pendingTd, textAlign: "right", fontWeight: 700, color: "#dc2626" }}>
                      {formatCurrency(p.amount)}
                    </td>
                    <td style={pendingTd}>{formatDate(p.createdAt)}</td>
                    <td style={pendingTd}>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <button
                          type="button"
                          disabled={actionId === p._id}
                          onClick={() => handlePurchaseAction(p._id, "approve")}
                          style={{
                            padding: "6px 12px",
                            background: "#16a34a",
                            color: "#fff",
                            border: "none",
                            borderRadius: 8,
                            fontWeight: 600,
                            fontSize: 12,
                            cursor: actionId === p._id ? "not-allowed" : "pointer",
                            opacity: actionId === p._id ? 0.6 : 1,
                          }}
                        >
                          Deduct
                        </button>
                        <button
                          type="button"
                          disabled={actionId === p._id}
                          onClick={() => handlePurchaseAction(p._id, "reject")}
                          style={{
                            padding: "6px 12px",
                            background: "#fff",
                            color: "#64748b",
                            border: "1px solid #e2e8f0",
                            borderRadius: 8,
                            fontWeight: 600,
                            fontSize: 12,
                            cursor: actionId === p._id ? "not-allowed" : "pointer",
                          }}
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Purchase records — all employees */}
      <div
        style={{
          background: "#fff",
          border: "1px solid #e2e8f0",
          borderRadius: 14,
          padding: "16px 20px",
          marginBottom: 24,
        }}
      >
        <h3 style={{ margin: "0 0 4px", fontSize: 16, color: "#0f172a", fontWeight: 700 }}>
          Purchase records
        </h3>
        <p style={{ margin: "0 0 16px", fontSize: 13, color: "#64748b" }}>
          See what each employee purchased — filter by employee, month, or date range
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: 12,
            marginBottom: 12,
          }}
        >
          <div>
            <label style={filterLabel}>Employee</label>
            <select
              value={purchaseEmployee}
              onChange={(e) => setPurchaseEmployee(e.target.value)}
              style={filterInput}
            >
              <option value="">All employees</option>
              {summary.map((row) => (
                <option key={row.employee.id} value={row.employee.id}>
                  {row.employee.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={filterLabel}>Month</label>
            <input
              type="month"
              value={purchaseMonth}
              onChange={(e) => {
                setPurchaseMonth(e.target.value);
                if (e.target.value) {
                  setPurchaseFrom("");
                  setPurchaseTo("");
                }
              }}
              style={filterInput}
            />
          </div>
          <div>
            <label style={filterLabel}>From</label>
            <input
              type="date"
              value={purchaseFrom}
              disabled={Boolean(purchaseMonth)}
              onChange={(e) => {
                setPurchaseFrom(e.target.value);
                if (e.target.value) setPurchaseMonth("");
              }}
              style={filterInput}
            />
          </div>
          <div>
            <label style={filterLabel}>To</label>
            <input
              type="date"
              value={purchaseTo}
              disabled={Boolean(purchaseMonth)}
              onChange={(e) => {
                setPurchaseTo(e.target.value);
                if (e.target.value) setPurchaseMonth("");
              }}
              style={filterInput}
            />
          </div>
          <div>
            <label style={filterLabel}>Status</label>
            <select
              value={purchaseStatus}
              onChange={(e) => setPurchaseStatus(e.target.value)}
              style={filterInput}
            >
              <option value="all">All</option>
              <option value="completed">Deducted</option>
              <option value="pending">Pending</option>
              <option value="cancelled">Rejected</option>
            </select>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={() => loadPurchaseRecords()}
            style={{
              padding: "8px 16px",
              background: "#0f172a",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              fontWeight: 600,
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            Apply filter
          </button>
          <button
            type="button"
            onClick={() => {
              setPurchaseEmployee("");
              setPurchaseFrom("");
              setPurchaseTo("");
              setPurchaseMonth("");
              setPurchaseStatus("all");
              loadPurchaseRecords({
                employee: "",
                from: "",
                to: "",
                month: "",
                status: "all",
              });
            }}
            style={{
              padding: "8px 16px",
              background: "#f1f5f9",
              color: "#334155",
              border: "none",
              borderRadius: 8,
              fontWeight: 600,
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            Clear
          </button>
        </div>

        {purchaseSummary && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
              gap: 10,
              marginBottom: 16,
            }}
          >
            <SummaryPill label="Records" value={String(purchaseSummary.count)} />
            <SummaryPill
              label="Deducted"
              value={formatCurrency(purchaseSummary.completedTotal)}
              color="#16a34a"
            />
            <SummaryPill
              label="Pending"
              value={formatCurrency(purchaseSummary.pendingTotal)}
              color="#d97706"
            />
            <SummaryPill
              label="Rejected"
              value={formatCurrency(purchaseSummary.cancelledTotal)}
              color="#64748b"
            />
          </div>
        )}

        {purchaseLoading ? (
          <div style={{ padding: 24, textAlign: "center", color: "#94a3b8" }}>Loading…</div>
        ) : purchaseRecords.length === 0 ? (
          <div style={{ padding: 24, textAlign: "center", color: "#94a3b8" }}>
            No purchase records for this filter.
          </div>
        ) : (
          <div style={{ overflowX: "auto", maxHeight: 400, overflowY: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead style={{ background: "#f8fafc", position: "sticky", top: 0 }}>
                <tr>
                  <th style={txnTh}>Date</th>
                  <th style={txnTh}>Employee</th>
                  <th style={txnTh}>Product</th>
                  <th style={{ ...txnTh, textAlign: "right" }}>Amount</th>
                  <th style={txnTh}>Status</th>
                </tr>
              </thead>
              <tbody>
                {purchaseRecords.map((p) => (
                  <tr key={p._id} style={{ borderTop: "1px solid #f1f5f9" }}>
                    <td style={txnTd}>{formatDate(p.createdAt)}</td>
                    <td style={txnTd}>
                      <div style={{ fontWeight: 600 }}>{p.employee?.name || "—"}</div>
                      <div style={{ fontSize: 11, color: "#94a3b8" }}>
                        {p.employee?.phone || ""}
                      </div>
                    </td>
                    <td style={{ ...txnTd, maxWidth: 220 }}>{p.description}</td>
                    <td
                      style={{
                        ...txnTd,
                        textAlign: "right",
                        fontWeight: 700,
                        color: "#dc2626",
                      }}
                    >
                      {formatCurrency(p.amount)}
                    </td>
                    <td style={txnTd}>
                      <StatusBadge status={p.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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

            <div
              style={{
                marginBottom: 20,
                padding: 14,
                background: "#f8fafc",
                borderRadius: 12,
                border: "1px solid #e2e8f0",
              }}
            >
              <h4 style={{ margin: "0 0 10px", fontSize: 14, fontWeight: 700, color: "#334155" }}>
                Purchase history
              </h4>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                  gap: 8,
                  marginBottom: 10,
                }}
              >
                <input
                  type="month"
                  value={modalPurchaseMonth}
                  onChange={(e) => {
                    setModalPurchaseMonth(e.target.value);
                    if (e.target.value) {
                      setModalPurchaseFrom("");
                      setModalPurchaseTo("");
                    }
                  }}
                  style={filterInput}
                />
                <input
                  type="date"
                  value={modalPurchaseFrom}
                  disabled={Boolean(modalPurchaseMonth)}
                  onChange={(e) => {
                    setModalPurchaseFrom(e.target.value);
                    if (e.target.value) setModalPurchaseMonth("");
                  }}
                  style={filterInput}
                  placeholder="From"
                />
                <input
                  type="date"
                  value={modalPurchaseTo}
                  disabled={Boolean(modalPurchaseMonth)}
                  onChange={(e) => {
                    setModalPurchaseTo(e.target.value);
                    if (e.target.value) setModalPurchaseMonth("");
                  }}
                  style={filterInput}
                />
                <button
                  type="button"
                  onClick={() =>
                    loadModalPurchases(selectedEmployee.employee.id)
                  }
                  style={{
                    padding: "8px 12px",
                    background: "#0f172a",
                    color: "#fff",
                    border: "none",
                    borderRadius: 8,
                    fontWeight: 600,
                    fontSize: 12,
                    cursor: "pointer",
                  }}
                >
                  Apply
                </button>
              </div>
              {modalPurchaseSummary && (
                <div style={{ fontSize: 12, color: "#64748b", marginBottom: 8 }}>
                  {modalPurchaseSummary.count} records · Deducted{" "}
                  <strong style={{ color: "#16a34a" }}>
                    {formatCurrency(modalPurchaseSummary.completedTotal)}
                  </strong>
                  {" · "}Pending{" "}
                  <strong style={{ color: "#d97706" }}>
                    {formatCurrency(modalPurchaseSummary.pendingTotal)}
                  </strong>
                </div>
              )}
              {modalPurchaseLoading ? (
                <div style={{ fontSize: 13, color: "#94a3b8" }}>Loading…</div>
              ) : modalPurchases.length === 0 ? (
                <div style={{ fontSize: 13, color: "#94a3b8" }}>No purchases in this period.</div>
              ) : (
                <div style={{ maxHeight: 180, overflowY: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                        <th style={txnTh}>Date</th>
                        <th style={txnTh}>Product</th>
                        <th style={{ ...txnTh, textAlign: "right" }}>Amt</th>
                        <th style={txnTh}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {modalPurchases.map((p) => (
                        <tr key={p._id} style={{ borderTop: "1px solid #f1f5f9" }}>
                          <td style={txnTd}>{formatDate(p.createdAt)}</td>
                          <td style={{ ...txnTd, maxWidth: 160 }}>{p.description}</td>
                          <td style={{ ...txnTd, textAlign: "right", fontWeight: 600, color: "#dc2626" }}>
                            {formatCurrency(p.amount)}
                          </td>
                          <td style={txnTd}>
                            <StatusBadge status={p.status} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

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
                  <p style={{ fontSize: 13, color: "#64748b", marginTop: -8, marginBottom: 16 }}>
                    Use <strong>Cash deposit</strong> when an employee pays cash at the salon.
                  </p>
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

const pendingTh = {
  textAlign: "left",
  padding: "8px 10px",
  fontSize: 11,
  fontWeight: 700,
  color: "#92400e",
  textTransform: "uppercase",
};

const pendingTd = {
  padding: "10px",
  color: "#1c1917",
  verticalAlign: "top",
};

const filterLabel = {
  display: "block",
  fontSize: 11,
  fontWeight: 600,
  color: "#64748b",
  marginBottom: 4,
  textTransform: "uppercase",
};

const filterInput = {
  width: "100%",
  padding: "8px 10px",
  border: "1px solid #e2e8f0",
  borderRadius: 8,
  fontSize: 13,
  boxSizing: "border-box",
};

function SummaryPill({ label, value, color = "#0f172a" }) {
  return (
    <div
      style={{
        background: "#f8fafc",
        border: "1px solid #e2e8f0",
        borderRadius: 10,
        padding: "10px 12px",
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: 10, textTransform: "uppercase", color: "#94a3b8" }}>{label}</div>
      <div style={{ fontSize: 15, fontWeight: 700, color, marginTop: 4 }}>{value}</div>
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    completed: { label: "Deducted", bg: "#dcfce7", color: "#15803d" },
    pending: { label: "Pending", bg: "#fef3c7", color: "#b45309" },
    cancelled: { label: "Rejected", bg: "#f1f5f9", color: "#64748b" },
  };
  const s = map[status] || map.pending;
  return (
    <span
      style={{
        fontSize: 10,
        fontWeight: 700,
        textTransform: "uppercase",
        padding: "3px 8px",
        borderRadius: 999,
        background: s.bg,
        color: s.color,
      }}
    >
      {s.label}
    </span>
  );
}
