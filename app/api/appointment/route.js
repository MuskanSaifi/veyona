import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Appointment from "@/models/Appointment";
import Customer from "@/models/Customer";
import Service from "@/models/Service";
import User from "@/models/User";
import Coupon from "@/models/Coupon";
import jwt from "jsonwebtoken";
import { sendWhatsAppTemplate } from "@/lib/whatsapp";
import { escapeRegex } from "@/lib/customerLookup";
import { computeOrderTotals } from "@/lib/cartPricing";
import { resolveSalonForBooking } from "@/lib/bookingSalon";

function getEffectiveExpiry(coupon) {
  if (!coupon) return null;
  if (coupon.expiresAt) return new Date(coupon.expiresAt).getTime();
  const days = Number(coupon.validForDays) || 0;
  const hours = Number(coupon.validForHours) || 0;
  if (days === 0 && hours === 0) return null;
  const createdAt = coupon.createdAt ? new Date(coupon.createdAt).getTime() : Date.now();
  return createdAt + days * 24 * 60 * 60 * 1000 + hours * 60 * 60 * 1000;
}

function computeDiscount({ coupon, subtotal }) {
  if (!coupon) return { discountAmount: 0, reason: "Invalid coupon" };
  if (!coupon.active) return { discountAmount: 0, reason: "Coupon inactive" };
  const expiryTime = getEffectiveExpiry(coupon);
  if (expiryTime != null && expiryTime < Date.now()) {
    return { discountAmount: 0, reason: "Coupon expired" };
  }
  if (
    coupon.usageLimit != null &&
    coupon.usageLimit > 0 &&
    (coupon.usedCount || 0) >= coupon.usageLimit
  ) {
    return { discountAmount: 0, reason: "Coupon usage limit reached" };
  }
  const minOrderAmount = coupon.minOrderAmount || 0;
  if (subtotal < minOrderAmount) {
    return { discountAmount: 0, reason: `Minimum order amount is ₹${minOrderAmount}` };
  }

  let discountAmount = 0;
  if (coupon.type === "percent") {
    discountAmount = Math.round((subtotal * (coupon.value || 0)) / 100);
    if (coupon.maxDiscount != null && coupon.maxDiscount >= 0) {
      discountAmount = Math.min(discountAmount, coupon.maxDiscount);
    }
  } else if (coupon.type === "fixed") {
    discountAmount = Math.round(coupon.value || 0);
  }
  discountAmount = Math.max(0, Math.min(discountAmount, subtotal));
  return { discountAmount, reason: discountAmount > 0 ? null : "No discount applied" };
}

export async function GET(req) {
  await connectDB();
  const { searchParams } = new URL(req.url);
  const salonId = searchParams.get("salonId");
  const employeeId = searchParams.get("employeeId");
  const status = searchParams.get("status");
  const couponCode = searchParams.get("couponCode");

  const query = {};
  if (salonId) query.salon = salonId;
  if (employeeId) query.employee = employeeId;
  if (status) query.status = status;
  if (couponCode) query["pricing.couponCode"] = couponCode.trim().toUpperCase();

  const appointments = await Appointment.find(query)
    .populate("customer")
    .populate("salon")
    .populate("employee")
    .populate("service")
    .populate({
      path: "services.service",
      select: "name image duration price isVideoConsultation category clinic clinicAddress",
      populate: [{ path: "clinic", select: "name address city state pincode" }],
    })
    .sort({ date: 1, time: 1 });

  return NextResponse.json(appointments);
}

