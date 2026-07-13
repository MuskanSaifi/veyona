import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Employee from "@/models/Employee";
import cloudinary from "@/lib/cloudinary";
import bcrypt from "bcryptjs";
import { isAdminRequest } from "@/lib/serviceTrackingAuth";
import { sanitizePermissions } from "@/lib/panelMenu";

function stripSecrets(doc, { includeLoginPassword = false } = {}) {
  if (!doc) return doc;
  const obj = typeof doc.toObject === "function" ? doc.toObject() : { ...doc };
  delete obj.password;
  if (!includeLoginPassword) delete obj.loginPassword;
  return obj;
}

export async function GET(req, { params }) {
  await connectDB();
  const { id } = await params;
  const includeLoginPassword = isAdminRequest(req);
  const employee = await Employee.findById(id)
    .select(includeLoginPassword ? "-password" : "-password -loginPassword")
    .populate("salon")
    .populate("categories")
    .populate("services");
  if (!employee) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(stripSecrets(employee, { includeLoginPassword }));
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
    const permissionsRaw = formData.get("permissions");

    const employee = await Employee.findById(id);
    if (!employee) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (name) employee.name = name;
    if (email) employee.email = email;
    if (phone) employee.phone = phone;
    if (salon !== null && salon !== undefined) {
      const trimmed = String(salon).trim();
      employee.salon = trimmed ? trimmed : null;
    }
    if (experience) employee.experience = parseInt(experience);
    if (active !== null && active !== undefined) {
      employee.active = active === "true";
    }

    if (categories !== null && categories !== "null") {
      employee.categories = String(categories)
        .split(",")
        .filter((cid) => cid.trim());
    }

    if (services !== null && services !== "null") {
      employee.services = String(services)
        .split(",")
        .filter((sid) => sid.trim());
    }

    if (permissionsRaw !== null && permissionsRaw !== undefined) {
      employee.permissions = sanitizePermissions(permissionsRaw);
    }

    const plainPassword = password != null ? String(password).trim() : "";
    if (plainPassword.length >= 6) {
      employee.password = await bcrypt.hash(plainPassword, 10);
      employee.loginPassword = plainPassword;
      employee.markModified("loginPassword");
    }

    if (file && file !== "null" && typeof file.arrayBuffer === "function") {
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
      employee.image = upload.secure_url;
      employee.public_id = upload.public_id;
    }

    await employee.save();

    const updated = await Employee.findById(id)
      .select("-password")
      .populate("salon")
      .populate("categories")
      .populate("services");

    const includeLoginPassword = isAdminRequest(req);
    return NextResponse.json(
      stripSecrets(updated, { includeLoginPassword })
    );
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
