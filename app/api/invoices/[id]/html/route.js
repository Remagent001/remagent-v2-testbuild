import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET — printable HTML invoice
export async function GET(request, { params }) {
  const session = await auth();
  if (session?.user?.role === "PROFESSIONAL") {
    return new Response("Forbidden", { status: 403 });
  }

  const { id } = await params;

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: { lineItems: true },
  });

  if (!invoice) {
    return new Response("Invoice not found", { status: 404 });
  }

  const business = await prisma.user.findUnique({
    where: { id: invoice.businessId },
    select: {
      businessProfile: {
        select: { businessName: true, fullAddress: true, city: true, state: true, zip: true, phone: true },
      },
    },
  });

  const biz = business?.businessProfile || {};
  const ws = new Date(invoice.weekStart).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  const we = new Date(invoice.weekEnd).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  const dueDate = new Date(invoice.dueDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  const issueDate = new Date(invoice.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  const fmt = (v) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(v);

  const lineRows = invoice.lineItems
    .map(
      (li) => `
    <tr>
      <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0">${li.professionalName}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0">${li.positionTitle}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;text-align:right">${li.regularHrs + li.afterHrs + li.holidayHrs}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;text-align:right">${fmt(li.subtotal)}</td>
    </tr>
    ${li.regularHrs > 0 ? `<tr style="font-size:12px;color:#64748b"><td></td><td style="padding:2px 12px">Regular: ${li.regularHrs}h × ${fmt(li.regularRate)}/hr</td><td style="padding:2px 12px;text-align:right">${li.regularHrs}</td><td style="padding:2px 12px;text-align:right">${fmt(li.regularAmount)}</td></tr>` : ""}
    ${li.afterHrs > 0 ? `<tr style="font-size:12px;color:#64748b"><td></td><td style="padding:2px 12px">After Hours: ${li.afterHrs}h × ${fmt(li.afterHoursRate)}/hr</td><td style="padding:2px 12px;text-align:right">${li.afterHrs}</td><td style="padding:2px 12px;text-align:right">${fmt(li.afterHrsAmount)}</td></tr>` : ""}
    ${li.holidayHrs > 0 ? `<tr style="font-size:12px;color:#64748b"><td></td><td style="padding:2px 12px">Holiday: ${li.holidayHrs}h × ${fmt(li.holidayRate)}/hr</td><td style="padding:2px 12px;text-align:right">${li.holidayHrs}</td><td style="padding:2px 12px;text-align:right">${fmt(li.holidayAmount)}</td></tr>` : ""}`
    )
    .join("");

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Invoice ${invoice.invoiceNumber}</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif; color:#0b1f3a; padding:40px; max-width:800px; margin:0 auto; }
    @media print {
      body { padding:20px; }
      .no-print { display:none !important; }
    }
  </style>
</head>
<body>
  <div class="no-print" style="text-align:right;margin-bottom:20px">
    <button onclick="window.print()" style="padding:10px 24px;background:#0fd4b0;color:#0b1f3a;border:none;border-radius:8px;font-weight:700;font-size:14px;cursor:pointer">
      Print Invoice
    </button>
  </div>

  <!-- Header -->
  <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:40px">
    <div>
      <div style="font-size:24px;font-weight:800;margin-bottom:4px">
        <span style="display:inline-block;background:linear-gradient(135deg,#0fd4b0,#06b6d4);width:32px;height:32px;border-radius:8px;text-align:center;line-height:32px;font-size:16px;color:#0b1f3a;vertical-align:middle;margin-right:8px">R</span>
        rem<span style="color:#0fd4b0">agent</span>
      </div>
      <div style="font-size:12px;color:#64748b;margin-top:4px">Remagent Employment Professionals</div>
    </div>
    <div style="text-align:right">
      <div style="font-size:28px;font-weight:800;color:#0b1f3a">INVOICE</div>
      <div style="font-size:14px;color:#64748b;margin-top:4px">${invoice.invoiceNumber}</div>
    </div>
  </div>

  <!-- Info grid -->
  <div style="display:flex;justify-content:space-between;margin-bottom:32px;gap:40px">
    <div>
      <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.05em;color:#64748b;font-weight:600;margin-bottom:6px">Bill To</div>
      <div style="font-weight:700;font-size:16px">${biz.businessName || "Business"}</div>
      ${biz.fullAddress ? `<div style="font-size:13px;color:#475569;margin-top:2px">${biz.fullAddress}</div>` : ""}
      ${biz.city ? `<div style="font-size:13px;color:#475569">${biz.city}${biz.state ? `, ${biz.state}` : ""} ${biz.zip || ""}</div>` : ""}
    </div>
    <div style="text-align:right">
      <div style="margin-bottom:8px">
        <span style="font-size:12px;color:#64748b">Issue Date:</span>
        <span style="font-size:13px;font-weight:600;margin-left:8px">${issueDate}</span>
      </div>
      <div style="margin-bottom:8px">
        <span style="font-size:12px;color:#64748b">Due Date:</span>
        <span style="font-size:13px;font-weight:600;margin-left:8px">${dueDate}</span>
      </div>
      <div>
        <span style="font-size:12px;color:#64748b">Period:</span>
        <span style="font-size:13px;font-weight:600;margin-left:8px">${ws} – ${we}</span>
      </div>
    </div>
  </div>

  <!-- Line items -->
  <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
    <thead>
      <tr style="background:#f8fafc">
        <th style="padding:10px 12px;text-align:left;font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;border-bottom:2px solid #e2e8f0">Professional</th>
        <th style="padding:10px 12px;text-align:left;font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;border-bottom:2px solid #e2e8f0">Position</th>
        <th style="padding:10px 12px;text-align:right;font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;border-bottom:2px solid #e2e8f0">Hours</th>
        <th style="padding:10px 12px;text-align:right;font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;border-bottom:2px solid #e2e8f0">Amount</th>
      </tr>
    </thead>
    <tbody>
      ${lineRows}
    </tbody>
  </table>

  <!-- Totals -->
  <div style="display:flex;justify-content:flex-end">
    <div style="width:280px">
      <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #e2e8f0">
        <span style="font-size:14px;color:#475569">Subtotal</span>
        <span style="font-size:14px;font-weight:600">${fmt(invoice.subtotal)}</span>
      </div>
      <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #e2e8f0">
        <span style="font-size:14px;color:#475569">Admin Fee (${invoice.adminMarkupPct}%)</span>
        <span style="font-size:14px">${fmt(invoice.adminFee)}</span>
      </div>
      <div style="display:flex;justify-content:space-between;padding:12px 0;margin-top:4px">
        <span style="font-size:18px;font-weight:800">Total Due</span>
        <span style="font-size:18px;font-weight:800;color:#0fd4b0">${fmt(invoice.totalAmount)}</span>
      </div>
    </div>
  </div>

  <!-- Footer -->
  <div style="margin-top:40px;padding-top:20px;border-top:1px solid #e2e8f0;font-size:12px;color:#94a3b8">
    <p>Payment Terms: Net 30</p>
    <p style="margin-top:4px">Currency: ${invoice.currency}</p>
    ${invoice.status === "paid" ? `<p style="margin-top:8px;color:#065f46;font-weight:700;font-size:14px">PAID — ${new Date(invoice.paidAt).toLocaleDateString("en-US")}</p>` : ""}
  </div>
</body>
</html>`;

  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
