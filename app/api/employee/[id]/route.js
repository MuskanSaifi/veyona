import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Employee from "@/models/Employee";
import cloudinary from "@/lib/cloudinary";
import bcrypt from "bcryptjs";

export async function GET(req, { params }) {
  await connectDB();
  const { id } = await params;
  const employee = await Employee.findById(id)
    .populate("salon")
    .populate("categories")
    .populate("services");
  if (!employee) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(employee);
}

export async function PUT(req, { params }) {
  await connectDB();
  const { id } = await params;

  try {
    const formData = await req.formData();
    const file = formData.get("image");
    const name = formData.get("name");
    const email = formData.get("email");
    const password = formData.get("password");
    const phone = formData.get("phone");
    const salon = formData.get("salon");
    const categories = formData.get("categories");
    const services = formData.get("services");
    const experience = formData.get("experience");
    const active = formData.get("active");

    const employee = await Employee.findById(id);
    if (!employee) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (phone) updateData.phone = phone;
    if (salon !== null && salon !== undefined) {
      const trimmed = String(salon).trim();
      updateData.salon = trimmed ? trimmed : null;
    }
    if (experience) updateData.experience = parseInt(experience);
    if (active !== null) updateData.active = active === "true";

    if (categories !== null && categories !== "null") {
      updateData.categories = categories.split(",").filter((id) => id.trim());
    }

    if (services !== null && services !== "null") {
      updateData.services = services.split(",").filter((id) => id.trim());
    }

    if (password && String(password).trim().length >= 6) {
      updateData.password = await bcrypt.hash(String(password).trim(), 10);
    }

    if (file && file !== "null") {
      if (employee.public_id) {
        await cloudinary.uploader.destroy(employee.public_id);
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const upload = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          { folder: "employees" },
          (err, result) => {
            if (err) reject(err);
            resolve(result);
          }
        ).end(buffer);
      });
      updateData.image = upload.secure_url;
      updateData.public_id = upload.public_id;
    }

    const updated = await Employee.findByIdAndUpdate(id, updateData, {
      new: true,
    })
      .populate("salon")
      .populate("categories")
      .populate("services");

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

  const employee = await Employee.findById(id);
  if (!employee) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (employee.public_id) {
    await cloudinary.uploader.destroy(employee.public_id);
  }

  await Employee.findByIdAndDelete(id);
  return NextResponse.json({ success: true });
}




