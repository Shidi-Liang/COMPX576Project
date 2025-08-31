// src/pages/MapPage.jsx
import React, { useEffect, useState } from "react";
import UserForm from "../components/UserForm";
import MapComponent from "../components/MapComponent";
import TimelineView from "../components/TimelineView";
import { authFetch } from "../api";
import "../Auth.css";

const Drawer = ({ open, onClose, title, children }) => {
  return (
    <>
      {/* 背景遮罩 */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,.3)",
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
          transition: "opacity .15s ease",
          zIndex: 1998,
        }}
      />
      {/* 右侧抽屉 */}
      <aside
        style={{
          position: "fixed",
          top: 0, right: 0, bottom: 0,
          width: "360px",
          background: "var(--card)",
          color: "var(--text)",
          borderLeft: "1px solid rgba(100,116,139,.25)",
          boxShadow: "0 8px 30px rgba(0,0,0,.25)",
          transform: open ? "translateX(0)" : "translateX(100%)",
          transition: "transform .2s ease",
          zIndex: 1999,
          display: "flex",
          flexDirection: "column"
        }}
      >
        <div style={{ padding: "12px 16px", borderBottom: "1px solid rgba(100,116,139,.2)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <strong>{title}</strong>
          <button onClick={onClose} className="logout-btn">Close</button>
        </div>
        <div style={{ padding: 16, overflow: "auto", flex: 1 }}>
          {children}
        </div>
      </aside>
    </>
  );
};

export default function MapPage({ user, showSavedRoutes, onCloseSavedRoutes }) {
  const [routeOptions, setRouteOptions] = useState([]);
  const [selectedOption, setSelectedOption] = useState(0);

  // saved routes
  const [savedRoutes, setSavedRoutes] = useState([]);
  const [loadingSaved, setLoadingSaved] = useState(false);
  const [errSaved, setErrSaved] = useState("");

  useEffect(() => {
    async function loadSaved() {
      if (!showSavedRoutes) return;
      setLoadingSaved(true);
      setErrSaved("");
      try {
        const res = await authFetch("http://localhost:3001/api/route/my-routes");
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.success) {
          setSavedRoutes(data.routes || []);
        } else {
          setErrSaved(data.message || `Failed to load routes (${res.status})`);
        }
      } catch {
        setErrSaved("Network error");
      } finally {
        setLoadingSaved(false);
      }
    }
    loadSaved();
  }, [showSavedRoutes]);

  const saveRoute = async () => {
    const selectedRoute = routeOptions[selectedOption];
    if (!selectedRoute) return alert("No route selected");

    try {
      const response = await authFetch("http://localhost:3001/api/route/save-route", {
        method: "POST",
        body: JSON.stringify({
          userId: user?.id, // 你后端现在返回的是 { id, email }
          title: `My Trip - ${new Date().toLocaleString()}`,
          stops: selectedRoute.stops,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (response.ok && data.success) {
        alert("Route saved successfully!");
        // 刷新右侧抽屉里的列表（如果当前正打开）
        if (showSavedRoutes) {
          try {
            const res = await authFetch("http://localhost:3001/api/route/my-routes");
            const d2 = await res.json();
            if (res.ok && d2.success) setSavedRoutes(d2.routes || []);
          } catch {}
        }
      } else {
        alert(data.message || `Failed to save route (${response.status})`);
      }
    } catch {
      alert("Network error");
    }
  };

  return (
    <div>
      <h1>Smart Travel Buddy</h1>

      <UserForm onResults={setRouteOptions} />

      {routeOptions.length > 0 && (
        <>
          <div style={{ marginBottom: "10px" }}>
            {routeOptions.map((option, index) => (
              <button
                key={index}
                onClick={() => setSelectedOption(index)}
                style={{
                  marginRight: "10px",
                  fontWeight: selectedOption === index ? "bold" : "normal",
                }}
              >
                Option {index + 1}
              </button>
            ))}
          </div>

          <div style={{ marginBottom: "20px" }}>
            <TimelineView stops={routeOptions[selectedOption]?.stops || []} />
          </div>

          <button onClick={saveRoute}>Save Route</button>
        </>
      )}

      <div style={{ height: "500px" }}>
        <MapComponent routeOptions={routeOptions} />
      </div>

      {/* 右侧抽屉：我的路线 */}
      <Drawer open={showSavedRoutes} onClose={onCloseSavedRoutes} title="My Saved Routes">
        {loadingSaved ? (
          <div>Loading…</div>
        ) : errSaved ? (
          <div className="auth-msg error">{errSaved}</div>
        ) : savedRoutes.length === 0 ? (
          <div className="auth-msg">No saved routes yet.</div>
        ) : (
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 10 }}>
            {savedRoutes.map(r => (
              <li key={r._id} style={{ border: "1px solid rgba(100,116,139,.25)", borderRadius: 10, padding: 12 }}>
                <div style={{ fontWeight: 600 }}>{r.title}</div>
                <div className="small" style={{ marginTop: 4 }}>{(r.stops || []).length} stops</div>
                {/* 你可以在这里加“查看到地图上”的按钮 */}
              </li>
            ))}
          </ul>
        )}
      </Drawer>
    </div>
  );
}
