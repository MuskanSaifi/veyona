// models/Reel.js
import mongoose from "mongoose";

const reelSchema = new mongoose.Schema(
  {
    title: String,
    description: String,
    video: String, // Cloudinary video URL
    public_id: String, // Cloudinary public_id for video
    thumbnail: String, // Optional thumbnail image URL
    thumbnail_public_id: String, // Thumbnail public_id
    active: { type: Boolean, default: true },
    order: { type: Number, default: 0 }, // For ordering reels
  },
  { timestamps: true }
);

reelSchema.index({ active: 1 });
reelSchema.index({ createdAt: -1 });

export default mongoose.models.Reel ||
  mongoose.model("Reel", reelSchema);