import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { notifyInviteReceived } from "@/lib/sms";

// POST — invite a professional to apply to a job posting
export async function POST(request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { positionId, professionalId } = await request.json();

  if (!positionId || !professionalId) {
    return NextResponse.json({ error: "Missing positionId or professionalId" }, { status: 400 });
  }

  // Verify the position belongs to this business user and is active
  const position = await prisma.position.findUnique({
    where: { id: positionId, userId: session.user.id },
  });

  if (!position) {
    return NextResponse.json({ error: "Position not found" }, { status: 404 });
  }

  if (position.status !== "published" && position.status !== "private") {
    return NextResponse.json({ error: "Can only invite to active (published or private) postings" }, { status: 400 });
  }

  // Verify the professional exists
  const professional = await prisma.user.findUnique({
    where: { id: professionalId, role: "PROFESSIONAL" },
  });

  if (!professional) {
    return NextResponse.json({ error: "Professional not found" }, { status: 404 });
  }

  // Check if already invited
  const existing = await prisma.jobOffer.findUnique({
    where: { positionId_userId: { positionId, userId: professionalId } },
  });

  if (existing) {
    if (existing.status === "withdrawn") {
      // Delete the old withdrawn invite so they can be re-invited
      await prisma.jobOffer.delete({ where: { id: existing.id } });
    } else {
      return NextResponse.json({ error: "Already invited to this posting" }, { status: 409 });
    }
  }

  // Create the invite
  const invite = await prisma.jobOffer.create({
    data: {
      positionId,
      userId: professionalId,
      status: "pending",
    },
  });

  // SMS notify the professional (non-blocking)
  if (professional.phone) {
    const bizProfile = await prisma.businessProfile.findUnique({
      where: { userId: session.user.id },
      select: { businessName: true },
    });
    notifyInviteReceived(professional.phone, {
      businessName: bizProfile?.businessName || "A business",
      jobTitle: position.title || "a position",
    }).catch(() => {});
  }

  return NextResponse.json({ success: true, invite });
}

// GET — list invites sent by this business user
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

  const invites = await prisma.jobOffer.findMany({
    where,
    include: {
      position: {
        select: { id: true, title: true, status: true, visibility: true },
      },
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          lastLogin: true,
          professionalProfile: {
            select: { title: true, photoUrl: true },
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

  // Get unread message counts and last message info for each invite
  const STALE_HOURS = 72;
  const staleThreshold = new Date(Date.now() - STALE_HOURS * 60 * 60 * 1000);

  const [unreadCounts, lastMessages] = await Promise.all([
    Promise.all(
      invites.map((inv) =>
        prisma.inviteMessage.count({
          where: { offerId: inv.id, senderId: { not: session.user.id }, read: false },
        })
      )
    ),
    Promise.all(
      invites.map((inv) =>
        prisma.inviteMessage.findFirst({
          where: { offerId: inv.id },
          orderBy: { createdAt: "desc" },
          select: { senderId: true, createdAt: true, content: true },
        })
      )
    ),
  ]);

  const result = invites.map((inv, i) => {
    const unread = unreadCounts[i];
    const lastMsg = lastMessages[i];
    let messageStatus = null;

    if (lastMsg) {
      const isStale = new Date(lastMsg.createdAt) < staleThreshold;
      const lastIsFromMe = lastMsg.senderId === session.user.id;
      if (unread > 0) {
        messageStatus = "unread";
      } else if (!lastIsFromMe) {
        messageStatus = "awaiting_reply";
      } else if (!isStale) {
        messageStatus = "active";
      } else {
        messageStatus = "stale";
      }
    }

    return { ...inv, unreadMessages: unread, messageStatus, lastMessageContent: lastMsg?.content || null, lastMessageAt: lastMsg?.createdAt || null };
  });

  return NextResponse.json({ invites: result });
}

// PUT — update invite status (withdraw)
export async function PUT(request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { inviteId, status } = await request.json();

  if (!inviteId || !status) {
    return NextResponse.json({ error: "Missing inviteId or status" }, { status: 400 });
  }

  // Verify the invite belongs to one of this user's positions
  const invite = await prisma.jobOffer.findUnique({
    where: { id: inviteId },
    include: { position: { select: { userId: true } } },
  });

  if (!invite || invite.position.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (status === "withdrawn" && invite.status !== "pending") {
    return NextResponse.json({ error: "Can only withdraw pending invites" }, { status: 400 });
  }

  await prisma.jobOffer.update({
    where: { id: inviteId },
    data: { status },
  });

  return NextResponse.json({ success: true });
}
