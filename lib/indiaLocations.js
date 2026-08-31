/**
 * India states & cities for address forms (via india-state-city).
 */
import { State, City } from "india-state-city";

let statesCache = null;

export function getIndianStates() {
  if (!statesCache) {
    statesCache = State.getAllStates().sort((a, b) =>
      a.name.localeCompare(b.name, "en", { sensitivity: "base" })
    );
  }
  return statesCache;
}

export function getStateByName(name) {
  const n = (name || "").trim();
  if (!n) return null;
  return (
    getIndianStates().find(
      (s) => s.name.toLowerCase() === n.toLowerCase()
    ) || null
  );
}

export function getCitiesForStateCode(stateCode) {
  if (!stateCode) return [];
  return City.getCitiesOfState(stateCode).sort((a, b) =>
    a.name.localeCompare(b.name, "en", { sensitivity: "base" })
  );
}

export function getCitiesForStateName(stateName) {
  const st = getStateByName(stateName);
  if (!st) return [];
  return getCitiesForStateCode(st.isoCode);
}

/**
 * Lookup pincode to automatically get State, District and City.
 * @param {string} pincode
 * @returns {Promise<{ success: boolean; state?: string; stateCode?: string; district?: string; city?: string; message?: string }>}
 */
export async function lookupPincode(pincode) {
  const cleanPin = String(pincode || "").replace(/\D/g, "").slice(0, 6);
  if (cleanPin.length !== 6) {
    return { success: false, message: "Pincode must be 6 digits" };
  }

  try {
    const res = await fetch(`/api/pincode/${cleanPin}`);
    const data = await res.json().catch(() => null);
    if (res.ok && data?.success) {
      return data;
    }
    if (data?.message) {
      return { success: false, message: data.message };
    }
  } catch {
    // Attempt fallback direct request if internal API fails
    try {
      const res = await fetch(`https://api.postalpincode.in/pincode/${cleanPin}`);
      const data = await res.json();
      const result = Array.isArray(data) ? data[0] : data;
      if (result?.Status === "Success" && Array.isArray(result?.PostOffice) && result.PostOffice.length) {
        const po = result.PostOffice[0];
        const stateName = po.State || "";
        const district = po.District || "";
        const matched = getStateByName(stateName);
        return {
          success: true,
          pincode: cleanPin,
          state: matched?.name || stateName,
          stateCode: matched?.isoCode || "",
          district,
          city: district || po.Name || "",
        };
      }
    } catch {}
  }

  return { success: false, message: "Could not lookup pincode" };
}
