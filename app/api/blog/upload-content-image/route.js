// app/api/blog/upload-content-image/route.js
import cloudinary from "@/lib/cloudinary";
import { NextResponse } from "next/server";

export async function POST(req) {
  const formData = await req.formData();
  const file = formData.get("file");

  if (!file || file.size === 0) {
    return NextResponse.json({ error: "No file" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  const upload = await new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      { folder: "content-images" },
      (err, result) => (err ? reject(err) : resolve(result))
    ).end(buffer);
  });

  return NextResponse.json({
    url: upload.secure_url,
    public_id: upload.public_id,
  });
}
