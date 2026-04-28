import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Banner from "@/models/Banner";
import cloudinary from "@/lib/cloudinary";

export async function GET(req) {
  await connectDB();
  const banners = await Banner.find().sort({ sortOrder: 1, createdAt: -1 }).lean();
  return NextResponse.json(banners, {
    headers: {
      "Cache-Control": "public, s-maxage=120, stale-while-revalidate=300",
    },
  });
}

export async function POST(req) {
  await connectDB();

  const formData = await req.formData();
  const file = formData.get("image");
  const mobileFile = formData.get("mobileImage");
  const title = (formData.get("title") || "").toString().trim();
  const description = (formData.get("description") || "").toString().trim();
  const sortOrderRaw = Number(formData.get("sortOrder"));
  const sortOrder = Number.isFinite(sortOrderRaw) ? Math.floor(sortOrderRaw) : 0;

  // Upload desktop image
  const buffer = Buffer.from(await file.arrayBuffer());
  const upload = await new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      { folder: "banners" },
      (err, result) => {
        if (err) reject(err);
        resolve(result);
      }
    ).end(buffer);
  });

  // Upload mobile image if provided
  let mobileUpload = null;
  if (mobileFile) {
    const mobileBuffer = Buffer.from(await mobileFile.arrayBuffer());
    mobileUpload = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { folder: "banners/mobile" },
        (err, result) => {
          if (err) reject(err);
          resolve(result);
        }
      ).end(mobileBuffer);
    });
  }

  const banner = await Banner.create({
    image: upload.secure_url,
    public_id: upload.public_id,
    mobileImage: mobileUpload ? mobileUpload.secure_url : null,
    mobile_public_id: mobileUpload ? mobileUpload.public_id : null,
    title: title || null,
    description: description || null,
    sortOrder,
  });

  return NextResponse.json(banner);
}
