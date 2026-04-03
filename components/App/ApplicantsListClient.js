"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import ProgressBubbles from "./ProgressBubbles";

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
  const [expandedId, setExpandedId] = useState(null);

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
            const isExpanded = expandedId === app.id;

            return (
              <div key={app.id} className="card" style={{ padding: 0, overflow: "hidden" }}>
                {/* Header — click to expand */}
                <div
                  style={{ padding: "16px 20px", cursor: "pointer" }}
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
                  <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
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
                      <p style={{ fontSize: "0.82rem", color: "var(--teal)", fontWeight: 600, marginTop: 4 }}>
                        {app.position?.title || "Untitled Position"}
                      </p>
                      <p className="position-card-meta" style={{ marginTop: 2 }}>
                        {loc && (loc.city || loc.state) && `${[loc.city, loc.state].filter(Boolean).join(", ")} · `}
                        {rate && `$${rate}/hr · `}
                        {`Applied ${timeAgo(app.createdAt)}`}
                      </p>
                    </div>

                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <button
                        className="btn-secondary"
                        style={{ width: "auto", fontSize: "0.82rem", padding: "6px 14px" }}
                        onClick={(e) => { e.stopPropagation(); router.push(`/search/${pro?.id}?from=applicants`); }}
                      >
                        View Profile
                      </button>
                      {(app.status === "new" || app.status === "reviewing") && (
                        <>
                          {app.status === "new" && (
                            <button
                              className="btn-secondary"
                              style={{ width: "auto", fontSize: "0.82rem", padding: "6px 14px", color: "#f59e0b", borderColor: "#f59e0b" }}
                              onClick={(e) => { e.stopPropagation(); handleStatusChange(app.id, "reviewing"); }}
                              disabled={updating === app.id}
                            >
                              Mark Reviewing
                            </button>
                          )}
                          <button
                            className="btn-primary"
                            style={{ width: "auto", fontSize: "0.82rem", padding: "6px 14px", background: "#10b981" }}
                            onClick={(e) => { e.stopPropagation(); handleStatusChange(app.id, "accepted"); }}
                            disabled={updating === app.id}
                          >
                            Accept
                          </button>
                          <button
                            className="btn-secondary"
                            style={{ width: "auto", fontSize: "0.82rem", padding: "6px 14px", color: "#ef4444", borderColor: "#ef4444" }}
                            onClick={(e) => { e.stopPropagation(); handleStatusChange(app.id, "declined"); }}
                            disabled={updating === app.id}
                          >
                            Decline
                          </button>
                        </>
                      )}
                      {app.status === "accepted" && app.offer?.id && (
                        <button
                          className={app.sowStatus === "agreed" ? "btn-secondary" : "btn-primary"}
                          style={{
                            width: "auto", fontSize: "0.82rem", padding: "6px 14px",
                            ...(app.sowStatus === "agreed" ? { color: "var(--gray-400)", borderColor: "var(--gray-300)", cursor: "default" } : {}),
                          }}
                          onClick={(e) => { e.stopPropagation(); router.push(`/sow/${app.offer.id}`); }}
                        >
                          {app.sowStatus === "agreed" ? "SOW Complete" :
                           app.sowStatus === "sent" ? "View SOW" :
                           app.sowStatus === "declined" ? "SOW Declined" :
                           app.sowStatus === "draft" ? "Continue SOW" :
                           "Prepare SOW"}
                        </button>
                      )}

                      {/* Expand arrow */}
                      <svg
                        width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--gray-400)" strokeWidth="2"
                        style={{ transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}
                      >
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Expanded: progress tracker + summary + messages */}
                {isExpanded && (
                  <div style={{ borderTop: "1px solid var(--gray-100)", padding: "20px 24px" }}>
                    {/* Progress tracker */}
                    <div style={{ marginBottom: 20 }}>
                      <ProgressBubbles currentStep={app.progressStep || 1} role="business" variant="application" />
                    </div>

                    {/* Applicant summary */}
                    {summary && (
                      <div style={{ marginBottom: 16 }}>
                        <label style={sectionLabel}>Summary</label>
                        <p style={{ fontSize: "0.88rem", color: "var(--gray-600)", lineHeight: 1.6 }}>
                          {summary.length > 400 ? summary.substring(0, 400) + "..." : summary}
                        </p>
                      </div>
                    )}

                    {/* Cover message */}
                    {app.coverMessage && (
                      <div style={{ marginBottom: 16 }}>
                        <label style={sectionLabel}>Cover Message</label>
                        <p style={{ fontSize: "0.88rem", color: "var(--gray-600)", lineHeight: 1.6, fontStyle: "italic" }}>
                          &ldquo;{app.coverMessage}&rdquo;
                        </p>
                      </div>
                    )}

                    {/* Screening answers */}
                    {app.screeningAnswers?.length > 0 && (
                      <div style={{ marginBottom: 16 }}>
                        <label style={sectionLabel}>Screening Questions</label>
                        {app.screeningAnswers.map((qa, i) => (
                          <div key={i} style={{ marginBottom: 8 }}>
                            <p style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--gray-600)" }}>{qa.question}</p>
                            <p style={{ fontSize: "0.85rem", color: "var(--gray-500)" }}>{qa.answer}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Message thread */}
                    <BizAppMessageThread applicationId={app.id} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const sectionLabel = {
  fontSize: "0.78rem", fontWeight: 600, color: "var(--gray-600)",
  textTransform: "uppercase", letterSpacing: "0.04em",
  marginBottom: 6, display: "block",
};

// ── BU Message Thread Component ──

function BizAppMessageThread({ applicationId }) {
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
            No messages yet. Start a conversation with this applicant.
          </div>
        )}
        {messages.map((msg, i) => {
          const isMe = msg.sender?.role !== "PROFESSIONAL";
          return (
            <div key={msg.id} style={{ display: "flex", flexDirection: "column", alignItems: isMe ? "flex-end" : "flex-start", marginBottom: i < messages.length - 1 ? 10 : 0 }}>
              <div style={{ fontSize: "0.7rem", color: "var(--gray-400)", marginBottom: 3 }}>
                {isMe ? "You" : `${msg.sender?.firstName || "Professional"} ${msg.sender?.lastName?.[0] || ""}.`}
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
