import mongoose from "mongoose";

const blacklistSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["customer", "employee"],
      required: true,
      index: true,
    },
    /** Normalized 10-digit phone for customers (and optional for employees). */
    phone: { type: String, trim: true, default: "" },
    /** Lowercased email. */
    email: { type: String, trim: true, lowercase: true, default: "" },
    /** Set when type is employee. */
    employeeRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      default: null,
    },
    name: { type: String, trim: true, default: "" },
    reason: { type: String, trim: true, default: "" },
    createdByRole: {
      type: String,
      enum: ["admin", "employee"],
      required: true,
    },
    createdById: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    createdByName: { type: String, trim: true, default: "" },
    active: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

blacklistSchema.index({ type: 1, active: 1, phone: 1 });
blacklistSchema.index({ type: 1, active: 1, email: 1 });
blacklistSchema.index({ type: 1, active: 1, employeeRef: 1 });

export default mongoose.models.Blacklist ||
  mongoose.model("Blacklist", blacklistSchema);
