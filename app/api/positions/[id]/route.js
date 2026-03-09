import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET — load single position
export async function GET(request, { params }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const [position, allSkills, allChannels, allApplications] = await Promise.all([
    prisma.position.findUnique({
      where: { id, userId: session.user.id },
      include: {
        skills: true,
        channels: true,
        positionApps: true,
        environment: true,
        availability: true,
        documents: true,
      },
    }),
    prisma.skill.findMany({ orderBy: { name: "asc" } }),
    prisma.channel.findMany({ orderBy: { name: "asc" } }),
    prisma.application.findMany({ orderBy: { name: "asc" } }),
  ]);

  if (!position) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ position, allSkills, allChannels, allApplications });
}

// PUT — update position
export async function PUT(request, { params }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const data = await request.json();

  // Verify ownership
  const existing = await prisma.position.findUnique({
    where: { id, userId: session.user.id },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.position.update({
    where: { id },
    data: {
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
      status: data.status || existing.status,
    },
  });

  // Replace skills
  await prisma.positionSkill.deleteMany({ where: { positionId: id } });
  if (data.skills?.length) {
    await prisma.positionSkill.createMany({
      data: data.skills.map((s) => ({
        positionId: id,
        skillId: s,
      })),
    });
  }

  // Replace channels
  await prisma.positionChannel.deleteMany({ where: { positionId: id } });
  if (data.channels?.length) {
    await prisma.positionChannel.createMany({
      data: data.channels.map((ch) => ({
        positionId: id,
        channelId: ch.channelId,
        experience: ch.experience || "1-3 years",
      })),
    });
  }

  return NextResponse.json({ success: true });
}

// DELETE — remove position
export async function DELETE(request, { params }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const existing = await prisma.position.findUnique({
    where: { id, userId: session.user.id },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.position.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
