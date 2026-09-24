import connectDB from "@/lib/db";
import Blacklist from "@/models/Blacklist";
import { phoneVariants } from "@/lib/customerLookup";

export function normalizePhone(input) {
  const digits = String(input || "").replace(/\D/g, "");
  if (digits.length < 10) return "";
  return digits.slice(-10);
}

export function normalizeEmail(input) {
  return String(input || "").trim().toLowerCase();
}

/**
 * True if an active customer blacklist matches phone and/or email.
 */
export async function isCustomerBlacklisted({ phone, email } = {}) {
  await connectDB();
  const phone10 = normalizePhone(phone);
  const emailNorm = normalizeEmail(email);
  const or = [];

  if (phone10) {
    const variants = phoneVariants(phone10);
    or.push({ phone: { $in: [phone10, ...variants.map(normalizePhone).filter(Boolean)] } });
    // Also match entries stored as last-10 only
    or.push({ phone: phone10 });
  }
  if (emailNorm) {
    or.push({ email: emailNorm });
  }
  if (!or.length) return false;

  const hit = await Blacklist.findOne({
    type: "customer",
    active: true,
    $or: or,
  })
    .select("_id")
    .lean();

  return Boolean(hit);
}

/**
 * True if an active employee blacklist exists for this employee id.
 */
export async function isEmployeeBlacklisted(employeeId) {
  if (!employeeId) return false;
  await connectDB();
  const hit = await Blacklist.findOne({
    type: "employee",
    active: true,
    employeeRef: employeeId,
  })
    .select("_id")
    .lean();
  return Boolean(hit);
}

export function customerBlacklistMessage() {
  return "This phone number or email is blocked from using Veyona services. Please contact support.";
}
