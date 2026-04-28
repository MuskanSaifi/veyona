import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Coupon from "@/models/Coupon";

function getEffectiveExpiry(coupon) {
  if (!coupon) return null;
  if (coupon.expiresAt) return new Date(coupon.expiresAt).getTime();
  const days = Number(coupon.validForDays) || 0;
  const hours = Number(coupon.validForHours) || 0;
  if (days === 0 && hours === 0) return null;
  const createdAt = coupon.createdAt ? new Date(coupon.createdAt).getTime() : Date.now();
  return createdAt + days * 24 * 60 * 60 * 1000 + hours * 60 * 60 * 1000;
}

function computeDiscount({ coupon, subtotal }) {
  if (!coupon) return { discountAmount: 0, reason: "Invalid coupon" };
  if (!coupon.active) return { discountAmount: 0, reason: "Coupon inactive" };
  const expiryTime = getEffectiveExpiry(coupon);
  if (expiryTime != null && expiryTime < Date.now()) {
    return { discountAmount: 0, reason: "Coupon expired" };
  }
  if (coupon.usageLimit != null && coupon.usageLimit > 0 && (coupon.usedCount || 0) >= coupon.usageLimit) {
    return { discountAmount: 0, reason: "Coupon usage limit reached" };
  }
  const minOrderAmount = coupon.minOrderAmount || 0;
  if (subtotal < minOrderAmount) {
    return { discountAmount: 0, reason: `Minimum order amount is ₹${minOrderAmount}` };
  }

  let discountAmount = 0;
  if (coupon.type === "percent") {
    discountAmount = Math.round((subtotal * (coupon.value || 0)) / 100);
    if (coupon.maxDiscount != null && coupon.maxDiscount >= 0) {
      discountAmount = Math.min(discountAmount, coupon.maxDiscount);
    }
  } else if (coupon.type === "fixed") {
    discountAmount = Math.round(coupon.value || 0);
  }
  discountAmount = Math.max(0, Math.min(discountAmount, subtotal));
  return { discountAmount, reason: discountAmount > 0 ? null : "No discount applied" };
}

export async function POST(req) {
  await connectDB();
  try {
    const body = await req.json();
    const codeRaw = (body.code || "").toString().trim().toUpperCase();
    const subtotal = Number(body.subtotal || 0);

    if (!codeRaw) {
      return NextResponse.json({ valid: false, message: "Coupon code is required" }, { status: 400 });
    }
    if (!Number.isFinite(subtotal) || subtotal <= 0) {
      return NextResponse.json({ valid: false, message: "Subtotal is invalid" }, { status: 400 });
    }

    const coupon = await Coupon.findOne({ code: codeRaw }).lean();
    if (!coupon) {
      return NextResponse.json({ valid: false, message: "Invalid coupon code" }, { status: 404 });
    }

    const { discountAmount, reason } = computeDiscount({ coupon, subtotal });
    if (discountAmount <= 0) {
      return NextResponse.json({ valid: false, message: reason || "Coupon not applicable" }, { status: 400 });
    }

    return NextResponse.json({
      valid: true,
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      maxDiscount: coupon.maxDiscount ?? null,
      minOrderAmount: coupon.minOrderAmount ?? 0,
      discountAmount,
      totalAfterDiscount: Math.max(0, subtotal - discountAmount),
    });
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

