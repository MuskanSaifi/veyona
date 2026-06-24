import mongoose from "mongoose";

const PLACEMENTS = ["homepage", "sitewide"];

const promotionalBannerSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    subtitle: { type: String, trim: true, default: "" },
    badge: { type: String, trim: true, default: "" },
    image: String,
    public_id: String,
    linkUrl: { type: String, trim: true, default: "" },
    linkLabel: { type: String, trim: true, default: "Book Now" },
    placement: {
      type: String,
      enum: PLACEMENTS,
      default: "homepage",
    },
    startDate: { type: Date },
    endDate: { type: Date },
    sortOrder: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

promotionalBannerSchema.index({ active: 1, placement: 1, sortOrder: 1 });
promotionalBannerSchema.index({ startDate: 1, endDate: 1 });

promotionalBannerSchema.statics.PLACEMENTS = PLACEMENTS;

export default mongoose.models.PromotionalBanner ||
  mongoose.model("PromotionalBanner", promotionalBannerSchema);
export { PLACEMENTS };
