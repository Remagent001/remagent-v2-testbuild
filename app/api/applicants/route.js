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
    },
    orderBy: { createdAt: "desc" },
  });

  // Find matching offer IDs for each application (for SOW links)
  const offerLookups = applications.map((app) =>
    prisma.jobOffer.findUnique({
      where: { positionId_userId: { positionId: app.positionId, userId: app.userId } },
      select: { id: true, progressStep: true, sow: { select: { status: true } } },
    })
  );
  const offers = await Promise.all(offerLookups);

  const result = applications.map((app, i) => ({
    ...app,
    offer: offers[i] || null,
  }));

  return NextResponse.json({ applications: result });
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

  return NextResponse.json({ success: true });
}
