"use client";

import { useState, useRef } from "react";

const MAX_SUMMARY = 5000;

export default function StepGettingStarted({ data, onNext, onSaveExit, saving }) {
  const profile = data?.profile;
  const [title, setTitle] = useState(profile?.title || "");
  const [summary, setSummary] = useState(profile?.summary || "");
  const [website, setWebsite] = useState(profile?.website || "");
  const [linkedinUrl, setLinkedinUrl] = useState(profile?.linkedinUrl || "");
  const [resumeName, setResumeName] = useState(profile?.resume || null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef();

  const handleResume = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setResumeName(file.name);
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", "resume");
    try {
      await fetch("/api/onboarding/upload", { method: "POST", body: formData });
    } catch {
      // Upload API to be wired later
    }
    setUploading(false);
  };

  const handleSummaryChange = (e) => {
    const val = e.target.value;
    if (val.length <= MAX_SUMMARY) setSummary(val);
  };

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
          rows={5}
          value={summary}
          onChange={handleSummaryChange}
        />
        <div className="form-char-count">
          {summary.length}/{MAX_SUMMARY}
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Resume (optional)</label>
        <div
          className="file-upload-zone"
          onClick={() => fileRef.current?.click()}
        >
          {resumeName ? (
            <div className="file-upload-selected">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--teal)" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <path d="M14 2v6h6" />
              </svg>
              <span>{resumeName}</span>
            </div>
          ) : (
            <div className="file-upload-placeholder">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              <span>Click to upload your resume</span>
              <span className="file-upload-hint">PDF, DOC, HTML, PPT accepted</span>
            </div>
          )}
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.doc,.docx,.html,.ppt,.pptx"
            onChange={handleResume}
            style={{ display: "none" }}
          />
        </div>
        {uploading && <p className="upload-status">Uploading...</p>}
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
