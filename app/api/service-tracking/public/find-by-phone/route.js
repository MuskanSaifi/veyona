import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import ServiceVisit from "@/models/ServiceVisit";
import Customer from "@/models/Customer";
import Feedback from "@/models/Feedback";

/**
 * POST /api/service-tracking/public/find-by-phone
 *
 * PUBLIC endpoint used by the feedback landing page (/feedback) to identify
 * the customer's completed service visit when the WhatsApp template uses a
 * STATIC button URL (no per-visit data is sent in the message).
 *
 * Body: { phone: "9876543210" }
 *
 * Returns:
 *   - { match: "single", visit: { id, ...context } }  when one pending-feedback visit
 *   - { match: "multiple", visits: [...] }            when many pending-feedback visits
 *   - { match: "none" }                               when no completed visit found
 *   - { match: "all_done" }                           when only already-rated visits exist
 *
 * Lookback is limited to the last 60 days to avoid leaking unrelated old visits.
 */
const LOOKBACK_DAYS = 60;

function normalizePhone(raw) {
  const digits = String(raw || "").replace(/\D/g, "");
  // Accept formats: 10 digits, or 12 digits starting with 91 (India)
  if (digits.length === 10) return digits;
  if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) return digits.slice(1);
  return null;
}

export async function POST(req) {
  await connectDB();

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON body" }, { status: 400 });
  }

  const phone = normalizePhone(body?.phone);
  if (!phone) {
    return NextResponse.json(
      { message: "Please enter a valid 10-digit mobile number" },
      { status: 400 }
    );
  }

  // Find customers with this phone (could be more than one row historically).
  const customers = await Customer.find({
    phone: { $regex: new RegExp(`${phone}$`) },
  }).select("_id name phone");

  if (!customers.length) {
    return NextResponse.json({ match: "none" });
  }
  const customerIds = customers.map((c) => c._id);

  const since = new Date(Date.now() - LOOKBACK_DAYS * 24 * 60 * 60 * 1000);

  const completedVisits = await ServiceVisit.find({
    customer: { $in: customerIds },
    status: "completed",
    endTime: { $gte: since },
  })
    .sort({ endTime: -1 })
    .limit(10)
    .populate("employee", "name")
    .populate("customer", "name");

  if (!completedVisits.length) {
    return NextResponse.json({ match: "none" });
  }

  const visitIds = completedVisits.map((v) => v._id);
  const existingFeedbacks = await Feedback.find({
    serviceVisit: { $in: visitIds },
  }).select("serviceVisit");
  const ratedSet = new Set(existingFeedbacks.map((f) => String(f.serviceVisit)));

  const pending = completedVisits.filter((v) => !ratedSet.has(String(v._id)));

  if (!pending.length) {
    return NextResponse.json({ match: "all_done" });
  }

  const toDto = (v) => ({
    id: String(v._id),
    serviceLabel: v.serviceLabel || "",
    employeeName: v.employee?.name || "",
    customerName: v.customer?.name || "",
    durationMinutes: v.durationMinutes || 0,
    completedAt: v.endTime,
  });

  if (pending.length === 1) {
    return NextResponse.json({ match: "single", visit: toDto(pending[0]) });
  }

  return NextResponse.json({
    match: "multiple",
    visits: pending.map(toDto),
  });
}
