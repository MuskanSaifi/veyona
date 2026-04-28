import mongoose from "mongoose";

const bannerSchema = new mongoose.Schema(
  {
    image: String,
    mobileImage: String, // Mobile view banner
    public_id: String,
    mobile_public_id: String, // Mobile image public_id for Cloudinary
    title: String, // Banner title (shown over image)
    description: String, // Banner description (shown over image)
    sortOrder: { type: Number, default: 0 }, // lower comes first
    active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

bannerSchema.index({ createdAt: -1 });
bannerSchema.index({ active: 1 });
bannerSchema.index({ sortOrder: 1, createdAt: -1 });

export default mongoose.models.Banner ||
  mongoose.model("Banner", bannerSchema);
