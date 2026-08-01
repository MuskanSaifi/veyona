/**
 * Kraya template variable names (must match blue chips / custom attributes).
 * Create any missing attributes in Kraya CRM before using in templates.
 */
export const KRAYA_VARS = {
  LEAD_NAME: "lead_name",
  SERVICE: "Service Interested In",
  APPOINTMENT_DATE: "Appointment Date",
  APPOINTMENT_TIME: "Appointment Time",
  BOOKING_ID: "Booking ID",
  OTP_CODE: "OTP Code",
  REFUND_NOTE: "Refund Note",
};

export function krayaVars(partial = {}) {
  const out = {};
  for (const [k, v] of Object.entries(partial)) {
    if (v == null || v === "") continue;
    out[k] = String(v);
  }
  return out;
}
