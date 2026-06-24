import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import PromotionalBanner from "@/models/PromotionalBanner";
import cloudinary from "@/lib/cloudinary";
import { uploadImageBuffer } from "@/lib/cloudinaryUpload";

export async function PUT(req, { params }) {
  await connectDB();
  const { id } = await params;

  try {
    const existing = await PromotionalBanner.findById(id);
    if (!existing) {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }

    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("image");
      const update = {};

      const setField = (key, val) => {
        if (val !== null && val !== undefined) update[key] = val;
      };

      setField("title", (formData.get("title") || "").toString().trim() || existing.title);
      setField("subtitle", (formData.get("subtitle") || "").toString().trim());
      setField("badge", (formData.get("badge") || "").toString().trim());
      setField("linkUrl", (formData.get("linkUrl") || "").toString().trim());
      setField("linkLabel", (formData.get("linkLabel") || "").toString().trim() || "Book Now");

      const placement = (formData.get("placement") || "").toString();
      if (placement && PromotionalBanner.PLACEMENTS.includes(placement)) {
        update.placement = placement;
      }

      const sortOrderRaw = formData.get("sortOrder");
      if (sortOrderRaw !== null && sortOrderRaw !== "") {
        update.sortOrder = Math.floor(Number(sortOrderRaw) || 0);
      }

      const startDate = formData.get("startDate");
      const endDate = formData.get("endDate");
      update.startDate = startDate ? new Date(startDate) : null;
      update.endDate = endDate ? new Date(endDate) : null;

      if (file && file.size > 0) {
        const buffer = Buffer.from(await file.arrayBuffer());
        const upload = await uploadImageBuffer(buffer, "promotional-banners");
        if (existing.public_id) {
          await cloudinary.uploader.destroy(existing.public_id).catch(() => {});
        }
        update.image = upload.secure_url;
        update.public_id = upload.public_id;
      }

      const doc = await PromotionalBanner.findByIdAndUpdate(id, update, { new: true });
      return NextResponse.json(doc);
    }

    const body = await req.json();
    const update = { ...body };
    if (update.startDate !== undefined) {
      update.startDate = update.startDate ? new Date(update.startDate) : null;
    }
    if (update.endDate !== undefined) {
      update.endDate = update.endDate ? new Date(update.endDate) : null;
    }

    const doc = await PromotionalBanner.findByIdAndUpdate(id, update, { new: true });
    if (!doc) {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }
    return NextResponse.json(doc);
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  await connectDB();
  const { id } = await params;

  const doc = await PromotionalBanner.findById(id);
  if (!doc) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  if (doc.public_id) {
    await cloudinary.uploader.destroy(doc.public_id).catch(() => {});
  }
  await PromotionalBanner.findByIdAndDelete(id);
  return NextResponse.json({ success: true });
}
