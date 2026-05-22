import connectDB from "@/lib/db";
import Appointment from "@/models/Appointment";
import InvoiceSequence from "@/models/InvoiceSequence";

/** Indian FY: Apr–Mar → 2026-27 */
export function financialYearKey(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date);
  const year = d.getFullYear();
  const month = d.getMonth(); // 0 = Jan
  if (month >= 3) {
    const end = (year + 1) % 100;
    return { label: `${year}-${String(end).padStart(2, "0")}`, key: `FY-${year}-${String(end).padStart(2, "0")}` };
  }
  const start = year - 1;
  const end = year % 100;
  return { label: `${start}-${String(end).padStart(2, "0")}`, key: `FY-${start}-${String(end).padStart(2, "0")}` };
}

/**
 * Allocate next invoice number for the financial year of issueDate.
 * Format: VEY/2026-27/00001
 */
export async function allocateInvoiceNumber(issueDate = new Date()) {
  await connectDB();
  const { label, key } = financialYearKey(issueDate);
  const doc = await InvoiceSequence.findOneAndUpdate(
    { period: key },
    { $inc: { seq: 1 }, $setOnInsert: { period: key } },
    { new: true, upsert: true }
  );
  return `VEY/${label}/${String(doc.seq).padStart(5, "0")}`;
}

/**
 * Return existing invoice number or allocate and persist on the appointment.
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
