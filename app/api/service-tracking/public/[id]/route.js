import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import ServiceVisit from "@/models/ServiceVisit";
import Feedback from "@/models/Feedback";

/**
 * GET /api/service-tracking/public/[id]
 *
 * PUBLIC endpoint used by the feedback page to show basic context about the
 * visit (employee + service label) without exposing internal IDs/phones.
 * Returns 404 if the visit isn't completed (so feedback links can't be
 * guessed for pending visits).
 */
export async function GET(_req, { params }) {
  await connectDB();
  const { id } = await params;

  const visit = await ServiceVisit.findById(id)
    .populate("employee", "name")
    .populate("customer", "name");

  if (!visit || visit.status !== "completed") {
    return NextResponse.json(
      { message: "Service visit not found or not yet completed" },
      { status: 404 }
    );
  }

  const existing = await Feedback.findOne({ serviceVisit: visit._id });

  return NextResponse.json({
    id: visit._id,
    serviceLabel: visit.serviceLabel,
    employeeName: visit.employee?.name || "",
    customerName: visit.customer?.name || "",
    durationMinutes: visit.durationMinutes,
    completedAt: visit.endTime,
    feedbackSubmitted: !!existing,
  });
}
