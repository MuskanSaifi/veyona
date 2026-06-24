import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Appointment from "@/models/Appointment";
import Customer from "@/models/Customer";
import mongoose from "mongoose";
import { saveAppointmentDoc } from "@/lib/saveAppointmentDoc";
import { sendWhatsAppTemplate } from "@/lib/whatsapp";
import { sendPaidInvoiceEmailIfNeeded } from "@/lib/billingEmail";
import { sendServiceOtpWhatsApp, sendFeedbackRequestWhatsApp } from "@/lib/serviceWhatsapp";
import {
  applyRescheduleServicesAndPricing,
  buildServicesPayloadFromLineItems,
  sendRescheduleWhatsAppNotifications,
} from "@/lib/appointmentReschedule";
import { ensureServiceVisitForAppointment } from "@/lib/appointmentFeedbackVisit";
import jwt from "jsonwebtoken";

const SERVICE_OTP_TTL_MINUTES = 5;

function generateServiceOtpCode() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

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
    const {
      status,
      date,
      time,
      notes,
      cashPaidDelta,
      action,
      refundNote,
      employee: employeeFromBody,
      trackingAction,
    } = body;

    // Do not populate before save — saving a populated doc can cause cast/validation errors.
    const appointment = await Appointment.findById(id).select("+serviceOtpCode +serviceOtpAttempts");
    if (!appointment) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    /** Employee / admin: record when in-home or in-salon service actually started / ended */
    if (
      trackingAction === "send_service_otp" ||
      trackingAction === "verify_service_otp" ||
      trackingAction === "start_service" ||
      trackingAction === "end_service"
    ) {
      if (auth.role !== "admin" && auth.role !== "employee") {
        return NextResponse.json({ message: "Not allowed" }, { status: 403 });
      }
      if (auth.role === "employee") {
        const empId = appointment.employee?.toString?.();
        if (empId !== auth.id?.toString?.()) {
          return NextResponse.json({ message: "Not allowed" }, { status: 403 });
        }
      }
      if (!["confirmed", "completed"].includes(appointment.status)) {
        return NextResponse.json(
          { message: "Service tracking is only for confirmed or completed appointments" },
          { status: 400 }
        );
      }
      if (trackingAction === "send_service_otp") {
        if (appointment.serviceStartedAt) {
          return NextResponse.json({ message: "Service already started" }, { status: 400 });
        }
        const customer = await Customer.findById(appointment.customer);
        if (!customer?.phone) {
          return NextResponse.json(
            { message: "Customer phone not found for OTP verification" },
            { status: 400 }
          );
        }
        const code = generateServiceOtpCode();
        appointment.serviceOtpCode = code;
        appointment.serviceOtpSentAt = new Date();
        appointment.serviceOtpExpiresAt = new Date(Date.now() + SERVICE_OTP_TTL_MINUTES * 60 * 1000);
        appointment.serviceOtpVerifiedAt = undefined;
        appointment.serviceOtpAttempts = 0;
        await saveAppointmentDoc(appointment);
        const whatsapp = await sendServiceOtpWhatsApp(customer.phone, code);
        return NextResponse.json({
          success: true,
          message: whatsapp?.success
            ? "OTP sent to customer on WhatsApp"
            : whatsapp?.message || "OTP generated but WhatsApp failed",
          otpExpiresAt: appointment.serviceOtpExpiresAt,
          whatsapp,
        });
      }

      if (trackingAction === "verify_service_otp") {
        if (appointment.serviceStartedAt) {
          return NextResponse.json({ message: "Service already started" }, { status: 400 });
        }
        const otpCode = String(body?.trackingOtpCode || "").trim();
        if (!otpCode) {
          return NextResponse.json({ message: "OTP is required" }, { status: 400 });
        }
        if (!appointment.serviceOtpCode || !appointment.serviceOtpExpiresAt) {
          return NextResponse.json(
            { message: "No active OTP. Please send OTP first." },
            { status: 400 }
          );
        }
        if (appointment.serviceOtpExpiresAt.getTime() < Date.now()) {
          appointment.serviceOtpCode = undefined;
          appointment.serviceOtpExpiresAt = undefined;
          await saveAppointmentDoc(appointment);
          return NextResponse.json({ message: "OTP expired. Please resend OTP." }, { status: 400 });
        }
        if (otpCode !== String(appointment.serviceOtpCode)) {
          appointment.serviceOtpAttempts = Number(appointment.serviceOtpAttempts || 0) + 1;
          await saveAppointmentDoc(appointment);
          return NextResponse.json({ message: "Invalid OTP" }, { status: 400 });
        }
        appointment.serviceOtpVerifiedAt = new Date();
        appointment.serviceOtpCode = undefined;
        appointment.serviceOtpExpiresAt = undefined;
        appointment.serviceOtpAttempts = 0;
        await saveAppointmentDoc(appointment);
        return NextResponse.json({ success: true, message: "Customer OTP verified" });
      }

      if (trackingAction === "start_service") {
        if (!appointment.serviceOtpVerifiedAt) {
          return NextResponse.json(
            { message: "Verify customer OTP before starting service" },
            { status: 400 }
          );
        }
        if (!appointment.serviceStartedAt) {
          appointment.serviceStartedAt = new Date();
        }
      } else {
        if (!appointment.serviceStartedAt) {
          return NextResponse.json({ message: "Start service before recording end time" }, { status: 400 });
        }
        appointment.serviceEndedAt = new Date();
        await saveAppointmentDoc(appointment);

        let feedbackWhatsapp = { success: false, message: "Skipped" };
        const customer = await Customer.findById(appointment.customer);
        if (customer?.phone) {
          const visit = await ensureServiceVisitForAppointment(appointment);
          if (visit) {
            feedbackWhatsapp = await sendFeedbackRequestWhatsApp(
              customer.phone,
              String(visit._id)
            );
            if (feedbackWhatsapp.success) {
              visit.feedbackSentAt = new Date();
              await visit.save();
            }
          } else {
            feedbackWhatsapp = {
              success: false,
              message: "Could not create service visit for feedback",
            };
          }
        } else {
          feedbackWhatsapp = { success: false, message: "Customer phone not found" };
        }

        const tracked = await Appointment.findById(id)
          .populate("customer")
          .populate("salon")
          .populate("employee")
          .populate("service");
        const payload = tracked.toObject ? tracked.toObject() : tracked;
        return NextResponse.json({ ...payload, feedbackWhatsapp });
      }
      await saveAppointmentDoc(appointment);
      const tracked = await Appointment.findById(id)
        .populate("customer")
        .populate("salon")
        .populate("employee")
        .populate("service");
      return NextResponse.json(tracked);
    }

    /** Admin: reschedule date, time, services; notify customer + employee on WhatsApp */
    if (action === "reschedule") {
      if (auth.role !== "admin") {
        return NextResponse.json({ message: "Not allowed" }, { status: 403 });
      }
      if (["cancelled", "completed"].includes(appointment.status)) {
        return NextResponse.json(
          { message: "Cannot reschedule cancelled or completed appointments" },
          { status: 400 }
        );
      }

      const rescheduleDate = body.date;
      const rescheduleTime = body.time;
      const servicesLineItems = body.services;
      const notifyUser = body.notifyUser !== false;
      const notifyEmployee = body.notifyEmployee !== false;

      if (!rescheduleDate || !rescheduleTime) {
        return NextResponse.json({ message: "Date and time are required" }, { status: 400 });
      }

      const dateD = new Date(rescheduleDate);
      if (Number.isNaN(dateD.getTime())) {
        return NextResponse.json({ message: "Invalid date" }, { status: 400 });
      }

      const timeNorm = String(rescheduleTime).trim();
      if (!/^\d{1,2}:\d{2}$/.test(timeNorm)) {
        return NextResponse.json({ message: "Invalid time (use HH:MM)" }, { status: 400 });
      }

      const servicesPayload = await buildServicesPayloadFromLineItems(servicesLineItems);
      applyRescheduleServicesAndPricing(appointment, servicesPayload);

      appointment.date = dateD;
      appointment.time = timeNorm;

      if (employeeFromBody) {
        if (!mongoose.Types.ObjectId.isValid(employeeFromBody)) {
          return NextResponse.json({ message: "Invalid employee id" }, { status: 400 });
        }
        appointment.employee = employeeFromBody;
      }

      if (notes !== undefined) {
        appointment.notes = notes;
      }

      const empId = appointment.employee?.toString?.();
      if (empId) {
        const conflict = await Appointment.findOne({
          _id: { $ne: appointment._id },
          employee: empId,
          date: dateD,
          time: timeNorm,
          $or: [{ status: "confirmed" }, { status: "pending" }],
        });
        if (conflict) {
          return NextResponse.json(
            { message: "Selected employee is already booked at this date and time" },
            { status: 400 }
          );
        }
      }

      recomputePayment(appointment);
      await saveAppointmentDoc(appointment);

      const updated = await Appointment.findById(id)
        .populate("customer")
        .populate("salon")
        .populate("employee")
        .populate("service");

      let rescheduleWhatsapp = null;
      if (notifyUser || notifyEmployee) {
        rescheduleWhatsapp = await sendRescheduleWhatsAppNotifications(updated);
      }

      const payload = updated.toObject ? updated.toObject() : updated;
      return NextResponse.json({ ...payload, rescheduleWhatsapp });
    }

    const wasConfirmed = appointment.status === "confirmed";

    if (auth.role === "admin" && employeeFromBody) {
      if (!mongoose.Types.ObjectId.isValid(employeeFromBody)) {
        return NextResponse.json({ message: "Invalid employee id" }, { status: 400 });
      }
      appointment.employee = employeeFromBody;
    }
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

    if (auth.role === "admin" && status === "confirmed" && !wasConfirmed) {
      if (!appointment.employee) {
        return NextResponse.json(
          { message: "Please select an employee before confirming this appointment." },
          { status: 400 }
        );
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

    sendPaidInvoiceEmailIfNeeded(String(id)).catch((err) => console.error("Billing invoice email:", err));

    const updated = await Appointment.findById(id)
      .populate("customer")
      .populate("salon")
      .populate("employee")
      .populate("service");

    // When admin first confirms: send WhatsApp template to user (e.g. "Your Booking is Confirmed!")
    const userTemplateName = process.env.INTERAKT_TEMPLATE_BOOKING_CONFIRMED || "transactional_booking_confirmation";
    if (status === "confirmed" && !wasConfirmed && updated.employee && updated.customer?.phone) {
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
      // Optional: Interakt template with dynamic URL on button index N — suffix only (e.g. "e" → https://domain/e).
      const btnIdxRaw = process.env.INTERAKT_EMPLOYEE_ASSIGN_URL_BUTTON_INDEX;
      const btnPath = (process.env.INTERAKT_EMPLOYEE_ASSIGN_URL_PATH || "e").replace(/^\//, "");
      const templateExtra =
        btnIdxRaw !== undefined && String(btnIdxRaw).trim() !== ""
          ? { buttonValues: { [String(btnIdxRaw).trim()]: [btnPath] } }
          : {};
      sendWhatsAppTemplate(
        updated.employee.phone,
        employeeTemplate,
        [clientLabel, dateStr, timeStr],
        templateExtra
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




