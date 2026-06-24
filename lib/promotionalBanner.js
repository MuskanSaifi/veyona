/** Filter promos that are active and within optional schedule. */
export function filterLivePromotionalBanners(banners, { placement } = {}) {
  const now = new Date();
  return (banners || []).filter((b) => {
    if (!b.active) return false;
    if (placement && b.placement !== placement) return false;
    if (b.startDate && new Date(b.startDate) > now) return false;
    if (b.endDate) {
      const end = new Date(b.endDate);
      end.setHours(23, 59, 59, 999);
      if (end < now) return false;
    }
    return true;
  });
}
