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
 * Send WhatsApp template message via Interakt
 * @param {string} phone - 10-digit Indian phone
 * @param {string} templateName - Template name in Interakt (e.g. transactional_booking_confirmation)
 * @param {string[]} bodyParams - Array of strings for body placeholders {{1}}, {{2}}, ...
 * @returns {Promise<{ success: boolean; message?: string }>}
 */
export async function sendWhatsAppTemplate(phone, templateName, bodyParams = []) {
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

  // If template has header type IMAGE in Interakt, API requires media URL
  const headerImageUrl = process.env.INTERAKT_HEADER_IMAGE_URL;
  if (headerImageUrl && headerImageUrl.trim()) {
    templatePayload.header = {
      type: "image",
      link: headerImageUrl.trim(),
    };
  }

  const body = {
    countryCode: "91",
    phoneNumber: String(phone).replace(/\D/g, "").slice(-10),
    callbackData: "booking-notification",
    type: "Template",
    template: templatePayload,
  };

  try {
    const res = await fetch(INTERAKT_MESSAGE_URL, {
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
    console.error("Interakt WhatsApp error:", errMsg, data);
    return { success: false, message: errMsg };
  } catch (err) {
    console.error("Interakt WhatsApp request failed:", err);
    return { success: false, message: err.message || "Network error" };
  }
}
