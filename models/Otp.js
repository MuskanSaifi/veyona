import mongoose from "mongoose";

/**
 * Otp
 * One-time 4-digit code tied to a ServiceVisit. Used to verify that the
 * employee is physically with the customer before service start time is
 * recorded.
 *
 * The TTL index on `expiresAt` lets MongoDB delete expired OTPs automatically.
 * Codes are also marked `consumed` after successful verification so they
 * cannot be reused.
 */
const otpSchema = new mongoose.Schema(
  {
    serviceVisit: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ServiceVisit",
      required: true,
      index: true,
    },
    code: { type: String, required: true }, // 4-digit numeric, stored as string to keep leading zeros
    expiresAt: { type: Date, required: true },
    consumed: { type: Boolean, default: false },
    attempts: { type: Number, default: 0 },
  },
  { timestamps: true, collection: "otps" }
);

// TTL index: MongoDB removes the document automatically once expiresAt passes.
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const MODEL_NAME = "Otp";

if (mongoose.models[MODEL_NAME]) {
  delete mongoose.models[MODEL_NAME];
}

export default mongoose.model(MODEL_NAME, otpSchema);
