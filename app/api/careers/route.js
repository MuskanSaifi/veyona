import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import CareerApplication from "@/models/CareerApplication";

// GET /api/careers - list all applications (used in admin dashboard)
export async function GET() {
  await connectDB();

  try {
    const applications = await CareerApplication.find({})
      .sort({ createdAt: -1 })
      .lean();
    return NextResponse.json(applications);
  } catch (error) {
    return NextResponse.json(
      { message: error.message || "Failed to fetch applications" },
      { status: 500 }
    );
  }
}

// POST /api/careers - public career application form
export async function POST(req) {
  await connectDB();

  try {
    const body = await req.json();
    const {
      fullName,
      email,
      phone,
      role,
      experience,
      preferredLocation,
      message,
      source,
    } = body;

    if (!fullName || !email || !role) {
      return NextResponse.json(
        { message: "Full name, email, and role are required." },
        { status: 400 }
      );
    }

    const application = await CareerApplication.create({
      fullName,
      email,
      phone: phone || "",
      role,
      experience: experience || "",
      preferredLocation: preferredLocation || "",
      message: message || "",
      source: source || "",
      status: "new",
    });

    return NextResponse.json(application, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: error.message || "Failed to submit application" },
      { status: 500 }
    );
  }
}

