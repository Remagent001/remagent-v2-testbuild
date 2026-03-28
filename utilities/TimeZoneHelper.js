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

export function to12hr(time24) {
  if (!time24) return "";
  const [h, m] = time24.split(":");
  const hr = parseInt(h, 10);
  return `${hr === 0 ? 12 : hr > 12 ? hr - 12 : hr}:${m} ${hr >= 12 ? "PM" : "AM"}`;
}

export function tzLabel(tz) {
  return TZ_LABELS[tz] || "ET";
}

// Convert and format a time range for display, with timezone label
// e.g. "9:00 AM - 5:00 PM ET"
export function formatTimeRange(startTime, endTime, fromTz, toTz) {
  const start = convertTime(startTime, fromTz, toTz);
  const end = convertTime(endTime, fromTz, toTz);
  return `${to12hr(start)} - ${to12hr(end)} ${tzLabel(toTz)}`;
}
