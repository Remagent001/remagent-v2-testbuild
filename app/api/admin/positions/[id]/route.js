import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET — load single position for admin review
export async function GET(request, { params }) {
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

  const { id } = await params;

  const position = await prisma.position.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          businessProfile: { select: { businessName: true, phone: true } },
        },
      },
      skills: { include: { skill: true } },
      channels: { include: { channel: true } },
      positionApps: { include: { application: true } },
      environment: true,
      availability: true,
      documents: true,
    },
  });

  if (!position) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ position });
}

// PUT — approve or send back for review
export async function PUT(request, { params }) {
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

  const { id } = await params;
  const { action, note } = await request.json();

  const position = await prisma.position.findUnique({ where: { id } });
  if (!position) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (position.status !== "pending_approval") {
    return NextResponse.json({ error: "Position is not pending approval" }, { status: 400 });
  }

  if (action === "approve") {
    // Move to published or private based on visibility selection
    const newStatus = position.visibility === "private" ? "private" : "published";
    await prisma.position.update({
      where: { id },
      data: {
        status: newStatus,
        reviewRequired: false,
        adminNote: null,
        approvedAt: new Date(),
        approvedBy: session.user.id,
      },
    });
    return NextResponse.json({ success: true, newStatus });
  }

  if (action === "request_changes") {
    if (!note?.trim()) {
      return NextResponse.json({ error: "A note is required when requesting changes" }, { status: 400 });
    }
    await prisma.position.update({
      where: { id },
      data: {
        reviewRequired: true,
        adminNote: note.trim(),
      },
    });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
