import crypto from "crypto";
import Razorpay from "razorpay";

export function getRazorpay() {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;
  if (!key_id || !key_secret) {
    throw new Error("Razorpay keys are not configured");
  }
  return new Razorpay({ key_id, key_secret });
}

export function verifyRazorpaySignature({ orderId, paymentId, signature }) {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) throw new Error("Razorpay secret is not configured");
  const payload = `${orderId}|${paymentId}`;
  const expected = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  return expected === signature;
}

export function getRazorpayKeyId() {
  return process.env.RAZORPAY_KEY_ID || "";
}
