import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import ServiceVisit from "@/models/ServiceVisit";
import Customer from "@/models/Customer";
import Otp from "@/models/Otp";
import { requireEmployee } from "@/lib/serviceTrackingAuth";
import { sendServiceOtpWhatsApp } from "@/lib/serviceWhatsapp";

const OTP_TTL_MINUTES = 5;

function generateOtpCode() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

/**
 * POST /api/service-tracking/generate-otp
 *
 * Body: { serviceId }
 *
 * Re-generates a 4-digit OTP for a `pending` service visit and re-sends it
 * via WhatsApp. Prior un-consumed OTPs for the visit are invalidated.
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

  const { serviceId } = body || {};
  if (!serviceId) {
    return NextResponse.json({ message: "serviceId is required" }, { status: 400 });
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
      { message: `OTP cannot be generated for a ${visit.status} visit` },
      { status: 400 }
    );
  }

  const customer = await Customer.findById(visit.customer);
  if (!customer) {
    return NextResponse.json({ message: "Customer not found" }, { status: 404 });
  }

  // Invalidate any prior unused OTPs
  await Otp.updateMany(
    { serviceVisit: visit._id, consumed: false },
    { $set: { consumed: true } }
  );

  const code = generateOtpCode();
  const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);
  await Otp.create({ serviceVisit: visit._id, code, expiresAt });

  const wa = await sendServiceOtpWhatsApp(customer.phone, code);

  return NextResponse.json({
    success: true,
    serviceId: visit._id,
    otpExpiresAt: expiresAt,
    whatsapp: wa,
  });
}
