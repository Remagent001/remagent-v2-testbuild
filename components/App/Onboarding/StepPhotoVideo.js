"use client";

import { useState, useRef, useCallback } from "react";

export default function StepPhotoVideo({ data, onNext, onBack, onSaveExit, onSkip, saving }) {
  const profile = data?.profile;
  const savedPhoto = profile?.photoUrl ? `/${profile.photoUrl}` : data?.user?.image || null;
  const savedVideo = profile?.videoUrl ? `/${profile.videoUrl}` : null;
  const [photoPreview, setPhotoPreview] = useState(savedPhoto);
  const [photoPath, setPhotoPath] = useState(profile?.photoUrl || null);
  const [videoPreview, setVideoPreview] = useState(savedVideo);
  const [videoPath, setVideoPath] = useState(profile?.videoUrl || null);
  const [videoName, setVideoName] = useState(profile?.videoUrl ? profile.videoUrl.split("/").pop() : null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [videoUploading, setVideoUploading] = useState(false);
  const [photoDragOver, setPhotoDragOver] = useState(false);
  const [videoDragOver, setVideoDragOver] = useState(false);
  const [photoError, setPhotoError] = useState("");
  const [videoError, setVideoError] = useState("");
  const photoRef = useRef();
  const videoRef = useRef();

  const handlePhoto = async (file) => {
    if (!file) return;
    setPhotoError("");
    const reader = new FileReader();
    reader.onload = (ev) => setPhotoPreview(ev.target.result);
    reader.readAsDataURL(file);

    setPhotoUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", "photo");
    try {
      const res = await fetch("/api/onboarding/upload", { method: "POST", body: formData });
      const result = await res.json();
      if (result.success) {
        setPhotoPath(result.path);
      } else {
        setPhotoError(result.error || "Upload failed");
        setPhotoPreview(null);
      }
    } catch {
      setPhotoError("Upload failed");
      setPhotoPreview(null);
    }
    setPhotoUploading(false);
  };

  const handleVideo = async (file) => {
    if (!file) return;
    setVideoError("");
    if (file.size > 100 * 1024 * 1024) {
      setVideoError("File too large. Maximum size is 100MB.");
      return;
    }
    setVideoName(file.name);
    const url = URL.createObjectURL(file);
    setVideoPreview(url);

    setVideoUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", "video");
    try {
      const res = await fetch("/api/onboarding/upload", { method: "POST", body: formData });
      const result = await res.json();
      if (result.success) {
        setVideoPath(result.path);
      } else {
        setVideoError(result.error || "Upload failed");
        setVideoPreview(null);
        setVideoName(null);
      }
    } catch {
      setVideoError("Upload failed");
      setVideoPreview(null);
      setVideoName(null);
    }
    setVideoUploading(false);
  };

  const removePhoto = async () => {
    setPhotoPreview(null);
    setPhotoPath(null);
    try {
      await fetch("/api/onboarding/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "photo", remove: true }),
      });
    } catch {}
  };

  const removeVideo = async () => {
    setVideoPreview(null);
    setVideoPath(null);
    setVideoName(null);
    try {
      await fetch("/api/onboarding/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "video", remove: true }),
      });
    } catch {}
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
        {photoPreview || photoPath ? (
          <div className="media-preview-card">
            <img
              src={photoPreview || `/${photoPath}`}
              alt="Profile preview"
              className="photo-preview"
            />
            <div className="media-preview-actions">
              <button
                type="button"
                className="btn-secondary"
                style={{ padding: "6px 14px", fontSize: "0.8rem" }}
                onClick={() => photoRef.current?.click()}
              >
                Change Photo
              </button>
              <button
                type="button"
                className="btn-danger-outline"
                style={{ padding: "6px 14px", fontSize: "0.8rem" }}
                onClick={removePhoto}
              >
                Remove
              </button>
            </div>
          </div>
        ) : (
          <div
            className={`photo-upload-area ${photoDragOver ? "drag-over" : ""}`}
            onClick={() => photoRef.current?.click()}
            onDrop={(e) => handleDrop(e, "photo")}
            onDragOver={(e) => handleDragOver(e, "photo")}
            onDragLeave={() => handleDragLeave("photo")}
          >
            <div className="photo-placeholder">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="m21 15-5-5L5 21" />
              </svg>
              <span>Click or drag to upload a photo</span>
              <span className="file-upload-hint">JPG, PNG, GIF, WebP</span>
            </div>
          </div>
        )}
        <input ref={photoRef} type="file" accept="image/*" onChange={(e) => handlePhoto(e.target.files?.[0])} style={{ display: "none" }} />
        {photoUploading && <p className="upload-status">Uploading photo...</p>}
        {photoError && <p className="upload-error">{photoError}</p>}
      </div>

      {/* Video */}
      <div className="form-group">
        <label className="form-label">Introduction Video (optional)</label>
        {videoPreview || videoPath ? (
          <div className="media-preview-card">
            <video
              src={videoPreview || `/${videoPath}`}
              controls
              className="video-preview"
            />
            <div className="media-preview-actions">
              <span className="media-filename">{videoName}</span>
              <button
                type="button"
                className="btn-secondary"
                style={{ padding: "6px 14px", fontSize: "0.8rem" }}
                onClick={() => videoRef.current?.click()}
              >
                Change Video
              </button>
              <button
                type="button"
                className="btn-danger-outline"
                style={{ padding: "6px 14px", fontSize: "0.8rem" }}
                onClick={removeVideo}
              >
                Remove
              </button>
            </div>
          </div>
        ) : (
          <div
            className={`photo-upload-area ${videoDragOver ? "drag-over" : ""}`}
            onClick={() => videoRef.current?.click()}
            onDrop={(e) => handleDrop(e, "video")}
            onDragOver={(e) => handleDragOver(e, "video")}
            onDragLeave={() => handleDragLeave("video")}
          >
            <div className="photo-placeholder">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              <span>Click or drag to upload a video</span>
              <span className="file-upload-hint">MP4, MOV, AVI, WebM — max 100MB</span>
            </div>
          </div>
        )}
        <input ref={videoRef} type="file" accept="video/mp4,video/quicktime,video/x-msvideo,video/webm,video/*" onChange={(e) => handleVideo(e.target.files?.[0])} style={{ display: "none" }} />
        {videoUploading && <p className="upload-status">Uploading video...</p>}
        {videoError && <p className="upload-error">{videoError}</p>}
      </div>

      <div className="photo-guidelines">
        <strong>Guidelines:</strong>
        <ul>
          <li><strong>Photo:</strong> clear, well-lit headshot with professional attire</li>
          <li><strong>Video:</strong> keep it under 2 minutes — introduce yourself and your experience. Speak eloquently to show off how you might greet and speak with customers.</li>
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
