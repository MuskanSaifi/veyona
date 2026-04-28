import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import User from "@/models/User";
import jwt from "jsonwebtoken";

function requireAdmin(req) {
  const token = req.cookies.get("adminToken")?.value;
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded?.role !== "admin") return null;
    return { id: decoded?.id };
  } catch {
    return null;
  }
}

export async function GET(req) {
  await connectDB();

  const auth = requireAdmin(req);
  if (!auth) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();
  const limitRaw = Number(searchParams.get("limit") || 200);
  const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 1000) : 200;

  const query = {};
  if (q) {
    const safe = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const rx = new RegExp(safe, "i");
    query.$or = [{ name: rx }, { email: rx }, { phone: rx }];
  }

  const users = await User.find(query)
    .select("name email phone address savedAddresses defaultAddressIndex otp otpExpiry isVerified createdAt updatedAt")
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  return NextResponse.json({ users, count: users.length });
}

