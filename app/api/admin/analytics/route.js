import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getWeekRange } from "@/lib/timesheet";

// GET — admin analytics data
export async function GET() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const now = new Date();
  const { weekStart: thisWeekStart } = getWeekRange(now);
  const thisWeekEnd = new Date(thisWeekStart);
  thisWeekEnd.setDate(thisWeekStart.getDate() + 7);

  // This month start
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    thisWeekTimesheets,
    thisWeekInvoices,
    pendingTimesheets,
    overdueInvoices,
    allTimesheets,
    allInvoices,
    recentTimesheets,
  ] = await Promise.all([
    // Total hours this week
    prisma.weeklyTimesheet.findMany({
      where: { weekStart: { gte: thisWeekStart, lt: thisWeekEnd } },
    }),
    // Revenue this week
    prisma.invoice.findMany({
      where: { weekStart: { gte: thisWeekStart, lt: thisWeekEnd } },
    }),
    // Pending approvals count
    prisma.weeklyTimesheet.count({ where: { status: "pending" } }),
    // Overdue invoices
    prisma.invoice.findMany({
      where: { status: "due", dueDate: { lt: now } },
    }),
    // All timesheets for status breakdown
    prisma.weeklyTimesheet.groupBy({
      by: ["status"],
      _count: true,
    }),
    // All invoices for trends (last 6 months)
    prisma.invoice.findMany({
      where: { createdAt: { gte: new Date(now.getFullYear(), now.getMonth() - 6, 1) } },
      select: { totalAmount: true, createdAt: true, weekStart: true },
    }),
    // Last 12 weeks of timesheets for weekly revenue chart
    prisma.weeklyTimesheet.findMany({
      where: { weekStart: { gte: new Date(now.getTime() - 12 * 7 * 24 * 60 * 60 * 1000) } },
      select: { weekStart: true, totalAmount: true, businessId: true, totalRegularHrs: true, totalAfterHrs: true, totalHolidayHrs: true },
    }),
  ]);

  // Stat cards
  const totalHoursThisWeek = thisWeekTimesheets.reduce(
    (s, t) => s + t.totalRegularHrs + t.totalAfterHrs + t.totalHolidayHrs, 0
  );
  const revenueThisWeek = thisWeekInvoices.reduce((s, i) => s + i.totalAmount, 0);
  const overdueTotal = overdueInvoices.reduce((s, i) => s + i.totalAmount, 0);

  // Weekly revenue (last 12 weeks)
  const weeklyRevenue = {};
  for (const ts of recentTimesheets) {
    const wk = new Date(ts.weekStart).toISOString().slice(0, 10);
    weeklyRevenue[wk] = (weeklyRevenue[wk] || 0) + ts.totalAmount;
  }
  const weeklyRevenueChart = Object.entries(weeklyRevenue)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([week, amount]) => ({
      week: new Date(week).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      amount: Math.round(amount * 100) / 100,
    }));

  // Hours by business (this month, top 10)
  const bizHours = {};
  for (const ts of recentTimesheets) {
    const wsDate = new Date(ts.weekStart);
    if (wsDate >= monthStart) {
      bizHours[ts.businessId] = (bizHours[ts.businessId] || 0) +
        ts.totalRegularHrs + ts.totalAfterHrs + ts.totalHolidayHrs;
    }
  }
  const bizIds = Object.keys(bizHours);
  const bizUsers = bizIds.length > 0
    ? await prisma.user.findMany({
        where: { id: { in: bizIds } },
        select: { id: true, businessProfile: { select: { businessName: true } } },
      })
    : [];
  const bizNameMap = Object.fromEntries(bizUsers.map((b) => [b.id, b.businessProfile?.businessName || "Unknown"]));
  const hoursByBusiness = Object.entries(bizHours)
    .map(([id, hrs]) => ({ name: bizNameMap[id] || "Unknown", hours: Math.round(hrs * 100) / 100 }))
    .sort((a, b) => b.hours - a.hours)
    .slice(0, 10);

  // Status breakdown
  const statusBreakdown = allTimesheets.map((g) => ({
    name: g.status === "under_review" ? "Under Review" : g.status.charAt(0).toUpperCase() + g.status.slice(1),
    value: g._count,
  }));

  // Monthly revenue trend (last 6 months)
  const monthlyRevenue = {};
  for (const inv of allInvoices) {
    const monthKey = new Date(inv.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short" });
    monthlyRevenue[monthKey] = (monthlyRevenue[monthKey] || 0) + inv.totalAmount;
  }
  const revenueTrend = Object.entries(monthlyRevenue)
    .map(([month, amount]) => ({ month, amount: Math.round(amount * 100) / 100 }));

  return NextResponse.json({
    stats: {
      totalHoursThisWeek: Math.round(totalHoursThisWeek * 100) / 100,
      revenueThisWeek: Math.round(revenueThisWeek * 100) / 100,
      pendingApprovals: pendingTimesheets,
      overdueInvoices: overdueInvoices.length,
      overdueTotal: Math.round(overdueTotal * 100) / 100,
    },
    charts: {
      weeklyRevenue: weeklyRevenueChart,
      hoursByBusiness,
      statusBreakdown,
      revenueTrend,
    },
  });
}
