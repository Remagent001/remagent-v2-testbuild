"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const STATUS_LABELS = {
  draft: "Draft",
  pending_approval: "Pending Approval",
  published: "Published",
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

export default function PositionsListClient() {
  const router = useRouter();
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);

  const loadPositions = () => {
    fetch("/api/positions")
      .then((r) => r.json())
      .then((data) => setPositions(data.positions || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadPositions(); }, []);

  const handleDelete = async (id, title) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    setDeleting(id);
    await fetch(`/api/positions/${id}`, { method: "DELETE" });
    setPositions((prev) => prev.filter((p) => p.id !== id));
    setDeleting(null);
  };

  const handleStatusToggle = async (pos) => {
    const newStatus = pos.status === "active" ? "closed" : "active";
    await fetch(`/api/positions/${pos.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...pos, status: newStatus, skills: pos.skills.map(s => s.skillId), channels: pos.channels.map(c => ({ channelId: c.channelId, experience: c.experience })) }),
    });
    loadPositions();
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
      ) : (
        <div className="positions-list">
          {positions.map((pos) => (
            <div key={pos.id} className="card position-card">
              <div className="position-card-header">
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                    <h3 className="position-card-title">{pos.title}</h3>
                    <span
                      className="position-status-badge"
                      style={{ backgroundColor: `${STATUS_COLORS[pos.status]}18`, color: STATUS_COLORS[pos.status] }}
                    >
                      {STATUS_LABELS[pos.status] || pos.status}
                    </span>
                    <span className="position-visibility-badge" style={{
                      backgroundColor: pos.visibility === "public" ? "var(--teal-light)" : "var(--gray-100)",
                      color: pos.visibility === "public" ? "var(--teal)" : "var(--gray-500)",
                    }}>
                      {pos.visibility === "public" ? "Public" : "Private"}
                    </span>
                  </div>
                  <p className="position-card-meta">
                    {pos.numberOfHires > 1 ? `${pos.numberOfHires} hires` : "1 hire"}
                    {pos.regularRate ? ` · $${pos.regularRate}/hr` : ""}
                    {pos.contractType ? ` · ${pos.contractType === "open_ended" ? "Open-ended" : "Fixed term"}` : ""}
                  </p>
                </div>
                <div className="position-card-actions">
                  {(pos.status === "draft" || pos.status === "active") && (
                    <button
                      className="btn-secondary"
                      style={{ padding: "6px 12px", fontSize: "0.8rem" }}
                      onClick={() => handleStatusToggle(pos)}
                    >
                      {pos.status === "draft" ? "Activate" : "Close"}
                    </button>
                  )}
                  {pos.status === "closed" && (
                    <button
                      className="btn-secondary"
                      style={{ padding: "6px 12px", fontSize: "0.8rem" }}
                      onClick={() => handleStatusToggle(pos)}
                    >
                      Reopen
                    </button>
                  )}
                  <button
                    className="btn-secondary"
                    style={{ padding: "6px 12px", fontSize: "0.8rem" }}
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

              {pos.description && (
                <p className="position-card-desc">
                  {pos.description.length > 150 ? pos.description.slice(0, 150) + "..." : pos.description}
                </p>
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
                {pos.skills?.length > 0 && (
                  <span className="position-card-skills">
                    {pos.skills.slice(0, 3).map((s) => s.skill.name).join(", ")}
                    {pos.skills.length > 3 && ` +${pos.skills.length - 3} more`}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
