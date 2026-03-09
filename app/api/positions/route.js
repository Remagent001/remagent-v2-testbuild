import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET — list business's positions
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const positions = await prisma.position.findMany({
    where: { userId: session.user.id },
    include: {
      skills: { include: { skill: true } },
      channels: { include: { channel: true } },
      _count: { select: { applications: true, offers: true, hires: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ positions });
}

// POST — create new position
export async function POST(request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = await request.json();

  // Check if there's a default position to pre-fill from
  const defaultPos = await prisma.position.findFirst({
    where: { userId: session.user.id, isDefault: true },
    include: {
      channels: true,
      skills: true,
      positionApps: true,
      environment: true,
      availability: true,
    },
  });

  const position = await prisma.position.create({
    data: {
      userId: session.user.id,
      status: "draft",
      // Pre-fill from default if available
      ...(defaultPos ? {
        contractType: defaultPos.contractType,
        startOption: defaultPos.startOption,
        regularRate: defaultPos.regularRate,
        timezone: defaultPos.timezone,
        visibility: defaultPos.visibility,
      } : {}),
    },
  });

  // Copy default position's related data if exists
  if (defaultPos) {
    if (defaultPos.environment) {
      await prisma.positionEnvironment.create({
        data: {
          positionId: position.id,
          workLocation: defaultPos.environment.workLocation,
          equipmentPolicy: defaultPos.environment.equipmentPolicy,
          requirements: defaultPos.environment.requirements,
        },
      });
    }
    if (defaultPos.availability?.length) {
      await prisma.positionAvailability.createMany({
        data: defaultPos.availability.map((a) => ({
          positionId: position.id,
          day: a.day,
          startTime: a.startTime,
          endTime: a.endTime,
        })),
      });
    }
  }

  return NextResponse.json({ success: true, position });
}
