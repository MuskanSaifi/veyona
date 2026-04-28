import { NextResponse } from "next/server";
import crypto from "crypto";
import connectDB from "@/lib/db";
import Appointment from "@/models/Appointment";
import Razorpay from "razorpay";

function getRazorpay() {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;
  if (!key_id || !key_secret) {
    throw new Error("Razorpay keys are not configured");
  }
  return new Razorpay({ key_id, key_secret });
}

export async function POST(req) {
  await connectDB();
  try {
    const body = await req.json();
    const appointmentId = body.appointmentId;
    if (!appointmentId) {
      return NextResponse.json({ message: "appointmentId is required" }, { status: 400 });
    }

    const apt = await Appointment.findById(appointmentId).populate("customer").lean();
    if (!apt) return NextResponse.json({ message: "Appointment not found" }, { status: 404 });

    const mode = body.mode === "remaining" ? "remaining" : "onlineDue";

    const subtotal = Number(apt.pricing?.subtotal ?? apt.totalPrice ?? 0);
    const discountAmount = Number(apt.pricing?.discountAmount ?? 0);
    const totalPayable = Math.max(0, Number(apt.pricing?.totalPayable ?? subtotal - discountAmount));
    const paidOnline = Number(apt.payment?.paidOnline || 0);
    const paidCash = Number(apt.payment?.paidCash || 0);
    const alreadyPaid = paidOnline + paidCash;

    let amountToCharge = 0;
    if (mode === "remaining") {
      amountToCharge = Math.max(0, totalPayable - alreadyPaid);
    } else {
      amountToCharge = Number(apt.payment?.onlineDue || 0);
    }

    if (!Number.isFinite(amountToCharge) || amountToCharge <= 0) {
      return NextResponse.json({ message: "No amount due for online payment" }, { status: 400 });
    }

    const amountPaise = Math.round(amountToCharge * 100);
    const receipt = `apt_${appointmentId.toString().slice(-8)}_${Date.now().toString(36)}`;

    const rp = getRazorpay();
    const order = await rp.orders.create({
      amount: amountPaise,
      currency: "INR",
      receipt,
      notes: {
        appointmentId: appointmentId.toString(),
      },
    });

    await Appointment.findByIdAndUpdate(
      appointmentId,
      {
        $set: { "payment.onlineDue": amountToCharge },
        $push: {
          payments: {
            kind: "online",
            amount: amountToCharge,
            status: "created",
            razorpayOrderId: order.id,
            createdAt: new Date(),
          },
        },
      },
      { new: false }
    );

    return NextResponse.json({
      keyId: process.env.RAZORPAY_KEY_ID,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      appointmentId,
      customer: {
        name: apt.customer?.name || "",
        email: apt.customer?.email || "",
        phone: apt.customer?.phone || "",
      },
    });
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

