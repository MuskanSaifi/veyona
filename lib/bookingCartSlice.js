import { createSlice } from "@reduxjs/toolkit";

const BOOKING_STORAGE_KEY = "veyona_booking_services";

function getInitialServiceIds() {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(BOOKING_STORAGE_KEY);
    const ids = raw ? JSON.parse(raw) : [];
    return Array.isArray(ids) ? ids : [];
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
      state.serviceIds = ids;
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(BOOKING_STORAGE_KEY, JSON.stringify(ids));
        } catch (e) {}
      }
    },
    addBookingService: (state, action) => {
      const id = action.payload;
      if (!id || state.serviceIds.includes(id)) return;
      state.serviceIds.push(id);
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(BOOKING_STORAGE_KEY, JSON.stringify(state.serviceIds));
        } catch (e) {}
      }
    },
    removeBookingService: (state, action) => {
      const id = action.payload;
      state.serviceIds = state.serviceIds.filter((sid) => sid !== id);
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
