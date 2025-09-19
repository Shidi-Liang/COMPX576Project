// src/components/MapComponent.jsx
import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  GoogleMap,
  Marker,
  DirectionsRenderer,
  useJsApiLoader,
} from "@react-google-maps/api";

const containerStyle = { width: "100%", height: "100%" }; // 跟随父容器高度
const defaultCenter = { lat: -36.8485, lng: 174.7633 };
const getRouteColor = (i) => `hsl(${(i * 75) % 360}, 100%, 50%)`;

const POI_EMOJI = {
  restaurant: "🍜",
  gas_station: "⛽",
  supermarket: "🛒",
  toilet: "🚻",
};

const MapComponent = ({ routeOptions, onAddPoi }) => {
  const [routeMarkersList, setRouteMarkersList] = useState([]); // array<array<{lat,lng,name}>>
  const [directionsList, setDirectionsList] = useState([]); // array<google.maps.DirectionsResult|null>
  const [poiMarkers, setPoiMarkers] = useState([]); // array<{placeId,pos,name,type,rating,openNow,address}>
  const [selectedTypes, setSelectedTypes] = useState(
    new Set(["restaurant", "gas_station", "supermarket", "toilet"])
  );

  const mapRef = useRef(null);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    libraries: ["places", "geometry"],
  });

  // ---------- Helpers ----------
  const haversineKm = (a, b) => {
    const R = 6371;
    const dLat = ((b.lat - a.lat) * Math.PI) / 180;
    const dLng = ((b.lng - a.lng) * Math.PI) / 180;
    const s1 =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((a.lat * Math.PI) / 180) *
        Math.cos((b.lat * Math.PI) / 180) *
        Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(s1));
  };

  const samplePointsFromDirections = (directions, stepMeters = 1000, cap = 12) => {
    if (!window.google) return [];
    const route = directions?.routes?.[0];
    if (!route) return [];
    const pointsStr =
      route.overview_polyline?.points ||
      route.overviewPolyline?.points ||
      route.overview_polyline;
    const path = window.google.maps.geometry.encoding.decodePath(pointsStr);
    const out = [];
    let last = null;
    for (const ll of path) {
      const p = { lat: ll.lat(), lng: ll.lng() };
      if (!last || haversineKm(last, p) * 1000 >= stepMeters) {
        out.push(p);
        last = p;
      }
    }
    return out.slice(0, cap);
  };

  // ---------- Geocode & Directions ----------
  const geocodePlaces = async (places) => {
    if (!window.google) return [];
    const geocoder = new window.google.maps.Geocoder();
    const results = await Promise.all(
      places.map(
        (place) =>
          new Promise((resolve) => {
            geocoder.geocode({ address: place }, (res, status) => {
              if (status === "OK" && res?.[0]) {
                const { lat, lng } = res[0].geometry.location;
                resolve({ lat: lat(), lng: lng(), name: place });
              } else {
                console.warn("Geocode failed:", place, status);
                resolve(null);
              }
            });
          })
      )
    );
    return results.filter(Boolean);
  };

  const loadRoutes = useCallback(async () => {
    if (!isLoaded || !routeOptions?.length || !window.google) return;

    const allRouteMarkers = [];
    const allDirections = [];

    for (let i = 0; i < routeOptions.length; i++) {
      const stops = routeOptions[i].stops.map((s) => s.place);
      const coords = await geocodePlaces(stops);
      if (coords.length < 2) {
        console.warn(`Skipping route ${i + 1}: not enough coords`);
        allRouteMarkers.push([]);
        allDirections.push(null);
        continue;
      }
      allRouteMarkers.push(coords);

      const svc = new window.google.maps.DirectionsService();
      const dir = await new Promise((resolve) => {
        svc.route(
          {
            origin: coords[0],
            destination: coords[coords.length - 1],
            waypoints: coords
              .slice(1, -1)
              .map((loc) => ({ location: loc, stopover: true })),
            travelMode: window.google.maps.TravelMode.DRIVING,
            provideRouteAlternatives: false,
          },
          (res, status) => resolve(status === "OK" ? res : null)
        );
      });
      allDirections.push(dir);
    }

    setRouteMarkersList(allRouteMarkers);
    setDirectionsList(allDirections);
  }, [isLoaded, routeOptions]);

  useEffect(() => {
    loadRoutes();
  }, [loadRoutes]);

  // ---------- POIs along the first route ----------
  const fetchPoisAlongRoute = async () => {
    if (!window.google) return;
    const map = mapRef.current;
    const first = directionsList?.[0];
    if (!map || !first) return;

    const samples = samplePointsFromDirections(first, 1000, 12);
    const service = new window.google.maps.places.PlacesService(map);
    const seen = new Set();
    const results = [];

    const nearby = (req) =>
      new Promise((resolve) => {
        service.nearbySearch(req, (res, status) => {
          if (
            status === window.google.maps.places.PlacesServiceStatus.OK &&
            Array.isArray(res)
          )
            resolve(res);
          else resolve([]);
        });
      });

    const activeTypes = ["restaurant", "gas_station", "supermarket", "toilet"].filter(
      (t) => selectedTypes.has(t)
    );

    for (const p of samples) {
      const loc = new window.google.maps.LatLng(p.lat, p.lng);

      for (const t of activeTypes) {
        const req = {
          location: loc,
          radius: 400,
          type: t === "toilet" ? undefined : t,
          keyword: t === "toilet" ? "toilet" : undefined,
        };
        const res = await nearby(req);

        for (const item of res.slice(0, 3)) {
          const pid = item.place_id;
          if (seen.has(pid)) continue;
          seen.add(pid);

          results.push({
            placeId: pid,
            pos: {
              lat: item.geometry.location.lat(),
              lng: item.geometry.location.lng(),
            },
            name: item.name,
            type: t,
            rating: item.rating,
            openNow:
              item.opening_hours?.isOpen?.() ?? item.opening_hours?.open_now,
            address: item.vicinity,
          });
        }
      }
    }

    setPoiMarkers(results);
  };

  const clearPois = () => setPoiMarkers([]);

  const handleAddPoi = (poi) => {
    if (onAddPoi) onAddPoi(poi);
    else alert(`Added: ${poi.name}`);
  };

  const toggleType = (key) => {
    setSelectedTypes((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  // ---------- Map lifecycle ----------
  const onMapLoad = (map) => {
    mapRef.current = map;
  };
  const onMapUnmount = () => {
    mapRef.current = null;
  };

  if (!isLoaded) return <div>Loading Map...</div>;

  return (
    // 这层非常关键：供工具条做绝对定位 & 提供高度上下文
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={defaultCenter}
        zoom={12}
        onLoad={onMapLoad}
        onUnmount={onMapUnmount}
        options={{
          mapTypeControl: false,
          fullscreenControl: false,
          zoomControl: true,
        }}
      >
        {/* Route stop markers */}
        {routeMarkersList.map((routeMarkers, routeIdx) =>
          routeMarkers.map((m, stopIdx) => (
            <Marker
              key={`${routeIdx}-${stopIdx}`}
              position={{ lat: m.lat, lng: m.lng }}
              label={`${routeIdx + 1}-${stopIdx + 1}`}
            />
          ))
        )}

        {/* Routes */}
        {directionsList.map((dir, idx) =>
          dir ? (
            <DirectionsRenderer
              key={idx}
              directions={dir}
              options={{
                suppressMarkers: true,
                preserveViewport: true,
                polylineOptions: {
                  strokeColor: getRouteColor(idx),
                  strokeWeight: 4,
                },
              }}
            />
          ) : null
        )}

        {/* POI markers (filtered) */}
        {poiMarkers
          .filter((p) => selectedTypes.has(p.type))
          .map((poi) => (
            <Marker
              key={poi.placeId}
              position={poi.pos}
              label={POI_EMOJI[poi.type] || "📍"}
              title={`${poi.name} • ${poi.type}${
                poi.rating ? ` • ★ ${poi.rating}` : ""
              }${
                poi.openNow === true
                  ? " • Open now"
                  : poi.openNow === false
                  ? " • Closed"
                  : ""
              }`}
              onClick={() => handleAddPoi(poi)}
            />
          ))}
      </GoogleMap>

      {/* Floating POI toolbar（移到 GoogleMap 外侧，与之同级） */}
      <div
        style={{
          position: "absolute",
          top: 12,
          left: 12,
          zIndex: 3000,
          display: "flex",
          gap: 8,
          background: "rgba(255,255,255,0.9)",
          backdropFilter: "blur(8px)",
          borderRadius: 12,
          padding: "6px 8px",
          boxShadow: "0 6px 16px rgba(0,0,0,0.18)",
        }}
      >
        {Object.keys(POI_EMOJI).map((k) => (
          <button
            key={k}
            onClick={() => toggleType(k)}
            style={{
              padding: "6px 10px",
              borderRadius: 999,
              border: "1px solid #d1d5db",
              background: selectedTypes.has(k) ? "#111827" : "#ffffff",
              color: selectedTypes.has(k) ? "#ffffff" : "#111827",
              cursor: "pointer",
            }}
            title={k}
          >
            {POI_EMOJI[k]} {k.replace("_", " ")}
          </button>
        ))}
        <button
          onClick={fetchPoisAlongRoute}
          style={{
            padding: "6px 10px",
            borderRadius: 8,
            border: "1px solid #111827",
            background: "#111827",
            color: "#fff",
            cursor: "pointer",
          }}
        >
          Show POIs
        </button>
        <button
          onClick={clearPois}
          style={{
            padding: "6px 10px",
            borderRadius: 8,
            border: "1px solid #d1d5db",
            background: "#fff",
            cursor: "pointer",
          }}
        >
          Clear
        </button>
      </div>
    </div>
  );
};

export default MapComponent;
