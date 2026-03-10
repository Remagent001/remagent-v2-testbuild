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

  return NextResponse.json({ professional });
}
