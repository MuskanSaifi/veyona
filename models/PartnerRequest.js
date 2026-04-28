import mongoose from "mongoose";

const partnerRequestSchema = new mongoose.Schema(
  {
    businessName: { type: String, required: true },
    contactName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String },
    businessType: { type: String },
    location: { type: String },
    message: { type: String, required: true },
    source: { type: String }, // how they heard about us
    status: {
      type: String,
      enum: ["new", "in-review", "approved", "rejected"],
      default: "new",
    },
  },
  { timestamps: true }
);

export default mongoose.models.PartnerRequest ||
  mongoose.model("PartnerRequest", partnerRequestSchema);

