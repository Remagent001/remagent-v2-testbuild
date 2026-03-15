import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

// POST — duplicate a position as a new draft
export async function POST(request, { params }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = params;

  const source = await prisma.position.findUnique({
    where: { id, userId: session.user.id },
    include: {
      skills: true,
      channels: true,
      positionApps: true,
      environment: true,
      availability: true,
    },
  });

  if (!source) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Create the copy as a draft
  const position = await prisma.position.create({
    data: {
      userId: session.user.id,
      title: `${source.title || "Untitled"} (Copy)`,
      description: source.description,
      numberOfHires: source.numberOfHires,
      regularRate: source.regularRate,
      contractType: source.contractType,
      startOption: source.startOption,
      timezone: source.timezone,
      screeningQuestions: source.screeningQuestions,
      status: "draft",
      visibility: source.visibility,
    },
  });

  // Copy related records
  if (source.channels.length) {
    await prisma.positionChannel.createMany({
      data: source.channels.map((ch) => ({
        positionId: position.id,
        channelId: ch.channelId,
        experience: ch.experience,
        requirement: ch.requirement,
      })),
    });
  }
  if (source.skills.length) {
    await prisma.positionSkill.createMany({
      data: source.skills.map((s) => ({
        positionId: position.id,
        skillId: s.skillId,
        requirement: s.requirement,
      })),
    });
  }
  if (source.positionApps.length) {
    await prisma.positionApplication.createMany({
      data: source.positionApps.map((a) => ({
        positionId: position.id,
        applicationId: a.applicationId,
        requirement: a.requirement,
      })),
    });
  }
  if (source.environment) {
    await prisma.positionEnvironment.create({
      data: {
        positionId: position.id,
        workLocation: source.environment.workLocation,
        equipmentPolicy: source.environment.equipmentPolicy,
        requirements: source.environment.requirements,
        officeAddress: source.environment.officeAddress,
      },
    });
  }
  if (source.availability.length) {
    await prisma.positionAvailability.createMany({
      data: source.availability.map((a) => ({
        positionId: position.id,
        day: a.day,
        startTime: a.startTime,
        endTime: a.endTime,
      })),
    });
  }

  return NextResponse.json({ success: true, position });
}
