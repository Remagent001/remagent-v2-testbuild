"use client";

import { useState } from "react";
import dynamic from "next/dynamic";

const RichTextEditor = dynamic(() => import("@/components/App/RichTextEditor"), { ssr: false });

export default function StepPositionDetail({ data, onNext, onBack, onSaveExit, onSkip, saving, isFirst }) {
  const pos = data?.position;
  const [title, setTitle] = useState(pos?.title || "");
  const [description, setDescription] = useState(pos?.description || "");
  const [numberOfHires, setNumberOfHires] = useState(pos?.numberOfHires || 1);

  const [isDefault, setIsDefault] = useState(false);

  const getData = () => ({ title: title.trim(), description: description.trim(), numberOfHires: parseInt(numberOfHires) || 1, isDefault });

  return (
    <div className="onboarding-step">
      <p className="onboarding-step-desc">
        Start by giving your job posting a title and description. This is what professionals will see first.
      </p>

      <div className="form-group">
        <label className="form-label">Job Title *</label>
        <input
          className="form-input"
          placeholder="e.g. Customer Service Representative"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      <div className="form-group">
        <label className="form-label">Description *</label>
        <p className="form-hint">Please provide a description of the role including: what the employee will do day-to-day, what success in the role looks like, and why this is a good opportunity for candidates.</p>
        <p className="form-hint" style={{ marginTop: 8, fontStyle: "italic" }}>Getting the right candidate is key. Setting clear expectations helps attract the right people and leads to longer tenure and better outcomes for both the employee and the company.</p>
        <RichTextEditor
          content={description}
          onChange={setDescription}
          placeholder="Tell professionals about this position..."
          maxLength={5000}
        />
      </div>

      <div className="form-group" style={{ maxWidth: 200 }}>
        <label className="form-label">Number of Hires</label>
        <input
          className="form-input"
          type="number"
          min="1"
          value={numberOfHires}
          onChange={(e) => setNumberOfHires(e.target.value)}
        />
      </div>

      <div className="form-group" style={{ marginTop: 20 }}>
        <label className="form-checkbox">
          <input type="checkbox" checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)} />
          Save these settings as default for future job postings
        </label>
        <p className="form-hint" style={{ marginLeft: 24 }}>When checked, your next new job posting will pre-fill with the details from this section.</p>
      </div>

      <div className="onboarding-actions">
        {!isFirst && <button className="btn-secondary" onClick={onBack} disabled={saving}>Back</button>}
        <div className="onboarding-actions-right">
          <button className="btn-secondary" onClick={() => onSaveExit(getData())} disabled={saving}>Save & Exit</button>
          <button className="btn-primary" style={{ width: "auto" }} onClick={() => onNext(getData())} disabled={saving}>
            {saving ? "Saving..." : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}
