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

  const result = applications.map((app) => {
    const biz = app.position?.user?.businessProfile;
    return {
      id: app.id,
      status: app.status,
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
