import ServiceVisit from "@/models/ServiceVisit";
import { appointmentServiceLabel } from "@/lib/invoiceUtils";

/**
 * When an appointment is ended from the employee dashboard, ensure a
 * ServiceVisit row exists so /feedback phone lookup and rating work.
 */
export async function ensureServiceVisitForAppointment(appointment) {
  if (!appointment?.employee || !appointment?.customer) {
    return null;
  }

  const existing = await ServiceVisit.findOne({ appointment: appointment._id });
  if (existing) {
    if (existing.status !== "completed") {
      existing.status = "completed";
      existing.endTime = appointment.serviceEndedAt || new Date();
      if (appointment.serviceStartedAt) {
        existing.startTime = appointment.serviceStartedAt;
        const ms =
          new Date(existing.endTime).getTime() -
          new Date(appointment.serviceStartedAt).getTime();
        existing.durationMinutes = Math.max(0, Math.round(ms / 60000));
      }
      existing.otpVerified = true;
      existing.otpVerifiedAt = appointment.serviceOtpVerifiedAt || existing.otpVerifiedAt;
      await existing.save();
    }
    return existing;
  }

  const endTime = appointment.serviceEndedAt || new Date();
  const startTime = appointment.serviceStartedAt || endTime;
  const durationMinutes = Math.max(
    0,
    Math.round((new Date(endTime).getTime() - new Date(startTime).getTime()) / 60000)
  );

  return ServiceVisit.create({
    employee: appointment.employee,
    customer: appointment.customer,
    appointment: appointment._id,
    serviceLabel: appointmentServiceLabel(appointment),
    status: "completed",
    otpVerified: true,
    otpVerifiedAt: appointment.serviceOtpVerifiedAt || startTime,
    startTime,
    endTime,
    durationMinutes,
  });
}
