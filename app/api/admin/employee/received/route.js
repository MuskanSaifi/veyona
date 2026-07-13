import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Appointment from "@/models/Appointment";
import { requireAdminOrPermittedEmployee } from "@/lib/serviceTrackingAuth";

/**
 * GET /api/admin/employee/received
 *
 * Admin-only. Returns employee-wise money received from customers
 * based on appointment payments (online captured + cash recorded).
 *
 * Query:
 *   ?from=YYYY-MM-DD
 *   ?to=YYYY-MM-DD
 */
export async function GET(req) {
  await connectDB();
  const auth = await requireAdminOrPermittedEmployee(req);
  if (auth.response) return auth.response;

  const { searchParams } = new URL(req.url);
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
    employee: { $type: "objectId" },
    "payments.status": { $in: ["captured", "recorded"] },
    "payments.kind": { $in: ["online", "cash"] },
  };
  if (Object.keys(createdAtRange).length > 0) {
    paymentMatch["payments.createdAt"] = createdAtRange;
  }

  const rows = await Appointment.aggregate([
    { $unwind: "$payments" },
    { $match: paymentMatch },
    {
      $group: {
        _id: { employee: "$employee", kind: "$payments.kind" },
        total: { $sum: "$payments.amount" },
        count: { $sum: 1 },
      },
    },
    {
      $group: {
        _id: "$_id.employee",
        byKind: {
          $push: {
            k: "$_id.kind",
            total: "$total",
            count: "$count",
          },
        },
      },
    },
    {
      $lookup: {
        from: "employees",
        localField: "_id",
        foreignField: "_id",
        as: "employee",
      },
    },
    { $unwind: { path: "$employee", preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: 0,
        employeeId: "$_id",
        employee: {
          id: "$employee._id",
          name: "$employee.name",
          email: "$employee.email",
          phone: "$employee.phone",
          active: "$employee.active",
        },
        receivedOnline: {
          $ifNull: [
            {
              $first: {
                $map: {
                  input: {
                    $filter: {
                      input: "$byKind",
                      as: "r",
                      cond: { $eq: ["$$r.k", "online"] },
                    },
                  },
                  as: "m",
                  in: "$$m.total",
                },
              },
            },
            0,
          ],
        },
        receivedCash: {
          $ifNull: [
            {
              $first: {
                $map: {
                  input: {
                    $filter: {
                      input: "$byKind",
                      as: "r",
                      cond: { $eq: ["$$r.k", "cash"] },
                    },
                  },
                  as: "m",
                  in: "$$m.total",
                },
              },
            },
            0,
          ],
        },
        receivedCount: {
          $sum: {
            $map: {
              input: "$byKind",
              as: "r",
              in: { $ifNull: ["$$r.count", 0] },
            },
          },
        },
      },
    },
    {
      $addFields: {
        totalReceived: { $add: ["$receivedOnline", "$receivedCash"] },
      },
    },
    { $sort: { totalReceived: -1 } },
  ]);

  return NextResponse.json({
    from: from || null,
    to: to || null,
    rows,
  });
}

