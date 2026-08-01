/**
 * Kraya WhatsApp template messages
 *
 * Auth: X-KRAYA-API-KEY
 * Send URL: KRAYA_WHATSAPP_SEND_URL
 *   (ask Kraya support if not listed on dashboard; common pattern under
 *    https://api.kraya-ai.com/api/external/<slug>/...)
 *
 * Legacy INTERAKT_* env vars are still read as fallback via whatsappEnv helpers.
 */

import { envWhatsApp, getKrayaApiKey } from "@/lib/whatsappEnv";

const DEFAULT_LANGUAGE = "en";

/**
 * Normalize Indian phone to 10 digits (no country code).
 */
export function toWhatsAppPhone(phone) {
  const digits = String(phone).replace(/\D/g, "").slice(-10);
  if (digits.length !== 10) return null;
  return digits;
}

function getTemplateHeaderEnvKey(templateName) {
  const safeName = (templateName || "")
    .toUpperCase()
    .replace(/[^A-Z0-9_]/g, "_");
  return `HEADER_IMAGE_${safeName}`;
}

/**
 * Resolve header image URL for IMAGE-header templates.
 * Order: override → KRAYA_HEADER_IMAGE_<TEMPLATE> → INTERAKT_* → KRAYA_HEADER_IMAGE_URL
 */
function resolveHeaderImageUrl(templateName, override) {
  if (override && typeof override === "string" && override.trim()) {
    return override.trim();
  }
  const perKey = getTemplateHeaderEnvKey(templateName);
  const per = envWhatsApp(perKey);
  if (per) return per;
  return envWhatsApp("HEADER_IMAGE_URL");
}

function getWhatsAppSendUrl() {
  const explicit = process.env.KRAYA_WHATSAPP_SEND_URL?.trim();
  if (explicit) return explicit;

  // Derive from leads URL if present: .../leads → .../whatsapp/template
  const leadsUrl = process.env.KRAYA_LEADS_URL?.trim();
  if (leadsUrl && /\/leads\/?$/i.test(leadsUrl)) {
    return leadsUrl.replace(/\/leads\/?$/i, "/whatsapp/template");
  }
  return "";
}

/**
 * Send WhatsApp template message via Kraya.
 * @param {string} phone
 * @param {string} templateName
 * @param {string[]|Record<string,string>} bodyParams
 *   - Array: legacy ordered values (Interakt-style)
 *   - Object: Kraya named variables, e.g. { "lead_name": "Riya", "Appointment Date": "..." }
 * @param {object} [extra]
 *   - buttonValues, headerImageUrl, disableHeader
 *   - variables: optional alias for named body object
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

  const sendUrl = getWhatsAppSendUrl();
  if (!sendUrl) {
    console.error(
      "KRAYA_WHATSAPP_SEND_URL not set (and could not derive from KRAYA_LEADS_URL)"
    );
    return {
      success: false,
      message:
        "WhatsApp send URL not configured. Set KRAYA_WHATSAPP_SEND_URL in .env",
    };
  }

  const phone10 = toWhatsAppPhone(phone);
  if (!phone10) {
    return { success: false, message: "Invalid phone number" };
  }

  const countryCode = process.env.KRAYA_COUNTRY_CODE?.trim() || "91";
  const language =
    process.env.KRAYA_TEMPLATE_LANGUAGE?.trim() || DEFAULT_LANGUAGE;

  const shouldAttachHeader = extra.disableHeader !== true;
  const headerImageUrl = shouldAttachHeader
    ? resolveHeaderImageUrl(templateName, extra.headerImageUrl)
    : null;

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
    console.info("[whatsapp/kraya] send template", {
      templateName,
      sendUrl,
      headerAttached: Boolean(headerImageUrl),
      namedVarKeys: namedVars ? Object.keys(namedVars) : [],
      bodyParamCount: orderedValues.length,
    });
  }

  return postWithRetry(sendUrl, body, apiKey);
}

const TRANSIENT_NETWORK_CODES = new Set([
  "ECONNRESET",
  "ETIMEDOUT",
  "ENETUNREACH",
  "EAI_AGAIN",
  "UND_ERR_SOCKET",
  "UND_ERR_CONNECT_TIMEOUT",
]);

function isTransientNetworkError(err) {
  if (!err) return false;
  const code = err.code || err.cause?.code;
  if (code && TRANSIENT_NETWORK_CODES.has(code)) return true;
  if (err.name === "AbortError") return true;
  const msg = String(err.message || "").toLowerCase();
  return (
    msg.includes("econnreset") ||
    msg.includes("socket disconnected") ||
    msg.includes("fetch failed")
  );
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function postWithRetry(url, body, apiKey, maxAttempts = 3) {
  let lastErr = null;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-KRAYA-API-KEY": apiKey.trim(),
          Authorization: `Bearer ${apiKey.trim()}`,
        },
        body: JSON.stringify(body),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        return { success: true, data };
      }

      const errMsg =
        data.message ||
        data.detail ||
        data.error ||
        (typeof data.error === "string" ? data.error : null) ||
        res.statusText;
      console.error(
        `Kraya WhatsApp error (attempt ${attempt}/${maxAttempts}):`,
        errMsg,
        data
      );
      if (res.status >= 400 && res.status < 500) {
        return { success: false, message: errMsg };
      }
      lastErr = new Error(errMsg);
    } catch (err) {
      lastErr = err;
      if (!isTransientNetworkError(err)) {
        console.error("Kraya WhatsApp request failed (non-transient):", err);
        return { success: false, message: err.message || "Network error" };
      }
      console.warn(
        `Kraya WhatsApp transient error (attempt ${attempt}/${maxAttempts}):`,
        err.code || err.cause?.code || err.message
      );
    }

    if (attempt < maxAttempts) {
      await sleep(1000 * Math.pow(2, attempt - 1));
    }
  }

  console.error("Kraya WhatsApp gave up after retries:", lastErr?.message);
  return {
    success: false,
    message: lastErr?.message || "Network error after retries",
  };
}
