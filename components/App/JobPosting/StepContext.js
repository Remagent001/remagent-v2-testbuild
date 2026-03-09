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

// Triple-tap: not selected → nice_to_have → required → not selected
function TripleTapGrid({ items, selected, onToggle, label, hint, showExp, expOptions }) {
  return (
    <div className="form-group">
      <label className="form-label">{label}</label>
      {hint && <p className="form-hint">{hint}</p>}
      <div className="triple-tap-legend" style={{ display: "flex", gap: 16, marginBottom: 12, fontSize: "0.8rem", color: "var(--gray-500)" }}>
        <span><span style={{ display: "inline-block", width: 12, height: 12, border: "2px solid var(--teal)", borderRadius: 3, marginRight: 4, verticalAlign: "middle" }}></span> Nice to have</span>
        <span><span style={{ display: "inline-block", width: 12, height: 12, background: "var(--teal)", borderRadius: 3, marginRight: 4, verticalAlign: "middle" }}></span> Required</span>
      </div>
      <div className="industry-grid">
        {items.map((item) => {
          const state = selected[item.id]; // undefined, "nice_to_have", or "required"
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
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
                {item.name}
                {isRequired && <span style={{ fontSize: "0.65rem", marginLeft: 4, opacity: 0.8 }}>REQUIRED</span>}
              </div>
              {showExp && (isNice || isRequired) && selected[item.id + "_exp"] !== undefined && (
                <select
                  className="industry-card-exp"
                  value={selected[item.id + "_exp"] || "none"}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => {
                    e.stopPropagation();
                    // handled via onExpChange
                  }}
                >
                  {(expOptions || EXP_OPTIONS).map((exp) => (
                    <option key={exp.value} value={exp.value}>{exp.label}</option>
                  ))}
                </select>
              )}
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
  });

  return (
    <div className="onboarding-step">
      <p className="onboarding-step-desc">
        Select the channels, skills, and applications needed for this role. Tap once for "nice to have", tap again for "required". Required items on public postings mean only matching professionals will see your posting.
      </p>

      {/* Channels */}
      <div className="form-group">
        <label className="form-label">Channels</label>
        <p className="form-hint">Select the communication channels this role requires. Tap once = nice to have, tap twice = required.</p>
        <div className="channel-list">
          {allChannels.map((ch) => {
            const state = channels[ch.id];
            const isNice = state === "nice_to_have";
            const isRequired = state === "required";
            const isSelected = isNice || isRequired;
            return (
              <div key={ch.id} className={`channel-item ${isSelected ? "active" : ""}`}
                style={isRequired ? { borderColor: "var(--teal)", background: "var(--teal)", color: "white" } : undefined}
              >
                <div
                  className="channel-check"
                  style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}
                  onClick={() => tripleTap(setChannels)(ch.id)}
                >
                  <span className="channel-name">{ch.name}</span>
                  {isRequired && <span style={{ fontSize: "0.65rem", fontWeight: 600, opacity: 0.8 }}>REQUIRED</span>}
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
        hint="Select up to 3 key skills needed. Tap once = nice to have, tap twice = required."
      />

      {/* Applications */}
      <TripleTapGrid
        items={allApplications}
        selected={applications}
        onToggle={tripleTap(setApplications)}
        label="Applications"
        hint="Select the software/platforms the professional should know."
      />

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
