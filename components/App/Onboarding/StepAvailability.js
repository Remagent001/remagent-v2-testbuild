"use client";

import { useState } from "react";

const DAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
const DAY_LABELS = { sunday: "Sun", monday: "Mon", tuesday: "Tue", wednesday: "Wed", thursday: "Thu", friday: "Fri", saturday: "Sat" };

// Generate 12-hour time options in 15-min increments
const TIMES = [];
for (let h = 0; h < 24; h++) {
  for (let m = 0; m < 60; m += 15) {
    const hh24 = String(h).padStart(2, "0");
    const mm = String(m).padStart(2, "0");
    const period = h < 12 ? "AM" : "PM";
    const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
    const label = `${h12}:${mm} ${period}`;
    TIMES.push({ value: `${hh24}:${mm}`, label });
  }
}

// Hours for the visual grid (6am-11pm)
const GRID_HOURS = [];
for (let h = 6; h <= 23; h++) {
  const period = h < 12 ? "AM" : "PM";
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  GRID_HOURS.push({ hour: h, label: `${h12}${period}` });
}

const TIMEZONES = [
  "Americas/Eastern", "Americas/Central", "Americas/Mountain", "Americas/Pacific",
];

function detectTimezone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return "US/Eastern";
  }
}

function to12hr(time24) {
  if (!time24) return "";
  const [h, m] = time24.split(":");
  const hr = parseInt(h, 10);
  const ampm = hr >= 12 ? "PM" : "AM";
  const hr12 = hr === 0 ? 12 : hr > 12 ? hr - 12 : hr;
  return `${hr12}:${m} ${ampm}`;
}

export default function StepAvailability({ data, onNext, onBack, onSaveExit, onSkip, saving }) {
  const savedTz = data?.user?.timezone;
  const [timezone, setTimezone] = useState(savedTz || detectTimezone());

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

  // Calculate bar position for the visual grid
  const getBarStyle = (startTime, endTime) => {
    const [sh, sm] = startTime.split(":").map(Number);
    const [eh, em] = endTime.split(":").map(Number);
    const startMin = sh * 60 + sm;
    const endMin = eh * 60 + em;
    const gridStart = 6 * 60; // 6 AM
    const gridEnd = 24 * 60; // midnight
    const gridSpan = gridEnd - gridStart;
    const left = Math.max(0, ((startMin - gridStart) / gridSpan) * 100);
    const width = Math.max(0, Math.min(((endMin - gridStart) / gridSpan) * 100 - left, 100 - left));
    return { left: `${left}%`, width: `${width}%` };
  };

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
                  {TIMES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
                <span className="availability-to">to</span>
                <select className="form-input form-select" value={schedule[day].endTime} onChange={(e) => updateTime(day, "endTime", e.target.value)}>
                  {TIMES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
            )}
          </div>
        ))}
      </div>

      <button type="button" className="btn-link" onClick={applyToAll} style={{ marginTop: 8 }}>
        Apply same time to all selected days
      </button>

      {/* Visual weekly grid */}
      {DAYS.some((d) => schedule[d].enabled) && (
        <div className="avail-visual">
          <label className="form-label" style={{ marginBottom: 12 }}>Your Weekly Schedule</label>
          <div className="avail-visual-grid">
            {/* Hour labels header */}
            <div className="avail-visual-header">
              <div className="avail-visual-day-label" />
              <div className="avail-visual-hours">
                {GRID_HOURS.filter((_, i) => i % 2 === 0).map((h) => (
                  <span key={h.hour} className="avail-visual-hour-label" style={{ left: `${((h.hour - 6) / 18) * 100}%` }}>
                    {h.label}
                  </span>
                ))}
              </div>
            </div>
            {/* Day rows */}
            {DAYS.map((day) => (
              <div key={day} className="avail-visual-row">
                <div className="avail-visual-day-label">{DAY_LABELS[day]}</div>
                <div className="avail-visual-track">
                  {schedule[day].enabled ? (
                    <>
                      <div className="avail-visual-bar" style={getBarStyle(schedule[day].startTime, schedule[day].endTime)} />
                      <span className="avail-visual-time-label">
                        {to12hr(schedule[day].startTime)} – {to12hr(schedule[day].endTime)}
                      </span>
                    </>
                  ) : (
                    <span className="avail-visual-off">Off</span>
                  )}
                </div>
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
