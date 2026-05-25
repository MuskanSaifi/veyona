import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Employee from "@/models/Employee";
import Customer from "@/models/Customer";
import ServiceVisit from "@/models/ServiceVisit";
import Otp from "@/models/Otp";
import { requireEmployee } from "@/lib/serviceTrackingAuth";
import { sendServiceOtpWhatsApp } from "@/lib/serviceWhatsapp";

const OTP_TTL_MINUTES = 5;

function generateOtpCode() {
  // 4-digit numeric, padded so codes like "0421" are preserved as strings.
  return String(Math.floor(1000 + Math.random() * 9000));
}

function normalizePhone(input) {
  return String(input || "").replace(/\D/g, "").slice(-10);
}

/**
 * POST /api/service-tracking/start-service
 *
 * Body (one of):
 *   { customerId, serviceLabel? }
 *   { customer: { name, phone, email?, address? }, serviceLabel? }
 *
 * Creates a ServiceVisit in `pending` state, generates a 4-digit OTP
 * (valid for 5 minutes) and sends it to the customer via WhatsApp.
 * Returns the serviceVisitId and the OTP expiry timestamp.
 */
export async function POST(req) {
  await connectDB();

  const auth = requireEmployee(req);
  if (auth.response) return auth.response;
  const employeeId = auth.employeeId;

  const employee = await Employee.findById(employeeId);
  if (!employee) {
    return NextResponse.json({ message: "Employee not found" }, { status: 404 });
  }
  if (employee.active === false) {
    return NextResponse.json({ message: "Employee account is inactive" }, { status: 403 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON body" }, { status: 400 });
  }

  const { customerId, customer: customerInput, serviceLabel } = body || {};

  // Resolve / create the customer
  let customer = null;
  if (customerId) {
    customer = await Customer.findById(customerId);
    if (!customer) {
      return NextResponse.json({ message: "Customer not found" }, { status: 404 });
    }
  } else if (customerInput && (customerInput.phone || customerInput.name)) {
    const phone = normalizePhone(customerInput.phone);
    if (!phone || phone.length !== 10) {
      return NextResponse.json(
        { message: "Valid 10-digit customer phone is required" },
        { status: 400 }
      );
    }
    if (!customerInput.name || !String(customerInput.name).trim()) {
      return NextResponse.json({ message: "Customer name is required" }, { status: 400 });
    }

    customer = await Customer.findOne({ phone });
    if (!customer) {
      customer = await Customer.create({
        name: String(customerInput.name).trim(),
        // Customer schema marks email as required; fall back to a placeholder
        // when the employee doesn't have one handy for the on-site visit.
        email: customerInput.email
          ? String(customerInput.email).trim()
          : `${phone}@no-email.local`,
        phone,
        address: customerInput.address || "",
      });
    }
  } else {
    return NextResponse.json(
      { message: "customerId or customer { name, phone } is required" },
      { status: 400 }
    );
  }

  // Prevent duplicate active visits for the same employee
  const activeForEmployee = await ServiceVisit.findOne({
    employee: employeeId,
    status: { $in: ["pending", "in_progress"] },
  });
  if (activeForEmployee) {
    return NextResponse.json(
      {
        message:
          "You already have an active service visit. Please end it before starting a new one.",
        activeServiceId: activeForEmployee._id,
      },
      { status: 409 }
    );
  }

  const visit = await ServiceVisit.create({
    employee: employeeId,
    customer: customer._id,
    serviceLabel: (serviceLabel || "").trim(),
    status: "pending",
  });

  // Generate + persist OTP
  const code = generateOtpCode();
  const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

  await Otp.create({
    serviceVisit: visit._id,
    code,
    expiresAt,
  });

  // Fire-and-await the WhatsApp send so we can surface configuration errors
  const wa = await sendServiceOtpWhatsApp(customer.phone, code);

  return NextResponse.json({
    success: true,
    serviceId: visit._id,
    status: visit.status,
    customer: {
      id: customer._id,
      name: customer.name,
      phone: customer.phone,
    },
    otpExpiresAt: expiresAt,
    whatsapp: wa,
  });
}
