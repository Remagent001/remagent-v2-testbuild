import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET — get active postings + check which ones already have an invite for a given professional
export async function GET(request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const professionalId = searchParams.get("professionalId");

  if (!professionalId) {
    return NextResponse.json({ error: "Missing professionalId" }, { status: 400 });
  }

  // Get active postings for this business user
  const positions = await prisma.position.findMany({
    where: {
      userId: session.user.id,
      status: { in: ["published", "private"] },
    },
    select: {
      id: true,
      title: true,
      status: true,
      visibility: true,
      numberOfHires: true,
      regularRate: true,
    },
    orderBy: { createdAt: "desc" },
  });

  // Check which positions already have an invite for this professional
  const existingInvites = await prisma.jobOffer.findMany({
    where: {
      userId: professionalId,
      positionId: { in: positions.map((p) => p.id) },
    },
    select: { positionId: true, status: true },
  });

  const inviteMap = {};
  existingInvites.forEach((inv) => {
    inviteMap[inv.positionId] = inv.status;
  });

  return NextResponse.json({
    positions: positions.map((p) => ({
      ...p,
      inviteStatus: inviteMap[p.id] || null,
    })),
  });
}
