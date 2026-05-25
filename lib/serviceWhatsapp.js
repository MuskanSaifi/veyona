/**
 * WhatsApp helpers for the Service Time Tracking module.
 *
 * Reuses the project's existing Interakt integration (lib/whatsapp.js).
 *
 * Two Interakt templates are expected (create them in the Interakt dashboard
 * and configure their names in .env):
 *
 *   1) OTP template — body has a single placeholder {{1}} for the 4-digit code.
 *      env var: INTERAKT_TEMPLATE_SERVICE_OTP
 *
 *   2) Feedback template — body has NO variables. Two supported button modes:
 *
 *      a) STATIC URL button (recommended for simple setups):
 *         Button URL is a fixed landing page, e.g. https://veyona.in/feedback/
 *         where the customer enters their phone to look up their visit.
 *         INTERAKT_FEEDBACK_BUTTON_INDEX must be EMPTY in .env.
 *
 *      b) DYNAMIC URL button (per-visit deep link):
 *         Button URL has {{1}} placeholder filled per message with the visit's
 *         feedback path suffix (e.g. "feedback/<visitId>").
 *         INTERAKT_FEEDBACK_BUTTON_INDEX must be the button's index (e.g. "0").
 *
 *      env var: INTERAKT_TEMPLATE_SERVICE_FEEDBACK
 */

import { sendWhatsAppTemplate } from "@/lib/whatsapp";

const DEFAULT_OTP_TEMPLATE = "service_otp";
const DEFAULT_FEEDBACK_TEMPLATE = "service_feedback";

/**
 * Send the 4-digit OTP to the customer.
 * @param {string} phone     - 10-digit Indian phone number
 * @param {string} otpCode   - 4-digit OTP as a string
 */
export async function sendServiceOtpWhatsApp(phone, otpCode) {
  const templateName =
    process.env.INTERAKT_TEMPLATE_SERVICE_OTP || DEFAULT_OTP_TEMPLATE;
  return sendWhatsAppTemplate(phone, templateName, [String(otpCode)]);
}

/**
 * Build the publicly accessible feedback URL for a given visit.
 * Uses NEXT_PUBLIC_APP_URL if set, otherwise falls back to a relative URL.
 */
export function buildFeedbackUrl(serviceVisitId) {
  const base = (process.env.NEXT_PUBLIC_APP_URL || "").replace(/\/+$/, "");
  const path = `/feedback/${serviceVisitId}`;
  return base ? `${base}${path}` : path;
}

/**
 * Send the post-service "thank you + feedback link" message.
 * @param {string} phone           - 10-digit Indian phone number
 * @param {string} serviceVisitId  - Mongo id of the ServiceVisit
 */
export async function sendFeedbackRequestWhatsApp(phone, serviceVisitId) {
  const templateName =
    process.env.INTERAKT_TEMPLATE_SERVICE_FEEDBACK || DEFAULT_FEEDBACK_TEMPLATE;

  const buttonIndex = process.env.INTERAKT_FEEDBACK_BUTTON_INDEX;
  const hasDynamicButton = buttonIndex != null && buttonIndex !== "";

  if (!hasDynamicButton) {
    // Static button: template body has no variables and the URL is fixed in
    // Interakt. Customer lands on /feedback and self-identifies via phone.
    return sendWhatsAppTemplate(phone, templateName, [], {});
  }

  const extra = {
    buttonValues: { [String(buttonIndex)]: [`feedback/${serviceVisitId}`] },
  };
  return sendWhatsAppTemplate(phone, templateName, [], extra);
}
