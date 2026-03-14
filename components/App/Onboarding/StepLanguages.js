"use client";

import { useState } from "react";

const LANGUAGES = ["Spanish", "French", "Chinese", "Mandarin", "Hindi", "Russian", "Arabic", "Portuguese", "German", "Japanese", "Korean", "Italian"];
const PROFICIENCIES = [
  { value: "basic", label: "Basic" },
  { value: "conversational", label: "Conversational" },
  { value: "fluent", label: "Fluent" },
];

export default function StepLanguages({ data, onNext, onBack, onSaveExit, onSkip, saving }) {
  const [languages, setLanguages] = useState(() => {
    const saved = data?.languages || [];
    return saved.length
      ? saved.map((l) => ({ language: l.language, proficiency: l.proficiency }))
      : [];
  });
  const [newLang, setNewLang] = useState("");
  const [newProf, setNewProf] = useState("basic");

  const addLanguage = () => {
    if (!newLang) return;
    if (languages.find((l) => l.language === newLang)) return;
    setLanguages([...languages, { language: newLang, proficiency: newProf }]);
    setNewLang("");
    setNewProf("basic");
  };

  const removeLanguage = (lang) => setLanguages(languages.filter((l) => l.language !== lang));

  // Auto-include whatever is in the dropdowns if user hasn't clicked Add
  const getData = () => {
    let result = [...languages];
    if (newLang && !result.find((l) => l.language === newLang)) {
      result.push({ language: newLang, proficiency: newProf });
    }
    return { languages: result };
  };

  // Languages already added (exclude from dropdown)
  const available = LANGUAGES.filter((l) => !languages.find((s) => s.language === l));

  return (
    <div className="onboarding-step">
      <p className="onboarding-step-desc">
        If you speak any additional languages, please identify them here. This is optional but can help match you with more opportunities.
      </p>

      {/* Added language cards */}
      {languages.length > 0 && (
        <div className="language-cards">
          {languages.map((l) => (
            <div key={l.language} className="language-card">
              <div className="language-card-info">
                <span className="language-card-name">{l.language}</span>
                <span className="language-card-prof">{PROFICIENCIES.find((p) => p.value === l.proficiency)?.label || l.proficiency}</span>
              </div>
              <button type="button" className="language-card-remove" onClick={() => removeLanguage(l.language)} title="Remove">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {available.length > 0 && (
        <div className="form-row" style={{ alignItems: "flex-end" }}>
          <div className="form-group form-third">
            <label className="form-label">Language</label>
            <select className="form-input form-select" value={newLang} onChange={(e) => setNewLang(e.target.value)}>
              <option value="">Select</option>
              {available.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
          <div className="form-group form-third">
            <label className="form-label">Proficiency</label>
            <select className="form-input form-select" value={newProf} onChange={(e) => setNewProf(e.target.value)}>
              {PROFICIENCIES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </div>
          <div className="form-group form-third">
            <button type="button" className="btn-secondary" onClick={addLanguage} disabled={!newLang} style={{ marginBottom: 20 }}>
              + Add Another
            </button>
          </div>
        </div>
      )}

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
