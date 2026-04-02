"use client";

import { useState } from "react";

const CHANNEL_ORDER = ["Phone (Inbound calls)", "Phone (Outbound calls)", "Web Chat", "Mobile / Text Chat", "Screen Share / Control", "Co-Browse", "Email"];

const EXP_OPTIONS = [
  { value: "none", label: "No Experience" },
  { value: "1-6mo", label: "1-6 months" },
  { value: "6-12mo", label: "6-12 months" },
  { value: "1-2yr", label: "1-2 years" },
  { value: "2-3yr", label: "2-3 years" },
  { value: "3+yr", label: "3+ years" },
];

// Triple-tap grid for Skills and Applications — styled like Channels (white text on required)
function TripleTapGrid({ items, selected, onToggle, label }) {
  return (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <div className="industry-grid">
        {items.map((item) => {
          const state = selected[item.id];
          const isNice = state === "nice_to_have";
          const isRequired = state === "required";
          return (
            <div
              key={item.id}
              className={`industry-card ${isNice ? "active" : ""} ${isRequired ? "active required" : ""}`}
              onClick={() => onToggle(item.id)}
              style={isRequired ? { background: "var(--teal)", color: "white", borderColor: "var(--teal)" } : undefined}
            >
              <div className="industry-card-toggle">
                {(isNice || isRequired) && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={isRequired ? "white" : "currentColor"} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
                <span style={isRequired ? { color: "white", fontWeight: 600 } : undefined}>{item.name}</span>
                {isRequired && <span style={{ fontSize: "0.65rem", marginLeft: 4, color: "white", fontWeight: 700 }}>REQUIRED TO VIEW</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function StepContext({ data, onNext, onBack, onSaveExit, onSkip, saving }) {
  const pos = data?.position;
  const allChannels = [...(data?.allChannels || [])].sort((a, b) => {
    const ai = CHANNEL_ORDER.indexOf(a.name);
    const bi = CHANNEL_ORDER.indexOf(b.name);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });
  const allSkills = data?.allSkills || [];
  const allApplications = data?.allApplications || [];

  // Initialize from saved data
  const [channels, setChannels] = useState(() => {
    const map = {};
    (pos?.channels || []).forEach((c) => {
      map[c.channelId] = c.requirement || "nice_to_have";
      map[c.channelId + "_exp"] = c.experience || "none";
    });
    return map;
  });

  const [skills, setSkills] = useState(() => {
    const map = {};
    (pos?.skills || []).forEach((s) => {
      map[s.skillId] = s.requirement || "nice_to_have";
    });
    return map;
  });

  const [applications, setApplications] = useState(() => {
    const map = {};
    (pos?.positionApps || []).forEach((a) => {
      map[a.applicationId] = a.requirement || "nice_to_have";
    });
    return map;
  });

  const [isDefault, setIsDefault] = useState(false);

  // Triple-tap: nothing → nice_to_have → required → nothing
  const tripleTap = (setter) => (id) => {
    setter((prev) => {
      const current = prev[id];
      const next = { ...prev };
      if (!current) {
        next[id] = "nice_to_have";
      } else if (current === "nice_to_have") {
        next[id] = "required";
      } else {
        delete next[id];
      }
      return next;
    });
  };

  const setChannelExp = (id, exp) => {
    setChannels((prev) => ({ ...prev, [id + "_exp"]: exp }));
  };

  const getData = () => ({
    channels: Object.entries(channels)
      .filter(([k, v]) => !k.endsWith("_exp") && v)
      .map(([channelId, requirement]) => ({
        channelId,
        requirement,
        experience: channels[channelId + "_exp"] || "none",
      })),
    skills: Object.entries(skills)
      .filter(([, v]) => v)
      .map(([skillId, requirement]) => ({ skillId, requirement })),
    applications: Object.entries(applications)
      .filter(([, v]) => v)
      .map(([applicationId, requirement]) => ({ applicationId, requirement })),
    isDefault,
  });

  return (
    <div className="onboarding-step">
      <p className="onboarding-step-desc">
        Select the channels, skills, and applications needed for this role. Tap once for "desired" experience. If you want this job posting to only appear to candidates with the skill identified in their profile, tap twice to consider as "Required to View".
      </p>

      {/* Legend box — floated right */}
      <div style={{
        float: "right", width: 200, marginLeft: 16, marginBottom: 16, padding: 14,
        border: "1px solid var(--gray-200)", borderRadius: 8, background: "var(--gray-50)",
        fontSize: "0.82rem", color: "var(--gray-600)",
      }}>
        <div style={{ fontWeight: 700, fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--gray-500)", marginBottom: 10 }}>Legend</div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <span style={{ display: "inline-block", width: 14, height: 14, border: "2px solid var(--teal)", borderRadius: 3, flexShrink: 0 }} />
          <span>Desired</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <span style={{ display: "inline-block", width: 14, height: 14, background: "var(--teal)", borderRadius: 3, flexShrink: 0 }} />
          <span>Required</span>
        </div>
        <p style={{ fontSize: "0.75rem", color: "var(--gray-400)", lineHeight: 1.4, margin: 0 }}>
          Tap once for <strong>DESIRED</strong> and twice if the attribute is required for the Candidate to see this Job Posting in their search.
        </p>
      </div>

      {/* Channels */}
      <div className="form-group">
        <label className="form-label">Channels</label>
        <div className="channel-list">
          {allChannels.map((ch) => {
            const state = channels[ch.id];
            const isNice = state === "nice_to_have";
            const isRequired = state === "required";
            const isSelected = isNice || isRequired;
            return (
              <div
                key={ch.id}
                className={`channel-item ${isSelected ? "active" : ""}`}
                style={{
                  cursor: "pointer",
                  ...(isRequired ? { borderColor: "var(--teal)", background: "var(--teal)", color: "white" } : {}),
                }}
                onClick={() => tripleTap(setChannels)(ch.id)}
              >
                <div
                  className="channel-check"
                  style={{ display: "flex", alignItems: "center", gap: 8 }}
                >
                  <span className="channel-name">{ch.name}</span>
                  {isRequired && <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "white" }}>REQUIRED TO VIEW</span>}
                </div>
                {isSelected && (
                  <select
                    className="form-input form-select channel-exp"
                    value={channels[ch.id + "_exp"] || "none"}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => setChannelExp(ch.id, e.target.value)}
                    style={isRequired ? { color: "var(--gray-800)" } : undefined}
                  >
                    {EXP_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Skills (Interaction Types) */}
      <TripleTapGrid
        items={allSkills}
        selected={skills}
        onToggle={tripleTap(setSkills)}
        label="Skills (Interaction Types)"
      />

      {/* Applications */}
      <TripleTapGrid
        items={allApplications}
        selected={applications}
        onToggle={tripleTap(setApplications)}
        label="Applications"
      />

      {/* Save as Default */}
      <div className="form-group" style={{ marginTop: 20 }}>
        <label className="form-checkbox">
          <input type="checkbox" checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)} />
          Save these settings as default for future job postings
        </label>
        <p className="form-hint" style={{ marginLeft: 24 }}>When checked, your next new job posting will pre-fill with the details from this section.</p>
      </div>

      <div className="onboarding-actions">
        <button className="btn-secondary" onClick={onBack} disabled={saving}>Back</button>
        <div className="onboarding-actions-right">
          <button className="btn-link" onClick={onSkip}>Skip</button>
          <button className="btn-secondary" onClick={() => onSaveExit(getData())} disabled={saving}>Save & Exit</button>
          <button className="btn-primary" style={{ width: "auto" }} onClick={() => onNext(getData())} disabled={saving}>
            {saving ? "Saving..." : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}
