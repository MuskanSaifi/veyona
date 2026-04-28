import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Banner from "@/models/Banner";
import cloudinary from "@/lib/cloudinary";

export async function DELETE(req, { params }) {
  await connectDB();

  const { id } = await params; // ✅ FIXED

  const banner = await Banner.findById(id);
  if (!banner) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Delete from Cloudinary
  if (banner.public_id) {
    await cloudinary.uploader.destroy(banner.public_id);
  }
  if (banner.mobile_public_id) {
    await cloudinary.uploader.destroy(banner.mobile_public_id);
  }

  await Banner.findByIdAndDelete(id);

  return NextResponse.json({ success: true });
}

export async function PUT(req, { params }) {
  await connectDB();

  const { id } = await params;
  const contentType = req.headers.get("content-type") || "";

  let update = {};

  if (contentType.includes("multipart/form-data")) {
    const formData = await req.formData();
    const file = formData.get("image");
    const mobileFile = formData.get("mobileImage");
    const title = (formData.get("title") || "").toString().trim();
    const description = (formData.get("description") || "").toString().trim();
    const sortOrderRaw = Number(formData.get("sortOrder"));
    const sortOrder = Number.isFinite(sortOrderRaw) ? Math.floor(sortOrderRaw) : undefined;

    update.title = title || null;
    update.description = description || null;
    if (sortOrder !== undefined) update.sortOrder = sortOrder;

    const banner = await Banner.findById(id);
    if (!banner) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (file && file.size > 0) {
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
      if (banner.public_id) {
        await cloudinary.uploader.destroy(banner.public_id);
      }
      update.image = upload.secure_url;
      update.public_id = upload.public_id;
    }

    if (mobileFile && mobileFile.size > 0) {
      const mobileBuffer = Buffer.from(await mobileFile.arrayBuffer());
      const mobileUpload = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          { folder: "banners/mobile" },
          (err, result) => {
            if (err) reject(err);
            resolve(result);
          }
        ).end(mobileBuffer);
      });
      if (banner.mobile_public_id) {
        await cloudinary.uploader.destroy(banner.mobile_public_id);
      }
      update.mobileImage = mobileUpload.secure_url;
      update.mobile_public_id = mobileUpload.public_id;
    }

    const updated = await Banner.findByIdAndUpdate(id, update, { new: true });
    return NextResponse.json(updated);
  }

  const body = await req.json();
  if (typeof body.active === "boolean") update.active = body.active;
  if (body.title !== undefined) update.title = body.title?.trim() || null;
  if (body.description !== undefined) update.description = body.description?.trim() || null;
  if (body.sortOrder !== undefined) {
    const sRaw = Number(body.sortOrder);
    update.sortOrder = Number.isFinite(sRaw) ? Math.floor(sRaw) : 0;
  }

  const banner = await Banner.findByIdAndUpdate(id, update, { new: true });
  if (!banner) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(banner);
}
