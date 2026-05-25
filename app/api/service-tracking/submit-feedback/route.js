import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import ServiceVisit from "@/models/ServiceVisit";
import Feedback from "@/models/Feedback";

/**
 * POST /api/service-tracking/submit-feedback
 *
 * PUBLIC endpoint — no auth.
 *
 * Body: { serviceId, rating (1-5), comment? }
 */
export async function POST(req) {
  await connectDB();

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON body" }, { status: 400 });
  }

  const { serviceId, rating, comment } = body || {};

  if (!serviceId) {
    return NextResponse.json({ message: "serviceId is required" }, { status: 400 });
  }
  const numericRating = Number(rating);
  if (!Number.isFinite(numericRating) || numericRating < 1 || numericRating > 5) {
    return NextResponse.json(
      { message: "Rating must be a number between 1 and 5" },
      { status: 400 }
    );
  }

  const visit = await ServiceVisit.findById(serviceId);
  if (!visit) {
    return NextResponse.json({ message: "Service visit not found" }, { status: 404 });
  }
  if (visit.status !== "completed") {
    return NextResponse.json(
      { message: "Feedback can only be submitted after the service is completed" },
      { status: 400 }
    );
  }

  const existing = await Feedback.findOne({ serviceVisit: visit._id });
  if (existing) {
    return NextResponse.json(
      { message: "Feedback already submitted for this service" },
      { status: 409 }
    );
  }

  const feedback = await Feedback.create({
    serviceVisit: visit._id,
    rating: numericRating,
    comment: (comment || "").trim(),
  });

  visit.feedbackSubmittedAt = new Date();
  await visit.save();

  return NextResponse.json({
    success: true,
    feedback: {
      id: feedback._id,
      rating: feedback.rating,
      comment: feedback.comment,
    },
  });
}
