"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import ProgressBubbles from "./ProgressBubbles";

const MSG_STATUS_CONFIG = {
  unread:         { color: "#ef4444", label: "New message", sortOrder: 1 },
  awaiting_reply: { color: "#f59e0b", label: "Message received", sortOrder: 2 },
  active:         { color: "#10b981", label: "Message sent", sortOrder: 3 },
  stale:          { color: "#94a3b8", label: "", sortOrder: 4 },
};

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 2) return "Just now";
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

const DAY_LABELS = { sunday: "Sun", monday: "Mon", tuesday: "Tue", wednesday: "Wed", thursday: "Thu", friday: "Fri", saturday: "Sat" };
const DAY_ORDER = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

function to12hr(time24) {
  if (!time24) return "";
  const [h, m] = time24.split(":");
  const hr = parseInt(h, 10);
  return `${hr === 0 ? 12 : hr > 12 ? hr - 12 : hr}:${m} ${hr >= 12 ? "PM" : "AM"}`;
}

export default function InboxClient() {
  const { data: session } = useSession();
  const isBusiness = session?.user?.role === "BUSINESS" || session?.user?.role === "ADMIN";
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [mobileShowThread, setMobileShowThread] = useState(false);

  const loadConversations = () => {
    const url = isBusiness ? "/api/invites" : "/api/invitations";
    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        const list = isBusiness ? (data.invites || []) : (data.invitations || []);
        // Sort: unread first, then by last message time
        const sorted = [...list].sort((a, b) => {
          const aOrder = MSG_STATUS_CONFIG[a.messageStatus]?.sortOrder || 5;
          const bOrder = MSG_STATUS_CONFIG[b.messageStatus]?.sortOrder || 5;
          if (aOrder !== bOrder) return aOrder - bOrder;
          const aTime = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : new Date(a.createdAt).getTime();
          const bTime = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : new Date(b.createdAt).getTime();
          return bTime - aTime;
        });
        setConversations(sorted);
        // Auto-select first if nothing selected
        if (!selectedId && sorted.length > 0) {
          setSelectedId(sorted[0].id);
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (session) {
      loadConversations();
      const interval = setInterval(loadConversations, 15000);
      return () => clearInterval(interval);
    }
  }, [session]);

  const selected = conversations.find((c) => c.id === selectedId);

  // Counts
  const unreadCount = conversations.filter((c) => c.messageStatus === "unread").length;
  const receivedCount = conversations.filter((c) => c.messageStatus === "awaiting_reply").length;
  const totalWithMessages = conversations.filter((c) => c.messageStatus).length;

  if (loading) {
    return (
      <div className="onboarding-loading">
        <div className="onboarding-spinner" />
        <p>Loading inbox...</p>
      </div>
    );
  }

  return (
    <div className="positions-page">
      <div className="page-header">
        <h1 className="page-title">Inbox</h1>
        <p className="page-subtitle">
          {unreadCount > 0
            ? `${unreadCount} unread message${unreadCount !== 1 ? "s" : ""}`
            : totalWithMessages > 0
            ? `${totalWithMessages} conversation${totalWithMessages !== 1 ? "s" : ""}`
            : "Your messages will appear here"}
        </p>
      </div>

      {conversations.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "48px 24px" }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--gray-300)" strokeWidth="1.5" style={{ margin: "0 auto 16px" }}>
            <rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
          </svg>
          <h3 style={{ color: "var(--gray-600)", marginBottom: 8 }}>No messages yet</h3>
          <p style={{ color: "var(--gray-400)", fontSize: "0.9rem" }}>
            {isBusiness
              ? "When you invite professionals, your conversations will appear here."
              : "When businesses reach out, your conversations will appear here."}
          </p>
        </div>
      ) : (
        <div style={{
          display: "flex",
          border: "1px solid var(--gray-200)",
          borderRadius: 12,
          overflow: "hidden",
          height: "calc(100vh - 220px)",
          minHeight: 400,
          background: "white",
        }}>
          {/* Left panel — conversation list */}
          <div style={{
            width: 360,
            minWidth: 280,
            borderRight: "1px solid var(--gray-200)",
            overflowY: "auto",
            flexShrink: 0,
          }}
            className="inbox-list-panel"
          >
            {/* Summary counts */}
            <div style={{
              padding: "14px 16px",
              borderBottom: "1px solid var(--gray-100)",
              display: "flex",
              gap: 12,
              fontSize: "0.78rem",
              color: "var(--gray-500)",
              background: "var(--gray-50)",
            }}>
              {unreadCount > 0 && (
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#ef4444" }} />
                  {unreadCount} unread
                </span>
              )}
              {receivedCount > 0 && (
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#f59e0b" }} />
                  {receivedCount} need reply
                </span>
              )}
              <span style={{ marginLeft: "auto" }}>{conversations.length} total</span>
            </div>

            {conversations.map((conv) => {
              const isActive = conv.id === selectedId;
              const cfg = MSG_STATUS_CONFIG[conv.messageStatus];
              const preview = conv.lastMessageContent
                ? (conv.lastMessageContent.length > 50 ? conv.lastMessageContent.substring(0, 50) + "..." : conv.lastMessageContent)
                : "No messages yet";

              let name, subtitle;
              if (isBusiness) {
                name = `${conv.user?.firstName || ""} ${conv.user?.lastName || ""}`.trim() || "Professional";
                subtitle = conv.position?.title || "Untitled";
              } else {
                const biz = conv.position?.user?.businessProfile;
                name = biz?.businessName || `${conv.position?.user?.firstName || ""} ${conv.position?.user?.lastName || ""}`.trim() || "Business";
                subtitle = conv.position?.title || "Untitled";
              }

              return (
                <div
                  key={conv.id}
                  onClick={() => { setSelectedId(conv.id); setMobileShowThread(true); }}
                  style={{
                    padding: "14px 16px",
                    cursor: "pointer",
                    borderBottom: "1px solid var(--gray-50)",
                    background: isActive ? "var(--teal-dim)" : conv.messageStatus === "unread" ? "#fef2f210" : "transparent",
                    borderLeft: isActive ? "3px solid var(--teal)" : "3px solid transparent",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = "var(--gray-50)"; }}
                  onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = conv.messageStatus === "unread" ? "#fef2f210" : "transparent"; }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0 }}>
                      {cfg && (
                        <span style={{
                          width: 9, height: 9, minWidth: 9,
                          borderRadius: "50%", background: cfg.color,
                        }} />
                      )}
                      <span style={{
                        fontSize: "0.9rem",
                        fontWeight: conv.messageStatus === "unread" ? 700 : 600,
                        color: "var(--gray-800)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}>
                        {name}
                      </span>
                    </div>
                    <span style={{
                      fontSize: "0.72rem",
                      color: "var(--gray-400)",
                      whiteSpace: "nowrap",
                      marginLeft: 8,
                    }}>
                      {timeAgo(conv.lastMessageAt || conv.createdAt)}
                    </span>
                  </div>
                  <div style={{
                    fontSize: "0.8rem",
                    color: "var(--teal)",
                    fontWeight: 500,
                    marginBottom: 2,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}>
                    {subtitle}
                  </div>
                  <div style={{
                    fontSize: "0.8rem",
                    color: conv.messageStatus === "unread" ? "var(--gray-700)" : "var(--gray-400)",
                    fontWeight: conv.messageStatus === "unread" ? 600 : 400,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}>
                    {preview}
                  </div>
                  {cfg?.label && (
                    <span style={{
                      fontSize: "0.68rem",
                      fontWeight: 600,
                      color: cfg.color,
                      marginTop: 3,
                      display: "inline-block",
                    }}>
                      {cfg.label}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Right panel — conversation detail */}
          <div style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
            className={`inbox-detail-panel${mobileShowThread ? " inbox-mobile-show" : ""}`}
          >
            {selected ? (
              <ConversationDetail
                conversation={selected}
                isBusiness={isBusiness}
                onBack={() => setMobileShowThread(false)}
                onRefresh={loadConversations}
              />
            ) : (
              <div style={{
                flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
                color: "var(--gray-400)", fontSize: "0.9rem",
              }}>
                Select a conversation to view messages
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ConversationDetail({ conversation, isBusiness, onBack, onRefresh }) {
  const router = useRouter();
  const inv = conversation;
  const pos = isBusiness ? inv.position : inv.position;
  const schedule = (pos?.availability || []).sort((a, b) => DAY_ORDER.indexOf(a.day) - DAY_ORDER.indexOf(b.day));

  let headerName, headerSub;
  if (isBusiness) {
    const pro = inv.user;
    const profile = pro?.professionalProfile;
    headerName = `${pro?.firstName || ""} ${pro?.lastName || ""}`.trim() || "Professional";
    headerSub = profile?.title || "";
  } else {
    const biz = pos?.user?.businessProfile;
    headerName = biz?.businessName || "Business";
    headerSub = biz?.city ? `${biz.city}${biz.state ? `, ${biz.state}` : ""}` : "";
  }

  const statusColors = {
    pending: { bg: "#f59e0b18", color: "#f59e0b", label: "Pending" },
    accepted: { bg: "#10b98118", color: "#10b981", label: "Accepted" },
    declined: { bg: "#ef444418", color: "#ef4444", label: "Declined" },
    withdrawn: { bg: "#94a3b818", color: "#94a3b8", label: "Withdrawn" },
  };
  const sc = statusColors[inv.status] || statusColors.pending;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Header bar */}
      <div style={{
        padding: "14px 20px",
        borderBottom: "1px solid var(--gray-100)",
        background: "var(--gray-50)",
        display: "flex",
        alignItems: "center",
        gap: 12,
        flexShrink: 0,
      }}>
        {/* Mobile back button */}
        <button
          onClick={onBack}
          className="inbox-back-btn"
          style={{
            display: "none",
            background: "none", border: "none", cursor: "pointer",
            padding: 4, color: "var(--gray-500)",
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <span style={{ fontSize: "1rem", fontWeight: 600, color: "var(--gray-800)" }}>
              {headerName}
            </span>
            <span style={{
              padding: "2px 10px", borderRadius: 12, fontSize: "0.72rem", fontWeight: 600,
              background: sc.bg, color: sc.color,
            }}>
              {sc.label}
            </span>
          </div>
          {headerSub && (
            <span style={{ fontSize: "0.82rem", color: "var(--gray-500)" }}>{headerSub}</span>
          )}
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <span style={{
            fontSize: "0.82rem", color: "var(--teal)", fontWeight: 600,
            padding: "4px 12px", background: "var(--teal-dim)", borderRadius: 8,
            border: "1px solid var(--teal-border)",
          }}>
            {pos?.title || "Untitled Position"}
          </span>
          {isBusiness ? (
            <button
              className="btn-secondary"
              style={{ width: "auto", fontSize: "0.78rem", padding: "4px 12px" }}
              onClick={() => router.push(`/search/${inv.user?.id}?from=inbox`)}
            >
              View Profile
            </button>
          ) : null}
        </div>
      </div>

      {/* Progress bubbles */}
      <div style={{ padding: "12px 20px", borderBottom: "1px solid var(--gray-50)", flexShrink: 0 }}>
        <ProgressBubbles currentStep={inv.progressStep || 1} role={isBusiness ? "business" : "professional"} />
      </div>

      {/* Job details (collapsed) */}
      {!isBusiness && pos && (
        <JobDetailsSummary position={pos} schedule={schedule} />
      )}

      {/* Message thread */}
      <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        <InboxMessageThread offerId={inv.id} isBusiness={isBusiness} />
      </div>

      {/* Action buttons for PU */}
      {!isBusiness && inv.status === "pending" && (
        <PUActions inviteId={inv.id} onRefresh={onRefresh} />
      )}
      {!isBusiness && inv.status === "accepted" && inv.sow && (
        <div style={{
          padding: "10px 20px", borderTop: "1px solid var(--gray-100)",
          background: "#d1fae5", fontSize: "0.85rem", color: "#065f46",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <span>
            {inv.sow.status === "agreed"
              ? "You agreed to the SOW. You are hired!"
              : inv.sow.status === "sent"
              ? "A Statement of Work has been sent for your review."
              : "Accepted. Waiting for next steps."}
          </span>
          {(inv.sow.status === "sent" || inv.sow.status === "agreed") && (
            <button
              className="btn-primary"
              style={{ width: "auto", fontSize: "0.78rem", padding: "4px 14px", whiteSpace: "nowrap" }}
              onClick={() => router.push(`/sow/${inv.id}`)}
            >
              {inv.sow.status === "sent" ? "Review SOW" : "View SOW"}
            </button>
          )}
        </div>
      )}

      {/* BU actions */}
      {isBusiness && inv.status === "accepted" && (
        <div style={{
          padding: "10px 20px", borderTop: "1px solid var(--gray-100)",
          display: "flex", gap: 8, flexShrink: 0,
        }}>
          <button
            className="btn-primary"
            style={{ width: "auto", fontSize: "0.82rem", padding: "6px 16px" }}
            onClick={() => router.push(`/sow/${inv.id}`)}
          >
            Prepare SOW
          </button>
        </div>
      )}
    </div>
  );
}

function JobDetailsSummary({ position, schedule }) {
  const [expanded, setExpanded] = useState(false);
  const description = stripHtml(position?.description);
  const rate = position?.regularRate;
  const env = position?.environment;
  const biz = position?.user?.businessProfile;

  return (
    <div style={{ borderBottom: "1px solid var(--gray-50)", flexShrink: 0 }}>
      <div
        style={{
          padding: "10px 20px",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontSize: "0.82rem",
          color: "var(--gray-500)",
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <span style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {rate && <span style={{ fontWeight: 600, color: "var(--teal)" }}>${rate}/hr</span>}
          {env?.workLocation && (
            <span>
              {Array.isArray(env.workLocation) ? (env.workLocation.includes("home") && env.workLocation.includes("office") ? "Hybrid" : env.workLocation.includes("home") ? "Remote" : "Office") : ""}
            </span>
          )}
          {schedule.length > 0 && <span>{schedule.length} day{schedule.length !== 1 ? "s" : ""}/week</span>}
        </span>
        <svg
          width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>
      {expanded && (
        <div style={{ padding: "0 20px 14px" }}>
          {description && (
            <p style={{ fontSize: "0.85rem", color: "var(--gray-600)", lineHeight: 1.5, marginBottom: 10 }}>
              {description.length > 300 ? description.substring(0, 300) + "..." : description}
            </p>
          )}
          {schedule.length > 0 && (
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 8 }}>
              {schedule.map((s) => (
                <span key={s.day} style={{
                  padding: "3px 8px", borderRadius: 6,
                  fontSize: "0.72rem", fontWeight: 500,
                  background: "var(--teal-dim)", color: "var(--teal)",
                  border: "1px solid var(--teal-border)",
                }}>
                  {DAY_LABELS[s.day]} {to12hr(s.startTime)}-{to12hr(s.endTime)}
                </span>
              ))}
            </div>
          )}
          {position?.skills?.length > 0 && (
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
              {position.skills.map((s, i) => (
                <span key={i} className="profile-tag" style={{ fontSize: "0.72rem", padding: "2px 8px" }}>
                  {s.skill.name}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function InboxMessageThread({ offerId, isBusiness }) {
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const bottomRef = useRef(null);
  const containerRef = useRef(null);

  const fetchMessages = () => {
    fetch(`/api/invitations/messages?offerId=${offerId}`)
      .then((r) => r.json())
      .then((data) => setMessages(data.messages || []))
      .finally(() => setLoaded(true));
  };

  useEffect(() => {
    setLoaded(false);
    setMessages([]);
    fetchMessages();
    const interval = setInterval(fetchMessages, 8000);
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
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Messages area */}
      <div
        ref={containerRef}
        style={{
          flex: 1, overflowY: "auto", padding: 16,
          background: "var(--gray-50)",
        }}
      >
        {loaded && messages.length === 0 && (
          <div style={{ textAlign: "center", color: "var(--gray-400)", fontSize: "0.85rem", padding: "40px 0" }}>
            No messages yet. Start the conversation below.
          </div>
        )}
        {messages.map((msg, i) => {
          const isMe = isBusiness ? (msg.sender?.role !== "PROFESSIONAL") : (msg.sender?.role === "PROFESSIONAL");
          return (
            <div key={msg.id} style={{
              display: "flex", flexDirection: "column",
              alignItems: isMe ? "flex-end" : "flex-start",
              marginBottom: i < messages.length - 1 ? 10 : 0,
            }}>
              <div style={{ fontSize: "0.7rem", color: "var(--gray-400)", marginBottom: 3 }}>
                {isMe ? "You" : `${msg.sender?.firstName || (isBusiness ? "Professional" : "Business")} ${msg.sender?.lastName?.[0] || ""}.`}
                {" · "}
                {timeAgo(msg.createdAt)}
              </div>
              <div style={{
                padding: "8px 14px", borderRadius: 14,
                maxWidth: "75%", fontSize: "0.88rem", lineHeight: 1.5,
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

      {/* Compose bar */}
      <div style={{
        padding: "12px 16px",
        borderTop: "1px solid var(--gray-200)",
        background: "white",
        display: "flex", gap: 8,
        flexShrink: 0,
      }}>
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

function PUActions({ inviteId, onRefresh }) {
  const [responding, setResponding] = useState(false);

  const handleRespond = async (action) => {
    if (action === "decline" && !confirm("Are you sure you want to decline this invitation?")) return;
    setResponding(true);
    try {
      await fetch("/api/invitations", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteId, action }),
      });
      onRefresh();
    } catch {}
    setResponding(false);
  };

  return (
    <div style={{
      padding: "12px 20px",
      borderTop: "1px solid var(--gray-100)",
      display: "flex", gap: 10,
      flexShrink: 0,
    }}>
      <button
        className="btn-primary"
        style={{ width: "auto", padding: "8px 24px" }}
        onClick={() => handleRespond("accept")}
        disabled={responding}
      >
        {responding ? "..." : "Accept & Apply"}
      </button>
      <button
        className="btn-secondary"
        style={{ width: "auto", padding: "8px 24px" }}
        onClick={() => handleRespond("decline")}
        disabled={responding}
      >
        Decline
      </button>
    </div>
  );
}
