"use client";

import { useState, useEffect } from "react";

export default function StepAgreement({ data, onNext, onBack, onSaveExit, saving }) {
  const [agreed, setAgreed] = useState(data?.profile?.agreementSigned || false);
  const [signingLoading, setSigningLoading] = useState(false);
  const [error, setError] = useState("");

  // Check if we returned from DocuSign with signed=true
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("signed") === "true") {
      setAgreed(true);
    }
    if (params.get("signing") === "cancelled") {
      setError("Signing was cancelled. Please try again to complete your profile.");
    }
  }, []);

  const handleOpenDocuSign = async () => {
    setError("");
    setSigningLoading(true);
    try {
      const res = await fetch("/api/docusign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "professional" }),
      });
      const result = await res.json();

      if (!res.ok) {
        setError(result.error || "Failed to start signing process");
        return;
      }

      if (result.alreadySigned) {
        setAgreed(true);
        return;
      }

      if (result.signingUrl) {
        // Redirect to DocuSign — user will come back via callback
        window.location.href = result.signingUrl;
        return;
      }

      setError("Unexpected response from DocuSign");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSigningLoading(false);
    }
  };

  return (
    <div className="onboarding-step">
      <p className="onboarding-step-desc">
        To complete your profile, you will need to sign the Remagent Professional Services Agreement via DocuSign.
      </p>

      <div className="agreement-box">
        <h3>Professional Services Agreement</h3>
        <div className="agreement-content">
          <p>
            The Remagent Professional Services Agreement outlines the terms of your engagement
            with businesses through the Remagent platform, including payment terms, confidentiality,
            and professional conduct expectations.
          </p>
          <p>
            Once you click the button below, you will be directed to DocuSign to review and
            electronically sign the agreement. Your profile will be activated after signing.
          </p>
        </div>
      </div>

      <div className="form-group" style={{ marginTop: 20 }}>
        <button
          type="button"
          className={agreed ? "btn-secondary" : "btn-primary"}
          style={{ width: "100%", justifyContent: "center", gap: 10, padding: "14px 24px" }}
          onClick={agreed ? undefined : handleOpenDocuSign}
          disabled={agreed || signingLoading}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <path d="M14 2v6h6" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
          </svg>
          {signingLoading ? "Opening DocuSign..." : agreed ? "Agreement Signed" : "Open DocuSign to Sign Agreement"}
        </button>
        {agreed && (
          <div className="agreement-signed-badge">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--teal)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Agreement signed successfully
          </div>
        )}
        {error && (
          <div style={{ color: "#ef4444", fontSize: "0.85rem", marginTop: 10 }}>{error}</div>
        )}
      </div>

      <div className="onboarding-actions">
        <button className="btn-secondary" onClick={onBack} disabled={saving}>Back</button>
        <div className="onboarding-actions-right">
          <button className="btn-secondary" onClick={() => onSaveExit({})} disabled={saving}>Save & Exit</button>
          <button
            className="btn-primary"
            style={{ width: "auto" }}
            onClick={() => onNext({})}
            disabled={!agreed || saving}
          >
            {saving ? "Saving..." : "Complete Profile"}
          </button>
        </div>
      </div>
    </div>
  );
}
