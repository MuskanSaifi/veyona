import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Appointment from "@/models/Appointment";
import User from "@/models/User";
import jwt from "jsonwebtoken";
import { getCustomerIdsForUser } from "@/lib/customerLookup";
import { buildInvoicePdfBuffer } from "@/lib/buildInvoicePdf";

export const runtime = "nodejs";

export async function GET(req, { params }) {
  await connectDB();
  try {
    const token = req.cookies.get("userToken")?.value;
    if (!token) {
      return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== "user") {
      return NextResponse.json({ message: "Invalid token" }, { status: 401 });
    }

    const user = await User.findById(decoded.id).lean();
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const customerIds = await getCustomerIdsForUser(user);
    if (!customerIds.length) {
      return NextResponse.json({ message: "Customer not found" }, { status: 404 });
    }

    const { id } = await params;
    const apt = await Appointment.findById(id)
      .populate("customer")
      .populate("salon")
      .populate("service")
      .lean();

    if (!apt) {
      return NextResponse.json({ message: "Appointment not found" }, { status: 404 });
    }
    const aptCustomerId = String(apt.customer?._id || apt.customer || "");
    if (!customerIds.some((cid) => String(cid) === aptCustomerId)) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const billTo = {
      name: apt.customer?.name || user.name || "Customer",
      phone: apt.customer?.phone || user.phone || "",
      email: apt.customer?.email || user.email || "",
    };

    const pdfBuffer = await buildInvoicePdfBuffer(apt, billTo);
    const invoiceNo = `VEY-${String(apt._id).slice(-8).toUpperCase()}`;

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="invoice-${invoiceNo}.pdf"`,
      },
    });
  } catch (error) {
    return NextResponse.json({ message: error.message || "Could not generate invoice" }, { status: 500 });
  }
}
