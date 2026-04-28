import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Testimonial from "@/models/Testimonial";
import cloudinary from "@/lib/cloudinary";
import Employee from "@/models/Employee"; // ✅ THIS LINE FIXES EVERYTHING
import Salon from "@/models/Salon";       // 👈 OPTIONAL (safe)
import Service from "@/models/Service";   // 👈 OPTIONAL (safe)

export async function GET(req) {
  await connectDB();
  const { searchParams } = new URL(req.url);
  const all = searchParams.get("all"); // For dashboard, get all testimonials

  const query = all === "true" ? {} : { active: true };
  const testimonials = await Testimonial.find(query)
    .populate("employee", "name image")
    .sort({ createdAt: -1 })
    .lean();
  return NextResponse.json(testimonials, {
    headers: {
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
    },
  });
}

export async function POST(req) {
  await connectDB();

  try {
    const formData = await req.formData();
    const file = formData.get("customerImage");
    const customerName = formData.get("customerName");
    const rating = formData.get("rating");
    const review = formData.get("review");
    const service = formData.get("service");
    const employee = formData.get("employee");

    if (!customerName || !rating || !review) {
      return NextResponse.json(
        { message: "Customer name, rating, and review are required" },
        { status: 400 }
      );
    }

    let customerImage = "";
    let public_id = "";

    if (file) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const upload = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          { folder: "testimonials" },
          (err, result) => {
            if (err) reject(err);
            resolve(result);
          }
        ).end(buffer);
      });
      customerImage = upload.secure_url;
      public_id = upload.public_id;
    }

    const testimonial = await Testimonial.create({
      customerName,
      customerImage,
      public_id,
      rating: parseInt(rating),
      review,
      service: service || "",
      employee: employee || null,
    });

    const populated = await Testimonial.findById(testimonial._id).populate("employee");
    return NextResponse.json(populated);
  } catch (error) {
    return NextResponse.json(
      { message: error.message },
      { status: 500 }
    );
  }
}




