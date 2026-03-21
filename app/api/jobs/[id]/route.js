import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET — job posting detail for professionals
export async function GET(request, { params }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const position = await prisma.position.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          businessProfile: {
            select: { businessName: true, logo: true, city: true, state: true, industry: true, website: true },
          },
        },
      },
      skills: {
        include: { skill: { select: { id: true, name: true } } },
      },
      channels: {
        include: { channel: { select: { id: true, name: true } } },
      },
      positionApps: {
        include: { application: { select: { id: true, name: true } } },
      },
      environment: true,
      availability: {
        select: { day: true, startTime: true, endTime: true },
      },
      applications: {
        where: { userId: session.user.id },
        select: { id: true, status: true, createdAt: true },
      },
    },
  });

  if (!position || position.status !== "published" || position.visibility !== "public") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const biz = position.user?.businessProfile;

  const job = {
    id: position.id,
    title: position.title,
    description: position.description,
    regularRate: position.regularRate,
    contractType: position.contractType,
    startOption: position.startOption,
    expectedStartDate: position.expectedStartDate,
    expectedEndDate: position.expectedEndDate,
    timezone: position.timezone,
    numberOfHires: position.numberOfHires,
    showCompanyName: position.showCompanyName,
    company: position.showCompanyName
      ? { name: biz?.businessName, logo: biz?.logo, city: biz?.city, state: biz?.state, industry: biz?.industry, website: biz?.website }
      : { name: null, logo: null, city: biz?.city, state: biz?.state, industry: biz?.industry, website: null },
    skills: position.skills.map((s) => ({ ...s.skill, requirement: s.requirement })),
    channels: position.channels.map((c) => ({ ...c.channel, requirement: c.requirement })),
    apps: position.positionApps.map((a) => ({ ...a.application, requirement: a.requirement })),
    environment: position.environment,
    availability: position.availability,
    screeningQuestions: position.screeningQuestions,
    createdAt: position.createdAt,
    alreadyApplied: position.applications.length > 0,
    applicationStatus: position.applications[0]?.status || null,
    applicationDate: position.applications[0]?.createdAt || null,
  };

  return NextResponse.json({ job });
}
