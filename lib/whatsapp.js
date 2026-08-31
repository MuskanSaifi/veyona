/**
 * Kraya WhatsApp delivery
 *
 * Kraya support: no public HTTP API to send a single template by name.
 * Templates go out via Leads upsert + Auto Follow-up `sequence`.
 *
 * Flow:
 *   sendWhatsAppTemplate(phone, templateOrSequenceName, namedVars)
 *     → POST KRAYA_LEADS_URL { phone, name, sequence, custom_attributes }
 *
 * Optional: if KRAYA_WHATSAPP_SEND_URL is set to a real send endpoint
 * (when Kraya ships one), that path is used instead.
 */

import { envWhatsApp, getKrayaApiKey } from "@/lib/whatsappEnv";
import { upsertKrayaLead } from "@/lib/krayaLeads";

const DEFAULT_LANGUAGE = "en";

/** Map Meta/template env names → short SEQUENCE_* env keys */
const SEQUENCE_ENV_ALIASES = {
  transactional_booking_received: "SEQUENCE_BOOKING_RECEIVED",
  transactional_booking_confirmation: "SEQUENCE_BOOKING_CONFIRMED",
  transactional_admin_new_appointment: "SEQUENCE_ADMIN_NEW_APPOINTMENT",
  transactional_employee_assign: "SEQUENCE_EMPLOYEE_ASSIGN",
  transactional_user_appointment_rescheduled: "SEQUENCE_USER_RESCHEDULE",
  transactional_employee_appointment_rescheduled: "SEQUENCE_EMPLOYEE_RESCHEDULE",
  service_feedback: "SEQUENCE_SERVICE_FEEDBACK",
  transactional_admin_late_cancel_attempt: "SEQUENCE_ADMIN_LATE_CANCEL",
  transactional_admin_refund_pending: "SEQUENCE_ADMIN_REFUND_PENDING",
  transactional_user_cancellation_refund: "SEQUENCE_USER_CANCEL_REFUND",
};

/**
 * Normalize Indian phone to 10 digits (no country code).
 */
export function toWhatsAppPhone(phone) {
  const digits = String(phone).replace(/\D/g, "").slice(-10);
  if (digits.length !== 10) return null;
  return digits;
}

/**
 * Resolve Auto Follow-up sequence name for a template key.
 * Order: KRAYA_SEQUENCE_<TEMPLATE> → alias env → template name itself.
 */
export function resolveKrayaSequenceName(templateName) {
  const name = String(templateName || "").trim();
  if (!name) return "";

  const safe = name.toUpperCase().replace(/[^A-Z0-9_]/g, "_");
  const direct = process.env[`KRAYA_SEQUENCE_${safe}`]?.trim();
  if (direct) return direct;

  const aliasKey = SEQUENCE_ENV_ALIASES[name];
  if (aliasKey) {
    const aliased = envWhatsApp(aliasKey);
    if (aliased) return aliased;
  }

  return name;
}

function getExplicitWhatsAppSendUrl() {
  const explicit = process.env.KRAYA_WHATSAPP_SEND_URL?.trim();
  if (!explicit) return "";
  // Never treat our own webhook or the non-existent /whatsapp/template as send URL
  if (/\/api\/webhooks\/kraya/i.test(explicit)) return "";
  if (/\/whatsapp\/template\/?$/i.test(explicit)) return "";
  return explicit;
}

function getTemplateHeaderEnvKey(templateName) {
  const safeName = (templateName || "")
    .toUpperCase()
    .replace(/[^A-Z0-9_]/g, "_");
  return `HEADER_IMAGE_${safeName}`;
}

function resolveHeaderImageUrl(templateName, override) {
  if (override && typeof override === "string" && override.trim()) {
    return override.trim();
  }
  const per = envWhatsApp(getTemplateHeaderEnvKey(templateName));
  if (per) return per;
  return envWhatsApp("HEADER_IMAGE_URL");
}

/**
 * Send WhatsApp via Kraya (sequence on lead upsert by default).
 *
 * @param {string} phone
 * @param {string} templateName Meta template name OR Kraya sequence name
 * @param {string[]|Record<string,string>} bodyParams named vars preferred
 * @param {object} [extra] buttonValues, headerImageUrl, disableHeader, leadName, notes
 */
