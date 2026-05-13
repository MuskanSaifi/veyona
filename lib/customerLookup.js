import Customer from "@/models/Customer";

export function phoneVariants(input) {
  const raw = String(input || "").trim();
  const digits = raw.replace(/\D/g, "");
  const last10 = digits.length >= 10 ? digits.slice(-10) : digits;
  const variants = new Set([raw, digits, last10]);
  if (last10 && last10.length === 10) {
    variants.add(`+91${last10}`);
    variants.add(`91${last10}`);
  }
  return Array.from(variants).filter(Boolean);
}

export function escapeRegex(s) {
  return String(s || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Customer rows linked to this app user. When the user has an email on file,
 * require matching customer email so another person/guest record with the
 * same phone does not merge into this account's appointment history.
 */
export async function getCustomerIdsForUser(user) {
  if (!user?.phone) return [];
  const phones = phoneVariants(user.phone);
  const emailTrim = (user.email || "").trim();
  const query = emailTrim
    ? {
        phone: { $in: phones },
        email: new RegExp(`^${escapeRegex(emailTrim)}$`, "i"),
      }
    : { phone: { $in: phones } };
  const customers = await Customer.find(query).select("_id").lean();
  return customers.map((c) => c._id);
}
