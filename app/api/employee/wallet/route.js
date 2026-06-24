import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import WalletTransaction from "@/models/WalletTransaction";
import Product from "@/models/Product";
import { requireEmployee } from "@/lib/serviceTrackingAuth";

/**
 * GET /api/employee/wallet
 *
 * Simplified wallet summary for the employee UI.
 */
export async function GET(req) {
  await connectDB();

  const auth = requireEmployee(req);
  if (auth.response) return auth.response;
  const employeeId = auth.employeeId;

  const [summary, pendingPurchases, recentDeposits] = await Promise.all([
    WalletTransaction.getBalance(employeeId),
    WalletTransaction.find({
      employee: employeeId,
      type: "debit",
      category: "product_purchase",
      status: "pending",
    })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean(),
    WalletTransaction.find({
      employee: employeeId,
      type: "credit",
      category: "employee_deposit",
      status: "completed",
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .select("amount description createdAt")
      .lean(),
  ]);

  return NextResponse.json({
    balance: summary.balance,
    totalEarnings: summary.totalCredit,
    totalDeducted: summary.totalDebit,
    pendingPurchases,
    recentDeposits,
  });
}

/**
 * POST /api/employee/wallet
 *
 * Body: { action: "product_purchase", amount?, description?, productId? }
 *
 * Cash deposits are admin-only. Employees add funds via Razorpay (/wallet/razorpay/*).
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

  const { action, amount, description, productId } = body || {};
  const numericAmount = Number(amount);

  if (action === "product_purchase" && productId) {
    // amount comes from product price when productId is set
  } else if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    return NextResponse.json(
      { message: "amount must be a positive number" },
      { status: 400 }
    );
  }

  const roundedAmount =
    Number.isFinite(numericAmount) && numericAmount > 0
      ? Math.round(numericAmount * 100) / 100
      : 0;
  const note = (description || "").trim().slice(0, 500);

  if (action === "add_funds") {
    return NextResponse.json(
      { message: "Cash deposits can only be added by admin. Use online payment to add funds." },
      { status: 403 }
    );
  }

  if (action === "product_purchase") {
    let purchaseNote = note;
    let purchaseAmount = roundedAmount;
    let refType = "";
    let refId = undefined;

    if (productId) {
      const product = await Product.findById(productId)
        .select("name price active")
        .lean();
      if (!product || !product.active) {
        return NextResponse.json({ message: "Product not found" }, { status: 404 });
      }
      if (!product.price || Number(product.price) <= 0) {
        return NextResponse.json(
          { message: "This product is not available for purchase" },
          { status: 400 }
        );
      }
      purchaseAmount = Math.round(Number(product.price) * 100) / 100;
      purchaseNote = (description || product.name || "").trim().slice(0, 500);
      refType = "Product";
      refId = product._id;
    }

    if (!purchaseNote) {
      return NextResponse.json(
        { message: "Please describe the product purchased" },
        { status: 400 }
      );
    }

    const txn = await WalletTransaction.create({
      employee: employeeId,
      type: "debit",
      amount: purchaseAmount,
      category: "product_purchase",
      description: purchaseNote,
      status: "pending",
      referenceType: refType,
      referenceId: refId,
      createdByRole: "employee",
      createdBy: employeeId,
    });

    return NextResponse.json({
      transaction: txn,
      message: "Purchase submitted. Admin will deduct from your wallet after review.",
    });
  }

  return NextResponse.json(
    { message: "action must be 'product_purchase'" },
    { status: 400 }
  );
}
