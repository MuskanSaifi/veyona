import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Blacklist from "@/models/Blacklist";
import Employee from "@/models/Employee";
import Admin from "@/models/admin";
import { requireAdminOrPermittedEmployee } from "@/lib/serviceTrackingAuth";
import { normalizePhone, normalizeEmail } from "@/lib/blacklist";

async function resolveActorName(auth) {
  if (auth.role === "admin") {
    const admin = await Admin.findById(auth.adminId).select("email").lean();
    return admin?.email || "Admin";
  }
  const emp = await Employee.findById(auth.employeeId).select("name email").lean();
  return emp?.name || emp?.email || "Employee";
}

export async function GET(req) {
  await connectDB();

  const auth = await requireAdminOrPermittedEmployee(req, "blacklist");
  if (auth.response) return auth.response;

  const { searchParams } = new URL(req.url);
  const type = (searchParams.get("type") || "all").trim().toLowerCase();
  const includeInactive = searchParams.get("includeInactive") === "1";
  const q = (searchParams.get("q") || "").trim();

  const query = {};
  if (!includeInactive) query.active = true;
  if (type === "customer" || type === "employee") query.type = type;

  // Employees with blacklist permission still see all customer entries (and employee entries if admin-created)
  // so admin transparency is preserved when they open the same tab.

  if (q) {
    const safe = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const rx = new RegExp(safe, "i");
    query.$or = [
      { name: rx },
      { email: rx },
      { phone: rx },
      { reason: rx },
      { createdByName: rx },
    ];
  }

  const items = await Blacklist.find(query)
    .populate("employeeRef", "name email phone active")
    .sort({ createdAt: -1 })
    .limit(500)
    .lean();

  return NextResponse.json({
    items,
    count: items.length,
    role: auth.role,
  });
}

export async function POST(req) {
  await connectDB();

  const auth = await requireAdminOrPermittedEmployee(req, "blacklist");
  if (auth.response) return auth.response;

  const body = await req.json().catch(() => ({}));
  const type = String(body.type || "").trim().toLowerCase();
  const reason = String(body.reason || "").trim();
  const name = String(body.name || "").trim();

  if (type !== "customer" && type !== "employee") {
    return NextResponse.json(
      { message: "type must be customer or employee" },
      { status: 400 }
    );
  }

  if (type === "employee" && auth.role !== "admin") {
    return NextResponse.json(
      { message: "Only admin can blacklist employees" },
      { status: 403 }
    );
  }

  const actorName = await resolveActorName(auth);
  const createdById = auth.role === "admin" ? auth.adminId : auth.employeeId;

  if (type === "customer") {
    const phone = normalizePhone(body.phone);
    const email = normalizeEmail(body.email);
    if (!phone) {
      return NextResponse.json(
        { message: "Valid 10-digit phone is required to blacklist a customer" },
        { status: 400 }
      );
    }

    const or = [];
    if (phone) or.push({ phone });
    if (email) or.push({ email });
    const existing = await Blacklist.findOne({
      type: "customer",
      active: true,
      $or: or,
    }).lean();
    if (existing) {
      return NextResponse.json(
        { message: "This customer is already blacklisted" },
        { status: 409 }
      );
    }

    const doc = await Blacklist.create({
      type: "customer",
      phone: phone || "",
      email: email || "",
      name: name || "",
      reason,
      createdByRole: auth.role,
      createdById,
      createdByName: actorName,
      active: true,
    });

    return NextResponse.json({ item: doc, message: "Customer blacklisted" }, { status: 201 });
  }

  // employee
  const employeeId = body.employeeId;
  if (!employeeId) {
    return NextResponse.json({ message: "employeeId is required" }, { status: 400 });
  }

  const employee = await Employee.findById(employeeId);
  if (!employee) {
    return NextResponse.json({ message: "Employee not found" }, { status: 404 });
  }

  const existingEmp = await Blacklist.findOne({
    type: "employee",
    active: true,
    employeeRef: employee._id,
  }).lean();
  if (existingEmp) {
    return NextResponse.json(
      { message: "This employee is already blacklisted" },
      { status: 409 }
    );
  }

  employee.active = false;
  await employee.save();

  const doc = await Blacklist.create({
    type: "employee",
    employeeRef: employee._id,
    phone: normalizePhone(employee.phone) || "",
    email: normalizeEmail(employee.email) || "",
    name: employee.name || "",
    reason,
    createdByRole: "admin",
    createdById,
    createdByName: actorName,
    active: true,
  });

  return NextResponse.json(
    { item: doc, message: "Employee blacklisted and login disabled" },
    { status: 201 }
  );
}
