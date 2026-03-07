"use client";

import { useState } from "react";

export default function StepGettingStarted({ data, onNext, onSaveExit, saving }) {
  const profile = data?.profile;
  const [title, setTitle] = useState(profile?.title || "");
  const [summary, setSummary] = useState(profile?.summary || "");
  const [website, setWebsite] = useState(profile?.website || "");
  const [linkedinUrl, setLinkedinUrl] = useState(profile?.linkedinUrl || "");

  const getData = () => ({ title, summary, website, linkedinUrl });

  const canProceed = title.trim() && summary.trim();

  return (
    <div className="onboarding-step">
      <p className="onboarding-step-desc">
        Tell us a bit about yourself. This information will be visible on your profile.
      </p>

      <div className="form-group">
        <label className="form-label">Professional Title *</label>
        <input
          className="form-input"
          placeholder="e.g. Customer Service Specialist"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      <div className="form-group">
        <label className="form-label">Professional Summary *</label>
        <textarea
          className="form-input form-textarea"
          placeholder="Write a short summary about your experience and what you bring to the table..."
          rows={4}
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
        />
      </div>

      <div className="form-row">
        <div className="form-group form-half">
          <label className="form-label">Website (optional)</label>
          <input
            className="form-input"
            placeholder="https://yourwebsite.com"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
          />
        </div>
        <div className="form-group form-half">
          <label className="form-label">LinkedIn (optional)</label>
          <input
            className="form-input"
            placeholder="https://linkedin.com/in/yourprofile"
            value={linkedinUrl}
            onChange={(e) => setLinkedinUrl(e.target.value)}
          />
        </div>
      </div>

      <div className="onboarding-actions">
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
          disabled={!canProceed || saving}
        >
          {saving ? "Saving..." : "Next"}
        </button>
      </div>
    </div>
  );
}
