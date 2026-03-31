import { isHoliday } from "./holidays";

/**
 * Calculate decimal hours between two timestamps, minus break time.
 * @param {Date} startTime
 * @param {Date} endTime
 * @param {number} breakMinutes - break time in minutes
 * @returns {number} hours rounded to 2 decimals
 */
export function calculateHours(startTime, endTime, breakMinutes = 0) {
  const ms = endTime.getTime() - startTime.getTime() - breakMinutes * 60000;
  return Math.round((ms / 3600000) * 100) / 100;
}

/**
 * Determine the rate type for a time entry based on the hire schedule.
 * Priority: holiday > outside scheduled days > outside scheduled hours > regular
 * @param {object} hire - Hire record with daysOfWork, startTime, endTime
 * @param {Date} entryDate - The calendar date of the entry
 * @param {string} entryStartTime - "HH:MM" format (optional, for hour-level detection)
 * @param {string} entryEndTime - "HH:MM" format (optional)
 * @returns {"regular"|"after_hours"|"holiday"}
 */
export function determineRateType(hire, entryDate, entryStartTime, entryEndTime) {
  // Check holidays first
  if (isHoliday(entryDate)) {
    return "holiday";
  }

  // Check if the day is in the hire's scheduled days
  if (hire.daysOfWork) {
    const days = typeof hire.daysOfWork === "string"
      ? JSON.parse(hire.daysOfWork)
      : hire.daysOfWork;
    const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    const entryDay = dayNames[entryDate.getDay()];
    if (Array.isArray(days) && !days.includes(entryDay)) {
      return "after_hours";
    }
  }

  // Check if entry falls outside scheduled hours
  if (hire.startTime && hire.endTime && entryStartTime && entryEndTime) {
    const hireStart = timeToMinutes(hire.startTime);
    const hireEnd = timeToMinutes(hire.endTime);
    const entryStart = timeToMinutes(entryStartTime);
    const entryEnd = timeToMinutes(entryEndTime);

    // If the entry is fully outside the scheduled window
    if (entryEnd <= hireStart || entryStart >= hireEnd) {
      return "after_hours";
    }
  }

  return "regular";
}

/**
 * Convert "HH:MM" to minutes since midnight.
 */
function timeToMinutes(timeStr) {
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + (m || 0);
}

/**
 * Get the Monday-Sunday week range for a given date.
 * @param {Date} date
 * @returns {{ weekStart: Date, weekEnd: Date }}
 */
export function getWeekRange(date) {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun, 1=Mon, ...
  const diffToMonday = day === 0 ? -6 : 1 - day;

  const weekStart = new Date(d);
  weekStart.setDate(d.getDate() + diffToMonday);
  weekStart.setHours(0, 0, 0, 0);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  return { weekStart, weekEnd };
}

/**
 * Format a Date to "HH:MM" string.
 */
export function dateToTimeStr(date) {
  return date.toISOString().slice(11, 16);
}

/**
 * Get the previous week's Monday (for cron assembly).
 * @returns {Date}
 */
export function getPreviousWeekStart() {
  const now = new Date();
  const { weekStart } = getWeekRange(now);
  weekStart.setDate(weekStart.getDate() - 7);
  return weekStart;
}

/**
 * Assemble a weekly timesheet for a single hire.
 * Sums time entries by rate type, calculates amounts, upserts the WeeklyTimesheet.
 * @param {object} prisma - Prisma client
 * @param {string} hireId
 * @param {Date} weekStart - Monday of the target week
 * @returns {object|null} The upserted WeeklyTimesheet, or null if no entries
 */
