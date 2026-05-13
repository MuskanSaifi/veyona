import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Employee from "@/models/Employee";
import cloudinary from "@/lib/cloudinary";
import bcrypt from "bcryptjs";
import Service from "@/models/Service";

export async function GET(req) {
  await connectDB();
  const { searchParams } = new URL(req.url);
  const salonId = searchParams.get("salonId");
  const serviceId = searchParams.get("serviceId");
  const categoryId = searchParams.get("categoryId");

  // Base query (salon / active etc.)
  const baseQuery = {};
  if (salonId) baseQuery.salon = salonId;

  let employees;

  // When filtering directly by category, keep previous behaviour
  if (categoryId) {
    employees = await Employee.find({
      ...baseQuery,
      categories: categoryId,
    })
      .populate("salon")
      .populate("categories")
      .populate("services")
      .sort({ createdAt: -1 });
    return NextResponse.json(employees);
  }

  // When filtering by service, treat:
  // - employees with this service in their specialization OR
  // - employees with no specialization selected but who belong to the service's category
  if (serviceId) {
    let serviceCategoryId = null;
    try {
      const svc = await Service.findById(serviceId).select("category");
      serviceCategoryId = svc?.category?.toString() || null;
    } catch (e) {
      serviceCategoryId = null;
    }

    employees = await Employee.find(baseQuery)
      .populate("salon")
      .populate("categories")
      .populate("services")
      .sort({ createdAt: -1 });

    const matchesService = (emp) => {
      const hasExplicitService =
        Array.isArray(emp.services) &&
        emp.services.some((s) => s._id?.toString() === serviceId || s.toString() === serviceId);

      if (hasExplicitService) return true;

      if (!serviceCategoryId) return false;

      const hasCategory =
        Array.isArray(emp.categories) &&
        emp.categories.some(
          (c) => c._id?.toString() === serviceCategoryId || c.toString() === serviceCategoryId
        );

      const hasNoSpecializations = !emp.services || emp.services.length === 0;

      return hasCategory && hasNoSpecializations;
    };

    let filtered = employees.filter(matchesService);

    // Fallback: if strict specialization rules yield nobody, allow any active employee
    // in this service's category (common misconfiguration: category ok but wrong service IDs).
    if (filtered.length === 0 && serviceCategoryId) {
      filtered = employees.filter((emp) => {
        const hasCategory =
          Array.isArray(emp.categories) &&
          emp.categories.some(
            (c) => c._id?.toString() === serviceCategoryId || c.toString() === serviceCategoryId
          );
        return hasCategory;
      });
    }

    return NextResponse.json(filtered);
  }

  // No specific filters
  employees = await Employee.find(baseQuery)
    .populate("salon")
    .populate("categories")
    .populate("services")
    .sort({ createdAt: -1 });
  return NextResponse.json(employees);
}

export async function POST(req) {
  await connectDB();

  try {
    const formData = await req.formData();
    const file = formData.get("image");
    const name = formData.get("name");
    const email = formData.get("email");
    const password = formData.get("password");
    const phone = formData.get("phone");
    const salon = formData.get("salon");
    const categories = formData.get("categories"); // comma-separated IDs
    const services = formData.get("services"); // comma-separated IDs (specializations)
    const experience = formData.get("experience");

    if (!name || !email || !password || !phone) {
      return NextResponse.json(
        { message: "Name, email, password, and phone are required" },
        { status: 400 }
      );
    }

    let image = "";
    let public_id = "";

    if (file) {
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
      image = upload.secure_url;
      public_id = upload.public_id;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const salonId = (salon || "").toString().trim();

    const employeeData = {
      name,
      email,
      password: hashedPassword,
      phone,
      image,
      public_id,
    };

    if (salonId) {
      employeeData.salon = salonId;
    }

    if (experience) {
      employeeData.experience = parseInt(experience);
    }

    if (categories) {
      employeeData.categories = categories.split(",").filter((id) => id.trim());
    }

    if (services) {
      employeeData.services = services.split(",").filter((id) => id.trim());
    }

    const employee = await Employee.create(employeeData);

    const populated = await Employee.findById(employee._id)
      .populate("salon")
      .populate("categories")
      .populate("services");

    return NextResponse.json(populated);
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

