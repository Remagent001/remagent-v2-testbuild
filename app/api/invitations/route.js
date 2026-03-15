import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { notifyInviteAccepted, notifyInviteDeclined } from "@/lib/sms";

// GET — list invitations received by the logged-in professional
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const invitations = await prisma.jobOffer.findMany({
    where: { userId: session.user.id },
    select: {
      id: true,
      status: true,
      viewedAt: true,
      progressStep: true,
      createdAt: true,
      updatedAt: true,
      sow: { select: { status: true } },
      position: {
        select: {
          id: true,
          title: true,
          status: true,
          visibility: true,
          numberOfHires: true,
          description: true,
          timezone: true,
          availability: { select: { day: true, startTime: true, endTime: true } },
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              businessProfile: {
                select: {
                  businessName: true,
                  industry: true,
                  city: true,
                  state: true,
                  logo: true,
                  website: true,
                },
              },
            },
          },
          regularRate: true,
          skills: { select: { skill: { select: { name: true } } } },
          channels: { select: { channel: { select: { name: true } } } },
          environment: { select: { workLocation: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Mark unviewed invites as viewed (step 1 -> 2) and set viewedAt
  const unviewed = invitations.filter((i) => !i.viewedAt);
  if (unviewed.length > 0) {
    await Promise.all(
      unviewed.map((i) =>
        prisma.jobOffer.update({
          where: { id: i.id },
          data: {
            viewedAt: new Date(),
            progressStep: Math.max(i.progressStep, 2),
          },
        })
      )
    );
    // Update local data
    unviewed.forEach((i) => {
      i.viewedAt = new Date();
      i.progressStep = Math.max(i.progressStep, 2);
    });
  }

  // Get unread message counts and last message info for each invitation
  const STALE_HOURS = 72;
  const staleThreshold = new Date(Date.now() - STALE_HOURS * 60 * 60 * 1000);

  const [unreadCounts, lastMessages] = await Promise.all([
    Promise.all(
      invitations.map((inv) =>
        prisma.inviteMessage.count({
          where: { offerId: inv.id, senderId: { not: session.user.id }, read: false },
        })
      )
    ),
    Promise.all(
      invitations.map((inv) =>
        prisma.inviteMessage.findFirst({
          where: { offerId: inv.id },
          orderBy: { createdAt: "desc" },
          select: { senderId: true, createdAt: true },
        })
      )
    ),
  ]);

  const result = invitations.map((inv, i) => {
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

    return { ...inv, unreadMessages: unread, messageStatus };
  });

  // Count by status
  const totalUnread = unreadCounts.reduce((sum, c) => sum + c, 0);
  const counts = {
    all: invitations.length,
    pending: invitations.filter((i) => i.status === "pending").length,
    accepted: invitations.filter((i) => i.status === "accepted").length,
    declined: invitations.filter((i) => i.status === "declined").length,
    unreadMessages: totalUnread,
  };

  return NextResponse.json({ invitations: result, counts });
}

// PUT — respond to an invitation (accept or decline)
export async function PUT(request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { inviteId, action } = await request.json();

  if (!inviteId || !["accept", "decline"].includes(action)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  // Verify this invite belongs to the current user
  const invite = await prisma.jobOffer.findUnique({
    where: { id: inviteId },
    include: { position: true },
  });

  if (!invite || invite.userId !== session.user.id) {
    return NextResponse.json({ error: "Invitation not found" }, { status: 404 });
  }

  if (invite.status !== "pending") {
    return NextResponse.json({ error: "This invitation has already been responded to" }, { status: 400 });
  }

  const newStatus = action === "accept" ? "accepted" : "declined";

  await prisma.jobOffer.update({
    where: { id: inviteId },
    data: {
      status: newStatus,
      progressStep: Math.max(invite.progressStep || 1, action === "accept" ? 5 : 3),
    },
  });

  // If accepted, create a job application record
  if (action === "accept") {
    // Check if application already exists
    const existing = await prisma.jobApplication.findUnique({
      where: {
        positionId_userId: {
          positionId: invite.positionId,
          userId: session.user.id,
        },
      },
    });

    if (!existing) {
      await prisma.jobApplication.create({
        data: {
          positionId: invite.positionId,
          userId: session.user.id,
          status: "new",
        },
      });
    }
  }

  // SMS notify the business owner (non-blocking)
  const bizOwner = await prisma.user.findUnique({
    where: { id: invite.position.userId },
    select: { phone: true },
  });
  const proUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { firstName: true, lastName: true },
  });
  if (bizOwner?.phone) {
    const proName = `${proUser?.firstName || ""} ${proUser?.lastName || ""}`.trim() || "A professional";
    const jobTitle = invite.position.title || "a position";
    if (action === "accept") {
      notifyInviteAccepted(bizOwner.phone, { professionalName: proName, jobTitle }).catch(() => {});
    } else {
      notifyInviteDeclined(bizOwner.phone, { professionalName: proName, jobTitle }).catch(() => {});
    }
  }

  return NextResponse.json({ success: true, status: newStatus });
}
