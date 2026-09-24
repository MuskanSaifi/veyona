import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Blacklist from "@/models/Blacklist";
import Employee from "@/models/Employee";
import { requireAdminOrPermittedEmployee } from "@/lib/serviceTrackingAuth";

/**
 * PATCH /api/admin/blacklist/[id] — soft unblacklist (active: false)
 * DELETE — same as PATCH
 */
async function unblacklist(req, { params }) {
  await connectDB();

  const auth = await requireAdminOrPermittedEmployee(req, "blacklist");
  if (auth.response) return auth.response;

  const { id } = await params;
  const entry = await Blacklist.findById(id);
  if (!entry) {
    return NextResponse.json({ message: "Blacklist entry not found" }, { status: 404 });
  }

  if (!entry.active) {
    return NextResponse.json({ message: "Already inactive", item: entry });
  }

  if (auth.role === "employee") {
    if (entry.type !== "customer") {
      return NextResponse.json(
        { message: "Employees can only unblacklist customers" },
        { status: 403 }
      );
    }
    if (String(entry.createdById) !== String(auth.employeeId)) {
      return NextResponse.json(
        { message: "You can only unblacklist customers you blacklisted" },
        { status: 403 }
      );
    }
  }

  entry.active = false;
  await entry.save();

  if (entry.type === "employee" && entry.employeeRef) {
    await Employee.findByIdAndUpdate(entry.employeeRef, { active: true });
  }

  return NextResponse.json({
    message: "Unblacklisted successfully",
    item: entry,
  });
}

export async function PATCH(req, ctx) {
  return unblacklist(req, ctx);
}

export async function DELETE(req, ctx) {
  return unblacklist(req, ctx);
}
