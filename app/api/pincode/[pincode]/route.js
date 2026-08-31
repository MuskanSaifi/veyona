import { NextResponse } from "next/server";
import { getIndianStates, getStateByName } from "@/lib/indiaLocations";

export const runtime = "nodejs";

// In-memory cache for pincode lookups (fast response and avoids API rate limits)
const pincodeCache = new Map();

function matchState(rawState) {
  if (!rawState) return null;
  const direct = getStateByName(rawState);
  if (direct) return direct;

  const rawClean = rawState.toLowerCase().replace(/[^a-z0-9]/g, "");
  const all = getIndianStates();

  for (const s of all) {
    const sClean = s.name.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (sClean === rawClean || sClean.includes(rawClean) || rawClean.includes(sClean)) {
      return s;
    }
  }

  // Handle common aliases
  if (rawClean.includes("delhi")) {
    const found = all.find((s) => s.name.toLowerCase().includes("delhi"));
    if (found) return found;
  }
  if (rawClean.includes("odisha") || rawClean.includes("orissa")) {
    const found = all.find((s) => s.name.toLowerCase().includes("odisha"));
    if (found) return found;
  }
  if (rawClean.includes("pondicherry") || rawClean.includes("puducherry")) {
    const found = all.find((s) => s.name.toLowerCase().includes("puducherry"));
    if (found) return found;
  }

  return null;
}

export async function GET(req, { params }) {
  try {
    const { pincode: rawPincode } = await params;
    const pincode = String(rawPincode || "").replace(/\D/g, "").slice(0, 6);

    if (!/^\d{6}$/.test(pincode)) {
      return NextResponse.json(
        { success: false, message: "Pincode must be 6 digits" },
        { status: 400 }
      );
    }

    if (pincodeCache.has(pincode)) {
      return NextResponse.json(pincodeCache.get(pincode));
    }

    const res = await fetch(`https://api.postalpincode.in/pincode/${pincode}`, {
      headers: { Accept: "application/json" },
      // 5s timeout
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) {
      return NextResponse.json(
        { success: false, message: "Failed to fetch pincode details" },
        { status: 502 }
      );
    }

    const data = await res.json();
    const result = Array.isArray(data) ? data[0] : data;

    if (result?.Status !== "Success" || !Array.isArray(result?.PostOffice) || !result.PostOffice.length) {
      return NextResponse.json(
        { success: false, message: "No details found for this pincode" },
        { status: 404 }
      );
    }

    const firstPo = result.PostOffice[0];
    const rawState = firstPo.State || "";
    const district = firstPo.District || "";
    const block = firstPo.Block !== "NA" ? firstPo.Block : "";
    const postOfficeName = firstPo.Name || "";

    const matchedState = matchState(rawState);
    const stateName = matchedState?.name || rawState;
    const stateCode = matchedState?.isoCode || "";

    // Candidate city / district names from the post office data
    const cityCandidates = [
      ...new Set(
        result.PostOffice.map((po) => po.Name)
          .concat(district, block)
          .filter((x) => x && x !== "NA")
      ),
    ];

    const responsePayload = {
      success: true,
      pincode,
      state: stateName,
      stateCode,
      district,
      city: district || postOfficeName || block || "",
      cityCandidates,
      postOffices: result.PostOffice.map((po) => ({
        name: po.Name,
        district: po.District,
        state: po.State,
      })),
    };

    pincodeCache.set(pincode, responsePayload);
    return NextResponse.json(responsePayload);
  } catch (err) {
    return NextResponse.json(
      { success: false, message: err.message || "Pincode lookup failed" },
      { status: 500 }
    );
  }
}
