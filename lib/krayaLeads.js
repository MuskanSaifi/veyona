/**
 * Kraya Leads API — upsert contacts into Kraya CRM.
 *
 * Kraya has no public "send template by name" HTTP API.
 * WhatsApp templates are sent by assigning an Auto Follow-up `sequence`
 * on lead upsert (sequence must contain the approved Meta template).
 *
 * POST KRAYA_LEADS_URL with header X-KRAYA-API-KEY
 */

import { getKrayaApiKey } from "@/lib/whatsappEnv";

export function getKrayaLeadsUrl() {
  return (
    process.env.KRAYA_LEADS_URL?.trim() ||
    "https://api.kraya-ai.com/api/external/D2oxd9Cv/leads"
  );
}

/**
 * Upsert a lead in Kraya.
 * @param {object} lead
 * @param {string} lead.name
 * @param {string} lead.phone
 * @param {string} [lead.email]
 * @param {string} [lead.notes]
 * @param {string} [lead.pipeline]
 * @param {string} [lead.stage]
 * @param {string} [lead.sequence] Auto Follow-up sequence name (triggers WhatsApp)
 * @param {object} [lead.custom_attributes]
 */
export async function upsertKrayaLead(lead = {}) {
  const apiKey = getKrayaApiKey();
  if (!apiKey) {
    return { success: false, message: "KRAYA_API_KEY not configured" };
  }

  const phone10 = String(lead.phone || "").replace(/\D/g, "").slice(-10);
  if (!phone10 || phone10.length !== 10) {
    return { success: false, message: "Invalid phone for Kraya lead" };
  }

  // Kraya docs: phone with country code, e.g. +91-XXXXXXXXXX
  const countryCode = (process.env.KRAYA_COUNTRY_CODE || "91").replace(/\D/g, "") || "91";
  const phoneWithCountry =
    lead.phoneFormatted ||
    `+${countryCode}-${phone10}`;

  const payload = {
    name: (lead.name || "Customer").toString().trim(),
    phone: phoneWithCountry,
    email: (lead.email || "").toString().trim() || undefined,
    notes: (lead.notes || "").toString().trim() || undefined,
    pipeline: lead.pipeline || process.env.KRAYA_DEFAULT_PIPELINE || undefined,
    stage: lead.stage || process.env.KRAYA_DEFAULT_STAGE || undefined,
    sequence: lead.sequence ? String(lead.sequence).trim() : undefined,
    custom_attributes: lead.custom_attributes || undefined,
  };

  Object.keys(payload).forEach((k) => {
    if (payload[k] === undefined) delete payload[k];
  });

  try {
    const res = await fetch(getKrayaLeadsUrl(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-KRAYA-API-KEY": apiKey.trim(),
      },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = data.message || data.error || res.statusText;
      console.error("Kraya lead upsert failed:", msg, {
        status: res.status,
        phone: phoneWithCountry,
        keyLen: apiKey.trim().length,
        urlHost: (() => {
          try {
            return new URL(getKrayaLeadsUrl()).host;
          } catch {
            return "";
          }
        })(),
        data,
      });
      return { success: false, message: msg, data };
    }
    return { success: true, data, via: "leads", sequence: payload.sequence || null };
  } catch (err) {
    console.error("Kraya lead upsert network error:", err);
    return { success: false, message: err.message || "Network error" };
  }
}

/**
 * Build a Kraya lead payload from a populated appointment document.
 */
export function leadFromAppointment(appointment) {
  const customer = appointment?.customer || {};
  const servicesArray =
    Array.isArray(appointment.services) && appointment.services.length > 0
      ? appointment.services
      : appointment.service
        ? [appointment.service]
        : [];
  const servicesText = servicesArray
    .map((s) => s?.name)
    .filter(Boolean)
    .join(", ");

  const dateStr = appointment.date
    ? new Date(appointment.date).toLocaleDateString("en-IN")
    : "";
  const timeStr = appointment.time || "";

  return {
    name: customer.name || "Customer",
    phone: customer.phone,
    email: customer.email || "",
    notes: [
      "Veyona website booking",
      servicesText && `Services: ${servicesText}`,
      dateStr && `Date: ${dateStr}`,
      timeStr && `Time: ${timeStr}`,
      appointment._id && `Booking: ${String(appointment._id).slice(-6).toUpperCase()}`,
    ]
      .filter(Boolean)
      .join(" | "),
    custom_attributes: {
      source: "veyona_website",
      booking_id: appointment._id ? String(appointment._id) : "",
      services: servicesText,
      "Service Interested In": servicesText,
      lead_name: customer.name || "Customer",
      "Appointment Date": [dateStr, timeStr].filter(Boolean).join(" at "),
      appointment_date: dateStr,
      appointment_time: timeStr,
      status: appointment.status || "pending",
    },
  };
}
