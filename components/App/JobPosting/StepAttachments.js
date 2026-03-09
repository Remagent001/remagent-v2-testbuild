"use client";

import { useState, useRef } from "react";

const FILE_ICONS = {
  pdf: "📄",
  doc: "📝",
  docx: "📝",
  xls: "📊",
  xlsx: "📊",
  ppt: "📑",
  pptx: "📑",
  jpg: "🖼️",
  png: "🖼️",
  gif: "🖼️",
  txt: "📃",
};

function getFileExt(name) {
  return (name || "").split(".").pop().toLowerCase();
}

function getFileIcon(name) {
  return FILE_ICONS[getFileExt(name)] || "📎";
}

export default function StepAttachments({ data, positionId, onNext, onBack, onSaveExit, onSkip, saving }) {
  const [documents, setDocuments] = useState(data?.position?.documents || []);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileRef = useRef();

  // New doc fields
  const [newTitle, setNewTitle] = useState("");

  const handleUpload = async (file) => {
    if (!file || !positionId) return;
    setUploadError("");
    setUploading(true);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", newTitle || file.name);
    formData.append("positionId", positionId);

    try {
      const res = await fetch("/api/positions/upload", { method: "POST", body: formData });
      const result = await res.json();
      if (result.success) {
        setDocuments([...documents, result.document]);
        setNewTitle("");
      } else {
        setUploadError(result.error || "Upload failed");
      }
    } catch {
      setUploadError("Upload failed");
    }
    setUploading(false);
  };

  const removeDoc = async (docId) => {
    try {
      await fetch(`/api/positions/upload?docId=${docId}`, { method: "DELETE" });
      setDocuments(documents.filter((d) => d.id !== docId));
    } catch {}
  };

  const toggleDefault = async (docId) => {
    const doc = documents.find((d) => d.id === docId);
    if (!doc) return;
    const updated = { ...doc, isDefault: !doc.isDefault };
    setDocuments(documents.map((d) => d.id === docId ? updated : d));
    // Save to server
    try {
      await fetch("/api/positions/upload", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ docId, isDefault: updated.isDefault }),
      });
    } catch {}
  };

  const getData = () => ({ documents: documents.map((d) => d.id) });

  return (
    <div className="onboarding-step">
      <p className="onboarding-step-desc">
        Upload any attachments that may provide more details about the role or your company. These could be training materials, benefits packages, or other relevant documents.
      </p>

      {/* Upload area */}
      <div className="form-group">
        <label className="form-label">Document Title</label>
        <input
          className="form-input"
          placeholder="e.g. Training Materials, Benefits Package..."
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          style={{ maxWidth: 400 }}
        />
      </div>

      <div className="form-group">
        <button
          type="button"
          className="btn-secondary"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          style={{ width: "auto" }}
        >
          {uploading ? "Uploading..." : "Choose File & Upload"}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.jpg,.png,.gif"
          onChange={(e) => handleUpload(e.target.files?.[0])}
          style={{ display: "none" }}
        />
        {uploadError && <p className="upload-error">{uploadError}</p>}
      </div>

      {/* Document cards */}
      {documents.length > 0 && (
        <div className="form-group">
          <label className="form-label">Uploaded Documents</label>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {documents.map((doc) => (
              <div key={doc.id} className="card" style={{ padding: "14px 18px", display: "flex", alignItems: "center", gap: 14 }}>
                <span style={{ fontSize: "1.5rem" }}>{getFileIcon(doc.name)}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: "0.9rem", color: "var(--gray-800)" }}>
                    {doc.title || doc.name}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--gray-400)", marginTop: 2 }}>
                    {doc.name} · {getFileExt(doc.name).toUpperCase()}
                  </div>
                </div>
                <label className="form-checkbox" style={{ fontSize: "0.8rem", whiteSpace: "nowrap" }}>
                  <input type="checkbox" checked={doc.isDefault || false} onChange={() => toggleDefault(doc.id)} />
                  Default for all postings
                </label>
                <button
                  type="button"
                  className="btn-danger-outline"
                  style={{ padding: "4px 10px", fontSize: "0.75rem" }}
                  onClick={() => removeDoc(doc.id)}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

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
