import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import ContactEnquiry from "@/models/ContactEnquiry";

export async function PUT(req, { params }) {
  await connectDB();

  try {
    const { id } = await params;
    const body = await req.json();
    const { status } = body;

    if (!status) {
      return NextResponse.json(
        { message: "Status is required" },
        { status: 400 }
      );
    }

    const enquiry = await ContactEnquiry.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!enquiry) {
      return NextResponse.json(
        { message: "Contact enquiry not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(enquiry);
  } catch (error) {
    return NextResponse.json(
      { message: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(req, { params }) {
  await connectDB();

  try {
    const { id } = await params;
    const enquiry = await ContactEnquiry.findByIdAndDelete(id);

    if (!enquiry) {
      return NextResponse.json(
        { message: "Contact enquiry not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Contact enquiry deleted successfully" });
  } catch (error) {
    return NextResponse.json(
      { message: error.message },
      { status: 500 }
    );
  }
}
