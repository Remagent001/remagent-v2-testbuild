import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

function safeParse(val) {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  try { return JSON.parse(val); } catch { return []; }
}

// PUT — save a single wizard step
export async function PUT(request, { params }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { step, data } = await request.json();

  // Verify ownership
  const position = await prisma.position.findUnique({
    where: { id, userId: session.user.id },
  });
  if (!position) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Track completed steps
  const completedSteps = safeParse(position.completedSteps);
  if (!completedSteps.includes(step)) completedSteps.push(step);
  const nextStep = Math.max(position.currentStep || 1, step + 1);

  switch (step) {
    // Step 1: Position Detail
    case 1: {
      await prisma.position.update({
        where: { id },
        data: {
          title: data.title || null,
          description: data.description || null,
          numberOfHires: data.numberOfHires ? parseInt(data.numberOfHires) : 1,
          completedSteps: JSON.stringify(completedSteps),
          currentStep: nextStep,
        },
      });
      break;
    }

    // Step 2: Context (Channels, Skills, Applications) — triple-tap
    case 2: {
      // Replace channels
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

      // Replace skills
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

      // Replace applications
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

      // Handle isDefault from Context step
      if (data.isDefault) {
        await prisma.position.updateMany({
          where: { userId: session.user.id, isDefault: true, id: { not: id } },
          data: { isDefault: false },
        });
      }

      await prisma.position.update({
        where: { id },
        data: {
          completedSteps: JSON.stringify(completedSteps),
          currentStep: nextStep,
          isDefault: data.isDefault ? true : position.isDefault,
        },
      });
      break;
    }

    // Step 3: Environment
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
          isDefault: data.isDefault ? true : position.isDefault,
        },
      });
      break;
    }

    // Step 4: Availability
    case 4: {
      // Replace availability
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
        },
      });
      break;
    }

    // Step 5: Hourly Rate
    case 5: {
      await prisma.position.update({
        where: { id },
        data: {
          regularRate: data.regularRate ? parseFloat(data.regularRate) : null,
          completedSteps: JSON.stringify(completedSteps),
          currentStep: nextStep,
        },
      });
      break;
    }

    // Step 6: Dates & Duration
    case 6: {
      await prisma.position.update({
        where: { id },
        data: {
          contractType: data.contractType || null,
          startOption: data.startOption || null,
          expectedStartDate: data.expectedStartDate ? new Date(data.expectedStartDate) : null,
          expectedEndDate: data.expectedEndDate ? new Date(data.expectedEndDate) : null,
          isDefault: data.isDefault ? true : position.isDefault,
          completedSteps: JSON.stringify(completedSteps),
          currentStep: nextStep,
        },
      });
      break;
    }

    // Step 7: Attachments (documents are uploaded separately, just mark complete)
    case 7: {
      await prisma.position.update({
        where: { id },
        data: {
          completedSteps: JSON.stringify(completedSteps),
          currentStep: nextStep,
        },
      });
      break;
    }

    // Step 8: Screening Questions
    case 8: {
      await prisma.position.update({
        where: { id },
        data: {
          screeningQuestions: data.screeningQuestions || [],
          completedSteps: JSON.stringify(completedSteps),
          currentStep: nextStep,
        },
      });
      break;
    }

    // Step 9: Complete Posting
    case 9: {
      // If they chose to submit, set status to pending_approval
      const newStatus = data.status === "pending_approval" ? "pending_approval" : position.status;

      // If isDefault, unmark any other default positions for this user
      if (data.isDefault) {
        await prisma.position.updateMany({
          where: { userId: session.user.id, isDefault: true, id: { not: id } },
          data: { isDefault: false },
        });
      }

      await prisma.position.update({
        where: { id },
        data: {
          visibility: data.visibility || position.visibility,
          isDefault: data.isDefault || false,
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
