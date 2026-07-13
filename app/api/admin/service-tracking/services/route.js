import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import ServiceVisit from "@/models/ServiceVisit";
import { requireAdminOrPermittedEmployee } from "@/lib/serviceTrackingAuth";

/**
 * GET /api/admin/service-tracking/services
 *
 * Admin-only. Lists all service visits (newest first) with the joined
 * employee + customer info that the admin dashboard needs.
 *
 * Supported query params:
 *   ?status=pending|in_progress|completed|cancelled
 *   ?employee=<employeeId>
 *   ?from=<ISO date>  ?to=<ISO date>
 */
export async function GET(req) {
  await connectDB();

  const auth = await requireAdminOrPermittedEmployee(req);
  if (auth.response) return auth.response;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const employee = searchParams.get("employee");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const query = {};
  if (status && status !== "all") query.status = status;
  if (employee) query.employee = employee;
  if (from || to) {
    query.createdAt = {};
    if (from) query.createdAt.$gte = new Date(from);
    if (to) query.createdAt.$lte = new Date(to);
  }

  const visits = await ServiceVisit.find(query)
    .populate("employee", "name email phone")
    .populate("customer", "name email phone")
    .sort({ createdAt: -1 })
    .limit(500);

  return NextResponse.json(visits);
}
