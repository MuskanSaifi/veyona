import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import User from "@/models/User";
import { sendOTPSMS } from "@/lib/sms";

export async function POST(req) {
  await connectDB();

  try {
    const { name, phone, email } = await req.json();

    if (!phone) {
      return NextResponse.json(
        { message: "Phone number is required" },
        { status: 400 }
      );
    }

    if (!name) {
      return NextResponse.json(
        { message: "Name is required" },
        { status: 400 }
      );
    }

    const existingUser = await User.findOne({ phone });
    if (existingUser) {
      return NextResponse.json(
        { message: "User already exists. Please login instead." },
        { status: 400 }
      );
    }

    // 4-digit OTP only
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    const user = await User.create({
      name,
      phone,
      email: email || "",
      otp,
      otpExpiry: new Date(Date.now() + 10 * 60 * 1000),
      isVerified: false,
    });

    const smsResult = await sendOTPSMS(phone, otp);
    if (!smsResult.success) {
      await User.findByIdAndDelete(user._id);
      return NextResponse.json(
        { message: smsResult.message || "Failed to send OTP. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Registration successful. OTP sent to your phone.",
    });
  } catch (error) {
    console.error("Error registering user:", error);
    if (error.code === 11000) {
      return NextResponse.json(
        { message: "Phone number already registered. Please login." },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { message: error.message || "Error registering user" },
      { status: 500 }
    );
  }
}

