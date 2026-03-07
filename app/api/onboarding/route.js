import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET — load all onboarding data for the current user
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  const [profile, skills, channels, allSkills, allChannels] = await Promise.all([
    prisma.professionalProfile.findUnique({ where: { userId } }),
    prisma.userSkill.findMany({ where: { userId }, select: { skillId: true } }),
    prisma.userChannel.findMany({ where: { userId } }),
    prisma.skill.findMany({ orderBy: { name: "asc" } }),
    prisma.channel.findMany({ orderBy: { name: "asc" } }),
  ]);

  return NextResponse.json({
    profile,
    userSkillIds: skills.map((s) => s.skillId),
    userChannels: channels,
    allSkills,
    allChannels,
  });
}

// PUT — save a step's data (13 steps total)
// 1=Getting Started, 2=Experience, 3=Channels, 4=Education, 5=Employment,
// 6=Languages, 7=Availability, 8=Environment, 9=Hourly Rate,
// 10=Photo+Video, 11=Location, 12=Contact, 13=Agreement
export async function PUT(request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const body = await request.json();
  const { step, data } = body;

  // Ensure profile exists
  let profile = await prisma.professionalProfile.findUnique({ where: { userId } });
  if (!profile) {
    profile = await prisma.professionalProfile.create({
      data: { userId, onboardingStep: 1 },
    });
  }

  const advanceTo = (nextStep) => Math.max(profile.onboardingStep, nextStep);

  switch (step) {
    case 1: {
      // Getting Started
      await prisma.professionalProfile.update({
        where: { userId },
        data: {
          title: data.title || null,
          summary: data.summary || null,
          website: data.website || null,
          linkedinUrl: data.linkedinUrl || null,
          onboardingStep: advanceTo(2),
        },
      });
      break;
    }

    case 2: {
      // Experience + Skills
      await prisma.professionalProfile.update({
        where: { userId },
        data: {
          overallExperience: data.overallExperience || null,
          onboardingStep: advanceTo(3),
        },
      });

      await prisma.userSkill.deleteMany({ where: { userId } });
      if (data.skillIds?.length) {
        await prisma.userSkill.createMany({
          data: data.skillIds.map((skillId) => ({ userId, skillId })),
        });
      }
      break;
    }

    case 3: {
      // Channels
      await prisma.userChannel.deleteMany({ where: { userId } });
      if (data.channels?.length) {
        await prisma.userChannel.createMany({
          data: data.channels.map((ch) => ({
            userId,
            channelId: ch.channelId,
            experience: ch.experience || "none",
          })),
        });
      }
      await prisma.professionalProfile.update({
        where: { userId },
        data: { onboardingStep: advanceTo(4) },
      });
      break;
    }

    case 4: {
      // Education
      await prisma.education.deleteMany({ where: { userId } });
      if (data.entries?.length) {
        await prisma.education.createMany({
          data: data.entries.map((e) => ({
            userId,
            institution: e.institution,
            degree: e.degree,
            areaOfStudy: e.areaOfStudy || null,
            fromDate: e.fromDate ? new Date(e.fromDate) : null,
            toDate: e.toDate ? new Date(e.toDate) : null,
            gpa: e.gpa || null,
            description: e.description || null,
          })),
        });
      }
      await prisma.professionalProfile.update({
        where: { userId },
        data: { onboardingStep: advanceTo(5) },
      });
      break;
    }

    case 5: {
      // Employment
      await prisma.employment.deleteMany({ where: { userId } });
      if (data.entries?.length) {
        await prisma.employment.createMany({
          data: data.entries.map((e) => ({
            userId,
            company: e.company,
            city: e.city || null,
            state: e.state || null,
            title: e.title || null,
            fromMonth: e.fromMonth || null,
            fromYear: e.fromYear || null,
            throughMonth: e.throughMonth || null,
            throughYear: e.throughYear || null,
            currentlyWorking: e.currentlyWorking || false,
            remote: e.remote || false,
            description: e.description || null,
          })),
        });
      }
      await prisma.professionalProfile.update({
        where: { userId },
        data: { onboardingStep: advanceTo(6) },
      });
      break;
    }

    case 6: {
      // Languages
      await prisma.userLanguage.deleteMany({ where: { userId } });
      if (data.languages?.length) {
        await prisma.userLanguage.createMany({
          data: data.languages.map((l) => ({
            userId,
            language: l.language,
            proficiency: l.proficiency,
          })),
        });
      }
      await prisma.professionalProfile.update({
        where: { userId },
        data: { onboardingStep: advanceTo(7) },
      });
      break;
    }

    case 7: {
      // Availability
      await prisma.availability.deleteMany({ where: { userId } });
      if (data.timezone) {
        await prisma.user.update({ where: { id: userId }, data: { timezone: data.timezone } });
      }
      if (data.schedule?.length) {
        await prisma.availability.createMany({
          data: data.schedule.map((s) => ({
            userId,
            day: s.day,
            startTime: s.startTime,
            endTime: s.endTime,
          })),
        });
      }
      await prisma.professionalProfile.update({
        where: { userId },
        data: { onboardingStep: advanceTo(8) },
      });
      break;
    }

    case 8: {
      // Environment
      await prisma.environment.upsert({
        where: { userId },
        update: {
          workFromHome: data.workFromHome || false,
          workFromOffice: data.workFromOffice || false,
          computers: data.computers || null,
          internetTypes: data.internetTypes || null,
          homeOfficeDesc: data.homeOfficeDesc || null,
        },
        create: {
          userId,
          workFromHome: data.workFromHome || false,
          workFromOffice: data.workFromOffice || false,
          computers: data.computers || null,
          internetTypes: data.internetTypes || null,
          homeOfficeDesc: data.homeOfficeDesc || null,
        },
      });
      await prisma.professionalProfile.update({
        where: { userId },
        data: { onboardingStep: advanceTo(9) },
      });
      break;
    }

    case 9: {
      // Hourly Rate
      await prisma.hourlyRate.upsert({
        where: { userId },
        update: {
          regularRate: parseFloat(data.regularRate) || 0,
          afterHoursRate: data.afterHoursRate ? parseFloat(data.afterHoursRate) : null,
          holidayRate: data.holidayRate ? parseFloat(data.holidayRate) : null,
        },
        create: {
          userId,
          regularRate: parseFloat(data.regularRate) || 0,
          afterHoursRate: data.afterHoursRate ? parseFloat(data.afterHoursRate) : null,
          holidayRate: data.holidayRate ? parseFloat(data.holidayRate) : null,
        },
      });
      await prisma.professionalProfile.update({
        where: { userId },
        data: { onboardingStep: advanceTo(10) },
      });
      break;
    }

    case 10: {
      // Photo + Video (combined) — file uploads handled separately
      await prisma.professionalProfile.update({
        where: { userId },
        data: { onboardingStep: advanceTo(11) },
      });
      break;
    }

    case 11: {
      // Location
      await prisma.location.upsert({
        where: { userId },
        update: {
          fullAddress: data.fullAddress || null,
          country: data.country || null,
          state: data.state || null,
          city: data.city || null,
          zip: data.zip || null,
          isPrimary: true,
          workAddress: data.workAddress || null,
          workCountry: data.workCountry || null,
          workState: data.workState || null,
          workCity: data.workCity || null,
          workZip: data.workZip || null,
        },
        create: {
          userId,
          fullAddress: data.fullAddress || null,
          country: data.country || null,
          state: data.state || null,
          city: data.city || null,
          zip: data.zip || null,
          isPrimary: true,
          workAddress: data.workAddress || null,
          workCountry: data.workCountry || null,
          workState: data.workState || null,
          workCity: data.workCity || null,
          workZip: data.workZip || null,
        },
      });
      await prisma.professionalProfile.update({
        where: { userId },
        data: { onboardingStep: advanceTo(12) },
      });
      break;
    }

    case 12: {
      // Contact — phone + whatsapp
      const updateData = {};
      if (data.phone) updateData.phone = data.phone;
      if (Object.keys(updateData).length) {
        await prisma.user.update({ where: { id: userId }, data: updateData });
      }
      await prisma.professionalProfile.update({
        where: { userId },
        data: { onboardingStep: advanceTo(13) },
      });
      break;
    }

    case 13: {
      // Agreement — mark as complete
      await prisma.professionalProfile.update({
        where: { userId },
        data: {
          agreementSigned: true,
          agreementSignedAt: new Date(),
          profileComplete: true,
          onboardingStep: 14,
        },
      });
      break;
    }

    default:
      return NextResponse.json({ error: "Invalid step" }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
