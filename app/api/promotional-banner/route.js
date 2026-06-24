import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import PromotionalBanner from "@/models/PromotionalBanner";
import { uploadImageBuffer } from "@/lib/cloudinaryUpload";
import { filterLivePromotionalBanners } from "@/lib/promotionalBanner";

export async function GET(req) {
  await connectDB();
  const { searchParams } = new URL(req.url);
  const all = searchParams.get("all") === "true";
  const placement = searchParams.get("placement") || "";

  const list = await PromotionalBanner.find()
    .sort({ sortOrder: 1, createdAt: -1 })
    .lean();

  if (all) {
    return NextResponse.json(list);
  }

  const filtered = filterLivePromotionalBanners(list, {
    placement: placement || undefined,
  });

  return NextResponse.json(filtered, {
    headers: {
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
    },
  });
}

export async function POST(req) {
  await connectDB();

  try {
    const formData = await req.formData();
    const file = formData.get("image");
    const title = (formData.get("title") || "").toString().trim();
    const subtitle = (formData.get("subtitle") || "").toString().trim();
    const badge = (formData.get("badge") || "").toString().trim();
    const linkUrl = (formData.get("linkUrl") || "").toString().trim();
    const linkLabel = (formData.get("linkLabel") || "Book Now").toString().trim();
    const placement = (formData.get("placement") || "homepage").toString();
    const startDate = formData.get("startDate");
    const endDate = formData.get("endDate");
    const sortOrderRaw = Number(formData.get("sortOrder"));
    const sortOrder = Number.isFinite(sortOrderRaw) ? Math.floor(sortOrderRaw) : 0;

    if (!title) {
      return NextResponse.json({ message: "Title is required" }, { status: 400 });
    }

    let image = "";
    let public_id = "";
    if (file && file.size > 0) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const upload = await uploadImageBuffer(buffer, "promotional-banners");
      image = upload.secure_url;
      public_id = upload.public_id;
    }

    const doc = await PromotionalBanner.create({
      title,
      subtitle,
      badge,
      image: image || undefined,
      public_id: public_id || undefined,
      linkUrl,
      linkLabel: linkLabel || "Book Now",
      placement: PromotionalBanner.PLACEMENTS.includes(placement)
        ? placement
        : "homepage",
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      sortOrder,
    });

    return NextResponse.json(doc);
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
