/**
 * WhatsApp helpers for the Service Time Tracking module.
 *
 * Reuses the project's existing Interakt integration (lib/whatsapp.js).
 *
 * Two Interakt templates are expected (create them in the Interakt dashboard
 * and configure their names in .env):
 *
 *   1) OTP template      — body has a single placeholder {{1}} for the 4-digit code
 *      Suggested body:   "Your service OTP is {{1}}. Please share it with the
 *                         service provider."
 *      env var:          INTERAKT_TEMPLATE_SERVICE_OTP
 *
 *   2) Feedback template — body has a single placeholder {{1}} for the feedback URL
 *      Suggested body:   "Thank you for using our service 🙏
 *                         Please rate your experience here: {{1}}"
 *      env var:          INTERAKT_TEMPLATE_SERVICE_FEEDBACK
 *
 * If the feedback template uses an Interakt URL button with a dynamic suffix,
 * set INTERAKT_FEEDBACK_BUTTON_INDEX (e.g. "0") and the suffix (path after
 * your configured base URL) will be passed via buttonValues.
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
  const feedbackUrl = buildFeedbackUrl(serviceVisitId);

  // If the Interakt template uses a dynamic URL button, route the link there.
  // Otherwise the URL is passed as a normal body parameter ({{1}}).
  const buttonIndex = process.env.INTERAKT_FEEDBACK_BUTTON_INDEX;
  const extra =
    buttonIndex != null && buttonIndex !== ""
      ? { buttonValues: { [String(buttonIndex)]: [`feedback/${serviceVisitId}`] } }
      : {};

  return sendWhatsAppTemplate(phone, templateName, [feedbackUrl], extra);
}
