import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

function safeParse(val) {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  try { return JSON.parse(val); } catch { return []; }
}

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
      positionApps: { include: { application: true } },
      _count: { select: { applications: true, offers: true, hires: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ positions });
}

// POST — create new position with per-step defaults
export async function POST(request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Find all positions that have any defaultSteps set
  const defaultPositions = await prisma.position.findMany({
    where: {
      userId: session.user.id,
      defaultSteps: { not: null },
    },
    include: {
      channels: true,
      skills: true,
      positionApps: true,
      environment: true,
      availability: true,
    },
    orderBy: { updatedAt: "desc" },
  });

  // Build a map: step number → the position that is default for that step
  const stepDefaults = {};
  for (const pos of defaultPositions) {
    const steps = safeParse(pos.defaultSteps);
    for (const stepNum of steps) {
      if (!stepDefaults[stepNum]) {
        stepDefaults[stepNum] = pos; // first match wins (most recently updated)
      }
    }
  }

  // Build the create data by merging defaults from each step
  const createData = { userId: session.user.id, status: "draft" };

  // Step 1: Position Detail (title, description, numberOfHires)
  if (stepDefaults[1]) {
    const d = stepDefaults[1];
    createData.description = d.description;
    createData.numberOfHires = d.numberOfHires;
    // Don't copy title — each posting should have a unique title
  }

  // Step 5: Hourly Rate
  if (stepDefaults[5]) {
    createData.regularRate = stepDefaults[5].regularRate;
  }

  // Step 6: Dates & Duration
  if (stepDefaults[6]) {
    const d = stepDefaults[6];
    createData.contractType = d.contractType;
    createData.startOption = d.startOption;
  }

  // Step 4: Availability (timezone on position)
  if (stepDefaults[4]) {
    createData.timezone = stepDefaults[4].timezone;
  }

  // Step 8: Screening Questions
  if (stepDefaults[8]) {
    createData.screeningQuestions = stepDefaults[8].screeningQuestions;
  }

  const position = await prisma.position.create({ data: createData });

  // Step 2: Context (channels, skills, apps)
  if (stepDefaults[2]) {
    const d = stepDefaults[2];
    if (d.channels?.length) {
      await prisma.positionChannel.createMany({
        data: d.channels.map((ch) => ({
          positionId: position.id,
          channelId: ch.channelId,
          experience: ch.experience,
          requirement: ch.requirement,
        })),
      });
    }
    if (d.skills?.length) {
      await prisma.positionSkill.createMany({
        data: d.skills.map((s) => ({
          positionId: position.id,
          skillId: s.skillId,
          requirement: s.requirement,
        })),
      });
    }
    if (d.positionApps?.length) {
      await prisma.positionApplication.createMany({
        data: d.positionApps.map((a) => ({
          positionId: position.id,
          applicationId: a.applicationId,
          requirement: a.requirement,
        })),
      });
    }
  }

  // Step 3: Environment
  if (stepDefaults[3] && stepDefaults[3].environment) {
    const env = stepDefaults[3].environment;
    await prisma.positionEnvironment.create({
      data: {
        positionId: position.id,
        workLocation: env.workLocation,
        equipmentPolicy: env.equipmentPolicy,
        requirements: env.requirements,
      },
    });
  }

  // Step 4: Availability (schedule rows)
  if (stepDefaults[4] && stepDefaults[4].availability?.length) {
    await prisma.positionAvailability.createMany({
      data: stepDefaults[4].availability.map((a) => ({
        positionId: position.id,
        day: a.day,
        startTime: a.startTime,
        endTime: a.endTime,
      })),
    });
  }

  return NextResponse.json({ success: true, position });
}
