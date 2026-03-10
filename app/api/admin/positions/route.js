import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET — list all pending positions (admin only)
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check admin role
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const positions = await prisma.position.findMany({
    where: { status: "pending_approval" },
    include: {
      user: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
          businessProfile: {
            select: { businessName: true },
          },
        },
      },
      skills: { include: { skill: true } },
      channels: { include: { channel: true } },
      positionApps: { include: { application: true } },
      environment: true,
      availability: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ positions });
}
