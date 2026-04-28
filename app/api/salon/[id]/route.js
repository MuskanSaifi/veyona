import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Salon from "@/models/Salon";
import cloudinary from "@/lib/cloudinary";

export async function GET(req, { params }) {
  await connectDB();
  const { id } = await params;
  const salon = await Salon.findById(id);
  if (!salon) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(salon);
}

export async function PUT(req, { params }) {
  await connectDB();
  const { id } = await params;

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
    const active = formData.get("active");

    const salon = await Salon.findById(id);
    if (!salon) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (phone) updateData.phone = phone;
    if (address) updateData.address = address;
    if (city) updateData.city = city;
    if (state) updateData.state = state;
    if (pincode) updateData.pincode = pincode;
    if (type) updateData.type = type;
    if (openingTime) updateData.openingTime = openingTime;
    if (closingTime) updateData.closingTime = closingTime;
    if (active !== null) updateData.active = active === "true";

    if (file && file !== "null") {
      if (salon.public_id) {
        await cloudinary.uploader.destroy(salon.public_id);
      }

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
      updateData.image = upload.secure_url;
      updateData.public_id = upload.public_id;
    }

    const updated = await Salon.findByIdAndUpdate(id, updateData, {
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

  const salon = await Salon.findById(id);
  if (!salon) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (salon.public_id) {
    await cloudinary.uploader.destroy(salon.public_id);
  }

  await Salon.findByIdAndDelete(id);
  return NextResponse.json({ success: true });
}




