"use client";

import { useState, useEffect, useRef } from "react";
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
  { key: "sow_received", label: "SOW Received", color: "#92400e" },
  { key: "hired", label: "Hired", color: "#059669" },
  { key: "completed", label: "Completed", color: "#6366f1" },
  { key: "declined", label: "Declined", color: "#ef4444" },
];

const STATUS_COLORS = {
  new: { bg: "#3b82f618", color: "#3b82f6", label: "Pending" },
  reviewing: { bg: "#f59e0b18", color: "#f59e0b", label: "Reviewing" },
  accepted: { bg: "#10b98118", color: "#10b981", label: "Accepted" },
  sow_received: { bg: "#fef3c718", color: "#92400e", label: "SOW Received" },
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
  const [expandedId, setExpandedId] = useState(null);

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

          const isExpanded = expandedId === app.id;

          return (
            <div
              key={app.id}
              className="card"
              style={{ padding: 0, overflow: "hidden", transition: "box-shadow 0.15s" }}
            >
              <div style={{ padding: "18px 24px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
                  <div style={{ flex: 1, cursor: "pointer" }} onClick={() => router.push(`/jobs/${pos.id}`)}>
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
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <button
                        className="btn-secondary"
                        style={{ width: "auto", fontSize: "0.78rem", padding: "4px 12px" }}
                        onClick={(e) => { e.stopPropagation(); setExpandedId(isExpanded ? null : app.id); }}
                      >
                        {isExpanded ? "Collapse" : "Message"}
                      </button>
                      <span style={{
                        padding: "4px 12px", borderRadius: 12, fontSize: "0.75rem", fontWeight: 600,
                        background: status.bg, color: status.color,
                      }}>
                        {status.label}
                      </span>
                    </div>
                    {pos?.positionStatus === "closed" && (
                      <span style={{ fontSize: "0.72rem", color: "var(--gray-400)" }}>Position closed</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Expanded: Message Thread */}
              {isExpanded && (
                <div style={{ borderTop: "1px solid var(--gray-200)", padding: "16px 24px" }}>
                  <ProAppMessageThread applicationId={app.id} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── PU Message Thread Component ──

function ProAppMessageThread({ applicationId }) {
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  const fetchMessages = () => {
    fetch(`/api/applicants/messages?applicationId=${applicationId}`)
      .then((r) => r.json())
      .then((data) => setMessages(data.messages || []))
      .catch(() => {});
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 10000);
    return () => clearInterval(interval);
  }, [applicationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const handleSend = async () => {
    if (!newMsg.trim() || sending) return;
    setSending(true);
    try {
      await fetch("/api/applicants/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId, content: newMsg }),
      });
      setNewMsg("");
      fetchMessages();
    } catch {}
    setSending(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (dt) => {
    const d = new Date(dt);
    return d.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", hour12: true });
  };

  return (
    <div>
      <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--gray-600)", marginBottom: 10 }}>Messages</div>

      <div style={{ maxHeight: 300, overflowY: "auto", marginBottom: 12 }}>
        {messages.length === 0 ? (
          <p style={{ fontSize: "0.82rem", color: "var(--gray-400)", padding: "12px 0" }}>
            No messages yet. Send a message to the employer.
          </p>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender?.role === "PROFESSIONAL";
            return (
              <div key={msg.id} style={{ display: "flex", flexDirection: "column", alignItems: isMe ? "flex-end" : "flex-start", marginBottom: 8 }}>
                <div style={{
                  maxWidth: "75%", padding: "8px 12px", borderRadius: 10,
                  background: isMe ? "var(--teal-dim)" : "var(--gray-50)",
                  border: `1px solid ${isMe ? "var(--teal-border)" : "var(--gray-200)"}`,
                }}>
                  <div style={{ fontSize: "0.7rem", fontWeight: 600, color: "var(--gray-500)", marginBottom: 2 }}>
                    {msg.sender?.firstName} {msg.sender?.lastName}
                  </div>
                  <div style={{ fontSize: "0.85rem", color: "var(--gray-700)", whiteSpace: "pre-wrap" }}>
                    {msg.content}
                  </div>
                </div>
                <div style={{ fontSize: "0.65rem", color: "var(--gray-400)", marginTop: 2, padding: "0 4px" }}>
                  {formatTime(msg.createdAt)}
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <textarea
          className="form-input"
          rows={1}
          placeholder="Type a message..."
          value={newMsg}
          onChange={(e) => setNewMsg(e.target.value)}
          onKeyDown={handleKeyDown}
          style={{ flex: 1, resize: "none", fontSize: "0.85rem", padding: "8px 12px" }}
        />
        <button
          className="btn-primary"
          onClick={handleSend}
          disabled={sending || !newMsg.trim()}
          style={{ width: "auto", padding: "8px 16px", fontSize: "0.82rem" }}
        >
          Send
        </button>
      </div>
    </div>
  );
}
