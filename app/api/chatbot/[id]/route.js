import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import ChatbotSubmission from "@/models/ChatbotSubmission";

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

    const submission = await ChatbotSubmission.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!submission) {
      return NextResponse.json(
        { message: "Submission not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Submission updated successfully",
      submission,
    });
  } catch (error) {
    console.error("Error updating chatbot submission:", error);
    return NextResponse.json(
      { message: "Error updating submission", error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(req, { params }) {
  await connectDB();

  try {
    const { id } = await params;

    const submission = await ChatbotSubmission.findByIdAndDelete(id);

    if (!submission) {
      return NextResponse.json(
        { message: "Submission not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Submission deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting chatbot submission:", error);
    return NextResponse.json(
      { message: "Error deleting submission", error: error.message },
      { status: 500 }
    );
  }
}
