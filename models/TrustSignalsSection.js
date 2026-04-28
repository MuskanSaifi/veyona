import mongoose from "mongoose";

const trustPointSchema = new mongoose.Schema(
  {
    title: { type: String, trim: true },
    text: { type: String, trim: true },
  },
  { _id: false }
);

const quickReviewSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true },
    city: { type: String, trim: true },
    review: { type: String, trim: true },
  },
  { _id: false }
);

const beforeAfterSchema = new mongoose.Schema(
  {
    beforeImage: { type: String, trim: true },
    afterImage: { type: String, trim: true },
    beforeLabel: { type: String, trim: true, default: "Before" },
    afterLabel: { type: String, trim: true, default: "After" },
  },
  { _id: false }
);

const trustSignalsSchema = new mongoose.Schema(
  {
    kicker: { type: String, trim: true, default: "Trust & Safety" },
    title: {
      type: String,
      trim: true,
      default: "Why Customers Trust Veyona for Home Services",
    },
    description: { type: String, trim: true },
    trustPoints: { type: [trustPointSchema], default: [] },
    quickReviews: { type: [quickReviewSchema], default: [] },
    beforeAfterItems: { type: [beforeAfterSchema], default: [] },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

trustSignalsSchema.index({ createdAt: -1 });

export default mongoose.models.TrustSignalsSection ||
  mongoose.model("TrustSignalsSection", trustSignalsSchema);
