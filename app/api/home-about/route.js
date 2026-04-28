import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import HomeAboutSection from "@/models/HomeAboutSection";
import cloudinary from "@/lib/cloudinary";

export async function GET() {
  await connectDB();
  const doc = await HomeAboutSection.findOne().sort({ createdAt: -1 }).lean();
  return NextResponse.json(doc, {
    headers: {
      "Cache-Control": "public, s-maxage=120, stale-while-revalidate=300",
    },
  });
}

export async function POST(req) {
  await connectDB();

  const formData = await req.formData();
  const file = formData.get("image");
  const subtitle = (formData.get("subtitle") || "").toString().trim();
  const title = (formData.get("title") || "").toString().trim();
  const description = (formData.get("description") || "").toString().trim();

  let imageUrl = null;
  if (file && file.size > 0) {
    const buffer = Buffer.from(await file.arrayBuffer());
    const upload = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { folder: "home-about" },
        (err, result) => {
          if (err) reject(err);
          resolve(result);
        }
      ).end(buffer);
    });
    imageUrl = upload.secure_url;
  }

  const doc = await HomeAboutSection.create({
    image: imageUrl,
    subtitle: subtitle || "We Provide",
    title: title || "Welcome to Spa Center",
    description: description || null,
  });

  return NextResponse.json(doc);
}

export async function PUT(req) {
  await connectDB();

  const contentType = req.headers.get("content-type") || "";
  const existing = await HomeAboutSection.findOne().sort({ createdAt: -1 });

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
    update.subtitle = (formData.get("subtitle") || "").toString().trim() || null;
    update.title = (formData.get("title") || "").toString().trim() || null;
    update.description = (formData.get("description") || "").toString().trim() || null;

    if (file && file.size > 0) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const upload = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          { folder: "home-about" },
          (err, result) => {
            if (err) reject(err);
            resolve(result);
          }
        ).end(buffer);
      });
      update.image = upload.secure_url;
    }
  } else {
    const body = await req.json();
    if (body.subtitle !== undefined) update.subtitle = body.subtitle?.trim() || null;
    if (body.title !== undefined) update.title = body.title?.trim() || null;
    if (body.description !== undefined) update.description = body.description?.trim() || null;
  }

  const doc = await HomeAboutSection.findByIdAndUpdate(
    existing._id,
    update,
    { new: true }
  );

  return NextResponse.json(doc);
}
