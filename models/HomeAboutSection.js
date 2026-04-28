import mongoose from "mongoose";

const homeAboutSchema = new mongoose.Schema(
  {
    image: { type: String },
    subtitle: { type: String, default: "We Provide Best Services" },
    title: { type: String, default: "Welcome to Spa Center" },
    description: { type: String },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

homeAboutSchema.index({ createdAt: -1 });

export default mongoose.models.HomeAboutSection ||
  mongoose.model("HomeAboutSection", homeAboutSchema);
