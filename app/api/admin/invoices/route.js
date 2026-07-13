import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Appointment from "@/models/Appointment";
import { requireAdminOrPermittedEmployee } from "@/lib/serviceTrackingAuth";
import {
  appointmentServiceLabel,
  appointmentTotalPayable,
  getInvoiceIssueDate,
  invoiceMonthLabel,
} from "@/lib/invoiceUtils";

export const runtime = "nodejs";

/**
 * GET /api/admin/invoices?month=YYYY-MM
 * Admin-only list of billable appointments for the selected calendar month.
 */
export async function GET(req) {
  await connectDB();

  const auth = await requireAdminOrPermittedEmployee(req);
  if (auth.response) return auth.response;

  const { searchParams } = new URL(req.url);
  const now = new Date();
  const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const month = (searchParams.get("month") || defaultMonth).trim();

  if (!/^\d{4}-\d{2}$/.test(month)) {
    return NextResponse.json({ message: "Invalid month. Use YYYY-MM." }, { status: 400 });
  }

  const appointments = await Appointment.find({
    $or: [
      { "payment.paidOnline": { $gt: 0 } },
      { "payment.paidCash": { $gt: 0 } },
      { "payment.status": { $in: ["paid", "partial"] } },
      { invoiceNumber: { $exists: true, $ne: "" } },
    ],
  })
    .populate("customer", "name phone email")
    .populate("service", "name price")
    .sort({ updatedAt: -1 })
    .limit(3000)
    .lean();

  const rows = [];
  let monthTotal = 0;

  for (const apt of appointments) {
    const issueDate = getInvoiceIssueDate(apt);
    if (invoiceMonthLabel(issueDate) !== month) continue;

    const total = appointmentTotalPayable(apt);
    monthTotal += total;

    rows.push({
      _id: apt._id,
      invoiceNumber: apt.invoiceNumber || null,
      customerName: apt.customer?.name || "Customer",
      customerPhone: apt.customer?.phone || "",
      customerEmail: apt.customer?.email || "",
      serviceLabel: appointmentServiceLabel(apt),
      issueDate: issueDate.toISOString(),
      bookingDate: apt.date ? new Date(apt.date).toISOString() : null,
      total,
      paidOnline: Number(apt.payment?.paidOnline || 0),
      paidCash: Number(apt.payment?.paidCash || 0),
      paymentStatus: apt.payment?.status || "unpaid",
      appointmentStatus: apt.status,
    });
  }

  rows.sort((a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime());

  return NextResponse.json({
    month,
    count: rows.length,
    monthTotal,
    invoices: rows,
  });
}
