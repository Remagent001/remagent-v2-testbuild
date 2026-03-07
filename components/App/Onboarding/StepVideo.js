"use client";

import { useState, useRef } from "react";

export default function StepVideo({ data, onNext, onBack, onSaveExit, onSkip, saving }) {
  const [fileName, setFileName] = useState(data?.user?.profileVideo || null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef();

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) {
      alert("File too large. Maximum size is 20MB.");
      return;
    }
    setFileName(file.name);
    setUploading(true);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", "video");

    try {
      await fetch("/api/onboarding/upload", { method: "POST", body: formData });
    } catch {
      // Upload API to be wired later
    }
    setUploading(false);
  };

  return (
    <div className="onboarding-step">
      <p className="onboarding-step-desc">
        Upload a short introduction video (optional). This gives businesses a better sense of who you are.
      </p>

      <div className="photo-upload-area" onClick={() => fileRef.current?.click()}>
        {fileName ? (
          <div className="photo-placeholder">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--teal)" strokeWidth="1.5">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
            <span>{typeof fileName === "string" ? fileName : "Video selected"}</span>
          </div>
        ) : (
          <div className="photo-placeholder">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
            <span>Click to upload a video</span>
          </div>
        )}
        <input ref={fileRef} type="file" accept="video/mp4" onChange={handleFile} style={{ display: "none" }} />
      </div>

      {uploading && <p className="upload-status">Uploading...</p>}

      <div className="photo-guidelines">
        <strong>Video guidelines:</strong>
        <ul>
          <li>MP4 format only</li>
          <li>Maximum 20MB file size</li>
          <li>Keep it under 2 minutes</li>
          <li>Introduce yourself and your experience</li>
        </ul>
      </div>

      <div className="onboarding-actions">
        <button className="btn-secondary" onClick={onBack} disabled={saving}>Back</button>
        <div className="onboarding-actions-right">
          <button className="btn-link" onClick={onSkip}>Skip for now</button>
          <button className="btn-secondary" onClick={() => onSaveExit({})} disabled={saving}>Save & Exit</button>
          <button className="btn-primary" style={{ width: "auto" }} onClick={() => onNext({})} disabled={saving}>{saving ? "Saving..." : "Next"}</button>
        </div>
      </div>
    </div>
  );
}
