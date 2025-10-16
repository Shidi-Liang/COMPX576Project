import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  GoogleMap,
  Marker,
  DirectionsRenderer,
  InfoWindow,
  useJsApiLoader,
} from "@react-google-maps/api";

/** ─────────── Basic Styling ─────────── */
const containerStyle = { width: "100%", height: "100%" };
const defaultCenter = { lat: -36.8485, lng: 174.7633 }; // Auckland

/** Light Color Palette: Clearer appearance */
const getColor = (index) => {
  const palette = ["#00BFFF", "#FF4500", "#32CD32", "#FF1493", "#FFD700"]; //Sky Blue/Orange Red/Grass Green/Hot Pink/Gold
  return palette[index % palette.length];
};

export default function MapComponent({ routeOptions = [] }) {
  const libraries = useMemo(() => ["places", "geometry"], []);
  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    libraries,
  });

  const mapRef = useRef(null);
  const directionsServiceRef = useRef(null);

  const [markersList, setMarkersList] = useState([]);      // [[{lat,lng,name}], ...]
  const [directionsList, setDirectionsList] = useState([]); // [DirectionsResult|null, ...]
  const [activeIdx, setActiveIdx] = useState(null);        // Legend highlight: null = all
  const [hoverIdx, setHoverIdx] = useState(null);          // Legend hover: temporary bold
  const [selectedStop, setSelectedStop] = useState(null);  // InfoWindow data

  /** ─────────── Utility Functions ─────────── */
  const fitToBounds = useCallback((coordsList) => {
    if (!mapRef.current || !coordsList?.length) return;
    const bounds = new window.google.maps.LatLngBounds();
    coordsList.forEach((coords) => {
      (coords || []).forEach((p) =>
        bounds.extend(new window.google.maps.LatLng(p.lat, p.lng))
      );
    });
    if (!bounds.isEmpty()) mapRef.current.fitBounds(bounds, 60);
  }, []);

  // Count mileage/duration (from DirectionsResult)
  const getStats = (dir) => {
    try {
      const legs = dir?.routes?.[0]?.legs || [];
      const meters = legs.reduce((s, l) => s + (l.distance?.value || 0), 0);
      const secs = legs.reduce((s, l) => s + (l.duration?.value || 0), 0);
      return { km: (meters / 1000).toFixed(1), min: Math.round(secs / 60) };
    } catch {
      return { km: "0.0", min: 0 };
    }
  };

  /** Place name → coordinates (automatically fills in ", New Zealand", prints failed status) */
  const geocodePlaces = useCallback(async (places) => {
    const geocoder = new window.google.maps.Geocoder();
    const results = await Promise.all(
      (places || []).map(
        (place) =>
          new Promise((resolve) => {
            const query =
              place && !/new zealand/i.test(place)
                ? `${place}, New Zealand`
                : place || "";
            geocoder.geocode({ address: query }, (res, status) => {
              if (status === "OK" && res && res[0]) {
                const { lat, lng } = res[0].geometry.location;
                resolve({ lat: lat(), lng: lng(), name: place });
              } else {
                console.warn(`⚠️ Geocode failed for: "${place}", status=${status}`);
                resolve(null);
              }
            });
          })
      )
    );
    return results.filter(Boolean);
  }, []);

  /** Gradually remove the intermediate points that lead to ZERO_RESULTS until a drawable route can be obtained */
  const requestDirectionsWithPruning = useCallback(async (coords) => {
    const ds =
      directionsServiceRef.current ||
      new window.google.maps.DirectionsService();
    directionsServiceRef.current = ds;

    const ask = (list) =>
      new Promise((resolve) => {
        ds.route(
          {
            origin: list[0],
            destination: list[list.length - 1],
            waypoints: list
              .slice(1, -1)
              .map((loc) => ({ location: loc, stopover: true })),
            travelMode: window.google.maps.TravelMode.DRIVING,
            optimizeWaypoints: false, // 不要重排/省略
            avoidFerries: true,       // 避免轮渡导致 ZERO_RESULTS
          },
          (res, status) => resolve({ res, status })
        );
      });

    let useList = coords.slice();
    let { res, status } = await ask(useList);
    if (status === "OK") return { directions: res, removedIdx: [] };

    // Remove midway points one by one (up to 3)
    const removed = [];
    const midIdxs = Array.from(
      { length: Math.max(0, useList.length - 2) },
      (_, i) => i + 1
    );

    for (let round = 0; round < Math.min(3, midIdxs.length); round++) {
      let improved = false;
      for (const mid of midIdxs) {
        if (removed.includes(mid)) continue;
        const trial = useList.filter((_, i) => i !== mid);
        const { res: r2, status: s2 } = await ask(trial);
        if (s2 === "OK") {
          removed.push(mid);
          useList = trial;
          res = r2;
          status = s2;
          improved = true;
          break;
        }
      }
      if (!improved) break;
    }

    if (status === "OK") return { directions: res, removedIdx: removed };

    // Still failed: degenerated to the starting point → end point
    const fallback = [coords[0], coords[coords.length - 1]];
    const { res: r3, status: s3 } = await ask(fallback);
    if (s3 === "OK") return { directions: r3, removedIdx: midIdxs };

    // If it doesn't work, return empty.
    return { directions: null, removedIdx: midIdxs };
  }, []);

  /** Load all routes: geocode → remove error-tolerant routing → render */
  const loadRoutes = useCallback(async () => {
    if (!isLoaded || !routeOptions?.length) {
      setMarkersList([]);
      setDirectionsList([]);
      return;
    }

    const allMarkers = [];
    const allDirections = [];

    for (let i = 0; i < routeOptions.length; i++) {
      const stops = (routeOptions[i]?.stops || [])
        .map((s) => s.place)
        .filter(Boolean);

      if (stops.length < 2) {
        console.warn(`⚠️ Route ${i + 1} skipped: stops < 2`, stops);
        allMarkers.push([]);
        allDirections.push(null);
        continue;
      }

      // 1) geocode
      const coords = await geocodePlaces(stops);
      if (coords.length < 2) {
        console.warn(`⚠️ Route ${i + 1} skipped: geocoded < 2`, coords);
        allMarkers.push(coords);
        allDirections.push(null);
        continue;
      }

      // 2) Remove adjacent duplicate points (the same coordinates will cause failure)
      const deduped = coords.filter((p, idx, arr) => {
        if (idx === 0) return true;
        const prev = arr[idx - 1];
        return p.lat !== prev.lat || p.lng !== prev.lng;
      });

      allMarkers.push(deduped);

      // 3) Request Directions (with fault tolerance for removing unreachable waypoints)
      const { directions, removedIdx } = await requestDirectionsWithPruning(
        deduped
      );

      if (removedIdx?.length) {
        // Mark the names of the eliminated points to facilitate back-end optimization
        const removedNames = removedIdx
          .map(
            (mid) =>
              routeOptions[i]?.stops?.[mid]?.place ||
              deduped[mid]?.name ||
              `Stop ${mid + 1}`
          )
          .filter(Boolean);
        console.warn(
          `Route ${i + 1}: unreachable waypoints removed ->`,
          removedNames
        );
      }

      allDirections.push(directions);
    }

    setMarkersList(allMarkers);
    setDirectionsList(allDirections);

    // Initial view: Contains points on the currently visible route
    const visible = activeIdx == null ? allMarkers : [allMarkers[activeIdx] || []];
    fitToBounds(visible);
  }, [isLoaded, routeOptions, requestDirectionsWithPruning, geocodePlaces, fitToBounds, activeIdx]);

  useEffect(() => { loadRoutes(); }, [loadRoutes]);

  const onLoadMap = useCallback((map) => (mapRef.current = map), []);
  const onUnmountMap = useCallback(() => (mapRef.current = null), []);

  if (!isLoaded) return <div style={{ padding: 12 }}>Loading Map…</div>;

  /** ─────────── Rendering ─────────── */
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Legend: Light background + colored border; click to highlight, floating stroke */}
      {directionsList.length > 0 && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "8px 0" }}>
          {directionsList.map((dir, idx) => {
            if (!dir) return null;
            const { km, min } = getStats(dir);
            const isActive = activeIdx === idx;
            const isHover = hoverIdx === idx;
            return (
              <button
                key={`legend-${idx}`}
                onClick={() => setActiveIdx(isActive ? null : idx)}
                onMouseEnter={() => setHoverIdx(idx)}
                onMouseLeave={() => setHoverIdx(null)}
                style={{
                  borderRadius: 12,
                  padding: "6px 10px",
                  cursor: "pointer",
                  background: isActive ? getColor(idx) : "#f3f4f6",
                  color: isActive ? "#000" : "#111",
                  border: `1px solid ${getColor(idx)}`,
                  boxShadow: isHover && !isActive ? `0 0 0 2px ${getColor(idx)}` : "none",
                  transition: "box-shadow .15s, background .15s",
                }}
                title={`Option ${idx + 1} · ${km} km · ${min} min`}
                className="route-legend"
              >
                <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                  <span
                    style={{
                      display: "inline-block",
                      width: 10,
                      height: 10,
                      borderRadius: 999,
                      background: getColor(idx),
                    }}
                  />
                  Option {idx + 1} · {km} km · {min} min
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* map */}
      <div style={{ flex: 1, minHeight: 360 }}>
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={defaultCenter}
          zoom={10}
          onLoad={onLoadMap}
          onUnmount={onUnmountMap}
          options={{
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: false,
          }}
        >
          {/* Marker (filtered by activeIdx) */}
          {markersList.map((routeMarkers, routeIdx) =>
            (routeMarkers || []).map((marker, stopIdx) => {
              const show = activeIdx == null || activeIdx === routeIdx;
              if (!show) return null;
              return (
                <Marker
                  key={`${routeIdx}-${stopIdx}`}
                  position={{ lat: marker.lat, lng: marker.lng }}
                  label={{
                    text: `${routeIdx + 1}-${stopIdx + 1}`,
                    color: "#111",
                    fontWeight: "700",
                  }}
                  onClick={() =>
                    setSelectedStop({
                      position: { lat: marker.lat, lng: marker.lng },
                      title: marker.name || `Stop ${stopIdx + 1}`,
                      time: routeOptions?.[routeIdx]?.stops?.[stopIdx]?.time || "",
                      desc:
                        routeOptions?.[routeIdx]?.stops?.[stopIdx]?.description ||
                        "",
                      routeIdx,
                      stopIdx,
                    })
                  }
                />
              );
            })
          )}

          {/* InfoWindow：Bright style */}
          {selectedStop && (
            <InfoWindow
              position={selectedStop.position}
              onCloseClick={() => setSelectedStop(null)}
            >
              <div
                style={{
                  maxWidth: 260,
                  background: "#ffffff",
                  color: "#111827",
                  padding: "10px 12px",
                  borderRadius: 8,
                  lineHeight: 1.45,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                }}
              >
                <div style={{ fontWeight: 800, marginBottom: 6 }}>
                  {selectedStop.title}
                </div>
                {selectedStop.time && (
                  <div style={{ fontSize: 12, opacity: 0.9 }}>🕒 {selectedStop.time}</div>
                )}
                {selectedStop.desc && (
                  <div style={{ fontSize: 12, opacity: 0.95, marginTop: 6 }}>
                    {selectedStop.desc}
                  </div>
                )}
                <div style={{ fontSize: 12, marginTop: 8, opacity: 0.75 }}>
                  Route #{selectedStop.routeIdx + 1} · Stop {selectedStop.stopIdx + 1}
                </div>
              </div>
            </InfoWindow>
          )}

          {/* Route: highlights are thicker and brighter; inactive ones are semi-transparent */}
          {directionsList.map((dir, idx) => {
            if (!dir) return null;
            const isActive = activeIdx == null || activeIdx === idx;
            const isHover = hoverIdx === idx;
            return (
              <DirectionsRenderer
                key={`dir-${idx}`}
                directions={dir}
                options={{
                  suppressMarkers: true,
                  preserveViewport: true,
                  polylineOptions: {
                    strokeColor: getColor(idx),
                    strokeOpacity: isActive ? 0.95 : 0.35,
                    strokeWeight: isActive ? (isHover ? 7 : 6) : 3,
                    zIndex: isActive ? 10 : 1,
                  },
                }}
              />
            );
          })}
        </GoogleMap>
      </div>
    </div>
  );
}
