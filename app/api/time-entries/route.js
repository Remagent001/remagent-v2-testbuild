import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { determineRateType } from "@/lib/timesheet";

// GET — list time entries with filters
export async function GET(request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const hireId = searchParams.get("hireId");
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const status = searchParams.get("status");

  const where = { professionalId: session.user.id, type: "work" };
  if (hireId) where.hireId = hireId;
  if (status) where.status = status;
  if (from || to) {
    where.date = {};
    if (from) where.date.gte = new Date(from);
    if (to) {
      const toDate = new Date(to);
      toDate.setDate(toDate.getDate() + 1);
      where.date.lt = toDate;
    }
  }

  const entries = await prisma.timeEntry.findMany({
    where,
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
    orderBy: [{ date: "desc" }, { startTime: "desc" }],
  });

  return NextResponse.json({ entries });
}

// POST — manual time entry
export async function POST(request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "PROFESSIONAL") {
    return NextResponse.json({ error: "Professionals only" }, { status: 403 });
  }

  const body = await request.json();
  const { hireId, date, startTime, endTime, breakMinutes, description } = body;

  if (!hireId || !date || !startTime || !endTime) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Verify hire
  const hire = await prisma.hire.findUnique({ where: { id: hireId } });
  if (!hire || hire.professionalId !== session.user.id) {
    return NextResponse.json({ error: "Hire not found" }, { status: 404 });
  }

  const entryDate = new Date(date);
  entryDate.setHours(0, 0, 0, 0);

  // Build full DateTime from date + time strings
  const [sh, sm] = startTime.split(":").map(Number);
  const [eh, em] = endTime.split(":").map(Number);
  const startDt = new Date(entryDate);
  startDt.setHours(sh, sm, 0, 0);
  const endDt = new Date(entryDate);
  endDt.setHours(eh, em, 0, 0);

  if (endDt <= startDt) {
    return NextResponse.json({ error: "End time must be after start time" }, { status: 400 });
  }

  // Check for overlapping entries on the same day/hire
  const overlap = await prisma.timeEntry.findFirst({
    where: {
      hireId,
      professionalId: session.user.id,
      date: entryDate,
      type: "work",
      OR: [
        { startTime: { lt: endDt }, endTime: { gt: startDt } },
      ],
    },
  });
  if (overlap) {
    return NextResponse.json({ error: "Time overlaps with an existing entry" }, { status: 409 });
  }

  const rateType = determineRateType(hire, entryDate, startTime, endTime);

  const entry = await prisma.timeEntry.create({
    data: {
      hireId,
      professionalId: session.user.id,
      date: entryDate,
      startTime: startDt,
      endTime: endDt,
      breakMinutes: breakMinutes || 0,
      type: "work",
      description: description || null,
      rateType,
      status: "pending",
    },
  });

  return NextResponse.json({ entry }, { status: 201 });
}

// PUT — edit a pending entry
export async function PUT(request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { entryId, description, startTime, endTime, breakMinutes } = body;

  if (!entryId) {
    return NextResponse.json({ error: "Missing entryId" }, { status: 400 });
  }

  const entry = await prisma.timeEntry.findUnique({
    where: { id: entryId },
    include: { hire: true },
  });
  if (!entry || entry.professionalId !== session.user.id) {
    return NextResponse.json({ error: "Entry not found" }, { status: 404 });
  }
  if (entry.status !== "pending" && entry.status !== "under_review") {
    return NextResponse.json({ error: "Can only edit pending or under-review entries" }, { status: 400 });
  }

  const updateData = {};
  if (description !== undefined) updateData.description = description;
  if (breakMinutes !== undefined) updateData.breakMinutes = breakMinutes;

  if (startTime && endTime) {
    const [sh, sm] = startTime.split(":").map(Number);
    const [eh, em] = endTime.split(":").map(Number);
    const startDt = new Date(entry.date);
    startDt.setHours(sh, sm, 0, 0);
    const endDt = new Date(entry.date);
    endDt.setHours(eh, em, 0, 0);

    if (endDt <= startDt) {
      return NextResponse.json({ error: "End time must be after start time" }, { status: 400 });
    }

    updateData.startTime = startDt;
    updateData.endTime = endDt;
    updateData.rateType = determineRateType(entry.hire, entry.date, startTime, endTime);
  }

  const updated = await prisma.timeEntry.update({
    where: { id: entryId },
    data: updateData,
  });

  return NextResponse.json({ entry: updated });
}

// DELETE — remove a pending entry
export async function DELETE(request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const entryId = searchParams.get("entryId");
  if (!entryId) {
    return NextResponse.json({ error: "Missing entryId" }, { status: 400 });
  }

  const entry = await prisma.timeEntry.findUnique({ where: { id: entryId } });
  if (!entry || entry.professionalId !== session.user.id) {
    return NextResponse.json({ error: "Entry not found" }, { status: 404 });
  }
  if (entry.status !== "pending") {
    return NextResponse.json({ error: "Can only delete pending entries" }, { status: 400 });
  }

  await prisma.timeEntry.delete({ where: { id: entryId } });

  return NextResponse.json({ success: true });
}
