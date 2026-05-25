import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import ServiceVisit from "@/models/ServiceVisit";
import Otp from "@/models/Otp";
import Feedback from "@/models/Feedback";
import { requireEmployee } from "@/lib/serviceTrackingAuth";

/**
 * GET /api/service-tracking/visit/[id]
 *
 * Employee-only. Returns the full state of a single ServiceVisit
 * (customer info, status, timing, current OTP expiry, feedback if any).
 */
export async function GET(req, { params }) {
  await connectDB();

  const auth = requireEmployee(req);
  if (auth.response) return auth.response;
  const employeeId = auth.employeeId;

  const { id } = await params;

  const visit = await ServiceVisit.findById(id)
    .populate("customer", "name phone email address")
    .populate("employee", "name email phone");

  if (!visit) {
    return NextResponse.json({ message: "Service visit not found" }, { status: 404 });
  }
  if (String(visit.employee?._id) !== String(employeeId)) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const activeOtp =
    visit.status === "pending"
      ? await Otp.findOne({ serviceVisit: visit._id, consumed: false }).sort({
          createdAt: -1,
        })
      : null;

  const feedback =
    visit.status === "completed"
      ? await Feedback.findOne({ serviceVisit: visit._id })
      : null;

  return NextResponse.json({
    id: visit._id,
    status: visit.status,
    serviceLabel: visit.serviceLabel,
    customer: visit.customer,
    employee: visit.employee,
    startTime: visit.startTime,
    endTime: visit.endTime,
    durationMinutes: visit.durationMinutes,
    otpVerified: visit.otpVerified,
    otpExpiresAt: activeOtp ? activeOtp.expiresAt : null,
    feedbackSentAt: visit.feedbackSentAt,
    feedbackSubmittedAt: visit.feedbackSubmittedAt,
    feedback: feedback
      ? { rating: feedback.rating, comment: feedback.comment, createdAt: feedback.createdAt }
      : null,
    createdAt: visit.createdAt,
  });
}
