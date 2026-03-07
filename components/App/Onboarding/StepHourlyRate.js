"use client";

import { useState } from "react";

export default function StepHourlyRate({ data, onNext, onBack, onSaveExit, onSkip, saving }) {
  const rate = data?.hourlyRate;
  const [regularRate, setRegularRate] = useState(rate?.regularRate || "");

  const getData = () => ({ regularRate });

  const displayRate = regularRate ? (parseFloat(regularRate) * 1.1).toFixed(2) : "0.00";

  return (
    <div className="onboarding-step">
      <p className="onboarding-step-desc">
        Set your hourly rate. When hired, you'll receive your rate plus a 10% Remagent bonus.
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

      {regularRate && (
        <div className="rate-preview">
          <div className="rate-preview-label">You will receive:</div>
          <div className="rate-preview-value">${displayRate}/hr</div>
          <div className="rate-preview-note">(Your rate of ${parseFloat(regularRate || 0).toFixed(2)} + 10% Remagent bonus)</div>
        </div>
      )}

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
