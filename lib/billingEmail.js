import nodemailer from "nodemailer";
import connectDB from "@/lib/db";
import Appointment from "@/models/Appointment";
import { buildInvoicePdfBuffer } from "@/lib/buildInvoicePdf";
import { ensureAppointmentInvoiceNumber } from "@/lib/invoiceNumber";

export function isBillingEmailConfigured() {
  return Boolean(
    process.env.SMTP_HOST &&
      String(process.env.SMTP_HOST).trim() &&
      process.env.SMTP_USER &&
      String(process.env.SMTP_USER).trim() &&
      process.env.SMTP_PASS &&
      String(process.env.SMTP_PASS).trim()
  );
}

function createTransport() {
  const rawPort = Number(process.env.SMTP_PORT || 587);
  const port = Number.isFinite(rawPort) && rawPort > 0 ? rawPort : 587;
  const user = String(process.env.SMTP_USER || "").trim();
  /** Zoho shows app passwords with spaces — strip them; never commit real secrets. */
  const pass = String(process.env.SMTP_PASS || "")
    .trim()
    .replace(/\s+/g, "");

  /**
   * Port / TLS must match or Node throws "wrong version number" (e.g. implicit TLS on 587).
   * - 465: SSL from first byte → secure: true
   * - 587: plain then STARTTLS → secure: false (works from localhost same as production)
   */
  let secure;
  let requireTLS;
  if (port === 465) {
    secure = true;
    requireTLS = false;
  } else if (port === 587) {
    secure = false;
    requireTLS = false;
  } else {
    secure = String(process.env.SMTP_SECURE || "").toLowerCase() === "true";
    requireTLS = !secure;
  }

  return nodemailer.createTransport({
    host: String(process.env.SMTP_HOST || "").trim(),
    port,
    secure,
    requireTLS,
    auth: { user, pass },
    tls: { minVersion: "TLSv1.2" },
    connectionTimeout: 20_000,
  });
}

/**
 * After full payment, email customer PDF invoice once (uses billingEmailSentAt).
 * From address defaults to info@veyona.in — set BILLING_EMAIL_FROM to override.
 */
export async function sendPaidInvoiceEmailIfNeeded(appointmentId) {
  if (!isBillingEmailConfigured()) {
    return { skipped: true, reason: "smtp_not_configured" };
  }

  await connectDB();

  const apt = await Appointment.findById(appointmentId)
    .populate("customer")
    .populate("salon")
    .populate("service")
    .lean();

  if (!apt) return { skipped: true, reason: "not_found" };
  if (apt.billingEmailSentAt) return { skipped: true, reason: "already_sent" };

  const to = String(apt.customer?.email || "").trim();
  if (!to) return { skipped: true, reason: "no_customer_email" };

  const subtotal = Number(apt.pricing?.subtotal ?? apt.totalPrice ?? apt.service?.price ?? 0);
  const discount = Number(apt.pricing?.discountAmount ?? 0);
  const totalPayable = Math.max(0, Number(apt.pricing?.totalPayable ?? subtotal - discount));
  const paidOnline = Number(apt.payment?.paidOnline ?? 0);
  const paidCash = Number(apt.payment?.paidCash ?? 0);
  const paid = paidOnline + paidCash;
  if (paid < totalPayable) {
    return { skipped: true, reason: "not_fully_paid" };
  }

  const invoiceNo = await ensureAppointmentInvoiceNumber(appointmentId, new Date());
  const billTo = {
    name: apt.customer?.name || "Customer",
    phone: apt.customer?.phone || "",
    email: to,
  };

  const pdfBuffer = await buildInvoicePdfBuffer({ ...apt, invoiceNumber: invoiceNo }, billTo);

  const from = (process.env.BILLING_EMAIL_FROM || "info@veyona.in").trim();
  const bookingDate = new Date(apt.date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const transporter = createTransport();
  try {
    await transporter.sendMail({
    from: `Veyona <${from}>`,
    to,
    subject: `Your Veyona invoice ${invoiceNo}`,
    html: `
      <p>Hi ${escapeHtml(billTo.name)},</p>
      <p>Thank you for choosing Veyona. Your booking on <strong>${escapeHtml(bookingDate)}</strong> is fully paid.</p>
      <p>Your invoice <strong>${escapeHtml(invoiceNo)}</strong> is attached as a PDF.</p>
      <p style="color:#64748b;font-size:13px;">Questions? Reply to this email or write to info@veyona.in</p>
    `,
    attachments: [
      {
        filename: `invoice-${invoiceNo}.pdf`,
        content: pdfBuffer,
        contentType: "application/pdf",
      },
    ],
  });

  await Appointment.findByIdAndUpdate(appointmentId, { billingEmailSentAt: new Date() });
  return { sent: true };
  } catch (err) {
    const code = err?.code || err?.responseCode;
    if (code === "EAUTH" || err?.responseCode === 535) {
      console.error(
        "Billing email SMTP auth failed (535). Zoho: use the mailbox login email as SMTP_USER, correct password or an App Password if 2FA is on, and ensure SMTP access is enabled for that account. Try port 465 with SMTP_SECURE=true if 587 keeps failing."
      );
    }
    throw err;
  }
}

function escapeHtml(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
