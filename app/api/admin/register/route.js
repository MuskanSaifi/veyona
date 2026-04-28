// app/api/admin/register/route.js
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import connectDB from "@/lib/db";
import Admin from "@/models/admin";

export async function POST(req) {
  await connectDB();
  const { email, password } = await req.json();

  if (!email || !password) {
    return NextResponse.json(
      { message: "All fields required" },
      { status: 400 }
    );
  }

  const exists = await Admin.findOne({ email });
  if (exists) {
    return NextResponse.json(
      { message: "Admin already exists" },
      { status: 400 }
    );
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const admin = await Admin.create({
    email,
    password: hashedPassword,
  });

  const token = jwt.sign(
    { id: admin._id, role: admin.role },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );

  const response = NextResponse.json({
    message: "Admin registered",
  });

  response.cookies.set("adminToken", token, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    maxAge: 60 * 60 * 24,
  });

  return response;
}
