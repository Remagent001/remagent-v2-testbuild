"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const DAY_LABELS = { sunday: "Sun", monday: "Mon", tuesday: "Tue", wednesday: "Wed", thursday: "Thu", friday: "Fri", saturday: "Sat" };
const DAY_ORDER = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

function to12hr(time24) {
  if (!time24) return "";
  const [h, m] = time24.split(":");
  const hr = parseInt(h, 10);
  return `${hr === 0 ? 12 : hr > 12 ? hr - 12 : hr}:${m} ${hr >= 12 ? "PM" : "AM"}`;
}

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return new Date(dateStr).toLocaleDateString();
}

function stripHtml(html) {
  if (!html) return "";
  return html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();
}

const STATUS_TABS = [
  { key: "all", label: "All", color: "var(--gray-500)" },
  { key: "pending", label: "New", color: "#f59e0b" },
  { key: "accepted", label: "Accepted", color: "#10b981" },
  { key: "declined", label: "Declined", color: "#ef4444" },
];

export default function InvitationsClient() {
  const router = useRouter();
  const [invitations, setInvitations] = useState([]);
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [expandedId, setExpandedId] = useState(null);
  const [responding, setResponding] = useState(null); // inviteId being responded to

  useEffect(() => {
    fetchInvitations();
  }, []);

  const fetchInvitations = async () => {
    try {
      const res = await fetch("/api/invitations");
      const data = await res.json();
      setInvitations(data.invitations || []);
      setCounts(data.counts || {});
    } catch {}
    setLoading(false);
  };

  const handleRespond = async (inviteId, action) => {
    setResponding(inviteId);
    try {
      const res = await fetch("/api/invitations", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteId, action }),
      });
      const data = await res.json();
      if (data.success) {
        // Update locally
        setInvitations((prev) =>
          prev.map((inv) => (inv.id === inviteId ? { ...inv, status: data.status } : inv))
        );
        // Update counts
        setCounts((prev) => ({
          ...prev,
          pending: (prev.pending || 0) - 1,
          [data.status]: (prev[data.status] || 0) + 1,
        }));
      }
    } catch {}
    setResponding(null);
  };

  const filtered = activeTab === "all" ? invitations : invitations.filter((i) => i.status === activeTab);

  if (loading) {
    return (
      <div className="onboarding-loading">
        <div className="onboarding-spinner" />
        <p>Loading invitations...</p>
      </div>
    );
  }

  return (
    <div className="positions-page">
      <div className="page-header">
        <h1 className="page-title">Invitations</h1>
        <p className="page-subtitle">Job opportunities from businesses interested in your profile.</p>
      </div>

      {/* Status tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {STATUS_TABS.map((tab) => {
          const count = counts[tab.key] || 0;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: "6px 16px",
                borderRadius: 20,
                fontSize: "0.85rem",
                fontWeight: 600,
                cursor: "pointer",
                border: isActive ? `2px solid ${tab.color}` : "2px solid var(--gray-200)",
                background: isActive ? `${tab.color}15` : "white",
                color: isActive ? tab.color : "var(--gray-500)",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              {tab.label}
              <span style={{
                background: isActive ? tab.color : "var(--gray-200)",
                color: isActive ? "white" : "var(--gray-500)",
                fontSize: "0.7rem",
                padding: "1px 7px",
                borderRadius: 10,
                fontWeight: 700,
              }}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="card" style={{ textAlign: "center", padding: "48px 24px" }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--gray-300)" strokeWidth="1.5" style={{ margin: "0 auto 16px" }}>
            <rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
          </svg>
          <h3 style={{ color: "var(--gray-600)", marginBottom: 8 }}>
            {activeTab === "all" ? "No invitations yet" : `No ${activeTab} invitations`}
          </h3>
          <p style={{ color: "var(--gray-400)", fontSize: "0.9rem" }}>
            {activeTab === "all"
              ? "When businesses invite you to apply for a position, you'll see it here."
              : "Try switching to a different tab to see other invitations."}
          </p>
        </div>
      )}

      {/* Invitation cards */}
      {filtered.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {filtered.map((inv) => (
            <InvitationCard
              key={inv.id}
              invitation={inv}
              expanded={expandedId === inv.id}
              onToggle={() => setExpandedId(expandedId === inv.id ? null : inv.id)}
              onRespond={handleRespond}
              responding={responding === inv.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function InvitationCard({ invitation, expanded, onToggle, onRespond, responding }) {
  const pos = invitation.position;
  const biz = pos?.user?.businessProfile;
  const rate = pos?.hourlyRate;
  const env = pos?.environment;
  const schedule = (pos?.availability || []).sort((a, b) => DAY_ORDER.indexOf(a.day) - DAY_ORDER.indexOf(b.day));
  const description = stripHtml(pos?.description);

  const statusColors = {
    pending: { bg: "#fef3c7", text: "#92400e", label: "New" },
    accepted: { bg: "#d1fae5", text: "#065f46", label: "Accepted" },
    declined: { bg: "#fee2e2", text: "#991b1b", label: "Declined" },
    withdrawn: { bg: "#f1f5f9", text: "#64748b", label: "Withdrawn" },
  };
  const status = statusColors[invitation.status] || statusColors.pending;

  return (
    <div className="card" style={{ padding: 0, overflow: "hidden" }}>
      {/* Header — always visible */}
      <div
        style={{ padding: "20px 24px", cursor: "pointer" }}
        onClick={onToggle}
        onMouseEnter={(e) => e.currentTarget.style.background = "var(--gray-50)"}
        onMouseLeave={(e) => e.currentTarget.style.background = ""}
      >
        <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
          {/* Company logo/initial */}
          <div style={{
            width: 48, height: 48, minWidth: 48, borderRadius: 10,
            background: "var(--teal-dim)", border: "1px solid var(--teal-border)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "1.1rem", fontWeight: 700, color: "var(--teal)",
            overflow: "hidden",
          }}>
            {biz?.logo ? (
              <img src={`/${biz.logo}`} alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
            ) : (
              biz?.businessName?.[0] || "?"
            )}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
              <div>
                <h3 style={{ fontSize: "1rem", fontWeight: 600, color: "var(--gray-800)", marginBottom: 2 }}>
                  {pos?.title || "Untitled Position"}
                </h3>
                <p style={{ fontSize: "0.88rem", color: "var(--gray-500)", marginBottom: 4 }}>
                  {biz?.businessName || "Unknown Company"}
                  {biz?.city && ` — ${biz.city}${biz.state ? `, ${biz.state}` : ""}`}
                </p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{
                  padding: "3px 12px", borderRadius: 12,
                  fontSize: "0.75rem", fontWeight: 600,
                  background: status.bg, color: status.text,
                }}>
                  {status.label}
                </span>
                {rate?.regularRate && (
                  <span style={{ fontSize: "1rem", fontWeight: 700, color: "var(--teal)" }}>
                    ${rate.regularRate}<span style={{ fontSize: "0.75rem", fontWeight: 400, color: "var(--gray-400)" }}>/hr</span>
                  </span>
                )}
              </div>
            </div>

            <div style={{ display: "flex", gap: 12, fontSize: "0.8rem", color: "var(--gray-400)", marginTop: 4, flexWrap: "wrap" }}>
              <span>Received {timeAgo(invitation.createdAt)}</span>
              {env && (
                <span>
                  {env.workFromHome && env.workFromOffice ? "Hybrid" : env.workFromHome ? "Remote" : "Office"}
                </span>
              )}
              {schedule.length > 0 && (
                <span>{schedule.length} day{schedule.length !== 1 ? "s" : ""}/week</span>
              )}
            </div>
          </div>

          {/* Expand arrow */}
          <svg
            width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--gray-400)" strokeWidth="2"
            style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s", marginTop: 4 }}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div style={{ borderTop: "1px solid var(--gray-100)", padding: "20px 24px" }}>
          {/* Description */}
          {description && (
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--gray-600)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 6, display: "block" }}>
                About this position
              </label>
              <p style={{ fontSize: "0.88rem", color: "var(--gray-600)", lineHeight: 1.6 }}>
                {description.length > 300 ? description.substring(0, 300) + "..." : description}
              </p>
            </div>
          )}

          {/* Schedule */}
          {schedule.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--gray-600)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 6, display: "block" }}>
                Schedule
              </label>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {schedule.map((s) => (
                  <span key={s.day} style={{
                    padding: "4px 10px", borderRadius: 6,
                    fontSize: "0.78rem", fontWeight: 500,
                    background: "var(--teal-dim)", color: "var(--teal)",
                    border: "1px solid var(--teal-border)",
                  }}>
                    {DAY_LABELS[s.day]} {to12hr(s.startTime)} - {to12hr(s.endTime)}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Skills */}
          {pos?.skills?.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--gray-600)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 6, display: "block" }}>
                Required Skills
              </label>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {pos.skills.map((s, i) => (
                  <span key={i} className="profile-tag" style={{ fontSize: "0.75rem", padding: "3px 10px" }}>
                    {s.skill.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Channels */}
          {pos?.channels?.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--gray-600)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 6, display: "block" }}>
                Channels
              </label>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {pos.channels.map((c, i) => (
                  <span key={i} style={{
                    fontSize: "0.75rem", padding: "3px 10px", borderRadius: 10,
                    background: "var(--gray-100)", color: "var(--gray-600)",
                  }}>
                    {c.channel.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Company info */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--gray-600)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 6, display: "block" }}>
              About the company
            </label>
            <p style={{ fontSize: "0.85rem", color: "var(--gray-500)" }}>
              {biz?.businessName || "Unknown Company"}
              {biz?.industry ? ` — ${biz.industry}` : ""}
              {biz?.city ? ` | ${biz.city}${biz.state ? `, ${biz.state}` : ""}` : ""}
              {biz?.website && (
                <>
                  {" | "}
                  <a href={biz.website.startsWith("http") ? biz.website : `https://${biz.website}`} target="_blank" rel="noopener noreferrer" style={{ color: "var(--teal)" }}>
                    Website
                  </a>
                </>
              )}
            </p>
          </div>

          {/* Action buttons */}
          {invitation.status === "pending" && (
            <div style={{ display: "flex", gap: 12, paddingTop: 16, borderTop: "1px solid var(--gray-100)" }}>
              <button
                className="btn-primary"
                style={{ width: "auto", padding: "8px 24px" }}
                onClick={() => onRespond(invitation.id, "accept")}
                disabled={responding}
              >
                {responding ? "Accepting..." : "Accept & Apply"}
              </button>
              <button
                className="btn-secondary"
                style={{ width: "auto", padding: "8px 24px" }}
                onClick={() => {
                  if (confirm("Are you sure you want to decline this invitation?")) {
                    onRespond(invitation.id, "decline");
                  }
                }}
                disabled={responding}
              >
                Decline
              </button>
            </div>
          )}

          {invitation.status === "accepted" && (
            <div style={{ padding: "12px 16px", background: "#d1fae5", borderRadius: 8, fontSize: "0.85rem", color: "#065f46" }}>
              You accepted this invitation. The business has been notified and your application is active.
            </div>
          )}

          {invitation.status === "declined" && (
            <div style={{ padding: "12px 16px", background: "#fee2e2", borderRadius: 8, fontSize: "0.85rem", color: "#991b1b" }}>
              You declined this invitation.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
