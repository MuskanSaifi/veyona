// models/Blog.js
import mongoose from "mongoose";

const blogSchema = new mongoose.Schema(
  {
    title: String,
    slug: { type: String, unique: true },
    excerpt: String,
    content: String,

    metaTitle: String,
    metaDescription: String,
    metaKeywords: String,

    image: String,
    public_id: String, // feature image

    contentImages: [String], // ✅ inline content images public_ids

    author: { type: String, default: "Admin" },
    category: String,
    tags: [String],

    featured: { type: Boolean, default: false },
    active: { type: Boolean, default: true },
    views: { type: Number, default: 0 },
  },
  { timestamps: true }
);

blogSchema.index({ active: 1, featured: 1 });
blogSchema.index({ createdAt: -1 });

export default mongoose.models.Blog ||
  mongoose.model("Blog", blogSchema);
