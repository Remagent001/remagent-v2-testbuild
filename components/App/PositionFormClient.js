"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const CONTRACT_TYPES = [
  { value: "open_ended", label: "Open-ended (no set end date)" },
  { value: "fixed", label: "Fixed term (has an end date)" },
];

const START_OPTIONS = [
  { value: "immediately", label: "Immediately" },
  { value: "flexible", label: "Flexible" },
  { value: "date", label: "Specific date" },
];

const CHANNEL_EXP = ["<1 year", "1-3 years", "3-5 years", "5-10 years", "10+ years"];

export default function PositionFormClient({ positionId }) {
  const router = useRouter();
  const isNew = !positionId || positionId === "new";
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Lookup data
  const [allSkills, setAllSkills] = useState([]);
  const [allChannels, setAllChannels] = useState([]);

  // Form fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [numberOfHires, setNumberOfHires] = useState(1);
  const [regularRate, setRegularRate] = useState("");
  const [afterHoursRate, setAfterHoursRate] = useState("");
  const [holidayRate, setHolidayRate] = useState("");
  const [contractType, setContractType] = useState("");
  const [startOption, setStartOption] = useState("");
  const [expectedStartDate, setExpectedStartDate] = useState("");
  const [expectedEndDate, setExpectedEndDate] = useState("");
  const [visibility, setVisibility] = useState("public");
  const [selectedSkills, setSelectedSkills] = useState({});
  const [selectedChannels, setSelectedChannels] = useState({});

  useEffect(() => {
    if (isNew) {
      fetch("/api/positions/lookup")
        .then((r) => r.json())
        .then((data) => {
          setAllSkills(data.allSkills || []);
          setAllChannels(data.allChannels || []);
        })
        .finally(() => setLoading(false));
    } else {
      fetch(`/api/positions/${positionId}`)
        .then((r) => r.json())
        .then((data) => {
          const p = data.position;
          setAllSkills(data.allSkills || []);
          setAllChannels(data.allChannels || []);
          if (p) {
            setTitle(p.title || "");
            setDescription(p.description || "");
            setNumberOfHires(p.numberOfHires || 1);
            setRegularRate(p.regularRate || "");
            setAfterHoursRate(p.afterHoursRate || "");
            setHolidayRate(p.holidayRate || "");
            setContractType(p.contractType || "");
            setStartOption(p.startOption || "");
            setExpectedStartDate(p.expectedStartDate ? p.expectedStartDate.split("T")[0] : "");
            setExpectedEndDate(p.expectedEndDate ? p.expectedEndDate.split("T")[0] : "");
            setVisibility(p.visibility || "public");
            // Load saved skills
            const skillMap = {};
            (p.skills || []).forEach((s) => { skillMap[s.skillId] = true; });
            setSelectedSkills(skillMap);
            // Load saved channels
            const chMap = {};
            (p.channels || []).forEach((c) => { chMap[c.channelId] = c.experience || "1-3 years"; });
            setSelectedChannels(chMap);
          }
        })
        .finally(() => setLoading(false));
    }
  }, [isNew, positionId]);

  const toggleSkill = (id) => {
    setSelectedSkills((prev) => {
      const next = { ...prev };
      if (next[id]) delete next[id];
      else next[id] = true;
      return next;
    });
  };

  const toggleChannel = (id) => {
    setSelectedChannels((prev) => {
      const next = { ...prev };
      if (next[id]) delete next[id];
      else next[id] = "1-3 years";
      return next;
    });
  };

  const handleSave = async (asDraft = false) => {
    if (!title.trim()) {
      alert("Please enter a job title.");
      return;
    }

    setSaving(true);
    setSaved(false);

    const body = {
      title: title.trim(),
      description: description.trim(),
      numberOfHires: parseInt(numberOfHires) || 1,
      regularRate: regularRate || null,
      afterHoursRate: afterHoursRate || null,
      holidayRate: holidayRate || null,
      contractType: contractType || null,
      startOption: startOption || null,
      expectedStartDate: expectedStartDate || null,
      expectedEndDate: expectedEndDate || null,
      visibility,
      status: asDraft ? "draft" : "active",
      skills: Object.keys(selectedSkills),
      channels: Object.entries(selectedChannels).map(([channelId, experience]) => ({
        channelId,
        experience,
      })),
    };

    try {
      if (isNew) {
        const res = await fetch("/api/positions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const result = await res.json();
        if (result.success) {
          router.push("/positions");
          return;
        }
      } else {
        await fetch(`/api/positions/${positionId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch {}
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="onboarding-loading">
        <div className="onboarding-spinner" />
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="position-form-page">
      <div className="page-header">
        <button
          className="btn-link"
          style={{ marginBottom: 8, padding: 0, fontSize: "0.85rem" }}
          onClick={() => router.push("/positions")}
        >
          &larr; Back to Job Postings
        </button>
        <h1 className="page-title">{isNew ? "Create Job Posting" : "Edit Job Posting"}</h1>
        <p className="page-subtitle">
          {isNew
            ? "Fill in the details for your new position."
            : "Update the details for this position."}
        </p>
      </div>

      <div className="card" style={{ maxWidth: 760 }}>
        {/* Title */}
        <div className="form-group">
          <label className="form-label">Job Title *</label>
          <input
            className="form-input"
            placeholder="e.g. Customer Service Representative"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        {/* Description */}
        <div className="form-group">
          <label className="form-label">Description</label>
          <textarea
            className="form-input form-textarea"
            placeholder="Describe the role, responsibilities, and what you're looking for..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
          />
        </div>

        {/* Visibility + Hires */}
        <div className="form-row">
          <div className="form-group form-half">
            <label className="form-label">Visibility</label>
            <div className="visibility-toggle">
              <button
                type="button"
                className={`visibility-option ${visibility === "public" ? "active" : ""}`}
                onClick={() => setVisibility("public")}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                Public
              </button>
              <button
                type="button"
                className={`visibility-option ${visibility === "private" ? "active" : ""}`}
                onClick={() => setVisibility("private")}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                Private
              </button>
            </div>
            <p className="form-hint">
              {visibility === "public"
                ? "Anyone can find and apply to this posting."
                : "Only professionals you invite can see this posting."}
            </p>
          </div>
          <div className="form-group form-half">
            <label className="form-label">Number of Hires</label>
            <input
              className="form-input"
              type="number"
              min="1"
              value={numberOfHires}
              onChange={(e) => setNumberOfHires(e.target.value)}
            />
          </div>
        </div>

        {/* Pay Rates */}
        <div className="form-group">
          <label className="form-label">Pay Rates ($/hr)</label>
          <p className="form-hint">Set the hourly rates for this position.</p>
        </div>
        <div className="form-row">
          <div className="form-group form-third">
            <label className="form-label" style={{ fontSize: "0.8rem" }}>Regular</label>
            <input
              className="form-input"
              type="number"
              step="0.50"
              min="0"
              placeholder="0.00"
              value={regularRate}
              onChange={(e) => setRegularRate(e.target.value)}
            />
          </div>
          <div className="form-group form-third">
            <label className="form-label" style={{ fontSize: "0.8rem" }}>After Hours</label>
            <input
              className="form-input"
              type="number"
              step="0.50"
              min="0"
              placeholder="0.00"
              value={afterHoursRate}
              onChange={(e) => setAfterHoursRate(e.target.value)}
            />
          </div>
          <div className="form-group form-third">
            <label className="form-label" style={{ fontSize: "0.8rem" }}>Holiday</label>
            <input
              className="form-input"
              type="number"
              step="0.50"
              min="0"
              placeholder="0.00"
              value={holidayRate}
              onChange={(e) => setHolidayRate(e.target.value)}
            />
          </div>
        </div>

        {/* Contract + Start */}
        <div className="form-row">
          <div className="form-group form-half">
            <label className="form-label">Contract Type</label>
            <select className="form-input form-select" value={contractType} onChange={(e) => setContractType(e.target.value)}>
              <option value="">Select type</option>
              {CONTRACT_TYPES.map((ct) => (
                <option key={ct.value} value={ct.value}>{ct.label}</option>
              ))}
            </select>
          </div>
          <div className="form-group form-half">
            <label className="form-label">Start Date</label>
            <select className="form-input form-select" value={startOption} onChange={(e) => setStartOption(e.target.value)}>
              <option value="">Select option</option>
              {START_OPTIONS.map((so) => (
                <option key={so.value} value={so.value}>{so.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Date pickers */}
        {(startOption === "date" || contractType === "fixed") && (
          <div className="form-row">
            {startOption === "date" && (
              <div className="form-group form-half">
                <label className="form-label">Expected Start</label>
                <input className="form-input" type="date" value={expectedStartDate} onChange={(e) => setExpectedStartDate(e.target.value)} />
              </div>
            )}
            {contractType === "fixed" && (
              <div className="form-group form-half">
                <label className="form-label">Expected End</label>
                <input className="form-input" type="date" value={expectedEndDate} onChange={(e) => setExpectedEndDate(e.target.value)} />
              </div>
            )}
          </div>
        )}

        {/* Required Skills */}
        <div className="form-group">
          <label className="form-label">Required Skills</label>
          <p className="form-hint">Select the skills you need for this position.</p>
          <div className="industry-grid">
            {allSkills.map((skill) => {
              const isSelected = !!selectedSkills[skill.id];
              return (
                <div
                  key={skill.id}
                  className={`industry-card ${isSelected ? "active" : ""}`}
                  onClick={() => toggleSkill(skill.id)}
                >
                  <div className="industry-card-toggle">
                    {isSelected && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                    {skill.name}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Required Channels */}
        <div className="form-group">
          <label className="form-label">Communication Channels</label>
          <p className="form-hint">Select the channels this role requires and the experience level needed.</p>
          <div className="industry-grid">
            {allChannels.map((ch) => {
              const isSelected = !!selectedChannels[ch.id];
              return (
                <div
                  key={ch.id}
                  className={`industry-card ${isSelected ? "active" : ""}`}
                  onClick={() => toggleChannel(ch.id)}
                >
                  <div className="industry-card-toggle">
                    {isSelected && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                    {ch.name}
                  </div>
                  {isSelected && (
                    <select
                      className="industry-card-exp"
                      value={selectedChannels[ch.id]}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => {
                        setSelectedChannels((prev) => ({ ...prev, [ch.id]: e.target.value }));
                      }}
                    >
                      {CHANNEL_EXP.map((exp) => (
                        <option key={exp} value={exp}>{exp}</option>
                      ))}
                    </select>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Save Buttons */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 24 }}>
          <button
            className="btn-primary"
            style={{ width: "auto" }}
            onClick={() => handleSave(false)}
            disabled={saving}
          >
            {saving ? "Saving..." : isNew ? "Create & Activate" : "Save Changes"}
          </button>
          <button
            className="btn-secondary"
            style={{ width: "auto" }}
            onClick={() => handleSave(true)}
            disabled={saving}
          >
            {isNew ? "Save as Draft" : "Save as Draft"}
          </button>
          {saved && <span style={{ color: "var(--teal)", fontSize: "0.85rem", fontWeight: 500 }}>Saved!</span>}
        </div>
      </div>
    </div>
  );
}
