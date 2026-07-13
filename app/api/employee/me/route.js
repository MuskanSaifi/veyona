import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Employee from "@/models/Employee";
import { requireEmployee } from "@/lib/serviceTrackingAuth";

export async function GET(req) {
  const auth = requireEmployee(req);
  if (auth.response) return auth.response;

  await connectDB();
  const employee = await Employee.findById(auth.employeeId)
    .select("-password -loginPassword")
    .populate("salon", "name")
    .lean();

  if (!employee) {
    return NextResponse.json({ message: "Employee not found" }, { status: 404 });
  }

  if (!employee.active) {
    return NextResponse.json({ message: "Account inactive" }, { status: 403 });
  }

  return NextResponse.json({
    ...employee,
    permissions: Array.isArray(employee.permissions) ? employee.permissions : [],
  });
}
