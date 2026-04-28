import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import User from "@/models/User";
import jwt from "jsonwebtoken";

export async function POST(req) {
  await connectDB();

  try {
    const { phone, otp } = await req.json();

    if (!phone || !otp) {
      return NextResponse.json(
        { message: "Phone number and OTP are required" },
        { status: 400 }
      );
    }

    const normalizedOtp = String(otp).replace(/\D/g, "");
    if (normalizedOtp.length !== 4) {
      return NextResponse.json(
        { message: "OTP must be a 4-digit number" },
        { status: 400 }
      );
    }

    const user = await User.findOne({ phone });

    if (!user) {
      return NextResponse.json(
        { message: "User not found. Please request OTP first." },
        { status: 404 }
      );
    }

    // Check if OTP is expired
    if (user.otpExpiry && new Date() > user.otpExpiry) {
      return NextResponse.json(
        { message: "OTP has expired. Please request a new one." },
        { status: 400 }
      );
    }

    // Verify OTP
    if (String(user.otp || "") !== normalizedOtp) {
      return NextResponse.json(
        { message: "Invalid OTP" },
        { status: 401 }
      );
    }

    // OTP verified - mark user as verified
    user.isVerified = true;
    user.otp = null;
    user.otpExpiry = null;
    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, role: "user", phone: user.phone },
      process.env.JWT_SECRET,
      { expiresIn: "30d" }
    );

    const res = NextResponse.json({
      message: "Login successful",
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        email: user.email,
      },
    });

    res.cookies.set("userToken", token, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return res;
  } catch (error) {
    console.error("Error verifying OTP:", error);
    return NextResponse.json(
      { message: error.message || "Error verifying OTP" },
      { status: 500 }
    );
  }
}

