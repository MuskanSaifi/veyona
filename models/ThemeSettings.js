import mongoose from "mongoose";

const themeSettingsSchema = new mongoose.Schema(
  {
    // Core theme tokens (map to CSS variables in app/globals.css)
    bgCream: { type: String, default: "#F5F0E6" },
    bgCharcoal: { type: String, default: "#333333" },
    bgFooterDark: { type: String, default: "#222222" },

    accentTerracotta: { type: String, default: "#AD6E5E" },
    accentCoral: { type: String, default: "#F28F79" },
    accentBrown: { type: String, default: "#B59A7E" },

    textDark: { type: String, default: "#222222" },
    textMuted: { type: String, default: "#5c5c5c" },
    borderLight: { type: String, default: "#e8e4dc" },
  },
  { timestamps: true }
);

themeSettingsSchema.index({ createdAt: -1 });

export default mongoose.models.ThemeSettings ||
  mongoose.model("ThemeSettings", themeSettingsSchema);

