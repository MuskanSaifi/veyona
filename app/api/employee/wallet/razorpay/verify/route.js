import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import WalletTransaction from "@/models/WalletTransaction";
import { requireEmployee } from "@/lib/serviceTrackingAuth";
import { verifyRazorpaySignature } from "@/lib/razorpay";

/**
 * POST /api/employee/wallet/razorpay/verify
 */
export async function POST(req) {
  await connectDB();

  const auth = requireEmployee(req);
  if (auth.response) return auth.response;
  const employeeId = auth.employeeId;

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON body" }, { status: 400 });
  }

  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    transactionId,
  } = body || {};

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return NextResponse.json({ message: "Missing payment fields" }, { status: 400 });
  }

  const ok = verifyRazorpaySignature({
    orderId: razorpay_order_id,
    paymentId: razorpay_payment_id,
    signature: razorpay_signature,
  });
  if (!ok) {
    return NextResponse.json({ message: "Invalid payment signature" }, { status: 400 });
  }

  const filter = {
    employee: employeeId,
    razorpayOrderId: razorpay_order_id,
    type: "credit",
    category: "employee_deposit",
  };
  if (transactionId) filter._id = transactionId;

  const txn = await WalletTransaction.findOne(filter);
  if (!txn) {
    return NextResponse.json({ message: "Wallet top-up not found" }, { status: 404 });
  }

  if (txn.status === "completed") {
    const summary = await WalletTransaction.getBalance(employeeId);
    return NextResponse.json({ success: true, ...summary });
  }

  if (txn.status === "cancelled") {
    return NextResponse.json({ message: "This top-up was cancelled" }, { status: 400 });
  }

  txn.status = "completed";
  txn.razorpayPaymentId = razorpay_payment_id;
  txn.description = `Online payment — ${razorpay_payment_id}`;
  await txn.save();

  const summary = await WalletTransaction.getBalance(employeeId);
  return NextResponse.json({ success: true, transaction: txn, ...summary });
}
