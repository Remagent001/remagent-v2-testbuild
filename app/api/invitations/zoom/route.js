import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { createInstantMeeting } from "@/lib/zoom";
import { sendSms } from "@/lib/sms";

// POST — create an instant Zoom meeting for an invite
export async function POST(request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { offerId } = await request.json();

  if (!offerId) {
    return NextResponse.json({ error: "offerId required" }, { status: 400 });
  }

  // Verify the user is part of this invite
  const offer = await prisma.jobOffer.findUnique({
    where: { id: offerId },
    include: {
      position: { select: { userId: true, title: true } },
      user: { select: { id: true, firstName: true, lastName: true, phone: true } },
    },
  });

  if (!offer) {
    return NextResponse.json({ error: "Invite not found" }, { status: 404 });
  }

  const isPro = offer.userId === session.user.id;
  const isBiz = offer.position.userId === session.user.id;

  if (!isPro && !isBiz) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  // Create Zoom meeting
  const proName = `${offer.user.firstName || ""} ${offer.user.lastName || ""}`.trim();
  const topic = `Remagent: ${offer.position.title || "Interview"} — ${proName}`;

  try {
    const meeting = await createInstantMeeting({ topic });

    // Auto-advance progress to step 4 (Interview)
    if (offer.progressStep < 4) {
      await prisma.jobOffer.update({
        where: { id: offerId },
        data: { progressStep: 4 },
      });
    }

    // Post the join link as a message so both parties can see it
    const caller = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { firstName: true, lastName: true },
    });
    const callerName = `${caller?.firstName || ""} ${caller?.lastName || ""}`.trim() || "Someone";

    await prisma.inviteMessage.create({
      data: {
        offerId,
        senderId: session.user.id,
        content: `📹 ${callerName} started a video call. Join here: ${meeting.joinUrl}`,
      },
    });

    // SMS the other party with the join link
    const recipientId = isPro ? offer.position.userId : offer.userId;
    const recipient = await prisma.user.findUnique({
      where: { id: recipientId },
      select: { phone: true },
    });
    if (recipient?.phone) {
      sendSms(
        recipient.phone,
        `${callerName} started a video call for "${offer.position.title || "Interview"}". Join now: ${meeting.joinUrl}`
      ).catch(() => {});
    }

    return NextResponse.json({
      success: true,
      joinUrl: meeting.joinUrl,
      startUrl: meeting.startUrl,
    });
  } catch (err) {
    console.error("Zoom error:", err.message);
    return NextResponse.json({ error: "Failed to create meeting. Please try again." }, { status: 500 });
  }
}
