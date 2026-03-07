"use client";

import { useState, useRef } from "react";

export default function StepPhoto({ data, onNext, onBack, onSaveExit, onSkip, saving }) {
  const [preview, setPreview] = useState(data?.user?.image || null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef();

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show local preview
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target.result);
    reader.readAsDataURL(file);

    // Upload
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", "photo");

    try {
      const res = await fetch("/api/onboarding/upload", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Upload failed");
    } catch {
      // We'll handle upload API later — for now just preview locally
    }
    setUploading(false);
  };

  return (
    <div className="onboarding-step">
      <p className="onboarding-step-desc">
        Upload a professional profile photo. This helps businesses put a face to your name.
      </p>

      <div className="photo-upload-area" onClick={() => fileRef.current?.click()}>
        {preview ? (
          <img src={preview} alt="Profile preview" className="photo-preview" />
        ) : (
          <div className="photo-placeholder">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="m21 15-5-5L5 21" />
            </svg>
            <span>Click to upload a photo</span>
          </div>
        )}
        <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={{ display: "none" }} />
      </div>

      {uploading && <p className="upload-status">Uploading...</p>}

      <div className="photo-guidelines">
        <strong>Photo guidelines:</strong>
        <ul>
          <li>Use a clear, well-lit headshot</li>
          <li>Face the camera directly</li>
          <li>Professional attire recommended</li>
          <li>JPG or PNG format</li>
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
