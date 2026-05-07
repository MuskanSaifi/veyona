import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Appointment from "@/models/Appointment";
import { saveAppointmentDoc } from "@/lib/saveAppointmentDoc";
import { sendWhatsAppTemplate } from "@/lib/whatsapp";
import jwt from "jsonwebtoken";

function getAuth(req) {
  const adminToken = req.cookies.get("adminToken")?.value;
  const employeeToken = req.cookies.get("employeeToken")?.value;
  const token = adminToken || employeeToken;
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const role = decoded?.role || (adminToken ? "admin" : "employee");
    return { role, id: decoded?.id };
  } catch {
    return null;
  }
}

function recomputePayment(apt) {
  apt.payment = apt.payment || {};
  const totalPayable = Number(apt.pricing?.totalPayable ?? apt.totalPrice ?? 0);
  const paidOnline = Number(apt.payment?.paidOnline || 0);
  const paidCash = Number(apt.payment?.paidCash || 0);
  const paid = paidOnline + paidCash;
  apt.payment.status = paid <= 0 ? "unpaid" : paid >= totalPayable ? "paid" : "partial";
  // keep due fields sane
  const onlineDue = Number(apt.payment?.onlineDue || 0);
  const cashDue = Math.max(0, totalPayable - onlineDue);
  apt.payment.cashDue = cashDue;
}

export async function GET(req, { params }) {
  await connectDB();
  const { id } = await params;
  const appointment = await Appointment.findById(id)
    .populate("customer")
    .populate("salon")
    .populate("employee")
    .populate("service");
  if (!appointment) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(appointment);
}

export async function PUT(req, { params }) {
  await connectDB();
  const { id } = await params;

  try {
    const auth = getAuth(req);
    if (!auth) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const body = await req.json();
    const { status, date, time, notes, cashPaidDelta, action, refundNote } = body;

    // Do not populate before save — saving a populated doc can cause cast/validation errors.
    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const wasConfirmed = appointment.status === "confirmed";
    // Status/date/time/notes:
    // - admin can update all
    // - employee can mark ONLY their own appointment as "completed"
    if (status || date || time || notes !== undefined) {
      if (auth.role !== "admin") {
        const empId = appointment.employee?._id?.toString?.() || appointment.employee?.toString?.();
        const isOwn = empId === auth.id?.toString?.();
        const isAllowedEmployeeStatus = status === "completed" && isOwn && !date && !time && notes === undefined;
        if (!isAllowedEmployeeStatus) {
          return NextResponse.json({ message: "Not allowed" }, { status: 403 });
        }
        appointment.status = "completed";
      } else {
        if (status) appointment.status = status;
        if (date) appointment.date = new Date(date);
        if (time) appointment.time = time;
        if (notes !== undefined) appointment.notes = notes;
      }
    }

    // Cash payment update: admin or employee
    if (cashPaidDelta != null) {
      const delta = Number(cashPaidDelta);
      if (!Number.isFinite(delta) || delta <= 0) {
        return NextResponse.json({ message: "cashPaidDelta must be a positive number" }, { status: 400 });
      }
      if (auth.role === "employee") {
        const empId = appointment.employee?._id?.toString?.() || appointment.employee?.toString?.();
        if (empId !== auth.id?.toString?.()) {
          return NextResponse.json({ message: "Not allowed" }, { status: 403 });
        }
      }
      appointment.payment = appointment.payment || {};
      appointment.payment.paidCash = Number(appointment.payment.paidCash || 0) + delta;
      appointment.payments = appointment.payments || [];
      appointment.payments.push({
        kind: "cash",
        amount: delta,
        status: "recorded",
        recordedByRole: auth.role,
        recordedById: auth.id,
        createdAt: new Date(),
      });
    }

    // Refund processing: admin only
    if (action === "mark_refund_processed") {
      if (auth.role !== "admin") {
        return NextResponse.json({ message: "Not allowed" }, { status: 403 });
      }
      const isCancelled = appointment.status === "cancelled";
      const refundRequired = Boolean(appointment.refund?.required);
      if (!isCancelled || !refundRequired) {
        return NextResponse.json(
          { message: "Refund can only be processed for cancelled paid appointments" },
          { status: 400 }
        );
      }
      appointment.refund = appointment.refund || {};
      appointment.refund.status = "processed";
      appointment.refund.processedAt = new Date();
      appointment.refund.processedByRole = "admin";
      appointment.refund.processedById = auth.id;
      if (refundNote !== undefined) {
        appointment.refund.note = String(refundNote || "").trim() || undefined;
      }
    }

    recomputePayment(appointment);

    await saveAppointmentDoc(appointment);

    const updated = await Appointment.findById(id)
      .populate("customer")
      .populate("salon")
      .populate("employee")
      .populate("service");

    // When admin first confirms: send WhatsApp template to user (e.g. "Your Booking is Confirmed!")
    const userTemplateName = process.env.INTERAKT_TEMPLATE_BOOKING_CONFIRMED || "transactional_booking_confirmation";
    if (status === "confirmed" && !wasConfirmed && updated.customer?.phone) {
      const dateStr = new Date(updated.date).toLocaleDateString("en-IN", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
      });
      const timeStr = updated.time || "";
      const servicesArray = Array.isArray(updated.services) && updated.services.length > 0
        ? updated.services
        : (updated.service ? [{ name: updated.service.name }] : []);
      const primaryServiceName = updated.service?.name || servicesArray[0]?.name || "Service";
      const servicesLabel =
        servicesArray.length > 1
          ? `${primaryServiceName} + ${servicesArray.length - 1} more`
          : primaryServiceName;
      // Template placeholders: {{1}} = service(s) + date, {{2}} = time
      sendWhatsAppTemplate(
        updated.customer.phone,
        userTemplateName,
        [`${servicesLabel} on ${dateStr}`, timeStr]
      ).catch((err) => console.error("WhatsApp booking confirm failed:", err));
    }

    // Notify employee when confirmed (transactional_employee_assign)
    const employeeTemplate = process.env.INTERAKT_TEMPLATE_EMPLOYEE_ASSIGN || "transactional_employee_assign";
    if (status === "confirmed" && !wasConfirmed && updated.employee?.phone) {
      const dateStr = new Date(updated.date).toLocaleDateString("en-IN", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
      });
      const timeStr = updated.time || "";
      const clientName = updated.customer?.name || "Customer";
      const servicesArray = Array.isArray(updated.services) && updated.services.length > 0
        ? updated.services
        : (updated.service ? [{ name: updated.service.name }] : []);
      const servicesText = servicesArray
        .map((s) => s?.name)
        .filter(Boolean)
        .join(", ");
      const clientLabel = servicesText ? `${clientName} – ${servicesText}` : clientName;
      sendWhatsAppTemplate(
        updated.employee.phone,
        employeeTemplate,
        [clientLabel, dateStr, timeStr]
      ).catch((err) => console.error("WhatsApp employee assign failed:", err));
    }

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json(
      { message: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(req, { params }) {
  await connectDB();
  const { id } = await params;

  const appointment = await Appointment.findById(id);
  if (!appointment) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await Appointment.findByIdAndDelete(id);
  return NextResponse.json({ success: true });
}




