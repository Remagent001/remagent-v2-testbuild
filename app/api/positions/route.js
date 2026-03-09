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

  const position = await prisma.position.create({
    data: {
      userId: session.user.id,
      title: data.title || "Untitled Position",
      description: data.description || "",
      numberOfHires: data.numberOfHires || 1,
      regularRate: data.regularRate ? parseFloat(data.regularRate) : null,
      afterHoursRate: data.afterHoursRate ? parseFloat(data.afterHoursRate) : null,
      holidayRate: data.holidayRate ? parseFloat(data.holidayRate) : null,
      contractType: data.contractType || null,
      startOption: data.startOption || null,
      expectedStartDate: data.expectedStartDate ? new Date(data.expectedStartDate) : null,
      expectedEndDate: data.expectedEndDate ? new Date(data.expectedEndDate) : null,
      visibility: data.visibility || "public",
      status: data.status || "draft",
    },
  });

  // Save skills
  if (data.skills?.length) {
    await prisma.positionSkill.createMany({
      data: data.skills.map((s) => ({
        positionId: position.id,
        skillId: s,
      })),
    });
  }

  // Save channels
  if (data.channels?.length) {
    await prisma.positionChannel.createMany({
      data: data.channels.map((ch) => ({
        positionId: position.id,
        channelId: ch.channelId,
        experience: ch.experience || "1-3 years",
      })),
    });
  }

  return NextResponse.json({ success: true, position });
}
