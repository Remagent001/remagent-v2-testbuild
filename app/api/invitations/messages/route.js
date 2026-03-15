import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET — fetch messages for an invite
export async function GET(request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const offerId = searchParams.get("offerId");

  if (!offerId) {
    return NextResponse.json({ error: "offerId required" }, { status: 400 });
  }

  // Verify the user is either the professional or the business owner of this invite
  const offer = await prisma.jobOffer.findUnique({
    where: { id: offerId },
    include: { position: { select: { userId: true } } },
  });

  if (!offer) {
    return NextResponse.json({ error: "Invite not found" }, { status: 404 });
  }

  const isPro = offer.userId === session.user.id;
  const isBiz = offer.position.userId === session.user.id;

  if (!isPro && !isBiz) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  // Fetch messages
  const messages = await prisma.inviteMessage.findMany({
    where: { offerId },
    select: {
      id: true,
      senderId: true,
      content: true,
      read: true,
      createdAt: true,
      sender: {
        select: { firstName: true, lastName: true, role: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  // Mark unread messages from the other party as read
  await prisma.inviteMessage.updateMany({
    where: {
      offerId,
      senderId: { not: session.user.id },
      read: false,
    },
    data: { read: true },
  });

  return NextResponse.json({ messages });
}

// POST — send a message on an invite
export async function POST(request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { offerId, content } = await request.json();

  if (!offerId || !content?.trim()) {
    return NextResponse.json({ error: "offerId and content required" }, { status: 400 });
  }

  // Verify access
  const offer = await prisma.jobOffer.findUnique({
    where: { id: offerId },
    include: { position: { select: { userId: true } } },
  });

  if (!offer) {
    return NextResponse.json({ error: "Invite not found" }, { status: 404 });
  }

  const isPro = offer.userId === session.user.id;
  const isBiz = offer.position.userId === session.user.id;

  if (!isPro && !isBiz) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const message = await prisma.inviteMessage.create({
    data: {
      offerId,
      senderId: session.user.id,
      content: content.trim(),
    },
    select: {
      id: true,
      senderId: true,
      content: true,
      read: true,
      createdAt: true,
      sender: {
        select: { firstName: true, lastName: true, role: true },
      },
    },
  });

  // Auto-advance progress to step 3 (Questions) when first message is sent
  if (offer.progressStep < 3) {
    await prisma.jobOffer.update({
      where: { id: offerId },
      data: { progressStep: 3 },
    });
  }

  return NextResponse.json({ message });
}
