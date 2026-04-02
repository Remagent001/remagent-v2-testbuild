import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { sendSms } from "@/lib/sms";

// GET — fetch SOW for an offer (both BU and PU)
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

  const offer = await prisma.jobOffer.findUnique({
    where: { id: offerId },
    include: {
      position: {
        select: {
          userId: true, title: true,
          user: {
            select: {
              businessProfile: { select: { convenienceFee: true } },
            },
          },
        },
      },
      user: {
        select: {
          id: true, firstName: true, lastName: true, phone: true,
          professionalProfile: { select: { title: true } },
        },
      },
      sow: true,
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

  return NextResponse.json({
    sow: offer.sow,
    offer: {
      id: offer.id,
      status: offer.status,
      progressStep: offer.progressStep,
      positionTitle: offer.position.title,
      professionalName: `${offer.user.firstName || ""} ${offer.user.lastName || ""}`.trim(),
      professionalTitle: offer.user.professionalProfile?.title || "",
    },
    convenienceFee: offer.position?.user?.businessProfile?.convenienceFee ?? 3,
    role: isPro ? "professional" : "business",
  });
}

// POST — create or update SOW (BU only)
export async function POST(request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { offerId, ...sowData } = body;

  if (!offerId) {
    return NextResponse.json({ error: "offerId required" }, { status: 400 });
  }

  // Verify BU owns the position
  const offer = await prisma.jobOffer.findUnique({
    where: { id: offerId },
    include: {
      position: { select: { userId: true, title: true } },
      user: { select: { id: true, firstName: true, lastName: true, phone: true } },
    },
  });

  if (!offer || offer.position.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Parse dates
  const data = {
    ...sowData,
    startDate: sowData.startDate ? new Date(sowData.startDate) : null,
    endDate: sowData.endDate ? new Date(sowData.endDate) : null,
    hourlyRate: sowData.hourlyRate ? parseFloat(sowData.hourlyRate) : null,
    estimatedHours: sowData.estimatedHours ? parseFloat(sowData.estimatedHours) : null,
    billingRate: sowData.billingRate ? parseFloat(sowData.billingRate) : null,
    isExtension: sowData.isExtension === true,
  };

  // Upsert SOW
  const sow = await prisma.statementOfWork.upsert({
    where: { offerId },
    create: { offerId, ...data },
    update: data,
  });

  // If sending to PU, update status and progress
  if (sowData.status === "sent") {
    await prisma.jobOffer.update({
      where: { id: offerId },
      data: { progressStep: Math.max(offer.progressStep || 1, 6) },
    });

    // SMS notify the professional
    if (offer.user.phone) {
      const proName = `${offer.user.firstName || ""} ${offer.user.lastName || ""}`.trim();
      sendSms(
        offer.user.phone,
        `A Statement of Work for "${offer.position.title || "a position"}" has been sent to you for review. Log in to view: https://remagentemploymentprofessionals.com/invitations`
      ).catch(() => {});
    }
  }

  return NextResponse.json({ success: true, sow });
}

// PUT — PU agrees or declines SOW
export async function PUT(request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { offerId, action } = await request.json();

  if (!offerId || !["agree", "decline"].includes(action)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const offer = await prisma.jobOffer.findUnique({
    where: { id: offerId },
    include: {
      position: { select: { userId: true, title: true } },
      sow: true,
    },
  });

  if (!offer || offer.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!offer.sow || offer.sow.status !== "sent") {
    return NextResponse.json({ error: "No SOW pending agreement" }, { status: 400 });
  }

  if (action === "agree") {
    await prisma.statementOfWork.update({
      where: { offerId },
      data: { status: "agreed", agreedAt: new Date() },
    });

    // Advance progress to step 6 (SOW Signed)
    await prisma.jobOffer.update({
      where: { id: offerId },
      data: { progressStep: 7 },
    });

    // Create hire record
    const existingHire = await prisma.hire.findFirst({
      where: { positionId: offer.positionId, professionalId: session.user.id },
    });
    if (!existingHire) {
      await prisma.hire.create({
        data: {
          positionId: offer.positionId,
          businessId: offer.position.userId,
          professionalId: session.user.id,
          regularRate: offer.sow.hourlyRate,
          startDate: offer.sow.startDate,
          endDate: offer.sow.endDate,
          daysOfWork: offer.sow.schedule,
          status: "active",
        },
      });

      // Advance to step 7 (Hired)
      await prisma.jobOffer.update({
        where: { id: offerId },
        data: { progressStep: 8 },
      });
    }

    // SMS notify BU
    const bizOwner = await prisma.user.findUnique({
      where: { id: offer.position.userId },
      select: { phone: true },
    });
    const proUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { firstName: true, lastName: true },
    });
    if (bizOwner?.phone) {
      const proName = `${proUser?.firstName || ""} ${proUser?.lastName || ""}`.trim();
      sendSms(
        bizOwner.phone,
        `${proName} has agreed to the Statement of Work for "${offer.position.title}". They are now hired! View: https://remagentemploymentprofessionals.com/hires`
      ).catch(() => {});
    }

    return NextResponse.json({ success: true, status: "agreed" });
  } else {
    await prisma.statementOfWork.update({
      where: { offerId },
      data: { status: "declined" },
    });

    // SMS notify BU
    const bizOwner = await prisma.user.findUnique({
      where: { id: offer.position.userId },
      select: { phone: true },
    });
    const proUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { firstName: true, lastName: true },
    });
    if (bizOwner?.phone) {
      const proName = `${proUser?.firstName || ""} ${proUser?.lastName || ""}`.trim();
      sendSms(
        bizOwner.phone,
        `${proName} declined the Statement of Work for "${offer.position.title}". View: https://remagentemploymentprofessionals.com/invites`
      ).catch(() => {});
    }

    return NextResponse.json({ success: true, status: "declined" });
  }
}
