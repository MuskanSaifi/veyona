import mongoose from "mongoose";

const appDownloadSchema = new mongoose.Schema(
  {
    title: { type: String, default: "Get the Salon & Clinic App" },
    description: { type: String, default: "We'll send you the app link soon—just open it on your phone to download." },
    subtitle: { type: String, default: "Available soon on iOS and Android" },
    image: { type: String },
    public_id: { type: String },
    downloadText: { type: String, default: "Download our app soon — Salon & Clinic booking made easy." },
    shareButtonText: { type: String, default: "Share App Link" },
    googlePlayUrl: { type: String, default: "#" },
    appStoreUrl: { type: String, default: "#" },
    footerText: { type: String, default: "Or you can also access our services at www.veyona.in from your mobile phone." },
    websiteUrl: { type: String, default: "https://www.veyona.in" },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

appDownloadSchema.index({ createdAt: -1 });

export default mongoose.models.AppDownloadSection ||
  mongoose.model("AppDownloadSection", appDownloadSchema);
