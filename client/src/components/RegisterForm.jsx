import { useState } from "react";
import "../Auth.css";

// Regular expression to validate email format
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Function to evaluate password strength (returns a score between 0 and 5)
function passwordStrength(pw) {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[a-z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return score; // 0-5
}

export default function RegisterForm({ onRegistered, onShowLogin }) {
  // React state hooks
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  // Calculate password strength dynamically
  const strength = passwordStrength(password);
  const weak = strength <= 2;

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg("");

    // Input validation
    if (!emailRegex.test(email)) return setMsg("Invalid email format.");
    if (password.length < 6) return setMsg("Password must be at least 6 characters.");
    if (password !== confirm) return setMsg("Passwords do not match.");

    setLoading(true);
    try {
      // Send POST request to backend API
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      // Attempt to parse the response as JSON
      const data = await res.json().catch(() => ({}));
      // Handle error or success response
      if (!res.ok || !data.success) {
        setMsg(data.message || `Registration failed (${res.status})`);
        return;
      }
      // If success, show message and trigger callback
      setMsg("Registered successfully! Please log in.");
      onRegistered?.();   // optional callback from parent component
    } catch {
      setMsg("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2 className="auth-title">Create Account</h2>
        <p className="auth-sub">Start your journey in one minute</p>

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
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
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
            <div className="small">
              Strength: {["Very weak","Weak","Medium","Good","Strong","Very strong"][strength]}
              {weak && " • Add numbers, symbols, upper/lowercase to improve."}
            </div>
          </div>

          <div className="auth-field">
            <label className="auth-label">Confirm password</label>
            <input
              className="auth-input"
              type={showPwd ? "text" : "password"}
              placeholder="Re-enter password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
              required
            />
          </div>

          <button className="auth-btn" type="submit" disabled={loading}>
            {loading ? <>Creating…<span className="spinner" /></> : "Register"}
          </button>

          {msg && <div className={`auth-msg ${/fail|error|invalid/i.test(msg) ? "error" : ""}`}>{msg}</div>}
        </form>

        <div className="auth-switch">
          Already have an account?
          <button className="auth-link" type="button" onClick={onShowLogin}>Log in</button>
        </div>
      </div>
    </div>
  );
}

