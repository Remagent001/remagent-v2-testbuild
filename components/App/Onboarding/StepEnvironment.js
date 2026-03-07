"use client";

import { useState } from "react";

const COMPUTER_TYPES = ["Desktop", "Laptop", "Mac"];

const emptyComputer = (type) => ({ type, brand: "", year: "", model: "", cpu: "", ram: "" });

export default function StepEnvironment({ data, onNext, onBack, onSaveExit, onSkip, saving }) {
  const env = data?.environment;

  const [workFromHome, setWorkFromHome] = useState(env?.workFromHome || false);
  const [workFromOffice, setWorkFromOffice] = useState(env?.workFromOffice || false);
  const [computers, setComputers] = useState(() => {
    const saved = env?.computers;
    return Array.isArray(saved) ? saved : [];
  });
  const [internetTypes, setInternetTypes] = useState(() => {
    const saved = env?.internetTypes;
    return Array.isArray(saved) ? saved : [];
  });
  const [homeOfficeDesc, setHomeOfficeDesc] = useState(env?.homeOfficeDesc || "");
  const [showInfoTip, setShowInfoTip] = useState(false);

  const toggleComputerType = (type) => {
    if (computers.find((c) => c.type === type)) {
      setComputers(computers.filter((c) => c.type !== type));
    } else {
      setComputers([...computers, emptyComputer(type)]);
    }
  };

  const updateComputer = (type, field, value) => {
    setComputers(computers.map((c) => c.type === type ? { ...c, [field]: value } : c));
  };

  const toggleInternet = (type) => {
    if (internetTypes.includes(type)) {
      setInternetTypes(internetTypes.filter((t) => t !== type));
    } else {
      setInternetTypes([...internetTypes, type]);
    }
  };

  const getData = () => ({
    workFromHome, workFromOffice, computers, internetTypes, homeOfficeDesc,
  });

  return (
    <div className="onboarding-step">
      <p className="onboarding-step-desc">
        Tell us about your work environment and equipment.
      </p>

      <div className="form-group">
        <label className="form-label">Work Location Preference</label>
        <div style={{ display: "flex", gap: 24 }}>
          <label className="form-checkbox">
            <input type="checkbox" checked={workFromHome} onChange={(e) => setWorkFromHome(e.target.checked)} />
            Willing to work from home
          </label>
          <label className="form-checkbox">
            <input type="checkbox" checked={workFromOffice} onChange={(e) => setWorkFromOffice(e.target.checked)} />
            Willing to work from office
          </label>
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Computer Equipment (select all that apply)</label>
        <div className="skill-grid">
          {COMPUTER_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              className={`skill-tag ${computers.find((c) => c.type === type) ? "active" : ""}`}
              onClick={() => toggleComputerType(type)}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {computers.map((comp) => (
        <div key={comp.type} className="entry-card" style={{ marginTop: 12 }}>
          <div className="entry-card-header">
            <span className="entry-card-num">{comp.type} Details</span>
          </div>
          <div className="form-row">
            {comp.type !== "Mac" && (
              <div className="form-group form-third">
                <label className="form-label">Brand</label>
                <input className="form-input" placeholder="e.g. Dell" value={comp.brand} onChange={(e) => updateComputer(comp.type, "brand", e.target.value)} />
              </div>
            )}
            <div className="form-group form-third">
              <label className="form-label">Year</label>
              <input className="form-input" placeholder="e.g. 2024" value={comp.year} onChange={(e) => updateComputer(comp.type, "year", e.target.value)} />
            </div>
            <div className="form-group form-third">
              <label className="form-label">Model</label>
              <input className="form-input" placeholder="e.g. Inspiron 15" value={comp.model} onChange={(e) => updateComputer(comp.type, "model", e.target.value)} />
            </div>
          </div>
          {comp.type !== "Mac" && (
            <div className="form-row">
              <div className="form-group form-half">
                <label className="form-label">CPU Speed</label>
                <input className="form-input" placeholder="e.g. 2.4 GHz" value={comp.cpu} onChange={(e) => updateComputer(comp.type, "cpu", e.target.value)} />
              </div>
              <div className="form-group form-half">
                <label className="form-label">RAM</label>
                <input className="form-input" placeholder="e.g. 16 GB" value={comp.ram} onChange={(e) => updateComputer(comp.type, "ram", e.target.value)} />
              </div>
            </div>
          )}
        </div>
      ))}

      <div className="form-group" style={{ marginTop: 16 }}>
        <label className="form-label">Internet Type</label>
        <div style={{ display: "flex", gap: 16 }}>
          {["DSL", "Cable", "Fiber"].map((type) => (
            <label key={type} className="form-checkbox">
              <input type="checkbox" checked={internetTypes.includes(type)} onChange={() => toggleInternet(type)} />
              {type}
            </label>
          ))}
        </div>
      </div>

      <div className="form-group">
        <div className="form-label-with-info">
          <label className="form-label" style={{ marginBottom: 0 }}>Describe Your Home Office</label>
          <button
            type="button"
            className="info-btn"
            onClick={() => setShowInfoTip(!showInfoTip)}
            onMouseEnter={() => setShowInfoTip(true)}
            onMouseLeave={() => setShowInfoTip(false)}
          >
            i
          </button>
          {showInfoTip && (
            <div className="info-tooltip">
              Please describe your home office or work environment. Include relevant details such as whether you have a dedicated, quiet workspace, the level of background noise during working hours, and any factors that may impact your ability to work effectively (e.g., a private room, door, sound-controlled area, multiple monitors, etc.).
            </div>
          )}
        </div>
        <textarea className="form-input form-textarea" rows={3} placeholder="Describe your workspace setup..." value={homeOfficeDesc} onChange={(e) => setHomeOfficeDesc(e.target.value)} />
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
