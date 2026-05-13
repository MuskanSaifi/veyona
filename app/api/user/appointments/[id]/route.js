import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Appointment from "@/models/Appointment";
import { saveAppointmentDoc } from "@/lib/saveAppointmentDoc";
import User from "@/models/User";
import jwt from "jsonwebtoken";
import { sendWhatsAppTemplate } from "@/lib/whatsapp";
import { getCustomerIdsForUser } from "@/lib/customerLookup";

export async function PUT(req, { params }) {
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

    const user = await User.findById(decoded.id);
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const customerIdsRaw = await getCustomerIdsForUser(user);
    if (!customerIdsRaw.length) {
      return NextResponse.json({ message: "Customer not found" }, { status: 404 });
    }
    const customerIds = customerIdsRaw.map((c) => c.toString());

    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const { action } = body || {};

    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return NextResponse.json({ message: "Appointment not found" }, { status: 404 });
    }

    // Only allow user to modify their own appointment
    if (!customerIds.includes(appointment.customer?.toString())) {
      return NextResponse.json({ message: "Not allowed" }, { status: 403 });
    }

    // Do not allow modifications for past appointments
    const appointmentDateTime = new Date(appointment.date);
    if (appointment.time) {
      const [h = 0, m = 0] = String(appointment.time).split(":").map(Number);
      appointmentDateTime.setHours(h, m, 0, 0);
    }
    const now = new Date();
    if (appointmentDateTime.getTime() <= now.getTime()) {
      return NextResponse.json(
        { message: "Past appointments cannot be changed" },
        { status: 400 }
      );
    }

    if (action === "cancel") {
      if (appointment.status === "cancelled") {
        return NextResponse.json({ message: "Already cancelled" }, { status: 200 });
      }

      // User can cancel only within 2 hours of booking creation time
      const createdAt = appointment.createdAt ? new Date(appointment.createdAt) : null;
      if (createdAt) {
        const cancelWindowMs = 2 * 60 * 60 * 1000; // 2 hours
        const deadline = createdAt.getTime() + cancelWindowMs;
        if (Date.now() > deadline) {
          // Notify admin that user attempted a late cancel
          const adminPhone = process.env.ADMIN_WHATSAPP_PHONE || process.env.ADMIN_PHONE;
          const adminTemplate =
            process.env.INTERAKT_TEMPLATE_ADMIN_LATE_CANCEL_ATTEMPT ||
            "transactional_admin_late_cancel_attempt";
          if (adminPhone) {
            const bookingId = appointment._id.toString().slice(-6).toUpperCase();
            const customerName = user?.name || "Customer";
            const customerPhone = customers?.[0]?.phone || user?.phone || "";
            const mins = Math.max(0, Math.floor((Date.now() - createdAt.getTime()) / (60 * 1000)));
            sendWhatsAppTemplate(adminPhone, adminTemplate, [
              bookingId,
              customerName,
              customerPhone ? String(customerPhone) : "N/A",
              `${mins} min`,
            ]).catch((err) =>
              console.error("WhatsApp admin late-cancel attempt failed:", err)
            );
          }

          return NextResponse.json(
            {
              message:
                "Booking ke 2 ghante baad aap cancel nahi kar sakte. Please contact support.",
            },
            { status: 403 }
          );
        }
      }

      const paidOnline = Number(appointment.payment?.paidOnline || 0);
      const nowTime = new Date();
      const refundRequired = paidOnline > 0;
      const refundDueAt = refundRequired
        ? new Date(nowTime.getTime() + 24 * 60 * 60 * 1000)
        : null;

      appointment.status = "cancelled";
      appointment.cancellation = {
        cancelledBy: "user",
        cancelledAt: nowTime,
      };
      appointment.refund = {
        ...(appointment.refund || {}),
        required: refundRequired,
        status: refundRequired ? "pending" : "not_required",
        dueAt: refundDueAt || undefined,
        processedAt: undefined,
        processedByRole: undefined,
        processedById: undefined,
      };
      await saveAppointmentDoc(appointment);

      const adminPhone = process.env.ADMIN_WHATSAPP_PHONE || process.env.ADMIN_PHONE;
      const adminTemplate =
        process.env.INTERAKT_TEMPLATE_ADMIN_REFUND_PENDING ||
        "transactional_admin_refund_pending";
      if (adminPhone) {
        const bookingId = appointment._id.toString().slice(-6).toUpperCase();
        const customerName = user?.name || "Customer";
        const refundLabel = refundRequired ? "Refund required" : "No refund required";
        sendWhatsAppTemplate(adminPhone, adminTemplate, [bookingId, customerName, refundLabel]).catch(
          (err) => console.error("WhatsApp admin cancellation alert failed:", err)
        );
      }

      if (customer?.phone || user?.phone) {
        const userTemplate =
          process.env.INTERAKT_TEMPLATE_USER_CANCELLATION_REFUND ||
          "transactional_user_cancellation_refund";
        const dueText = refundRequired
          ? "Refund will be processed within 24 hours."
          : "No online refund is required for this booking.";
        sendWhatsAppTemplate(customer?.phone || user?.phone, userTemplate, [dueText]).catch((err) =>
          console.error("WhatsApp user cancellation alert failed:", err)
        );
      }

      return NextResponse.json({
        success: true,
        status: "cancelled",
        refund: {
          required: refundRequired,
          status: refundRequired ? "pending" : "not_required",
          dueAt: refundDueAt,
        },
      });
    }

    return NextResponse.json({ message: "Unsupported action" }, { status: 400 });
  } catch (error) {
    console.error("User appointment update error:", error);
    return NextResponse.json(
      { message: error.message || "Failed to update appointment" },
      { status: 500 }
    );
  }
}

