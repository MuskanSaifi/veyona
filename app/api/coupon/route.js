import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Coupon from "@/models/Coupon";

export async function GET() {
  await connectDB();
  try {
    const coupons = await Coupon.find({}).sort({ createdAt: -1 }).lean();
    return NextResponse.json(coupons);
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  await connectDB();
  try {
    const body = await req.json();
    const { code, type, value, maxDiscount, minOrderAmount, active, expiresAt, usageLimit, validForDays, validForHours } = body;

    const codeStr = (code || "").toString().trim().toUpperCase();
    if (!codeStr) {
      return NextResponse.json({ message: "Coupon code is required" }, { status: 400 });
    }
    if (!type || !["percent", "fixed"].includes(type)) {
      return NextResponse.json({ message: "Type must be percent or fixed" }, { status: 400 });
    }
    const val = Number(value);
    if (!Number.isFinite(val) || val < 0) {
      return NextResponse.json({ message: "Valid discount value is required" }, { status: 400 });
    }

    const couponData = {
      code: codeStr,
      type,
      value: val,
      active: active !== false,
    };
    if (maxDiscount != null && maxDiscount !== "") {
      couponData.maxDiscount = Number(maxDiscount);
    }
    if (minOrderAmount != null && minOrderAmount !== "" && Number(minOrderAmount) > 0) {
      couponData.minOrderAmount = Number(minOrderAmount);
    }
    if (expiresAt) {
      couponData.expiresAt = new Date(expiresAt);
    }
    if (usageLimit != null && usageLimit !== "" && Number(usageLimit) > 0) {
      couponData.usageLimit = Number(usageLimit);
    }
    if (validForDays != null && validForDays !== "" && Number(validForDays) >= 0) {
      couponData.validForDays = Number(validForDays);
    }
    if (validForHours != null && validForHours !== "" && Number(validForHours) >= 0) {
      couponData.validForHours = Number(validForHours);
    }

    const existing = await Coupon.findOne({ code: codeStr });
    if (existing) {
      return NextResponse.json({ message: "Coupon with this code already exists" }, { status: 400 });
    }

    const coupon = await Coupon.create(couponData);
    return NextResponse.json(coupon);
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
