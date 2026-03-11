"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const TABS = [
  { key: "published", label: "Public", color: "#10b981" },
  { key: "private", label: "Private", color: "#6366f1" },
  { key: "pending_approval", label: "Pending", color: "#f59e0b" },
  { key: "draft", label: "Drafts", color: "#94a3b8" },
  { key: "closed", label: "Closed", color: "#ef4444" },
];

const STATUS_LABELS = {
  draft: "Draft",
  pending_approval: "Pending Approval",
  published: "Public",
  private: "Private",
  closed: "Closed",
};

const STATUS_COLORS = {
  draft: "#94a3b8",
  pending_approval: "#f59e0b",
  published: "#10b981",
  private: "#6366f1",
  closed: "#ef4444",
};

const WIZARD_STEPS = [
  { num: 1, short: "Detail" },
  { num: 2, short: "Exp" },
  { num: 3, short: "Enviro" },
  { num: 4, short: "Avail" },
  { num: 5, short: "Rate" },
  { num: 6, short: "Dates" },
  { num: 7, short: "Attach" },
  { num: 8, short: "Screen" },
  { num: 9, short: "Post" },
];

function safeParse(val) {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  try { return JSON.parse(val); } catch { return []; }
}

function MiniProgressBubbles({ completedSteps }) {
  const completed = safeParse(completedSteps);
  return (
    <div style={{ display: "flex", gap: 4, alignItems: "center", marginTop: 8 }}>
      {WIZARD_STEPS.map((step) => {
        const done = completed.includes(step.num);
        return (
          <div
            key={step.num}
            title={`${step.short}${done ? " (complete)" : " (incomplete)"}`}
            style={{
              width: 20,
              height: 20,
              borderRadius: "50%",
              fontSize: "0.55rem",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: done ? "var(--teal)" : "var(--gray-100)",
              color: done ? "white" : "var(--gray-400)",
              border: done ? "none" : "1px solid var(--gray-200)",
            }}
          >
            {done ? (
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : step.num}
          </div>
        );
      })}
    </div>
  );
}

// Experience tags — show Desired and Required separately
function ExperienceTags({ skills, channels, positionApps }) {
  const desired = [];
  const required = [];

  (skills || []).forEach((s) => {
    const name = s.skill?.name || "Skill";
    if (s.requirement === "required") required.push(name);
    else desired.push(name);
  });
  (channels || []).forEach((c) => {
    const name = c.channel?.name || "Channel";
    if (c.requirement === "required") required.push(name);
    else desired.push(name);
  });
  (positionApps || []).forEach((a) => {
    const name = a.application?.name || "App";
    if (a.requirement === "required") required.push(name);
    else desired.push(name);
  });

  if (desired.length === 0 && required.length === 0) return null;

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
      {required.length > 0 && (
        <>
          <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--teal)", textTransform: "uppercase", alignSelf: "center", marginRight: 2 }}>Required:</span>
          {required.map((name, i) => (
            <span key={`r-${i}`} style={{
              padding: "3px 10px", borderRadius: 14, fontSize: "0.75rem", fontWeight: 600,
              background: "var(--teal)", color: "white",
            }}>{name}</span>
          ))}
        </>
      )}
      {desired.length > 0 && (
        <>
          <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--gray-500)", textTransform: "uppercase", alignSelf: "center", marginRight: 2, marginLeft: required.length > 0 ? 8 : 0 }}>Desired:</span>
          {desired.map((name, i) => (
            <span key={`d-${i}`} style={{
              padding: "3px 10px", borderRadius: 14, fontSize: "0.75rem",
              background: "var(--gray-100)", color: "var(--gray-600)",
              border: "1px solid var(--teal)",
            }}>{name}</span>
          ))}
        </>
      )}
    </div>
  );
}

