"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import ProgressBubbles from "./ProgressBubbles";

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
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
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
  const [filterPosition, setFilterPosition] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [unreadCounts, setUnreadCounts] = useState({});

  const loadInvites = () => {
    fetch("/api/invites")
      .then((r) => r.json())
      .then((data) => {
        const list = data.invites || [];
        setInvites(list);
        // Check for unread messages on each invite
        list.forEach((inv) => {
          fetch(`/api/invitations/messages?offerId=${inv.id}`)
            .then((r) => r.json())
            .then((msgData) => {
              const unread = (msgData.messages || []).filter((m) => m.sender?.role === "PROFESSIONAL" && !m.read).length;
              if (unread > 0) {
                setUnreadCounts((prev) => ({ ...prev, [inv.id]: unread }));
              }
            })
            .catch(() => {});
        });
      })
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

  const positionTitles = [...new Set(invites.map((inv) => inv.position?.title).filter(Boolean))].sort();

  let filtered = activeTab ? invites.filter((inv) => inv.status === activeTab) : invites;
  if (filterPosition) {
    filtered = filtered.filter((inv) => inv.position?.title === filterPosition);
  }

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

      {/* Filter by JP */}
      {positionTitles.length > 1 && (
        <div style={{ marginBottom: 16 }}>
          <select
            className="form-input form-select"
            value={filterPosition}
            onChange={(e) => setFilterPosition(e.target.value)}
            style={{ width: "auto", fontSize: "0.85rem", padding: "6px 12px" }}
          >
            <option value="">All Job Postings</option>
            {positionTitles.map((title) => (
              <option key={title} value={title}>{title}</option>
            ))}
          </select>
        </div>
      )}

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
            const isExpanded = expandedId === inv.id;
            const unread = unreadCounts[inv.id] || 0;

            return (
              <div key={inv.id} className="card" style={{ padding: 0, overflow: "hidden" }}>
                {/* Header */}
                <div
                  style={{ padding: "16px 20px", cursor: "pointer" }}
                  onClick={() => setExpandedId(isExpanded ? null : inv.id)}
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
                          {inv.status.charAt(0).toUpperCase() + inv.status.slice(1)}
                        </span>
                        {unread > 0 && (
                          <span style={{
                            padding: "2px 8px", borderRadius: 10, fontSize: "0.7rem", fontWeight: 700,
                            background: "#ef4444", color: "white",
                          }}>
                            {unread} new message{unread > 1 ? "s" : ""}
                          </span>
                        )}
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

                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <button
                        className="btn-secondary"
                        style={{ width: "auto", fontSize: "0.82rem", padding: "6px 14px" }}
                        onClick={(e) => { e.stopPropagation(); router.push(`/search/${pro?.id}?from=invites`); }}
                      >
                        View Profile
                      </button>
                      {inv.status === "pending" && (
                        <button
                          className="btn-secondary"
                          style={{ width: "auto", fontSize: "0.82rem", padding: "6px 14px", color: "#ef4444", borderColor: "#ef4444" }}
                          onClick={(e) => { e.stopPropagation(); handleWithdraw(inv.id); }}
                          disabled={withdrawing === inv.id}
                        >
                          {withdrawing === inv.id ? "..." : "Withdraw"}
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

                {/* Expanded: progress + message thread */}
                {isExpanded && (
                  <div style={{ borderTop: "1px solid var(--gray-100)", padding: "20px 24px" }}>
                    <div style={{ marginBottom: 20 }}>
                      <ProgressBubbles currentStep={inv.progressStep || 1} />
                    </div>
                    <BizMessageThread offerId={inv.id} onRead={() => setUnreadCounts((prev) => ({ ...prev, [inv.id]: 0 }))} />
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

function BizMessageThread({ offerId, onRead }) {
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    fetch(`/api/invitations/messages?offerId=${offerId}`)
      .then((r) => r.json())
      .then((data) => {
        setMessages(data.messages || []);
        if (onRead) onRead();
      })
      .finally(() => setLoaded(true));
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
    <div>
      <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--gray-600)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 8, display: "block" }}>
        Messages
      </label>

      <div style={{
        maxHeight: 300, overflowY: "auto", marginBottom: 12,
        background: "var(--gray-50)", borderRadius: 8, padding: messages.length > 0 ? 12 : 0,
      }}>
        {loaded && messages.length === 0 && (
          <div style={{ padding: "16px 12px", textAlign: "center", color: "var(--gray-400)", fontSize: "0.85rem" }}>
            No messages yet. Send a message to start a conversation.
          </div>
        )}
        {messages.map((msg, i) => {
          const isMe = msg.sender?.role !== "PROFESSIONAL";
          return (
            <div key={msg.id} style={{
              display: "flex", flexDirection: "column",
              alignItems: isMe ? "flex-end" : "flex-start",
              marginBottom: i < messages.length - 1 ? 10 : 0,
            }}>
              <div style={{ fontSize: "0.7rem", color: "var(--gray-400)", marginBottom: 3 }}>
                {isMe ? "You" : `${msg.sender?.firstName || "Professional"} ${msg.sender?.lastName?.[0] || ""}.`}
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
