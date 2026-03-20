"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import ProgressBubbles from "./ProgressBubbles";
import { convertTime, to12hr as to12hrTz, tzLabel } from "@/utilities/TimeZoneHelper";

const DAY_LABELS = { sunday: "Sun", monday: "Mon", tuesday: "Tue", wednesday: "Wed", thursday: "Thu", friday: "Fri", saturday: "Sat" };
const DAY_ORDER = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

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

const MSG_STATUS_CONFIG = {
  unread:         { color: "#ef4444", label: "New message" },
  awaiting_reply: { color: "#f59e0b", label: "Message received" },
  active:         { color: "#10b981", label: "Message sent" },
  stale:          { color: "#94a3b8", label: "" },
};

function MessageIndicator({ status }) {
  if (!status) return null;
  const cfg = MSG_STATUS_CONFIG[status];
  if (!cfg) return null;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
      <span style={{
        width: 9, height: 9, borderRadius: "50%",
        background: cfg.color, flexShrink: 0, display: "inline-block",
      }} />
      {cfg.label && (
        <span style={{ fontSize: "0.72rem", fontWeight: 600, color: cfg.color }}>
          {cfg.label}
        </span>
      )}
    </span>
  );
}

export default function InvitationsClient() {
  const { data: session } = useSession();
  const viewerTz = session?.user?.timezone || "Americas/Eastern";
  const router = useRouter();
  const [invitations, setInvitations] = useState([]);
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [expandedId, setExpandedId] = useState(null);
  const [responding, setResponding] = useState(null); // inviteId being responded to

  useEffect(() => {
    fetchInvitations();
    const interval = setInterval(fetchInvitations, 15000);
    return () => clearInterval(interval);
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
  const rate = pos?.regularRate;
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
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <span style={{
                  padding: "3px 12px", borderRadius: 12,
                  fontSize: "0.75rem", fontWeight: 600,
                  background: status.bg, color: status.text,
                }}>
                  {status.label}
                </span>
                <MessageIndicator status={invitation.messageStatus} />
                {rate && (
                  <span style={{ fontSize: "1rem", fontWeight: 700, color: "var(--teal)" }}>
                    ${rate}<span style={{ fontSize: "0.75rem", fontWeight: 400, color: "var(--gray-400)" }}>/hr</span>
                  </span>
                )}
              </div>
            </div>

            <div style={{ display: "flex", gap: 12, fontSize: "0.8rem", color: "var(--gray-400)", marginTop: 4, flexWrap: "wrap" }}>
              <span>Received {timeAgo(invitation.createdAt)}</span>
              {env?.workLocation && (
                <span>
                  {Array.isArray(env.workLocation) ? (env.workLocation.includes("home") && env.workLocation.includes("office") ? "Hybrid" : env.workLocation.includes("home") ? "Remote" : "Office") : ""}
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
          {/* Progress tracker */}
          <div style={{ marginBottom: 20 }}>
            <ProgressBubbles currentStep={invitation.progressStep || 1} role="professional" />
          </div>

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
                    {DAY_LABELS[s.day]} {to12hrTz(convertTime(s.startTime, pos?.timezone, viewerTz))} - {to12hrTz(convertTime(s.endTime, pos?.timezone, viewerTz))} {tzLabel(viewerTz)}
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

          {/* Video call */}
          <ZoomButton offerId={invitation.id} />

          {/* Message thread */}
          <MessageThread offerId={invitation.id} />

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
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: "#d1fae5", borderRadius: 8, fontSize: "0.85rem", color: "#065f46" }}>
              <span>
                {invitation.sow?.status === "agreed"
                  ? "You agreed to the Statement of Work. You are hired!"
                  : invitation.sow?.status === "sent"
                  ? "A Statement of Work has been sent to you for review."
                  : "You accepted this invitation. The business has been notified and your application is active."}
              </span>
              {invitation.sow?.status === "sent" && (
                <button
                  className="btn-primary"
                  style={{ width: "auto", fontSize: "0.82rem", padding: "6px 16px", marginLeft: 12, whiteSpace: "nowrap" }}
                  onClick={() => window.location.href = `/sow/${invitation.id}`}
                >
                  Review SOW
                </button>
              )}
              {invitation.sow?.status === "agreed" && (
                <button
                  className="btn-secondary"
                  style={{ width: "auto", fontSize: "0.82rem", padding: "6px 16px", marginLeft: 12, whiteSpace: "nowrap" }}
                  onClick={() => window.location.href = `/sow/${invitation.id}`}
                >
                  View SOW
                </button>
              )}
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

function MessageThread({ offerId }) {
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const bottomRef = useRef(null);

  const fetchMessages = () => {
    fetch(`/api/invitations/messages?offerId=${offerId}`)
      .then((r) => r.json())
      .then((data) => setMessages(data.messages || []))
      .finally(() => setLoaded(true));
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 10000);
    return () => clearInterval(interval);
  }, [offerId]);

  useEffect(() => {
    if (bottomRef.current) bottomRef.current.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!newMsg.trim() || sending) return;
    setSending(true);
    try {
      const res = await fetch("/api/invitations/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ offerId, content: newMsg.trim() }),
      });
      const data = await res.json();
      if (data.message) {
        setMessages((prev) => [...prev, data.message]);
        setNewMsg("");
      }
    } catch {}
    setSending(false);
  };

  return (
    <div style={{ marginBottom: 16, borderTop: "1px solid var(--gray-100)", paddingTop: 16 }}>
      <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--gray-600)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 8, display: "block" }}>
        Messages
      </label>

      <div style={{
        maxHeight: 300, overflowY: "auto", marginBottom: 12,
        background: "var(--gray-50)", borderRadius: 8, padding: messages.length > 0 ? 12 : 0,
      }}>
        {loaded && messages.length === 0 && (
          <div style={{ padding: "16px 12px", textAlign: "center", color: "var(--gray-400)", fontSize: "0.85rem" }}>
            No messages yet. Ask a question or start a conversation.
          </div>
        )}
        {messages.map((msg, i) => {
          const isMe = msg.sender?.role === "PROFESSIONAL";
          return (
            <div key={msg.id} style={{
              display: "flex", flexDirection: "column",
              alignItems: isMe ? "flex-end" : "flex-start",
              marginBottom: i < messages.length - 1 ? 10 : 0,
            }}>
              <div style={{ fontSize: "0.7rem", color: "var(--gray-400)", marginBottom: 3 }}>
                {isMe ? "You" : `${msg.sender?.firstName || "Business"} ${msg.sender?.lastName?.[0] || ""}.`}
                {" · "}
                {timeAgo(msg.createdAt)}
              </div>
              <div style={{
                padding: "8px 14px", borderRadius: 14,
                maxWidth: "80%", fontSize: "0.88rem", lineHeight: 1.5,
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
        <div ref={bottomRef} />
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
        <button
          className="btn-primary"
          onClick={handleSend}
          disabled={!newMsg.trim() || sending}
          style={{ width: "auto", padding: "8px 20px", whiteSpace: "nowrap" }}
        >
          {sending ? "..." : "Send"}
        </button>
      </div>
    </div>
  );
}

function ZoomButton({ offerId }) {
  const [starting, setStarting] = useState(false);

  const handleZoom = async () => {
    setStarting(true);
    try {
      const res = await fetch("/api/invitations/zoom", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ offerId }),
      });
      const data = await res.json();
      if (data.joinUrl) {
        window.open(data.joinUrl, "_blank");
      } else {
        alert(data.error || "Failed to start video call");
      }
    } catch {
      alert("Failed to start video call");
    }
    setStarting(false);
  };

  return (
    <div style={{ marginBottom: 16 }}>
      <button
        onClick={handleZoom}
        disabled={starting}
        style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          padding: "8px 18px", borderRadius: 8,
          background: "#2D8CFF", color: "white",
          border: "none", fontSize: "0.85rem", fontWeight: 600,
          cursor: starting ? "wait" : "pointer",
          opacity: starting ? 0.7 : 1,
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="23 7 16 12 23 17 23 7" />
          <rect x="1" y="5" width="15" height="14" rx="2" />
        </svg>
        {starting ? "Starting..." : "Start Video Call"}
      </button>
    </div>
  );
}
