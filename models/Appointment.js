import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    salon: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Salon",
      required: true,
    },
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: false,
      default: undefined,
    },
    // Primary service (for backward compatibility and simple views)
    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service",
      required: true,
    },
    // Optional: multiple services in a single appointment
    services: [
      {
        service: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Service",
          required: true,
        },
        name: String,
        duration: Number, // minutes
        price: Number,
        quantity: { type: Number, default: 1, min: 1 },
      },
    ],
    // Number of people / quantity for the same booking (e.g., family members)
    quantity: { type: Number, default: 1, min: 1 },
    totalDuration: { type: Number }, // combined duration of all services in minutes
    totalPrice: { type: Number }, // combined price of all services
    pricing: {
      subtotal: { type: Number }, // before discounts
      serviceCharge: { type: Number, default: 0 },
      discountAmount: { type: Number, default: 0 },
      couponCode: { type: String, trim: true, uppercase: true },
      totalPayable: { type: Number }, // after discounts
    },
    payment: {
      plan: {
        type: String,
        enum: ["full", "half", "book_now_pay_later", "pay_at_salon"],
        default: "half",
      }, // pay_at_salon = pay on visit (same dues shape as book_now_pay_later; legacy / alternate label)
      onlineDue: { type: Number, default: 0 },
      cashDue: { type: Number, default: 0 },
      paidOnline: { type: Number, default: 0 },
      paidCash: { type: Number, default: 0 },
      status: { type: String, enum: ["unpaid", "partial", "paid"], default: "unpaid" },
    },
    payments: [
      {
        kind: { type: String, enum: ["online", "cash"], required: true },
        amount: { type: Number, required: true },
        status: { type: String, enum: ["created", "captured", "failed", "recorded"], default: "created" },
        razorpayOrderId: String,
        razorpayPaymentId: String,
        razorpaySignature: String,
        recordedByRole: { type: String, enum: ["admin", "employee"] },
        recordedById: { type: mongoose.Schema.Types.ObjectId },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    date: { type: Date, required: true },
    time: { type: String, required: true }, // e.g., "14:30"
    status: {
      type: String,
      enum: ["pending", "confirmed", "completed", "cancelled", "expired"],
      default: "pending",
    },
    cancellation: {
      cancelledBy: { type: String, enum: ["user", "admin"] },
      cancelledAt: { type: Date },
      reason: { type: String, trim: true },
    },
    refund: {
      required: { type: Boolean, default: false },
      status: {
        type: String,
        enum: ["not_required", "pending", "processed"],
        default: "not_required",
      },
      dueAt: { type: Date },
      processedAt: { type: Date },
      processedByRole: { type: String, enum: ["admin"] },
      processedById: { type: mongoose.Schema.Types.ObjectId },
      note: { type: String, trim: true },
    },
    notes: String,
    location: String, // User's address for in-person appointments (not required for video consultation)
    /** Employee taps start/end on dashboard — shown to admin */
    serviceOtpCode: { type: String, select: false },
    serviceOtpSentAt: { type: Date },
    serviceOtpExpiresAt: { type: Date },
    serviceOtpVerifiedAt: { type: Date },
    serviceOtpAttempts: { type: Number, default: 0, select: false },
    serviceStartedAt: { type: Date },
    serviceEndedAt: { type: Date },
    /** Set when paid-in-full invoice was emailed (idempotency) */
    billingEmailSentAt: { type: Date },
    /** VEY/2026-27/00001 — assigned on first invoice PDF / email */
    invoiceNumber: { type: String, trim: true },
  },
  { timestamps: true }
);

appointmentSchema.index({ employee: 1, date: 1, time: 1 });
appointmentSchema.index({ employee: 1 });
appointmentSchema.index({ service: 1 });
appointmentSchema.index({ date: 1 });
appointmentSchema.index({ status: 1 });
appointmentSchema.index({ customer: 1 });

const MODEL_NAME = "Appointment";

// Next.js keeps modules hot-reloaded but Mongoose does NOT refresh compiled models.
// Without this, `mongoose.models.Appointment` stays on the first-loaded schema forever,
// so enum updates (e.g. payment.plan) never apply until a full server restart.
if (mongoose.models[MODEL_NAME]) {
  delete mongoose.models[MODEL_NAME];
}

export default mongoose.model(MODEL_NAME, appointmentSchema);




