import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Service from "@/models/Service";
import { requireAdminOrPermittedEmployee } from "@/lib/serviceTrackingAuth";

/**
 * GET /api/admin/services — admin-only service list (all statuses, no CDN cache).
 */
export async function GET(req) {
  await connectDB();

  const auth = await requireAdminOrPermittedEmployee(req);
  if (auth.response) return auth.response;

  const services = await Service.find({})
    .populate("category", "name type")
    .populate("parentService", "name")
    .populate("clinic", "name address city state pincode")
    .sort({ order: 1, createdAt: -1 })
    .lean();

  return NextResponse.json(services, {
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
}
