import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import mongoose from "mongoose";
import Employee from "@/models/Employee";
import WalletTransaction from "@/models/WalletTransaction";
import { requireAdmin } from "@/lib/serviceTrackingAuth";

/**
 * GET /api/admin/wallet/summary
 *
 * Admin-only. Returns every employee with their wallet totals so the admin
 * dashboard can list balances at a glance.
 *
 * Response: [{ employee: { id, name, email, phone, active },
 *              balance, totalCredit, totalDebit, transactionCount }]
 */
export async function GET(req) {
  await connectDB();
  const auth = requireAdmin(req);
  if (auth.response) return auth.response;

  const employees = await Employee.find({})
    .select("name email phone active image")
    .sort({ name: 1 })
    .lean();

  const aggregates = await WalletTransaction.aggregate([
    { $match: { status: "completed" } },
    {
      $group: {
        _id: { employee: "$employee", type: "$type" },
        total: { $sum: "$amount" },
        count: { $sum: 1 },
      },
    },
  ]);

  const byEmployee = new Map();
  for (const row of aggregates) {
    const key = String(row._id.employee);
    const entry =
      byEmployee.get(key) || { totalCredit: 0, totalDebit: 0, transactionCount: 0 };
    if (row._id.type === "credit") entry.totalCredit = row.total;
    if (row._id.type === "debit") entry.totalDebit = row.total;
    entry.transactionCount += row.count;
    byEmployee.set(key, entry);
  }

  const data = employees.map((e) => {
    const t = byEmployee.get(String(e._id)) || {
      totalCredit: 0,
      totalDebit: 0,
      transactionCount: 0,
    };
    return {
      employee: {
        id: e._id,
        name: e.name,
        email: e.email,
        phone: e.phone,
        active: e.active,
        image: e.image,
      },
      balance: Math.max(0, t.totalCredit - t.totalDebit),
      totalCredit: t.totalCredit,
      totalDebit: t.totalDebit,
      transactionCount: t.transactionCount,
    };
  });

  // Sort: highest balance first
  data.sort((a, b) => b.balance - a.balance);

  return NextResponse.json(data);
}
