import mongoose from "mongoose";

/**
 * ServiceVisit
 * Tracks an on-site employee visit to a customer, with OTP-gated start
 * and a measured service duration.
 *
 * Mapped to the "service_visits" MongoDB collection so it does not collide
 * with the existing "services" catalog collection used elsewhere in the app.
 *
 * Status lifecycle:
 *   pending      -> visit created, waiting for customer OTP verification
 *   in_progress  -> OTP verified, startTime recorded, employee is on-site
 *   completed    -> endTime recorded, duration calculated, feedback link sent
 *   cancelled    -> visit aborted before completion
 */
const serviceVisitSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    // Optional free-form label (e.g. "Hair Color + Spa", "AC Service") so admins
    // can identify the visit without depending on the salon services catalog.
    serviceLabel: { type: String, trim: true, default: "" },

    status: {
      type: String,
      enum: ["pending", "in_progress", "completed", "cancelled"],
      default: "pending",
      index: true,
    },

    otpVerified: { type: Boolean, default: false },
    otpVerifiedAt: { type: Date },

    startTime: { type: Date },
    endTime: { type: Date },
    durationMinutes: { type: Number, default: 0 },

    feedbackSentAt: { type: Date },
    feedbackSubmittedAt: { type: Date },
    /** Set when visit was created from an appointment end-service flow */
    appointment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
      sparse: true,
    },
  },
  { timestamps: true, collection: "service_visits" }
);

serviceVisitSchema.index({ employee: 1, status: 1 });
serviceVisitSchema.index({ customer: 1 });
serviceVisitSchema.index({ createdAt: -1 });

const MODEL_NAME = "ServiceVisit";

// Match the project's hot-reload-safe model registration pattern.
if (mongoose.models[MODEL_NAME]) {
  delete mongoose.models[MODEL_NAME];
}

export default mongoose.model(MODEL_NAME, serviceVisitSchema);
