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
          description: true,
          regularRate: true,
          contractType: true,
          timezone: true,
          showCompanyName: true,
          status: true,
          user: {
            select: {
              businessProfile: {
                select: { businessName: true, logo: true, city: true, state: true, industry: true, website: true },
              },
            },
          },
          availability: {
            select: { day: true, startTime: true, endTime: true },
          },
          skills: {
            include: { skill: { select: { id: true, name: true } } },
          },
          channels: {
            include: { channel: { select: { id: true, name: true } } },
          },
          environment: true,
        },
      },
      messages: {
        select: { id: true, senderId: true, read: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Look up hires and offers/SOW for this professional
  const [hires, offers] = await Promise.all([
    prisma.hire.findMany({
      where: { professionalId: session.user.id },
      select: { positionId: true, status: true },
    }),
    prisma.jobOffer.findMany({
      where: { userId: session.user.id },
      select: { positionId: true, status: true, sow: { select: { status: true } } },
    }),
  ]);
  const hireMap = {};
  hires.forEach((h) => { hireMap[h.positionId] = h.status; });
  const offerMap = {};
  offers.forEach((o) => { offerMap[o.positionId] = o; });

  const result = applications.map((app) => {
    const biz = app.position?.user?.businessProfile;
    const hireStatus = hireMap[app.positionId] || null;
    const offer = offerMap[app.positionId] || null;
    const sowStatus = offer?.sow?.status || null;

    // Derive effective status
    let effectiveStatus = app.status;
    if (hireStatus === "active") effectiveStatus = "hired";
    else if (hireStatus === "completed") effectiveStatus = "completed";
    else if (hireStatus === "terminated") effectiveStatus = "terminated";
    else if (sowStatus === "sent") effectiveStatus = "sow_received";
    else if (sowStatus === "agreed") effectiveStatus = "hired";

    // Calculate progress step for the tracker
    let progressStep = 1; // Applied
    if (app.status === "reviewing") progressStep = 2;
    if (app.messages?.length > 0) progressStep = Math.max(progressStep, 3); // Questions
    if (app.status === "accepted") progressStep = Math.max(progressStep, 5);
    if (sowStatus === "sent") progressStep = 6;
    if (sowStatus === "agreed") progressStep = 7;
    if (hireStatus === "active") progressStep = 8;
    if (hireStatus === "completed") progressStep = 9; // past hired — show all complete

    // Unread message count
    const unreadMessages = (app.messages || []).filter((m) => !m.read && m.senderId !== session.user.id).length;

    return {
      id: app.id,
      status: effectiveStatus,
      applicationStatus: app.status,
      hireStatus,
      sowStatus,
      progressStep,
      unreadMessages,
      coverMessage: app.coverMessage,
      createdAt: app.createdAt,
      position: {
        id: app.position.id,
        title: app.position.title,
        description: app.position.description,
        regularRate: app.position.regularRate,
        contractType: app.position.contractType,
        timezone: app.position.timezone,
        positionStatus: app.position.status,
        company: app.position.showCompanyName
          ? { name: biz?.businessName, logo: biz?.logo, city: biz?.city, state: biz?.state, industry: biz?.industry, website: biz?.website }
          : { name: null, logo: null, city: biz?.city, state: biz?.state, industry: biz?.industry },
        availability: app.position.availability,
        skills: app.position.skills,
        channels: app.position.channels,
        environment: app.position.environment,
      },
    };
  });

  return NextResponse.json({ applications: result });
}
