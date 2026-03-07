"use client";

import { useState } from "react";

export default function StepAgreement({ data, onNext, onBack, onSaveExit, saving }) {
  const [agreed, setAgreed] = useState(data?.profile?.agreementSigned || false);

  return (
    <div className="onboarding-step">
      <p className="onboarding-step-desc">
        Review and accept the Remagent Professional Agreement to complete your profile.
      </p>

      <div className="agreement-box">
        <h3>Professional Services Agreement</h3>
        <div className="agreement-content">
          <p>
            By checking the box below, you agree to the Remagent Professional Services Agreement.
            This agreement outlines the terms of your engagement with businesses through the
            Remagent platform, including payment terms, confidentiality, and professional conduct
            expectations.
          </p>
          <p>
            The full agreement will be sent to you via DocuSign for electronic signature once
            the platform launches. For now, checking this box indicates your intent to proceed.
          </p>
        </div>
      </div>

      <div className="form-group" style={{ marginTop: 16 }}>
        <label className="form-checkbox">
          <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
          I have read and agree to the Professional Services Agreement
        </label>
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
