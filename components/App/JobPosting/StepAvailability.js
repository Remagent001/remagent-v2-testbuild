"use client";

import { useState } from "react";

const DAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
const DAY_LABELS = { sunday: "Sun", monday: "Mon", tuesday: "Tue", wednesday: "Wed", thursday: "Thu", friday: "Fri", saturday: "Sat" };

const TIMES = [];
for (let h = 0; h < 24; h++) {
  for (let m = 0; m < 60; m += 30) {
    const hh24 = String(h).padStart(2, "0");
    const mm = String(m).padStart(2, "0");
    const period = h < 12 ? "AM" : "PM";
    const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
    const label = `${h12}:${mm} ${period}`;
    TIMES.push({ value: `${hh24}:${mm}`, label });
  }
}
TIMES.push({ value: "23:59", label: "11:59 PM (End of Day)" });

const GRID_HOURS = [];
for (let h = 6; h <= 23; h++) {
  const period = h < 12 ? "AM" : "PM";
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  GRID_HOURS.push({ hour: h, label: `${h12}${period}` });
}

const TIMEZONES = [
  "Americas/Eastern", "Americas/Central", "Americas/Mountain", "Americas/Pacific",
];

const IANA_TO_TZ = {
  "America/New_York": "Americas/Eastern", "America/Detroit": "Americas/Eastern", "America/Indiana/Indianapolis": "Americas/Eastern",
  "America/Chicago": "Americas/Central", "America/Indiana/Knox": "Americas/Central", "America/Menominee": "Americas/Central",
  "America/Denver": "Americas/Mountain", "America/Boise": "Americas/Mountain", "America/Phoenix": "Americas/Mountain",
  "America/Los_Angeles": "Americas/Pacific", "America/Anchorage": "Americas/Pacific",
  "US/Eastern": "Americas/Eastern", "US/Central": "Americas/Central", "US/Mountain": "Americas/Mountain", "US/Pacific": "Americas/Pacific",
};

function detectTimezone() {
  try {
    const iana = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return IANA_TO_TZ[iana] || "Americas/Eastern";
  } catch { return "Americas/Eastern"; }
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
  const pos = data?.position;
  const savedTz = pos?.timezone;
  // Default to company profile timezone, then detect, then Eastern
  const companyTz = data?.businessTimezone;
  const [timezone, setTimezone] = useState(savedTz || companyTz || "Americas/Eastern");

  const [schedule, setSchedule] = useState(() => {
    const saved = {};
    (pos?.availability || []).forEach((a) => {
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
      if (next[d].enabled) next[d] = { ...next[d], startTime, endTime };
    });
    setSchedule(next);
  };

  const getBarStyle = (startTime, endTime) => {
    const [sh, sm] = startTime.split(":").map(Number);
    const [eh, em] = endTime.split(":").map(Number);
    const startMin = sh * 60 + sm;
    const endMin = eh * 60 + em;
    const gridStart = 6 * 60;
    const gridEnd = 24 * 60;
    const gridSpan = gridEnd - gridStart;
    const left = Math.max(0, ((startMin - gridStart) / gridSpan) * 100);
    const width = Math.max(0, Math.min(((endMin - gridStart) / gridSpan) * 100 - left, 100 - left));
    return { left: `${left}%`, width: `${width}%` };
  };

  const [isDefault, setIsDefault] = useState(false);

  const getData = () => ({
    timezone,
    schedule: DAYS.filter((d) => schedule[d].enabled).map((d) => ({
      day: d, startTime: schedule[d].startTime, endTime: schedule[d].endTime,
    })),
    isDefault,
  });

  return (
    <div className="onboarding-step">
      <p className="onboarding-step-desc">
        Set the hours you need to staff for this position. Select the days and times you want professionals to be available. This can cover all shifts — including 24 hours if needed.
      </p>

      <div className="form-group">
        <label className="form-label">Your Business Timezone</label>
        <p className="form-hint">All availability times will be shown to candidates in their own timezone, converted from yours.</p>
        <select className="form-input form-select" value={timezone} onChange={(e) => setTimezone(e.target.value)}>
          {TIMEZONES.map((tz) => <option key={tz} value={tz}>{tz}</option>)}
        </select>
      </div>

      <div className="form-group">
        <label className="form-label">Staffing Schedule</label>
        <p className="form-hint">If you know the shifts you are looking for, select the days and times you would like to staff for.</p>
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

      {DAYS.some((d) => schedule[d].enabled) && (
        <div className="avail-visual">
          <label className="form-label" style={{ marginBottom: 12 }}>Staffing Schedule Overview</label>
          <div className="avail-visual-grid">
            <div className="avail-visual-header">
              <div className="avail-visual-day-label" />
              <div className="avail-visual-hours">
                {GRID_HOURS.filter((_, i) => i % 2 === 0).map((h) => (
                  <span key={h.hour} className="avail-visual-hour-label" style={{ left: `${((h.hour - 6) / 18) * 100}%` }}>{h.label}</span>
                ))}
              </div>
            </div>
            {DAYS.map((day) => (
              <div key={day} className="avail-visual-row">
                <div className="avail-visual-day-label">{DAY_LABELS[day]}</div>
                <div className="avail-visual-track">
                  {schedule[day].enabled ? (
                    <>
                      <div className="avail-visual-bar" style={getBarStyle(schedule[day].startTime, schedule[day].endTime)} />
                      <span className="avail-visual-time-label">{to12hr(schedule[day].startTime)} – {to12hr(schedule[day].endTime)}</span>
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
          <button className="btn-primary" style={{ width: "auto" }} onClick={() => onNext(getData())} disabled={saving}>{saving ? "Saving..." : "Next"}</button>
        </div>
      </div>
    </div>
  );
}
