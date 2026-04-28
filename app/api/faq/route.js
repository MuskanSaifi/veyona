import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Faq from "@/models/Faq";

export async function GET(req) {
  await connectDB();
  const { searchParams } = new URL(req.url);
  const all = searchParams.get("all") === "true";

  const query = all ? {} : { active: true };
  const faqs = await Faq.find(query)
    .sort({ order: 1, createdAt: 1 })
    .lean();

  return NextResponse.json(faqs, {
    headers: {
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
    },
  });
}

export async function POST(req) {
  await connectDB();
  try {
    const body = await req.json();
    const { question, answer, order } = body;
    if (!question || !answer) {
      return NextResponse.json(
        { message: "Question and answer are required" },
        { status: 400 }
      );
    }
    const doc = await Faq.create({
      question: question.trim(),
      answer: answer.trim(),
      order: order ?? 0,
    });
    return NextResponse.json(doc);
  } catch (err) {
    return NextResponse.json(
      { message: err.message || "Failed to create FAQ" },
      { status: 500 }
    );
  }
}
