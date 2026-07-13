import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Feedback from "@/models/Feedback";
import { requireAdminOrPermittedEmployee } from "@/lib/serviceTrackingAuth";

/**
 * GET /api/admin/service-tracking/feedbacks
 *
 * Admin-only. Returns all submitted feedbacks (newest first) with the
 * linked service visit, customer, and employee info.
 */
export async function GET(req) {
  await connectDB();

  const auth = await requireAdminOrPermittedEmployee(req);
  if (auth.response) return auth.response;

  const feedbacks = await Feedback.find({})
    .populate({
      path: "serviceVisit",
      select: "employee customer startTime endTime durationMinutes status serviceLabel",
      populate: [
        { path: "employee", select: "name email phone" },
        { path: "customer", select: "name email phone" },
      ],
    })
    .sort({ createdAt: -1 })
    .limit(500);

  return NextResponse.json(feedbacks);
}
