/**
 * Parse wallet date filters from query params.
 * Supports: from (YYYY-MM-DD), to (YYYY-MM-DD), month (YYYY-MM)
 */
export function parseWalletDateRange(searchParams) {
  const fromParam = searchParams.get("from");
  const toParam = searchParams.get("to");
  const monthParam = searchParams.get("month");

  const createdAt = {};
  let from = fromParam || null;
  let to = toParam || null;

  if (monthParam && /^\d{4}-\d{2}$/.test(monthParam)) {
    const [year, month] = monthParam.split("-").map(Number);
    const start = new Date(year, month - 1, 1, 0, 0, 0, 0);
    const end = new Date(year, month, 0, 23, 59, 59, 999);
    createdAt.$gte = start;
    createdAt.$lte = end;
    from = start.toISOString().slice(0, 10);
    to = end.toISOString().slice(0, 10);
    return { createdAt, from, to, month: monthParam };
  }

  if (fromParam) {
    const d = new Date(fromParam);
    if (!Number.isNaN(d.getTime())) {
      d.setHours(0, 0, 0, 0);
      createdAt.$gte = d;
      from = fromParam;
    }
  }
  if (toParam) {
    const d = new Date(toParam);
    if (!Number.isNaN(d.getTime())) {
      d.setHours(23, 59, 59, 999);
      createdAt.$lte = d;
      to = toParam;
    }
  }

  return {
    createdAt: Object.keys(createdAt).length ? createdAt : null,
    from,
    to,
    month: null,
  };
}

export function summarizePurchases(purchases) {
  const list = purchases || [];
  let completedTotal = 0;
  let pendingTotal = 0;
  let cancelledTotal = 0;
  let completedCount = 0;
  let pendingCount = 0;
  let cancelledCount = 0;

  for (const p of list) {
    const amt = Number(p.amount) || 0;
    if (p.status === "completed") {
      completedTotal += amt;
      completedCount += 1;
    } else if (p.status === "pending") {
      pendingTotal += amt;
      pendingCount += 1;
    } else if (p.status === "cancelled") {
      cancelledTotal += amt;
      cancelledCount += 1;
    }
  }

  return {
    count: list.length,
    completedTotal,
    pendingTotal,
    cancelledTotal,
    completedCount,
    pendingCount,
    cancelledCount,
    totalAmount: completedTotal + pendingTotal + cancelledTotal,
  };
}
