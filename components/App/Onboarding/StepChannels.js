"use client";

import { useState } from "react";

const EXP_OPTIONS = [
  { value: "none", label: "No Experience" },
  { value: "1-6mo", label: "1-6 months" },
  { value: "6-12mo", label: "6-12 months" },
  { value: "1-2yr", label: "1-2 years" },
  { value: "2-3yr", label: "2-3 years" },
  { value: "3+yr", label: "3+ years" },
];

export default function StepChannels({ data, onNext, onBack, onSaveExit, onSkip, saving }) {
  // Build initial state from saved data
  const existing = {};
  (data?.userChannels || []).forEach((uc) => {
    existing[uc.channelId] = uc.experience || "none";
  });

  const [channels, setChannels] = useState(existing);

  // Custom sort order for channels
  const CHANNEL_ORDER = ["Phone (Inbound calls)", "Phone (Outbound calls)", "Web Chat", "Mobile / Text Chat", "Screen Share / Control", "Email"];
  const allChannels = [...(data?.allChannels || [])].sort((a, b) => {
    const ai = CHANNEL_ORDER.indexOf(a.name);
    const bi = CHANNEL_ORDER.indexOf(b.name);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });

  const toggleChannel = (id) => {
    const next = { ...channels };
    if (next[id] !== undefined) {
      delete next[id];
    } else {
      next[id] = "none";
    }
    setChannels(next);
  };

  const setExperience = (id, exp) => {
    setChannels({ ...channels, [id]: exp });
  };

  const getData = () => ({
    channels: Object.entries(channels).map(([channelId, experience]) => ({
      channelId,
      experience,
    })),
  });

  return (
    <div className="onboarding-step">
      <p className="onboarding-step-desc">
        Which communication channels have you worked with? Select all that apply and
        tell us how much experience you have with each.
      </p>

      <div className="channel-list">
        {allChannels.map((ch) => {
          const selected = channels[ch.id] !== undefined;
          return (
            <div
              key={ch.id}
              className={`channel-item ${selected ? "active" : ""}`}
              onClick={() => toggleChannel(ch.id)}
              style={{ cursor: "pointer" }}
            >
              <label className="channel-check" onClick={(e) => e.stopPropagation()}>
                <input
                  type="checkbox"
                  checked={selected}
                  onChange={() => toggleChannel(ch.id)}
                />
                <span className="channel-name">{ch.name}</span>
              </label>
              {selected && (
                <select
                  className="form-input form-select channel-exp"
                  value={channels[ch.id]}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => setExperience(ch.id, e.target.value)}
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

      <div className="onboarding-actions">
        <button className="btn-secondary" onClick={onBack} disabled={saving}>
          Back
        </button>
        <div className="onboarding-actions-right">
          <button className="btn-link" onClick={onSkip}>Skip</button>
          <button
            className="btn-secondary"
            onClick={() => onSaveExit(getData())}
            disabled={saving}
          >
            Save & Exit
          </button>
          <button
            className="btn-primary"
            style={{ width: "auto" }}
            onClick={() => onNext(getData())}
            disabled={saving}
          >
            {saving ? "Saving..." : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}
