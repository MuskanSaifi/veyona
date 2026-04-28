/**
 * 2Factor.in SMS OTP integration
 * Docs: https://2factor.in/API/DOCS/Docs.html
 * API Key from: https://2factor.in/CP/Dashboard_list.php
 */

const TWO_FACTOR_BASE = "https://2factor.in/API/V1";

/**
 * Send OTP via 2Factor.in SMS
 * @param {string} phone - 10-digit Indian phone number (e.g. 9009390054)
 * @param {string} otp - 4-6 digit OTP to send
 * @returns {Promise<{ success: boolean; message?: string }>}
 */

export async function sendOTPSMS(phone, otp) {
  const apiKey = process.env.TWO_FACTOR_API_KEY;
  if (!apiKey) {
    console.error("TWO_FACTOR_API_KEY not set in .env");
    return { success: false, message: "SMS service not configured" };
  }

  // Normalize phone: remove spaces, ensure 10 digits for India
  const normalized = String(phone).replace(/\D/g, "").slice(-10);
  if (normalized.length !== 10) {
    return { success: false, message: "Invalid phone number" };
  }

  const url = `${TWO_FACTOR_BASE}/${apiKey}/SMS/${normalized}/${otp}`;

  try {
    const res = await fetch(url, { method: "GET" });
    const data = await res.json().catch(() => ({}));

    if (data.Status === "Success") {
      return { success: true };
    }

    const errMsg = data.Details || data.Message || (res.ok ? "Unknown error" : res.statusText) || "Failed to send OTP";
    console.error("2Factor SMS error:", errMsg, data);
    return { success: false, message: errMsg };
  } catch (err) {
    console.error("2Factor SMS request failed:", err);
    return { success: false, message: err.message || "Network error" };
  }
}

