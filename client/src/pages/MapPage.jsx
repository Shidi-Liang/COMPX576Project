import React, { useEffect, useRef, useState } from "react";
import UserForm from "../components/UserForm";
import MapComponent from "../components/MapComponent";
import TimelineView from "../components/TimelineView";
import { authFetch } from "../api";
import "../Auth.css";

// 只引入 Autocomplete（不要 useJsApiLoader）
import { Autocomplete } from "@react-google-maps/api";

/** Right-side Drawer */
const Drawer = ({ open, onClose, title, children }) => (
  <>
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,.3)",
        opacity: open ? 1 : 0,
        pointerEvents: open ? "auto" : "none",
        transition: "opacity .15s",
        zIndex: 8999,
      }}
    />
    <aside
      style={{
        position: "fixed",
        top: 0,
        right: 0,
        bottom: 0,
        width: 360,
        background: "var(--card)",
        color: "var(--text)",
        borderLeft: "1px solid rgba(100,116,139,.25)",
        boxShadow: "0 8px 30px rgba(0,0,0,.25)",
        transform: open ? "translateX(0)" : "translateX(100%)",
        transition: "transform .2s",
        zIndex: 9000,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          padding: "12px 16px",
          borderBottom: "1px solid rgba(100,116,139,.2)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <strong>{title}</strong>
        <button onClick={onClose} className="logout-btn">Close</button>
      </div>
      <div style={{ padding: 16, overflow: "auto", flex: 1 }}>{children}</div>
    </aside>
  </>
);

export default function MapPage({ user, showSavedRoutes, onCloseSavedRoutes }) {
  // ---- Autocomplete inputs ----
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [startCoord, setStartCoord] = useState(null);
  const [endCoord, setEndCoord] = useState(null);
  const startAutoRef = useRef(null);
  const endAutoRef = useRef(null);

  // ✅ 等待 MapComponent 加载好的 Google 脚本（只检测，不加载）
  const [gmReady, setGmReady] = useState(
    typeof window !== "undefined" && !!window.google?.maps?.places
  );
  useEffect(() => {
    if (gmReady) return;
    let timer;
    const tick = () => {
      if (window.google?.maps?.places) {
        setGmReady(true);
        if (timer) clearTimeout(timer);
      } else {
        timer = setTimeout(tick, 150);
      }
    };
    tick();
    return () => timer && clearTimeout(timer);
  }, [gmReady]);

  const handlePlaceChanged = (which) => {
    const ac = which === "start" ? startAutoRef.current : endAutoRef.current;
    if (!ac?.getPlace) return; // 安全保护
    const place = ac.getPlace();
    if (!place) return;

    const addr = place.formatted_address || place.name || "";
    const loc = place.geometry?.location;
    const coords = loc ? { lat: loc.lat(), lng: loc.lng() } : null;

    if (which === "start") {
      setStart(addr);
      if (coords) setStartCoord(coords);
    } else {
      setEnd(addr);
      if (coords) setEndCoord(coords);
    }

    // 如果你想选完就触发路线生成，可以在这里调用你的函数：
    // if (startCoord && endCoord) generateRoutes(startCoord, endCoord);
  };

  // ---- Route options / saved routes ----
  const [routeOptions, setRouteOptions] = useState([]);
  const [selectedOption, setSelectedOption] = useState(0);

  const [savedRoutes, setSavedRoutes] = useState([]);
  const [loadingSaved, setLoadingSaved] = useState(false);
  const [errSaved, setErrSaved] = useState("");
  const [activeSavedRoute, setActiveSavedRoute] = useState(null);

  useEffect(() => {
    if (!showSavedRoutes) return;
    (async () => {
      setLoadingSaved(true);
      setErrSaved("");
      try {
        const res = await authFetch("http://localhost:3001/api/route/my-routes");
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.success) setSavedRoutes(data.routes || []);
        else setErrSaved(data.message || `Failed to load routes (${res.status})`);
      } catch {
        setErrSaved("Network error");
      } finally {
        setLoadingSaved(false);
      }
    })();
  }, [showSavedRoutes]);

  const loadRouteToMap = (route) => {
    const stops = route?.stops || [];
    setRouteOptions([{ stops }]);
    setSelectedOption(0);
    setActiveSavedRoute(null);
    onCloseSavedRoutes?.();
  };

  const saveRoute = async () => {
    const selectedRoute = routeOptions[selectedOption];
    if (!selectedRoute) return alert("No route selected");
    try {
      const res = await authFetch("http://localhost:3001/api/route/save-route", {
        method: "POST",
        body: JSON.stringify({
          userId: user?.id,
          title: `My Trip - ${new Date().toLocaleString()}`,
          stops: selectedRoute.stops,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        alert("Route saved successfully!");
        if (showSavedRoutes) {
          const r2 = await authFetch("http://localhost:3001/api/route/my-routes");
          const d2 = await r2.json();
          if (r2.ok && d2.success) setSavedRoutes(d2.routes || []);
        }
      } else {
        alert(data.message || `Failed to save route (${res.status})`);
      }
    } catch {
      alert("Network error");
    }
  };

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">Smart Travel Buddy</h1>
        <p className="page-sub">Plan, filter and visualise your trip.</p>
      </div>

      {/* Start / Destination with Google Autocomplete */}
      <div
        style={{
          display: "flex",
          gap: 12,
          marginTop: 8,
          marginBottom: 8,
          position: "relative",
          zIndex: 5000, // 确保下拉在地图之上
          flexWrap: "wrap",
        }}
      >
        {/* Start */}
        {gmReady ? (
          <Autocomplete
            onLoad={(ac) => (startAutoRef.current = ac)}
            onPlaceChanged={() => handlePlaceChanged("start")}
            options={{
              componentRestrictions: { country: "nz" },
              fields: ["formatted_address", "geometry", "name", "place_id"],
              types: ["geocode"],
            }}
          >
            <input
              value={start}
              onChange={(e) => setStart(e.target.value)}
              placeholder="Start address (New Zealand)"
              style={{ padding: "10px 12px", width: 320, borderRadius: 8 }}
            />
          </Autocomplete>
        ) : (
          <input
            value={start}
            onChange={(e) => setStart(e.target.value)}
            placeholder="Start address (loading Maps…)"
            style={{ padding: "10px 12px", width: 320, borderRadius: 8 }}
          />
        )}

        {/* Destination */}
        {gmReady ? (
          <Autocomplete
            onLoad={(ac) => (endAutoRef.current = ac)}
            onPlaceChanged={() => handlePlaceChanged("end")}
            options={{
              componentRestrictions: { country: "nz" },
              fields: ["formatted_address", "geometry", "name", "place_id"],
              types: ["geocode"],
            }}
          >
            <input
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              placeholder="Destination (New Zealand)"
              style={{ padding: "10px 12px", width: 320, borderRadius: 8 }}
            />
          </Autocomplete>
        ) : (
          <input
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            placeholder="Destination (loading Maps…)"
            style={{ padding: "10px 12px", width: 320, borderRadius: 8 }}
          />
        )}
      </div>

      {/* 你的生成工具条 */}
      <UserForm
        start={start}
        end={end}
        startCoord={startCoord}
        endCoord={endCoord}
        onResults={setRouteOptions}
      />


      {/* Options + Timeline */}
      {routeOptions.length > 0 && (
        <>
          <div
            className="seg"
            role="tablist"
            aria-label="Route options"
            style={{ margin: "8px 0 12px" }}
          >
            {routeOptions.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setSelectedOption(idx)}
                aria-pressed={selectedOption === idx}
              >
                Option {idx + 1}
              </button>
            ))}
          </div>

          <section className="timeline-card" style={{ marginBottom: 12 }}>
            <h3 style={{ marginTop: 0 }}>🧭 Timeline View</h3>
            <div className="tl">
              <TimelineView stops={routeOptions[selectedOption]?.stops || []} />
            </div>
            <div className="actions">
              <button className="btn btn-primary" onClick={saveRoute}>
                Save Route
              </button>
            </div>
          </section>
        </>
      )}

      {/* Map */}
      <div className="map-shell" style={{ height: "62vh", marginTop: 12 }}>
        <MapComponent routeOptions={routeOptions} />
      </div>

      {/* Drawer */}
      <Drawer
        open={showSavedRoutes}
        onClose={onCloseSavedRoutes}
        title="My Saved Routes"
      >
        {loadingSaved ? (
          <div>Loading…</div>
        ) : errSaved ? (
          <div className="auth-msg error">{errSaved}</div>
        ) : activeSavedRoute ? (
          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 12,
              }}
            >
              <h3 style={{ margin: 0 }}>{activeSavedRoute.title}</h3>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="logout-btn" onClick={() => loadRouteToMap(activeSavedRoute)}>
                  Load to map
                </button>
                <button className="logout-btn" onClick={() => setActiveSavedRoute(null)}>
                  Back
                </button>
              </div>
            </div>

            <ol style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {(activeSavedRoute.stops || []).map((s, idx) => (
                <li
                  key={idx}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "28px 1fr",
                    gap: 12,
                    marginBottom: 14,
                  }}
                >
                  <div style={{ position: "relative" }}>
                    <div
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: 999,
                        background: "var(--primary)",
                        marginTop: 4,
                      }}
                    />
                    {idx !== activeSavedRoute.stops.length - 1 && (
                      <div
                        style={{
                          position: "absolute",
                          left: 4,
                          top: 14,
                          bottom: -14,
                          width: 2,
                          background: "rgba(100,116,139,.3)",
                        }}
                      />
                    )}
                  </div>
                  <div
                    style={{
                      border: "1px solid rgba(100,116,139,.25)",
                      borderRadius: 10,
                      padding: "8px 10px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "baseline",
                        gap: 8,
                      }}
                    >
                      <strong>{s.place}</strong>
                      {s.time && <span className="small">{s.time}</span>}
                    </div>
                    {s.description && (
                      <div style={{ marginTop: 6, color: "var(--muted)", fontSize: 14 }}>
                        {s.description}
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </div>
        ) : savedRoutes.length === 0 ? (
          <div className="auth-msg">No saved routes yet.</div>
        ) : (
          <ul
            style={{
              listStyle: "none",
              padding: 0,
              margin: 0,
              display: "grid",
              gap: 12,
            }}
          >
            {savedRoutes.map((r) => (
              <li
                key={r._id}
                onClick={() => setActiveSavedRoute(r)}
                style={{
                  border: "1px solid rgba(100,116,139,.25)",
                  borderRadius: 14,
                  padding: 14,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div style={{ fontWeight: 700 }}>{r.title}</div>
                <div className="small">{(r.stops || []).length} stops</div>
              </li>
            ))}
          </ul>
        )}
      </Drawer>
    </div>
  );
}
