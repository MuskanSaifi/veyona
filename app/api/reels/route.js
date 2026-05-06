import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Reel from "@/models/Reel";
import cloudinary from "@/lib/cloudinary";
import { Readable } from "stream";

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

    // Upload video to Cloudinary
    const buffer = Buffer.from(await file.arrayBuffer());
    const stream = Readable.from(buffer);

    const uploadResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: "video",
          folder: "reels",
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      stream.pipe(uploadStream);
    });

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
    return NextResponse.json({ error: "Failed to create reel" }, { status: 500 });
  }
}