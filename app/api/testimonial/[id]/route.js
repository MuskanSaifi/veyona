import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Testimonial from "@/models/Testimonial";
import cloudinary from "@/lib/cloudinary";

export async function GET(req, { params }) {
  await connectDB();
  const { id } = await params;
  const testimonial = await Testimonial.findById(id).populate("employee");
  if (!testimonial) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(testimonial);
}

export async function PUT(req, { params }) {
  await connectDB();
  const { id } = await params;

  try {
    const formData = await req.formData();
    const testimonial = await Testimonial.findById(id);
    
    if (!testimonial) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const updateData = {};

    // Handle text fields
    const customerName = formData.get("customerName");
    const rating = formData.get("rating");
    const review = formData.get("review");
    const service = formData.get("service");
    const employee = formData.get("employee");
    const active = formData.get("active");

    if (customerName !== null) updateData.customerName = customerName;
    if (rating !== null) updateData.rating = parseInt(rating);
    if (review !== null) updateData.review = review;
    if (service !== null) updateData.service = service || "";
    if (employee !== null) updateData.employee = employee || null;
    if (active !== null) updateData.active = active === "true";

    // Handle image update
    const file = formData.get("customerImage");
    if (file && file.size > 0) {
      // Delete old image if exists
      if (testimonial.public_id) {
        try {
          await cloudinary.uploader.destroy(testimonial.public_id);
        } catch (err) {
          console.error("Error deleting old image:", err);
        }
      }

      // Upload new image
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

      updateData.customerImage = upload.secure_url;
      updateData.public_id = upload.public_id;
    }

    const updated = await Testimonial.findByIdAndUpdate(id, updateData, {
      new: true,
    }).populate("employee");

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Testimonial update error:", error);
    return NextResponse.json(
      { message: error.message || "Failed to update testimonial" },
      { status: 500 }
    );
  }
}

export async function DELETE(req, { params }) {
  await connectDB();
  const { id } = await params;

  const testimonial = await Testimonial.findById(id);
  if (!testimonial) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (testimonial.public_id) {
    await cloudinary.uploader.destroy(testimonial.public_id);
  }

  await Testimonial.findByIdAndDelete(id);
  return NextResponse.json({ success: true });
}




