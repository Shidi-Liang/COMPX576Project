import { useState } from "react";

export default function RegisterForm({ onRegistered, onShowLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [msg, setMsg] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg("");

    if (password !== confirm) {
      setMsg("Passwords do not match");
      return;
    }

    try {
      const res = await fetch("http://localhost:3001/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.success) {
        setMsg("Registered successfully! Please log in.");
        // 通知 App.jsx：注册成功了
        if (onRegistered) onRegistered();
      } else {
        setMsg(data.message || "Registration failed");
      }
    } catch (err) {
      setMsg("Network error");
    }
  };

  return (
    <div>
      <h2>Create Account</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <input
          type="password"
          placeholder="Confirm Password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
        <button type="submit">Register</button>
      </form>

      {msg && <p>{msg}</p>}

      {/* 切换回登录的按钮 */}
      <p>
        Already have an account?{" "}
        <button type="button" onClick={onShowLogin}>
          Log in
        </button>
      </p>
    </div>
  );
}
