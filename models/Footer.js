import mongoose from "mongoose";

const footerSchema = new mongoose.Schema(
  {
    logo: { type: String },
    description: { type: String },
    phone: { type: String },
    email: { type: String },
    address: { type: String },
    hours: { type: String },
    copyright: { type: String },
    facebookUrl: { type: String },
    instagramUrl: { type: String },
    threadsUrl: { type: String },
    linkedinUrl: { type: String },
  },
  { timestamps: true }
);

footerSchema.index({ createdAt: -1 });

export default mongoose.models.Footer || mongoose.model("Footer", footerSchema);
