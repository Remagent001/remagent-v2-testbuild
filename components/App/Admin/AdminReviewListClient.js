"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminReviewListClient() {
  const router = useRouter();
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(null);

  // Filters
  const [sortBy, setSortBy] = useState("newest"); // newest, oldest
  const [filterBusiness, setFilterBusiness] = useState("all");
  const [filterResubmitted, setFilterResubmitted] = useState(false);

  const loadPositions = () => {
    fetch("/api/admin/positions")
      .then((r) => r.json())
      .then((data) => setPositions(data.positions || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadPositions(); }, []);

  // Quick approve from list
  const handleQuickApprove = async (posId, e) => {
    e.stopPropagation();
    setApproving(posId);
    await fetch(`/api/admin/positions/${posId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "approve" }),
    });
    loadPositions();
    setApproving(null);
  };

  if (loading) {
    return (
      <div className="onboarding-loading">
        <div className="onboarding-spinner" />
        <p>Loading pending postings...</p>
      </div>
    );
  }

  // Get unique business names for filter
  const businessNames = [...new Set(positions.map((p) => {
    return p.user?.businessProfile?.businessName || `${p.user?.firstName} ${p.user?.lastName}`;
  }))].sort();

  // Apply filters
  let filtered = [...positions];
  if (filterBusiness !== "all") {
    filtered = filtered.filter((p) => {
      const name = p.user?.businessProfile?.businessName || `${p.user?.firstName} ${p.user?.lastName}`;
      return name === filterBusiness;
    });
  }
  if (filterResubmitted) {
    filtered = filtered.filter((p) => p.resubmittedAt);
  }

  // Apply sort
  filtered.sort((a, b) => {
    if (sortBy === "newest") return new Date(b.createdAt) - new Date(a.createdAt);
    return new Date(a.createdAt) - new Date(b.createdAt);
  });

  const needsReview = filtered.filter((p) => !p.reviewRequired);
  const sentBack = filtered.filter((p) => p.reviewRequired);

  return (
    <div className="positions-page">
      <div className="page-header">
        <h1 className="page-title">Review Job Postings</h1>
        <p className="page-subtitle">Approve or send back job postings submitted by businesses.</p>
      </div>

      {/* Sort & Filter controls */}
      {positions.length > 0 && (
        <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
          <select
            className="form-input form-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{ width: "auto", fontSize: "0.85rem", padding: "6px 12px" }}
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>
          {businessNames.length > 1 && (
            <select
              className="form-input form-select"
              value={filterBusiness}
              onChange={(e) => setFilterBusiness(e.target.value)}
              style={{ width: "auto", fontSize: "0.85rem", padding: "6px 12px" }}
            >
              <option value="all">All Businesses</option>
              {businessNames.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          )}
          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.85rem", color: "var(--gray-600)", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={filterResubmitted}
              onChange={(e) => setFilterResubmitted(e.target.checked)}
            />
            Resubmitted only
          </label>
        </div>
      )}

      {positions.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "48px 24px" }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--gray-300)" strokeWidth="1.5" style={{ margin: "0 auto 16px" }}>
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          <h3 style={{ color: "var(--gray-600)", marginBottom: 8 }}>All clear!</h3>
          <p style={{ color: "var(--gray-400)", fontSize: "0.9rem" }}>
            No job postings are waiting for review right now.
          </p>
        </div>
      ) : (
        <>
          {/* Awaiting review */}
          {needsReview.length > 0 && (
            <div style={{ marginBottom: 32 }}>
              <h2 style={{ fontSize: "1rem", color: "var(--gray-600)", marginBottom: 12 }}>
                Awaiting Review ({needsReview.length})
              </h2>
              <div className="positions-list">
                {needsReview.map((pos) => (
                  <ReviewCard
                    key={pos.id}
                    pos={pos}
                    router={router}
                    onQuickApprove={handleQuickApprove}
                    approving={approving}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Sent back */}
          {sentBack.length > 0 && (
            <div>
              <h2 style={{ fontSize: "1rem", color: "var(--gray-600)", marginBottom: 12 }}>
                Sent Back for Changes ({sentBack.length})
              </h2>
              <div className="positions-list">
                {sentBack.map((pos) => (
                  <ReviewCard
                    key={pos.id}
                    pos={pos}
                    router={router}
                    isSentBack
                    onQuickApprove={handleQuickApprove}
                    approving={approving}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function ReviewCard({ pos, router, isSentBack, onQuickApprove, approving }) {
  const businessName = pos.user?.businessProfile?.businessName || `${pos.user?.firstName} ${pos.user?.lastName}`;
  const submittedDate = new Date(pos.createdAt).toLocaleDateString();
  const isResubmitted = !!pos.resubmittedAt;

  return (
    <div className="card position-card" style={{ cursor: "pointer" }}
      onClick={() => router.push(`/admin/review-postings/${pos.id}`)}>
      <div className="position-card-header">
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4, flexWrap: "wrap" }}>
            <h3 className="position-card-title">{pos.title || "Untitled Position"}</h3>
            <span
              className="position-status-badge"
              style={{
                backgroundColor: isSentBack ? "#ef444418" : "#f59e0b18",
                color: isSentBack ? "#ef4444" : "#f59e0b",
              }}
            >
              {isSentBack ? "Needs Changes" : "Pending Review"}
            </span>
            <span className="position-visibility-badge" style={{
              backgroundColor: pos.visibility === "public" ? "var(--teal-light)" : "var(--gray-100)",
              color: pos.visibility === "public" ? "var(--teal)" : "var(--gray-500)",
            }}>
              {pos.visibility === "public" ? "Will be Public" : "Will be Private"}
            </span>
            {isResubmitted && (
              <span
                className="position-status-badge"
                style={{ backgroundColor: "#3b82f618", color: "#3b82f6" }}
              >
                Resubmitted
              </span>
            )}
          </div>
          <p className="position-card-meta">
            Submitted by <strong>{businessName}</strong>
            {" · "}{pos.user?.email}
            {" · "}{submittedDate}
            {pos.regularRate ? ` · $${pos.regularRate}/hr` : ""}
            {pos.numberOfHires > 1 ? ` · ${pos.numberOfHires} hires` : ""}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            className="btn-primary"
            style={{ width: "auto", padding: "8px 16px", fontSize: "0.85rem", background: "#10b981" }}
            onClick={(e) => onQuickApprove(pos.id, e)}
            disabled={approving === pos.id}
          >
            {approving === pos.id ? "..." : "Approve"}
          </button>
          <button
            className="btn-secondary"
            style={{ width: "auto", padding: "8px 16px", fontSize: "0.85rem" }}
            onClick={(e) => { e.stopPropagation(); router.push(`/admin/review-postings/${pos.id}`); }}
          >
            Review
          </button>
        </div>
      </div>

      {isSentBack && pos.adminNote && (
        <div style={{
          padding: "10px 14px",
          marginTop: 8,
          background: "#fef2f2",
          borderLeft: "4px solid #ef4444",
          borderRadius: 6,
          fontSize: "0.82rem",
        }}>
          <strong style={{ color: "#dc2626" }}>Your note:</strong>
          <span style={{ color: "#7f1d1d", marginLeft: 6 }}>{pos.adminNote}</span>
        </div>
      )}

      {pos.description && (() => {
        const text = pos.description.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();
        return text ? (
          <p className="position-card-desc" style={{ marginTop: 8 }}>
            {text.length > 200 ? text.slice(0, 200) + "..." : text}
          </p>
        ) : null;
      })()}
    </div>
  );
}
