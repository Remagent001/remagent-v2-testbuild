"use client";

import { useState } from "react";

const EXP_OPTIONS = [
  "No Experience",
  "1-6 months",
  "6-12 months",
  "1-2 years",
  "2-3 years",
  "3+ years",
];

export default function StepExperience({ data, onNext, onBack, onSaveExit, onSkip, saving }) {
  const profile = data?.profile;
  const [overallExperience, setOverallExperience] = useState(profile?.overallExperience || "");
  const [selectedSkills, setSelectedSkills] = useState(new Set(data?.userSkillIds || []));
  const [customSkill, setCustomSkill] = useState("");
  const [customSkills, setCustomSkills] = useState([]);

  const allSkills = data?.allSkills || [];

  const toggleSkill = (id) => {
    const next = new Set(selectedSkills);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedSkills(next);
  };

  const addCustomSkill = () => {
    const name = customSkill.trim();
    if (name && !customSkills.includes(name)) {
      setCustomSkills([...customSkills, name]);
    }
    setCustomSkill("");
  };

  const removeCustomSkill = (name) => {
    setCustomSkills(customSkills.filter((s) => s !== name));
  };

  const getData = () => ({
    overallExperience,
    skillIds: Array.from(selectedSkills),
    customSkills,
  });

  return (
    <div className="onboarding-step">
      <p className="onboarding-step-desc">
        What is your overall experience level, and which skills do you have?
      </p>

      <div className="form-group">
        <label className="form-label">Overall Experience</label>
        <select
          className="form-input form-select"
          value={overallExperience}
          onChange={(e) => setOverallExperience(e.target.value)}
        >
          <option value="">Select your experience level</option>
          {EXP_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label className="form-label">Skills</label>
        <div className="skill-grid">
          {allSkills.map((skill) => (
            <button
              key={skill.id}
              type="button"
              className={`skill-tag ${selectedSkills.has(skill.id) ? "active" : ""}`}
              onClick={() => toggleSkill(skill.id)}
            >
              {skill.name}
            </button>
          ))}
        </div>
      </div>

      {/* Custom skills */}
      <div className="form-group">
        <label className="form-label">Add Custom Skill</label>
        <div className="custom-skill-input">
          <input
            className="form-input"
            placeholder="Type a skill name..."
            value={customSkill}
            onChange={(e) => setCustomSkill(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustomSkill())}
          />
          <button
            type="button"
            className="btn-secondary"
            onClick={addCustomSkill}
            disabled={!customSkill.trim()}
          >
            Add
          </button>
        </div>
        {customSkills.length > 0 && (
          <div className="skill-grid" style={{ marginTop: 8 }}>
            {customSkills.map((name) => (
              <button
                key={name}
                type="button"
                className="skill-tag active"
                onClick={() => removeCustomSkill(name)}
              >
                {name} &times;
              </button>
            ))}
          </div>
        )}
      </div>

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
