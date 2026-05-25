import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import ServiceVisit from "@/models/ServiceVisit";
import Customer from "@/models/Customer";
import { requireEmployee } from "@/lib/serviceTrackingAuth";
import { sendFeedbackRequestWhatsApp, buildFeedbackUrl } from "@/lib/serviceWhatsapp";

/**
 * POST /api/service-tracking/end-service
 *
 * Body: { serviceId }
 *
 * Marks an in-progress visit as completed, records the endTime + duration,
 * and triggers the WhatsApp feedback request to the customer.
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
  if (visit.status === "completed") {
    return NextResponse.json(
      { message: "Service has already been ended" },
      { status: 400 }
    );
  }
  if (visit.status !== "in_progress" || !visit.startTime) {
    return NextResponse.json(
      { message: "Service cannot end before it has been started" },
      { status: 400 }
    );
  }

  const now = new Date();
  const durationMs = now.getTime() - new Date(visit.startTime).getTime();
  const durationMinutes = Math.max(0, Math.round(durationMs / 60000));

  visit.endTime = now;
  visit.durationMinutes = durationMinutes;
  visit.status = "completed";
  await visit.save();

  // Send WhatsApp feedback request (best-effort; do not fail the request if WA fails)
  let whatsapp = { success: false, message: "Customer not found" };
  const customer = await Customer.findById(visit.customer);
  if (customer && customer.phone) {
    whatsapp = await sendFeedbackRequestWhatsApp(customer.phone, String(visit._id));
    if (whatsapp.success) {
      visit.feedbackSentAt = new Date();
      await visit.save();
    }
  }

  return NextResponse.json({
    success: true,
    serviceId: visit._id,
    status: visit.status,
    startTime: visit.startTime,
    endTime: visit.endTime,
    durationMinutes,
    feedbackUrl: buildFeedbackUrl(String(visit._id)),
    whatsapp,
  });
}
