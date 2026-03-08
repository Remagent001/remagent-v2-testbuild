"use client";

import { useState } from "react";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const YEARS = Array.from({ length: 30 }, (_, i) => String(2026 - i));
const STATES = ["AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY"];

const monthIndex = (m) => MONTHS.indexOf(m);

const emptyEntry = () => ({
  company: "", city: "", state: "", title: "",
  fromMonth: "", fromYear: "", throughMonth: "", throughYear: "",
  currentlyWorking: false, remote: false, description: "",
});

export default function StepEmployment({ data, onNext, onBack, onSaveExit, onSkip, saving }) {
  const [entries, setEntries] = useState(() => {
    const saved = data?.employment || [];
    if (saved.length) return saved.map((e) => ({
      company: e.company || "", city: e.city || "", state: e.state || "", title: e.title || "",
      fromMonth: e.fromMonth || "", fromYear: e.fromYear || "",
      throughMonth: e.throughMonth || "", throughYear: e.throughYear || "",
      currentlyWorking: e.currentlyWorking || false, remote: e.remote || false,
      description: e.description || "",
      collapsed: true,
    }));
    return [{ ...emptyEntry(), collapsed: false }];
  });

  const update = (i, field, value) => {
    const next = [...entries];
    next[i] = { ...next[i], [field]: value };
    const e = next[i];
    if ((field === "fromMonth" || field === "fromYear") && e.throughYear) {
      if (e.fromYear && e.throughYear) {
        const fromNum = parseInt(e.fromYear) * 12 + monthIndex(e.fromMonth);
        const toNum = parseInt(e.throughYear) * 12 + monthIndex(e.throughMonth);
        if (toNum < fromNum) {
          next[i].throughMonth = "";
          next[i].throughYear = "";
        }
      }
    }
    setEntries(next);
  };

  const getToYears = (entry) => {
    if (!entry.fromYear) return YEARS;
    return YEARS.filter((y) => parseInt(y) >= parseInt(entry.fromYear));
  };

  const getToMonths = (entry) => {
    if (!entry.fromYear || !entry.throughYear || entry.fromYear !== entry.throughYear) return MONTHS;
    const fromIdx = monthIndex(entry.fromMonth);
    return MONTHS.filter((_, idx) => idx >= fromIdx);
  };

  const addEntry = () => {
    setEntries([...entries.map((e) => ({ ...e, collapsed: true })), { ...emptyEntry(), collapsed: false }]);
  };

  const removeEntry = (i) => entries.length === 1 ? setEntries([{ ...emptyEntry(), collapsed: false }]) : setEntries(entries.filter((_, idx) => idx !== i));

  const toggleCollapse = (i) => {
    const next = [...entries];
    next[i] = { ...next[i], collapsed: !next[i].collapsed };
    setEntries(next);
  };

  const getData = () => ({ entries: entries.filter((e) => e.company.trim()) });

  return (
    <div className="onboarding-step">
      <p className="onboarding-step-desc">Add your work history.</p>

      {entries.map((entry, i) => {
        const hasData = entry.company.trim();
        const isCollapsed = entry.collapsed && hasData;

        if (isCollapsed) {
          return (
            <div key={i} className="summary-card">
              <div className="summary-card-info" onClick={() => toggleCollapse(i)}>
                <span className="summary-card-title">{entry.company}</span>
                <span className="summary-card-sub">
                  {entry.title}
                  {entry.city ? ` · ${entry.city}${entry.state ? `, ${entry.state}` : ""}` : ""}
                  {entry.remote ? " · Remote" : ""}
                  {entry.fromMonth ? ` · ${entry.fromMonth} ${entry.fromYear}` : ""}
                  {entry.currentlyWorking ? " – Present" : entry.throughMonth ? ` – ${entry.throughMonth} ${entry.throughYear}` : ""}
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
              <span className="entry-card-num">Job {i + 1}</span>
              <div style={{ display: "flex", gap: 8 }}>
                {hasData && (
                  <button type="button" className="btn-link" onClick={() => toggleCollapse(i)}>Done</button>
                )}
                <button type="button" className="btn-link btn-danger" onClick={() => removeEntry(i)}>Remove</button>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group form-half">
                <label className="form-label">Company *</label>
                <input className="form-input" placeholder="Company name" value={entry.company} onChange={(e) => update(i, "company", e.target.value)} />
              </div>
              <div className="form-group form-half">
                <label className="form-label">Title</label>
                <input className="form-input" placeholder="Job title" value={entry.title} onChange={(e) => update(i, "title", e.target.value)} />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group form-half">
                <label className="form-label">City</label>
                <input className="form-input" placeholder="City" value={entry.city} onChange={(e) => update(i, "city", e.target.value)} />
              </div>
              <div className="form-group form-half">
                <label className="form-label">State</label>
                <select className="form-input form-select" value={entry.state} onChange={(e) => update(i, "state", e.target.value)}>
                  <option value="">Select</option>
                  {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group form-quarter">
                <label className="form-label">From Month</label>
                <select className="form-input form-select" value={entry.fromMonth} onChange={(e) => update(i, "fromMonth", e.target.value)}>
                  <option value="">Month</option>
                  {MONTHS.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div className="form-group form-quarter">
                <label className="form-label">From Year</label>
                <select className="form-input form-select" value={entry.fromYear} onChange={(e) => update(i, "fromYear", e.target.value)}>
                  <option value="">Year</option>
                  {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <div className="form-group form-quarter">
                <label className="form-label">To Month</label>
                <select className="form-input form-select" value={entry.throughMonth} onChange={(e) => update(i, "throughMonth", e.target.value)} disabled={entry.currentlyWorking}>
                  <option value="">Month</option>
                  {getToMonths(entry).map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div className="form-group form-quarter">
                <label className="form-label">To Year</label>
                <select className="form-input form-select" value={entry.throughYear} onChange={(e) => update(i, "throughYear", e.target.value)} disabled={entry.currentlyWorking}>
                  <option value="">Year</option>
                  {getToYears(entry).map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </div>

            <div className="form-row" style={{ gap: 24 }}>
              <label className="form-checkbox">
                <input type="checkbox" checked={entry.currentlyWorking} onChange={(e) => update(i, "currentlyWorking", e.target.checked)} />
                I currently work here
              </label>
              <label className="form-checkbox">
                <input type="checkbox" checked={entry.remote} onChange={(e) => update(i, "remote", e.target.checked)} />
                Remote position
              </label>
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="form-input form-textarea" rows={2} placeholder="Describe your role..." value={entry.description} onChange={(e) => update(i, "description", e.target.value)} />
            </div>
          </div>
        );
      })}

      <button type="button" className="btn-secondary btn-add" onClick={addEntry}>+ Add Another Job</button>

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
