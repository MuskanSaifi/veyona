import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import FeaturedProfessional from "@/models/FeaturedProfessional";
import cloudinary from "@/lib/cloudinary";

export async function GET(req, { params }) {
  await connectDB();
  const { id } = await params;
  const professional = await FeaturedProfessional.findById(id).populate("employee");
  if (!professional) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(professional);
}

export async function PUT(req, { params }) {
  await connectDB();
  const { id } = await params;

  try {
    const formData = await req.formData();
    const file = formData.get("image");
    const name = formData.get("name");
    const title = formData.get("title");
    const description = formData.get("description");
    const employee = formData.get("employee");
    const order = formData.get("order");
    const active = formData.get("active");

    const professional = await FeaturedProfessional.findById(id);
    if (!professional) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (title) updateData.title = title;
    if (description) updateData.description = description;
    if (employee !== null) updateData.employee = employee || null;
    if (order) updateData.order = parseInt(order);
    if (active !== null) updateData.active = active === "true";

    if (file && file !== "null") {
      if (professional.public_id) {
        await cloudinary.uploader.destroy(professional.public_id);
      }

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
      updateData.image = upload.secure_url;
      updateData.public_id = upload.public_id;
    }

    const updated = await FeaturedProfessional.findByIdAndUpdate(id, updateData, {
      new: true,
    }).populate("employee");

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json(
      { message: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(req, { params }) {
  await connectDB();
  const { id } = await params;

  const professional = await FeaturedProfessional.findById(id);
  if (!professional) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (professional.public_id) {
    await cloudinary.uploader.destroy(professional.public_id);
  }

  await FeaturedProfessional.findByIdAndDelete(id);
  return NextResponse.json({ success: true });
}




