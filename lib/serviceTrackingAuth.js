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
