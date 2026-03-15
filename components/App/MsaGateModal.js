"use client";

export default function MsaGateModal({ onClose }) {
  return (
    <div className="modal-backdrop" onClick={onClose} style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480, margin: "0 auto" }}>
        <div style={{ textAlign: "center", padding: "32px 24px" }}>
          <div style={{
            width: 64, height: 64, borderRadius: "50%",
            background: "var(--teal-dim)", display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 20px",
          }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--teal)" strokeWidth="1.5">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <path d="M9 15l2 2 4-4" />
            </svg>
          </div>
          <h3 style={{ fontSize: "1.1rem", fontWeight: 600, color: "var(--gray-800)", marginBottom: 8 }}>
            Agreement Required
          </h3>
          <p style={{ fontSize: "0.9rem", color: "var(--gray-700)", lineHeight: 1.6, marginBottom: 20 }}>
            To access professional profiles and send invitations, please sign your Master Services Agreement.
            You can sign it on your Company Profile page.
          </p>
          <p style={{ fontSize: "0.85rem", color: "var(--gray-600)", marginBottom: 24, lineHeight: 1.5 }}>
            Need help? Contact us at{" "}
            <a href="mailto:support@remagent.com" style={{ color: "var(--teal)", textDecoration: "none" }}>
              support@remagent.com
            </a>{" "}
            or call{" "}
            <a href="tel:2146325485" style={{ color: "var(--teal)", textDecoration: "none" }}>
              214-632-5485
            </a>
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            <button className="btn-secondary" onClick={onClose} style={{ width: "auto", padding: "8px 20px" }}>
              Close
            </button>
            <button
              className="btn-primary"
              onClick={() => { window.location.href = "/company-profile"; }}
              style={{ width: "auto", padding: "8px 20px" }}
            >
              Go to Company Profile
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
