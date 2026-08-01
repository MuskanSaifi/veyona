/**
 * WhatsApp helpers for the Service Time Tracking module.
 *
 * OTP: Meta rejects free-form Utility templates that send codes.
 * Default channel is SMS (2Factor). WhatsApp only if you create a real
 * Meta Authentication (copy-code) template and set SERVICE_OTP_CHANNEL.
 *
 * Feedback: Kraya Utility template `service_feedback`.
 */

import { sendWhatsAppTemplate } from "@/lib/whatsapp";
import { getTemplateEnv, envWhatsApp } from "@/lib/whatsappEnv";
import { sendOTPSMS } from "@/lib/sms";

const DEFAULT_OTP_TEMPLATE = "veyona_service_start_code";
const DEFAULT_FEEDBACK_TEMPLATE = "service_feedback";

/**
 * @returns {"sms"|"whatsapp"|"both"}
 */
function getServiceOtpChannel() {
  const raw = (process.env.SERVICE_OTP_CHANNEL || "sms").trim().toLowerCase();
  if (raw === "whatsapp" || raw === "both") return raw;
  return "sms";
}

/**
 * Send OTP via WhatsApp AUTH template (only if Meta-approved Authentication
 * copy-code template exists). Body/button both need the code.
 */
export async function sendServiceOtpWhatsApp(phone, otpCode) {
  const templateName = getTemplateEnv("SERVICE_OTP", DEFAULT_OTP_TEMPLATE);
  const code = String(otpCode);
  return sendWhatsAppTemplate(phone, templateName, [code], {
    buttonValues: { "0": [code] },
    disableHeader: true,
  });
}

/**
 * Send service OTP. Default = SMS (reliable). Set SERVICE_OTP_CHANNEL=whatsapp|both
 * only after a Meta Authentication template is approved.
 */
export async function sendServiceOtp(phone, otpCode) {
  const channel = getServiceOtpChannel();
  const code = String(otpCode);
  const result = {
    success: false,
    channel,
    sms: null,
    whatsapp: null,
    message: "",
  };

  if (channel === "whatsapp" || channel === "both") {
    result.whatsapp = await sendServiceOtpWhatsApp(phone, code);
  }

  if (channel === "sms" || channel === "both") {
    result.sms = await sendOTPSMS(phone, code);
  } else if (channel === "whatsapp" && !result.whatsapp?.success) {
    // WhatsApp-only failed → SMS fallback so service can still start
    result.sms = await sendOTPSMS(phone, code);
    result.channel = "whatsapp+sms_fallback";
  }

  const smsOk = result.sms?.success === true;
  const waOk = result.whatsapp?.success === true;
  result.success = smsOk || waOk;

  if (smsOk && waOk) {
    result.message = "OTP sent on SMS and WhatsApp";
  } else if (smsOk) {
    result.message = "OTP sent on SMS";
  } else if (waOk) {
    result.message = "OTP sent on WhatsApp";
  } else {
    result.message =
      result.sms?.message ||
      result.whatsapp?.message ||
      "Failed to send OTP";
  }

  return result;
}

export function buildFeedbackUrl(serviceVisitId) {
  const base = (process.env.NEXT_PUBLIC_APP_URL || "").replace(/\/+$/, "");
  const path = `/feedback/${serviceVisitId}`;
  return base ? `${base}${path}` : path;
}

/**
 * Send the post-service "thank you + feedback link" message.
 */
export async function sendFeedbackRequestWhatsApp(phone, serviceVisitId) {
  const templateName = getTemplateEnv(
    "SERVICE_FEEDBACK",
    DEFAULT_FEEDBACK_TEMPLATE
  );

  const buttonIndex = envWhatsApp("FEEDBACK_BUTTON_INDEX");
  const hasDynamicButton = buttonIndex != null && buttonIndex !== "";

  if (!hasDynamicButton) {
    return sendWhatsAppTemplate(phone, templateName, [], {});
  }

  const extra = {
    buttonValues: { [String(buttonIndex)]: [`feedback/${serviceVisitId}`] },
  };
  return sendWhatsAppTemplate(phone, templateName, [], extra);
}
