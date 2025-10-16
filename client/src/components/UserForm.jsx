import React, { useState } from "react";
import { authFetch } from "../api";

/**
 * - The start and end points are passed in from the parent component (MapPage's Autocomplete)
 * - Click Generate to call /generate-route (just { start, end })
 * - After parsing, pass it to onResults
 * - Generate successfully → English prompt is displayed at the top (disappears automatically after 3 seconds)
 */
export default function UserForm({
  start,
  end,
  onResults,
  // Reserved: coordinates not needed yet
  startCoord,
  endCoord,
}) {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [message, setMessage] = useState(""); // Success Tips

  const canGenerate = !!(start && end);

  const handleGenerate = async () => {
    if (!canGenerate) return;
    setLoading(true);
    setErr("");
    setMessage(""); // Clear the last prompt before each click

    try {
      const res = await authFetch("/api/route/generate-route", {
        method: "POST",
        body: JSON.stringify({ start, end }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setErr(data.message || `HTTP ${res.status}`);
        return;
      }
      if (!data?.success || !data?.result) {
        setErr(data?.error || data?.message || "Server returned no result");
        return;
      }

      // Parse the JSON string returned by the backend
      let routeOptions = [];
      try {
        routeOptions = JSON.parse(data.result);
      } catch {
        const m = String(data.result).match(/\[[\s\S]*\]|\{[\s\S]*\}/);
        if (m) routeOptions = JSON.parse(m[0]);
      }

      if (!Array.isArray(routeOptions) || routeOptions.length === 0) {
        setErr("Parsed route list is empty");
        return;
      }

      // Hand it over to the parent component for rendering
      onResults?.(routeOptions);

      // Display success prompt
      setMessage("Route has been successfully generated!");
      // Automatically clear the reminder after 3 seconds
      setTimeout(() => setMessage(""), 3000);
    } catch (e) {
      setErr("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
      <div className="small" style={{ color: "var(--muted)" }}>
        {start ? `From: ${start}` : "Pick start…"} &nbsp;→&nbsp;
        {end ? `To: ${end}` : "Pick destination…"}
      </div>

      <button
        className="btn btn-primary"
        onClick={handleGenerate}
        disabled={!canGenerate || loading}
        title={!canGenerate ? "Please pick start and destination above" : ""}
      >
        {loading ? "Generating…" : "Generate"}
      </button>

      {/* Success prompt bar (no interruption, automatically disappears after 3 seconds) */}
      {message && (
        <div
          role="status"
          aria-live="polite"
          style={{
            padding: "6px 12px",
            borderRadius: 8,
            background: "#e6ffed",
            color: "#027a48",
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          {message}
        </div>
      )}

      {/* error message */}
      {err && (
        <div
          className="auth-msg error"
          style={{
            marginLeft: 8,
            color: "#dc2626",
            fontSize: 14,
            fontWeight: 500,
          }}
        >
          {err}
        </div>
      )}
    </div>
  );
}
