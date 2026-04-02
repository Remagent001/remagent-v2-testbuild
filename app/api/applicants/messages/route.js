import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { sendSms } from "@/lib/sms";

// GET — fetch messages for an application
export async function GET(request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const applicationId = searchParams.get("applicationId");
  if (!applicationId) {
    return NextResponse.json({ error: "Missing applicationId" }, { status: 400 });
  }

  // Verify the user is either the applicant or the position owner
  const application = await prisma.jobApplication.findUnique({
    where: { id: applicationId },
    include: { position: { select: { userId: true, title: true } } },
  });
  if (!application) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const isPro = application.userId === session.user.id;
  const isBiz = application.position.userId === session.user.id;
  if (!isPro && !isBiz) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  // Fetch messages
  const messages = await prisma.applicationMessage.findMany({
    where: { applicationId },
    include: {
      sender: {
        select: { id: true, firstName: true, lastName: true, role: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  // Mark unread messages from other party as read
  await prisma.applicationMessage.updateMany({
    where: {
      applicationId,
      senderId: { not: session.user.id },
      read: false,
    },
    data: { read: true },
  });

  return NextResponse.json({ messages });
}

// POST — send a message on an application
export async function POST(request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { applicationId, content } = await request.json();
  if (!applicationId || !content?.trim()) {
    return NextResponse.json({ error: "Missing applicationId or content" }, { status: 400 });
  }

  const application = await prisma.jobApplication.findUnique({
    where: { id: applicationId },
    include: {
      position: { select: { userId: true, title: true } },
      user: { select: { id: true, firstName: true, phone: true } },
    },
  });
  if (!application) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const isPro = application.userId === session.user.id;
  const isBiz = application.position.userId === session.user.id;
  if (!isPro && !isBiz) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const message = await prisma.applicationMessage.create({
    data: {
      applicationId,
      senderId: session.user.id,
      content: content.trim(),
    },
    include: {
      sender: {
        select: { id: true, firstName: true, lastName: true, role: true },
      },
    },
  });

  // SMS notify the other party
  try {
    const senderName = `${message.sender.firstName} ${message.sender.lastName}`;
    if (isPro) {
      // Notify business
      const bizUser = await prisma.user.findUnique({
        where: { id: application.position.userId },
        select: { phone: true },
      });
      if (bizUser?.phone) {
        await sendSms(bizUser.phone, `New message from ${senderName} regarding their application for ${application.position.title}. Log in to view.`);
      }
    } else {
      // Notify professional
      if (application.user?.phone) {
        await sendSms(application.user.phone, `New message from ${senderName} about your application for ${application.position.title}. Log in to view.`);
      }
    }
  } catch {}

  return NextResponse.json({ message }, { status: 201 });
}
