"use client";

import { useState } from "react";

export default function StepContact({ data, onNext, onBack, onSaveExit, onSkip, saving }) {
  const [phone, setPhone] = useState(data?.user?.phone || "");
  const [agreeTexts, setAgreeTexts] = useState(false);

  const getData = () => ({ phone });

  return (
    <div className="onboarding-step">
      <p className="onboarding-step-desc">
        Add your phone number so businesses and Remagent can reach you when needed.
      </p>

      <div className="form-group">
        <label className="form-label">Phone Number</label>
        <input
          className="form-input"
          type="tel"
          placeholder="(555) 123-4567"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
      </div>

      <div className="form-group">
        <label className="form-checkbox">
          <input type="checkbox" checked={agreeTexts} onChange={(e) => setAgreeTexts(e.target.checked)} />
          I agree to receive text messages from Remagent
        </label>
      </div>

      <div className="onboarding-actions">
        <button className="btn-secondary" onClick={onBack} disabled={saving}>Back</button>
        <div className="onboarding-actions-right">
          <button className="btn-link" onClick={onSkip}>Skip</button>
          <button className="btn-secondary" onClick={() => onSaveExit(getData())} disabled={saving}>Save & Exit</button>
          <button className="btn-primary" style={{ width: "auto" }} onClick={() => onNext(getData())} disabled={saving}>{saving ? "Saving..." : "Next"}</button>
        </div>
      </div>
    </div>
  );
}
