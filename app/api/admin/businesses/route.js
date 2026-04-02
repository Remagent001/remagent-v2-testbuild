import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET — list all businesses with their profiles and position stats
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const businesses = await prisma.user.findMany({
    where: { role: "BUSINESS" },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      createdAt: true,
      lastLogin: true,
      geoCountry: true,
      businessProfile: true,
      _count: {
        select: { positions: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ businesses });
}

// PUT — update business settings (e.g., autoApprove)
export async function PUT(request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const adminUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (adminUser?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { businessProfileId, autoApprove, allowTimeEditing, archived } = await request.json();

  if (!businessProfileId) {
    return NextResponse.json({ error: "Missing businessProfileId" }, { status: 400 });
  }

  const updateData = {};
  if (autoApprove !== undefined) updateData.autoApprove = autoApprove;
  if (allowTimeEditing !== undefined) updateData.allowTimeEditing = allowTimeEditing;
  if (archived !== undefined) {
    updateData.archived = archived;
    updateData.archivedAt = archived ? new Date() : null;
  }

  await prisma.businessProfile.update({
    where: { id: businessProfileId },
    data: updateData,
  });

  return NextResponse.json({ success: true });
}
