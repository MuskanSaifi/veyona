import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Employee from "@/models/Employee";
import { requireAdmin } from "@/lib/serviceTrackingAuth";

/**
 * Admin-only employee list — includes loginPassword for admin reference.
 * Public booking should keep using GET /api/employee (secrets stripped).
 */
export async function GET(req) {
  const auth = requireAdmin(req);
  // Align with middleware: cookie present is enough for admin panel APIs
  const hasCookie = Boolean(req.cookies.get("adminToken")?.value);
  if (auth.response && !hasCookie) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  await connectDB();
  const employees = await Employee.find({})
    .select("-password")
    .populate("salon")
    .populate("categories")
    .populate("services")
    .sort({ createdAt: -1 })
    .lean();

  return NextResponse.json(
    (employees || []).map((e) => ({
      ...e,
      loginPassword: e.loginPassword || "",
      permissions: Array.isArray(e.permissions) ? e.permissions : [],
    }))
  );
}
