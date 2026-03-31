import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { assembleAllTimesheetsForWeek, getPreviousWeekStart, calculateHours } from "@/lib/timesheet";
import { sendWeeklyTimesheetEmail } from "@/lib/email";

// POST — weekly cron: assemble timesheets + send emails
export async function POST(request) {
  // Auth via cron secret only
  const cronSecret = request.headers.get("x-cron-secret");
  if (!cronSecret || cronSecret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const weekStart = getPreviousWeekStart();
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  const weekLabel = `${weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${weekEnd.toLocaleDateString("en-US", { month: "short", day: "numeric" })}, ${weekStart.getFullYear()}`;

  // 1. Assemble all timesheets for the previous week
  const timesheets = await assembleAllTimesheetsForWeek(prisma, weekStart);

  if (timesheets.length === 0) {
    return NextResponse.json({ success: true, assembled: 0, emailsSent: 0, weekLabel });
  }

  // 2. Group by businessId
  const byBusiness = {};
  for (const ts of timesheets) {
    if (!byBusiness[ts.businessId]) byBusiness[ts.businessId] = [];
    byBusiness[ts.businessId].push(ts);
  }

  // 3. For each business, build daily hours per professional and send email
  let emailsSent = 0;
  const dayMap = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

  for (const [businessId, bizTimesheets] of Object.entries(byBusiness)) {
    // Load business user
    const bizUser = await prisma.user.findUnique({
      where: { id: businessId },
      select: {
        email: true,
        phone: true,
        businessProfile: { select: { businessName: true } },
      },
    });
    if (!bizUser?.email) continue;

    // Build professional data with daily hours
    const professionals = [];
    for (const ts of bizTimesheets) {
      const pro = await prisma.user.findUnique({
        where: { id: ts.professionalId },
        select: { firstName: true, lastName: true },
      });
      const hire = await prisma.hire.findUnique({
        where: { id: ts.hireId },
        include: { position: { select: { title: true } } },
      });

      // Get daily hours from entries
      const entries = await prisma.timeEntry.findMany({
        where: { weeklyTimesheetId: ts.id, type: "work", endTime: { not: null } },
      });

      const daily = { mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, sun: 0 };
      for (const entry of entries) {
        const d = new Date(entry.date);
        const dayName = dayMap[d.getDay()];
        const hrs = calculateHours(entry.startTime, entry.endTime, entry.breakMinutes);
        daily[dayName] = Math.round((daily[dayName] + hrs) * 100) / 100;
      }

      const totalHrs = Math.round((ts.totalRegularHrs + ts.totalAfterHrs + ts.totalHolidayHrs) * 100) / 100;

      professionals.push({
        name: pro ? `${pro.firstName} ${pro.lastName}` : "Unknown",
        position: hire?.position?.title || "Position",
        daily,
        totalHrs,
      });
    }

    // Send email (hours only — no rates)
    const sent = await sendWeeklyTimesheetEmail(bizUser.email, {
      businessName: bizUser.businessProfile?.businessName || "Your Company",
      weekLabel,
      professionals,
    });

    if (sent) emailsSent++;
  }

  return NextResponse.json({
    success: true,
    assembled: timesheets.length,
    emailsSent,
    weekLabel,
  });
}
