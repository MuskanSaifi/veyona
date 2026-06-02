/**
 * Interakt WhatsApp template messages
 * Docs: https://app.interakt.ai/settings/developer-setting (API Key)
 * Template names from Interakt dashboard (e.g. transactional_booking_confirmation)
 */

// Interakt: send template via public message API (not /message/send/template)
const INTERAKT_MESSAGE_URL = "https://api.interakt.ai/v1/public/message/";

/**
 * Normalize Indian phone to 91XXXXXXXXXX for WhatsApp
 */
function toWhatsAppPhone(phone) {
  const digits = String(phone).replace(/\D/g, "").slice(-10);
  if (digits.length !== 10) return null;
  return `91${digits}`;
}

/**
 * Resolve the header image URL for a given template.
 *
 * Lookup order:
 *   1. `extra.headerImageUrl` (explicit override from caller)
 *   2. Per-template env var: INTERAKT_HEADER_IMAGE_<TEMPLATE_NAME_UPPER>
 *      e.g. template "transactional_admin_new_appointment" ->
 *           INTERAKT_HEADER_IMAGE_TRANSACTIONAL_ADMIN_NEW_APPOINTMENT
 *   3. Global env var: INTERAKT_HEADER_IMAGE_URL (legacy / shared image)
 *
 * Returns null if no image URL is configured (template should be text-only
 * or have no header).
 */
function resolveHeaderImageUrl(templateName, override) {
  if (override && typeof override === "string" && override.trim()) {
    return override.trim();
  }
  const safeName = (templateName || "")
    .toUpperCase()
    .replace(/[^A-Z0-9_]/g, "_");
  const perTemplateKey = `INTERAKT_HEADER_IMAGE_${safeName}`;
  const perTemplate = process.env[perTemplateKey];
  if (perTemplate && perTemplate.trim()) return perTemplate.trim();
  const global = process.env.INTERAKT_HEADER_IMAGE_URL;
  if (global && global.trim()) return global.trim();
  return null;
}

function getTemplateHeaderEnvKey(templateName) {
  const safeName = (templateName || "")
    .toUpperCase()
    .replace(/[^A-Z0-9_]/g, "_");
  return `INTERAKT_HEADER_IMAGE_${safeName}`;
}

/**
 * Send WhatsApp template message via Interakt
 * @param {string} phone - 10-digit Indian phone
 * @param {string} templateName - Template name in Interakt (e.g. transactional_booking_confirmation)
 * @param {string[]} bodyParams - Array of strings for body placeholders {{1}}, {{2}}, ...
 * @param {object} [extra] - Optional Interakt template fields:
 *   - `buttonValues`: { "0": ["path-suffix"] } for dynamic URL buttons
 *   - `headerImageUrl`: explicit image URL for IMAGE-header templates
 *     (overrides INTERAKT_HEADER_IMAGE_<TEMPLATE> / INTERAKT_HEADER_IMAGE_URL)
 *   - `disableHeader`: true to skip attaching any header media even if env vars exist
 * @returns {Promise<{ success: boolean; message?: string }>}
 */
export async function sendWhatsAppTemplate(phone, templateName, bodyParams = [], extra = {}) {
  const apiKey = process.env.INTERAKT_API_KEY;
  if (!apiKey) {
    console.error("INTERAKT_API_KEY not set in .env");
    return { success: false, message: "WhatsApp not configured" };
  }

  const to = toWhatsAppPhone(phone);
  if (!to) {
    return { success: false, message: "Invalid phone number" };
  }

  const templatePayload = {
    name: templateName,
    languageCode: "en",
    bodyValues: bodyParams,
  };

  if (extra.buttonValues && typeof extra.buttonValues === "object") {
    templatePayload.buttonValues = extra.buttonValues;
  }

  // If template has header type IMAGE in Interakt, API requires media URL.
  // Resolved per-template (with global fallback) so different templates can
  // use different banner images.
  const shouldAttachHeader = extra.disableHeader !== true;
  const headerImageUrl = shouldAttachHeader
    ? resolveHeaderImageUrl(templateName, extra.headerImageUrl)
    : null;
  if (headerImageUrl) {
    // Interakt's template API expects image media in headerValues for
    // IMAGE-header templates. Keep legacy `header` payload too for
    // compatibility with older behavior.
    templatePayload.headerValues = [headerImageUrl];
    templatePayload.header = {
      type: "image",
      link: headerImageUrl,
    };
  }
  if (process.env.NODE_ENV !== "production") {
    const perTemplateKey = getTemplateHeaderEnvKey(templateName);
    console.info("[whatsapp] template header media", {
      templateName,
      perTemplateKey,
      hasPerTemplateEnv: Boolean(process.env[perTemplateKey]),
      hasGlobalHeaderEnv: Boolean(process.env.INTERAKT_HEADER_IMAGE_URL),
      headerAttached: Boolean(headerImageUrl),
    });
  }

  const body = {
    countryCode: "91",
    phoneNumber: String(phone).replace(/\D/g, "").slice(-10),
    callbackData: "booking-notification",
    type: "Template",
    template: templatePayload,
  };

  return postWithRetry(INTERAKT_MESSAGE_URL, body, apiKey);
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

/**
 * POST to Interakt with automatic retry on transient network errors.
 * Retries up to 3 times with exponential backoff (1s, 2s, 4s).
 * Does NOT retry on 4xx responses (e.g. template not approved, bad payload)
 * since those will fail again the same way.
 */
async function postWithRetry(url, body, apiKey, maxAttempts = 3) {
  let lastErr = null;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${apiKey.trim()}`,
        },
        body: JSON.stringify(body),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && (data.id || data.messageId || data.status === "sent" || data.status === "submitted")) {
        return { success: true };
      }

      const errMsg = data.message || data.detail || data.error || (res.ok ? "Unknown error" : res.statusText);
      console.error(
        `Interakt WhatsApp error (attempt ${attempt}/${maxAttempts}):`,
        errMsg,
        data
      );
      // Don't retry 4xx — same payload will fail again.
      if (res.status >= 400 && res.status < 500) {
        return { success: false, message: errMsg };
      }
      // Retry on 5xx / unknown.
      lastErr = new Error(errMsg);
    } catch (err) {
      lastErr = err;
      if (!isTransientNetworkError(err)) {
        console.error("Interakt WhatsApp request failed (non-transient):", err);
        return { success: false, message: err.message || "Network error" };
      }
      console.warn(
        `Interakt WhatsApp transient error (attempt ${attempt}/${maxAttempts}):`,
        err.code || err.cause?.code || err.message
      );
    }

    if (attempt < maxAttempts) {
      const backoffMs = 1000 * Math.pow(2, attempt - 1); // 1s, 2s, 4s
      await sleep(backoffMs);
    }
  }

  console.error("Interakt WhatsApp gave up after retries:", lastErr?.message);
  return {
    success: false,
    message: lastErr?.message || "Network error after retries",
  };
}
