import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import PartnerRequest from "@/models/PartnerRequest";

// GET /api/partners - list all partner requests (admin)
export async function GET() {
  await connectDB();

  try {
    const requests = await PartnerRequest.find({}).sort({ createdAt: -1 }).lean();
    return NextResponse.json(requests);
  } catch (error) {
    return NextResponse.json(
      { message: error.message || "Failed to fetch partner requests" },
      { status: 500 }
    );
  }
}

// POST /api/partners - public partner-with-us form
export async function POST(req) {
  await connectDB();

  try {
    const body = await req.json();
    const {
      businessName,
      contactName,
      email,
      phone,
      businessType,
      location,
      message,
      source,
    } = body;

    if (!businessName || !contactName || !email || !message) {
      return NextResponse.json(
        { message: "Business name, contact name, email and message are required." },
        { status: 400 }
      );
    }

    const request = await PartnerRequest.create({
      businessName,
      contactName,
      email,
      phone: phone || "",
      businessType: businessType || "",
      location: location || "",
      message,
      source: source || "",
      status: "new",
    });

    return NextResponse.json(request, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: error.message || "Failed to submit request" },
      { status: 500 }
    );
  }
}

