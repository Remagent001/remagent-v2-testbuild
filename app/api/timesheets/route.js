import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { assembleWeeklyTimesheet, calculateHours } from "@/lib/timesheet";
import { sendTimesheetApprovedEmail, sendTimesheetReviewEmail, sendTimesheetResubmittedEmail } from "@/lib/email";
import { sendSms } from "@/lib/sms";
import { tryGenerateInvoice } from "@/lib/invoice";

// GET — list timesheets (role-adaptive)
export async function GET(request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const professionalId = searchParams.get("professionalId");

  const where = {};

  if (session.user.role === "PROFESSIONAL") {
    where.professionalId = session.user.id;
  } else if (session.user.role === "BUSINESS") {
    where.businessId = session.user.id;
    if (professionalId) where.professionalId = professionalId;
  }
  // ADMIN sees all — no filter on businessId/professionalId unless specified

  if (status) where.status = status;
  if (from || to) {
    where.weekStart = {};
    if (from) where.weekStart.gte = new Date(from);
    if (to) where.weekStart.lte = new Date(to);
  }

  const timesheets = await prisma.weeklyTimesheet.findMany({
    where,
    include: {
      entries: {
        where: { type: "work" },
        select: {
          id: true,
          date: true,
          startTime: true,
          endTime: true,
          breakMinutes: true,
          rateType: true,
          status: true,
          description: true,
          reviewReason: true,
        },
        orderBy: [{ date: "asc" }, { startTime: "asc" }],
      },
    },
    orderBy: { weekStart: "desc" },
  });

  // Enrich with hire/user info via separate queries to keep it clean
  const hireIds = [...new Set(timesheets.map((t) => t.hireId))];
  const proIds = [...new Set(timesheets.map((t) => t.professionalId))];
  const bizIds = [...new Set(timesheets.map((t) => t.businessId))];

  const [hires, professionals, businesses] = await Promise.all([
    prisma.hire.findMany({
      where: { id: { in: hireIds } },
      include: { position: { select: { title: true } } },
    }),
    prisma.user.findMany({
      where: { id: { in: proIds } },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        professionalProfile: { select: { photoUrl: true, title: true } },
      },
    }),
    prisma.user.findMany({
      where: { id: { in: bizIds } },
      select: {
        id: true,
        businessProfile: { select: { businessName: true } },
      },
    }),
  ]);

  const hireMap = Object.fromEntries(hires.map((h) => [h.id, h]));
  const proMap = Object.fromEntries(professionals.map((p) => [p.id, p]));
  const bizMap = Object.fromEntries(businesses.map((b) => [b.id, b]));

  const enriched = timesheets.map((ts) => ({
    ...ts,
    hire: hireMap[ts.hireId] || null,
    professional: proMap[ts.professionalId] || null,
    business: bizMap[ts.businessId] || null,
  }));

  // Counts by status
  const counts = {
    all: enriched.length,
    pending: enriched.filter((t) => t.status === "pending").length,
    approved: enriched.filter((t) => t.status === "approved").length,
    under_review: enriched.filter((t) => t.status === "under_review").length,
    invoiced: enriched.filter((t) => t.status === "invoiced").length,
  };

  return NextResponse.json({ timesheets: enriched, counts });
}

