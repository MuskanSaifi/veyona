import mongoose from "mongoose";

/**
 * SiteSettings — single-document store for small site-wide knobs the admin
 * can tweak without code changes.
 *
 * Currently stores the "Happy Customers" header counter, but designed so
 * other simple flags / numbers can be added later without new collections.
 *
 * Always read with: `SiteSettings.findOne().sort({ createdAt: -1 })`.
 */
const siteSettingsSchema = new mongoose.Schema(
  {
    // Happy Customers strip in the site header
    happyCustomersEnabled: { type: Boolean, default: true },
    happyCustomersCount: { type: Number, default: 0, min: 0 },
    happyCustomersLabel: { type: String, default: "Happy Customers", trim: true },
    // Optional suffix shown after the number, e.g. "+", "K+"
    happyCustomersSuffix: { type: String, default: "+", trim: true },
  },
  { timestamps: true }
);

siteSettingsSchema.index({ createdAt: -1 });

const MODEL_NAME = "SiteSettings";

if (mongoose.models[MODEL_NAME]) {
  delete mongoose.models[MODEL_NAME];
}

export default mongoose.model(MODEL_NAME, siteSettingsSchema);
