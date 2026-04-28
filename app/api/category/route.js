import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Category from "@/models/Category";
import cloudinary from "@/lib/cloudinary";

export async function GET(req) {
  await connectDB();
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");

  const query = type ? { type, active: true } : { active: true };
  const categories = await Category.find(query)
    .select("name description image type salons active createdAt")
    .sort({ createdAt: -1 })
    .lean(); // Use lean() for better performance

  // Cache for 60 seconds (ISR)
  return NextResponse.json(categories, {
    headers: {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
    },
  });
}

export async function POST(req) {
  await connectDB();

  try {
    const formData = await req.formData();
    const file = formData.get("image");
    const name = formData.get("name");
    const description = formData.get("description");
    const type = formData.get("type");

    if (!name || !type) {
      return NextResponse.json(
        { message: "Name and type are required" },
        { status: 400 }
      );
    }

    let image = "";
    let public_id = "";

    if (file) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const upload = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          { folder: "categories" },
          (err, result) => {
            if (err) reject(err);
            resolve(result);
          }
        ).end(buffer);
      });
      image = upload.secure_url;
      public_id = upload.public_id;
    }

    const salonsRaw = formData.get("salons");
    let salons = [];
    if (salonsRaw !== null && salonsRaw !== undefined) {
      try {
        const parsed = typeof salonsRaw === "string" ? JSON.parse(salonsRaw || "[]") : salonsRaw;
        salons = Array.isArray(parsed) ? parsed.filter(Boolean) : [];
      } catch (e) {}
    }

    const category = await Category.create({
      name,
      description,
      type,
      salons,
      image,
      public_id,
    });

    return NextResponse.json(category);
  } catch (error) {
    return NextResponse.json(
      { message: error.message },
      { status: 500 }
    );
  }
}