// PUT — approve, submit for review, or resubmit
export async function PUT(request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { timesheetId, action, reason, entryId } = body;

  if (!timesheetId) {
    return NextResponse.json({ error: "Missing timesheetId" }, { status: 400 });
  }

  const timesheet = await prisma.weeklyTimesheet.findUnique({
    where: { id: timesheetId },
    include: { entries: true },
  });
  if (!timesheet) {
    return NextResponse.json({ error: "Timesheet not found" }, { status: 404 });
  }

  // ── APPROVE ──
  if (action === "approve") {
    if (session.user.role !== "BUSINESS" && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Only business users can approve" }, { status: 403 });
    }
    if (session.user.role === "BUSINESS" && timesheet.businessId !== session.user.id) {
      return NextResponse.json({ error: "Not your timesheet" }, { status: 403 });
    }
    if (timesheet.status !== "pending") {
      return NextResponse.json({ error: `Cannot approve a timesheet with status "${timesheet.status}"` }, { status: 400 });
    }

    await prisma.$transaction([
      prisma.weeklyTimesheet.update({
        where: { id: timesheetId },
        data: {
          status: "approved",
          approvedAt: new Date(),
          approvedBy: session.user.id,
          reviewReason: null,
          reviewedAt: null,
        },
      }),
      prisma.timeEntry.updateMany({
        where: { weeklyTimesheetId: timesheetId },
        data: { status: "approved", reviewReason: null },
      }),
    ]);

    // Notify professional
    const totalHrs = Math.round((timesheet.totalRegularHrs + timesheet.totalAfterHrs + timesheet.totalHolidayHrs) * 100) / 100;
    const ws = new Date(timesheet.weekStart);
    const we = new Date(timesheet.weekEnd);
    const weekLabel = `${ws.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${we.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
    const [proUser, bizUser] = await Promise.all([
      prisma.user.findUnique({ where: { id: timesheet.professionalId }, select: { email: true, phone: true, firstName: true } }),
      prisma.user.findUnique({ where: { id: timesheet.businessId }, select: { businessProfile: { select: { businessName: true } } } }),
    ]);
    const bizName = bizUser?.businessProfile?.businessName || "Your employer";
    if (proUser?.email) {
      sendTimesheetApprovedEmail(proUser.email, {
        professionalName: proUser.firstName,
        weekLabel,
        businessName: bizName,
        totalHrs,
        amount: timesheet.subtotal.toFixed(2),
      }).catch(() => {});
    }
    if (proUser?.phone) {
      sendSms(proUser.phone, `Your timesheet for ${weekLabel} was approved by ${bizName}. Total: ${totalHrs}h.`).catch(() => {});
    }

    // Try to generate invoice (only succeeds if ALL timesheets for this biz+week are approved)
    tryGenerateInvoice(prisma, timesheet.businessId, timesheet.weekStart).catch(() => {});

    return NextResponse.json({ success: true, status: "approved" });
  }

  // ── SUBMIT FOR REVIEW ──
  if (action === "review") {
    if (session.user.role !== "BUSINESS" && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Only business users can submit for review" }, { status: 403 });
    }
    if (session.user.role === "BUSINESS" && timesheet.businessId !== session.user.id) {
      return NextResponse.json({ error: "Not your timesheet" }, { status: 403 });
    }
    if (!reason) {
      return NextResponse.json({ error: "Please provide a reason" }, { status: 400 });
    }

    await prisma.$transaction([
      prisma.weeklyTimesheet.update({
        where: { id: timesheetId },
        data: {
          status: "under_review",
          reviewReason: reason,
          reviewedAt: new Date(),
        },
      }),
      prisma.timeEntry.updateMany({
        where: { weeklyTimesheetId: timesheetId },
        data: { status: "under_review", reviewReason: reason },
      }),
    ]);

    // Notify professional
    const wsR = new Date(timesheet.weekStart);
    const weR = new Date(timesheet.weekEnd);
    const weekLabelR = `${wsR.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${weR.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
    const [proUserR, bizUserR] = await Promise.all([
      prisma.user.findUnique({ where: { id: timesheet.professionalId }, select: { email: true, phone: true, firstName: true } }),
      prisma.user.findUnique({ where: { id: timesheet.businessId }, select: { businessProfile: { select: { businessName: true } } } }),
    ]);
    const bizNameR = bizUserR?.businessProfile?.businessName || "Your employer";
    if (proUserR?.email) {
      sendTimesheetReviewEmail(proUserR.email, {
        professionalName: proUserR.firstName,
        weekLabel: weekLabelR,
        businessName: bizNameR,
        reason,
      }).catch(() => {});
    }
    if (proUserR?.phone) {
      sendSms(proUserR.phone, `Your timesheet for ${weekLabelR} needs review: "${reason}". Please check Remagent.`).catch(() => {});
    }

    return NextResponse.json({ success: true, status: "under_review" });
  }

  // ── REVIEW SINGLE ENTRY ──
  if (action === "review_entry") {
    if (session.user.role !== "BUSINESS" && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Only business users can flag entries" }, { status: 403 });
    }
    if (!entryId || !reason) {
      return NextResponse.json({ error: "Missing entryId or reason" }, { status: 400 });
    }

    await prisma.timeEntry.update({
      where: { id: entryId },
      data: { status: "under_review", reviewReason: reason },
    });

    // Also update timesheet status if not already under review
    if (timesheet.status === "pending") {
      await prisma.weeklyTimesheet.update({
        where: { id: timesheetId },
        data: { status: "under_review", reviewReason: "Individual entries flagged for review", reviewedAt: new Date() },
      });
    }

    return NextResponse.json({ success: true });
  }

  // ── RESUBMIT (Professional) ──
  if (action === "resubmit") {
    if (timesheet.professionalId !== session.user.id) {
      return NextResponse.json({ error: "Not your timesheet" }, { status: 403 });
    }
    if (timesheet.status !== "under_review") {
      return NextResponse.json({ error: "Timesheet is not under review" }, { status: 400 });
    }

    // Recalculate totals from entries
    const recalc = await assembleWeeklyTimesheet(prisma, timesheet.hireId, timesheet.weekStart);
    if (!recalc) {
      return NextResponse.json({ error: "Failed to recalculate" }, { status: 500 });
    }

    // Reset status to pending
    await prisma.$transaction([
      prisma.weeklyTimesheet.update({
        where: { id: timesheetId },
        data: { status: "pending", reviewReason: null, reviewedAt: null },
      }),
      prisma.timeEntry.updateMany({
        where: { weeklyTimesheetId: timesheetId },
        data: { status: "pending", reviewReason: null },
      }),
    ]);

    // Notify business
    const wsS = new Date(timesheet.weekStart);
    const weS = new Date(timesheet.weekEnd);
    const weekLabelS = `${wsS.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${weS.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
    const [proUserS, bizUserS] = await Promise.all([
      prisma.user.findUnique({ where: { id: timesheet.professionalId }, select: { firstName: true, lastName: true } }),
      prisma.user.findUnique({ where: { id: timesheet.businessId }, select: { email: true, phone: true, businessProfile: { select: { businessName: true } } } }),
    ]);
    const proNameS = proUserS ? `${proUserS.firstName} ${proUserS.lastName}` : "A professional";
    if (bizUserS?.email) {
      sendTimesheetResubmittedEmail(bizUserS.email, {
        businessName: bizUserS.businessProfile?.businessName || "",
        professionalName: proNameS,
        weekLabel: weekLabelS,
      }).catch(() => {});
    }
    if (bizUserS?.phone) {
      sendSms(bizUserS.phone, `${proNameS} has resubmitted their timesheet for ${weekLabelS}. Please review on Remagent.`).catch(() => {});
    }

    return NextResponse.json({ success: true, status: "pending" });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
