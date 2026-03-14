"use client";

import { useState } from "react";

const EXP_OPTIONS = [
  "No Experience",
  "1-6 months",
  "6-12 months",
  "1-2 years",
  "2-3 years",
  "3-5 years",
  "5-10 years",
  "10+ years",
];

const ITEM_EXP = ["<1 year", "1-3 years", "3-5 years", "5-10 years", "10+ years"];

function SelectableGrid({ items, selected, onToggle, onExpChange, label, hint }) {
  return (
    <div className="form-group">
      <label className="form-label">{label}</label>
      {hint && <p className="form-hint">{hint}</p>}
      <div className="industry-grid">
        {items.map((item) => {
          const isSelected = !!selected[item.id];
          return (
            <div key={item.id} className={`industry-card ${isSelected ? "active" : ""}`} onClick={() => onToggle(item.id)}>
              <div className="industry-card-toggle">
                {isSelected && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
                {item.name}
              </div>
              {isSelected && (
                <select
                  className="industry-card-exp"
                  value={selected[item.id]}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => onExpChange(item.id, e.target.value)}
                >
                  {ITEM_EXP.map((exp) => (
                    <option key={exp} value={exp}>{exp}</option>
                  ))}
                </select>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function StepExperience({ data, onNext, onBack, onSaveExit, onSkip, saving }) {
  const profile = data?.profile;
  const [overallExperience, setOverallExperience] = useState(profile?.overallExperience || "");

  const allSkills = data?.allSkills || [];
  const allIndustries = data?.allIndustries || [];
  const allApplications = data?.allApplications || [];

  // Initialize skills from saved data (now with experience)
  const [selectedSkills, setSelectedSkills] = useState(() => {
    const saved = data?.userSkills || [];
    const map = {};
    saved.forEach((us) => { map[us.skillId] = us.experience || "1-3 years"; });
    return map;
  });

  // Initialize industries from saved data
  const [selectedIndustries, setSelectedIndustries] = useState(() => {
    const saved = data?.userIndustries || [];
    const map = {};
    saved.forEach((ui) => { map[ui.industryId] = ui.experience; });
    return map;
  });

  // Initialize applications from saved data
  const [selectedApps, setSelectedApps] = useState(() => {
    const saved = data?.userApplications || [];
    const map = {};
    saved.forEach((ua) => { map[ua.applicationId] = ua.experience; });
    return map;
  });

  const toggleItem = (setter) => (id) => {
    setter((prev) => {
      const next = { ...prev };
      if (next[id]) {
        delete next[id];
      } else {
        next[id] = "1-3 years";
      }
      return next;
    });
  };

  const setItemExp = (setter) => (id, exp) => {
    setter((prev) => ({ ...prev, [id]: exp }));
  };

  const getData = () => ({
    overallExperience,
    skills: Object.entries(selectedSkills).map(([skillId, experience]) => ({
      skillId,
      experience,
    })),
    industries: Object.entries(selectedIndustries).map(([industryId, experience]) => ({
      industryId,
      experience,
    })),
    applications: Object.entries(selectedApps).map(([applicationId, experience]) => ({
      applicationId,
      experience,
    })),
  });

  return (
    <div className="onboarding-step">
      <p className="onboarding-step-desc">
        Tell us about your experience, skills, and the tools you work with.
      </p>

      <div className="form-group">
        <label className="form-label">Overall Relevant Experience</label>
        <select
          className="form-input form-select"
          value={overallExperience}
          onChange={(e) => setOverallExperience(e.target.value)}
        >
          {EXP_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>

      <SelectableGrid
        items={allIndustries}
        selected={selectedIndustries}
        onToggle={toggleItem(setSelectedIndustries)}
        onExpChange={setItemExp(setSelectedIndustries)}
        label="Industry Experience"
        hint="Select the industries you have experience in."
      />

      <SelectableGrid
        items={allSkills}
        selected={selectedSkills}
        onToggle={toggleItem(setSelectedSkills)}
        onExpChange={setItemExp(setSelectedSkills)}
        label="Skills"
        hint="Select your skills and years of experience with each."
      />

      <SelectableGrid
        items={allApplications}
        selected={selectedApps}
        onToggle={toggleItem(setSelectedApps)}
        onExpChange={setItemExp(setSelectedApps)}
        label="Applications"
        hint="Select the software/platforms you've worked with."
      />

      <div className="onboarding-actions">
        <button className="btn-secondary" onClick={onBack} disabled={saving}>
          Back
        </button>
        <div className="onboarding-actions-right">
          <button className="btn-link" onClick={onSkip}>Skip</button>
          <button
            className="btn-secondary"
            onClick={() => onSaveExit(getData())}
            disabled={saving}
          >
            Save & Exit
          </button>
          <button
            className="btn-primary"
            style={{ width: "auto" }}
            onClick={() => onNext(getData())}
            disabled={saving}
          >
            {saving ? "Saving..." : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}
