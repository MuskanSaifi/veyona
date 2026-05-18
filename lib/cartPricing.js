/** Cart below this amount (₹) incurs a service charge. */
export const CART_FREE_SERVICE_THRESHOLD =
  Number(process.env.CART_FREE_SERVICE_THRESHOLD) || 1099;

/** Service charge (₹) when cart subtotal is below threshold. */
export const CART_SERVICE_CHARGE_AMOUNT =
  Number(process.env.CART_SERVICE_CHARGE_AMOUNT) || 299;

export function getServiceCharge(itemsSubtotal) {
  const sub = Math.max(0, Number(itemsSubtotal) || 0);
  if (sub < CART_FREE_SERVICE_THRESHOLD) return CART_SERVICE_CHARGE_AMOUNT;
  return 0;
}

export function computeOrderTotals({ subtotal, discountAmount = 0 }) {
  const itemsSubtotal = Math.max(0, Number(subtotal) || 0);
  const serviceCharge = getServiceCharge(itemsSubtotal);
  const discount = Math.max(0, Number(discountAmount) || 0);
  const totalPayable = Math.max(0, itemsSubtotal + serviceCharge - discount);
  return {
    subtotal: itemsSubtotal,
    serviceCharge,
    discountAmount: discount,
    totalPayable,
  };
}
