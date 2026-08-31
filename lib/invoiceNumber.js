import connectDB from "@/lib/db";
import Appointment from "@/models/Appointment";
import InvoiceSequence from "@/models/InvoiceSequence";

/**
 * Calendar year-month key for the invoice date (used for invoice number formatting and monthly filters).
 *
 * Returns { label: "2026-05", key: "YM-2026-05" } for May 2026.
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

const CONTINUOUS_SEQUENCE_KEY = "GLOBAL_CONTINUOUS";

/**
 * Allocate the next invoice number.
 * Serial number continues sequentially across all months (only the month/year changes).
 * Format: VEY/YYYY-MM/NNNNN  (e.g. VEY/2026-05/00003, VEY/2026-06/00004)
 */
export async function allocateInvoiceNumber(issueDate = new Date()) {
  await connectDB();
  const { label } = yearMonthKey(issueDate);

  // Initialize continuous sequence if not already present, seeded from highest existing sequence
  const existingGlobal = await InvoiceSequence.findOne({ period: CONTINUOUS_SEQUENCE_KEY }).lean();
  if (!existingGlobal) {
    let maxSeq = 0;
    const allSeqs = await InvoiceSequence.find({}).lean();
    for (const s of allSeqs) {
      if (typeof s.seq === "number" && s.seq > maxSeq) {
        maxSeq = s.seq;
      }
    }
    const highestApt = await Appointment.findOne({ invoiceNumber: { $regex: /^VEY\// } })
      .sort({ createdAt: -1 })
      .select("invoiceNumber")
      .lean();
    if (highestApt?.invoiceNumber) {
      const parts = highestApt.invoiceNumber.split("/");
      const lastPart = parseInt(parts[parts.length - 1], 10);
      if (!Number.isNaN(lastPart) && lastPart > maxSeq) {
        maxSeq = lastPart;
      }
    }

    await InvoiceSequence.findOneAndUpdate(
      { period: CONTINUOUS_SEQUENCE_KEY },
      { $setOnInsert: { period: CONTINUOUS_SEQUENCE_KEY, seq: maxSeq } },
      { upsert: true }
    );
  }

  const doc = await InvoiceSequence.findOneAndUpdate(
    { period: CONTINUOUS_SEQUENCE_KEY },
    { $inc: { seq: 1 } },
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
