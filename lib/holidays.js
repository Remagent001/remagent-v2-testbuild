// US Federal Holidays — returns Date objects for a given year
// Used by timesheet.js to determine holiday rate type

function nthWeekday(year, month, weekday, n) {
  // month is 0-indexed (0=Jan), weekday: 0=Sun,1=Mon,...
  const first = new Date(year, month, 1);
  let day = 1 + ((weekday - first.getDay() + 7) % 7);
  day += (n - 1) * 7;
  return new Date(year, month, day);
}

function lastWeekday(year, month, weekday) {
  const last = new Date(year, month + 1, 0); // last day of month
  const diff = (last.getDay() - weekday + 7) % 7;
  return new Date(year, month, last.getDate() - diff);
}

export function getFederalHolidays(year) {
  const holidays = [
    { name: "New Year's Day", date: new Date(year, 0, 1) },
    { name: "MLK Day", date: nthWeekday(year, 0, 1, 3) }, // 3rd Monday Jan
    { name: "Presidents' Day", date: nthWeekday(year, 1, 1, 3) }, // 3rd Monday Feb
    { name: "Memorial Day", date: lastWeekday(year, 4, 1) }, // Last Monday May
    { name: "Juneteenth", date: new Date(year, 5, 19) },
    { name: "Independence Day", date: new Date(year, 6, 4) },
    { name: "Labor Day", date: nthWeekday(year, 8, 1, 1) }, // 1st Monday Sep
    { name: "Columbus Day", date: nthWeekday(year, 9, 1, 2) }, // 2nd Monday Oct
    { name: "Veterans Day", date: new Date(year, 10, 11) },
    { name: "Thanksgiving", date: nthWeekday(year, 10, 4, 4) }, // 4th Thursday Nov
    { name: "Christmas Day", date: new Date(year, 11, 25) },
  ];

  // If a holiday falls on Saturday, observed on Friday.
  // If it falls on Sunday, observed on Monday.
  return holidays.map(({ name, date }) => {
    const day = date.getDay();
    let observed = new Date(date);
    if (day === 6) observed.setDate(date.getDate() - 1);
    if (day === 0) observed.setDate(date.getDate() + 1);
    return { name, date, observed };
  });
}

export function isHoliday(dateObj) {
  const year = dateObj.getFullYear();
  const holidays = getFederalHolidays(year);
  const dateStr = dateObj.toISOString().slice(0, 10);
  return holidays.some(
    (h) => h.observed.toISOString().slice(0, 10) === dateStr
  );
}
