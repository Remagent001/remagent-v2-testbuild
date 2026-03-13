"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useState, useEffect } from "react";

// Simple inline SVG icons to avoid extra dependencies
const icons = {
  dashboard: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  ),
  profile: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
    </svg>
  ),
  briefcase: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
    </svg>
  ),
  search: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
    </svg>
  ),
  inbox: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  ),
  clipboard: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <rect x="8" y="2" width="8" height="4" rx="1" />
    </svg>
  ),
  users: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  fileText: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  ),
  handshake: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m11 17 2 2a1 1 0 1 0 3-3" /><path d="m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88" />
      <path d="m3 7 4-4 6 6" /><path d="m21 7-4-4-6 6" />
    </svg>
  ),
  settings: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  ),
  plus: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
  building: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="2" width="16" height="20" rx="2" /><path d="M9 22v-4h6v4" />
      <path d="M8 6h.01" /><path d="M16 6h.01" /><path d="M8 10h.01" /><path d="M16 10h.01" /><path d="M8 14h.01" /><path d="M16 14h.01" />
    </svg>
  ),
};

// Navigation config — different links for professional vs business
const proNav = [
  { section: "Main", links: [
    { href: "/dashboard", label: "Dashboard", icon: "dashboard" },
    { href: "/profile", label: "My Profile", icon: "profile" },
    { href: "/jobs", label: "Browse Jobs", icon: "briefcase" },
    { href: "/my-jobs", label: "My Jobs", icon: "clipboard" },
    { href: "/inbox", label: "Inbox", icon: "inbox" },
  ]},
  { section: "Account", links: [
    { href: "/settings", label: "Settings", icon: "settings" },
  ]},
];

const bizNav = [
  { section: "Main", links: [
    { href: "/dashboard", label: "Dashboard", icon: "dashboard" },
    { href: "/company-profile", label: "Company Profile", icon: "profile" },
    { href: "/search", label: "Search Professionals", icon: "search" },
    { href: "/positions", label: "Job Postings", icon: "briefcase", badgeKey: "positions" },
  ]},
  { section: "Manage", links: [
    { href: "/invites", label: "Invites", icon: "clipboard" },
    { href: "/applicants", label: "Applicants", icon: "users" },
    { href: "/hires", label: "Hires", icon: "handshake" },
    { href: "/inbox", label: "Inbox", icon: "inbox" },
  ]},
  { section: "Account", links: [
    { href: "/settings", label: "Settings", icon: "settings" },
  ]},
];

const adminNav = [
  { section: "Admin", links: [
    { href: "/admin/review-postings", label: "Review Postings", icon: "clipboard", badgeKey: "adminReview" },
    { href: "/admin/businesses", label: "Businesses", icon: "building" },
  ]},
];

export default function Sidebar({ isOpen, onClose, role = "professional", user = null }) {
  const pathname = usePathname();
  const isAdmin = role === "admin";
  const baseNav = isAdmin ? bizNav : (role === "business" ? bizNav : proNav);
  const nav = isAdmin ? [...adminNav, ...baseNav] : baseNav;

  // Fetch badge counts
  const [badges, setBadges] = useState({});

  useEffect(() => {
    if (role === "business" || isAdmin) {
      // Get positions needing attention (admin notes)
      fetch("/api/positions")
        .then((r) => r.json())
        .then((data) => {
          const positions = data.positions || [];
          const needsAttention = positions.filter((p) => p.reviewRequired && p.adminNote).length;
          if (needsAttention > 0) {
            setBadges((prev) => ({ ...prev, positions: needsAttention }));
          }
        })
        .catch(() => {});
    }
    if (isAdmin) {
      // Get pending review count
      fetch("/api/admin/positions")
        .then((r) => r.json())
        .then((data) => {
          const count = (data.positions || []).length;
          if (count > 0) {
            setBadges((prev) => ({ ...prev, adminReview: count }));
          }
        })
        .catch(() => {});
    }
  }, [role, isAdmin]);

  return (
    <aside className={`sidebar ${isOpen ? "open" : ""}`}>
      <div className="sidebar-logo">
        <Link href="/">
          <span className="sidebar-logo-mark">R</span>
          rem<span>agent</span>
        </Link>
      </div>

      <nav className="sidebar-nav">
        {nav.map((section) => (
          <div key={section.section} className="sidebar-section">
            <div className="sidebar-section-label">{section.section}</div>
            {section.links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`sidebar-link ${pathname === link.href || pathname.startsWith(link.href + "/") ? "active" : ""}`}
                onClick={onClose}
                style={{ position: "relative" }}
              >
                {icons[link.icon]}
                {link.label}
                {link.badgeKey && badges[link.badgeKey] > 0 && (
                  <span style={{
                    marginLeft: "auto",
                    background: "#ef4444",
                    color: "white",
                    fontSize: "0.65rem",
                    fontWeight: 700,
                    padding: "2px 7px",
                    borderRadius: 10,
                    minWidth: 18,
                    textAlign: "center",
                  }}>
                    {badges[link.badgeKey]}
                  </span>
                )}
              </Link>
            ))}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-avatar">
            {user?.firstName?.[0] || "U"}{user?.lastName?.[0] || ""}
          </div>
          <div style={{ flex: 1 }}>
            <div className="sidebar-user-name">
              {user?.firstName || "User"} {user?.lastName?.[0] || ""}.
            </div>
            <div className="sidebar-user-role">
              {role === "admin" ? "Admin" : role === "business" ? "Business" : "Professional"}
            </div>
          </div>
          <button
            className="sidebar-signout"
            onClick={() => signOut({ callbackUrl: "/login" })}
            title="Sign out"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
      </div>
    </aside>
  );
}
