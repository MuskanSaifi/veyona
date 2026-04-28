import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import User from "@/models/User";
import { sendOTPSMS } from "@/lib/sms";

export async function POST(req) {
  await connectDB();

  try {
    const { phone } = await req.json();

    if (!phone) {
      return NextResponse.json(
        { message: "Phone number is required" },
        { status: 400 }
      );
    }

    let user = await User.findOne({ phone });

    if (!user) {
      return NextResponse.json(
        { message: "User not found. Please register first." },
        { status: 404 }
      );
    }

    // 4-digit OTP only
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    user.otp = otp;
    user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    user.isVerified = false;
    await user.save();

    const smsResult = await sendOTPSMS(phone, otp);
    if (!smsResult.success) {
      return NextResponse.json(
        { message: smsResult.message || "Failed to send OTP. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "OTP sent successfully",
    });
  } catch (error) {
    console.error("Error sending OTP:", error);
    return NextResponse.json(
      { message: error.message || "Error sending OTP" },
      { status: 500 }
    );
  }
}

