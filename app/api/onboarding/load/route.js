import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET — load ALL onboarding data for the current user (all steps)
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  const [
    user,
    profile,
    userSkills,
    userChannels,
    education,
    employment,
    languages,
    availability,
    environment,
    location,
    hourlyRate,
    allSkills,
    allChannels,
  ] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { phone: true, timezone: true, image: true, profileVideo: true } }),
    prisma.professionalProfile.findUnique({ where: { userId } }),
    prisma.userSkill.findMany({ where: { userId }, select: { skillId: true } }),
    prisma.userChannel.findMany({ where: { userId } }),
    prisma.education.findMany({ where: { userId }, orderBy: { fromDate: "desc" } }),
    prisma.employment.findMany({ where: { userId }, orderBy: { fromYear: "desc" } }),
    prisma.userLanguage.findMany({ where: { userId } }),
    prisma.availability.findMany({ where: { userId } }),
    prisma.environment.findUnique({ where: { userId } }),
    prisma.location.findUnique({ where: { userId } }),
    prisma.hourlyRate.findUnique({ where: { userId } }),
    prisma.skill.findMany({ orderBy: { name: "asc" } }),
    prisma.channel.findMany({ orderBy: { name: "asc" } }),
  ]);

  return NextResponse.json({
    user,
    profile,
    userSkillIds: userSkills.map((s) => s.skillId),
    userChannels,
    education,
    employment,
    languages,
    availability,
    environment,
    location,
    hourlyRate,
    allSkills,
    allChannels,
  });
}
