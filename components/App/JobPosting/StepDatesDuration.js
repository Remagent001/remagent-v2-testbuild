"use client";

import { useState } from "react";

export default function StepDatesDuration({ data, onNext, onBack, onSaveExit, onSkip, saving }) {
  const pos = data?.position;
  const [contractType, setContractType] = useState(pos?.contractType || "");
  const [startOption, setStartOption] = useState(pos?.startOption || "");
  const [expectedStartDate, setExpectedStartDate] = useState(
    pos?.expectedStartDate ? pos.expectedStartDate.split("T")[0] : ""
  );
  const [expectedEndDate, setExpectedEndDate] = useState(
    pos?.expectedEndDate ? pos.expectedEndDate.split("T")[0] : ""
  );
  const [isDefault, setIsDefault] = useState(false);

  const getData = () => ({
    contractType, startOption, expectedStartDate, expectedEndDate, isDefault,
  });

  return (
    <div className="onboarding-step">
      <p className="onboarding-step-desc">
        Choose the type of contract and when you'd like the position to start.
      </p>

      {/* Contract Type */}
      <div className="form-group">
        <label className="form-label">Contract Type</label>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <label className="form-checkbox">
            <input type="radio" name="contractType" value="open_ended" checked={contractType === "open_ended"} onChange={(e) => setContractType(e.target.value)} />
            Open Ended Contract
          </label>
          <label className="form-checkbox">
            <input type="radio" name="contractType" value="fixed" checked={contractType === "fixed"} onChange={(e) => setContractType(e.target.value)} />
            Fixed Duration Contract
          </label>
          <label className="form-checkbox">
            <input type="radio" name="contractType" value="direct_hire" checked={contractType === "direct_hire"} onChange={(e) => setContractType(e.target.value)} />
            Direct Hire
          </label>
        </div>
      </div>

      {/* Start Time */}
      <div className="form-group" style={{ marginTop: 24 }}>
        <label className="form-label">Choose How to Start</label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
          <label className="form-checkbox">
            <input type="radio" name="startOption" value="immediately" checked={startOption === "immediately"} onChange={(e) => setStartOption(e.target.value)} />
            Start Immediately
          </label>
          <label className="form-checkbox">
            <input type="radio" name="startOption" value="flexible" checked={startOption === "flexible"} onChange={(e) => setStartOption(e.target.value)} />
            Flexible Start Date
          </label>
          <label className="form-checkbox">
            <input type="radio" name="startOption" value="date" checked={startOption === "date"} onChange={(e) => setStartOption(e.target.value)} />
            Expected Start Date
          </label>
        </div>
      </div>

      {/* Date pickers */}
      {(startOption === "date" || contractType === "fixed") && (
        <div className="form-row" style={{ marginTop: 16 }}>
          {startOption === "date" && (
            <div className="form-group form-half">
              <label className="form-label">Expected Start Date of Job</label>
              <input className="form-input" type="date" value={expectedStartDate} onChange={(e) => setExpectedStartDate(e.target.value)} />
            </div>
          )}
          {contractType === "fixed" && (
            <div className="form-group form-half">
              <label className="form-label">Expected End Date of Job</label>
              <input className="form-input" type="date" value={expectedEndDate} onChange={(e) => setExpectedEndDate(e.target.value)} />
            </div>
          )}
        </div>
      )}

      <div className="form-group" style={{ marginTop: 20 }}>
        <label className="form-checkbox">
          <input type="checkbox" checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)} />
          Default to this for future job postings
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
