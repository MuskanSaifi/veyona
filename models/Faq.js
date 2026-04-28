import mongoose from "mongoose";

const faqSchema = new mongoose.Schema(
  {
    question: { type: String, required: true },
    answer: { type: String, required: true },
    order: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

faqSchema.index({ order: 1, createdAt: -1 });

export default mongoose.models.Faq || mongoose.model("Faq", faqSchema);
