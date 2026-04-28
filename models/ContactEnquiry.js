import mongoose from "mongoose";

const contactEnquirySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String },
    subject: { type: String, required: true },
    message: { type: String, required: true },
    status: {
      type: String,
      enum: ["new", "read", "replied", "resolved"],
      default: "new",
    },
  },
  { timestamps: true }
);

export default mongoose.models.ContactEnquiry ||
  mongoose.model("ContactEnquiry", contactEnquirySchema);
