/**
 * Normalize service image URLs for admin/public display.
 */
export function getServiceImageSrc(service) {
  const raw = String(service?.image || "").trim();
  if (!/^https?:\/\/.+/i.test(raw)) return null;
  const stamp = service?.updatedAt
    ? new Date(service.updatedAt).getTime()
    : service?._id
      ? String(service._id).slice(-6)
      : "";
  if (!stamp) return raw;
  const joiner = raw.includes("?") ? "&" : "?";
  return `${raw}${joiner}v=${stamp}`;
}
