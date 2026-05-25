import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import WalletTransaction from "@/models/WalletTransaction";
import { requireEmployee } from "@/lib/serviceTrackingAuth";

/**
 * GET /api/employee/wallet
 *
 * Logged-in employee's wallet summary + recent transactions.
 *
 * Query: ?limit=50 (default 50, max 200)
 *        ?type=credit|debit
 */
export async function GET(req) {
  await connectDB();

  const auth = requireEmployee(req);
  if (auth.response) return auth.response;
  const employeeId = auth.employeeId;

  const { searchParams } = new URL(req.url);
  const limit = Math.min(
    200,
    Math.max(1, parseInt(searchParams.get("limit") || "50", 10) || 50)
  );
  const type = searchParams.get("type");

  const filter = { employee: employeeId };
  if (type === "credit" || type === "debit") filter.type = type;

  const [summary, transactions] = await Promise.all([
    WalletTransaction.getBalance(employeeId),
    WalletTransaction.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean(),
  ]);

  return NextResponse.json({
    ...summary,
    transactions,
  });
}
