"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FiDownload, FiFileText, FiRefreshCw } from "react-icons/fi";
import * as styles from "./styles";
import mobile from "./AdminMobileCards.module.css";

function currentMonthValue() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function fmtDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function fmtRs(n) {
  return `₹${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

function monthLabel(ym) {
  if (!ym || !/^\d{4}-\d{2}$/.test(ym)) return ym;
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(y, m - 1, 1);
  return d.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
}

export default function AllInvoicesTab() {
  const [month, setMonth] = useState(currentMonthValue);
  const [invoices, setInvoices] = useState([]);
  const [monthTotal, setMonthTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [downloadingId, setDownloadingId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/invoices?month=${encodeURIComponent(month)}`, {
        cache: "no-store",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setInvoices([]);
        setMonthTotal(0);
        return;
      }
      setInvoices(Array.isArray(data.invoices) ? data.invoices : []);
      setMonthTotal(Number(data.monthTotal) || 0);
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return invoices;
    return invoices.filter((inv) => {
      const hay = [
        inv.invoiceNumber,
        inv.customerName,
        inv.customerPhone,
        inv.customerEmail,
        inv.serviceLabel,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [invoices, search]);

  const downloadInvoice = async (id, invoiceNumber) => {
    setDownloadingId(id);
    try {
      const res = await fetch(`/api/admin/invoices/${id}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.message || "Could not download invoice");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoice-${invoiceNumber || id}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div>
      <div style={styles.pageHeader}>
        <div>
          <h2 style={styles.pageTitle}>All Invoices</h2>
          <p style={{ color: "#64748b", margin: "6px 0 0", fontSize: 14 }}>
            Monthly invoices — view and download PDFs for paid bookings.
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          disabled={loading}
          style={{
            padding: "10px 18px",
            borderRadius: 10,
            border: "1px solid #e2e8f0",
            background: "#fff",
            fontWeight: 600,
            cursor: loading ? "not-allowed" : "pointer",
            display: "inline-flex",
            alignItems: "center",
          }}
        >
          <FiRefreshCw style={{ marginRight: 6 }} />
          Refresh
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 16,
          marginBottom: 24,
        }}
      >
        <StatCard label="Month" value={monthLabel(month)} />
        <StatCard label="Invoices" value={filtered.length} accent="#6366f1" />
        <StatCard label="Month total" value={fmtRs(monthTotal)} accent="#10b981" />
      </div>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 12,
          marginBottom: 20,
          alignItems: "center",
        }}
      >
        <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 13, color: "#64748b" }}>
          Select month
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            style={{
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid #e2e8f0",
              fontSize: 14,
              minWidth: 160,
            }}
          />
        </label>
        <input
          type="text"
          placeholder="Search invoice, customer, service..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            flex: "1 1 220px",
            padding: "10px 14px",
            borderRadius: 10,
            border: "1px solid #e2e8f0",
            fontSize: 14,
          }}
        />
      </div>

      {loading ? (
        <p style={{ color: "#64748b" }}>Loading invoices…</p>
      ) : filtered.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "48px 24px",
            background: "#f8fafc",
            borderRadius: 16,
            border: "1px dashed #cbd5e1",
          }}
        >
          <FiFileText size={40} color="#94a3b8" style={{ margin: "0 auto 12px" }} />
          <p style={{ margin: 0, color: "#64748b", fontWeight: 600 }}>No invoices for {monthLabel(month)}</p>
          <p style={{ margin: "8px 0 0", fontSize: 13, color: "#94a3b8" }}>
            Try another month or check that payments are recorded.
          </p>
        </div>
      ) : (
        <>
          <div className={mobile.hideOnMobile} style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
              <thead>
                <tr style={{ background: "#f1f5f9", textAlign: "left" }}>
                  <th style={thStyle}>Invoice #</th>
                  <th style={thStyle}>Customer</th>
                  <th style={thStyle}>Service</th>
                  <th style={thStyle}>Date</th>
                  <th style={thStyle}>Amount</th>
                  <th style={thStyle}>Payment</th>
                  <th style={thStyle}>Download</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((inv) => (
                  <tr key={inv._id} style={{ borderBottom: "1px solid #e2e8f0" }}>
                    <td style={tdStyle}>
                      <span style={{ fontWeight: 700, color: "#0f172a" }}>
                        {inv.invoiceNumber || "—"}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ fontWeight: 600 }}>{inv.customerName}</div>
                      {inv.customerPhone && (
                        <div style={{ fontSize: 12, color: "#64748b" }}>{inv.customerPhone}</div>
                      )}
                    </td>
                    <td style={{ ...tdStyle, maxWidth: 200 }}>{inv.serviceLabel}</td>
                    <td style={tdStyle}>{fmtDate(inv.issueDate)}</td>
                    <td style={{ ...tdStyle, fontWeight: 700 }}>{fmtRs(inv.total)}</td>
                    <td style={tdStyle}>
                      <PaymentBadge status={inv.paymentStatus} />
                    </td>
                    <td style={tdStyle}>
                      <button
                        type="button"
                        onClick={() => downloadInvoice(inv._id, inv.invoiceNumber)}
                        disabled={downloadingId === inv._id}
                        style={downloadBtnStyle}
                      >
                        <FiDownload />
                        {downloadingId === inv._id ? "…" : "PDF"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className={mobile.mobileCards}>
            {filtered.map((inv) => (
              <div key={inv._id} className={mobile.card}>
                <div className={mobile.cardHeader}>
                  <div>
                    <div className={mobile.cardTitle}>{inv.invoiceNumber || "Pending #"}</div>
                    <div className={mobile.cardMeta}>{fmtDate(inv.issueDate)}</div>
                  </div>
                  <PaymentBadge status={inv.paymentStatus} />
                </div>
                <div className={mobile.summary}>
                  <strong>Customer:</strong> {inv.customerName}
                  <br />
                  <strong>Service:</strong> {inv.serviceLabel}
                  <br />
                  <strong>Amount:</strong> {fmtRs(inv.total)}
                </div>
                <button
                  type="button"
                  onClick={() => downloadInvoice(inv._id, inv.invoiceNumber)}
                  disabled={downloadingId === inv._id}
                  className={mobile.viewMoreBtn}
                >
                  <FiDownload style={{ marginRight: 6, verticalAlign: "middle" }} />
                  {downloadingId === inv._id ? "Downloading…" : "Download PDF"}
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({ label, value, accent = "#0f172a" }) {
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #e2e8f0",
        borderRadius: 14,
        padding: "16px 18px",
      }}
    >
      <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 800, color: accent }}>{value}</div>
    </div>
  );
}

function PaymentBadge({ status }) {
  const colors = {
    paid: { bg: "#dcfce7", text: "#166534" },
    partial: { bg: "#fef9c3", text: "#854d0e" },
    unpaid: { bg: "#fee2e2", text: "#991b1b" },
  };
  const c = colors[status] || colors.unpaid;
  return (
    <span
      style={{
        fontSize: 11,
        fontWeight: 700,
        textTransform: "capitalize",
        padding: "3px 8px",
        borderRadius: 999,
        background: c.bg,
        color: c.text,
      }}
    >
      {status || "unpaid"}
    </span>
  );
}

const thStyle = { padding: "12px 14px", fontWeight: 700, color: "#475569", fontSize: 13 };
const tdStyle = { padding: "12px 14px", verticalAlign: "top" };
const downloadBtnStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "8px 14px",
  borderRadius: 8,
  border: "none",
  background: "var(--accent-terracotta, #8b5e4b)",
  color: "#fff",
  fontWeight: 700,
  fontSize: 13,
  cursor: "pointer",
};
