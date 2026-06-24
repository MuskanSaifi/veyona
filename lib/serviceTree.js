/**
 * Service nesting tree helpers.
 *
 * Structure: Category → main service (depth 0) → up to 4 sub-levels (depth 1–4).
 * Only leaf nodes (no children) with price + duration are bookable.
 */

/** Main service = 0; max 4 subcategory levels below → deepest node depth = 4 */
export const MAX_SERVICE_TREE_DEPTH = 4;

export function normalizeServiceId(id) {
  if (id == null) return "";
  return String(id._id || id).trim();
}

export function buildChildrenMap(services) {
  const map = new Map();
  for (const s of services || []) {
    const parentId = normalizeServiceId(s.parentService);
    if (!parentId) continue;
    if (!map.has(parentId)) map.set(parentId, []);
    map.get(parentId).push(s);
  }
  for (const list of map.values()) {
    list.sort((a, b) => (a.order || 0) - (b.order || 0) || (a.name || "").localeCompare(b.name || ""));
  }
  return map;
}

export function getRootServices(services) {
  return (services || [])
    .filter((s) => !normalizeServiceId(s.parentService))
    .sort((a, b) => (a.order || 0) - (b.order || 0) || (a.name || "").localeCompare(b.name || ""));
}

/** Depth of a service in the tree (root = 0). */
export function getServiceDepth(services, serviceId) {
  const byId = new Map((services || []).map((s) => [normalizeServiceId(s._id), s]));
  let depth = 0;
  let current = byId.get(normalizeServiceId(serviceId));
  const seen = new Set();

  while (current?.parentService) {
    const pid = normalizeServiceId(current.parentService);
    if (!pid || seen.has(pid)) break;
    seen.add(pid);
    depth += 1;
    current = byId.get(pid);
    if (depth > MAX_SERVICE_TREE_DEPTH + 2) break;
  }
  return depth;
}

export function hasChildServices(services, serviceId) {
  const id = normalizeServiceId(serviceId);
  return (services || []).some((s) => normalizeServiceId(s.parentService) === id);
}

/** Bookable only if leaf + price + duration. */
export function isBookableLeafService(service, servicesOrChildrenMap) {
  const id = normalizeServiceId(service?._id);
  let hasKids = false;
  if (servicesOrChildrenMap instanceof Map) {
    hasKids = (servicesOrChildrenMap.get(id) || []).length > 0;
  } else {
    hasKids = hasChildServices(servicesOrChildrenMap, id);
  }
  if (hasKids) return false;
  return Boolean(service?.price && service?.duration);
}

export function canServiceBeParent(services, serviceId) {
  return getServiceDepth(services, serviceId) < MAX_SERVICE_TREE_DEPTH;
}

/** Prevent selecting self, descendants, or ancestors as parent. */
export function isValidParentChoice(services, editingId, candidateParentId) {
  const editId = normalizeServiceId(editingId);
  const parentId = normalizeServiceId(candidateParentId);
  if (!parentId) return true;
  if (editId && parentId === editId) return false;

  const byId = new Map((services || []).map((s) => [normalizeServiceId(s._id), s]));

  // Candidate cannot be a descendant of editing service
  if (editId) {
    const stack = [editId];
    const descendants = new Set();
    while (stack.length) {
      const cur = stack.pop();
      for (const s of services || []) {
        if (normalizeServiceId(s.parentService) === cur) {
          const cid = normalizeServiceId(s._id);
          if (!descendants.has(cid)) {
            descendants.add(cid);
            stack.push(cid);
          }
        }
      }
    }
    if (descendants.has(parentId)) return false;
  }

  // New/edited node depth with this parent
  const parentDepth = getServiceDepth(services, parentId);
  if (parentDepth >= MAX_SERVICE_TREE_DEPTH) return false;

  return true;
}

export function getParentSelectOptions(services, { categoryId, editingId } = {}) {
  const cat = categoryId ? String(categoryId) : "";
  const options = [];

  for (const s of services || []) {
    const sid = normalizeServiceId(s._id);
    const sCat = normalizeServiceId(s.category?._id || s.category);
    if (cat && sCat !== cat) continue;
    if (!isValidParentChoice(services, editingId, sid)) continue;
    if (!canServiceBeParent(services, sid)) continue;

    const depth = getServiceDepth(services, sid);
    const kids = hasChildServices(services, sid);
    const leaf = isBookableLeafService(s, services);
    const indent = "  ".repeat(depth);
    let tag = "";
    if (kids) tag = " — grouping";
    else if (leaf) tag = " — leaf (becomes grouping if selected)";
    else tag = " — grouping";

    options.push({
      id: sid,
      label: `${indent}${depth > 0 ? "↳ " : ""}${s.name}${tag}`,
      depth,
    });
  }

  return options;
}

/** Server-side: walk parent chain in DB. */
export async function getServiceDepthInDb(ServiceModel, serviceId) {
  let depth = 0;
  let currentId = normalizeServiceId(serviceId);
  const seen = new Set();

  while (currentId) {
    if (seen.has(currentId)) break;
    seen.add(currentId);
    const doc = await ServiceModel.findById(currentId).select("parentService").lean();
    if (!doc?.parentService) break;
    depth += 1;
    currentId = normalizeServiceId(doc.parentService);
    if (depth > MAX_SERVICE_TREE_DEPTH + 2) break;
  }
  return depth;
}

export async function validateParentServiceDepth(ServiceModel, parentServiceId) {
  if (!parentServiceId) return { ok: true, depth: 0 };
  const parentDepth = await getServiceDepthInDb(ServiceModel, parentServiceId);
  if (parentDepth >= MAX_SERVICE_TREE_DEPTH) {
    return {
      ok: false,
      message: `Maximum ${MAX_SERVICE_TREE_DEPTH} nesting levels reached. Cannot add another sub-level.`,
    };
  }
  return { ok: true, depth: parentDepth + 1 };
}

/** All bookable leaf descendants under a node (any depth). */
export function collectBookableLeaves(serviceId, childrenMap) {
  const id = normalizeServiceId(serviceId);
  const children = childrenMap.get(id) || [];
  const leaves = [];

  for (const child of children) {
    if (isBookableLeafService(child, childrenMap)) {
      leaves.push(child);
    } else {
      leaves.push(...collectBookableLeaves(child._id, childrenMap));
    }
  }
  return leaves;
}

/** Breadcrumb path from root to service: "Hair › Cut › Men's". */
export function getServicePathLabel(services, serviceId, separator = " › ") {
  const byId = new Map((services || []).map((s) => [normalizeServiceId(s._id), s]));
  const parts = [];
  let current = byId.get(normalizeServiceId(serviceId));
  const seen = new Set();

  while (current) {
    const cid = normalizeServiceId(current._id);
    if (seen.has(cid)) break;
    seen.add(cid);
    parts.unshift(current.name || "");
    const pid = normalizeServiceId(current.parentService);
    if (!pid) break;
    current = byId.get(pid);
  }
  return parts.filter(Boolean).join(separator);
}
