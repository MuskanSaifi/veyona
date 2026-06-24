import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import WalletTransaction from "@/models/WalletTransaction";
import { requireEmployee } from "@/lib/serviceTrackingAuth";
import { parseWalletDateRange, summarizePurchases } from "@/lib/walletDateFilter";

/**
 * GET /api/employee/wallet/purchases
 * Query: ?from=YYYY-MM-DD&to=YYYY-MM-DD&month=YYYY-MM&status=pending|completed|cancelled
 */
export async function GET(req) {
  await connectDB();

  const auth = requireEmployee(req);
  if (auth.response) return auth.response;
  const employeeId = auth.employeeId;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const { createdAt, from, to, month } = parseWalletDateRange(searchParams);

  const filter = {
    employee: employeeId,
    type: "debit",
    category: "product_purchase",
  };
  if (createdAt) filter.createdAt = createdAt;
  if (status === "pending" || status === "completed" || status === "cancelled") {
    filter.status = status;
  }

  const purchases = await WalletTransaction.find(filter)
    .sort({ createdAt: -1 })
    .limit(500)
    .lean();

  const summary = summarizePurchases(purchases);

  return NextResponse.json({
    purchases,
    summary,
    filter: { from, to, month, status: status || "all" },
  });
}
