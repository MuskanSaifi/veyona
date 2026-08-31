/** GST rates (tax-inclusive pricing: total payable already includes GST 18%). */
export const CGST_RATE = 0.09;
export const SGST_RATE = 0.09;
export const IGST_RATE = 0.18;
export const COMBINED_GST_RATE = 0.18;

function round2(n) {
  return Math.round(n * 100) / 100;
}

/**
 * Determine if a customer state is outside Uttar Pradesh (where Veyona is registered).
 * Out-of-state customers are charged IGST (18%) instead of CGST (9%) + SGST (9%).
 *
 * @param {string} customerState
 * @returns {boolean}
 */
export function isOtherState(customerState) {
  if (!customerState) return false;
  const s = String(customerState).trim().toLowerCase().replace(/[^a-z0-9]/g, "");
  if (
    s === "uttarpradesh" ||
    s === "up" ||
    s === "09"
  ) {
    return false;
  }
  return true;
}

/**
 * Split a GST-inclusive amount into taxable value + taxes.
 * For Uttar Pradesh (intra-state): CGST (9%) + SGST (9%), IGST = 0.
 * For other states (inter-state): IGST (18%), CGST = 0, SGST = 0.
 *
 * @param {number} totalInclusive
 * @param {string|boolean} stateOrIsOtherState
 */
export function splitGstInclusive(totalInclusive, stateOrIsOtherState = false) {
  const total = Math.max(0, Number(totalInclusive) || 0);
  if (total === 0) {
    return { taxable: 0, cgst: 0, sgst: 0, igst: 0, total: 0, isInterState: false };
  }
  const isInter =
    typeof stateOrIsOtherState === "boolean"
      ? stateOrIsOtherState
      : isOtherState(stateOrIsOtherState);

  const taxable = round2(total / (1 + COMBINED_GST_RATE));
  const taxAmount = round2(total - taxable);

  if (isInter) {
    return {
      taxable,
      cgst: 0,
      sgst: 0,
      igst: taxAmount,
      total: round2(total),
      isInterState: true,
    };
  }

  const cgst = round2(taxable * CGST_RATE);
  const sgst = round2(total - taxable - cgst);
  return {
    taxable,
    cgst,
    sgst,
    igst: 0,
    total: round2(total),
    isInterState: false,
  };
}
