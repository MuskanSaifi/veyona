import mongoose from "mongoose";

/**
 * Per-period counter for invoice numbers.
 *
 * Current scheme: calendar year-month
 *   period: "YM-2026-05"  →  invoice number  "VEY/2026-05/00001"
 *
 * Legacy financial-year docs ("FY-2026-27") may still exist from earlier
 * invoices; they are simply ignored by the new allocator.
 */
const invoiceSequenceSchema = new mongoose.Schema(
  {
    period: { type: String, required: true, unique: true }, // e.g. "YM-2026-05"
    seq: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.models.InvoiceSequence ||
  mongoose.model("InvoiceSequence", invoiceSequenceSchema);
