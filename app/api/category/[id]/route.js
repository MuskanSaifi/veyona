import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Category from "@/models/Category";
import cloudinary from "@/lib/cloudinary";

export async function GET(req, { params }) {
  await connectDB();
  const { id } = await params;
  const category = await Category.findById(id);
  if (!category) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(category);
}

export async function PUT(req, { params }) {
  await connectDB();
  const { id } = await params;

  try {
    const formData = await req.formData();
    const file = formData.get("image");
    const name = formData.get("name");
    const description = formData.get("description");
    const type = formData.get("type");
    const active = formData.get("active");

    const category = await Category.findById(id);
    if (!category) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const salonsRaw = formData.get("salons");
    let salons = [];
    if (salonsRaw !== null && salonsRaw !== undefined) {
      try {
        const parsed = typeof salonsRaw === "string" ? JSON.parse(salonsRaw || "[]") : salonsRaw;
        salons = Array.isArray(parsed) ? parsed.filter(Boolean) : [];
      } catch (e) {
        salons = [];
      }
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (description !== null) updateData.description = description;
    if (type) updateData.type = type;
    if (active !== null) updateData.active = active === "true";
    if (salonsRaw !== null && salonsRaw !== undefined) updateData.salons = salons;

    if (file && file !== "null") {
      // Delete old image
      if (category.public_id) {
        await cloudinary.uploader.destroy(category.public_id);
      }

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
      updateData.image = upload.secure_url;
      updateData.public_id = upload.public_id;
    }

    const updated = await Category.findByIdAndUpdate(id, updateData, {
      new: true,
    });

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

  const category = await Category.findById(id);
  if (!category) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (category.public_id) {
    await cloudinary.uploader.destroy(category.public_id);
  }

  await Category.findByIdAndDelete(id);
  return NextResponse.json({ success: true });
}




