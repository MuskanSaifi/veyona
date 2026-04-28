import mongoose from "mongoose";

const careerApplicationSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String },
    role: { type: String, required: true },
    experience: { type: String },
    preferredLocation: { type: String },
    message: { type: String },
    source: { type: String }, // How did the applicant hear about Veyona
    status: {
      type: String,
      enum: ["new", "in-review", "shortlisted", "rejected", "hired"],
      default: "new",
    },
  },
  { timestamps: true }
);

export default mongoose.models.CareerApplication ||
  mongoose.model("CareerApplication", careerApplicationSchema);

