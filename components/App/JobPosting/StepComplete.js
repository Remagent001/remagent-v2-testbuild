"use client";

import { useState } from "react";

export default function StepComplete({ data, onNext, onBack, onSaveExit, saving }) {
  const pos = data?.position;
  const [visibility, setVisibility] = useState(pos?.visibility || "public");
  const [isDefault, setIsDefault] = useState(pos?.isDefault || false);

  const getData = () => ({ visibility, isDefault, status: "pending_approval" });

  return (
    <div className="onboarding-step">
      <p className="onboarding-step-desc">
        You're almost done! Choose how you'd like this job posting to be shared, then submit it for review.
      </p>

      {/* Visibility choice */}
      <div className="form-group">
        <label className="form-label">Posting Visibility</label>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <label
            className="form-checkbox"
            style={{
              padding: "16px 20px",
              border: visibility === "public" ? "2px solid var(--teal)" : "2px solid var(--gray-200)",
              borderRadius: 10,
              background: visibility === "public" ? "var(--teal-light, #e6f7f5)" : "var(--white)",
              cursor: "pointer",
            }}
          >
            <input
              type="radio"
              name="visibility"
              value="public"
              checked={visibility === "public"}
              onChange={(e) => setVisibility(e.target.value)}
            />
            <div>
              <strong style={{ fontSize: "1rem" }}>Public Posting</strong>
              <p style={{ margin: "6px 0 0", fontSize: "0.85rem", color: "var(--gray-500)" }}>
                Your job posting will be visible to all qualified professionals on the platform.
                Professionals who match your required skills and channels will be able to find and apply to your posting.
                An administrator will review and approve your posting before it goes live.
              </p>
            </div>
          </label>

          <label
            className="form-checkbox"
            style={{
              padding: "16px 20px",
              border: visibility === "private" ? "2px solid var(--teal)" : "2px solid var(--gray-200)",
              borderRadius: 10,
              background: visibility === "private" ? "var(--teal-light, #e6f7f5)" : "var(--white)",
              cursor: "pointer",
            }}
          >
            <input
              type="radio"
              name="visibility"
              value="private"
              checked={visibility === "private"}
              onChange={(e) => setVisibility(e.target.value)}
            />
            <div>
              <strong style={{ fontSize: "1rem" }}>Private Posting</strong>
              <p style={{ margin: "6px 0 0", fontSize: "0.85rem", color: "var(--gray-500)" }}>
                Your job posting will not be visible publicly. Only professionals you directly invite
                will be able to view and respond to this posting. Use this if you want to hand-pick candidates
                from your search results.
              </p>
            </div>
          </label>
        </div>
      </div>

      {/* Approval notice */}
      <div
        className="card"
        style={{
          padding: "16px 20px",
          marginTop: 20,
          background: "var(--blue-50, #eff6ff)",
          borderLeft: "4px solid var(--blue-500, #3b82f6)",
        }}
      >
        <strong style={{ fontSize: "0.9rem", color: "var(--gray-800)" }}>Admin Review Required</strong>
        <p style={{ margin: "6px 0 0", fontSize: "0.85rem", color: "var(--gray-600)" }}>
          {visibility === "public"
            ? "After you submit, an administrator will review your posting. Once approved, it will be published and visible to qualified professionals."
            : "After you submit, an administrator will review your posting. Once approved, you'll be able to invite professionals to apply."}
        </p>
      </div>

      {/* Default checkbox */}
      <div className="form-group" style={{ marginTop: 20 }}>
        <label className="form-checkbox">
          <input type="checkbox" checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)} />
          Save these settings as default for future job postings
        </label>
        <p className="form-hint" style={{ marginLeft: 24 }}>
          When checked, your next new job posting will pre-fill with the details from this one.
        </p>
      </div>

      <div className="onboarding-actions">
        <button className="btn-secondary" onClick={onBack} disabled={saving}>Back</button>
        <div className="onboarding-actions-right">
          <button className="btn-secondary" onClick={() => onSaveExit(getData())} disabled={saving}>Save as Draft</button>
          <button
            className="btn-primary"
            style={{ width: "auto" }}
            onClick={() => onNext(getData())}
            disabled={saving}
          >
            {saving ? "Submitting..." : "Submit for Approval"}
          </button>
        </div>
      </div>
    </div>
  );
}
