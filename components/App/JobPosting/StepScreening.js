"use client";

import { useState } from "react";

const PRESET_QUESTIONS = [
  "Are you available to start within two weeks?",
  "Do you have a quiet, dedicated workspace for remote work?",
  "Are you comfortable working with multiple software applications simultaneously?",
  "Do you have previous experience in a customer-facing role?",
  "Are you available to work weekends or holidays if needed?",
];

export default function StepScreening({ data, onNext, onBack, onSaveExit, onSkip, saving }) {
  const pos = data?.position;

  const [questions, setQuestions] = useState(() => {
    const saved = pos?.screeningQuestions;
    if (saved && Array.isArray(saved)) return saved;
    // Default: all presets enabled
    return PRESET_QUESTIONS.map((text) => ({ text, isPreset: true, enabled: true }));
  });

  const [customQuestion, setCustomQuestion] = useState("");

  const togglePreset = (index) => {
    const next = [...questions];
    next[index] = { ...next[index], enabled: !next[index].enabled };
    setQuestions(next);
  };

  const addCustom = () => {
    if (!customQuestion.trim()) return;
    setQuestions([...questions, { text: customQuestion.trim(), isPreset: false, enabled: true }]);
    setCustomQuestion("");
  };

  const removeCustom = (index) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const [isDefault, setIsDefault] = useState(false);

  const getData = () => ({
    screeningQuestions: questions,
    isDefault,
  });

  return (
    <div className="onboarding-step">
      <p className="onboarding-step-desc">
        Choose screening questions you'd like candidates to answer when they view and respond to your job posting. This can help you quickly qualify candidates before scheduling an interview.
      </p>

      {/* Preset questions */}
      <div className="form-group">
        <label className="form-label">Suggested Questions</label>
        <p className="form-hint">Toggle the questions you'd like to include.</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {questions.filter((q) => q.isPreset).map((q, i) => {
            const realIndex = questions.indexOf(q);
            return (
              <label key={i} className="form-checkbox" style={{ fontSize: "0.9rem" }}>
                <input type="checkbox" checked={q.enabled} onChange={() => togglePreset(realIndex)} />
                {q.text}
              </label>
            );
          })}
        </div>
      </div>

      {/* Custom questions */}
      <div className="form-group" style={{ marginTop: 24 }}>
        <label className="form-label">Custom Questions</label>
        <p className="form-hint">Add your own screening questions.</p>
        {questions.filter((q) => !q.isPreset).map((q, i) => {
          const realIndex = questions.indexOf(q);
          return (
            <div key={realIndex} className="card" style={{ padding: "10px 14px", marginBottom: 8, display: "flex", alignItems: "center", gap: 10 }}>
              <label className="form-checkbox" style={{ flex: 1, fontSize: "0.9rem" }}>
                <input type="checkbox" checked={q.enabled} onChange={() => togglePreset(realIndex)} />
                {q.text}
              </label>
              <button
                type="button"
                className="btn-danger-outline"
                style={{ padding: "3px 8px", fontSize: "0.7rem" }}
                onClick={() => removeCustom(realIndex)}
              >
                Remove
              </button>
            </div>
          );
        })}

        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <input
            className="form-input"
            placeholder="Type a custom question..."
            value={customQuestion}
            onChange={(e) => setCustomQuestion(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustom())}
          />
          <button
            type="button"
            className="btn-secondary"
            style={{ width: "auto", whiteSpace: "nowrap" }}
            onClick={addCustom}
          >
            Add
          </button>
        </div>
      </div>

      <div className="form-group" style={{ marginTop: 20 }}>
        <label className="form-checkbox">
          <input type="checkbox" checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)} />
          Save these settings as default for future job postings
        </label>
        <p className="form-hint" style={{ marginLeft: 24 }}>When checked, your next new job posting will pre-fill with the details from this section.</p>
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
