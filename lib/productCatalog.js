export function normalizeProductId(id) {
  if (id == null) return "";
  return String(id._id || id).trim();
}

export function buildProductChildrenMap(products) {
  const map = new Map();
  for (const p of products || []) {
    const parentId = normalizeProductId(p.parentProduct);
    if (!parentId) continue;
    if (!map.has(parentId)) map.set(parentId, []);
    map.get(parentId).push(p);
  }
  for (const list of map.values()) {
    list.sort(
      (a, b) =>
        (a.order || 0) - (b.order || 0) ||
        (a.name || "").localeCompare(b.name || "")
    );
  }
  return map;
}

export function isBuyableProduct(product, childrenMap) {
  const id = normalizeProductId(product?._id);
  const hasKids = (childrenMap.get(id) || []).length > 0;
  return !hasKids && Number(product?.price) > 0;
}

export function getProductPathLabel(products, productId, separator = " › ") {
  const byId = new Map((products || []).map((p) => [normalizeProductId(p._id), p]));
  const parts = [];
  let current = byId.get(normalizeProductId(productId));
  const seen = new Set();

  while (current) {
    const cid = normalizeProductId(current._id);
    if (seen.has(cid)) break;
    seen.add(cid);
    parts.unshift(current.name || "");
    const pid = normalizeProductId(current.parentProduct);
    if (!pid) break;
    current = byId.get(pid);
  }
  return parts.filter(Boolean).join(separator);
}

export function groupBuyableProductsByCategory(products) {
  const childrenMap = buildProductChildrenMap(products);
  const buyable = (products || []).filter((p) => isBuyableProduct(p, childrenMap));
  const groups = new Map();

  for (const p of buyable) {
    const catId = normalizeProductId(p.category);
    const catName =
      (typeof p.category === "object" && p.category?.name) || "Products";
    if (!groups.has(catId)) {
      groups.set(catId, { categoryId: catId, categoryName: catName, products: [] });
    }
    groups.get(catId).products.push({
      ...p,
      pathLabel: getProductPathLabel(products, p._id),
    });
  }

  for (const g of groups.values()) {
    g.products.sort(
      (a, b) =>
        (a.order || 0) - (b.order || 0) ||
        (a.pathLabel || a.name || "").localeCompare(b.pathLabel || b.name || "")
    );
  }

  return Array.from(groups.values()).sort((a, b) =>
    a.categoryName.localeCompare(b.categoryName)
  );
}
