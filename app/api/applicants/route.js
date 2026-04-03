import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET — list applications received by this business user's positions
export async function GET(request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") || "";

  const where = {
    position: { userId: session.user.id },
  };
  if (status) where.status = status;

  const applications = await prisma.jobApplication.findMany({
    where,
    include: {
      position: {
        select: { id: true, title: true, status: true },
      },
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          lastLogin: true,
          professionalProfile: {
            select: { title: true, photoUrl: true, summary: true },
          },
          location: {
            select: { city: true, state: true },
          },
          hourlyRate: {
            select: { regularRate: true },
          },
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

  // Find matching offer IDs and hire status for each application
  const [offerLookups, hireLookups] = await Promise.all([
    Promise.all(applications.map((app) =>
      prisma.jobOffer.findUnique({
        where: { positionId_userId: { positionId: app.positionId, userId: app.userId } },
        select: { id: true, progressStep: true, sow: { select: { status: true } } },
      })
    )),
    Promise.all(applications.map((app) =>
      prisma.hire.findFirst({
        where: { positionId: app.positionId, professionalId: app.userId },
        select: { status: true },
      })
    )),
  ]);

  const result = applications.map((app, i) => {
    const offer = offerLookups[i] || null;
    const hire = hireLookups[i] || null;
    const sowStatus = offer?.sow?.status || null;
    const hireStatus = hire?.status || null;

    // Calculate progress step
    let progressStep = 1; // App Received
    if (app.status === "reviewing") progressStep = 2;
    if (app.messages?.length > 0) progressStep = Math.max(progressStep, 3);
    if (app.status === "accepted") progressStep = Math.max(progressStep, 5);
    if (sowStatus === "sent") progressStep = 6;
    if (sowStatus === "agreed") progressStep = 7;
    if (hireStatus === "active") progressStep = 8;
    if (hireStatus === "completed") progressStep = 9;

    const unreadMessages = (app.messages || []).filter((m) => !m.read && m.senderId !== session.user.id).length;

    return { ...app, offer, progressStep, unreadMessages, hireStatus, sowStatus };
  });

  const counts = { total: result.length, new: result.filter((a) => a.status === "new").length };

  return NextResponse.json({ applications: result, counts });
}

// PUT — update application status (reviewing, accepted, declined)
export async function PUT(request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { applicationId, status } = await request.json();

  if (!applicationId || !status) {
    return NextResponse.json({ error: "Missing applicationId or status" }, { status: 400 });
  }

  const validStatuses = ["reviewing", "accepted", "declined"];
  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  // Verify the application belongs to one of this user's positions
  const application = await prisma.jobApplication.findUnique({
    where: { id: applicationId },
    include: { position: { select: { userId: true } } },
  });

  if (!application || application.position.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.jobApplication.update({
    where: { id: applicationId },
    data: { status },
  });

  // When accepting an applicant, create a JobOffer so the SOW flow can proceed
  if (status === "accepted") {
    const existing = await prisma.jobOffer.findUnique({
      where: { positionId_userId: { positionId: application.positionId, userId: application.userId } },
    });
    if (!existing) {
      await prisma.jobOffer.create({
        data: {
          positionId: application.positionId,
          userId: application.userId,
          status: "accepted",
          viewedAt: new Date(),
          progressStep: 5,
        },
      });
    }
  }

  return NextResponse.json({ success: true });
}
