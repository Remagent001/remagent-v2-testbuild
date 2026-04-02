"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function Topbar({ onMenuToggle, onCollapseToggle, collapsed }) {
  const { data: session } = useSession();
  const router = useRouter();
  const role = session?.user?.role?.toLowerCase() || "professional";
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const items = [];

    if (role === "professional") {
      fetch("/api/invitations")
        .then((r) => r.json())
        .then((data) => {
          const pending = data.counts?.pending || 0;
          const unread = data.counts?.unreadMessages || 0;
          if (pending > 0) items.push({ label: `${pending} pending invitation${pending > 1 ? "s" : ""}`, href: "/invitations", type: "invite" });
          if (unread > 0) items.push({ label: `${unread} unread message${unread > 1 ? "s" : ""}`, href: "/inbox", type: "message" });
          setNotifications([...items]);
        })
        .catch(() => {});
    }

    if (role === "business" || role === "admin") {
      Promise.all([
        fetch("/api/timesheets?status=pending").then((r) => r.json()).catch(() => ({})),
        fetch("/api/invites").then((r) => r.json()).catch(() => ({})),
      ]).then(([tsData, invData]) => {
        const pendingTs = tsData.counts?.pending || 0;
        if (pendingTs > 0) items.push({ label: `${pendingTs} pending timesheet${pendingTs > 1 ? "s" : ""}`, href: "/timesheets", type: "timesheet" });

        const invites = invData.invites || [];
        const totalUnread = invites.reduce((sum, inv) => sum + (inv.unreadMessages || 0), 0);
        if (totalUnread > 0) items.push({ label: `${totalUnread} unread message${totalUnread > 1 ? "s" : ""}`, href: "/inbox", type: "message" });

        setNotifications([...items]);
      });
    }

    if (role === "admin") {
      fetch("/api/admin/positions")
        .then((r) => r.json())
        .then((data) => {
          const count = (data.positions || []).length;
          if (count > 0) {
            setNotifications((prev) => [...prev, { label: `${count} posting${count > 1 ? "s" : ""} pending review`, href: "/admin/review", type: "review" }]);
          }
        })
        .catch(() => {});
    }
  }, [role]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    if (showDropdown) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showDropdown]);

  const hasNotifications = notifications.length > 0;

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button className="hamburger" onClick={onMenuToggle}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        <button
          className="topbar-collapse-btn"
          onClick={onCollapseToggle}
          title={collapsed ? "Show sidebar" : "Hide sidebar"}
          style={{
            background: "none", border: "none", cursor: "pointer",
            padding: "6px", borderRadius: 6, color: "var(--gray-500)",
            display: "flex", alignItems: "center",
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            style={{ transform: collapsed ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}
          >
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <line x1="9" y1="3" x2="9" y2="21" />
            <polyline points="14 8 10 12 14 16" />
          </svg>
        </button>

        <div className="topbar-search">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
          </svg>
          <input type="text" placeholder="Search..." />
        </div>
      </div>

      <div className="topbar-right">
        {/* Notifications */}
        <div ref={dropdownRef} style={{ position: "relative" }}>
          <button className="topbar-btn" onClick={() => setShowDropdown(!showDropdown)}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            {hasNotifications && <span className="topbar-badge" />}
          </button>

          {showDropdown && (
            <div style={dropdownStyle}>
              <div style={{ padding: "10px 14px", borderBottom: "1px solid var(--gray-200)", fontWeight: 700, fontSize: "0.85rem", color: "var(--gray-700)" }}>
                Notifications
              </div>
              {notifications.length === 0 ? (
                <div style={{ padding: "20px 14px", textAlign: "center", color: "var(--gray-400)", fontSize: "0.85rem" }}>
                  No new notifications
                </div>
              ) : (
                notifications.map((n, i) => (
                  <button
                    key={i}
                    onClick={() => { setShowDropdown(false); router.push(n.href); }}
                    style={notifItemStyle}
                  >
                    <span style={iconDot(n.type)} />
                    <span>{n.label}</span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* Messages */}
        <button className="topbar-btn" onClick={() => router.push("/inbox")}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="4" width="20" height="16" rx="2" />
            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
          </svg>
        </button>
      </div>
    </header>
  );
}

const dropdownStyle = {
  position: "absolute",
  top: "calc(100% + 8px)",
  right: 0,
  width: 280,
  background: "#fff",
  borderRadius: 10,
  boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
  border: "1px solid var(--gray-200)",
  zIndex: 1000,
  overflow: "hidden",
};

const notifItemStyle = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  width: "100%",
  padding: "10px 14px",
  background: "none",
  border: "none",
  borderBottom: "1px solid var(--gray-100)",
  cursor: "pointer",
  fontSize: "0.85rem",
  color: "var(--gray-700)",
  textAlign: "left",
};

function iconDot(type) {
  const colors = {
    invite: "#3b82f6",
    message: "#10b981",
    timesheet: "#f59e0b",
    review: "#ef4444",
  };
  return {
    width: 8,
    height: 8,
    borderRadius: "50%",
    background: colors[type] || "#3b82f6",
    flexShrink: 0,
  };
}
