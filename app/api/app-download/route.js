import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import AppDownloadSection from "@/models/AppDownloadSection";
import cloudinary from "@/lib/cloudinary";

function trim(val) {
  return (val || "").toString().trim() || null;
}

export async function GET() {
  await connectDB();
  const doc = await AppDownloadSection.findOne().sort({ createdAt: -1 }).lean();
  return NextResponse.json(doc, {
    headers: {
      "Cache-Control": "public, s-maxage=120, stale-while-revalidate=300",
    },
  });
}

export async function POST(req) {
  await connectDB();
  try {
    const formData = await req.formData();
    const file = formData.get("image");

    let imageUrl = null;
    let public_id = null;
    if (file && file.size > 0) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const upload = await new Promise((resolve, reject) => {
        cloudinary.uploader
          .upload_stream({ folder: "app-download" }, (err, result) => {
            if (err) reject(err);
            resolve(result);
          })
          .end(buffer);
      });
      imageUrl = upload.secure_url;
      public_id = upload.public_id;
    }

    const doc = await AppDownloadSection.create({
      title: trim(formData.get("title")) || "Get the Salon & Clinic App",
      description: trim(formData.get("description")) || "We'll send you the app link soon—just open it on your phone to download.",
      subtitle: trim(formData.get("subtitle")) || "Available soon on iOS and Android",
      image: imageUrl,
      public_id,
      downloadText: trim(formData.get("downloadText")) || "Download our app soon — Salon & Clinic booking made easy.",
      shareButtonText: trim(formData.get("shareButtonText")) || "Share App Link",
      googlePlayUrl: trim(formData.get("googlePlayUrl")) || "#",
      appStoreUrl: trim(formData.get("appStoreUrl")) || "#",
      footerText: trim(formData.get("footerText")) || "Or you can also access our services at www.veyona.in from your mobile phone.",
      websiteUrl: trim(formData.get("websiteUrl")) || "https://www.veyona.in",
    });
    return NextResponse.json(doc);
  } catch (err) {
    return NextResponse.json(
      { message: err.message || "Failed to create" },
      { status: 500 }
    );
  }
}

export async function PUT(req) {
  await connectDB();
  const contentType = req.headers.get("content-type") || "";
  const existing = await AppDownloadSection.findOne().sort({ createdAt: -1 });

  if (!existing) {
    return NextResponse.json(
      { error: "No section found. Create one first." },
      { status: 404 }
    );
  }

  let update = {};

  if (contentType.includes("multipart/form-data")) {
    const formData = await req.formData();
    const file = formData.get("image");

    update.title = trim(formData.get("title")) ?? existing.title;
    update.description = trim(formData.get("description")) ?? existing.description;
    update.subtitle = trim(formData.get("subtitle")) ?? existing.subtitle;
    update.downloadText = trim(formData.get("downloadText")) ?? existing.downloadText;
    update.shareButtonText = trim(formData.get("shareButtonText")) ?? existing.shareButtonText;
    update.googlePlayUrl = trim(formData.get("googlePlayUrl")) ?? existing.googlePlayUrl;
    update.appStoreUrl = trim(formData.get("appStoreUrl")) ?? existing.appStoreUrl;
    update.footerText = trim(formData.get("footerText")) ?? existing.footerText;
    update.websiteUrl = trim(formData.get("websiteUrl")) ?? existing.websiteUrl;

    if (file && file.size > 0) {
      if (existing.public_id) {
        try {
          await cloudinary.uploader.destroy(existing.public_id);
        } catch (e) {}
      }
      const buffer = Buffer.from(await file.arrayBuffer());
      const upload = await new Promise((resolve, reject) => {
        cloudinary.uploader
          .upload_stream({ folder: "app-download" }, (err, result) => {
            if (err) reject(err);
            resolve(result);
          })
          .end(buffer);
      });
      update.image = upload.secure_url;
      update.public_id = upload.public_id;
    }
  } else {
    const body = await req.json();
    if (body.title !== undefined) update.title = trim(body.title) ?? existing.title;
    if (body.description !== undefined) update.description = trim(body.description) ?? existing.description;
    if (body.subtitle !== undefined) update.subtitle = trim(body.subtitle) ?? existing.subtitle;
    if (body.downloadText !== undefined) update.downloadText = trim(body.downloadText) ?? existing.downloadText;
    if (body.shareButtonText !== undefined) update.shareButtonText = trim(body.shareButtonText) ?? existing.shareButtonText;
    if (body.googlePlayUrl !== undefined) update.googlePlayUrl = trim(body.googlePlayUrl) ?? existing.googlePlayUrl;
    if (body.appStoreUrl !== undefined) update.appStoreUrl = trim(body.appStoreUrl) ?? existing.appStoreUrl;
    if (body.footerText !== undefined) update.footerText = trim(body.footerText) ?? existing.footerText;
    if (body.websiteUrl !== undefined) update.websiteUrl = trim(body.websiteUrl) ?? existing.websiteUrl;
  }

  const doc = await AppDownloadSection.findByIdAndUpdate(existing._id, update, {
    new: true,
  });
  return NextResponse.json(doc);
}
