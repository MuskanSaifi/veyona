import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Footer from "@/models/Footer";
import cloudinary from "@/lib/cloudinary";

export async function GET() {
  await connectDB();
  const doc = await Footer.findOne().sort({ createdAt: -1 }).lean();
  return NextResponse.json(doc, {
    headers: {
      "Cache-Control": "public, s-maxage=120, stale-while-revalidate=300",
    },
  });
}

function trim(val) {
  return (val || "").toString().trim() || null;
}

export async function POST(req) {
  await connectDB();

  const formData = await req.formData();
  const file = formData.get("logo");

  let logoUrl = null;
  if (file && file.size > 0) {
    const buffer = Buffer.from(await file.arrayBuffer());
    const upload = await new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream({ folder: "footer" }, (err, result) => {
          if (err) reject(err);
          resolve(result);
        })
        .end(buffer);
    });
    logoUrl = upload.secure_url;
  }

  const doc = await Footer.create({
    logo: logoUrl,
    description: trim(formData.get("description")),
    phone: trim(formData.get("phone")),
    email: trim(formData.get("email")),
    address: trim(formData.get("address")),
    hours: trim(formData.get("hours")),
    copyright: trim(formData.get("copyright")),
    facebookUrl: trim(formData.get("facebookUrl")),
    instagramUrl: trim(formData.get("instagramUrl")),
    threadsUrl: trim(formData.get("threadsUrl")),
    linkedinUrl: trim(formData.get("linkedinUrl")),
  });

  return NextResponse.json(doc);
}

export async function PUT(req) {
  await connectDB();

  const contentType = req.headers.get("content-type") || "";
  const existing = await Footer.findOne().sort({ createdAt: -1 });

  if (!existing) {
    return NextResponse.json(
      { error: "No footer found. Create one first." },
      { status: 404 }
    );
  }

  let update = {};

  if (contentType.includes("multipart/form-data")) {
    const formData = await req.formData();
    const file = formData.get("logo");

    update.description = trim(formData.get("description"));
    update.phone = trim(formData.get("phone"));
    update.email = trim(formData.get("email"));
    update.address = trim(formData.get("address"));
    update.hours = trim(formData.get("hours"));
    update.copyright = trim(formData.get("copyright"));
    update.facebookUrl = trim(formData.get("facebookUrl"));
    update.instagramUrl = trim(formData.get("instagramUrl"));
    update.threadsUrl = trim(formData.get("threadsUrl"));
    update.linkedinUrl = trim(formData.get("linkedinUrl"));

    if (file && file.size > 0) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const upload = await new Promise((resolve, reject) => {
        cloudinary.uploader
          .upload_stream({ folder: "footer" }, (err, result) => {
            if (err) reject(err);
            resolve(result);
          })
          .end(buffer);
      });
      update.logo = upload.secure_url;
    }
  } else {
    const body = await req.json();
    if (body.description !== undefined) update.description = trim(body.description);
    if (body.phone !== undefined) update.phone = trim(body.phone);
    if (body.email !== undefined) update.email = trim(body.email);
    if (body.address !== undefined) update.address = trim(body.address);
    if (body.hours !== undefined) update.hours = trim(body.hours);
    if (body.copyright !== undefined) update.copyright = trim(body.copyright);
    if (body.facebookUrl !== undefined) update.facebookUrl = trim(body.facebookUrl);
    if (body.instagramUrl !== undefined) update.instagramUrl = trim(body.instagramUrl);
    if (body.threadsUrl !== undefined) update.threadsUrl = trim(body.threadsUrl);
    if (body.linkedinUrl !== undefined) update.linkedinUrl = trim(body.linkedinUrl);
  }

  const doc = await Footer.findByIdAndUpdate(existing._id, update, { new: true });

  return NextResponse.json(doc);
}
