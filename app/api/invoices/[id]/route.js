import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET — single invoice detail
export async function GET(request, { params }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Professionals should not access invoices
  if (session.user.role === "PROFESSIONAL") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      lineItems: true,
    },
  });

  if (!invoice) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  // Authorization
  if (
    session.user.role !== "ADMIN" &&
    invoice.businessId !== session.user.id
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Enrich with business info
  const business = await prisma.user.findUnique({
    where: { id: invoice.businessId },
    select: {
      firstName: true,
      lastName: true,
      email: true,
      businessProfile: { select: { businessName: true, fullAddress: true, city: true, state: true, zip: true } },
    },
  });

  return NextResponse.json({ invoice: { ...invoice, business } });
}
