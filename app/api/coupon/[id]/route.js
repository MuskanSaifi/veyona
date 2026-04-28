import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Coupon from "@/models/Coupon";

function getIdFromRequest({ req, params }) {
  const fromParams = params?.id;
  if (fromParams) return fromParams;
  try {
    const pathname = new URL(req.url).pathname || "";
    const parts = pathname.split("/").filter(Boolean);
    // expected: /api/coupon/:id
    const id = parts[parts.length - 1];
    return id || null;
  } catch {
    return null;
  }
}

export async function PUT(req, { params }) {
  await connectDB();
  try {
    const id = getIdFromRequest({ req, params });
    if (!id) return NextResponse.json({ message: "ID required" }, { status: 400 });

    const body = await req.json();
    const { code, type, value, maxDiscount, minOrderAmount, active, expiresAt, usageLimit, validForDays, validForHours } = body;

    const coupon = await Coupon.findById(id);
    if (!coupon) return NextResponse.json({ message: "Coupon not found" }, { status: 404 });

    if (code !== undefined) {
      const codeStr = code.toString().trim().toUpperCase();
      if (!codeStr) {
        return NextResponse.json({ message: "Coupon code cannot be empty" }, { status: 400 });
      }
      const existing = await Coupon.findOne({ code: codeStr, _id: { $ne: id } });
      if (existing) {
        return NextResponse.json({ message: "Another coupon with this code exists" }, { status: 400 });
      }
      coupon.code = codeStr;
    }
    if (type && ["percent", "fixed"].includes(type)) coupon.type = type;
    if (value !== undefined) {
      const val = Number(value);
      if (Number.isFinite(val) && val >= 0) coupon.value = val;
    }
    if (maxDiscount !== undefined) {
      coupon.maxDiscount = maxDiscount === "" || maxDiscount == null ? undefined : Number(maxDiscount);
    }
    if (minOrderAmount !== undefined) {
      coupon.minOrderAmount = minOrderAmount === "" || minOrderAmount == null ? 0 : Number(minOrderAmount);
    }
    if (active !== undefined) coupon.active = !!active;
    if (expiresAt !== undefined) {
      coupon.expiresAt = expiresAt ? new Date(expiresAt) : undefined;
    }
    if (usageLimit !== undefined) {
      coupon.usageLimit = usageLimit === "" || usageLimit == null ? undefined : Number(usageLimit);
    }
    if (validForDays !== undefined) {
      coupon.validForDays = validForDays === "" || validForDays == null ? undefined : Number(validForDays);
    }
    if (validForHours !== undefined) {
      coupon.validForHours = validForHours === "" || validForHours == null ? undefined : Number(validForHours);
    }

    await coupon.save();
    return NextResponse.json(coupon);
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  await connectDB();
  try {
    const id = getIdFromRequest({ req, params });
    if (!id) return NextResponse.json({ message: "ID required" }, { status: 400 });

    const coupon = await Coupon.findByIdAndDelete(id);
    if (!coupon) return NextResponse.json({ message: "Coupon not found" }, { status: 404 });
    return NextResponse.json({ message: "Coupon deleted" });
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
