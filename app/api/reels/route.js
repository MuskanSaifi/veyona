import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Reel from "@/models/Reel";
import { uploadVideoBuffer } from "@/lib/cloudinaryUpload";

export const maxDuration = 180;
const MAX_VIDEO_BYTES = 80 * 1024 * 1024;

await connectDB();

export async function GET() {
  try {
    const reels = await Reel.find({ active: true }).sort({ order: 1, createdAt: -1 });
    return NextResponse.json(reels);
  } catch (error) {
    console.error("Error fetching reels:", error);
    return NextResponse.json({ error: "Failed to fetch reels" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const formData = await request.formData();
    const title = formData.get("title");
    const description = formData.get("description");
    const file = formData.get("video");

    if (!file || !title) {
      return NextResponse.json({ error: "Title and video file are required" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    if (!buffer.length) {
      return NextResponse.json({ error: "Video file is empty" }, { status: 400 });
    }
    if (buffer.length > MAX_VIDEO_BYTES) {
      return NextResponse.json(
        { error: "Video is too large. Maximum size is 80MB." },
        { status: 413 }
      );
    }

    const uploadResult = await uploadVideoBuffer(buffer, "reels");

    // Create reel in DB
    const reel = new Reel({
      title,
      description,
      video: uploadResult.secure_url,
      public_id: uploadResult.public_id,
    });

    await reel.save();

    return NextResponse.json(reel, { status: 201 });
  } catch (error) {
    console.error("Error creating reel:", error);
    const message =
      error?.message || error?.error?.message || "Failed to create reel";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}