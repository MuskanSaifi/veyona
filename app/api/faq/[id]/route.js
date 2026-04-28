import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Faq from "@/models/Faq";

export async function PUT(req, { params }) {
  await connectDB();
  try {
    const { id } = await params;
    const body = await req.json();
    const update = {};
    if (body.question !== undefined) update.question = body.question?.trim() || "";
    if (body.answer !== undefined) update.answer = body.answer?.trim() || "";
    if (body.order !== undefined) update.order = body.order;
    if (body.active !== undefined) update.active = body.active;

    const doc = await Faq.findByIdAndUpdate(id, update, { new: true });
    if (!doc) {
      return NextResponse.json({ error: "FAQ not found" }, { status: 404 });
    }
    return NextResponse.json(doc);
  } catch (err) {
    return NextResponse.json(
      { message: err.message || "Failed to update FAQ" },
      { status: 500 }
    );
  }
}

export async function DELETE(req, { params }) {
  await connectDB();
  try {
    const { id } = await params;
    const doc = await Faq.findByIdAndDelete(id);
    if (!doc) {
      return NextResponse.json({ error: "FAQ not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { message: err.message || "Failed to delete FAQ" },
      { status: 500 }
    );
  }
}
