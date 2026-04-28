import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import ContactEnquiry from "@/models/ContactEnquiry";

export async function GET(req) {
  await connectDB();

  try {
    const enquiries = await ContactEnquiry.find({})
      .sort({ createdAt: -1 });
    return NextResponse.json(enquiries);
  } catch (error) {
    return NextResponse.json(
      { message: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  await connectDB();

  try {
    const body = await req.json();
    const { name, email, phone, subject, message } = body;

    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { message: "Name, email, subject, and message are required" },
        { status: 400 }
      );
    }

    const enquiry = await ContactEnquiry.create({
      name,
      email,
      phone: phone || "",
      subject,
      message,
      status: "new",
    });

    return NextResponse.json(enquiry, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: error.message },
      { status: 500 }
    );
  }
}
