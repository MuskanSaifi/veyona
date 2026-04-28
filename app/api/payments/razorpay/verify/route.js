import { NextResponse } from "next/server";
import crypto from "crypto";
import connectDB from "@/lib/db";
import Appointment from "@/models/Appointment";
import { saveAppointmentDoc } from "@/lib/saveAppointmentDoc";

function verifySignature({ orderId, paymentId, signature }) {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) throw new Error("Razorpay secret is not configured");
  const payload = `${orderId}|${paymentId}`;
  const expected = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  return expected === signature;
}

function recomputePaymentStatus({ paidOnline, paidCash, totalPayable }) {
  const paid = (paidOnline || 0) + (paidCash || 0);
  if (paid <= 0) return "unpaid";
  if (paid >= (totalPayable || 0)) return "paid";
  return "partial";
}

export async function POST(req) {
  await connectDB();
  try {
    const body = await req.json();
    const { appointmentId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;
    if (!appointmentId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ message: "Missing payment fields" }, { status: 400 });
    }

    const ok = verifySignature({
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
    });
    if (!ok) return NextResponse.json({ message: "Invalid signature" }, { status: 400 });

    const apt = await Appointment.findById(appointmentId);
    if (!apt) return NextResponse.json({ message: "Appointment not found" }, { status: 404 });

    const totalPayable = Number(apt.pricing?.totalPayable ?? apt.totalPrice ?? 0);
    const onlineDue = Number(apt.payment?.onlineDue || 0);

    // Idempotency: if already captured for this payment id, return ok
    const already = (apt.payments || []).some((p) => p.razorpayPaymentId === razorpay_payment_id && p.status === "captured");
    if (already) return NextResponse.json({ success: true });

    apt.payment.paidOnline = Number(apt.payment.paidOnline || 0) + onlineDue;
    apt.payment.status = recomputePaymentStatus({
      paidOnline: apt.payment.paidOnline,
      paidCash: apt.payment.paidCash,
      totalPayable,
    });
    // Only lock this slot after a successful online payment capture.
    if (apt.payment.paidOnline > 0 || apt.payment.status === "paid") {
      apt.status = "confirmed";
    }
    apt.payments.push({
      kind: "online",
      amount: onlineDue,
      status: "captured",
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
      createdAt: new Date(),
    });

    await saveAppointmentDoc(apt);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

