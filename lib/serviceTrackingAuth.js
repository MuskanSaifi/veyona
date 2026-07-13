/**
 * Small auth helpers for the Service Time Tracking API routes.
 *
 * Mirrors the cookie/JWT pattern already used by `/api/employee/appointments`
 * and `/api/admin/login` in this project:
 *   - employee routes read `employeeToken` cookie
 *   - admin routes read `adminToken` cookie
 *
 * On success the decoded id is returned. On failure a NextResponse 401 is
 * returned that the caller can simply re-return.
 */

import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import connectDB from "@/lib/db";
import Employee from "@/models/Employee";

function verifyTokenFromCookie(req, cookieName, expectedRole) {
  const token = req.cookies.get(cookieName)?.value;
  if (!token) return { error: "Unauthorized" };

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (expectedRole && decoded.role && decoded.role !== expectedRole) {
      return { error: "Forbidden" };
    }
    return { id: decoded.id, role: decoded.role || expectedRole };
  } catch {
    return { error: "Unauthorized" };
  }
}

export function requireEmployee(req) {
  const result = verifyTokenFromCookie(req, "employeeToken", "employee");
  if (result.error) {
    return {
      response: NextResponse.json({ message: result.error }, { status: 401 }),
    };
  }
  return { employeeId: result.id };
}

export function requireAdmin(req) {
  const result = verifyTokenFromCookie(req, "adminToken", "admin");
  if (result.error) {
    return {
      response: NextResponse.json({ message: result.error }, { status: 401 }),
    };
  }
  return { adminId: result.id };
}

/** True when request has a valid admin JWT (no DB). */
export function isAdminRequest(req) {
  return !verifyTokenFromCookie(req, "adminToken", "admin").error;
}

/**
 * Admin always allowed. Employee allowed if active and has at least one
 * panel permission (or a specific permission when `permissionKey` is set).
 */
export async function requireAdminOrPermittedEmployee(req, permissionKey) {
  const admin = requireAdmin(req);
  if (!admin.response) {
    return { role: "admin", adminId: admin.adminId };
  }

  const emp = requireEmployee(req);
  if (emp.response) {
    return {
      response: NextResponse.json({ message: "Unauthorized" }, { status: 401 }),
    };
  }

  await connectDB();
  const employee = await Employee.findById(emp.employeeId)
    .select("permissions active")
    .lean();

  if (!employee?.active) {
    return {
      response: NextResponse.json({ message: "Forbidden" }, { status: 403 }),
    };
  }

  const permissions = Array.isArray(employee.permissions)
    ? employee.permissions
    : [];

  if (permissionKey) {
    if (!permissions.includes(permissionKey)) {
      return {
        response: NextResponse.json({ message: "Forbidden" }, { status: 403 }),
      };
    }
  } else if (permissions.length === 0) {
    return {
      response: NextResponse.json({ message: "Forbidden" }, { status: 403 }),
    };
  }

  return {
    role: "employee",
    employeeId: emp.employeeId,
    permissions,
  };
}
