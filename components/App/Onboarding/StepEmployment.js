"use client";

import { useState } from "react";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const YEARS = Array.from({ length: 30 }, (_, i) => String(2026 - i));
const STATES = ["AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY"];

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
    }));
    return [emptyEntry()];
  });

  const update = (i, field, value) => {
    const next = [...entries];
    next[i] = { ...next[i], [field]: value };
    setEntries(next);
  };

  const addEntry = () => setEntries([...entries, emptyEntry()]);
  const removeEntry = (i) => entries.length === 1 ? setEntries([emptyEntry()]) : setEntries(entries.filter((_, idx) => idx !== i));

  const getData = () => ({ entries: entries.filter((e) => e.company.trim()) });

  return (
    <div className="onboarding-step">
      <p className="onboarding-step-desc">Add your work history.</p>

      {entries.map((entry, i) => (
        <div key={i} className="entry-card">
          <div className="entry-card-header">
            <span className="entry-card-num">Job {i + 1}</span>
            <button type="button" className="btn-link btn-danger" onClick={() => removeEntry(i)}>Remove</button>
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
                {MONTHS.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div className="form-group form-quarter">
              <label className="form-label">To Year</label>
              <select className="form-input form-select" value={entry.throughYear} onChange={(e) => update(i, "throughYear", e.target.value)} disabled={entry.currentlyWorking}>
                <option value="">Year</option>
                {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
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
      ))}

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
