import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Employee from "@/models/Employee";
import WalletTransaction, { WALLET_CATEGORIES } from "@/models/WalletTransaction";
import { requireAdmin } from "@/lib/serviceTrackingAuth";

/**
 * GET /api/admin/wallet/transactions
 *
 * Admin-only. Lists wallet transactions, optionally filtered.
 * Query: ?employee=<id>  ?type=credit|debit  ?status=...  ?limit=100
 */
export async function GET(req) {
  await connectDB();
  const auth = requireAdmin(req);
  if (auth.response) return auth.response;

  const { searchParams } = new URL(req.url);
  const employee = searchParams.get("employee");
  const type = searchParams.get("type");
  const status = searchParams.get("status");
  const limit = Math.min(
    500,
    Math.max(1, parseInt(searchParams.get("limit") || "100", 10) || 100)
  );

  const filter = {};
  if (employee) filter.employee = employee;
  if (type === "credit" || type === "debit") filter.type = type;
  if (status) filter.status = status;
  const category = searchParams.get("category");
  if (category) filter.category = category;

  const transactions = await WalletTransaction.find(filter)
    .populate("employee", "name email phone")
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  return NextResponse.json({ transactions, categories: WALLET_CATEGORIES });
}

/**
 * POST /api/admin/wallet/transactions
 *
 * Admin-only. Creates a credit or debit entry for an employee.
 * Body: { employeeId, type, amount, category?, description?, status? }
 */
export async function POST(req) {
  await connectDB();
  const auth = requireAdmin(req);
  if (auth.response) return auth.response;

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON body" }, { status: 400 });
  }

  const { employeeId, type, amount, category, description, status } = body || {};

  if (!employeeId) {
    return NextResponse.json({ message: "employeeId is required" }, { status: 400 });
  }
  if (type !== "credit" && type !== "debit") {
    return NextResponse.json(
      { message: "type must be 'credit' or 'debit'" },
      { status: 400 }
    );
  }
  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    return NextResponse.json(
      { message: "amount must be a positive number" },
      { status: 400 }
    );
  }

  const employee = await Employee.findById(employeeId).select("_id name");
  if (!employee) {
    return NextResponse.json({ message: "Employee not found" }, { status: 404 });
  }

  // For a debit, refuse to drive the balance negative.
  if (type === "debit") {
    const summary = await WalletTransaction.getBalance(employeeId);
    if (summary.balance < numericAmount) {
      return NextResponse.json(
        {
          message: `Insufficient wallet balance. Available: ₹${summary.balance.toFixed(2)}`,
        },
        { status: 400 }
      );
    }
  }

  const allowedStatus = ["pending", "completed", "cancelled"];
  const finalStatus = allowedStatus.includes(status) ? status : "completed";

  const allowedCategory = WALLET_CATEGORIES.includes(category)
    ? category
    : "adjustment";

  const txn = await WalletTransaction.create({
    employee: employee._id,
    type,
    amount: Math.round(numericAmount * 100) / 100,
    category: allowedCategory,
    description: (description || "").trim().slice(0, 500),
    status: finalStatus,
    createdByRole: "admin",
    createdBy: auth.adminId,
  });

  const summary = await WalletTransaction.getBalance(employee._id);

  return NextResponse.json({
    transaction: txn,
    summary,
  });
}
