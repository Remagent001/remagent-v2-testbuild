"use client";

import { useState, useEffect } from "react";

export default function InviteModal({ professionalId, professionalName, onClose }) {
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(null);
  const [sent, setSent] = useState({});

  useEffect(() => {
    fetch(`/api/invites/check?professionalId=${professionalId}`)
      .then((r) => r.json())
      .then((data) => setPositions(data.positions || []))
      .finally(() => setLoading(false));
  }, [professionalId]);

  const handleInvite = async (positionId) => {
    setSending(positionId);
    const res = await fetch("/api/invites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ positionId, professionalId }),
    });
    const data = await res.json();
    setSending(null);

    if (data.success) {
      setSent((prev) => ({ ...prev, [positionId]: true }));
    } else if (data.error === "Already invited to this posting") {
      setSent((prev) => ({ ...prev, [positionId]: "already" }));
    }
  };

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center",
      justifyContent: "center", zIndex: 9999,
    }}
      onClick={onClose}
    >
      <div
        className="card"
        style={{
          padding: "28px 32px",
          maxWidth: 520,
          width: "90%",
          background: "white",
          borderRadius: 12,
          maxHeight: "80vh",
          display: "flex",
          flexDirection: "column",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ fontSize: "1.1rem", marginBottom: 4, color: "var(--gray-800)" }}>
          Invite to Apply
        </h2>
        <p style={{ fontSize: "0.85rem", color: "var(--gray-500)", marginBottom: 20 }}>
          Choose which job posting to invite <strong>{professionalName}</strong> to.
        </p>

        {loading ? (
          <div style={{ textAlign: "center", padding: "24px 0" }}>
            <div className="onboarding-spinner" style={{ margin: "0 auto 8px" }} />
            <p style={{ fontSize: "0.85rem", color: "var(--gray-400)" }}>Loading your postings...</p>
          </div>
        ) : positions.length === 0 ? (
          <div style={{ textAlign: "center", padding: "24px 0" }}>
            <p style={{ fontSize: "0.9rem", color: "var(--gray-500)", marginBottom: 8 }}>
              You don't have any active job postings yet.
            </p>
            <p style={{ fontSize: "0.82rem", color: "var(--gray-400)" }}>
              Create and publish a posting first, then you can invite professionals.
            </p>
          </div>
        ) : (
          <div style={{ overflow: "auto", flex: 1 }}>
            {positions.map((pos) => {
              const alreadyInvited = pos.inviteStatus || sent[pos.id];
              const justSent = sent[pos.id] === true;
              const wasPrevious = pos.inviteStatus;

              return (
                <div
                  key={pos.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "14px 16px",
                    borderBottom: "1px solid var(--gray-100)",
                    gap: 12,
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: "0.9rem", color: "var(--gray-800)" }}>
                      {pos.title || "Untitled Position"}
                    </div>
                    <div style={{ fontSize: "0.78rem", color: "var(--gray-400)", marginTop: 2 }}>
                      {pos.status === "published" ? "Public" : "Private"}
                      {pos.regularRate ? ` · $${pos.regularRate}/hr` : ""}
                      {pos.numberOfHires > 1 ? ` · ${pos.numberOfHires} hires` : ""}
                    </div>
                  </div>

                  {alreadyInvited ? (
                    <span style={{
                      fontSize: "0.8rem",
                      padding: "6px 14px",
                      borderRadius: 20,
                      background: justSent ? "#ecfdf5" : "var(--gray-100)",
                      color: justSent ? "#059669" : "var(--gray-400)",
                      fontWeight: 500,
                      whiteSpace: "nowrap",
                    }}>
                      {justSent ? "Invited!" : wasPrevious === "accepted" ? "Accepted" : wasPrevious === "declined" ? "Declined" : "Already Invited"}
                    </span>
                  ) : (
                    <button
                      className="btn-primary"
                      style={{
                        width: "auto",
                        padding: "6px 16px",
                        fontSize: "0.82rem",
                        whiteSpace: "nowrap",
                      }}
                      disabled={sending === pos.id}
                      onClick={() => handleInvite(pos.id)}
                    >
                      {sending === pos.id ? "Sending..." : "Invite"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div style={{ marginTop: 20, textAlign: "right" }}>
          <button
            className="btn-secondary"
            style={{ width: "auto" }}
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
