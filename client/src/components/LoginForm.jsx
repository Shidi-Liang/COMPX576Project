/*import React, { useState } from "react";
import "../Auth.css";

const LoginForm = ({ onLogin, onShowRegister }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg("");
    setLoading(true);
    try {
      const res = await fetch("http://localhost:3001/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        setMsg(data.message || `Login failed (${res.status})`);
        return;
      }
      onLogin?.(data.user);
    } catch {
      setMsg("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2 className="auth-title">Welcome back</h2>
        <p className="auth-sub">Log in to continue</p>

        <form onSubmit={handleSubmit} noValidate>
          <div className="auth-field">
            <label className="auth-label">Email</label>
            <input
              className="auth-input"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="auth-field">
            <label className="auth-label">Password</label>
            <div className="auth-input-wrap">
              <input
                className="auth-input"
                type={showPwd ? "text" : "password"}
                placeholder="Your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                className="auth-eye"
                onClick={() => setShowPwd((s) => !s)}
                aria-label="Toggle password visibility"
              >
                {showPwd ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <button className="auth-btn" type="submit" disabled={loading}>
            {loading ? "Signing in…" : "Login"}
          </button>

          {msg && <div className={`auth-msg ${msg.includes("failed") || msg.includes("error") ? "error" : ""}`}>{msg}</div>}
        </form>

        <div className="auth-switch">
          New here?
          <button className="auth-link" type="button" onClick={onShowRegister}>Create an account</button>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;*/

import React, { useState } from "react";
import "../Auth.css";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const LoginForm = ({ onLogin, onShowRegister }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg("");

    if (!emailRegex.test(email)) return setMsg("Invalid email format.");
    if (!password) return setMsg("Password is required.");

    setLoading(true);
    try {
      const res = await fetch("http://localhost:3001/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        setMsg(data.message || `Login failed (${res.status})`);
        return;
      }
      onLogin?.(data.user, remember, data.token); // 传给 App.jsx，决定是否写 localStorage
    } catch {
      setMsg("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2 className="auth-title">Welcome back</h2>
        <p className="auth-sub">Log in to continue</p>

        <form onSubmit={handleSubmit} noValidate>
          <div className="auth-field">
            <label className="auth-label">Email</label>
            <input
              className="auth-input"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>

          <div className="auth-field">
            <label className="auth-label">Password</label>
            <div className="auth-input-wrap">
              <input
                className="auth-input"
                type={showPwd ? "text" : "password"}
                placeholder="Your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="auth-eye"
                onClick={() => setShowPwd((s) => !s)}
              >
                {showPwd ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <div className="auth-field" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
              />
              Remember me
            </label>
            <span className="small">Forgot password?</span>
          </div>

          <button className="auth-btn" type="submit" disabled={loading}>
            {loading ? <>Signing in…<span className="spinner" /></> : "Login"}
          </button>

          {msg && <div className={`auth-msg ${/fail|error|invalid/i.test(msg) ? "error" : ""}`}>{msg}</div>}
        </form>

        <div className="auth-switch">
          New here?
          <button className="auth-link" type="button" onClick={onShowRegister}>Create an account</button>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;

