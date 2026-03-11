"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const TABS = [
  { key: "", label: "All", color: "var(--gray-600)" },
  { key: "new", label: "New", color: "#3b82f6" },
  { key: "reviewing", label: "Reviewing", color: "#f59e0b" },
  { key: "accepted", label: "Accepted", color: "#10b981" },
  { key: "declined", label: "Declined", color: "#ef4444" },
];

const STATUS_COLORS = {
  new: { bg: "#3b82f618", color: "#3b82f6" },
  reviewing: { bg: "#f59e0b18", color: "#f59e0b" },
  accepted: { bg: "#10b98118", color: "#10b981" },
  declined: { bg: "#ef444418", color: "#ef4444" },
};

function stripHtml(html) {
  if (!html) return "";
  return html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();
}

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

export default function ApplicantsListClient() {
  const router = useRouter();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("");
  const [updating, setUpdating] = useState(null);

  const loadApplications = () => {
    fetch("/api/applicants")
      .then((r) => r.json())
      .then((data) => setApplications(data.applications || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadApplications(); }, []);

  const handleStatusChange = async (applicationId, status) => {
    setUpdating(applicationId);
    await fetch("/api/applicants", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ applicationId, status }),
    });
    loadApplications();
    setUpdating(null);
  };

  const counts = {};
  TABS.forEach((t) => { counts[t.key] = 0; });
  applications.forEach((app) => {
    counts[""]++;
    if (counts[app.status] !== undefined) counts[app.status]++;
  });

  const filtered = activeTab ? applications.filter((app) => app.status === activeTab) : applications;

  if (loading) {
    return (
      <div className="onboarding-loading">
        <div className="onboarding-spinner" />
        <p>Loading applicants...</p>
      </div>
    );
  }

  return (
    <div className="positions-page">
      <div className="page-header">
        <h1 className="page-title">Applicants</h1>
        <p className="page-subtitle">Review professionals who have applied to your job postings.</p>
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
      {applications.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "48px 24px" }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--gray-300)" strokeWidth="1.5" style={{ margin: "0 auto 16px" }}>
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          <h3 style={{ color: "var(--gray-600)", marginBottom: 8 }}>No applicants yet</h3>
          <p style={{ color: "var(--gray-400)", fontSize: "0.9rem" }}>
            When professionals apply to your job postings, they'll appear here.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "48px 24px" }}>
          <p style={{ color: "var(--gray-400)", fontSize: "0.9rem" }}>No applicants with this status.</p>
        </div>
      ) : (
        <div className="positions-list">
          {filtered.map((app) => {
            const pro = app.user;
            const profile = pro?.professionalProfile;
            const loc = pro?.location;
            const rate = pro?.hourlyRate?.regularRate;
            const sc = STATUS_COLORS[app.status] || STATUS_COLORS.new;
            const summary = stripHtml(profile?.summary);

            return (
              <div key={app.id} className="card position-card">
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
                          {app.status === "new" ? "New" : app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                        </span>
                      </div>
                      {profile?.title && (
                        <p style={{ fontSize: "0.85rem", color: "var(--gray-500)", marginTop: 2 }}>{profile.title}</p>
                      )}
                      <p className="position-card-meta" style={{ marginTop: 4 }}>
                        Applied to <strong>{app.position?.title || "Untitled Position"}</strong>
                        {loc && (loc.city || loc.state) && ` · ${[loc.city, loc.state].filter(Boolean).join(", ")}`}
                        {rate && ` · $${rate}/hr`}
                        {` · ${timeAgo(app.createdAt)}`}
                      </p>
                      {summary && (
                        <p style={{
                          fontSize: "0.82rem", color: "var(--gray-400)", marginTop: 6,
                          overflow: "hidden", display: "-webkit-box",
                          WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
                        }}>
                          {summary}
                        </p>
                      )}
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                    <button
                      className="btn-secondary"
                      style={{ width: "auto", fontSize: "0.82rem", padding: "6px 14px" }}
                      onClick={() => router.push(`/search/${pro?.id}?from=applicants`)}
                    >
                      View Profile
                    </button>
                    {(app.status === "new" || app.status === "reviewing") && (
                      <>
                        {app.status === "new" && (
                          <button
                            className="btn-secondary"
                            style={{ width: "auto", fontSize: "0.82rem", padding: "6px 14px", color: "#f59e0b", borderColor: "#f59e0b" }}
                            onClick={() => handleStatusChange(app.id, "reviewing")}
                            disabled={updating === app.id}
                          >
                            Mark Reviewing
                          </button>
                        )}
                        <button
                          className="btn-primary"
                          style={{ width: "auto", fontSize: "0.82rem", padding: "6px 14px", background: "#10b981" }}
                          onClick={() => handleStatusChange(app.id, "accepted")}
                          disabled={updating === app.id}
                        >
                          Accept
                        </button>
                        <button
                          className="btn-secondary"
                          style={{ width: "auto", fontSize: "0.82rem", padding: "6px 14px", color: "#ef4444", borderColor: "#ef4444" }}
                          onClick={() => handleStatusChange(app.id, "declined")}
                          disabled={updating === app.id}
                        >
                          Decline
                        </button>
                      </>
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
