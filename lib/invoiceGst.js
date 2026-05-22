/** GST rates (tax-inclusive pricing: total payable already includes CGST + SGST). */
export const CGST_RATE = 0.09;
export const SGST_RATE = 0.09;
export const COMBINED_GST_RATE = CGST_RATE + SGST_RATE;

function round2(n) {
  return Math.round(n * 100) / 100;
}

/**
 * Split a GST-inclusive amount into taxable value + CGST + SGST.
 * @param {number} totalInclusive
 */
export function splitGstInclusive(totalInclusive) {
  const total = Math.max(0, Number(totalInclusive) || 0);
  if (total === 0) {
    return { taxable: 0, cgst: 0, sgst: 0, total: 0 };
  }
  const taxable = round2(total / (1 + COMBINED_GST_RATE));
  const cgst = round2(taxable * CGST_RATE);
  const sgst = round2(total - taxable - cgst);
  return { taxable, cgst, sgst, total: round2(total) };
}
