// src/components/UserForm.jsx
import React, { useState } from "react";
import { authFetch } from "../api";

/**
 * 简化后的 UserForm
 * - 起终点从父组件传入（MapPage 的 Autocomplete）
 * - 点击 Generate 调 /generate-route（只要 { start, end }）
 * - 解析后交给 onResults
 * - 生成成功 → 顶部显示英文提示（3 秒自动消失）
 */
export default function UserForm({
  start,
  end,
  onResults,
  // 预留：坐标暂不需要
  startCoord,
  endCoord,
}) {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [message, setMessage] = useState(""); // ✅ 成功提示

  const canGenerate = !!(start && end);

  const handleGenerate = async () => {
    if (!canGenerate) return;
    setLoading(true);
    setErr("");
    setMessage(""); // 每次点击前先清空上一次的提示

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

      // 解析后端返回的 JSON 字符串
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

      // 交给父组件渲染
      onResults?.(routeOptions);

      // ✅ 显示成功提示（英文）
      setMessage("Route has been successfully generated!");
      // 如需原生弹窗，打开下一行：
      // alert("✅ Route has been successfully generated!");

      // 3s 后自动清除提示
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

      {/* ✅ 成功提示条（无打断，3 秒自动消失） */}
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

      {/* 错误信息 */}
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
