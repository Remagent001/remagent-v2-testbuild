import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { calculateHours, determineRateType, dateToTimeStr } from "@/lib/timesheet";

// GET — current timer state, today's entries, active hires
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "PROFESSIONAL") {
    return NextResponse.json({ error: "Professionals only" }, { status: 403 });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [activeTimer, todayEntries, activeHires] = await Promise.all([
    prisma.activeTimer.findUnique({
      where: { professionalId: session.user.id },
      include: {
        hire: {
          include: {
            position: { select: { title: true } },
            business: {
              select: {
                id: true,
                businessProfile: { select: { businessName: true } },
              },
            },
          },
        },
      },
    }),
    prisma.timeEntry.findMany({
      where: {
        professionalId: session.user.id,
        date: { gte: today, lt: tomorrow },
        type: "work",
      },
      include: {
        hire: {
          include: {
            position: { select: { title: true } },
            business: {
              select: {
                businessProfile: { select: { businessName: true } },
              },
            },
          },
        },
      },
      orderBy: { startTime: "desc" },
    }),
    prisma.hire.findMany({
      where: {
        professionalId: session.user.id,
        status: "active",
      },
      include: {
        position: { select: { id: true, title: true } },
        business: {
          select: {
            id: true,
            businessProfile: { select: { businessName: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return NextResponse.json({ activeTimer, todayEntries, activeHires });
}

// POST — start a new timer
export async function POST(request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "PROFESSIONAL") {
    return NextResponse.json({ error: "Professionals only" }, { status: 403 });
  }

  const { hireId } = await request.json();
  if (!hireId) {
    return NextResponse.json({ error: "Missing hireId" }, { status: 400 });
  }

  // Verify hire belongs to this professional and is active
  const hire = await prisma.hire.findUnique({ where: { id: hireId } });
  if (!hire || hire.professionalId !== session.user.id) {
    return NextResponse.json({ error: "Hire not found" }, { status: 404 });
  }
  if (hire.status !== "active") {
    return NextResponse.json({ error: "Hire is not active" }, { status: 400 });
  }

  // Check for existing timer (unique constraint will also catch this)
  const existing = await prisma.activeTimer.findUnique({
    where: { professionalId: session.user.id },
  });
  if (existing) {
    return NextResponse.json(
      { error: "A timer is already running. Stop it before starting a new one." },
      { status: 409 }
    );
  }

  const timer = await prisma.activeTimer.create({
    data: {
      professionalId: session.user.id,
      hireId,
      startTime: new Date(),
      status: "running",
    },
    include: {
      hire: {
        include: {
          position: { select: { title: true } },
          business: {
            select: {
              id: true,
              businessProfile: { select: { businessName: true } },
            },
          },
        },
      },
    },
  });

  return NextResponse.json({ timer }, { status: 201 });
}

// PUT — pause, resume, or stop timer
export async function PUT(request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "PROFESSIONAL") {
    return NextResponse.json({ error: "Professionals only" }, { status: 403 });
  }

  const { action, description } = await request.json();
  if (!["pause", "resume", "stop"].includes(action)) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const timer = await prisma.activeTimer.findUnique({
    where: { professionalId: session.user.id },
    include: { hire: true },
  });
  if (!timer) {
    return NextResponse.json({ error: "No active timer" }, { status: 404 });
  }

  const now = new Date();

  // ── PAUSE ──
  if (action === "pause") {
    if (timer.status !== "running") {
      return NextResponse.json({ error: "Timer is not running" }, { status: 400 });
    }
    const updated = await prisma.activeTimer.update({
      where: { id: timer.id },
      data: { status: "paused", breakStart: now },
    });
    return NextResponse.json({ timer: updated });
  }

  // ── RESUME ──
  if (action === "resume") {
    if (timer.status !== "paused") {
      return NextResponse.json({ error: "Timer is not paused" }, { status: 400 });
    }
    const breakMs = timer.breakStart
      ? now.getTime() - timer.breakStart.getTime()
      : 0;
    const updated = await prisma.activeTimer.update({
      where: { id: timer.id },
      data: {
        status: "running",
        breakStart: null,
        totalBreakMs: timer.totalBreakMs + breakMs,
      },
    });
    return NextResponse.json({ timer: updated });
  }

  // ── STOP ──
  if (action === "stop") {
    // If currently paused, add remaining break time
    let totalBreakMs = timer.totalBreakMs;
    if (timer.status === "paused" && timer.breakStart) {
      totalBreakMs += now.getTime() - timer.breakStart.getTime();
    }

    const breakMinutes = Math.round(totalBreakMs / 60000);
    const entryDate = new Date(timer.startTime);
    entryDate.setHours(0, 0, 0, 0);

    // Determine rate type
    const startTimeStr = dateToTimeStr(timer.startTime);
    const endTimeStr = dateToTimeStr(now);
    const rateType = determineRateType(timer.hire, entryDate, startTimeStr, endTimeStr);

    // Check if timer spans midnight — if so, split into two entries
    const startDate = new Date(timer.startTime);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(now);
    endDate.setHours(0, 0, 0, 0);

    const entries = [];

    if (startDate.getTime() === endDate.getTime()) {
      // Same day — single entry
      entries.push({
        hireId: timer.hireId,
        professionalId: session.user.id,
        date: startDate,
        startTime: timer.startTime,
        endTime: now,
        breakMinutes,
        type: "work",
        description: description || null,
        rateType,
        status: "pending",
      });
    } else {
      // Spans midnight — split at midnight
      const midnight = new Date(endDate);
      const proportionFirst =
        (midnight.getTime() - timer.startTime.getTime()) /
        (now.getTime() - timer.startTime.getTime());
      const breakFirst = Math.round(breakMinutes * proportionFirst);
      const breakSecond = breakMinutes - breakFirst;

      const rateFirst = determineRateType(timer.hire, startDate, startTimeStr, "23:59");
      const rateSecond = determineRateType(timer.hire, endDate, "00:00", endTimeStr);

      entries.push(
        {
          hireId: timer.hireId,
          professionalId: session.user.id,
          date: startDate,
          startTime: timer.startTime,
          endTime: midnight,
          breakMinutes: breakFirst,
          type: "work",
          description: description || null,
          rateType: rateFirst,
          status: "pending",
        },
        {
          hireId: timer.hireId,
          professionalId: session.user.id,
          date: endDate,
          startTime: midnight,
          endTime: now,
          breakMinutes: breakSecond,
          type: "work",
          description: description || null,
          rateType: rateSecond,
          status: "pending",
        }
      );
    }

    // Create entries and delete timer in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const created = [];
      for (const entry of entries) {
        created.push(await tx.timeEntry.create({ data: entry }));
      }
      await tx.activeTimer.delete({ where: { id: timer.id } });
      return created;
    });

    return NextResponse.json({ entries: result });
  }
}
