"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import toast from "react-hot-toast";

function normalizeAddressFromNominatim(addr = {}) {
  const city =
    addr.city ||
    addr.town ||
    addr.village ||
    addr.municipality ||
    addr.county ||
    "";
  const state = addr.state || addr.region || addr.state_district || "";
  const pincode = addr.postcode || "";
  const line1 = [
    addr.house_number,
    addr.road,
    addr.neighbourhood,
    addr.suburb,
    addr.hamlet,
    addr.locality,
  ]
    .filter(Boolean)
    .join(", ");

  return {
    addressLine1: line1 || "",
    landmark: "",
    city: city || "",
    state: state || "",
    pincode: (pincode || "").replace(/\D/g, "").slice(0, 6),
  };
}

export default function LocationPickerModal({
  open,
  initialQuery,
  onClose,
  onConfirm,
}) {
  const mapElRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const leafletRef = useRef(null);
  const [query, setQuery] = useState(initialQuery || "");
  const [results, setResults] = useState([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [loadingReverse, setLoadingReverse] = useState(false);
  const [locating, setLocating] = useState(false);
  const [selected, setSelected] = useState(null); // { lat, lon, displayName, parts }

  const headers = useMemo(
    () => ({
      "Accept-Language": "en",
    }),
    []
  );

  useEffect(() => {
    if (!open) return;
    setQuery(initialQuery || "");
    setResults([]);
    setSelected(null);
  }, [open, initialQuery]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    (async () => {
      try {
        const L = await import("leaflet");
        leafletRef.current = L;

        // Ensure marker icons resolve correctly in production builds.
        // (Leaflet's default URLs assume assets are served from /images.)
        try {
          delete L.Icon.Default.prototype._getIconUrl;
          L.Icon.Default.mergeOptions({
            iconRetinaUrl: new URL(
              "leaflet/dist/images/marker-icon-2x.png",
              import.meta.url
            ).toString(),
            iconUrl: new URL(
              "leaflet/dist/images/marker-icon.png",
              import.meta.url
            ).toString(),
            shadowUrl: new URL(
              "leaflet/dist/images/marker-shadow.png",
              import.meta.url
            ).toString(),
          });
        } catch {}

        if (cancelled) return;
        if (!mapElRef.current) return;
        if (mapRef.current) return;

        const map = L.map(mapElRef.current, {
          center: [28.6139, 77.209], // Delhi default
          zoom: 12,
        });
        mapRef.current = map;

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
          attribution: "&copy; OpenStreetMap contributors",
        }).addTo(map);

        const onMapClick = async (e) => {
          const { lat, lng } = e.latlng || {};
          if (typeof lat !== "number" || typeof lng !== "number") return;
          await setPinAndReverse(lat, lng);
        };

        map.on("click", onMapClick);

        // Ensure correct sizing after modal opens (common cause of blank tiles)
        setTimeout(() => {
          try {
            map.invalidateSize();
          } catch {}
        }, 50);
      } catch (e) {
        console.error("Leaflet map init failed:", e);
        toast.error("Could not load map");
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Cleanup leaflet map when modal closes (prevents blank map on re-open)
  useEffect(() => {
    if (open) return;
    try {
      if (mapRef.current) {
        mapRef.current.off();
        mapRef.current.remove();
      }
    } catch {}
    mapRef.current = null;
    markerRef.current = null;
  }, [open]);

  const setMarker = (lat, lon) => {
    const L = leafletRef.current;
    const map = mapRef.current;
    if (!L || !map) return;
    const pos = [lat, lon];

    if (!markerRef.current) {
      markerRef.current = L.marker(pos, { draggable: true }).addTo(map);
      markerRef.current.on("dragend", async () => {
        const p = markerRef.current.getLatLng();
        await setPinAndReverse(p.lat, p.lng);
      });
    } else {
      markerRef.current.setLatLng(pos);
    }
    map.setView(pos, Math.max(map.getZoom(), 15), { animate: true });
  };

  const reverseGeocode = async (lat, lon) => {
    setLoadingReverse(true);
    try {
      const url = new URL("https://nominatim.openstreetmap.org/reverse");
      url.searchParams.set("format", "json");
      url.searchParams.set("lat", String(lat));
      url.searchParams.set("lon", String(lon));
      url.searchParams.set("addressdetails", "1");
      url.searchParams.set("zoom", "18");

      const res = await fetch(url.toString(), { headers });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data) throw new Error("Reverse geocode failed");

      const displayName = data.display_name || "";
      const parts = normalizeAddressFromNominatim(data.address || {});
      setSelected({ lat, lon, displayName, parts });
    } catch (e) {
      toast.error("Could not fetch address from map");
    } finally {
      setLoadingReverse(false);
    }
  };

  const setPinAndReverse = async (lat, lon) => {
    setMarker(lat, lon);
    await reverseGeocode(lat, lon);
  };

  const doSearch = async () => {
    const q = (query || "").trim();
    if (!q) return;
    setLoadingSearch(true);
    try {
      const url = new URL("https://nominatim.openstreetmap.org/search");
      url.searchParams.set("format", "json");
      url.searchParams.set("q", q);
      url.searchParams.set("limit", "6");
      url.searchParams.set("addressdetails", "1");

      const res = await fetch(url.toString(), { headers });
      const data = await res.json().catch(() => []);
      if (!res.ok) throw new Error("Search failed");
      setResults(Array.isArray(data) ? data : []);
    } catch (e) {
      toast.error("Could not search location");
    } finally {
      setLoadingSearch(false);
    }
  };

  const locateMe = async () => {
    if (typeof window !== "undefined" && !window.isSecureContext) {
      toast.error("Location requires HTTPS (or localhost). Open the site on https or localhost.");
      return;
    }
    if (!navigator.geolocation) {
      toast.error("Location is not supported on this device");
      return;
    }
    setLocating(true);
    try {
      // Best-effort permission preflight (not supported everywhere)
      if (navigator.permissions?.query) {
        try {
          const p = await navigator.permissions.query({ name: "geolocation" });
          if (p.state === "denied") {
            toast.error("Location permission is blocked. Please allow location in browser settings.");
            setLocating(false);
            return;
          }
        } catch {}
      }

      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;
          await setPinAndReverse(lat, lon);
          setLocating(false);
        },
        (err) => {
          setLocating(false);
          const code = err?.code;
          if (code === 1) {
            toast.error("Permission denied. Please allow location access and try again.");
            return;
          }
          if (code === 2) {
            toast.error("Location unavailable. Turn on GPS/Location and try again.");
            return;
          }
          if (code === 3) {
            toast.error("Location request timed out. Please try again.");
            return;
          }
          toast.error("Could not access your location");
        },
        { enableHighAccuracy: true, timeout: 20000, maximumAge: 15000 }
      );
    } catch {
      setLocating(false);
      toast.error("Could not access your location");
    }
  };

  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 3000,
        background: "rgba(15,23,42,0.35)",
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(900px, 96vw)",
          marginTop: 16,
          background: "white",
          borderRadius: 18,
          border: "1px solid rgba(226,232,240,0.9)",
          boxShadow: "0 24px 80px rgba(0,0,0,0.25)",
          overflow: "hidden",
          transform: "translateY(0)",
          transition: "transform 160ms ease, opacity 160ms ease",
        }}
      >
        <div
          style={{
            padding: "14px 16px",
            background: "#e0f2fe",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
          }}
        >
          <div style={{ fontWeight: 900, color: "#0f172a" }}>Confirm Map Location</div>
          <button
            type="button"
            onClick={onClose}
            style={{
              border: "1px solid rgba(226,232,240,0.9)",
              background: "white",
              borderRadius: 10,
              padding: "8px 10px",
              cursor: "pointer",
              fontWeight: 800,
            }}
          >
            Close
          </button>
        </div>

        <div style={{ padding: 14 }}>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for area, street name..."
              style={{
                flex: 1,
                minWidth: 220,
                padding: "12px 14px",
                borderRadius: 14,
                border: "1px solid rgba(226,232,240,0.95)",
                outline: "none",
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  doSearch();
                }
              }}
            />
            <button
              type="button"
              onClick={doSearch}
              disabled={loadingSearch}
              style={{
                padding: "12px 14px",
                borderRadius: 14,
                border: "1px solid rgba(191,219,254,0.9)",
                background: loadingSearch ? "#bfdbfe" : "#dbeafe",
                color: "#1d4ed8",
                fontWeight: 900,
                cursor: loadingSearch ? "not-allowed" : "pointer",
              }}
            >
              {loadingSearch ? "Searching..." : "Search"}
            </button>
            <button
              type="button"
              onClick={locateMe}
              disabled={locating}
              style={{
                padding: "12px 14px",
                borderRadius: 14,
                border: "1px solid rgba(254,205,211,0.9)",
                background: locating ? "#fecdd3" : "#fff1f2",
                color: "#be123c",
                fontWeight: 900,
                cursor: locating ? "not-allowed" : "pointer",
              }}
            >
              {locating ? "Locating..." : "Locate me"}
            </button>
          </div>

          {results.length > 0 && (
            <div
              style={{
                marginTop: 10,
                border: "1px solid rgba(226,232,240,0.95)",
                borderRadius: 16,
                overflow: "hidden",
              }}
            >
              {results.map((r, idx) => (
                <button
                  key={`${r.place_id || idx}`}
                  type="button"
                  onClick={() => setPinAndReverse(Number(r.lat), Number(r.lon))}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    padding: "12px 14px",
                    border: "none",
                    borderTop: idx === 0 ? "none" : "1px solid rgba(226,232,240,0.95)",
                    background: "white",
                    cursor: "pointer",
                  }}
                >
                  <div style={{ fontWeight: 900, color: "#0f172a", fontSize: 14 }}>
                    {String(r.display_name || "").split(",")[0] || "Result"}
                  </div>
                  <div style={{ color: "#64748b", fontSize: 12, marginTop: 2 }}>
                    {r.display_name}
                  </div>
                </button>
              ))}
            </div>
          )}

          <div style={{ marginTop: 12 }}>
            <div
              ref={mapElRef}
              style={{
                width: "100%",
                height: "min(420px, 52vh)",
                borderRadius: 18,
                border: "1px solid rgba(226,232,240,0.95)",
                overflow: "hidden",
              }}
            />
          </div>

          <div
            style={{
              marginTop: 12,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <div style={{ minWidth: 220, flex: 1 }}>
              <div style={{ fontWeight: 900, color: "#0f172a" }}>
                {selected?.displayName ? selected.displayName.split(",")[0] : "Select a point on map"}
                {loadingReverse ? " (loading...)" : ""}
              </div>
              {selected?.displayName && (
                <div style={{ color: "#64748b", fontSize: 12, marginTop: 4 }}>
                  {selected.displayName}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                if (!selected) {
                  toast.error("Please select location on map");
                  return;
                }
                onConfirm?.({
                  location: selected.displayName || "",
                  parts: selected.parts || {},
                  lat: selected.lat,
                  lon: selected.lon,
                });
                onClose?.();
              }}
              disabled={!selected || loadingReverse}
              style={{
                padding: "12px 18px",
                borderRadius: 999,
                border: "none",
                background: !selected || loadingReverse ? "#e5e7eb" : "var(--accent-terracotta)",
                color: !selected || loadingReverse ? "#6b7280" : "white",
                fontWeight: 900,
                cursor: !selected || loadingReverse ? "not-allowed" : "pointer",
                minWidth: 190,
              }}
            >
              Confirm Location
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

