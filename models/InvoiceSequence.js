import mongoose from "mongoose";

/**
 * Counter for invoice numbers.
 *
 * Current scheme: Continuous global sequence across all months.
 *   period: "GLOBAL_CONTINUOUS"  →  invoice numbers:
 *     VEY/2026-05/00001
 *     VEY/2026-05/00002
 *     VEY/2026-06/00003  (continuous serial number, only month changes)
 *
 * Legacy period keys ("YM-2026-05", "FY-2026-27") are preserved for history.
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
