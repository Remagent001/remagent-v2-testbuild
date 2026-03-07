"use client";

import { useState } from "react";

const DAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
const DAY_LABELS = { sunday: "Sun", monday: "Mon", tuesday: "Tue", wednesday: "Wed", thursday: "Thu", friday: "Fri", saturday: "Sat" };

// Generate time options in 15-min increments
const TIMES = [];
for (let h = 0; h < 24; h++) {
  for (let m = 0; m < 60; m += 15) {
    const hh = String(h).padStart(2, "0");
    const mm = String(m).padStart(2, "0");
    TIMES.push(`${hh}:${mm}`);
  }
}

const TIMEZONES = [
  "US/Eastern", "US/Central", "US/Mountain", "US/Pacific", "US/Alaska", "US/Hawaii",
  "America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles",
  "America/Phoenix", "America/Anchorage", "America/Toronto", "America/Vancouver",
  "Europe/London", "Europe/Berlin", "Europe/Paris", "Asia/Tokyo", "Asia/Shanghai",
  "Asia/Kolkata", "Australia/Sydney",
];

export default function StepAvailability({ data, onNext, onBack, onSaveExit, onSkip, saving }) {
  const [timezone, setTimezone] = useState(data?.user?.timezone || "US/Eastern");

  // Build initial schedule from saved data
  const [schedule, setSchedule] = useState(() => {
    const saved = {};
    (data?.availability || []).forEach((a) => {
      saved[a.day] = { enabled: true, startTime: a.startTime, endTime: a.endTime };
    });
    const initial = {};
    DAYS.forEach((d) => {
      initial[d] = saved[d] || { enabled: false, startTime: "09:00", endTime: "17:00" };
    });
    return initial;
  });

  const toggleDay = (day) => {
    setSchedule({ ...schedule, [day]: { ...schedule[day], enabled: !schedule[day].enabled } });
  };

  const updateTime = (day, field, value) => {
    setSchedule({ ...schedule, [day]: { ...schedule[day], [field]: value } });
  };

  const applyToAll = () => {
    // Find first enabled day
    const firstEnabled = DAYS.find((d) => schedule[d].enabled);
    if (!firstEnabled) return;
    const { startTime, endTime } = schedule[firstEnabled];
    const next = { ...schedule };
    DAYS.forEach((d) => {
      if (next[d].enabled) {
        next[d] = { ...next[d], startTime, endTime };
      }
    });
    setSchedule(next);
  };

  const getData = () => ({
    timezone,
    schedule: DAYS.filter((d) => schedule[d].enabled).map((d) => ({
      day: d,
      startTime: schedule[d].startTime,
      endTime: schedule[d].endTime,
    })),
  });

  return (
    <div className="onboarding-step">
      <p className="onboarding-step-desc">
        Set your weekly availability. Toggle the days you can work and set your hours.
      </p>

      <div className="form-group">
        <label className="form-label">Timezone</label>
        <select className="form-input form-select" value={timezone} onChange={(e) => setTimezone(e.target.value)}>
          {TIMEZONES.map((tz) => <option key={tz} value={tz}>{tz}</option>)}
        </select>
      </div>

      <div className="availability-grid">
        {DAYS.map((day) => (
          <div key={day} className={`availability-row ${schedule[day].enabled ? "active" : ""}`}>
            <label className="form-checkbox availability-day">
              <input type="checkbox" checked={schedule[day].enabled} onChange={() => toggleDay(day)} />
              {DAY_LABELS[day]}
            </label>
            {schedule[day].enabled && (
              <div className="availability-times">
                <select className="form-input form-select" value={schedule[day].startTime} onChange={(e) => updateTime(day, "startTime", e.target.value)}>
                  {TIMES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
                <span className="availability-to">to</span>
                <select className="form-input form-select" value={schedule[day].endTime} onChange={(e) => updateTime(day, "endTime", e.target.value)}>
                  {TIMES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            )}
          </div>
        ))}
      </div>

      <button type="button" className="btn-link" onClick={applyToAll} style={{ marginTop: 8 }}>
        Apply same time to all selected days
      </button>

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
