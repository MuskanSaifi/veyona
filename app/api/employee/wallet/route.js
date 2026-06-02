import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import mongoose from "mongoose";
import WalletTransaction from "@/models/WalletTransaction";
import Appointment from "@/models/Appointment";
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
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const createdAtRange = {};
  if (from) {
    const fromDate = new Date(from);
    if (!Number.isNaN(fromDate.getTime())) createdAtRange.$gte = fromDate;
  }
  if (to) {
    const toDate = new Date(to);
    if (!Number.isNaN(toDate.getTime())) {
      toDate.setHours(23, 59, 59, 999);
      createdAtRange.$lte = toDate;
    }
  }

  const paymentMatch = {
    employee: new mongoose.Types.ObjectId(String(employeeId)),
    "payments.status": { $in: ["captured", "recorded"] },
    "payments.kind": { $in: ["online", "cash"] },
  };
  if (Object.keys(createdAtRange).length > 0) {
    paymentMatch["payments.createdAt"] = createdAtRange;
  }

  const filter = { employee: employeeId };
  if (type === "credit" || type === "debit") filter.type = type;

  const [summary, transactions, receivedAgg] = await Promise.all([
    WalletTransaction.getBalance(employeeId),
    WalletTransaction.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean(),
    Appointment.aggregate([
      { $unwind: "$payments" },
      { $match: paymentMatch },
      {
        $group: {
          _id: "$payments.kind",
          total: { $sum: "$payments.amount" },
          count: { $sum: 1 },
        },
      },
    ]),
  ]);

  let receivedOnline = 0;
  let receivedCash = 0;
  let receivedCount = 0;
  for (const row of receivedAgg) {
    if (row._id === "online") receivedOnline = Number(row.total || 0);
    if (row._id === "cash") receivedCash = Number(row.total || 0);
    receivedCount += Number(row.count || 0);
  }
  const totalReceived = receivedOnline + receivedCash;

  return NextResponse.json({
    ...summary,
    paymentSummary: {
      from: from || null,
      to: to || null,
      receivedOnline,
      receivedCash,
      totalReceived,
      receivedCount,
    },
    transactions,
  });
}