export async function assembleWeeklyTimesheet(prisma, hireId, weekStart) {
  const ws = new Date(weekStart);
  ws.setHours(0, 0, 0, 0);
  const we = new Date(ws);
  we.setDate(ws.getDate() + 6);
  we.setHours(23, 59, 59, 999);

  // Get all work entries for this hire in the week
  const entries = await prisma.timeEntry.findMany({
    where: {
      hireId,
      type: "work",
      date: { gte: ws, lte: we },
      endTime: { not: null },
    },
  });

  if (entries.length === 0) return null;

  // Load hire with rates and business profile for admin markup
  const hire = await prisma.hire.findUnique({
    where: { id: hireId },
    include: {
      business: {
        include: { businessProfile: { select: { adminMarkup: true, autoApprove: true } } },
      },
    },
  });
  if (!hire) return null;

  // Sum hours by rate type
  let totalRegularHrs = 0;
  let totalAfterHrs = 0;
  let totalHolidayHrs = 0;

  for (const entry of entries) {
    const hrs = calculateHours(entry.startTime, entry.endTime, entry.breakMinutes);
    if (entry.rateType === "holiday") totalHolidayHrs += hrs;
    else if (entry.rateType === "after_hours") totalAfterHrs += hrs;
    else totalRegularHrs += hrs;
  }

  // Round to 2 decimals
  totalRegularHrs = Math.round(totalRegularHrs * 100) / 100;
  totalAfterHrs = Math.round(totalAfterHrs * 100) / 100;
  totalHolidayHrs = Math.round(totalHolidayHrs * 100) / 100;

  // Calculate amounts
  const regularRate = hire.regularRate || 0;
  const afterHoursRate = hire.afterHoursRate || regularRate;
  const holidayRate = hire.holidayRate || regularRate;

  const regularAmount = Math.round(totalRegularHrs * regularRate * 100) / 100;
  const afterHrsAmount = Math.round(totalAfterHrs * afterHoursRate * 100) / 100;
  const holidayAmount = Math.round(totalHolidayHrs * holidayRate * 100) / 100;
  const subtotal = Math.round((regularAmount + afterHrsAmount + holidayAmount) * 100) / 100;

  const adminMarkup = hire.business?.businessProfile?.adminMarkup ?? 10;
  const adminFee = Math.round(subtotal * (adminMarkup / 100) * 100) / 100;
  const totalAmount = Math.round((subtotal + adminFee) * 100) / 100;

  // Determine status — auto-approve if business has that flag
  const autoApprove = hire.business?.businessProfile?.autoApprove || false;
  const status = autoApprove ? "approved" : "pending";

  // Upsert the weekly timesheet
  const weekStartDate = new Date(ws);
  const weekEndDate = new Date(ws);
  weekEndDate.setDate(ws.getDate() + 6);

  const timesheet = await prisma.weeklyTimesheet.upsert({
    where: { hireId_weekStart: { hireId, weekStart: weekStartDate } },
    create: {
      hireId,
      professionalId: hire.professionalId,
      businessId: hire.businessId,
      weekStart: weekStartDate,
      weekEnd: weekEndDate,
      totalRegularHrs,
      totalAfterHrs,
      totalHolidayHrs,
      regularAmount,
      afterHrsAmount,
      holidayAmount,
      subtotal,
      adminMarkup,
      adminFee,
      totalAmount,
      status,
      ...(autoApprove ? { approvedAt: new Date(), approvedBy: "system" } : {}),
    },
    update: {
      totalRegularHrs,
      totalAfterHrs,
      totalHolidayHrs,
      regularAmount,
      afterHrsAmount,
      holidayAmount,
      subtotal,
      adminMarkup,
      adminFee,
      totalAmount,
      // Only reset status if currently pending (don't overwrite approved/invoiced)
      ...(status === "approved" ? { status: "approved", approvedAt: new Date(), approvedBy: "system" } : {}),
    },
  });

  // Link entries to this timesheet
  await prisma.timeEntry.updateMany({
    where: {
      hireId,
      type: "work",
      date: { gte: ws, lte: we },
      endTime: { not: null },
    },
    data: { weeklyTimesheetId: timesheet.id },
  });

  return timesheet;
}

/**
 * Assemble timesheets for ALL active hires for a given week.
 * @param {object} prisma - Prisma client
 * @param {Date} weekStart - Monday of the target week
 * @returns {object[]} Array of assembled WeeklyTimesheet records
 */
export async function assembleAllTimesheetsForWeek(prisma, weekStart) {
  const activeHires = await prisma.hire.findMany({
    where: { status: "active" },
    select: { id: true },
  });

  const results = [];
  for (const hire of activeHires) {
    const ts = await assembleWeeklyTimesheet(prisma, hire.id, weekStart);
    if (ts) results.push(ts);
  }
  return results;
}
