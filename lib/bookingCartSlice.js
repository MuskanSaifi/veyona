import { createSlice } from "@reduxjs/toolkit";

const BOOKING_STORAGE_KEY = "veyona_booking_services";
const BOOKING_QTY_STORAGE_KEY = "veyona_booking_service_qty";

function normalizeServiceId(id) {
  if (id == null || id === "") return null;
  const s = String(id).trim();
  return s || null;
}

function clampQty(q) {
  const n = Math.floor(Number(q));
  if (!Number.isFinite(n)) return 1;
  return Math.max(1, Math.min(20, n));
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

function getInitialQuantities() {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(BOOKING_QTY_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    if (!parsed || typeof parsed !== "object") return {};
    const out = {};
    for (const [id, qty] of Object.entries(parsed)) {
      const norm = normalizeServiceId(id);
      if (norm) out[norm] = clampQty(qty);
    }
    return out;
  } catch (e) {
    return {};
  }
}

function persistCart(state) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(BOOKING_STORAGE_KEY, JSON.stringify(state.serviceIds));
    localStorage.setItem(BOOKING_QTY_STORAGE_KEY, JSON.stringify(state.quantities));
  } catch (e) {}
}

function syncQuantitiesWithIds(state) {
  const idSet = new Set(state.serviceIds.map((id) => String(id)));
  for (const id of Object.keys(state.quantities)) {
    if (!idSet.has(id)) delete state.quantities[id];
  }
  for (const id of state.serviceIds) {
    const key = String(id);
    if (state.quantities[key] == null) state.quantities[key] = 1;
  }
}

const initialServiceIds = getInitialServiceIds();
const initialQuantities = getInitialQuantities();
for (const id of initialServiceIds) {
  const key = String(id);
  if (initialQuantities[key] == null) initialQuantities[key] = 1;
}

const bookingCartSlice = createSlice({
  name: "bookingCart",
  initialState: {
    serviceIds: initialServiceIds,
    quantities: initialQuantities,
  },
  reducers: {
    setBookingServices: (state, action) => {
      const ids = Array.isArray(action.payload) ? action.payload : [];
      const normalized = [...new Set(ids.map(normalizeServiceId).filter(Boolean))];
      state.serviceIds = normalized;
      syncQuantitiesWithIds(state);
      persistCart(state);
    },
    addBookingService: (state, action) => {
      const id = normalizeServiceId(action.payload);
      if (!id) return;
      if (!state.serviceIds.some((sid) => String(sid) === id)) {
        state.serviceIds.push(id);
        state.quantities[id] = 1;
      }
      persistCart(state);
    },
    removeBookingService: (state, action) => {
      const id = normalizeServiceId(action.payload);
      if (!id) return;
      state.serviceIds = state.serviceIds.filter((sid) => String(sid) !== id);
      delete state.quantities[id];
      persistCart(state);
    },
    incrementBookingService: (state, action) => {
      const id = normalizeServiceId(action.payload);
      if (!id) return;
      if (!state.serviceIds.some((sid) => String(sid) === id)) {
        state.serviceIds.push(id);
        state.quantities[id] = 1;
      } else {
        const cur = state.quantities[id] || 1;
        state.quantities[id] = Math.min(20, cur + 1);
      }
      persistCart(state);
    },
    decrementBookingService: (state, action) => {
      const id = normalizeServiceId(action.payload);
      if (!id) return;
      const cur = state.quantities[id] || 0;
      if (cur <= 1) {
        state.serviceIds = state.serviceIds.filter((sid) => String(sid) !== id);
        delete state.quantities[id];
      } else {
        state.quantities[id] = cur - 1;
      }
      persistCart(state);
    },
    setBookingServiceQuantity: (state, action) => {
      const { serviceId, quantity } = action.payload || {};
      const id = normalizeServiceId(serviceId);
      if (!id) return;
      const q = clampQty(quantity);
      if (!state.serviceIds.some((sid) => String(sid) === id)) {
        state.serviceIds.push(id);
      }
      state.quantities[id] = q;
      persistCart(state);
    },
  },
});

export const {
  setBookingServices,
  addBookingService,
  removeBookingService,
  incrementBookingService,
  decrementBookingService,
  setBookingServiceQuantity,
} = bookingCartSlice.actions;

export function selectBookingQty(state, serviceId) {
  const id = normalizeServiceId(serviceId);
  if (!id) return 0;
  return state.bookingCart.quantities?.[id] || 0;
}

export default bookingCartSlice.reducer;
