import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { assembleAllTimesheetsForWeek, getPreviousWeekStart } from "@/lib/timesheet";

// POST — trigger timesheet assembly (admin or cron)
export async function POST(request) {
  // Allow either admin session OR cron secret
  const cronSecret = request.headers.get("x-cron-secret");
  const isValidCron = cronSecret && cronSecret === process.env.CRON_SECRET;

  if (!isValidCron) {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  let weekStart;
  try {
    const body = await request.json().catch(() => ({}));
    weekStart = body.weekStart ? new Date(body.weekStart) : getPreviousWeekStart();
  } catch {
    weekStart = getPreviousWeekStart();
  }

  const timesheets = await assembleAllTimesheetsForWeek(prisma, weekStart);

  return NextResponse.json({
    success: true,
    assembled: timesheets.length,
    weekStart: weekStart.toISOString().slice(0, 10),
    timesheets: timesheets.map((ts) => ({
      id: ts.id,
      hireId: ts.hireId,
      status: ts.status,
      totalAmount: ts.totalAmount,
    })),
  });
}
