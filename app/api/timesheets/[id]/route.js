import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET — single timesheet with all entries and related data
export async function GET(request, { params }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const timesheet = await prisma.weeklyTimesheet.findUnique({
    where: { id },
    include: {
      entries: {
        where: { type: "work" },
        orderBy: [{ date: "asc" }, { startTime: "asc" }],
      },
    },
  });

  if (!timesheet) {
    return NextResponse.json({ error: "Timesheet not found" }, { status: 404 });
  }

  // Authorization: must be the professional, business, or admin
  if (
    session.user.role !== "ADMIN" &&
    timesheet.professionalId !== session.user.id &&
    timesheet.businessId !== session.user.id
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Fetch related data
  const [hire, professional, business] = await Promise.all([
    prisma.hire.findUnique({
      where: { id: timesheet.hireId },
      include: { position: { select: { title: true, description: true } } },
    }),
    prisma.user.findUnique({
      where: { id: timesheet.professionalId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        professionalProfile: { select: { photoUrl: true, title: true } },
      },
    }),
    prisma.user.findUnique({
      where: { id: timesheet.businessId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        businessProfile: { select: { businessName: true, adminMarkup: true } },
      },
    }),
  ]);

  return NextResponse.json({
    timesheet: {
      ...timesheet,
      hire,
      professional,
      business,
    },
  });
}