export default function PositionsListClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlTab = searchParams.get("tab");
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);
  const [activeTab, setActiveTab] = useState(urlTab || "published");
  const [updatingStatus, setUpdatingStatus] = useState(null);

  const loadPositions = () => {
    fetch("/api/positions")
      .then((r) => r.json())
      .then((data) => setPositions(data.positions || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadPositions(); }, []);

  // Count positions per tab
  const counts = {};
  TABS.forEach((t) => { counts[t.key] = 0; });
  positions.forEach((p) => {
    if (counts[p.status] !== undefined) counts[p.status]++;
  });

  // Auto-select first tab that has items, fallback to "published"
  // But respect URL tab if provided
  useEffect(() => {
    if (!loading && positions.length > 0) {
      if (urlTab && counts[urlTab] > 0) {
        setActiveTab(urlTab);
        return;
      }
      const hasItemsInActive = counts[activeTab] > 0;
      if (!hasItemsInActive) {
        const firstWithItems = TABS.find((t) => counts[t.key] > 0);
        if (firstWithItems) setActiveTab(firstWithItems.key);
      }
    }
  }, [loading, positions.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = positions.filter((p) => p.status === activeTab);

  const handleDelete = async (id, title) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    setDeleting(id);
    await fetch(`/api/positions/${id}`, { method: "DELETE" });
    setPositions((prev) => prev.filter((p) => p.id !== id));
    setDeleting(null);
  };

  const handleStatusChange = async (posId, newStatus) => {
    setUpdatingStatus(posId);
    await fetch(`/api/positions/${posId}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    loadPositions();
    setUpdatingStatus(null);
  };

  // Toggle visibility for pending positions
  const handleVisibilityToggle = async (posId, currentVisibility) => {
    const newVis = currentVisibility === "public" ? "private" : "public";
    setUpdatingStatus(posId);
    await fetch(`/api/positions/${posId}/visibility`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visibility: newVis }),
    });
    loadPositions();
    setUpdatingStatus(null);
  };

  if (loading) {
    return (
      <div className="onboarding-loading">
        <div className="onboarding-spinner" />
        <p>Loading job postings...</p>
      </div>
    );
  }

  return (
    <div className="positions-page">
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 className="page-title">Job Postings</h1>
          <p className="page-subtitle">Create and manage your job postings to find the right professionals.</p>
        </div>
        <button
          className="btn-primary"
          style={{ width: "auto", whiteSpace: "nowrap" }}
          onClick={() => router.push("/positions/new")}
        >
          + New Posting
        </button>
      </div>

      {/* Tabs */}
      <div style={{
        display: "flex",
        gap: 0,
        borderBottom: "2px solid var(--gray-200)",
        marginBottom: 24,
        overflowX: "auto",
      }}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: "12px 20px",
                fontSize: "0.9rem",
                fontWeight: isActive ? 600 : 400,
                color: isActive ? tab.color : "var(--gray-500)",
                background: "none",
                border: "none",
                borderBottom: isActive ? `3px solid ${tab.color}` : "3px solid transparent",
                cursor: "pointer",
                whiteSpace: "nowrap",
                marginBottom: -2,
                transition: "all 0.15s ease",
              }}
            >
              {tab.label}
              {counts[tab.key] > 0 && (
                <span style={{
                  marginLeft: 8,
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  padding: "2px 8px",
                  borderRadius: 10,
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
      {positions.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "48px 24px" }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--gray-300)" strokeWidth="1.5" style={{ margin: "0 auto 16px" }}>
            <rect x="2" y="7" width="20" height="14" rx="2" />
            <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
          </svg>
          <h3 style={{ color: "var(--gray-600)", marginBottom: 8 }}>No job postings yet</h3>
          <p style={{ color: "var(--gray-400)", marginBottom: 20, fontSize: "0.9rem" }}>
            Create your first posting to start finding professionals.
          </p>
          <button
            className="btn-primary"
            style={{ width: "auto", margin: "0 auto" }}
            onClick={() => router.push("/positions/new")}
          >
            Create Your First Posting
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "48px 24px" }}>
          <p style={{ color: "var(--gray-400)", fontSize: "0.9rem" }}>
            No {STATUS_LABELS[activeTab]?.toLowerCase()} job postings.
          </p>
        </div>
      ) : (
        <div className="positions-list">
          {filtered.map((pos) => (
            <div key={pos.id} className="card position-card">
              <div className="position-card-header">
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4, flexWrap: "wrap" }}>
                    <h3 className="position-card-title">{pos.title || "Untitled Position"}</h3>
                    <span
                      className="position-status-badge"
                      style={{ backgroundColor: `${STATUS_COLORS[pos.status]}18`, color: STATUS_COLORS[pos.status] }}
                    >
                      {STATUS_LABELS[pos.status] || pos.status}
                    </span>
                    {pos.status === "pending_approval" && pos.reviewRequired && (
                      <span
                        className="position-status-badge"
                        style={{ backgroundColor: "#ef444418", color: "#ef4444" }}
                      >
                        Needs Changes
                      </span>
                    )}
                    {/* For pending postings: show which visibility it will become, clickable to toggle */}
                    {pos.status === "pending_approval" && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleVisibilityToggle(pos.id, pos.visibility); }}
                        disabled={updatingStatus === pos.id}
                        style={{
                          padding: "3px 10px", borderRadius: 14, fontSize: "0.75rem", fontWeight: 600, cursor: "pointer",
                          border: "1px dashed",
                          backgroundColor: pos.visibility === "public" ? "var(--teal-light)" : "var(--gray-100)",
                          color: pos.visibility === "public" ? "var(--teal)" : "var(--gray-500)",
                          borderColor: pos.visibility === "public" ? "var(--teal)" : "var(--gray-400)",
                        }}
                        title="Click to toggle between Public and Private"
                      >
                        {pos.visibility === "public" ? "Will be Public" : "Will be Private"}
                      </button>
                    )}
                  </div>
                  <p className="position-card-meta">
                    {pos.numberOfHires > 1 ? `${pos.numberOfHires} hires` : "1 hire"}
                    {pos.regularRate ? ` · $${pos.regularRate}/hr` : ""}
                    {pos.contractType ? ` · ${pos.contractType === "open_ended" ? "Open-ended" : pos.contractType === "fixed" ? "Fixed term" : "Direct hire"}` : ""}
                  </p>
                </div>
                <div className="position-card-actions">
                  <StatusActions
                    pos={pos}
                    onStatusChange={handleStatusChange}
                    updating={updatingStatus === pos.id}
                  />
                  <button
                    className={pos.reviewRequired ? "btn-primary" : "btn-secondary"}
                    style={{ padding: "6px 12px", fontSize: "0.8rem", ...(pos.reviewRequired ? { width: "auto" } : {}) }}
                    onClick={() => router.push(`/positions/${pos.id}`)}
                  >
                    Edit
                  </button>
                  <button
                    className="btn-danger-outline"
                    style={{ padding: "6px 12px", fontSize: "0.8rem" }}
                    onClick={() => handleDelete(pos.id, pos.title)}
                    disabled={deleting === pos.id}
                  >
                    {deleting === pos.id ? "..." : "Delete"}
                  </button>
                </div>
              </div>

              {/* Admin note banner */}
              {pos.reviewRequired && pos.adminNote && (
                <div style={{
                  padding: "12px 16px",
                  marginTop: 8,
                  background: "#fef2f2",
                  borderLeft: "4px solid #ef4444",
                  borderRadius: 6,
                  fontSize: "0.85rem",
                }}>
                  <strong style={{ color: "#dc2626" }}>Admin Note:</strong>
                  <p style={{ margin: "4px 0 0", color: "#7f1d1d" }}>{pos.adminNote}</p>
                </div>
              )}

              {pos.description && (
                <p className="position-card-desc">
                  {pos.description.length > 150 ? pos.description.slice(0, 150) + "..." : pos.description}
                </p>
              )}

              {pos.status === "draft" && (
                <MiniProgressBubbles completedSteps={pos.completedSteps} />
              )}

              <div className="position-card-stats">
                <span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                  {pos._count.applications} {pos._count.applications === 1 ? "applicant" : "applicants"}
                </span>
                <span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                  {pos._count.offers} {pos._count.offers === 1 ? "invite" : "invites"}
                </span>
                <span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                  {pos._count.hires} {pos._count.hires === 1 ? "hire" : "hires"}
                </span>
              </div>

              {/* Experience items — split by Desired vs Required */}
              <ExperienceTags skills={pos.skills} channels={pos.channels} positionApps={pos.positionApps} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Status action buttons — different per tab
function StatusActions({ pos, onStatusChange, updating }) {
  const btnStyle = { padding: "6px 12px", fontSize: "0.8rem" };
  const disabled = updating;

  switch (pos.status) {
    case "published":
      return (
        <>
          <button className="btn-secondary" style={btnStyle} disabled={disabled}
            onClick={() => onStatusChange(pos.id, "private")}>
            Make Private
          </button>
          <button className="btn-secondary" style={btnStyle} disabled={disabled}
            onClick={() => onStatusChange(pos.id, "closed")}>
            Close
          </button>
        </>
      );
    case "private":
      return (
        <>
          <button className="btn-secondary" style={btnStyle} disabled={disabled}
            onClick={() => onStatusChange(pos.id, "published")}>
            Make Public
          </button>
          <button className="btn-secondary" style={btnStyle} disabled={disabled}
            onClick={() => onStatusChange(pos.id, "closed")}>
            Close
          </button>
        </>
      );
    case "closed":
      return (
        <>
          <button className="btn-secondary" style={btnStyle} disabled={disabled}
            onClick={() => onStatusChange(pos.id, "published")}>
            Reopen as Public
          </button>
          <button className="btn-secondary" style={btnStyle} disabled={disabled}
            onClick={() => onStatusChange(pos.id, "private")}>
            Reopen as Private
          </button>
        </>
      );
    case "pending_approval":
      if (pos.reviewRequired) {
        return (
          <button className="btn-secondary" style={btnStyle} disabled={disabled}
            onClick={() => onStatusChange(pos.id, "resubmit")}>
            Resubmit
          </button>
        );
      }
      return (
        <span style={{ fontSize: "0.8rem", color: "#f59e0b", fontStyle: "italic" }}>
          Awaiting admin review...
        </span>
      );
    case "draft":
      return null; // Drafts just have Edit
    default:
      return null;
  }
}
