import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { determineRateType, dateToTimeStr } from "@/lib/timesheet";

// GET — current timer state, all entries for selected hire, active hires
export async function GET(request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "PROFESSIONAL") {
    return NextResponse.json({ error: "Professionals only" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const hireId = searchParams.get("hireId");

  const [activeTimer, activeHires] = await Promise.all([
    prisma.activeTimer.findUnique({
      where: { professionalId: session.user.id },
      include: {
        hire: {
          include: {
            position: { select: { title: true } },
            business: {
              select: {
                id: true,
                businessProfile: { select: { businessName: true, allowTimeEditing: true } },
              },
            },
          },
        },
      },
    }),
    prisma.hire.findMany({
      where: { professionalId: session.user.id, status: "active" },
      include: {
        position: { select: { id: true, title: true } },
        business: {
          select: {
            id: true,
            businessProfile: { select: { businessName: true, allowTimeEditing: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  // Fetch entries for selected hire
  let entries = [];
  if (hireId) {
    entries = await prisma.timeEntry.findMany({
      where: { hireId, professionalId: session.user.id },
      include: {
        hire: {
          include: {
            position: { select: { title: true } },
            business: {
              select: { businessProfile: { select: { businessName: true } } },
            },
          },
        },
      },
      orderBy: [{ date: "desc" }, { startTime: "desc" }],
    });
  }

  // Check if there's an open break entry
  let activeBreakEntry = null;
  if (activeTimer && activeTimer.status === "break") {
    activeBreakEntry = await prisma.timeEntry.findFirst({
      where: {
        hireId: activeTimer.hireId,
        professionalId: session.user.id,
        type: "break",
        endTime: null,
      },
    });
  }

  return NextResponse.json({ activeTimer, activeBreakEntry, entries, activeHires });
}

// POST — start today's job timer
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

  const hire = await prisma.hire.findUnique({ where: { id: hireId } });
  if (!hire || hire.professionalId !== session.user.id) {
    return NextResponse.json({ error: "Hire not found" }, { status: 404 });
  }
  if (hire.status !== "active") {
    return NextResponse.json({ error: "Hire is not active" }, { status: 400 });
  }

  const existing = await prisma.activeTimer.findUnique({
    where: { professionalId: session.user.id },
  });
  if (existing) {
    return NextResponse.json({ error: "A timer is already running. Stop it first." }, { status: 409 });
  }

  const now = new Date();
  const entryDate = new Date(now);
  entryDate.setHours(0, 0, 0, 0);
  const startTimeStr = dateToTimeStr(now);
  const rateType = determineRateType(hire, entryDate, startTimeStr, startTimeStr);

  // Create work entry + active timer in a transaction
  const result = await prisma.$transaction(async (tx) => {
    const workEntry = await tx.timeEntry.create({
      data: {
        hireId,
        professionalId: session.user.id,
        date: entryDate,
        startTime: now,
        endTime: null,
        type: "work",
        rateType,
        status: "pending",
      },
    });

    const timer = await tx.activeTimer.create({
      data: {
        professionalId: session.user.id,
        hireId,
        workEntryId: workEntry.id,
        startTime: now,
        status: "running",
      },
      include: {
        hire: {
          include: {
            position: { select: { title: true } },
            business: {
              select: {
                id: true,
                businessProfile: { select: { businessName: true, allowTimeEditing: true } },
              },
            },
          },
        },
      },
    });

    return { timer, workEntry };
  });

  return NextResponse.json(result, { status: 201 });
}

// PUT — add break, end break, or end day
export async function PUT(request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "PROFESSIONAL") {
    return NextResponse.json({ error: "Professionals only" }, { status: 403 });
  }

  const { action, description, remarks } = await request.json();
  if (!["addBreak", "endBreak", "endDay"].includes(action)) {
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

  // ── ADD BREAK ──
  if (action === "addBreak") {
    if (timer.status !== "running") {
      return NextResponse.json({ error: "Timer is not running" }, { status: 400 });
    }

    const entryDate = new Date(now);
    entryDate.setHours(0, 0, 0, 0);

    const result = await prisma.$transaction(async (tx) => {
      const breakEntry = await tx.timeEntry.create({
        data: {
          hireId: timer.hireId,
          professionalId: session.user.id,
          date: entryDate,
          startTime: now,
          endTime: null,
          type: "break",
          remarks: "Break",
          rateType: "regular",
          status: "pending",
        },
      });

      const updated = await tx.activeTimer.update({
        where: { id: timer.id },
        data: { status: "break" },
      });

      return { timer: updated, breakEntry };
    });

    return NextResponse.json(result);
  }

  // ── END BREAK ──
  if (action === "endBreak") {
    if (timer.status !== "break") {
      return NextResponse.json({ error: "No active break" }, { status: 400 });
    }

    // Find the open break entry
    const openBreak = await prisma.timeEntry.findFirst({
      where: {
        hireId: timer.hireId,
        professionalId: session.user.id,
        type: "break",
        endTime: null,
      },
      orderBy: { startTime: "desc" },
    });

    if (!openBreak) {
      return NextResponse.json({ error: "No open break entry found" }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const closedBreak = await tx.timeEntry.update({
        where: { id: openBreak.id },
        data: { endTime: now },
      });

      const updated = await tx.activeTimer.update({
        where: { id: timer.id },
        data: { status: "running" },
      });

      return { timer: updated, breakEntry: closedBreak };
    });

    return NextResponse.json(result);
  }

  // ── END DAY ──
  if (action === "endDay") {
    if (!timer.workEntryId) {
      return NextResponse.json({ error: "No work entry associated with timer" }, { status: 400 });
    }

    const endTimeStr = dateToTimeStr(now);
    const startTimeStr = dateToTimeStr(timer.startTime);
    const entryDate = new Date(timer.startTime);
    entryDate.setHours(0, 0, 0, 0);
    const rateType = determineRateType(timer.hire, entryDate, startTimeStr, endTimeStr);

    const result = await prisma.$transaction(async (tx) => {
      // Close any open break first
      const openBreak = await tx.timeEntry.findFirst({
        where: {
          hireId: timer.hireId,
          professionalId: session.user.id,
          type: "break",
          endTime: null,
        },
      });
      if (openBreak) {
        await tx.timeEntry.update({
          where: { id: openBreak.id },
          data: { endTime: now },
        });
      }

      // Close the work entry
      const workEntry = await tx.timeEntry.update({
        where: { id: timer.workEntryId },
        data: {
          endTime: now,
          description: description || null,
          remarks: remarks || null,
          rateType,
        },
      });

      // Delete the active timer
      await tx.activeTimer.delete({ where: { id: timer.id } });

      return { workEntry };
    });

    return NextResponse.json(result);
  }
}
