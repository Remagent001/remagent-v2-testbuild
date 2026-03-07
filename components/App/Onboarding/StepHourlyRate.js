"use client";

import { useState } from "react";

export default function StepHourlyRate({ data, onNext, onBack, onSaveExit, onSkip, saving }) {
  const rate = data?.hourlyRate;
  const [regularRate, setRegularRate] = useState(rate?.regularRate || "");

  const getData = () => ({ regularRate });

  return (
    <div className="onboarding-step">
      <p className="onboarding-step-desc">
        Set your hourly rate. This is the rate businesses will see on your profile.
      </p>

      <div className="form-group">
        <label className="form-label">Regular Hourly Rate ($) *</label>
        <input
          className="form-input"
          type="number"
          min="0"
          step="0.01"
          placeholder="e.g. 25.00"
          value={regularRate}
          onChange={(e) => setRegularRate(e.target.value)}
        />
      </div>

      <div className="onboarding-actions">
        <button className="btn-secondary" onClick={onBack} disabled={saving}>Back</button>
        <div className="onboarding-actions-right">
          <button className="btn-link" onClick={onSkip}>Skip</button>
          <button className="btn-secondary" onClick={() => onSaveExit(getData())} disabled={saving}>Save & Exit</button>
          <button className="btn-primary" style={{ width: "auto" }} onClick={() => onNext(getData())} disabled={!regularRate || saving}>{saving ? "Saving..." : "Next"}</button>
        </div>
      </div>
    </div>
  );
}
