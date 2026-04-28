import mongoose from "mongoose";

const pageContentSchema = new mongoose.Schema(
  {
    pageType: {
      type: String,
      enum: ["about", "privacy", "terms", "contact"],
      required: true,
      unique: true,
    },
    title: { type: String, required: true },
    heroTitle: { type: String },
    heroDescription: { type: String },
    content: { type: String, required: true }, // HTML content
    metaTitle: { type: String },
    metaDescription: { type: String },
    metaKeywords: { type: String },
    lastUpdated: { type: Date, default: Date.now },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.models.PageContent ||
  mongoose.model("PageContent", pageContentSchema);
