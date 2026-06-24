"use client";

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import cardStyles from "./AppointmentTab.module.css";

const fetchOpts = { credentials: "include" };

function toDateInputValue(date) {
  if (!date) return "";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().split("T")[0];
}

function getAptServiceLines(apt) {
  if (Array.isArray(apt?.services) && apt.services.length > 0) {
    return apt.services.map((s) => ({
      serviceId: String(s.service?._id || s.service || ""),
      quantity: Math.max(1, Number(s.quantity) || 1),
    }));
  }
  const sid = apt?.service?._id || apt?.service;
  if (sid) {
    return [{ serviceId: String(sid), quantity: Math.max(1, Number(apt?.quantity) || 1) }];
  }
  return [];
}

export default function RescheduleModal({ appointment, onClose, onSuccess }) {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState([]);
  const [allServices, setAllServices] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notifyUser, setNotifyUser] = useState(true);
  const [notifyEmployee, setNotifyEmployee] = useState(true);
  const [addServiceId, setAddServiceId] = useState("");

  useEffect(() => {
    if (!appointment) return;
    setDate(toDateInputValue(appointment.date));
    setTime(appointment.time || "");
    setEmployeeId(
      appointment.employee?._id?.toString?.() || appointment.employee?.toString?.() || ""
    );
    setNotes(appointment.notes || "");
    setLines(getAptServiceLines(appointment));
  }, [appointment]);

  useEffect(() => {
    if (!appointment) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [svcRes, empRes] = await Promise.all([
          fetch("/api/admin/services", { ...fetchOpts, cache: "no-store" }),
          fetch("/api/employee", fetchOpts),
        ]);
        const [svcData, empData] = await Promise.all([svcRes.json(), empRes.json()]);
        if (cancelled) return;
        const bookable = (Array.isArray(svcData) ? svcData : []).filter(
          (s) => s.active && s.price && s.duration
        );
        setAllServices(bookable);
        const emps = Array.isArray(empData) ? empData : [];
        emps.sort((a, b) => (a.name || "").localeCompare(b.name || "", undefined, { sensitivity: "base" }));
        setEmployees(emps);
      } catch {
        if (!cancelled) toast.error("Could not load services or employees");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [appointment]);

  const previewTotal = useMemo(() => {
    let subtotal = 0;
    let duration = 0;
    for (const line of lines) {
      const svc = allServices.find((s) => String(s._id) === line.serviceId);
      if (!svc) continue;
      const qty = Math.max(1, Number(line.quantity) || 1);
      subtotal += (Number(svc.price) || 0) * qty;
      duration += (Number(svc.duration) || 0) * qty;
    }
    return { subtotal, duration };
  }, [lines, allServices]);

  const updateLineQty = (serviceId, delta) => {
    setLines((prev) =>
      prev
        .map((l) => {
          if (l.serviceId !== serviceId) return l;
          const next = Math.max(1, Math.min(20, (l.quantity || 1) + delta));
          return { ...l, quantity: next };
        })
        .filter((l) => l.quantity > 0)
    );
  };

  const removeLine = (serviceId) => {
    setLines((prev) => prev.filter((l) => l.serviceId !== serviceId));
  };

  const addServiceLine = () => {
    if (!addServiceId) return;
    setLines((prev) => {
      const exists = prev.find((l) => l.serviceId === addServiceId);
      if (exists) {
        return prev.map((l) =>
          l.serviceId === addServiceId
            ? { ...l, quantity: Math.min(20, (l.quantity || 1) + 1) }
            : l
        );
      }
      return [...prev, { serviceId: addServiceId, quantity: 1 }];
    });
    setAddServiceId("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!date || !time) {
      toast.error("Date and time are required");
      return;
    }
    if (!lines.length) {
      toast.error("Add at least one service");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/appointment/${appointment._id}`, {
        ...fetchOpts,
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reschedule",
          date,
          time,
          employee: employeeId || undefined,
          notes,
          services: lines.map((l) => ({ serviceId: l.serviceId, quantity: l.quantity })),
          notifyUser,
          notifyEmployee,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.message || "Could not reschedule appointment");
        return;
      }

      const wa = data.rescheduleWhatsapp;
      if (wa?.user?.success === false || wa?.employee?.success === false) {
        toast.success("Appointment rescheduled (some WhatsApp messages may have failed)");
      } else {
        toast.success("Appointment rescheduled — customer & employee notified");
      }
      onSuccess?.(data);
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("Could not reschedule appointment");
    } finally {
      setSaving(false);
    }
  };

  if (!appointment) return null;

  const status = appointment.status || "pending";
  const canReschedule = status !== "cancelled" && status !== "completed";

  return (
    <div className={cardStyles.modalOverlay} onClick={onClose} role="presentation">
      <div
        className={cardStyles.modal}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        style={{ maxWidth: 640 }}
      >
        <div className={cardStyles.modalHeader}>
          <h3 className={cardStyles.modalTitle}>Reschedule appointment</h3>
          <button type="button" className={cardStyles.modalClose} onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        {!canReschedule ? (
          <div className={cardStyles.modalBody}>
            <p style={{ color: "#64748b" }}>Cancelled or completed appointments cannot be rescheduled.</p>
          </div>
        ) : loading ? (
          <div className={cardStyles.modalBody}>
            <p style={{ color: "#64748b" }}>Loading…</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className={cardStyles.modalBody}>
              <p style={{ fontSize: 14, color: "#475569", marginBottom: 16, lineHeight: 1.5 }}>
                Update date, time, services, or assigned employee. WhatsApp notifications go to the
                customer and employee when enabled below.
              </p>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 13 }}>
                  <span style={{ fontWeight: 600, color: "#334155" }}>New date</span>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                    style={fieldStyle}
                  />
                </label>
                <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 13 }}>
                  <span style={{ fontWeight: 600, color: "#334155" }}>New time</span>
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    required
                    style={fieldStyle}
                  />
                </label>
              </div>

              <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 13, marginBottom: 16 }}>
                <span style={{ fontWeight: 600, color: "#334155" }}>Assigned employee</span>
                <select
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  style={fieldStyle}
                >
                  <option value="">— No employee —</option>
                  {employees.map((em) => (
                    <option key={em._id} value={em._id}>
                      {em.name}
                      {em.salon?.name ? ` · ${em.salon.name}` : ""}
                      {!em.active ? " (inactive)" : ""}
                    </option>
                  ))}
                </select>
              </label>

              <div style={{ marginBottom: 16 }}>
                <div style={{ fontWeight: 600, color: "#334155", fontSize: 13, marginBottom: 8 }}>
                  Services
                </div>
                {lines.length === 0 ? (
                  <p style={{ fontSize: 13, color: "#94a3b8" }}>No services — add one below.</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {lines.map((line) => {
                      const svc = allServices.find((s) => String(s._id) === line.serviceId);
                      return (
                        <div
                          key={line.serviceId}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            padding: "10px 12px",
                            border: "1px solid #e2e8f0",
                            borderRadius: 10,
                            background: "#f8fafc",
                          }}
                        >
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 600, fontSize: 14 }}>{svc?.name || "Service"}</div>
                            <div style={{ fontSize: 12, color: "#64748b" }}>
                              ₹{svc?.price || 0} · {svc?.duration || 0} min
                            </div>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <button
                              type="button"
                              onClick={() => updateLineQty(line.serviceId, -1)}
                              style={qtyBtnStyle}
                            >
                              −
                            </button>
                            <span style={{ minWidth: 24, textAlign: "center", fontWeight: 700 }}>
                              {line.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateLineQty(line.serviceId, 1)}
                              style={qtyBtnStyle}
                            >
                              +
                            </button>
                            <button
                              type="button"
                              onClick={() => removeLine(line.serviceId)}
                              style={{ ...qtyBtnStyle, color: "#b91c1c", borderColor: "#fecaca" }}
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                  <select
                    value={addServiceId}
                    onChange={(e) => setAddServiceId(e.target.value)}
                    style={{ ...fieldStyle, flex: "1 1 200px" }}
                  >
                    <option value="">Add service…</option>
                    {allServices.map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.name} — ₹{s.price} ({s.duration} min)
                      </option>
                    ))}
                  </select>
                  <button type="button" onClick={addServiceLine} style={secondaryBtnStyle}>
                    Add
                  </button>
                </div>

                <div style={{ marginTop: 10, fontSize: 13, color: "#475569" }}>
                  Preview: ₹{previewTotal.subtotal} · {previewTotal.duration} min total
                  <span style={{ color: "#94a3b8" }}> (service charge & coupon applied on save)</span>
                </div>
              </div>

              <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 13, marginBottom: 16 }}>
                <span style={{ fontWeight: 600, color: "#334155" }}>Notes (optional)</span>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  style={{ ...fieldStyle, resize: "vertical" }}
                />
              </label>

              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14 }}>
                  <input
                    type="checkbox"
                    checked={notifyUser}
                    onChange={(e) => setNotifyUser(e.target.checked)}
                  />
                  Send WhatsApp to customer
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14 }}>
                  <input
                    type="checkbox"
                    checked={notifyEmployee}
                    onChange={(e) => setNotifyEmployee(e.target.checked)}
                    disabled={!employeeId}
                  />
                  Send WhatsApp to employee
                </label>
              </div>
            </div>

            <div className={`${cardStyles.modalActions} ${cardStyles.confirmEmployeeModalActions}`}>
              <button
                type="button"
                className={cardStyles.confirmModalBtnSecondary}
                onClick={onClose}
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={cardStyles.confirmModalBtnPrimary}
                disabled={saving}
                style={{ opacity: saving ? 0.75 : 1 }}
              >
                {saving ? "Saving…" : "Save & notify"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

const fieldStyle = {
  padding: "10px 12px",
  borderRadius: 8,
  border: "1px solid #e2e8f0",
  fontSize: 14,
  width: "100%",
};

const qtyBtnStyle = {
  width: 32,
  height: 32,
  borderRadius: 8,
  border: "1px solid #e2e8f0",
  background: "#fff",
  cursor: "pointer",
  fontWeight: 700,
  fontSize: 16,
};

const secondaryBtnStyle = {
  padding: "10px 16px",
  borderRadius: 8,
  border: "1px solid #e2e8f0",
  background: "#fff",
  fontWeight: 600,
  cursor: "pointer",
};