export async function POST(req) {
  await connectDB();

  try {
    const body = await req.json();
    const {
      customerName,
      customerEmail,
      customerPhone,
      salon,
      employee,
      service, // primary service (backward compatible)
      services: servicesFromBody, // optional array of service IDs/objects for multi-service
      date,
      time,
      notes,
      location,
      couponCode,
      paymentPlan, // "full" | "half" | "book_now_pay_later"
      quantity: quantityFromBody,
    } = body;

    const qtyRaw = Number(quantityFromBody);
    const qty = Number.isFinite(qtyRaw) ? Math.floor(qtyRaw) : 1;
    const legacyQuantity = Math.max(1, Math.min(20, qty));

    // If services[] is provided with per-service quantities, use those; else fall back to legacyQuantity.
    const quantitiesByServiceId = {};
    if (Array.isArray(servicesFromBody) && servicesFromBody.length > 0) {
      for (const item of servicesFromBody) {
        if (!item || typeof item === "string") continue;
        const id = item.service || item._id;
        if (!id) continue;
        const qRaw = Number(item.quantity);
        const q = Number.isFinite(qRaw) ? Math.floor(qRaw) : 1;
        quantitiesByServiceId[id.toString()] = Math.max(1, Math.min(20, q));
      }
    }

    // Normalize list of service IDs: services[] (preferred) or single service
    let serviceIds = [];
    if (Array.isArray(servicesFromBody) && servicesFromBody.length > 0) {
      serviceIds = servicesFromBody.map((s) =>
        typeof s === "string" ? s : s?.service || s?._id
      ).filter(Boolean);
    } else if (service) {
      serviceIds = [service];
    }

    if (
      !customerName ||
      !customerEmail ||
      !customerPhone ||
      serviceIds.length === 0 ||
      !date ||
      !time
    ) {
      return NextResponse.json(
        { message: "All fields are required" },
        { status: 400 }
      );
    }

    const resolvedSalon = await resolveSalonForBooking({
      salon: salon || null,
      employeeId: employee || null,
      serviceIds,
    });
    if (!resolvedSalon) {
      return NextResponse.json(
        {
          message:
            "No salon is configured for this service. Please add an active salon in admin or link employees to a salon.",
        },
        { status: 400 }
      );
    }

    const getQtyForService = (id) => quantitiesByServiceId?.[id?.toString?.()] || legacyQuantity;

    // Load service docs for validation and totals
    const serviceDocs = await Service.find({ _id: { $in: serviceIds } })
      .select("isVideoConsultation duration price name")
      .lean();

    if (serviceDocs.length === 0) {
      return NextResponse.json(
        { message: "Selected services not found" },
        { status: 400 }
      );
    }

    // For now, do not allow mixing video consultation with other services
    const anyVideo = serviceDocs.some((s) => s.isVideoConsultation);
    if (anyVideo && serviceDocs.length > 1) {
      const vcNames = serviceDocs
        .filter((s) => s.isVideoConsultation)
        .map((s) => s.name)
        .filter(Boolean);
      const otherNames = serviceDocs
        .filter((s) => !s.isVideoConsultation)
        .map((s) => s.name)
        .filter(Boolean);
      const suffix =
        vcNames.length || otherNames.length
          ? ` Video: ${vcNames.join(", ") || "—"}. Other: ${otherNames.join(", ") || "—"}.`
          : "";
      return NextResponse.json(
        {
          message: `Video consultation cannot be booked together with other services.${suffix} Remove one group and book again.`,
        },
        { status: 400 }
      );
    }

    const isVideoConsultation = serviceDocs[0]?.isVideoConsultation;

    // For in-person (non-VC) services, location is required
    if (!isVideoConsultation && (!location || !location.trim())) {
      return NextResponse.json(
        { message: "Please provide your location for in-person appointment" },
        { status: 400 }
      );
    }

    // Check if user is logged in
    const token = req.cookies.get("userToken")?.value;
    let user = null;
    
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.role === "user") {
          user = await User.findById(decoded.id);
          // If user is logged in, use their phone number
          if (user && user.phone !== customerPhone) {
            // Update user phone if different
            user.phone = customerPhone;
            await user.save();
          }
        }
      } catch (err) {
        // Invalid token, continue as guest
      }
    }

    // Find or create customer: require phone + email together when email is present
    // so another profile with the same phone does not inherit unrelated history.
    const emailTrim = (customerEmail || "").trim() || (user?.email || "").trim();
    let customer = null;
    if (emailTrim) {
      customer = await Customer.findOne({
        phone: customerPhone,
        email: new RegExp(`^${escapeRegex(emailTrim)}$`, "i"),
      });
    } else {
      customer = await Customer.findOne({ phone: customerPhone });
    }

    if (!customer) {
      customer = await Customer.create({
        name: customerName,
        email: customerEmail,
        phone: customerPhone,
      });
    } else {
      await Customer.findByIdAndUpdate(customer._id, {
        name: customerName,
        phone: customerPhone,
        email: customerEmail,
      });
    }

    // If user is logged in, update user info and save address for reuse
    if (user) {
      user.name = customerName;
      if (customerEmail) user.email = customerEmail;
      if (location && typeof location === "string" && location.trim()) {
        const addr = location.trim();
        // Always keep last used address on the root field as well
        user.address = addr;
        const list = Array.isArray(user.savedAddresses) ? user.savedAddresses : [];
        const migrated = list.length ? list : (user.address ? [{ label: "Home", address: user.address }] : []);
        const exists = migrated.some((a) => (a.address || "").trim() === addr);
        if (!exists) {
          migrated.push({ label: migrated.length ? `Address ${migrated.length + 1}` : "Home", address: addr });
          user.savedAddresses = migrated;
        }
        const idx = migrated.findIndex((a) => (a.address || "").trim() === addr);
        user.defaultAddressIndex = idx >= 0 ? idx : migrated.length - 1;
      }
      await user.save();
    }

    // Check for existing appointment at same time (per employee if assigned; else per customer + salon)
    const dateD = new Date(date);
    const conflictQuery = employee
      ? {
          employee,
          date: dateD,
          time,
          $or: [{ status: "confirmed" }, { status: "pending" }],
        }
      : {
          customer: customer._id,
          salon: resolvedSalon,
          date: dateD,
          time,
          $or: [{ status: "confirmed" }, { status: "pending" }],
        };
    const existing = await Appointment.findOne(conflictQuery);

    if (existing) {
      return NextResponse.json(
        { message: "Time slot already booked" },
        { status: 400 }
      );
    }

    // Build multi-service payload
    const servicesPayload = serviceDocs.map((s) => ({
      service: s._id,
      name: s.name,
      duration: s.duration || 30,
      price: s.price ?? undefined,
      quantity: getQtyForService(s._id),
    }));
    const totalDuration = servicesPayload.reduce(
      (sum, s) => sum + (s.duration || 0) * (s.quantity || 1),
      0
    );
    const totalPrice = servicesPayload.reduce(
      (sum, s) => sum + (s.price || 0) * (s.quantity || 1),
      0
    );

    const primaryServiceId = serviceIds[0];

    // Coupon / pricing
    const subtotal = totalPrice || 0;
    let appliedCouponCode = (couponCode || "").toString().trim().toUpperCase();
    let discountAmount = 0;
    if (appliedCouponCode) {
      const coupon = await Coupon.findOne({ code: appliedCouponCode }).lean();
      if (!coupon) {
        return NextResponse.json({ message: "Invalid coupon code" }, { status: 400 });
      }
      const computed = computeDiscount({ coupon, subtotal });
      if (computed.discountAmount <= 0) {
        return NextResponse.json({ message: computed.reason || "Coupon not applicable" }, { status: 400 });
      }
      discountAmount = computed.discountAmount;
    }
    const orderTotals = computeOrderTotals({ subtotal, discountAmount });
    const { serviceCharge, totalPayable } = orderTotals;

    const plan =
      paymentPlan === "book_now_pay_later"
        ? "book_now_pay_later"
        : paymentPlan === "pay_at_salon"
        ? "pay_at_salon"
        : paymentPlan === "full"
        ? "full"
        : "half";
    const onlineDue =
      plan === "book_now_pay_later" || plan === "pay_at_salon"
        ? 0
        : plan === "full"
        ? totalPayable
        : Math.ceil(totalPayable / 2);
    const cashDue = Math.max(0, totalPayable - onlineDue);

    if (appliedCouponCode && discountAmount > 0) {
      await Coupon.findOneAndUpdate(
        { code: appliedCouponCode },
        { $inc: { usedCount: 1 } }
      );
    }

    const appointment = await Appointment.create({
      customer: customer._id,
      salon: resolvedSalon,
      ...(employee ? { employee } : {}),
      service: primaryServiceId,
      services: servicesPayload,
      quantity: legacyQuantity,
      totalDuration: totalDuration || undefined,
      totalPrice: totalPrice || undefined,
      pricing: {
        subtotal: subtotal || undefined,
        serviceCharge: serviceCharge || 0,
        discountAmount: discountAmount || 0,
        couponCode: appliedCouponCode || undefined,
        totalPayable: totalPayable || undefined,
      },
      payment: {
        plan,
        onlineDue: onlineDue || 0,
        cashDue: cashDue || 0,
        paidOnline: 0,
        paidCash: 0,
        status: "unpaid",
      },
      date: new Date(date),
      time,
      notes,
      location: location || undefined,
      status: "pending",
    });

    const populated = await Appointment.findById(appointment._id)
      .populate("customer")
      .populate("salon")
      .populate("employee")
      .populate("service");

    const servicesArray = Array.isArray(populated.services) && populated.services.length > 0
      ? populated.services
      : (populated.service ? [{ name: populated.service.name }] : []);
    const servicesText = servicesArray
      .map((s) => s?.name)
      .filter(Boolean)
      .join(", ");

    // Notify user instantly that booking request is received
    // Template placeholders expected: {{1}} = customer name, {{2}} = service names
    // NOTE: Interakt expects the exact template name from the dashboard. The
    // correct default for this app is `transactional_booking_received_xp`.
    const userTemplate =
      process.env.INTERAKT_TEMPLATE_BOOKING_RECEIVED || "transactional_booking_received_xp";
    if (populated.customer?.phone) {
      const customerLabel = customerName || populated.customer?.name || "Customer";
      const serviceLabel = servicesText || populated.service?.name || "your selected service";
      sendWhatsAppTemplate(populated.customer.phone, userTemplate, [customerLabel, serviceLabel]).catch((err) =>
        console.error("WhatsApp booking received failed:", err)
      );
    }

    // Notify admin on WhatsApp about new appointment (transactional_admin_new_appointment)
    const adminPhone = process.env.ADMIN_WHATSAPP_PHONE || process.env.ADMIN_PHONE;
    const adminTemplate = process.env.INTERAKT_TEMPLATE_ADMIN_NEW_APPOINTMENT || "transactional_admin_new_appointment";
    if (adminPhone) {
      const bookingId = appointment._id.toString().slice(-6).toUpperCase();
      const customerBase = customerName || populated.customer?.name || "Customer";
      const customerLabel = servicesText ? `${customerBase} – ${servicesText}` : customerBase;
      sendWhatsAppTemplate(adminPhone, adminTemplate, [bookingId, customerLabel]).catch((err) =>
        console.error("WhatsApp admin new appointment failed:", err)
      );
    }

    return NextResponse.json(populated);
  } catch (error) {
    return NextResponse.json(
      { message: error.message },
      { status: 500 }
    );
  }
}




