import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET — load a professional's full profile (for business users)
export async function GET(request, { params }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const professional = await prisma.user.findUnique({
    where: { id, role: "PROFESSIONAL" },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      image: true,
      phone: true,
      email: true,
      timezone: true,
      lastLogin: true,
      professionalProfile: {
        select: {
          title: true,
          summary: true,
          website: true,
          linkedinUrl: true,
          overallExperience: true,
          photoUrl: true,
          videoUrl: true,
        },
      },
      location: {
        select: {
          city: true,
          state: true,
          country: true,
          fullAddress: true,
        },
      },
      hourlyRate: {
        select: {
          regularRate: true,
          afterHoursRate: true,
          holidayRate: true,
        },
      },
      skills: {
        select: { skill: { select: { name: true } }, experience: true },
      },
      channels: {
        select: { channel: { select: { name: true } }, experience: true },
      },
      industries: {
        select: { industry: { select: { name: true } }, experience: true },
      },
      applications: {
        select: { application: { select: { name: true } }, experience: true },
      },
      availability: {
        select: { day: true, startTime: true, endTime: true },
      },
      environment: {
        select: {
          workFromHome: true,
          workFromOffice: true,
          computers: true,
          internetTypes: true,
          internetSpeed: true,
        },
      },
      education: {
        select: {
          institution: true,
          degree: true,
          areaOfStudy: true,
          fromDate: true,
          toDate: true,
        },
        orderBy: { fromDate: "desc" },
      },
      employment: {
        select: {
          company: true,
          title: true,
          city: true,
          state: true,
          fromMonth: true,
          fromYear: true,
          throughMonth: true,
          throughYear: true,
          currentlyWorking: true,
          remote: true,
        },
        orderBy: { fromYear: "desc" },
      },
      languages: {
        select: { language: true, proficiency: true },
      },
    },
  });

  if (!professional) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Find invites/applications for this PU on this BU's positions
  let engagements = [];
  const viewerPositions = await prisma.position.findMany({
    where: { userId: session.user.id },
    select: { id: true, title: true },
  });
  if (viewerPositions.length > 0) {
    const posIds = viewerPositions.map((p) => p.id);
    const posMap = {};
    viewerPositions.forEach((p) => { posMap[p.id] = p.title; });

    const [offers, apps] = await Promise.all([
      prisma.jobOffer.findMany({
        where: { userId: id, positionId: { in: posIds } },
        select: { positionId: true, status: true, sow: { select: { status: true } } },
      }),
      prisma.jobApplication.findMany({
        where: { userId: id, positionId: { in: posIds } },
        select: { positionId: true, status: true },
      }),
    ]);

    const seen = new Set();
    offers.forEach((o) => {
      seen.add(o.positionId);
      engagements.push({
        positionTitle: posMap[o.positionId],
        type: "invite",
        status: o.status,
        sowStatus: o.sow?.status || null,
      });
    });
    apps.forEach((a) => {
      if (!seen.has(a.positionId)) {
        engagements.push({
          positionTitle: posMap[a.positionId],
          type: "application",
          status: a.status,
        });
      }
    });
  }

  return NextResponse.json({ professional, engagements });
}
