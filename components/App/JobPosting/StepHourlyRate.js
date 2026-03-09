"use client";

import { useState } from "react";

export default function StepHourlyRate({ data, onNext, onBack, onSaveExit, onSkip, saving }) {
  const pos = data?.position;
  const [regularRate, setRegularRate] = useState(pos?.regularRate || "");

  const getData = () => ({ regularRate });

  return (
    <div className="onboarding-step">
      <p className="onboarding-step-desc">
        Set the hourly rate you are offering for this position. This is the rate professionals will see when viewing your posting.
      </p>

      <div className="form-group" style={{ maxWidth: 250 }}>
        <label className="form-label">Hourly Rate ($)</label>
        <input
          className="form-input"
          type="number"
          min="0"
          step="0.50"
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
          <button className="btn-primary" style={{ width: "auto" }} onClick={() => onNext(getData())} disabled={saving}>{saving ? "Saving..." : "Next"}</button>
        </div>
      </div>
    </div>
  );
}
