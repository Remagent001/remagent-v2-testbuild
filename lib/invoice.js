import { sendInvoiceEmail } from "./email";

/**
 * Generate a sequential invoice number: INV-YYYY-NNNN
 */
async function generateInvoiceNumber(prisma) {
  const year = new Date().getFullYear();
  const prefix = `INV-${year}-`;

  const lastInvoice = await prisma.invoice.findFirst({
    where: { invoiceNumber: { startsWith: prefix } },
    orderBy: { invoiceNumber: "desc" },
    select: { invoiceNumber: true },
  });

  let seq = 1;
  if (lastInvoice) {
    const lastSeq = parseInt(lastInvoice.invoiceNumber.replace(prefix, ""), 10);
    if (!isNaN(lastSeq)) seq = lastSeq + 1;
  }

  return `${prefix}${String(seq).padStart(4, "0")}`;
}

/**
 * Generate an invoice for a business for a specific week.
 * Triggered when ALL timesheets for that business+week are approved.
 * Creates one Invoice with one InvoiceLineItem per professional.
 *
 * @param {object} prisma - Prisma client
 * @param {string} businessId
 * @param {Date} weekStart
 * @returns {object|null} The created Invoice, or null if not all timesheets approved
 */
export async function generateInvoice(prisma, businessId, weekStart) {
  // Find all timesheets for this business + week
  const timesheets = await prisma.weeklyTimesheet.findMany({
    where: { businessId, weekStart },
    include: {
      entries: { where: { type: "work" }, select: { id: true } },
    },
  });

  if (timesheets.length === 0) return null;

  // Check that ALL are approved
  const allApproved = timesheets.every((ts) => ts.status === "approved");
  if (!allApproved) return null;

  // Check if an invoice already exists for this business + week
  const existing = await prisma.invoice.findFirst({
    where: {
      businessId,
      weekStart,
    },
  });
  if (existing) return existing; // Already invoiced

  // Load hire + professional data for each timesheet
  const lineItemData = [];
  let subtotal = 0;

  for (const ts of timesheets) {
    const hire = await prisma.hire.findUnique({
      where: { id: ts.hireId },
      include: { position: { select: { title: true } } },
    });
    const pro = await prisma.user.findUnique({
      where: { id: ts.professionalId },
      select: { firstName: true, lastName: true },
    });

    const proName = pro ? `${pro.firstName} ${pro.lastName}` : "Unknown";
    const posTitle = hire?.position?.title || "Position";
    const regularRate = hire?.regularRate || 0;
    const afterHoursRate = hire?.afterHoursRate || regularRate;
    const holidayRate = hire?.holidayRate || regularRate;

    lineItemData.push({
      timesheetId: ts.id,
      hireId: ts.hireId,
      professionalId: ts.professionalId,
      professionalName: proName,
      positionTitle: posTitle,
      regularHrs: ts.totalRegularHrs,
      regularRate,
      regularAmount: ts.regularAmount,
      afterHrs: ts.totalAfterHrs,
      afterHoursRate,
      afterHrsAmount: ts.afterHrsAmount,
      holidayHrs: ts.totalHolidayHrs,
      holidayRate,
      holidayAmount: ts.holidayAmount,
      subtotal: ts.subtotal,
    });

    subtotal += ts.subtotal;
  }

  // Use the first timesheet's admin markup (should be consistent per business)
  const adminMarkupPct = timesheets[0].adminMarkup;
  const adminFee = Math.round(subtotal * (adminMarkupPct / 100) * 100) / 100;
  const totalAmount = Math.round((subtotal + adminFee) * 100) / 100;

  const invoiceNumber = await generateInvoiceNumber(prisma);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 30);

  // Create invoice + line items in a transaction
  const invoice = await prisma.$transaction(async (tx) => {
    const inv = await tx.invoice.create({
      data: {
        invoiceNumber,
        businessId,
        weekStart,
        weekEnd,
        subtotal: Math.round(subtotal * 100) / 100,
        adminMarkupPct,
        adminFee,
        totalAmount,
        dueDate,
        lineItems: {
          create: lineItemData,
        },
      },
      include: { lineItems: true },
    });

    // Mark all timesheets as invoiced
    await tx.weeklyTimesheet.updateMany({
      where: {
        id: { in: timesheets.map((ts) => ts.id) },
      },
      data: { status: "invoiced" },
    });

    return inv;
  });

  // Send invoice email to business
  const bizUser = await prisma.user.findUnique({
    where: { id: businessId },
    select: {
      email: true,
      businessProfile: { select: { businessName: true } },
    },
  });
  if (bizUser?.email) {
    const wsLabel = new Date(weekStart).toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const weLabel = weekEnd.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const weekLabel = `${wsLabel} – ${weLabel}, ${new Date(weekStart).getFullYear()}`;
    sendInvoiceEmail(bizUser.email, {
      businessName: bizUser.businessProfile?.businessName || "Business",
      invoiceNumber,
      weekLabel,
      totalAmount: totalAmount.toFixed(2),
    }).catch(() => {});
  }

  return invoice;
}

/**
 * Try to generate invoice after a timesheet is approved.
 * Only creates invoice if ALL timesheets for this business+week are approved.
 */
export async function tryGenerateInvoice(prisma, businessId, weekStart) {
  return generateInvoice(prisma, businessId, weekStart);
}