export async function sendWhatsAppTemplate(
  phone,
  templateName,
  bodyParams = [],
  extra = {}
) {
  const apiKey = getKrayaApiKey();
  if (!apiKey) {
    console.error("KRAYA_API_KEY not set in .env");
    return { success: false, message: "WhatsApp not configured" };
  }

  const phone10 = toWhatsAppPhone(phone);
  if (!phone10) {
    return { success: false, message: "Invalid phone number" };
  }

  const namedVars =
    (extra.variables && typeof extra.variables === "object"
      ? extra.variables
      : null) ||
    (!Array.isArray(bodyParams) && bodyParams && typeof bodyParams === "object"
      ? bodyParams
      : null);

  const orderedValues = Array.isArray(bodyParams)
    ? bodyParams
    : namedVars
      ? Object.values(namedVars)
      : [];

  const sendUrl = getExplicitWhatsAppSendUrl();
  if (sendUrl) {
    return postDirectTemplate(sendUrl, apiKey, {
      phone10,
      templateName,
      namedVars,
      orderedValues,
      extra,
    });
  }

  // Default: Leads API + Auto Follow-up sequence (Kraya's supported path)
  const sequence = resolveKrayaSequenceName(templateName);
  if (!sequence) {
    return { success: false, message: "No Kraya sequence / template name" };
  }

  const leadName =
    extra.leadName ||
    namedVars?.lead_name ||
    namedVars?.["lead_name"] ||
    "Customer";

  const custom_attributes = {
    ...(namedVars || {}),
    source: "veyona_website",
  };

  if (process.env.NODE_ENV !== "production") {
    console.info("[whatsapp/kraya] send via lead sequence", {
      sequence,
      templateName,
      phone: phone10,
      namedVarKeys: namedVars ? Object.keys(namedVars) : [],
    });
  }

  return upsertKrayaLead({
    name: String(leadName),
    phone: phone10,
    notes: extra.notes || `Veyona: ${sequence}`,
    sequence,
    custom_attributes,
  });
}

async function postDirectTemplate(sendUrl, apiKey, ctx) {
  const { phone10, templateName, namedVars, orderedValues, extra } = ctx;
  const countryCode = process.env.KRAYA_COUNTRY_CODE?.trim() || "91";
  const language =
    process.env.KRAYA_TEMPLATE_LANGUAGE?.trim() || DEFAULT_LANGUAGE;

  const shouldAttachHeader = extra.disableHeader !== true;
  const headerImageUrl = shouldAttachHeader
    ? resolveHeaderImageUrl(templateName, extra.headerImageUrl)
    : null;

  const body = {
    country_code: countryCode,
    phone: phone10,
    phone_number: phone10,
    type: "template",
    template_name: templateName,
    template: {
      name: templateName,
      language,
      languageCode: language,
      body_values: orderedValues,
      bodyValues: orderedValues,
    },
    body_values: orderedValues,
    language,
  };

  if (namedVars) {
    body.variables = namedVars;
    body.template_variables = namedVars;
    body.custom_attributes = namedVars;
    body.template.variables = namedVars;
    body.template.template_variables = namedVars;
  }

  if (extra.buttonValues && typeof extra.buttonValues === "object") {
    body.button_values = extra.buttonValues;
    body.template.button_values = extra.buttonValues;
    body.template.buttonValues = extra.buttonValues;
  }

  if (headerImageUrl) {
    body.header_image_url = headerImageUrl;
    body.template.header_values = [headerImageUrl];
    body.template.headerValues = [headerImageUrl];
    body.template.header = { type: "image", link: headerImageUrl };
  }

  if (process.env.NODE_ENV !== "production") {
    console.info("[whatsapp/kraya] send direct template", {
      templateName,
      sendUrl,
      headerAttached: Boolean(headerImageUrl),
    });
  }

  try {
    const res = await fetch(sendUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-KRAYA-API-KEY": apiKey.trim(),
      },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const errMsg = data.message || data.error || res.statusText;
      console.error("Kraya WhatsApp direct send error:", errMsg, data);
      return { success: false, message: errMsg, data };
    }
    return { success: true, data, via: "direct" };
  } catch (err) {
    console.error("Kraya WhatsApp direct send failed:", err);
    return { success: false, message: err.message || "Network error" };
  }
}
