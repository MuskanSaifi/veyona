import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import CareerApplication from "@/models/CareerApplication";

// Update application status
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

    const updated = await CareerApplication.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json(
        { message: "Career application not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json(
      { message: error.message || "Failed to update application" },
      { status: 500 }
    );
  }
}

// Delete application
export async function DELETE(req, { params }) {
  await connectDB();

  try {
    const { id } = await params;
    const deleted = await CareerApplication.findByIdAndDelete(id);

    if (!deleted) {
      return NextResponse.json(
        { message: "Career application not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Career application deleted successfully",
    });
  } catch (error) {
    return NextResponse.json(
      { message: error.message || "Failed to delete application" },
      { status: 500 }
    );
  }
}

