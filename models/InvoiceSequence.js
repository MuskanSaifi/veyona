import mongoose from "mongoose";

/** FY counter for invoice numbers: VEY/2026-27/00001 */
const invoiceSequenceSchema = new mongoose.Schema(
  {
    period: { type: String, required: true, unique: true }, // e.g. "FY-2026-27"
    seq: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.models.InvoiceSequence ||
  mongoose.model("InvoiceSequence", invoiceSequenceSchema);
