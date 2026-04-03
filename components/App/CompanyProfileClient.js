"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";

const AddressAutocomplete = dynamic(() => import("@/components/App/AddressAutocomplete"), { ssr: false });

const TIMEZONES = [
  "Americas/Eastern", "Americas/Central", "Americas/Mountain", "Americas/Pacific", "Americas/Alaska", "Americas/Hawaii",
];

const STATES = ["AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY"];

function formatPhone(value) {
  const digits = value.replace(/\D/g, "").slice(0, 10);
  if (digits.length === 0) return "";
  if (digits.length <= 3) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

export default function CompanyProfileClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const justSigned = searchParams.get("signed") === "true";
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [industries, setIndustries] = useState([]);

  // Form fields
  const [businessName, setBusinessName] = useState("");
  const [industry, setIndustry] = useState("");
  const [otherIndustry, setOtherIndustry] = useState("");
  const [website, setWebsite] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [phone, setPhone] = useState("");
  const [timezone, setTimezone] = useState("");
  const [fullAddress, setFullAddress] = useState("");
  const [country, setCountry] = useState("");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [zip, setZip] = useState("");

  // Timecard approvers
  const [approvers, setApprovers] = useState([]);
  const [newApprover, setNewApprover] = useState({ name: "", email: "", phone: "" });
  const [addingApprover, setAddingApprover] = useState(false);

  // MSA
  const [msaSigned, setMsaSigned] = useState(false);
  const [msaSignedAt, setMsaSignedAt] = useState(null);
  const [msaSigning, setMsaSigning] = useState(false);

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
          setOtherIndustry(p.otherIndustry || "");
          setWebsite(p.website || "");
          setLinkedinUrl(p.linkedinUrl || "");
          setFullAddress(p.fullAddress || "");
          setCountry(p.country || "");
          setState(p.state || "");
          setCity(p.city || "");
          setZip(p.zip || "");
          setPhone(p.phone ? formatPhone(p.phone) : "");
          setMsaSigned(!!p.agreementSigned);
          if (p.agreementSignedAt) setMsaSignedAt(p.agreementSignedAt);
          if (p.logo) {
            setLogoPath(p.logo);
            setLogoPreview(`/${p.logo}`);
          }
        }
        if (u?.phone && !p?.phone) setPhone(formatPhone(u.phone));
        if (u?.timezone) {
          setTimezone(u.timezone);
        } else {
          // Auto-detect from browser
          try {
            const iana = Intl.DateTimeFormat().resolvedOptions().timeZone;
            const map = {
              "America/New_York": "Americas/Eastern", "America/Detroit": "Americas/Eastern",
              "America/Chicago": "Americas/Central", "America/Menominee": "Americas/Central",
              "America/Denver": "Americas/Mountain", "America/Boise": "Americas/Mountain", "America/Phoenix": "Americas/Mountain",
              "America/Los_Angeles": "Americas/Pacific", "America/Anchorage": "Americas/Alaska",
              "Pacific/Honolulu": "Americas/Hawaii", "US/Alaska": "Americas/Alaska", "US/Hawaii": "Americas/Hawaii",
            };
            setTimezone(map[iana] || "Americas/Eastern");
          } catch { setTimezone("Americas/Eastern"); }
        }
      })
      .finally(() => setLoading(false));
    // Fetch approvers
    fetch("/api/timecard-approvers")
      .then((r) => r.json())
      .then((data) => setApprovers(data.approvers || []))
      .catch(() => {});
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

  const handleAddressSelect = useCallback((place) => {
    setFullAddress(place.fullAddress || "");
    setCity(place.city || "");
    setState(place.state || "");
    setCountry(place.country || "");
    setZip(place.zip || "");
  }, []);

  const handlePhoneChange = (e) => {
    setPhone(formatPhone(e.target.value));
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await fetch("/api/business/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName, industry, otherIndustry, website, linkedinUrl,
          phone: phone.replace(/\D/g, ""), timezone,
          fullAddress, country, state, city, zip,
        }),
      });
      setSaved(true);
      setTimeout(() => {
        router.push("/dashboard");
      }, 800);
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
            <option value="Other">Other</option>
          </select>
        </div>
        {industry === "Other" && (
          <div className="form-group">
            <label className="form-label">Please specify your industry</label>
            <input className="form-input" placeholder="e.g. Renewable Energy, Logistics..." value={otherIndustry} onChange={(e) => setOtherIndustry(e.target.value)} />
          </div>
        )}

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
            onPlaceSelect={handleAddressSelect}
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
            <select className="form-input form-select" value={state} onChange={(e) => setState(e.target.value)}>
              <option value="">Select</option>
              {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
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
            <input className="form-input" type="tel" placeholder="(555) 123-4567" value={phone} onChange={handlePhoneChange} />
            <p style={{ fontSize: "0.75rem", color: "var(--gray-400)", marginTop: 4, lineHeight: 1.4 }}>
              Please enter your phone number so that Remagent can reach you if there are any questions. We will never give out your phone number to anyone and will never spam you.
            </p>
          </div>
          <div className="form-group form-half">
            <label className="form-label">Timezone</label>
            <select className="form-input form-select" value={timezone} onChange={(e) => setTimezone(e.target.value)}>
              <option value="">Select timezone</option>
              {TIMEZONES.map((tz) => (
                <option key={tz} value={tz}>{tz.replace("US/", "")}</option>
              ))}
            </select>
            <p className="form-hint" style={{ marginTop: 4 }}>All candidate availability times will be shown in this timezone, regardless of their location.</p>
          </div>
        </div>

        {/* Master Services Agreement — above Save */}
        <div style={{
          display: "flex", alignItems: "flex-start", gap: 16, marginTop: 24,
          padding: 20, borderRadius: 10,
          background: msaSigned ? "var(--teal-dim)" : "#fef3c7",
          border: msaSigned ? "1px solid var(--teal-border)" : "2px solid #f59e0b",
        }}>
          <div style={{
            width: 48, height: 48, minWidth: 48, borderRadius: 10,
            background: msaSigned ? "var(--teal-dim)" : "var(--gray-100)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={msaSigned ? "var(--teal)" : "var(--gray-400)"} strokeWidth="1.5">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              {msaSigned && <path d="M9 15l2 2 4-4" />}
            </svg>
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: "1rem", fontWeight: 600, color: "var(--gray-800)", marginBottom: 4 }}>
              Master Services Agreement
            </h3>
            {msaSigned ? (
              <>
                <p style={{ fontSize: "0.85rem", color: "var(--teal)", fontWeight: 500, marginBottom: 4 }}>
                  Signed {msaSignedAt ? new Date(msaSignedAt).toLocaleDateString() : ""}
                </p>
                <p style={{ fontSize: "0.82rem", color: "var(--gray-400)", marginBottom: 12 }}>
                  Your agreement is on file. You have full access to all platform features.
                </p>
                <button
                  className="btn-secondary"
                  style={{ width: "auto", padding: "6px 16px", fontSize: "0.82rem" }}
                  onClick={() => window.open("/api/docusign/document", "_blank")}
                >
                  View Signed Agreement
                </button>
              </>
            ) : (
              <>
                {justSigned ? (
                  <p style={{ fontSize: "0.85rem", color: "var(--teal)", fontWeight: 500, marginBottom: 4 }}>
                    Agreement signed successfully! Refreshing...
                  </p>
                ) : (
                  <>
                    <p style={{ fontSize: "0.85rem", color: "var(--gray-500)", marginBottom: 12, lineHeight: 1.5 }}>
                      Sign your Master Services Agreement to unlock full access to professional profiles, invitations, and hiring features.
                    </p>
                    <button
                      className="btn-primary"
                      style={{ width: "auto", padding: "8px 20px" }}
                      onClick={async () => {
                        setMsaSigning(true);
                        try {
                          const res = await fetch("/api/docusign", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ type: "msa" }),
                          });
                          const data = await res.json();
                          if (data.signingUrl) {
                            window.location.href = data.signingUrl;
                          } else if (data.alreadySigned) {
                            setMsaSigned(true);
                          } else {
                            alert("Could not start signing. Please contact support@remagent.com");
                          }
                        } catch {
                          alert("Could not start signing. Please contact support@remagent.com");
                        }
                        setMsaSigning(false);
                      }}
                      disabled={msaSigning}
                    >
                      {msaSigning ? "Starting..." : "Sign Agreement"}
                    </button>
                    <p style={{ fontSize: "0.75rem", color: "var(--gray-400)", marginTop: 8, lineHeight: 1.4 }}>
                      Need help? Contact{" "}
                      <a href="mailto:support@remagent.com" style={{ color: "var(--teal)" }}>support@remagent.com</a> or call{" "}
                      <a href="tel:2146325485" style={{ color: "var(--teal)" }}>214-632-5485</a>
                    </p>
                  </>
                )}
              </>
            )}
          </div>
        </div>

        {/* Timecard Approvers */}
        <div style={{ marginTop: 24 }}>
          <label style={{ fontSize: "0.92rem", fontWeight: 700, color: "var(--gray-700)", marginBottom: 12, display: "block" }}>
            Timecard Approvers
          </label>
          <p style={{ fontSize: "0.82rem", color: "var(--gray-400)", marginBottom: 12 }}>
            Add contacts who are authorized to approve timesheets for your company.
          </p>

          {approvers.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
              {approvers.map((a) => (
                <div key={a.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", background: "var(--gray-50)", borderRadius: 8, fontSize: "0.85rem" }}>
                  <div>
                    <span style={{ fontWeight: 600, color: "var(--gray-700)" }}>{a.name}</span>
                    <span style={{ color: "var(--gray-400)", marginLeft: 8 }}>{a.email}</span>
                    {a.phone && <span style={{ color: "var(--gray-400)", marginLeft: 8 }}>{a.phone}</span>}
                  </div>
                  <button
                    onClick={async () => {
                      if (!confirm(`Remove ${a.name} as an approver?`)) return;
                      await fetch(`/api/timecard-approvers?id=${a.id}`, { method: "DELETE" });
                      setApprovers((prev) => prev.filter((x) => x.id !== a.id));
                    }}
                    style={{ background: "none", border: "none", color: "var(--gray-400)", cursor: "pointer", fontSize: "0.78rem" }}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: "flex", gap: 8, alignItems: "flex-end", flexWrap: "wrap" }}>
            <div>
              <label style={{ fontSize: "0.75rem", color: "var(--gray-500)", display: "block", marginBottom: 2 }}>Name</label>
              <input className="form-input" style={{ width: 160, margin: 0, fontSize: "0.85rem", padding: "6px 10px" }} placeholder="Full name" value={newApprover.name} onChange={(e) => setNewApprover({ ...newApprover, name: e.target.value })} />
            </div>
            <div>
              <label style={{ fontSize: "0.75rem", color: "var(--gray-500)", display: "block", marginBottom: 2 }}>Email</label>
              <input className="form-input" type="email" style={{ width: 200, margin: 0, fontSize: "0.85rem", padding: "6px 10px" }} placeholder="email@company.com" value={newApprover.email} onChange={(e) => setNewApprover({ ...newApprover, email: e.target.value })} />
            </div>
            <div>
              <label style={{ fontSize: "0.75rem", color: "var(--gray-500)", display: "block", marginBottom: 2 }}>Phone</label>
              <input className="form-input" style={{ width: 140, margin: 0, fontSize: "0.85rem", padding: "6px 10px" }} placeholder="Optional" value={newApprover.phone} onChange={(e) => setNewApprover({ ...newApprover, phone: e.target.value })} />
            </div>
            <button
              className="btn-primary"
              style={{ width: "auto", padding: "6px 16px", fontSize: "0.82rem" }}
              disabled={addingApprover || !newApprover.name.trim() || !newApprover.email.trim()}
              onClick={async () => {
                setAddingApprover(true);
                try {
                  const res = await fetch("/api/timecard-approvers", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(newApprover),
                  });
                  const data = await res.json();
                  if (data.approver) {
                    setApprovers((prev) => [...prev, data.approver]);
                    setNewApprover({ name: "", email: "", phone: "" });
                  }
                } catch {}
                setAddingApprover(false);
              }}
            >
              {addingApprover ? "Adding..." : "Add"}
            </button>
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
