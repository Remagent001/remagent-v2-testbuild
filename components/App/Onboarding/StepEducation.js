"use client";

import { useState } from "react";

const DEGREES = ["PHD", "Masters", "BA/BS", "Associates", "High School", "GED", "Other"];

const emptyEntry = () => ({
  institution: "",
  degree: "",
  areaOfStudy: "",
  fromDate: "",
  toDate: "",
  gpa: "",
  description: "",
});

export default function StepEducation({ data, onNext, onBack, onSaveExit, onSkip, saving }) {
  const [entries, setEntries] = useState(() => {
    const saved = data?.education || [];
    if (saved.length) {
      return saved.map((e) => ({
        institution: e.institution || "",
        degree: e.degree || "",
        areaOfStudy: e.areaOfStudy || "",
        fromDate: e.fromDate ? e.fromDate.slice(0, 10) : "",
        toDate: e.toDate ? e.toDate.slice(0, 10) : "",
        gpa: e.gpa || "",
        description: e.description || "",
      }));
    }
    return [emptyEntry()];
  });

  const update = (i, field, value) => {
    const next = [...entries];
    next[i] = { ...next[i], [field]: value };
    setEntries(next);
  };

  const addEntry = () => setEntries([...entries, emptyEntry()]);

  const removeEntry = (i) => {
    if (entries.length === 1) {
      setEntries([emptyEntry()]);
    } else {
      setEntries(entries.filter((_, idx) => idx !== i));
    }
  };

  const getData = () => ({
    entries: entries.filter((e) => e.institution.trim()),
  });

  return (
    <div className="onboarding-step">
      <p className="onboarding-step-desc">
        Add your education history. You can add multiple entries.
      </p>

      {entries.map((entry, i) => (
        <div key={i} className="entry-card">
          <div className="entry-card-header">
            <span className="entry-card-num">Education {i + 1}</span>
            <button type="button" className="btn-link btn-danger" onClick={() => removeEntry(i)}>Remove</button>
          </div>

          <div className="form-row">
            <div className="form-group form-half">
              <label className="form-label">Institution *</label>
              <input className="form-input" placeholder="School name" value={entry.institution} onChange={(e) => update(i, "institution", e.target.value)} />
            </div>
            <div className="form-group form-half">
              <label className="form-label">Degree *</label>
              <select className="form-input form-select" value={entry.degree} onChange={(e) => update(i, "degree", e.target.value)}>
                <option value="">Select degree</option>
                {DEGREES.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Area of Study</label>
            <input className="form-input" placeholder="e.g. Business Administration" value={entry.areaOfStudy} onChange={(e) => update(i, "areaOfStudy", e.target.value)} />
          </div>

          <div className="form-row">
            <div className="form-group form-third">
              <label className="form-label">From Date</label>
              <input className="form-input" type="date" value={entry.fromDate} onChange={(e) => update(i, "fromDate", e.target.value)} />
            </div>
            <div className="form-group form-third">
              <label className="form-label">To Date</label>
              <input className="form-input" type="date" value={entry.toDate} onChange={(e) => update(i, "toDate", e.target.value)} />
            </div>
            <div className="form-group form-third">
              <label className="form-label">GPA</label>
              <input className="form-input" placeholder="e.g. 3.5" value={entry.gpa} onChange={(e) => update(i, "gpa", e.target.value)} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-input form-textarea" rows={2} placeholder="Any additional details..." value={entry.description} onChange={(e) => update(i, "description", e.target.value)} />
          </div>
        </div>
      ))}

      <button type="button" className="btn-secondary btn-add" onClick={addEntry}>
        + Add Another Education
      </button>

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
