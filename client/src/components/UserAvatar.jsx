import React from "react";
import "../Auth.css";

// Extract initials from mailbox
function initialsFromEmail(email = "") {
  const name = email.split("@")[0] || "";
  const parts = name
    .replace(/[^a-zA-Z0-9_.-]/g, " ")  
    .split(/[\s._-]+/)
    .filter(Boolean);
  const first = parts[0]?.[0] ?? email[0] ?? "U";
  const second = parts[1]?.[0] ?? "";
  return (first + second).toUpperCase();
}

// Generate a fixed color based on a string
function colorFromString(str = "") {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue} 70% 45%)`;
}

export default function UserAvatar({ email, size = 36, onClick }) {
  const initials = initialsFromEmail(email);
  const bg = colorFromString(email);

  const style = {
    width: size,
    height: size,
    borderRadius: "50%",
    background: bg,
    color: "#fff",
    display: "grid",
    placeItems: "center",
    fontWeight: 700,
    userSelect: "none",
    boxShadow: "0 2px 8px rgba(0,0,0,.2)",
    cursor: onClick ? "pointer" : "default",
  };

  return (
    <div title={email} style={style} onClick={onClick}>
      {initials}
    </div>
  );
}
