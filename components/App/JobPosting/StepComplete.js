"use client";

import { useState } from "react";

function safeParse(val) {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  try { return JSON.parse(val); } catch { return []; }
}

const STEP_NAMES = {
  1: "Position Detail",
  2: "Experience (Channels/Skills/Apps)",
  3: "Environment",
  4: "Availability",
  5: "Hourly Rate",
  6: "Dates & Duration",
  7: "Attachments",
  8: "Screening Questions",
};

export default function StepComplete({ data, onNext, onBack, onSaveExit, saving }) {
  const pos = data?.position;
  const [visibility, setVisibility] = useState(pos?.visibility || "public");
  const [showCompanyName, setShowCompanyName] = useState(pos?.showCompanyName !== false);
  const [showConfirm, setShowConfirm] = useState(false);

  const completedSteps = safeParse(pos?.completedSteps);
  const defaultSteps = safeParse(pos?.defaultSteps);
  const incompleteSteps = [1, 2, 3, 4, 5, 6, 7, 8].filter((n) => !completedSteps.includes(n));
  const trulyIncomplete = incompleteSteps.filter((n) => !defaultSteps.includes(n));
  const usingDefaults = incompleteSteps.filter((n) => defaultSteps.includes(n));

  const getData = () => ({ visibility, showCompanyName, status: "pending_approval" });

  const handleSubmit = () => {
    if (incompleteSteps.length > 0) {
      setShowConfirm(true);
    } else {
      onNext(getData());
    }
  };

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

      {/* Company name visibility */}
      {visibility === "public" && (
        <div className="form-group" style={{ marginTop: 20 }}>
          <label className="form-checkbox" style={{ padding: "14px 20px", border: "1px solid var(--gray-200)", borderRadius: 10 }}>
            <input
              type="checkbox"
              checked={showCompanyName}
              onChange={(e) => setShowCompanyName(e.target.checked)}
            />
            <div>
              <strong style={{ fontSize: "0.9rem" }}>Show company name on listing</strong>
              <p style={{ margin: "4px 0 0", fontSize: "0.82rem", color: "var(--gray-500)" }}>
                {showCompanyName
                  ? "Your company name and logo will be visible to professionals browsing this job posting."
                  : "Your company name will be hidden. Professionals will see the location and industry but not your company identity until you accept them."}
              </p>
            </div>
          </label>
        </div>
      )}

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

      <div className="onboarding-actions">
        <button className="btn-secondary" onClick={onBack} disabled={saving}>Back</button>
        <div className="onboarding-actions-right">
          <button className="btn-secondary" onClick={() => onSaveExit(getData())} disabled={saving}>Save as Draft</button>
          <button
            className="btn-primary"
            style={{ width: "auto" }}
            onClick={handleSubmit}
            disabled={saving}
          >
            {saving ? "Submitting..." : "Submit for Approval"}
          </button>
        </div>
      </div>

      {/* Incomplete sections confirmation dialog */}
      {showConfirm && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center",
          justifyContent: "center", zIndex: 9999,
        }}>
          <div className="card" style={{
            padding: "28px 32px", maxWidth: 460, width: "90%",
            background: "white", borderRadius: 12,
          }}>
            <h3 style={{ marginBottom: 12, color: "var(--gray-800)" }}>Review Before Submitting</h3>

            {trulyIncomplete.length > 0 && (
              <>
                <p style={{ fontSize: "0.9rem", color: "var(--gray-600)", marginBottom: 8 }}>
                  The following sections have not been filled out:
                </p>
                <ul style={{ margin: "0 0 16px 20px", fontSize: "0.85rem", color: "#ef4444" }}>
                  {trulyIncomplete.map((n) => (
                    <li key={n} style={{ marginBottom: 4 }}>{STEP_NAMES[n]}</li>
                  ))}
                </ul>
              </>
            )}

            {usingDefaults.length > 0 && (
              <div style={{
                padding: "12px 16px",
                background: "var(--blue-50, #eff6ff)",
                borderRadius: 8,
                marginBottom: 16,
                borderLeft: "3px solid var(--blue-500, #3b82f6)",
              }}>
                <p style={{ fontSize: "0.85rem", color: "var(--gray-600)", marginBottom: 6 }}>
                  These sections are using your saved defaults:
                </p>
                <ul style={{ margin: "0 0 0 16px", fontSize: "0.85rem", color: "var(--gray-500)" }}>
                  {usingDefaults.map((n) => (
                    <li key={n} style={{ marginBottom: 2 }}>{STEP_NAMES[n]}</li>
                  ))}
                </ul>
              </div>
            )}

            <p style={{ fontSize: "0.9rem", color: "var(--gray-600)", marginBottom: 20 }}>
              Are you sure you want to submit this posting for approval?
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button
                className="btn-secondary"
                style={{ width: "auto" }}
                onClick={() => setShowConfirm(false)}
              >
                Go Back
              </button>
              <button
                className="btn-primary"
                style={{ width: "auto" }}
                onClick={() => { setShowConfirm(false); onNext(getData()); }}
                disabled={saving}
              >
                Submit Anyway
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
