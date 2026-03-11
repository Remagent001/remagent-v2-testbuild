import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET — list hires for this business user
export async function GET(request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") || "";

  const where = { businessId: session.user.id };
  if (status) where.status = status;

  const hires = await prisma.hire.findMany({
    where,
    include: {
      position: {
        select: { id: true, title: true },
      },
      professional: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          lastLogin: true,
          professionalProfile: {
            select: { title: true, photoUrl: true },
          },
          location: {
            select: { city: true, state: true },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ hires });
}

// PUT — update hire status or add rating
export async function PUT(request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { hireId, status, rating, ratingComment } = await request.json();

  if (!hireId) {
    return NextResponse.json({ error: "Missing hireId" }, { status: 400 });
  }

  const hire = await prisma.hire.findUnique({ where: { id: hireId } });
  if (!hire || hire.businessId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updateData = {};
  if (status) {
    const validStatuses = ["active", "completed", "terminated"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    updateData.status = status;
  }
  if (rating !== undefined) {
    updateData.rating = Math.min(5, Math.max(1, parseInt(rating)));
    updateData.ratingComment = ratingComment || null;
  }

  await prisma.hire.update({
    where: { id: hireId },
    data: updateData,
  });

  return NextResponse.json({ success: true });
}
