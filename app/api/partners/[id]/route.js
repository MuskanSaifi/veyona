import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import PartnerRequest from "@/models/PartnerRequest";

// Update partner request status
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

    const updated = await PartnerRequest.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json(
        { message: "Partner request not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json(
      { message: error.message || "Failed to update request" },
      { status: 500 }
    );
  }
}

// Delete partner request
export async function DELETE(req, { params }) {
  await connectDB();

  try {
    const { id } = await params;
    const deleted = await PartnerRequest.findByIdAndDelete(id);

    if (!deleted) {
      return NextResponse.json(
        { message: "Partner request not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Partner request deleted successfully",
    });
  } catch (error) {
    return NextResponse.json(
      { message: error.message || "Failed to delete request" },
      { status: 500 }
    );
  }
}

