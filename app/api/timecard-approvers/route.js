import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET — list approvers for a business
export async function GET(request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  // Admin can pass businessProfileId, BU uses their own
  let businessProfileId = searchParams.get("businessProfileId");

  if (!businessProfileId) {
    const profile = await prisma.businessProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });
    if (!profile) {
      return NextResponse.json({ approvers: [] });
    }
    businessProfileId = profile.id;
  }

  const approvers = await prisma.timecardApprover.findMany({
    where: { businessProfileId },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ approvers });
}

// POST — add a new approver
export async function POST(request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name, email, phone, businessProfileId: bpId } = await request.json();
  if (!name?.trim() || !email?.trim()) {
    return NextResponse.json({ error: "Name and email are required" }, { status: 400 });
  }

  // Determine businessProfileId
  let businessProfileId = bpId;
  if (!businessProfileId) {
    const profile = await prisma.businessProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });
    if (!profile) {
      return NextResponse.json({ error: "Business profile not found" }, { status: 404 });
    }
    businessProfileId = profile.id;
  } else {
    // Verify admin
    const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } });
    if (user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const approver = await prisma.timecardApprover.create({
    data: {
      businessProfileId,
      name: name.trim(),
      email: email.trim(),
      phone: phone?.trim() || null,
    },
  });

  return NextResponse.json({ approver }, { status: 201 });
}

// DELETE — remove an approver
export async function DELETE(request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const approver = await prisma.timecardApprover.findUnique({
    where: { id },
    include: { businessProfile: { select: { userId: true } } },
  });
  if (!approver) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // BU can delete their own, admin can delete any
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } });
  if (approver.businessProfile.userId !== session.user.id && user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.timecardApprover.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
