import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Appointment from "@/models/Appointment";
import { requireAdmin } from "@/lib/serviceTrackingAuth";
import { buildInvoicePdfBuffer } from "@/lib/buildInvoicePdf";
import { ensureAppointmentInvoiceNumber } from "@/lib/invoiceNumber";
import { getInvoiceIssueDate } from "@/lib/invoiceUtils";

export const runtime = "nodejs";

/**
 * GET /api/admin/invoices/[id] — download invoice PDF (admin).
 */
export async function GET(req, { params }) {
  await connectDB();

  const auth = requireAdmin(req);
  if (auth.response) return auth.response;

  const { id } = await params;
  const apt = await Appointment.findById(id)
    .populate("customer")
    .populate("salon")
    .populate("service")
    .lean();

  if (!apt) {
    return NextResponse.json({ message: "Appointment not found" }, { status: 404 });
  }

  const billTo = {
    name: apt.customer?.name || "Customer",
    phone: apt.customer?.phone || "",
    email: apt.customer?.email || "",
  };

  try {
    const invoiceIssueDate = getInvoiceIssueDate(apt);
    const invoiceNo = await ensureAppointmentInvoiceNumber(id, invoiceIssueDate);
    const pdfBuffer = await buildInvoicePdfBuffer({ ...apt, invoiceNumber: invoiceNo }, billTo);

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="invoice-${invoiceNo}.pdf"`,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { message: error.message || "Could not generate invoice" },
      { status: 500 }
    );
  }
}
