import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import ChatbotSubmission from "@/models/ChatbotSubmission";

export async function POST(req) {
  await connectDB();

  try {
    const body = await req.json();
    const { name, email, phone, selectedQuestions, message } = body;

    if (!name || !email || !selectedQuestions || selectedQuestions.length === 0) {
      return NextResponse.json(
        { message: "Name, email, and at least one question are required" },
        { status: 400 }
      );
    }

    const submission = new ChatbotSubmission({
      name,
      email,
      phone: phone || "",
      selectedQuestions,
      message: message || "",
    });

    await submission.save();

    return NextResponse.json(
      { message: "Chatbot submission saved successfully", submission },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error saving chatbot submission:", error);
    return NextResponse.json(
      { message: "Error saving submission", error: error.message },
      { status: 500 }
    );
  }
}

export async function GET(req) {
  await connectDB();

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const query = {};
    if (status && status !== "all") {
      query.status = status;
    }

    const submissions = await ChatbotSubmission.find(query)
      .sort({ createdAt: -1 });

    return NextResponse.json(submissions);
  } catch (error) {
    console.error("Error fetching chatbot submissions:", error);
    return NextResponse.json(
      { message: "Error fetching submissions", error: error.message },
      { status: 500 }
    );
  }
}
