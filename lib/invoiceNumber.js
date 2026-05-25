import connectDB from "@/lib/db";
import Appointment from "@/models/Appointment";
import InvoiceSequence from "@/models/InvoiceSequence";

/**
 * Calendar year-month key for the invoice sequence counter.
 *
 * Returns { label: "2026-05", key: "YM-2026-05" } for May 2026.
 *
 * The sequence is reset every calendar month so invoice numbers look like
 *   VEY/2026-05/00001, VEY/2026-05/00002, ... VEY/2026-06/00001
 */
export function yearMonthKey(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0"); // 01–12
  const label = `${y}-${m}`;
  return { label, key: `YM-${label}` };
}

/**
 * Backwards-compat alias — older code may still import `financialYearKey`.
 * New invoices use calendar year-month, so this just forwards.
 */
export const financialYearKey = yearMonthKey;

/**
 * Allocate the next invoice number for the calendar month of `issueDate`.
 * Format: VEY/YYYY-MM/NNNNN  (e.g. VEY/2026-05/00003)
 */
export async function allocateInvoiceNumber(issueDate = new Date()) {
  await connectDB();
  const { label, key } = yearMonthKey(issueDate);
  const doc = await InvoiceSequence.findOneAndUpdate(
    { period: key },
    { $inc: { seq: 1 }, $setOnInsert: { period: key } },
    { new: true, upsert: true }
  );
  return `VEY/${label}/${String(doc.seq).padStart(5, "0")}`;
}

/**
 * Return existing invoice number or allocate and persist on the appointment.
 * Existing appointments that already have an invoiceNumber assigned keep
 * their old number (so historical PDFs / emails stay consistent).
 */
export async function ensureAppointmentInvoiceNumber(appointmentId, issueDate = new Date()) {
  await connectDB();
  const apt = await Appointment.findById(appointmentId).select("invoiceNumber").lean();
  if (!apt) throw new Error("Appointment not found");
  if (apt.invoiceNumber) return apt.invoiceNumber;

  const invoiceNumber = await allocateInvoiceNumber(issueDate);
  await Appointment.findByIdAndUpdate(appointmentId, { invoiceNumber });
  return invoiceNumber;
}
