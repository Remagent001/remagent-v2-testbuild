"use client";

import { useState, useEffect, useRef } from "react";
import AddressAutocomplete from "./AddressAutocomplete";

const TIMEZONES = [
  "US/Eastern", "US/Central", "US/Mountain", "US/Pacific", "US/Alaska", "US/Hawaii",
];

export default function CompanyProfileClient() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [industries, setIndustries] = useState([]);

  // Form fields
  const [businessName, setBusinessName] = useState("");
  const [industry, setIndustry] = useState("");
  const [website, setWebsite] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [phone, setPhone] = useState("");
  const [timezone, setTimezone] = useState("");
  const [fullAddress, setFullAddress] = useState("");
  const [country, setCountry] = useState("");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [zip, setZip] = useState("");

  // Logo
  const [logoPreview, setLogoPreview] = useState(null);
  const [logoPath, setLogoPath] = useState(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoError, setLogoError] = useState("");
  const [logoDragOver, setLogoDragOver] = useState(false);
  const logoRef = useRef();

  useEffect(() => {
    fetch("/api/business/profile")
      .then((r) => r.json())
      .then((data) => {
        const p = data.profile;
        const u = data.user;
        setIndustries(data.allIndustries || []);
        if (p) {
          setBusinessName(p.businessName || "");
          setIndustry(p.industry || "");
          setWebsite(p.website || "");
          setLinkedinUrl(p.linkedinUrl || "");
          setFullAddress(p.fullAddress || "");
          setCountry(p.country || "");
          setState(p.state || "");
          setCity(p.city || "");
          setZip(p.zip || "");
          setPhone(p.phone || "");
          if (p.logo) {
            setLogoPath(p.logo);
            setLogoPreview(`/${p.logo}`);
          }
        }
        if (u?.phone && !p?.phone) setPhone(u.phone);
        if (u?.timezone) setTimezone(u.timezone);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleLogo = async (file) => {
    if (!file) return;
    setLogoError("");
    const reader = new FileReader();
    reader.onload = (ev) => setLogoPreview(ev.target.result);
    reader.readAsDataURL(file);

    setLogoUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/business/upload", { method: "POST", body: formData });
      const result = await res.json();
      if (result.success) {
        setLogoPath(result.path);
      } else {
        setLogoError(result.error || "Upload failed");
        setLogoPreview(null);
      }
    } catch {
      setLogoError("Upload failed");
      setLogoPreview(null);
    }
    setLogoUploading(false);
  };

  const removeLogo = async () => {
    setLogoPreview(null);
    setLogoPath(null);
    try {
      await fetch("/api/business/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ remove: true }),
      });
    } catch {}
  };

  const handleAddressSelect = (place) => {
    setFullAddress(place.fullAddress || "");
    setCity(place.city || "");
    setState(place.state || "");
    setCountry(place.country || "");
    setZip(place.zip || "");
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await fetch("/api/business/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName, industry, website, linkedinUrl, phone, timezone,
          fullAddress, country, state, city, zip,
        }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {}
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="onboarding-loading">
        <div className="onboarding-spinner" />
        <p>Loading company profile...</p>
      </div>
    );
  }

  return (
    <div className="company-profile-page">
      <div className="page-header">
        <h1 className="page-title">Company Profile</h1>
        <p className="page-subtitle">Tell us about your business so professionals can find you.</p>
      </div>

      <div className="card" style={{ maxWidth: 720 }}>
        {/* Logo */}
        <div className="form-group">
          <label className="form-label">Company Logo</label>
          {logoPreview || logoPath ? (
            <div className="media-preview-card" style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
              <img
                src={logoPreview || `/${logoPath}`}
                alt="Company logo"
                style={{ width: 80, height: 80, objectFit: "contain", borderRadius: 8, border: "1px solid var(--gray-200)" }}
              />
              <div className="media-preview-actions">
                <button type="button" className="btn-secondary" style={{ padding: "6px 14px", fontSize: "0.8rem" }} onClick={() => logoRef.current?.click()}>
                  Change Logo
                </button>
                <button type="button" className="btn-danger-outline" style={{ padding: "6px 14px", fontSize: "0.8rem" }} onClick={removeLogo}>
                  Remove
                </button>
              </div>
            </div>
          ) : (
            <div
              className={`photo-upload-area ${logoDragOver ? "drag-over" : ""}`}
              style={{ maxWidth: 300, padding: "24px 16px" }}
              onClick={() => logoRef.current?.click()}
              onDrop={(e) => { e.preventDefault(); setLogoDragOver(false); handleLogo(e.dataTransfer.files?.[0]); }}
              onDragOver={(e) => { e.preventDefault(); setLogoDragOver(true); }}
              onDragLeave={() => setLogoDragOver(false)}
            >
              <div className="photo-placeholder">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <path d="m21 15-5-5L5 21" />
                </svg>
                <span>Click or drag to upload logo</span>
                <span className="file-upload-hint">JPG, PNG, GIF, WebP — max 5MB</span>
              </div>
            </div>
          )}
          <input ref={logoRef} type="file" accept="image/*" onChange={(e) => handleLogo(e.target.files?.[0])} style={{ display: "none" }} />
          {logoUploading && <p className="upload-status">Uploading...</p>}
          {logoError && <p className="upload-error">{logoError}</p>}
        </div>

        {/* Business Name */}
        <div className="form-group">
          <label className="form-label">Business Name</label>
          <input className="form-input" placeholder="Your company name" value={businessName} onChange={(e) => setBusinessName(e.target.value)} />
        </div>

        {/* Industry */}
        <div className="form-group">
          <label className="form-label">Industry</label>
          <select className="form-input form-select" value={industry} onChange={(e) => setIndustry(e.target.value)}>
            <option value="">Select your industry</option>
            {industries.map((ind) => (
              <option key={ind.id} value={ind.name}>{ind.name}</option>
            ))}
          </select>
        </div>

        {/* Website + LinkedIn */}
        <div className="form-row">
          <div className="form-group form-half">
            <label className="form-label">Website</label>
            <input className="form-input" placeholder="https://yourcompany.com" value={website} onChange={(e) => setWebsite(e.target.value)} />
          </div>
          <div className="form-group form-half">
            <label className="form-label">LinkedIn</label>
            <input className="form-input" placeholder="https://linkedin.com/company/..." value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} />
          </div>
        </div>

        {/* Location */}
        <div className="form-group">
          <label className="form-label">Business Address</label>
          <AddressAutocomplete
            value={fullAddress}
            onChange={setFullAddress}
            onSelect={handleAddressSelect}
            placeholder="Start typing your address..."
          />
        </div>

        <div className="form-row">
          <div className="form-group form-third">
            <label className="form-label">City</label>
            <input className="form-input" value={city} onChange={(e) => setCity(e.target.value)} />
          </div>
          <div className="form-group form-third">
            <label className="form-label">State</label>
            <input className="form-input" value={state} onChange={(e) => setState(e.target.value)} />
          </div>
          <div className="form-group form-third">
            <label className="form-label">Zip</label>
            <input className="form-input" value={zip} onChange={(e) => setZip(e.target.value)} />
          </div>
        </div>

        {/* Phone + Timezone */}
        <div className="form-row">
          <div className="form-group form-half">
            <label className="form-label">Phone</label>
            <input className="form-input" placeholder="(555) 123-4567" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div className="form-group form-half">
            <label className="form-label">Timezone</label>
            <select className="form-input form-select" value={timezone} onChange={(e) => setTimezone(e.target.value)}>
              <option value="">Select timezone</option>
              {TIMEZONES.map((tz) => (
                <option key={tz} value={tz}>{tz.replace("US/", "")}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Save */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 24 }}>
          <button className="btn-primary" style={{ width: "auto" }} onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Profile"}
          </button>
          {saved && <span style={{ color: "var(--teal)", fontSize: "0.85rem", fontWeight: 500 }}>Saved!</span>}
        </div>
      </div>
    </div>
  );
}
