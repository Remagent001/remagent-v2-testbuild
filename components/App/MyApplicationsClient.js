"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { convertTime, to12hr, tzLabel } from "@/utilities/TimeZoneHelper";

const DAY_ORDER = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
const DAY_LABELS = { monday: "Mon", tuesday: "Tue", wednesday: "Wed", thursday: "Thu", friday: "Fri", saturday: "Sat", sunday: "Sun" };

const TABS = [
  { key: "", label: "All", color: "var(--gray-600)" },
  { key: "new", label: "Pending", color: "#3b82f6" },
  { key: "reviewing", label: "Reviewing", color: "#f59e0b" },
  { key: "accepted", label: "Accepted", color: "#10b981" },
  { key: "hired", label: "Hired", color: "#059669" },
  { key: "completed", label: "Completed", color: "#6366f1" },
  { key: "declined", label: "Declined", color: "#ef4444" },
];

const STATUS_COLORS = {
  new: { bg: "#3b82f618", color: "#3b82f6", label: "Pending" },
  reviewing: { bg: "#f59e0b18", color: "#f59e0b", label: "Reviewing" },
  accepted: { bg: "#10b98118", color: "#10b981", label: "Accepted" },
  hired: { bg: "#05966918", color: "#059669", label: "Hired" },
  completed: { bg: "#6366f118", color: "#6366f1", label: "Completed" },
  terminated: { bg: "#ef444418", color: "#ef4444", label: "Terminated" },
  declined: { bg: "#ef444418", color: "#ef4444", label: "Declined" },
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

export default function MyApplicationsClient() {
  const { data: session } = useSession();
  const viewerTz = session?.user?.timezone || "Americas/Eastern";
  const router = useRouter();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("");

  useEffect(() => {
    fetch("/api/applications")
      .then((r) => r.json())
      .then((data) => setApplications(data.applications || []))
      .finally(() => setLoading(false));
  }, []);

  const filtered = activeTab
    ? applications.filter((a) => a.status === activeTab)
    : applications;

  const counts = {};
  TABS.forEach((t) => {
    counts[t.key] = t.key ? applications.filter((a) => a.status === t.key).length : applications.length;
  });

  if (loading) {
    return (
      <div className="onboarding-loading">
        <div className="onboarding-spinner" />
        <p>Loading applications...</p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 className="page-title">My Applications</h1>
        <p className="page-subtitle">Track the status of jobs you've applied to</p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {TABS.map((tab) => (
          <button
            key={tab.key}
            className={activeTab === tab.key ? "btn-primary" : "btn-secondary"}
            style={{ fontSize: "0.82rem", padding: "6px 16px" }}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label} ({counts[tab.key] || 0})
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="card" style={{ padding: 40, textAlign: "center" }}>
          <p style={{ color: "var(--gray-400)", fontSize: "0.95rem" }}>
            {applications.length === 0
              ? "You haven't applied to any jobs yet. Browse available jobs to get started."
              : "No applications match this filter."}
          </p>
          {applications.length === 0 && (
            <button className="btn-primary" style={{ marginTop: 16, width: "auto" }} onClick={() => router.push("/jobs")}>
              Browse Jobs
            </button>
          )}
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {filtered.map((app) => {
          const pos = app.position;
          const status = STATUS_COLORS[app.status] || STATUS_COLORS.new;
          const schedule = (pos?.availability || []).sort((a, b) => DAY_ORDER.indexOf(a.day) - DAY_ORDER.indexOf(b.day));

          return (
            <div
              key={app.id}
              className="card"
              style={{ padding: "18px 24px", cursor: "pointer", transition: "box-shadow 0.15s" }}
              onClick={() => router.push(`/jobs/${pos.id}`)}
              onMouseEnter={(e) => e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.1)"}
              onMouseLeave={(e) => e.currentTarget.style.boxShadow = ""}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: "1rem", fontWeight: 600, color: "var(--gray-800)", marginBottom: 4 }}>
                    {pos?.title || "Untitled Position"}
                  </h3>
                  <div style={{ display: "flex", gap: 12, fontSize: "0.82rem", color: "var(--gray-400)", flexWrap: "wrap" }}>
                    {pos?.company?.name && (
                      <span style={{ fontWeight: 500, color: "var(--gray-600)" }}>{pos.company.name}</span>
                    )}
                    {(pos?.company?.city || pos?.company?.state) && (
                      <span>{[pos.company.city, pos.company.state].filter(Boolean).join(", ")}</span>
                    )}
                    {pos?.regularRate && <span>${pos.regularRate}/hr</span>}
                    <span>Applied {timeAgo(app.createdAt)}</span>
                  </div>

                  {/* Schedule mini */}
                  {schedule.length > 0 && (
                    <div style={{ display: "flex", gap: 4, marginTop: 8 }}>
                      {DAY_ORDER.map((day) => {
                        const entry = schedule.find((s) => s.day === day);
                        return (
                          <div
                            key={day}
                            title={entry ? `${DAY_LABELS[day]}: ${to12hr(convertTime(entry.startTime, pos.timezone, viewerTz))} - ${to12hr(convertTime(entry.endTime, pos.timezone, viewerTz))} ${tzLabel(viewerTz)}` : ""}
                            style={{
                              width: 26, height: 20, borderRadius: 4, fontSize: "0.55rem", fontWeight: 600,
                              display: "flex", alignItems: "center", justifyContent: "center",
                              background: entry ? "var(--teal-dim)" : "var(--gray-100)",
                              color: entry ? "var(--teal)" : "var(--gray-300)",
                              border: entry ? "1px solid var(--teal-border)" : "1px solid var(--gray-200)",
                            }}
                          >
                            {DAY_LABELS[day]}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                  <span style={{
                    padding: "4px 12px", borderRadius: 12, fontSize: "0.75rem", fontWeight: 600,
                    background: status.bg, color: status.color,
                  }}>
                    {status.label}
                  </span>
                  {pos?.positionStatus === "closed" && (
                    <span style={{ fontSize: "0.72rem", color: "var(--gray-400)" }}>Position closed</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
