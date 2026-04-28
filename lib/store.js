import { configureStore } from "@reduxjs/toolkit";
import bookingCartReducer from "./bookingCartSlice";

function getPreloadedState() {
  if (typeof window === "undefined") return undefined;
  try {
    const raw = localStorage.getItem("veyona_booking_services");
    const serviceIds = raw ? JSON.parse(raw) : [];
    return {
      bookingCart: {
        serviceIds: Array.isArray(serviceIds) ? serviceIds : [],
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
