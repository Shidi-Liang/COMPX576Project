import React, { useState } from "react";
import "../Auth.css";

// Basic email validation regex
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Login form component
const LoginForm = ({ onLogin, onShowRegister }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg("");

    // Basic input validation
    if (!emailRegex.test(email)) return setMsg("Invalid email format.");
    if (!password) return setMsg("Password is required.");

    setLoading(true);
    try {
      // Send login request to backend API
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      // Parse JSON response safely
      const data = await res.json().catch(() => ({}));
      // Handle success or failure
      if (!res.ok || !data.success) {
        setMsg(data.message || `Login failed (${res.status})`);
        return;
      }
      onLogin?.(data.user, remember, data.token); // Pass it to App.jsx to decide whether to write to localStorage
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

        {/* Login form */}
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

