import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import ServiceVisit from "@/models/ServiceVisit";
import Otp from "@/models/Otp";
import { requireEmployee } from "@/lib/serviceTrackingAuth";

const MAX_ATTEMPTS = 5;

/**
 * POST /api/service-tracking/verify-otp
 *
 * Body: { serviceId, code }
 *
 * Validates the OTP. On success the ServiceVisit transitions from
 * `pending` -> `in_progress`, `startTime` is set, and the OTP is consumed.
 */
export async function POST(req) {
  await connectDB();

  const auth = requireEmployee(req);
  if (auth.response) return auth.response;
  const employeeId = auth.employeeId;

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON body" }, { status: 400 });
  }

  const { serviceId, code } = body || {};
  if (!serviceId || !code) {
    return NextResponse.json(
      { message: "serviceId and code are required" },
      { status: 400 }
    );
  }

  const visit = await ServiceVisit.findById(serviceId);
  if (!visit) {
    return NextResponse.json({ message: "Service visit not found" }, { status: 404 });
  }
  if (String(visit.employee) !== String(employeeId)) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }
  if (visit.status !== "pending") {
    return NextResponse.json(
      { message: `Service visit is already ${visit.status}` },
      { status: 400 }
    );
  }

  // Most recent un-consumed OTP for this visit
  const otp = await Otp.findOne({
    serviceVisit: visit._id,
    consumed: false,
  }).sort({ createdAt: -1 });

  if (!otp) {
    return NextResponse.json(
      { message: "No active OTP. Please request a new one." },
      { status: 400 }
    );
  }

  if (otp.expiresAt.getTime() < Date.now()) {
    otp.consumed = true;
    await otp.save();
    return NextResponse.json(
      { message: "OTP expired. Please request a new one." },
      { status: 400 }
    );
  }

  if (otp.attempts >= MAX_ATTEMPTS) {
    otp.consumed = true;
    await otp.save();
    return NextResponse.json(
      { message: "Too many wrong attempts. Please request a new OTP." },
      { status: 429 }
    );
  }

  if (String(code).trim() !== String(otp.code)) {
    otp.attempts += 1;
    await otp.save();
    return NextResponse.json(
      {
        message: "Invalid OTP",
        attemptsLeft: Math.max(0, MAX_ATTEMPTS - otp.attempts),
      },
      { status: 400 }
    );
  }

  // OTP matches — start the service
  otp.consumed = true;
  await otp.save();

  const now = new Date();
  visit.status = "in_progress";
  visit.otpVerified = true;
  visit.otpVerifiedAt = now;
  visit.startTime = now;
  await visit.save();

  return NextResponse.json({
    success: true,
    serviceId: visit._id,
    status: visit.status,
    startTime: visit.startTime,
  });
}
