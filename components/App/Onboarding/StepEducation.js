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
        collapsed: true,
      }));
    }
    return [{ ...emptyEntry(), collapsed: false }];
  });

  const update = (i, field, value) => {
    const next = [...entries];
    next[i] = { ...next[i], [field]: value };
    if (field === "fromDate" && next[i].toDate && value > next[i].toDate) {
      next[i].toDate = "";
    }
    setEntries(next);
  };

  const addEntry = () => {
    // Collapse all existing, add new open one
    setEntries([...entries.map((e) => ({ ...e, collapsed: true })), { ...emptyEntry(), collapsed: false }]);
  };

  const removeEntry = (i) => {
    if (entries.length === 1) {
      setEntries([{ ...emptyEntry(), collapsed: false }]);
    } else {
      setEntries(entries.filter((_, idx) => idx !== i));
    }
  };

  const toggleCollapse = (i) => {
    const next = [...entries];
    next[i] = { ...next[i], collapsed: !next[i].collapsed };
    setEntries(next);
  };

  const getData = () => ({
    entries: entries.filter((e) => e.institution.trim()),
  });

  const formatYear = (dateStr) => {
    if (!dateStr) return "";
    return new Date(dateStr).getFullYear();
  };

  return (
    <div className="onboarding-step">
      <p className="onboarding-step-desc">
        Add your education history. You can add multiple entries.
      </p>

      {entries.map((entry, i) => {
        const hasData = entry.institution.trim();
        const isCollapsed = entry.collapsed && hasData;

        if (isCollapsed) {
          return (
            <div key={i} className="summary-card">
              <div className="summary-card-info" onClick={() => toggleCollapse(i)}>
                <span className="summary-card-title">{entry.institution}</span>
                <span className="summary-card-sub">
                  {entry.degree}{entry.areaOfStudy ? ` — ${entry.areaOfStudy}` : ""}
                  {entry.fromDate ? ` · ${formatYear(entry.fromDate)}` : ""}
                  {entry.toDate ? `–${formatYear(entry.toDate)}` : ""}
                </span>
              </div>
              <div className="summary-card-actions">
                <button type="button" className="summary-card-edit" onClick={() => toggleCollapse(i)} title="Edit">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </button>
                <button type="button" className="summary-card-remove" onClick={() => removeEntry(i)} title="Remove">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            </div>
          );
        }

        return (
          <div key={i} className="entry-card">
            <div className="entry-card-header">
              <span className="entry-card-num">Education {i + 1}</span>
              <div style={{ display: "flex", gap: 8 }}>
                {hasData && (
                  <button type="button" className="btn-link" onClick={() => toggleCollapse(i)}>Done</button>
                )}
                <button type="button" className="btn-link btn-danger" onClick={() => removeEntry(i)}>Remove</button>
              </div>
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
                <input
                  className="form-input"
                  type="date"
                  value={entry.toDate}
                  min={entry.fromDate || undefined}
                  onChange={(e) => update(i, "toDate", e.target.value)}
                />
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
        );
      })}

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
