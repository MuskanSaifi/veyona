import { createSlice } from "@reduxjs/toolkit";

const BOOKING_STORAGE_KEY = "veyona_booking_services";

function normalizeServiceId(id) {
  if (id == null || id === "") return null;
  const s = String(id).trim();
  return s || null;
}

function getInitialServiceIds() {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(BOOKING_STORAGE_KEY);
    const ids = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(ids)) return [];
    return [...new Set(ids.map(normalizeServiceId).filter(Boolean))];
  } catch (e) {
    return [];
  }
}

const bookingCartSlice = createSlice({
  name: "bookingCart",
  initialState: {
    serviceIds: getInitialServiceIds(),
  },
  reducers: {
    setBookingServices: (state, action) => {
      const ids = Array.isArray(action.payload) ? action.payload : [];
      const normalized = [...new Set(ids.map(normalizeServiceId).filter(Boolean))];
      state.serviceIds = normalized;
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(BOOKING_STORAGE_KEY, JSON.stringify(normalized));
        } catch (e) {}
      }
    },
    addBookingService: (state, action) => {
      const id = normalizeServiceId(action.payload);
      if (!id || state.serviceIds.some((sid) => String(sid) === id)) return;
      state.serviceIds.push(id);
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(BOOKING_STORAGE_KEY, JSON.stringify(state.serviceIds));
        } catch (e) {}
      }
    },
    removeBookingService: (state, action) => {
      const id = normalizeServiceId(action.payload);
      if (!id) return;
      state.serviceIds = state.serviceIds.filter((sid) => String(sid) !== id);
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(BOOKING_STORAGE_KEY, JSON.stringify(state.serviceIds));
        } catch (e) {}
      }
    },
  },
});

export const { setBookingServices, addBookingService, removeBookingService } = bookingCartSlice.actions;
export default bookingCartSlice.reducer;
