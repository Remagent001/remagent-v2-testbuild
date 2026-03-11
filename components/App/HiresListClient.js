"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const TABS = [
  { key: "", label: "All", color: "var(--gray-600)" },
  { key: "active", label: "Active", color: "#10b981" },
  { key: "completed", label: "Completed", color: "#3b82f6" },
  { key: "terminated", label: "Terminated", color: "#ef4444" },
];

const STATUS_COLORS = {
  active: { bg: "#10b98118", color: "#10b981" },
  completed: { bg: "#3b82f618", color: "#3b82f6" },
  terminated: { bg: "#ef444418", color: "#ef4444" },
};

const DAY_LABELS = { monday: "Mon", tuesday: "Tue", wednesday: "Wed", thursday: "Thu", friday: "Fri", saturday: "Sat", sunday: "Sun" };

function safeParse(val) {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  try { return JSON.parse(val); } catch { return []; }
}

export default function HiresListClient() {
  const router = useRouter();
  const [hires, setHires] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("");
  const [updating, setUpdating] = useState(null);

  const loadHires = () => {
    fetch("/api/hires")
      .then((r) => r.json())
      .then((data) => setHires(data.hires || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadHires(); }, []);

  const handleStatusChange = async (hireId, status) => {
    const msg = status === "completed"
      ? "Mark this hire as completed?"
      : "Terminate this hire? This cannot be undone.";
    if (!confirm(msg)) return;
    setUpdating(hireId);
    await fetch("/api/hires", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hireId, status }),
    });
    loadHires();
    setUpdating(null);
  };

  const counts = {};
  TABS.forEach((t) => { counts[t.key] = 0; });
  hires.forEach((h) => {
    counts[""]++;
    if (counts[h.status] !== undefined) counts[h.status]++;
  });

  const filtered = activeTab ? hires.filter((h) => h.status === activeTab) : hires;

  if (loading) {
    return (
      <div className="onboarding-loading">
        <div className="onboarding-spinner" />
        <p>Loading hires...</p>
      </div>
    );
  }

  return (
    <div className="positions-page">
      <div className="page-header">
        <h1 className="page-title">Hires</h1>
        <p className="page-subtitle">Manage your active and past employment relationships.</p>
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
      {hires.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "48px 24px" }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--gray-300)" strokeWidth="1.5" style={{ margin: "0 auto 16px" }}>
            <path d="m11 17 2 2a1 1 0 1 0 3-3" /><path d="m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88" />
            <path d="m3 7 4-4 6 6" /><path d="m21 7-4-4-6 6" />
          </svg>
          <h3 style={{ color: "var(--gray-600)", marginBottom: 8 }}>No hires yet</h3>
          <p style={{ color: "var(--gray-400)", fontSize: "0.9rem" }}>
            When you hire a professional, they'll appear here for you to manage.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "48px 24px" }}>
          <p style={{ color: "var(--gray-400)", fontSize: "0.9rem" }}>No hires with this status.</p>
        </div>
      ) : (
        <div className="positions-list">
          {filtered.map((hire) => {
            const pro = hire.professional;
            const profile = pro?.professionalProfile;
            const loc = pro?.location;
            const sc = STATUS_COLORS[hire.status] || STATUS_COLORS.active;
            const days = safeParse(hire.daysOfWork);

            return (
              <div key={hire.id} className="card position-card">
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
                          {hire.status.charAt(0).toUpperCase() + hire.status.slice(1)}
                        </span>
                      </div>
                      {profile?.title && (
                        <p style={{ fontSize: "0.85rem", color: "var(--gray-500)", marginTop: 2 }}>{profile.title}</p>
                      )}
                      <p className="position-card-meta" style={{ marginTop: 4 }}>
                        {hire.position?.title || "Untitled Position"}
                        {loc && (loc.city || loc.state) && ` · ${[loc.city, loc.state].filter(Boolean).join(", ")}`}
                        {hire.regularRate && ` · $${hire.regularRate}/hr`}
                      </p>

                      {/* Schedule & dates */}
                      <div style={{ display: "flex", gap: 16, marginTop: 8, fontSize: "0.82rem", color: "var(--gray-500)", flexWrap: "wrap" }}>
                        {hire.startDate && (
                          <span>Started: {new Date(hire.startDate).toLocaleDateString()}</span>
                        )}
                        {hire.endDate && (
                          <span>Ends: {new Date(hire.endDate).toLocaleDateString()}</span>
                        )}
                        {days.length > 0 && (
                          <span>Days: {days.map((d) => DAY_LABELS[d] || d).join(", ")}</span>
                        )}
                        {hire.startTime && hire.endTime && (
                          <span>Hours: {hire.startTime} - {hire.endTime}</span>
                        )}
                      </div>

                      {/* Rating */}
                      {hire.rating && (
                        <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 6 }}>
                          {[1, 2, 3, 4, 5].map((star) => (
                            <span key={star} style={{ color: star <= hire.rating ? "#f59e0b" : "var(--gray-200)", fontSize: "1rem" }}>
                              ★
                            </span>
                          ))}
                          {hire.ratingComment && (
                            <span style={{ fontSize: "0.82rem", color: "var(--gray-400)", marginLeft: 4 }}>
                              "{hire.ratingComment}"
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                    <button
                      className="btn-secondary"
                      style={{ width: "auto", fontSize: "0.82rem", padding: "6px 14px" }}
                      onClick={() => router.push(`/search/${pro?.id}?from=hires`)}
                    >
                      View Profile
                    </button>
                    {hire.status === "active" && (
                      <>
                        <button
                          className="btn-secondary"
                          style={{ width: "auto", fontSize: "0.82rem", padding: "6px 14px", color: "#3b82f6", borderColor: "#3b82f6" }}
                          onClick={() => handleStatusChange(hire.id, "completed")}
                          disabled={updating === hire.id}
                        >
                          Complete
                        </button>
                        <button
                          className="btn-secondary"
                          style={{ width: "auto", fontSize: "0.82rem", padding: "6px 14px", color: "#ef4444", borderColor: "#ef4444" }}
                          onClick={() => handleStatusChange(hire.id, "terminated")}
                          disabled={updating === hire.id}
                        >
                          Terminate
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
