import mongoose from "mongoose";

const couponSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    type: { type: String, enum: ["percent", "fixed"], required: true }, // percent: value=10 => 10% off, fixed: value=100 => ₹100 off
    value: { type: Number, required: true, min: 0 },
    maxDiscount: { type: Number, min: 0 }, // for percent coupons
    minOrderAmount: { type: Number, min: 0, default: 0 },
    active: { type: Boolean, default: true },
    expiresAt: { type: Date }, // fixed end date (optional)
    validForDays: { type: Number, min: 0 }, // valid for X days from creation
    validForHours: { type: Number, min: 0 }, // valid for Y hours (in addition to days)
    usageLimit: { type: Number, min: 0 }, // optional global usage cap
    usedCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

couponSchema.index({ code: 1 }, { unique: true });
couponSchema.index({ active: 1, expiresAt: 1 });

export default mongoose.models.Coupon || mongoose.model("Coupon", couponSchema);

