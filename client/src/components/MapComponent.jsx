import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  GoogleMap,
  Marker,
  DirectionsRenderer,
  InfoWindow,
  useJsApiLoader,
} from "@react-google-maps/api";

/** ─────────── 基础样式 ─────────── */
const containerStyle = { width: "100%", height: "100%" };
const defaultCenter = { lat: -36.8485, lng: 174.7633 }; // Auckland

/** 亮色调色板：更清晰 */
const getColor = (index) => {
  const palette = ["#00BFFF", "#FF4500", "#32CD32", "#FF1493", "#FFD700"]; // 天蓝/橙红/草绿/艳粉/金色
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
  const [activeIdx, setActiveIdx] = useState(null);        // 图例高亮：null=全部
  const [hoverIdx, setHoverIdx] = useState(null);          // 图例悬浮：临时加粗
  const [selectedStop, setSelectedStop] = useState(null);  // InfoWindow 数据

  /** ─────────── 工具函数 ─────────── */
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

  // 统计里程/时长（来自 DirectionsResult）
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

  /** 地名 → 坐标（自动补“, New Zealand”，打印失败 status） */
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

  /** 逐步剔除导致 ZERO_RESULTS 的中途点，直到能出可画路线 */
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

    // 逐个剔除中途点（最多剔 3 个）
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

    // 仍失败：退化为起点→终点
    const fallback = [coords[0], coords[coords.length - 1]];
    const { res: r3, status: s3 } = await ask(fallback);
    if (s3 === "OK") return { directions: r3, removedIdx: midIdxs };

    // 实在不行，返回空
    return { directions: null, removedIdx: midIdxs };
  }, []);

  /** 加载所有路线：geocode → 剔除容错求路 → 渲染 */
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

      // 2) 去掉相邻重复点（同一坐标会导致失败）
      const deduped = coords.filter((p, idx, arr) => {
        if (idx === 0) return true;
        const prev = arr[idx - 1];
        return p.lat !== prev.lat || p.lng !== prev.lng;
      });

      allMarkers.push(deduped);

      // 3) 请求 Directions（带“剔除不可达中途点”的容错）
      const { directions, removedIdx } = await requestDirectionsWithPruning(
        deduped
      );

      if (removedIdx?.length) {
        // 标注被剔除的点名，方便回头优化后端
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

    // 初次视野：包含当前可见路线的点
    const visible = activeIdx == null ? allMarkers : [allMarkers[activeIdx] || []];
    fitToBounds(visible);
  }, [isLoaded, routeOptions, requestDirectionsWithPruning, geocodePlaces, fitToBounds, activeIdx]);

  useEffect(() => { loadRoutes(); }, [loadRoutes]);

  const onLoadMap = useCallback((map) => (mapRef.current = map), []);
  const onUnmountMap = useCallback(() => (mapRef.current = null), []);

  if (!isLoaded) return <div style={{ padding: 12 }}>Loading Map…</div>;

  /** ─────────── 渲染 ─────────── */
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* 图例：浅底 + 彩色边框；点击高亮、悬浮描边 */}
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

      {/* 地图 */}
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
          {/* Marker（按 activeIdx 过滤） */}
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

          {/* InfoWindow：亮色样式 */}
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

          {/* 路线：高亮更粗更亮；非激活半透明 */}
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
