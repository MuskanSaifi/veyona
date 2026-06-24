import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import WalletTransaction from "@/models/WalletTransaction";
import { requireAdmin } from "@/lib/serviceTrackingAuth";
import { parseWalletDateRange, summarizePurchases } from "@/lib/walletDateFilter";

/**
 * GET /api/admin/wallet/purchases
 * Query: ?employee=<id>&from=&to=&month=YYYY-MM&status=
 */
export async function GET(req) {
  await connectDB();
  const auth = requireAdmin(req);
  if (auth.response) return auth.response;

  const { searchParams } = new URL(req.url);
  const employee = searchParams.get("employee");
  const status = searchParams.get("status");
  const { createdAt, from, to, month } = parseWalletDateRange(searchParams);

  const filter = {
    type: "debit",
    category: "product_purchase",
  };
  if (employee) filter.employee = employee;
  if (createdAt) filter.createdAt = createdAt;
  if (status === "pending" || status === "completed" || status === "cancelled") {
    filter.status = status;
  }

  const purchases = await WalletTransaction.find(filter)
    .populate("employee", "name email phone")
    .sort({ createdAt: -1 })
    .limit(500)
    .lean();

  const summary = summarizePurchases(purchases);

  return NextResponse.json({
    purchases,
    summary,
    filter: {
      employee: employee || "all",
      from,
      to,
      month,
      status: status || "all",
    },
  });
}
