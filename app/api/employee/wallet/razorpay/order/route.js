import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Employee from "@/models/Employee";
import WalletTransaction from "@/models/WalletTransaction";
import { requireEmployee } from "@/lib/serviceTrackingAuth";
import { getRazorpay, getRazorpayKeyId } from "@/lib/razorpay";

/**
 * POST /api/employee/wallet/razorpay/order
 * Body: { amount }
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

  const numericAmount = Number(body?.amount);
  if (!Number.isFinite(numericAmount) || numericAmount < 1) {
    return NextResponse.json(
      { message: "Minimum online top-up is ₹1" },
      { status: 400 }
    );
  }

  const roundedAmount = Math.round(numericAmount * 100) / 100;
  const amountPaise = Math.round(roundedAmount * 100);

  const employee = await Employee.findById(employeeId)
    .select("name email phone")
    .lean();
  if (!employee) {
    return NextResponse.json({ message: "Employee not found" }, { status: 404 });
  }

  const receipt = `ew_${employeeId.toString().slice(-6)}_${Date.now().toString(36)}`;
  const rp = getRazorpay();
  const order = await rp.orders.create({
    amount: amountPaise,
    currency: "INR",
    receipt,
    notes: {
      purpose: "employee_wallet_topup",
      employeeId: String(employeeId),
    },
  });

  const txn = await WalletTransaction.create({
    employee: employeeId,
    type: "credit",
    amount: roundedAmount,
    category: "employee_deposit",
    description: "Online wallet top-up (pending payment)",
    status: "pending",
    razorpayOrderId: order.id,
    createdByRole: "employee",
    createdBy: employeeId,
  });

  return NextResponse.json({
    keyId: getRazorpayKeyId(),
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    transactionId: txn._id,
    employee: {
      name: employee.name || "",
      email: employee.email || "",
      phone: employee.phone || "",
    },
  });
}
