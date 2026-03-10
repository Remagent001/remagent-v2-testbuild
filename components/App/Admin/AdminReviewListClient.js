"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminReviewListClient() {
  const router = useRouter();
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/positions")
      .then((r) => r.json())
      .then((data) => setPositions(data.positions || []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="onboarding-loading">
        <div className="onboarding-spinner" />
        <p>Loading pending postings...</p>
      </div>
    );
  }

  const needsReview = positions.filter((p) => !p.reviewRequired);
  const sentBack = positions.filter((p) => p.reviewRequired);

  return (
    <div className="positions-page">
      <div className="page-header">
        <h1 className="page-title">Review Job Postings</h1>
        <p className="page-subtitle">Approve or send back job postings submitted by businesses.</p>
      </div>

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
                  <ReviewCard key={pos.id} pos={pos} router={router} />
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
                  <ReviewCard key={pos.id} pos={pos} router={router} isSentBack />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function ReviewCard({ pos, router, isSentBack }) {
  const businessName = pos.user?.businessProfile?.businessName || `${pos.user?.firstName} ${pos.user?.lastName}`;
  return (
    <div className="card position-card" style={{ cursor: "pointer" }}
      onClick={() => router.push(`/admin/review-postings/${pos.id}`)}>
      <div className="position-card-header">
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
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
          </div>
          <p className="position-card-meta">
            Submitted by <strong>{businessName}</strong>
            {" · "}{pos.user?.email}
            {pos.regularRate ? ` · $${pos.regularRate}/hr` : ""}
            {pos.numberOfHires > 1 ? ` · ${pos.numberOfHires} hires` : ""}
          </p>
        </div>
        <button
          className="btn-primary"
          style={{ width: "auto", padding: "8px 16px", fontSize: "0.85rem" }}
          onClick={(e) => { e.stopPropagation(); router.push(`/admin/review-postings/${pos.id}`); }}
        >
          Review
        </button>
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

      {pos.description && (
        <p className="position-card-desc" style={{ marginTop: 8 }}>
          {pos.description.length > 200 ? pos.description.slice(0, 200) + "..." : pos.description}
        </p>
      )}
    </div>
  );
}
