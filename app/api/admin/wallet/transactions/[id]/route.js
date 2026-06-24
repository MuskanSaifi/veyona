import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import WalletTransaction from "@/models/WalletTransaction";
import { requireAdmin } from "@/lib/serviceTrackingAuth";

/**
 * PATCH /api/admin/wallet/transactions/[id]
 *
 * Approve or reject a pending wallet transaction (e.g. product purchase).
 * Body: { action: "approve" | "reject" }
 */
export async function PATCH(req, { params }) {
  await connectDB();
  const auth = requireAdmin(req);
  if (auth.response) return auth.response;

  const { id } = await params;

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON body" }, { status: 400 });
  }

  const { action } = body || {};
  if (action !== "approve" && action !== "reject") {
    return NextResponse.json(
      { message: "action must be 'approve' or 'reject'" },
      { status: 400 }
    );
  }

  const txn = await WalletTransaction.findById(id);
  if (!txn) {
    return NextResponse.json({ message: "Transaction not found" }, { status: 404 });
  }

  if (txn.status !== "pending") {
    return NextResponse.json(
      { message: "Only pending transactions can be updated" },
      { status: 400 }
    );
  }

  if (action === "reject") {
    txn.status = "cancelled";
    await txn.save();
    return NextResponse.json({ transaction: txn, message: "Purchase rejected" });
  }

  // approve — complete the debit
  if (txn.type === "debit") {
    const summary = await WalletTransaction.getBalance(txn.employee);
    if (summary.balance < txn.amount) {
      return NextResponse.json(
        {
          message: `Insufficient wallet balance. Available: ₹${summary.balance.toFixed(2)}`,
        },
        { status: 400 }
      );
    }
  }

  txn.status = "completed";
  txn.createdBy = auth.adminId;
  await txn.save();

  const summary = await WalletTransaction.getBalance(txn.employee);

  return NextResponse.json({
    transaction: txn,
    summary,
    message: "Amount deducted from employee wallet",
  });
}
