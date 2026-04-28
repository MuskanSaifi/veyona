// app/api/admin/login/route.js
import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Admin from "@/models/admin";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export async function POST(req) {
  await connectDB();

  const { email, password } = await req.json();

  const admin = await Admin.findOne({ email });
  if (!admin) {
    return NextResponse.json({ message: "Invalid email" }, { status: 401 });
  }

  const isMatch = await bcrypt.compare(password, admin.password);
  if (!isMatch) {
    return NextResponse.json({ message: "Invalid password" }, { status: 401 });
  }

  const token = jwt.sign(
    { id: admin._id, role: "admin" },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );

  const res = NextResponse.json({ message: "Login success" });

  res.cookies.set("adminToken", token, {
    httpOnly: true,
    secure: false, // ✅ IMPORTANT FOR LOCALHOST
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24,
  });

  return res;
}
