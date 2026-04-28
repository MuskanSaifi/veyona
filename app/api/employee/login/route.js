import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Employee from "@/models/Employee";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export async function POST(req) {
  await connectDB();

  const { email, password } = await req.json();

  const employee = await Employee.findOne({ email }).populate("salon");
  if (!employee) {
    return NextResponse.json({ message: "Invalid email" }, { status: 401 });
  }

  if (!employee.active) {
    return NextResponse.json({ message: "Account is inactive" }, { status: 401 });
  }

  const isMatch = await bcrypt.compare(password, employee.password);
  if (!isMatch) {
    return NextResponse.json({ message: "Invalid password" }, { status: 401 });
  }

  const token = jwt.sign(
    { id: employee._id, role: "employee" },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );

  const res = NextResponse.json({ 
    message: "Login success",
    employee: {
      id: employee._id,
      name: employee.name,
      email: employee.email,
      salon: employee.salon,
    }
  });

  res.cookies.set("employeeToken", token, {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24,
  });

  return res;
}




