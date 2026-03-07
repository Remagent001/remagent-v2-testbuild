"use client";

import { useState, useRef, useCallback } from "react";

export default function StepPhotoVideo({ data, onNext, onBack, onSaveExit, onSkip, saving }) {
  const [photoPreview, setPhotoPreview] = useState(data?.user?.image || null);
  const [videoName, setVideoName] = useState(data?.user?.profileVideo || null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [videoUploading, setVideoUploading] = useState(false);
  const [photoDragOver, setPhotoDragOver] = useState(false);
  const [videoDragOver, setVideoDragOver] = useState(false);
  const photoRef = useRef();
  const videoRef = useRef();

  const handlePhoto = async (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setPhotoPreview(ev.target.result);
    reader.readAsDataURL(file);

    setPhotoUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", "photo");
    try {
      await fetch("/api/onboarding/upload", { method: "POST", body: formData });
    } catch { /* upload API wired later */ }
    setPhotoUploading(false);
  };

  const handleVideo = async (file) => {
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) {
      alert("File too large. Maximum size is 20MB.");
      return;
    }
    setVideoName(file.name);
    setVideoUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", "video");
    try {
      await fetch("/api/onboarding/upload", { method: "POST", body: formData });
    } catch { /* upload API wired later */ }
    setVideoUploading(false);
  };

  const handleDrop = useCallback((e, type) => {
    e.preventDefault();
    if (type === "photo") setPhotoDragOver(false);
    else setVideoDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (type === "photo") handlePhoto(file);
      else handleVideo(file);
    }
  }, []);

  const handleDragOver = (e, type) => {
    e.preventDefault();
    if (type === "photo") setPhotoDragOver(true);
    else setVideoDragOver(true);
  };

  const handleDragLeave = (type) => {
    if (type === "photo") setPhotoDragOver(false);
    else setVideoDragOver(false);
  };

  return (
    <div className="onboarding-step">
      <p className="onboarding-step-desc">
        Upload a professional profile photo and an optional introduction video. This helps businesses put a face to your profile.
      </p>

      {/* Photo */}
      <div className="form-group">
        <label className="form-label">Profile Photo</label>
        <div
          className={`photo-upload-area ${photoDragOver ? "drag-over" : ""}`}
          onClick={() => photoRef.current?.click()}
          onDrop={(e) => handleDrop(e, "photo")}
          onDragOver={(e) => handleDragOver(e, "photo")}
          onDragLeave={() => handleDragLeave("photo")}
        >
          {photoPreview ? (
            <img src={photoPreview} alt="Profile preview" className="photo-preview" />
          ) : (
            <div className="photo-placeholder">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="m21 15-5-5L5 21" />
              </svg>
              <span>Click or drag to upload a photo</span>
              <span className="file-upload-hint">JPG, PNG, GIF, WebP</span>
            </div>
          )}
          <input ref={photoRef} type="file" accept="image/*" onChange={(e) => handlePhoto(e.target.files?.[0])} style={{ display: "none" }} />
        </div>
        {photoUploading && <p className="upload-status">Uploading photo...</p>}
      </div>

      {/* Video */}
      <div className="form-group">
        <label className="form-label">Introduction Video (optional)</label>
        <div
          className={`photo-upload-area ${videoDragOver ? "drag-over" : ""}`}
          onClick={() => videoRef.current?.click()}
          onDrop={(e) => handleDrop(e, "video")}
          onDragOver={(e) => handleDragOver(e, "video")}
          onDragLeave={() => handleDragLeave("video")}
        >
          {videoName ? (
            <div className="photo-placeholder">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--teal)" strokeWidth="1.5">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              <span>{typeof videoName === "string" ? videoName : "Video selected"}</span>
            </div>
          ) : (
            <div className="photo-placeholder">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              <span>Click or drag to upload a video</span>
              <span className="file-upload-hint">MP4, MOV, AVI, WebM — max 20MB</span>
            </div>
          )}
          <input ref={videoRef} type="file" accept="video/mp4,video/quicktime,video/x-msvideo,video/webm,video/*" onChange={(e) => handleVideo(e.target.files?.[0])} style={{ display: "none" }} />
        </div>
        {videoUploading && <p className="upload-status">Uploading video...</p>}
      </div>

      <div className="photo-guidelines">
        <strong>Guidelines:</strong>
        <ul>
          <li>Photo: clear, well-lit headshot with professional attire</li>
          <li>Video: keep it under 2 minutes — introduce yourself and your experience</li>
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
