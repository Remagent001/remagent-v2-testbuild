import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET — professional's own applications
export async function GET(request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const applications = await prisma.jobApplication.findMany({
    where: { userId: session.user.id },
    include: {
      position: {
        select: {
          id: true,
          title: true,
          regularRate: true,
          contractType: true,
          timezone: true,
          showCompanyName: true,
          status: true,
          user: {
            select: {
              businessProfile: {
                select: { businessName: true, logo: true, city: true, state: true },
              },
            },
          },
          availability: {
            select: { day: true, startTime: true, endTime: true },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Look up hires for this professional to determine actual hire status
  const hires = await prisma.hire.findMany({
    where: { professionalId: session.user.id },
    select: { positionId: true, status: true },
  });
  const hireMap = {};
  hires.forEach((h) => { hireMap[h.positionId] = h.status; });

  const result = applications.map((app) => {
    const biz = app.position?.user?.businessProfile;
    const hireStatus = hireMap[app.positionId] || null;
    // Derive effective status: if a hire exists, show that instead
    let effectiveStatus = app.status;
    if (hireStatus === "active") effectiveStatus = "hired";
    else if (hireStatus === "completed") effectiveStatus = "completed";
    else if (hireStatus === "terminated") effectiveStatus = "terminated";

    return {
      id: app.id,
      status: effectiveStatus,
      applicationStatus: app.status,
      hireStatus,
      coverMessage: app.coverMessage,
      createdAt: app.createdAt,
      position: {
        id: app.position.id,
        title: app.position.title,
        regularRate: app.position.regularRate,
        contractType: app.position.contractType,
        timezone: app.position.timezone,
        positionStatus: app.position.status,
        company: app.position.showCompanyName
          ? { name: biz?.businessName, logo: biz?.logo, city: biz?.city, state: biz?.state }
          : { name: null, logo: null, city: biz?.city, state: biz?.state },
        availability: app.position.availability,
      },
    };
  });

  return NextResponse.json({ applications: result });
}
