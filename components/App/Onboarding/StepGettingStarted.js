"use client";

import { useState, useRef } from "react";
import dynamic from "next/dynamic";

const RichTextEditor = dynamic(() => import("@/components/App/RichTextEditor"), { ssr: false });

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

  const getData = () => ({ title, summary, website, linkedinUrl });

  const canProceed = title.trim() && summary.replace(/<[^>]*>/g, "").trim();

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
        <RichTextEditor
          content={summary}
          onChange={setSummary}
          placeholder="Write a short summary about your experience and what distinguishes you as a call center / contact center professional."
          maxLength={MAX_SUMMARY}
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

      <div className="form-group">
        <label className="form-label">Resume (optional)</label>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <input
            className="form-input"
            readOnly
            placeholder="No file selected"
            value={resumeName || ""}
            onClick={() => fileRef.current?.click()}
            style={{ cursor: "pointer" }}
          />
          <button
            type="button"
            className="btn-secondary"
            style={{ whiteSpace: "nowrap", padding: "8px 16px" }}
            onClick={() => fileRef.current?.click()}
          >
            Browse
          </button>
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
