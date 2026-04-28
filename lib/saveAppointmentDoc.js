/**
 * Saves an Appointment document; if Mongoose still has an old compiled schema whose
 * `payment.plan` enum excludes `pay_at_salon`, retry once after mapping to an equivalent plan.
 */
export async function saveAppointmentDoc(doc) {
  try {
    await doc.save();
  } catch (err) {
    const msg = String(err?.message || "");
    if (
      doc.payment?.plan === "pay_at_salon" &&
      msg.includes("pay_at_salon") &&
      msg.includes("enum")
    ) {
      doc.payment.plan = "book_now_pay_later";
      doc.markModified("payment");
      await doc.save();
    } else {
      throw err;
    }
  }
}
