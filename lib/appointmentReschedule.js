import Service from "@/models/Service";
import { computeOrderTotals } from "@/lib/cartPricing";
import { sendWhatsAppTemplate } from "@/lib/whatsapp";
import { getTemplateEnv } from "@/lib/whatsappEnv";
import { KRAYA_VARS, krayaVars } from "@/lib/krayaTemplateVars";

export function formatAppointmentDateIN(date) {
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatAppointmentTime12h(time24) {
  const raw = String(time24 || "").trim();
  const [hStr, mStr] = raw.split(":");
  const h = Number(hStr);
  const m = Number(mStr);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return raw;
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, "0")} ${period}`;
}

export function buildServicesLabel(appointment) {
  const items =
    Array.isArray(appointment?.services) && appointment.services.length > 0
      ? appointment.services
      : appointment?.service
        ? [{ name: appointment.service?.name || appointment.service, quantity: appointment.quantity || 1 }]
        : [];
  return items
    .map((s) => {
      const name = s?.name || "Service";
      const qty = Math.max(1, Number(s?.quantity) || 1);
      return qty > 1 ? `${name} x${qty}` : name;
    })
    .join(", ");
}

/**
 * @param {Array<{ serviceId: string, quantity?: number }>} lineItems
 */
export async function buildServicesPayloadFromLineItems(lineItems) {
  if (!Array.isArray(lineItems) || lineItems.length === 0) {
    throw new Error("At least one service is required");
  }

  const normalized = lineItems
    .map((row) => ({
      serviceId: String(row?.serviceId || row?.service || "").trim(),
      quantity: Math.max(1, Math.min(20, Math.floor(Number(row?.quantity) || 1))),
    }))
    .filter((row) => row.serviceId);

  if (!normalized.length) {
    throw new Error("Invalid service selection");
  }

  const ids = [...new Set(normalized.map((r) => r.serviceId))];
  const docs = await Service.find({ _id: { $in: ids }, active: true }).lean();
  const byId = new Map(docs.map((d) => [String(d._id), d]));

  const payload = [];
  for (const row of normalized) {
    const doc = byId.get(row.serviceId);
    if (!doc) {
      throw new Error("One or more selected services are invalid or inactive");
    }
    if (!doc.price || !doc.duration) {
      throw new Error(`"${doc.name}" is not bookable (missing price or duration)`);
    }
    payload.push({
      service: doc._id,
      name: doc.name,
      duration: doc.duration,
      price: doc.price,
      quantity: row.quantity,
    });
  }

  return payload;
}

export function applyRescheduleServicesAndPricing(appointment, servicesPayload) {
  const subtotal = servicesPayload.reduce(
    (sum, s) => sum + (Number(s.price) || 0) * (s.quantity || 1),
    0
  );
  const totalDuration = servicesPayload.reduce(
    (sum, s) => sum + (Number(s.duration) || 0) * (s.quantity || 1),
    0
  );

  const existingDiscount = Math.max(0, Number(appointment.pricing?.discountAmount) || 0);
  const cappedDiscount = Math.min(existingDiscount, subtotal);
  const orderTotals = computeOrderTotals({
    subtotal,
    discountAmount: cappedDiscount,
  });

  appointment.service = servicesPayload[0].service;
  appointment.services = servicesPayload;
  appointment.quantity = servicesPayload.reduce((sum, s) => sum + (s.quantity || 1), 0);
  appointment.totalDuration = totalDuration || undefined;
  appointment.totalPrice = subtotal || undefined;
  appointment.pricing = appointment.pricing || {};
  appointment.pricing.subtotal = orderTotals.subtotal;
  appointment.pricing.serviceCharge = orderTotals.serviceCharge;
  appointment.pricing.discountAmount = orderTotals.discountAmount;
  appointment.pricing.totalPayable = orderTotals.totalPayable;

  const totalPayable = orderTotals.totalPayable;
  const paidOnline = Number(appointment.payment?.paidOnline || 0);
  const paidCash = Number(appointment.payment?.paidCash || 0);
  const remaining = Math.max(0, totalPayable - paidOnline - paidCash);
  appointment.payment = appointment.payment || {};
  appointment.payment.cashDue = remaining;

  return orderTotals;
}

export async function sendRescheduleWhatsAppNotifications(appointment) {
  const userTemplate = getTemplateEnv(
    "USER_RESCHEDULE",
    "transactional_user_appointment_rescheduled"
  );
  const employeeTemplate = getTemplateEnv(
    "EMPLOYEE_RESCHEDULE",
    "transactional_employee_appointment_rescheduled"
  );

  const dateStr = formatAppointmentDateIN(appointment.date);
  const timeStr = formatAppointmentTime12h(appointment.time);
  const servicesLabel = buildServicesLabel(appointment);

  const results = { user: null, employee: null };

  if (appointment.customer?.phone) {
    results.user = await sendWhatsAppTemplate(
      appointment.customer.phone,
      userTemplate,
      krayaVars({
        [KRAYA_VARS.SERVICE]: servicesLabel,
        [KRAYA_VARS.APPOINTMENT_DATE]: timeStr
          ? `${dateStr} at ${timeStr}`
          : dateStr,
      })
    );
  }

  if (appointment.employee?.phone) {
    const clientName = appointment.customer?.name || "Customer";
    results.employee = await sendWhatsAppTemplate(
      appointment.employee.phone,
      employeeTemplate,
      krayaVars({
        [KRAYA_VARS.LEAD_NAME]: clientName,
        [KRAYA_VARS.SERVICE]: servicesLabel,
        [KRAYA_VARS.APPOINTMENT_DATE]: timeStr
          ? `${dateStr} at ${timeStr}`
          : dateStr,
      })
    );
  }

  return results;
}
