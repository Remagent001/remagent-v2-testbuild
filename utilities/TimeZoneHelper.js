export const TZ_OFFSETS = {
  "Americas/Eastern": -5, "Americas/Central": -6, "Americas/Mountain": -7, "Americas/Pacific": -8,
  "Americas/Alaska": -9, "Americas/Hawaii": -10,
  "America/New_York": -5, "America/Chicago": -6, "America/Denver": -7, "America/Los_Angeles": -8,
  "America/Detroit": -5, "America/Boise": -7, "America/Phoenix": -7, "America/Anchorage": -9,
  "Pacific/Honolulu": -10,
  "US/Eastern": -5, "US/Central": -6, "US/Mountain": -7, "US/Pacific": -8,
  "US/Alaska": -9, "US/Hawaii": -10,
};

const TZ_LABELS = {
  "Americas/Eastern": "ET", "Americas/Central": "CT", "Americas/Mountain": "MT", "Americas/Pacific": "PT",
  "Americas/Alaska": "AKT", "Americas/Hawaii": "HT",
  "America/New_York": "ET", "America/Chicago": "CT", "America/Denver": "MT", "America/Los_Angeles": "PT",
  "America/Detroit": "ET", "America/Boise": "MT", "America/Phoenix": "MT", "America/Anchorage": "AKT",
  "Pacific/Honolulu": "HT",
  "US/Eastern": "ET", "US/Central": "CT", "US/Mountain": "MT", "US/Pacific": "PT",
  "US/Alaska": "AKT", "US/Hawaii": "HT",
};

export function convertTime(time24, fromTz, toTz) {
  if (!time24 || !fromTz || !toTz || fromTz === toTz) return time24;
  const [h, m] = time24.split(":").map(Number);
  const diff = (TZ_OFFSETS[toTz] || -5) - (TZ_OFFSETS[fromTz] || -5);
  let newH = h + diff;
  if (newH < 0) newH += 24;
  if (newH >= 24) newH -= 24;
  return `${String(newH).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

// Returns the day offset caused by timezone conversion (-1, 0, or +1)
export function convertTimeDayOffset(time24, fromTz, toTz) {
  if (!time24 || !fromTz || !toTz || fromTz === toTz) return 0;
  const [h] = time24.split(":").map(Number);
  const diff = (TZ_OFFSETS[toTz] || -5) - (TZ_OFFSETS[fromTz] || -5);
  const newH = h + diff;
  if (newH < 0) return -1;
  if (newH >= 24) return 1;
  return 0;
}

// Check if a shift is overnight (end time <= start time)
export function isOvernightShift(startTime, endTime) {
  if (!startTime || !endTime) return false;
  return endTime <= startTime;
}

// Calculate shift duration in hours
export function shiftDurationHrs(startTime, endTime) {
  if (!startTime || !endTime) return 0;
  const [sh, sm] = startTime.split(":").map(Number);
  const [eh, em] = endTime.split(":").map(Number);
  let mins = (eh * 60 + em) - (sh * 60 + sm);
  if (mins <= 0) mins += 24 * 60;
  return Math.round(mins / 60 * 10) / 10;
}

export function to12hr(time24) {
  if (!time24) return "";
  const [h, m] = time24.split(":");
  const hr = parseInt(h, 10);
  return `${hr === 0 ? 12 : hr > 12 ? hr - 12 : hr}:${m} ${hr >= 12 ? "PM" : "AM"}`;
}

export function tzLabel(tz) {
  return TZ_LABELS[tz] || "ET";
}

const DAY_ORDER = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
const DAY_SHORT = { sunday: "Sun", monday: "Mon", tuesday: "Tue", wednesday: "Wed", thursday: "Thu", friday: "Fri", saturday: "Sat" };

export function nextDay(day) {
  const idx = DAY_ORDER.indexOf(day);
  return DAY_ORDER[(idx + 1) % 7];
}

export function nextDayLabel(day) {
  return DAY_SHORT[nextDay(day)] || "";
}

export function dayLabel(day) {
  return DAY_SHORT[day] || day;
}

// Convert and format a time range for display, with timezone label
// Overnight-aware: accounts for day shifts from timezone conversion
export function formatTimeRange(startTime, endTime, fromTz, toTz) {
  const start = convertTime(startTime, fromTz, toTz);
  const end = convertTime(endTime, fromTz, toTz);
  return `${to12hr(start)} - ${to12hr(end)} ${tzLabel(toTz)}`;
}

// Check if a shift is overnight after timezone conversion
export function isOvernightAfterConvert(startTime, endTime, fromTz, toTz) {
  const start = convertTime(startTime, fromTz, toTz);
  const end = convertTime(endTime, fromTz, toTz);
  // Original overnight status
  const wasOvernight = isOvernightShift(startTime, endTime);
  // Day offsets from tz conversion
  const startDayOff = convertTimeDayOffset(startTime, fromTz, toTz);
  const endDayOff = convertTimeDayOffset(endTime, fromTz, toTz);
  // If it was overnight, end is on day+1; after conversion, check if they're still on different days
  if (wasOvernight) {
    const effectiveEndDay = 1 + endDayOff - startDayOff;
    return effectiveEndDay > 0 || end <= start;
  }
  // Wasn't overnight, but tz conversion might push end to previous day or start to next
  return (endDayOff - startDayOff) < 0 || (endDayOff === startDayOff && end <= start);
}
