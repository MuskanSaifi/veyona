import { configureStore } from "@reduxjs/toolkit";
import bookingCartReducer from "./bookingCartSlice";

function normalizeBookingIds(ids) {
  if (!Array.isArray(ids)) return [];
  return [...new Set(ids.map((id) => (id == null ? "" : String(id).trim())).filter(Boolean))];
}

function getPreloadedState() {
  if (typeof window === "undefined") return undefined;
  try {
    const raw = localStorage.getItem("veyona_booking_services");
    const serviceIds = raw ? JSON.parse(raw) : [];
    let quantities = {};
    try {
      const qtyRaw = localStorage.getItem("veyona_booking_service_qty");
      quantities = qtyRaw ? JSON.parse(qtyRaw) : {};
      if (!quantities || typeof quantities !== "object") quantities = {};
    } catch (e) {
      quantities = {};
    }
    return {
      bookingCart: {
        serviceIds: normalizeBookingIds(serviceIds),
        quantities,
      },
    };
  } catch (e) {
    return undefined;
  }
}

export const store = configureStore({
  reducer: {
    bookingCart: bookingCartReducer,
  },
  preloadedState: getPreloadedState(),
});
