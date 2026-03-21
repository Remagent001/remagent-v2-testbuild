import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

// POST — professional applies to a job posting
export async function POST(request, { params }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const { coverMessage, screeningAnswers } = body;

  // Verify the position exists and is published + public
  const position = await prisma.position.findUnique({
    where: { id },
    include: {
      skills: { where: { requirement: "required" }, select: { skillId: true } },
    },
  });

  if (!position || position.status !== "published" || position.visibility !== "public") {
    return NextResponse.json({ error: "Position not found or not available" }, { status: 404 });
  }

  // Verify professional's profile is complete
  const profile = await prisma.professionalProfile.findUnique({
    where: { userId: session.user.id },
    select: { profileComplete: true },
  });

  if (!profile?.profileComplete) {
    return NextResponse.json({ error: "Please complete your profile before applying" }, { status: 400 });
  }

  // Verify professional has all required skills
  if (position.skills.length > 0) {
    const proSkills = await prisma.userSkill.findMany({
      where: { userId: session.user.id },
      select: { skillId: true },
    });
    const proSkillIds = proSkills.map((s) => s.skillId);
    const hasAll = position.skills.every((rs) => proSkillIds.includes(rs.skillId));
    if (!hasAll) {
      return NextResponse.json({ error: "You do not have all required skills for this position" }, { status: 400 });
    }
  }

  // Check if already applied
  const existing = await prisma.jobApplication.findUnique({
    where: { positionId_userId: { positionId: id, userId: session.user.id } },
  });

  if (existing) {
    return NextResponse.json({ error: "You have already applied to this position" }, { status: 409 });
  }

  // Create application
  const application = await prisma.jobApplication.create({
    data: {
      positionId: id,
      userId: session.user.id,
      coverMessage: coverMessage?.trim() || null,
      screeningAnswers: screeningAnswers || null,
      status: "new",
    },
  });

  return NextResponse.json({ success: true, applicationId: application.id });
}
