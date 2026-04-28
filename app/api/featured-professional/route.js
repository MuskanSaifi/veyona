import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import FeaturedProfessional from "@/models/FeaturedProfessional";
import cloudinary from "@/lib/cloudinary";

export async function GET(req) {
  await connectDB();
  const professionals = await FeaturedProfessional.find({ active: true })
    .populate("employee", "name image")
    .sort({ order: 1, createdAt: -1 })
    .lean();
  return NextResponse.json(professionals, {
    headers: {
      "Cache-Control": "public, s-maxage=120, stale-while-revalidate=300",
    },
  });
}

export async function POST(req) {
  await connectDB();

  try {
    const formData = await req.formData();
    const file = formData.get("image");
    const name = formData.get("name");
    const title = formData.get("title");
    const description = formData.get("description");
    const employee = formData.get("employee");
    const order = formData.get("order");

    if (!name || !title || !description) {
      return NextResponse.json(
        { message: "Name, title, and description are required" },
        { status: 400 }
      );
    }

    let image = "";
    let public_id = "";

    if (file) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const upload = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          { folder: "featured-professionals" },
          (err, result) => {
            if (err) reject(err);
            resolve(result);
          }
        ).end(buffer);
      });
      image = upload.secure_url;
      public_id = upload.public_id;
    }

    const professional = await FeaturedProfessional.create({
      name,
      image,
      public_id,
      title,
      description,
      employee: employee || null,
      order: order ? parseInt(order) : 0,
    });

    const populated = await FeaturedProfessional.findById(professional._id).populate("employee");
    return NextResponse.json(populated);
  } catch (error) {
    return NextResponse.json(
      { message: error.message },
      { status: 500 }
    );
  }
}




