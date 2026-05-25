import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import ServiceVisit from "@/models/ServiceVisit";
import { requireEmployee } from "@/lib/serviceTrackingAuth";

/**
 * GET /api/service-tracking/list
 *
 * Employee-only. Returns the logged-in employee's own service visits,
 * newest first. Optional query: ?status=pending|in_progress|completed|cancelled
 */
export async function GET(req) {
  await connectDB();

  const auth = requireEmployee(req);
  if (auth.response) return auth.response;
  const employeeId = auth.employeeId;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  const query = { employee: employeeId };
  if (status && status !== "all") query.status = status;

  const visits = await ServiceVisit.find(query)
    .populate("customer", "name phone")
    .sort({ createdAt: -1 })
    .limit(200);

  return NextResponse.json(visits);
}
