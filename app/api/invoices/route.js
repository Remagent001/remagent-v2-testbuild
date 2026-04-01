import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET — list invoices (role-adaptive)
export async function GET(request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Professionals should not access invoices
  if (session.user.role === "PROFESSIONAL") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  const where = {};
  if (session.user.role === "BUSINESS") {
    where.businessId = session.user.id;
  }
  // ADMIN sees all

  if (status) where.status = status;

  const invoices = await prisma.invoice.findMany({
    where,
    include: {
      lineItems: {
        select: {
          id: true,
          professionalName: true,
          positionTitle: true,
          regularHrs: true,
          afterHrs: true,
          holidayHrs: true,
          subtotal: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Enrich with business info
  const bizIds = [...new Set(invoices.map((i) => i.businessId))];
  const businesses = await prisma.user.findMany({
    where: { id: { in: bizIds } },
    select: { id: true, businessProfile: { select: { businessName: true } } },
  });
  const bizMap = Object.fromEntries(businesses.map((b) => [b.id, b]));

  const enriched = invoices.map((inv) => ({
    ...inv,
    business: bizMap[inv.businessId] || null,
  }));

  return NextResponse.json({ invoices: enriched });
}

// PUT — admin: mark paid or cancelled
export async function PUT(request) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const { invoiceId, status: newStatus } = await request.json();
  if (!invoiceId || !["paid", "cancelled"].includes(newStatus)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
  if (!invoice) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  const updateData = { status: newStatus };
  if (newStatus === "paid") updateData.paidAt = new Date();

  await prisma.invoice.update({
    where: { id: invoiceId },
    data: updateData,
  });

  return NextResponse.json({ success: true });
}
