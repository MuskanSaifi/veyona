import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Salon from "@/models/Salon";
import cloudinary from "@/lib/cloudinary";

export async function GET(req) {
  await connectDB();
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const categoryId = searchParams.get("categoryId");

  // If categoryId provided: use category's assigned salons first, else fallback to type
  if (categoryId) {
    const Category = (await import("@/models/Category")).default;
    const category = await Category.findById(categoryId).select("salons type").lean();
    if (category?.salons?.length > 0) {
      const salons = await Salon.find({ _id: { $in: category.salons }, active: { $ne: false } })
        .sort({ name: 1 })
        .lean();
      return NextResponse.json(salons);
    }
    // Fallback: use category type
    if (category?.type) {
      const salons = await Salon.find({ type: category.type, active: { $ne: false } })
        .sort({ createdAt: -1 })
        .lean();
      return NextResponse.json(salons);
    }
  }

  const query = type ? { type, active: { $ne: false } } : { active: { $ne: false } };
  const salons = await Salon.find(query).sort({ createdAt: -1 }).lean();
  return NextResponse.json(salons);
}

export async function POST(req) {
  await connectDB();

  try {
    const formData = await req.formData();
    const file = formData.get("image");
    const name = formData.get("name");
    const email = formData.get("email");
    const phone = formData.get("phone");
    const address = formData.get("address");
    const city = formData.get("city");
    const state = formData.get("state");
    const pincode = formData.get("pincode");
    const type = formData.get("type");
    const openingTime = formData.get("openingTime");
    const closingTime = formData.get("closingTime");

    if (
      !name ||
      !email ||
      !phone ||
      !address ||
      !city ||
      !state ||
      !pincode ||
      !type ||
      !openingTime ||
      !closingTime
    ) {
      return NextResponse.json(
        { message: "All fields are required" },
        { status: 400 }
      );
    }

    let image = "";
    let public_id = "";

    if (file) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const upload = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          { folder: "salons" },
          (err, result) => {
            if (err) reject(err);
            resolve(result);
          }
        ).end(buffer);
      });
      image = upload.secure_url;
      public_id = upload.public_id;
    }

    const salon = await Salon.create({
      name,
      email,
      phone,
      address,
      city,
      state,
      pincode,
      type,
      openingTime,
      closingTime,
      image,
      public_id,
    });

    return NextResponse.json(salon);
  } catch (error) {
    if (error.code === 11000) {
      return NextResponse.json(
        { message: "Email already exists" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { message: error.message },
      { status: 500 }
    );
  }
}




