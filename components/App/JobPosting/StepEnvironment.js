"use client";

import { useState } from "react";

const WORK_LOCATIONS = [
  { value: "office", label: "Required in a local office" },
  { value: "home", label: "Required to work from home" },
  { value: "mix", label: "Mix of work from home and office" },
  { value: "optional", label: "Allowed to work from home, but not required (office space is available)" },
];

export default function StepEnvironment({ data, onNext, onBack, onSaveExit, onSkip, saving }) {
  const env = data?.position?.environment;

  const [workLocation, setWorkLocation] = useState(() => {
    if (!env?.workLocation) return [];
    if (Array.isArray(env.workLocation)) return env.workLocation;
    try { return JSON.parse(env.workLocation); } catch { return []; }
  });
  const [equipmentPolicy, setEquipmentPolicy] = useState(env?.equipmentPolicy || "");
  const [requirements, setRequirements] = useState(env?.requirements || "");
  const [isDefault, setIsDefault] = useState(false);

  const toggleLocation = (val) => {
    if (workLocation.includes(val)) {
      setWorkLocation(workLocation.filter((v) => v !== val));
    } else {
      setWorkLocation([...workLocation, val]);
    }
  };

  const getData = () => ({
    workLocation,
    equipmentPolicy,
    requirements: requirements.trim(),
    isDefault,
  });

  return (
    <div className="onboarding-step">
      <p className="onboarding-step-desc">
        Define the work environment for this position. Where will the professional work, and who provides the equipment?
      </p>

      <div className="form-group">
        <label className="form-label">Work Location</label>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {WORK_LOCATIONS.map((loc) => (
            <label key={loc.value} className="form-checkbox">
              <input
                type="checkbox"
                checked={workLocation.includes(loc.value)}
                onChange={() => toggleLocation(loc.value)}
              />
              {loc.label}
            </label>
          ))}
        </div>
      </div>

      <div className="form-group" style={{ marginTop: 28 }}>
        <label className="form-label">Equipment</label>
        <p className="form-hint">
          Please indicate if you will provide the software and hardware to the professional or if they will use their own technology. If you are expecting professionals to provide their own technology, please include technology requirements below.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 12 }}>
          <label className="form-checkbox">
            <input
              type="radio"
              name="equipment"
              checked={equipmentPolicy === "provided"}
              onChange={() => setEquipmentPolicy("provided")}
            />
            Business will provide hardware to Professional
          </label>
          <label className="form-checkbox">
            <input
              type="radio"
              name="equipment"
              checked={equipmentPolicy === "byod"}
              onChange={() => setEquipmentPolicy("byod")}
            />
            BYOD (Worker is able to use their own device (PC or Mac))
          </label>
        </div>
      </div>

      {equipmentPolicy === "byod" && (
        <div className="form-group">
          <label className="form-label">System Requirements for BYOD</label>
          <p className="form-hint">Please include all hardware, software, and technical requirements.</p>
          <textarea
            className="form-input form-textarea"
            rows={4}
            placeholder="e.g. Windows 10+, 8GB RAM, wired internet connection, dual monitors recommended..."
            value={requirements}
            onChange={(e) => setRequirements(e.target.value)}
          />
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
          <button className="btn-primary" style={{ width: "auto" }} onClick={() => onNext(getData())} disabled={saving}>
            {saving ? "Saving..." : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}
