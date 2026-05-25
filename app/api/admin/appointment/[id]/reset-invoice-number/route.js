import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Appointment from "@/models/Appointment";
import { requireAdmin } from "@/lib/serviceTrackingAuth";
import { allocateInvoiceNumber } from "@/lib/invoiceNumber";

/**
 * POST /api/admin/appointment/[id]/reset-invoice-number
 *
 * Admin-only utility: clears the saved `invoiceNumber` on an appointment so
 * the next invoice render allocates a fresh one in the current format
 * (VEY/YYYY-MM/NNNNN).
 *
 * Body (optional): { allocateNow: true }  → also allocate + save the new
 * number immediately and return it. Otherwise just clears the field and the
 * number is allocated the next time the invoice PDF is generated.
 *
 * Returns: { previousInvoiceNumber, newInvoiceNumber? }
 */
export async function POST(req, { params }) {
  await connectDB();

  const auth = requireAdmin(req);
  if (auth.response) return auth.response;

  const { id } = await params;

  const apt = await Appointment.findById(id).select("invoiceNumber");
  if (!apt) {
    return NextResponse.json({ message: "Appointment not found" }, { status: 404 });
  }

  const previousInvoiceNumber = apt.invoiceNumber || null;

  let allocateNow = false;
  try {
    const body = await req.json();
    allocateNow = !!body?.allocateNow;
  } catch {
    /* body is optional */
  }

  if (allocateNow) {
    const newInvoiceNumber = await allocateInvoiceNumber(new Date());
    await Appointment.findByIdAndUpdate(id, { invoiceNumber: newInvoiceNumber });
    return NextResponse.json({
      message: "Invoice number reset and re-allocated",
      previousInvoiceNumber,
      newInvoiceNumber,
    });
  }

  await Appointment.findByIdAndUpdate(id, { $unset: { invoiceNumber: "" } });
  return NextResponse.json({
    message:
      "Invoice number cleared. The next PDF render will allocate a fresh number in VEY/YYYY-MM/NNNNN format.",
    previousInvoiceNumber,
    newInvoiceNumber: null,
  });
}
