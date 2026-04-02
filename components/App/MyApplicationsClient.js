"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import ProgressBubbles from "./ProgressBubbles";
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

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {filtered.map((app) => {
          const pos = app.position;
          const status = STATUS_COLORS[app.status] || STATUS_COLORS.new;
          const biz = pos?.company;
          const schedule = (pos?.availability || []).sort((a, b) => DAY_ORDER.indexOf(a.day) - DAY_ORDER.indexOf(b.day));
          const description = stripHtml(pos?.description);
          const env = pos?.environment;
          const isExpanded = expandedId === app.id;

          const workLoc = env?.workLocation
            ? (Array.isArray(env.workLocation) ? env.workLocation : (() => { try { return JSON.parse(env.workLocation); } catch { return []; } })())
            : [];
          const workLocLabel = workLoc.includes("home") && workLoc.includes("office") ? "Hybrid" : workLoc.includes("home") ? "Remote" : workLoc.includes("office") ? "Office" : "";

          return (
            <div key={app.id} className="card" style={{ padding: 0, overflow: "hidden" }}>
              {/* Header — always visible, click to expand */}
              <div
                style={{ padding: "20px 24px", cursor: "pointer" }}
                onClick={(e) => {
                  const opening = !isExpanded;
                  setExpandedId(isExpanded ? null : app.id);
                  if (opening) {
                    const card = e.currentTarget.closest(".card");
                    setTimeout(() => card?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
                  }
                }}
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
                      biz?.name?.[0] || "?"
                    )}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
                      <div>
                        <h3 style={{ fontSize: "1rem", fontWeight: 600, color: "var(--gray-800)", marginBottom: 2 }}>
                          {pos?.title || "Untitled Position"}
                        </h3>
                        <p style={{ fontSize: "0.88rem", color: "var(--gray-500)", marginBottom: 4 }}>
                          {biz?.name || "Company"}
                          {biz?.city && ` — ${biz.city}${biz.state ? `, ${biz.state}` : ""}`}
                        </p>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                        <span style={{
                          padding: "3px 12px", borderRadius: 12,
                          fontSize: "0.75rem", fontWeight: 600,
                          background: status.bg, color: status.color,
                        }}>
                          {status.label}
                        </span>
                        {pos?.regularRate && (
                          <span style={{ fontSize: "1rem", fontWeight: 700, color: "var(--teal)" }}>
                            ${pos.regularRate}<span style={{ fontSize: "0.75rem", fontWeight: 400, color: "var(--gray-400)" }}>/hr</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: 12, fontSize: "0.8rem", color: "var(--gray-400)", marginTop: 4, flexWrap: "wrap" }}>
                      <span>Applied {timeAgo(app.createdAt)}</span>
                      {workLocLabel && <span>{workLocLabel}</span>}
                      {schedule.length > 0 && <span>{schedule.length} day{schedule.length !== 1 ? "s" : ""}/week</span>}
                    </div>
                  </div>

                  {/* Expand arrow */}
                  <svg
                    width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--gray-400)" strokeWidth="2"
                    style={{ transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s", marginTop: 4 }}
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </div>
              </div>

              {/* Expanded details */}
              {isExpanded && (
                <div style={{ borderTop: "1px solid var(--gray-100)", padding: "20px 24px" }}>
                  {/* Progress tracker */}
                  <div style={{ marginBottom: 20 }}>
                    <ProgressBubbles currentStep={app.progressStep || 1} role="professional" variant="application" />
                  </div>

                  {/* Description */}
                  {description && (
                    <div style={{ marginBottom: 16 }}>
                      <label style={sectionLabel}>About this position</label>
                      <p style={{ fontSize: "0.88rem", color: "var(--gray-600)", lineHeight: 1.6 }}>
                        {description.length > 400 ? description.substring(0, 400) + "..." : description}
                      </p>
                    </div>
                  )}

                  {/* Schedule */}
                  {schedule.length > 0 && (
                    <div style={{ marginBottom: 16 }}>
                      <label style={sectionLabel}>Schedule</label>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {schedule.map((s) => (
                          <span key={s.day} style={{
                            padding: "4px 10px", borderRadius: 6,
                            fontSize: "0.78rem", fontWeight: 500,
                            background: "var(--teal-dim)", color: "var(--teal)",
                            border: "1px solid var(--teal-border)",
                          }}>
                            {DAY_LABELS[s.day]} {to12hr(convertTime(s.startTime, pos?.timezone, viewerTz))} - {to12hr(convertTime(s.endTime, pos?.timezone, viewerTz))} {tzLabel(viewerTz)}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Skills */}
                  {pos?.skills?.length > 0 && (
                    <div style={{ marginBottom: 16 }}>
                      <label style={sectionLabel}>Required Skills</label>
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
                      <label style={sectionLabel}>Channels</label>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {pos.channels.map((c, i) => (
                          <span key={i} style={{ fontSize: "0.75rem", padding: "3px 10px", borderRadius: 10, background: "var(--gray-100)", color: "var(--gray-600)" }}>
                            {c.channel.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Company info */}
                  <div style={{ marginBottom: 20 }}>
                    <label style={sectionLabel}>About the company</label>
                    <p style={{ fontSize: "0.85rem", color: "var(--gray-500)" }}>
                      {biz?.name || "Unknown Company"}
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

                  {/* SOW status banner */}
                  {app.sowStatus === "sent" && (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: "#fef3c7", borderRadius: 8, fontSize: "0.85rem", color: "#92400e", marginBottom: 16 }}>
                      <span>A Statement of Work has been sent to you for review.</span>
                      <button
                        className="btn-primary"
                        style={{ width: "auto", fontSize: "0.82rem", padding: "6px 16px", marginLeft: 12, whiteSpace: "nowrap" }}
                        onClick={() => {
                          // Find the offer for this position to get SOW link
                          router.push(`/jobs/${pos.id}`);
                        }}
                      >
                        Review SOW
                      </button>
                    </div>
                  )}
                  {app.sowStatus === "agreed" && (
                    <div style={{ padding: "12px 16px", background: "#d1fae5", borderRadius: 8, fontSize: "0.85rem", color: "#065f46", marginBottom: 16 }}>
                      You agreed to the Statement of Work. You are hired!
                    </div>
                  )}

                  {/* Message thread */}
                  <AppMessageThread applicationId={app.id} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const sectionLabel = {
  fontSize: "0.78rem", fontWeight: 600, color: "var(--gray-600)",
  textTransform: "uppercase", letterSpacing: "0.04em",
  marginBottom: 6, display: "block",
};

// ── PU Message Thread Component ──

function AppMessageThread({ applicationId }) {
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const containerRef = useRef(null);
  const shouldScrollRef = useRef(true);

  const scrollToBottom = () => {
    if (containerRef.current) containerRef.current.scrollTop = containerRef.current.scrollHeight;
  };

  const fetchMessages = () => {
    fetch(`/api/applicants/messages?applicationId=${applicationId}`)
      .then((r) => r.json())
      .then((data) => setMessages(data.messages || []))
      .finally(() => { if (!loaded) { setLoaded(true); shouldScrollRef.current = true; } });
  };

  useEffect(() => {
    shouldScrollRef.current = true;
    fetchMessages();
    const interval = setInterval(fetchMessages, 10000);
    return () => clearInterval(interval);
  }, [applicationId]);

  useEffect(() => {
    if (shouldScrollRef.current) { scrollToBottom(); shouldScrollRef.current = false; }
  }, [messages]);

  const handleSend = async () => {
    if (!newMsg.trim() || sending) return;
    setSending(true);
    try {
      const res = await fetch("/api/applicants/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId, content: newMsg.trim() }),
      });
      const data = await res.json();
      if (data.message) {
        setMessages((prev) => [...prev, data.message]);
        setNewMsg("");
        shouldScrollRef.current = true;
      }
    } catch {}
    setSending(false);
  };

  return (
    <div style={{ borderTop: "1px solid var(--gray-100)", paddingTop: 16 }}>
      <label style={sectionLabel}>Messages</label>
      <div ref={containerRef} style={{
        maxHeight: 300, overflowY: "auto", marginBottom: 12,
        background: "var(--gray-50)", borderRadius: 8, padding: messages.length > 0 ? 12 : 0,
      }}>
        {loaded && messages.length === 0 && (
          <div style={{ padding: "16px 12px", textAlign: "center", color: "var(--gray-400)", fontSize: "0.85rem" }}>
            No messages yet. Send a message to the employer.
          </div>
        )}
        {messages.map((msg, i) => {
          const isMe = msg.sender?.role === "PROFESSIONAL";
          return (
            <div key={msg.id} style={{ display: "flex", flexDirection: "column", alignItems: isMe ? "flex-end" : "flex-start", marginBottom: i < messages.length - 1 ? 10 : 0 }}>
              <div style={{ fontSize: "0.7rem", color: "var(--gray-400)", marginBottom: 3 }}>
                {isMe ? "You" : `${msg.sender?.firstName || "Business"} ${msg.sender?.lastName?.[0] || ""}.`}
                {" · "}
                {timeAgo(msg.createdAt)}
              </div>
              <div style={{
                padding: "8px 14px", borderRadius: 14, maxWidth: "80%",
                fontSize: "0.88rem", lineHeight: 1.5,
                background: isMe ? "var(--teal)" : "white",
                color: isMe ? "white" : "var(--gray-700)",
                border: isMe ? "none" : "1px solid var(--gray-200)",
                borderBottomRightRadius: isMe ? 4 : 14,
                borderBottomLeftRadius: isMe ? 14 : 4,
              }}>
                {msg.content}
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <input
          type="text"
          className="form-input"
          placeholder="Type a message..."
          value={newMsg}
          onChange={(e) => setNewMsg(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          style={{ flex: 1, margin: 0, fontSize: "0.88rem" }}
        />
        <button className="btn-primary" onClick={handleSend} disabled={!newMsg.trim() || sending} style={{ width: "auto", padding: "8px 20px", whiteSpace: "nowrap" }}>
          {sending ? "..." : "Send"}
        </button>
      </div>
    </div>
  );
}
