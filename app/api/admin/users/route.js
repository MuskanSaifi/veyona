import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import User from "@/models/User";
import { requireAdminOrPermittedEmployee } from "@/lib/serviceTrackingAuth";

export async function GET(req) {
  await connectDB();

  const auth = await requireAdminOrPermittedEmployee(req, "users");
  if (auth.response) return auth.response;

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
