"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const TABS = [
  { key: "", label: "All", color: "var(--gray-600)" },
  { key: "pending", label: "Pending", color: "#f59e0b" },
  { key: "accepted", label: "Accepted", color: "#10b981" },
  { key: "declined", label: "Declined", color: "#ef4444" },
  { key: "withdrawn", label: "Withdrawn", color: "#94a3b8" },
];

const STATUS_COLORS = {
  pending: { bg: "#f59e0b18", color: "#f59e0b" },
  accepted: { bg: "#10b98118", color: "#10b981" },
  declined: { bg: "#ef444418", color: "#ef4444" },
  withdrawn: { bg: "#94a3b818", color: "#94a3b8" },
};

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return new Date(dateStr).toLocaleDateString();
}

export default function InvitesListClient() {
  const router = useRouter();
  const [invites, setInvites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("");
  const [withdrawing, setWithdrawing] = useState(null);

  const loadInvites = () => {
    fetch("/api/invites")
      .then((r) => r.json())
      .then((data) => setInvites(data.invites || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadInvites(); }, []);

  const handleWithdraw = async (inviteId) => {
    if (!confirm("Withdraw this invite? The professional will no longer be able to respond.")) return;
    setWithdrawing(inviteId);
    await fetch("/api/invites", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inviteId, status: "withdrawn" }),
    });
    loadInvites();
    setWithdrawing(null);
  };

  const counts = {};
  TABS.forEach((t) => { counts[t.key] = 0; });
  invites.forEach((inv) => {
    counts[""]++;
    if (counts[inv.status] !== undefined) counts[inv.status]++;
  });

  const filtered = activeTab ? invites.filter((inv) => inv.status === activeTab) : invites;

  if (loading) {
    return (
      <div className="onboarding-loading">
        <div className="onboarding-spinner" />
        <p>Loading invites...</p>
      </div>
    );
  }

  return (
    <div className="positions-page">
      <div className="page-header">
        <h1 className="page-title">Invites Sent</h1>
        <p className="page-subtitle">Track invitations you've sent to professionals.</p>
      </div>

      {/* Tabs */}
      <div style={{
        display: "flex", gap: 0, borderBottom: "2px solid var(--gray-200)",
        marginBottom: 24, overflowX: "auto",
      }}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: "12px 20px", fontSize: "0.9rem",
                fontWeight: isActive ? 600 : 400,
                color: isActive ? tab.color : "var(--gray-500)",
                background: "none", border: "none",
                borderBottom: isActive ? `3px solid ${tab.color}` : "3px solid transparent",
                cursor: "pointer", whiteSpace: "nowrap", marginBottom: -2,
              }}
            >
              {tab.label}
              {counts[tab.key] > 0 && (
                <span style={{
                  marginLeft: 8, fontSize: "0.75rem", fontWeight: 600,
                  padding: "2px 8px", borderRadius: 10,
                  background: isActive ? `${tab.color}18` : "var(--gray-100)",
                  color: isActive ? tab.color : "var(--gray-400)",
                }}>
                  {counts[tab.key]}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Empty state */}
      {invites.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "48px 24px" }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--gray-300)" strokeWidth="1.5" style={{ margin: "0 auto 16px" }}>
            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
            <rect x="8" y="2" width="8" height="4" rx="1" />
          </svg>
          <h3 style={{ color: "var(--gray-600)", marginBottom: 8 }}>No invites yet</h3>
          <p style={{ color: "var(--gray-400)", fontSize: "0.9rem", marginBottom: 16 }}>
            Search for professionals and invite them to apply to your job postings.
          </p>
          <button className="btn-primary" style={{ width: "auto" }} onClick={() => router.push("/search")}>
            Search Professionals
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "48px 24px" }}>
          <p style={{ color: "var(--gray-400)", fontSize: "0.9rem" }}>No invites with this status.</p>
        </div>
      ) : (
        <div className="positions-list">
          {filtered.map((inv) => {
            const pro = inv.user;
            const profile = pro?.professionalProfile;
            const loc = pro?.location;
            const rate = pro?.hourlyRate?.regularRate;
            const sc = STATUS_COLORS[inv.status] || STATUS_COLORS.pending;

            return (
              <div key={inv.id} className="card position-card">
                <div className="position-card-header">
                  <div style={{ display: "flex", gap: 14, flex: 1 }}>
                    {/* Avatar */}
                    <div style={{
                      width: 48, height: 48, minWidth: 48, borderRadius: "50%",
                      background: "var(--teal-dim)", border: "2px solid var(--teal-border)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "1rem", fontWeight: 700, color: "var(--teal)",
                    }}>
                      {profile?.photoUrl ? (
                        <img src={profile.photoUrl} alt="" style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
                      ) : (
                        `${pro?.firstName?.[0] || ""}${pro?.lastName?.[0] || ""}`
                      )}
                    </div>

                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                        <h3 className="position-card-title" style={{ marginBottom: 0 }}>
                          {pro?.firstName} {pro?.lastName}
                        </h3>
                        <span style={{
                          padding: "3px 10px", borderRadius: 12, fontSize: "0.75rem", fontWeight: 600,
                          background: sc.bg, color: sc.color,
                        }}>
                          {inv.status.charAt(0).toUpperCase() + inv.status.slice(1)}
                        </span>
                      </div>
                      {profile?.title && (
                        <p style={{ fontSize: "0.85rem", color: "var(--gray-500)", marginTop: 2 }}>{profile.title}</p>
                      )}
                      <p className="position-card-meta" style={{ marginTop: 4 }}>
                        {inv.position?.title || "Untitled Position"}
                        {loc && (loc.city || loc.state) && ` · ${[loc.city, loc.state].filter(Boolean).join(", ")}`}
                        {rate && ` · $${rate}/hr`}
                        {` · Invited ${timeAgo(inv.createdAt)}`}
                      </p>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <button
                      className="btn-secondary"
                      style={{ width: "auto", fontSize: "0.82rem", padding: "6px 14px" }}
                      onClick={() => router.push(`/search/${pro?.id}?from=invites`)}
                    >
                      View Profile
                    </button>
                    {inv.status === "pending" && (
                      <button
                        className="btn-secondary"
                        style={{ width: "auto", fontSize: "0.82rem", padding: "6px 14px", color: "#ef4444", borderColor: "#ef4444" }}
                        onClick={() => handleWithdraw(inv.id)}
                        disabled={withdrawing === inv.id}
                      >
                        {withdrawing === inv.id ? "..." : "Withdraw"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
