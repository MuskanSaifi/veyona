import { yearMonthKey } from "@/lib/invoiceNumber";

/** First successful payment, else updatedAt / createdAt / booking date. */
export function getInvoiceIssueDate(apt) {
  const successfulPayments = Array.isArray(apt?.payments)
    ? apt.payments
        .filter((p) => p && (p.status === "captured" || p.status === "recorded") && p.createdAt)
        .map((p) => new Date(p.createdAt))
        .filter((d) => !Number.isNaN(d.getTime()))
    : [];
  if (successfulPayments.length > 0) {
    return successfulPayments.sort((a, b) => a.getTime() - b.getTime())[0];
  }
  if (apt?.updatedAt) return new Date(apt.updatedAt);
  if (apt?.createdAt) return new Date(apt.createdAt);
  if (apt?.date) return new Date(apt.date);
  return new Date();
}

export function invoiceMonthLabel(date) {
  return yearMonthKey(date).label;
}

export function appointmentTotalPayable(apt) {
  return Math.max(
    0,
    Number(
      apt?.pricing?.totalPayable ??
        apt?.totalPrice ??
        apt?.service?.price ??
        0
    )
  );
}

export function appointmentServiceLabel(apt) {
  if (Array.isArray(apt?.services) && apt.services.length > 0) {
    return apt.services.map((s) => s.name || "Service").join(", ");
  }
  return apt?.service?.name || "Service";
}
