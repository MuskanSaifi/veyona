import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import User from "@/models/User";
import jwt from "jsonwebtoken";
import cloudinary from "@/lib/cloudinary";

export async function POST(req) {
  await connectDB();

  try {
    const token = req.cookies.get("userToken")?.value;
    if (!token) return NextResponse.json({ message: "Not authenticated" }, { status: 401 });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== "user") {
      return NextResponse.json({ message: "Invalid token" }, { status: 401 });
    }

    const user = await User.findById(decoded.id);
    if (!user) return NextResponse.json({ message: "User not found" }, { status: 404 });

    const formData = await req.formData();
    const file = formData.get("file");
    if (!file || file.size === 0) {
      return NextResponse.json({ message: "No file" }, { status: 400 });
    }

    // Allow common image types only
    const type = String(file.type || "").toLowerCase();
    if (!type.startsWith("image/")) {
      return NextResponse.json({ message: "Only images are allowed" }, { status: 400 });
    }

    const maxBytes = 2 * 1024 * 1024; // 2MB
    if (file.size > maxBytes) {
      return NextResponse.json({ message: "Image must be <= 2MB" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const upload = await new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder: "user-avatars",
            resource_type: "image",
            transformation: [
              { width: 320, height: 320, crop: "fill", gravity: "face" },
              { quality: "auto" },
              { fetch_format: "auto" },
            ],
          },
          (err, result) => (err ? reject(err) : resolve(result))
        )
        .end(buffer);
    });

    // cleanup old avatar
    if (user.avatarPublicId) {
      cloudinary.uploader.destroy(user.avatarPublicId).catch(() => {});
    }

    user.avatar = upload.secure_url;
    user.avatarPublicId = upload.public_id;
    await user.save();

    return NextResponse.json({ avatar: user.avatar });
  } catch (error) {
    return NextResponse.json(
      { message: error.message || "Failed to upload avatar" },
      { status: 500 }
    );
  }
}

