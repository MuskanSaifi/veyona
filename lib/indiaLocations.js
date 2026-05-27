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
