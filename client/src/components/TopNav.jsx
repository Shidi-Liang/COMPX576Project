// src/components/TopNav.jsx
import React, { useEffect, useRef, useState } from "react";
import "../Auth.css";
import UserAvatar from "./UserAvatar";

export default function TopNav({ user, onLogout, onProfile, onSettings, onMyRoutes }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  const btnRef = useRef(null);

  useEffect(() => {
    function onDocClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target) && !btnRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    function onEsc(e) { if (e.key === "Escape") setOpen(false); }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, []);

  useEffect(() => {
    if (open && menuRef.current) {
      const first = menuRef.current.querySelector(".menu-item");
      first?.focus();
    } else if (!open) {
      btnRef.current?.focus();
    }
  }, [open]);

  return (
    <header className="topnav">
      <div className="brand">Smart Travel Buddy</div>

      <div className="nav-right">
        <button
          ref={btnRef}
          className="avatar-btn"
          aria-haspopup="menu"
          aria-expanded={open}
          onClick={() => setOpen(s => !s)}
          title={user?.email}
        >
          <UserAvatar email={user?.email} size={32} />
        </button>

        <span className="email-hide-sm">{user?.email}</span>

        {open && (
          <div ref={menuRef} className="dropdown-menu animate-pop" role="menu" aria-label="User menu">
            <div className="menu-header">{user?.email}</div>

            <button className="menu-item" role="menuitem" onClick={() => { onProfile?.(); setOpen(false); }}>
              <svg className="mi icon-green" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5Zm0 2c-4.418 0-8 2.239-8 5v1h16v-1c0-2.761-3.582-5-8-5Z"/>
              </svg>
              Profile
            </button>

            <button className="menu-item" role="menuitem" onClick={() => { onSettings?.(); setOpen(false); }}>
              <svg className="mi icon-blue" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M19.14 12.94a7.99 7.99 0 0 0 .05-.94 7.99 7.99 0 0 0-.05-.94l2.03-1.58a.5.5 0 0 0 .12-.64l-1.92-3.32a.5.5 0 0 0-.6-.22l-2.39.96a7.7 7.7 0 0 0-1.62-.94l-.36-2.54A.5.5 0 0 0 12.96 1h-3.92a.5.5 0 0 0-.49.42l-.36 2.54c-.57.23-1.11.53-1.62.94l-2.39-.96a.5.5 0 0 0-.6.22L1.66 7.98a.5.5 0 0 0 .12.64l2.03 1.58c-.03.31-.05.63-.05.94s.02.63.05.94L1.78 13.66a.5.5 0 0 0-.12.64l1.92 3.32a.5.5 0 0 0 .6.22l2.39-.96c.5.4 1.05.71 1.62.94l.36 2.54a.5.5 0 0 0 .49.42h3.92a.5.5 0 0 0 .49-.42l.36-2.54c.57-.23 1.11-.53 1.62-.94l2.39.96a.5.5 0 0 0 .6-.22l1.92-3.32a.5.5 0 0 0-.12-.64Zm-7.14 2.56a3.5 3.5 0 1 1 3.5-3.5 3.5 3.5 0 0 1-3.5 3.5Z"/>
              </svg>
              Settings
            </button>

            {/* 新增：我的路线 */}
            <button className="menu-item" role="menuitem" onClick={() => { onMyRoutes?.(); setOpen(false); }}>
              <svg className="mi icon-purple" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M6 2h9a3 3 0 0 1 3 3v12.5a1.5 1.5 0 0 1-2.402 1.187L12 16.25l-3.598 2.437A1.5 1.5 0 0 1 6 17.5V2Z"/>
              </svg>
              My Saved Routes
            </button>

            <div className="menu-divider" />

            <button className="menu-item danger" role="menuitem" onClick={() => { onLogout?.(); setOpen(false); }}>
              <svg className="mi icon-red" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M16 17v-2H9V9h7V7l4 5-4 5ZM14 19H6a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h8V3H6a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3h8Z"/>
              </svg>
              Log out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
