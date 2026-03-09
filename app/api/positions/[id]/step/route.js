import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

function safeParse(val) {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  try { return JSON.parse(val); } catch { return []; }
}

// Decide if a step has meaningful data filled in
function isStepComplete(step, data) {
  switch (step) {
    case 1: return !!(data.title && data.title.trim());
    case 2: return !!(data.channels?.length || data.skills?.length || data.applications?.length);
    case 3: return !!(data.workLocation?.length || data.equipmentPolicy);
    case 4: return !!(data.schedule?.length);
    case 5: return !!(data.regularRate && parseFloat(data.regularRate) > 0);
    case 6: return !!(data.contractType || data.startOption);
    case 7: return true; // Attachments are optional
    case 8: return true; // Screening questions have defaults
    case 9: return true;
    default: return false;
  }
}

// Update the defaultSteps array: add or remove this step number
async function handleDefaultStep(userId, positionId, step, isDefault, currentDefaultSteps) {
  const defaults = safeParse(currentDefaultSteps);

  if (isDefault) {
    // Add this step to this position's defaults
    if (!defaults.includes(step)) defaults.push(step);

    // Remove this step from any OTHER position's defaultSteps for this user
    const otherPositions = await prisma.position.findMany({
      where: { userId, id: { not: positionId } },
      select: { id: true, defaultSteps: true },
    });
    for (const other of otherPositions) {
      const otherDefaults = safeParse(other.defaultSteps);
      if (otherDefaults.includes(step)) {
        const updated = otherDefaults.filter((s) => s !== step);
        await prisma.position.update({
          where: { id: other.id },
          data: { defaultSteps: JSON.stringify(updated) },
        });
      }
    }
  }

  return JSON.stringify(defaults);
}

// PUT — save a single wizard step
export async function PUT(request, { params }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { step, data } = await request.json();

  const position = await prisma.position.findUnique({
    where: { id, userId: session.user.id },
  });
  if (!position) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Only mark complete if the step actually has data
  const completedSteps = safeParse(position.completedSteps);
  const complete = isStepComplete(step, data);
  if (complete && !completedSteps.includes(step)) {
    completedSteps.push(step);
  } else if (!complete) {
    const idx = completedSteps.indexOf(step);
    if (idx !== -1) completedSteps.splice(idx, 1);
  }
  const nextStep = Math.max(position.currentStep || 1, step + 1);

  // Handle per-step default
  let defaultStepsJson = position.defaultSteps;
  if (data.isDefault) {
    defaultStepsJson = await handleDefaultStep(session.user.id, id, step, true, position.defaultSteps);
  }

  switch (step) {
    case 1: {
      await prisma.position.update({
        where: { id },
        data: {
          title: data.title || null,
          description: data.description || null,
          numberOfHires: data.numberOfHires ? parseInt(data.numberOfHires) : 1,
          completedSteps: JSON.stringify(completedSteps),
          currentStep: nextStep,
          defaultSteps: defaultStepsJson,
        },
      });
      break;
    }

    case 2: {
      await prisma.positionChannel.deleteMany({ where: { positionId: id } });
      if (data.channels?.length) {
        await prisma.positionChannel.createMany({
          data: data.channels.map((ch) => ({
            positionId: id,
            channelId: ch.channelId,
            experience: ch.experience || "1-3 years",
            requirement: ch.requirement || "nice_to_have",
          })),
        });
      }

      await prisma.positionSkill.deleteMany({ where: { positionId: id } });
      if (data.skills?.length) {
        await prisma.positionSkill.createMany({
          data: data.skills.map((s) => ({
            positionId: id,
            skillId: s.skillId,
            requirement: s.requirement || "nice_to_have",
          })),
        });
      }

      await prisma.positionApplication.deleteMany({ where: { positionId: id } });
      if (data.applications?.length) {
        await prisma.positionApplication.createMany({
          data: data.applications.map((a) => ({
            positionId: id,
            applicationId: a.applicationId,
            requirement: a.requirement || "nice_to_have",
          })),
        });
      }

      await prisma.position.update({
        where: { id },
        data: {
          completedSteps: JSON.stringify(completedSteps),
          currentStep: nextStep,
          defaultSteps: defaultStepsJson,
        },
      });
      break;
    }

    case 3: {
      await prisma.positionEnvironment.upsert({
        where: { positionId: id },
        create: {
          positionId: id,
          workLocation: data.workLocation || [],
          equipmentPolicy: data.equipmentPolicy || null,
          requirements: data.requirements || null,
        },
        update: {
          workLocation: data.workLocation || [],
          equipmentPolicy: data.equipmentPolicy || null,
          requirements: data.requirements || null,
        },
      });

      await prisma.position.update({
        where: { id },
        data: {
          completedSteps: JSON.stringify(completedSteps),
          currentStep: nextStep,
          defaultSteps: defaultStepsJson,
        },
      });
      break;
    }

    case 4: {
      await prisma.positionAvailability.deleteMany({ where: { positionId: id } });
      if (data.schedule?.length) {
        await prisma.positionAvailability.createMany({
          data: data.schedule.map((s) => ({
            positionId: id,
            day: s.day,
            startTime: s.startTime,
            endTime: s.endTime,
          })),
        });
      }

      await prisma.position.update({
        where: { id },
        data: {
          timezone: data.timezone || null,
          completedSteps: JSON.stringify(completedSteps),
          currentStep: nextStep,
          defaultSteps: defaultStepsJson,
        },
      });
      break;
    }

    case 5: {
      await prisma.position.update({
        where: { id },
        data: {
          regularRate: data.regularRate ? parseFloat(data.regularRate) : null,
          completedSteps: JSON.stringify(completedSteps),
          currentStep: nextStep,
          defaultSteps: defaultStepsJson,
        },
      });
      break;
    }

    case 6: {
      await prisma.position.update({
        where: { id },
        data: {
          contractType: data.contractType || null,
          startOption: data.startOption || null,
          expectedStartDate: data.expectedStartDate ? new Date(data.expectedStartDate) : null,
          expectedEndDate: data.expectedEndDate ? new Date(data.expectedEndDate) : null,
          completedSteps: JSON.stringify(completedSteps),
          currentStep: nextStep,
          defaultSteps: defaultStepsJson,
        },
      });
      break;
    }

    case 7: {
      await prisma.position.update({
        where: { id },
        data: {
          completedSteps: JSON.stringify(completedSteps),
          currentStep: nextStep,
          defaultSteps: defaultStepsJson,
        },
      });
      break;
    }

    case 8: {
      await prisma.position.update({
        where: { id },
        data: {
          screeningQuestions: data.screeningQuestions || [],
          completedSteps: JSON.stringify(completedSteps),
          currentStep: nextStep,
          defaultSteps: defaultStepsJson,
        },
      });
      break;
    }

    case 9: {
      const newStatus = data.status === "pending_approval" ? "pending_approval" : position.status;
      await prisma.position.update({
        where: { id },
        data: {
          visibility: data.visibility || position.visibility,
          status: newStatus,
          completedSteps: JSON.stringify(completedSteps),
          currentStep: nextStep,
        },
      });
      break;
    }

    default:
      return NextResponse.json({ error: "Invalid step" }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
