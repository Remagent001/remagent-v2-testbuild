import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

const ses = new SESClient({
  region: process.env.AWS_REGION || "us-east-2",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const FROM_EMAIL = process.env.SES_FROM_EMAIL || "noreply@remagent.com";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://remagentemploymentprofessionals.com";

export async function sendEmail(to, subject, htmlBody, textBody) {
  try {
    await ses.send(
      new SendEmailCommand({
        Source: `Remagent <${FROM_EMAIL}>`,
        Destination: { ToAddresses: [to] },
        Message: {
          Subject: { Data: subject },
          Body: {
            Html: { Data: htmlBody },
            ...(textBody ? { Text: { Data: textBody } } : {}),
          },
        },
      })
    );
    return true;
  } catch (err) {
    console.error("Email send error:", err.message);
    return false;
  }
}

// ── Pre-built notification emails ──

export async function sendWeeklyTimesheetEmail(toEmail, { businessName, weekLabel, professionals }) {
  const rows = professionals
    .map(
      (p) => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;font-size:14px;color:#334155">${p.name}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;font-size:14px;color:#334155">${p.position}</td>
        ${["mon", "tue", "wed", "thu", "fri", "sat", "sun"]
          .map((d) => `<td style="padding:8px 6px;border-bottom:1px solid #e2e8f0;font-size:14px;color:#334155;text-align:center">${p.daily[d] || "—"}</td>`)
          .join("")}
        <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;font-size:14px;font-weight:700;color:#0b1f3a;text-align:center">${p.totalHrs}</td>
      </tr>`
    )
    .join("");

  const html = emailWrapper(`
    <h2 style="margin:0 0 4px;font-size:20px;color:#0b1f3a">Weekly Timesheet Summary</h2>
    <p style="margin:0 0 20px;font-size:14px;color:#64748b">${weekLabel} &mdash; ${businessName}</p>
    <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
      <thead>
        <tr style="background:#f8fafc">
          <th style="padding:8px 12px;text-align:left;font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;border-bottom:2px solid #e2e8f0">Professional</th>
          <th style="padding:8px 12px;text-align:left;font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;border-bottom:2px solid #e2e8f0">Position</th>
          <th style="padding:8px 6px;text-align:center;font-size:11px;color:#64748b;text-transform:uppercase;border-bottom:2px solid #e2e8f0">Mon</th>
          <th style="padding:8px 6px;text-align:center;font-size:11px;color:#64748b;text-transform:uppercase;border-bottom:2px solid #e2e8f0">Tue</th>
          <th style="padding:8px 6px;text-align:center;font-size:11px;color:#64748b;text-transform:uppercase;border-bottom:2px solid #e2e8f0">Wed</th>
          <th style="padding:8px 6px;text-align:center;font-size:11px;color:#64748b;text-transform:uppercase;border-bottom:2px solid #e2e8f0">Thu</th>
          <th style="padding:8px 6px;text-align:center;font-size:11px;color:#64748b;text-transform:uppercase;border-bottom:2px solid #e2e8f0">Fri</th>
          <th style="padding:8px 6px;text-align:center;font-size:11px;color:#64748b;text-transform:uppercase;border-bottom:2px solid #e2e8f0">Sat</th>
          <th style="padding:8px 6px;text-align:center;font-size:11px;color:#64748b;text-transform:uppercase;border-bottom:2px solid #e2e8f0">Sun</th>
          <th style="padding:8px 12px;text-align:center;font-size:11px;color:#64748b;text-transform:uppercase;border-bottom:2px solid #e2e8f0">Total</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    <div style="text-align:center">
      <a href="${APP_URL}/timesheets" style="display:inline-block;padding:12px 32px;background:#0fd4b0;color:#0b1f3a;font-size:14px;font-weight:700;text-decoration:none;border-radius:8px">Review &amp; Approve on Remagent</a>
    </div>
  `);

  return sendEmail(toEmail, `Weekly Timesheet Summary — ${weekLabel}`, html);
}

export async function sendTimesheetApprovedEmail(toEmail, { professionalName, weekLabel, businessName, totalHrs, amount }) {
  const html = emailWrapper(`
    <h2 style="margin:0 0 4px;font-size:20px;color:#0b1f3a">Timesheet Approved</h2>
    <p style="margin:0 0 20px;font-size:14px;color:#64748b">${weekLabel}</p>
    <p style="font-size:14px;color:#334155;line-height:1.6">
      Hi ${professionalName},<br><br>
      Your timesheet for <strong>${weekLabel}</strong> has been approved by <strong>${businessName}</strong>.
    </p>
    <div style="background:#f0fdf4;border-radius:8px;padding:16px;margin:16px 0">
      <div style="font-size:13px;color:#065f46;font-weight:600">Total Hours: ${totalHrs}h &mdash; Amount: $${amount}</div>
    </div>
    <div style="text-align:center">
      <a href="${APP_URL}/timesheets" style="display:inline-block;padding:12px 32px;background:#0fd4b0;color:#0b1f3a;font-size:14px;font-weight:700;text-decoration:none;border-radius:8px">View Timesheet</a>
    </div>
  `);

  return sendEmail(toEmail, `Timesheet Approved — ${weekLabel}`, html);
}

export async function sendTimesheetReviewEmail(toEmail, { professionalName, weekLabel, businessName, reason }) {
  const html = emailWrapper(`
    <h2 style="margin:0 0 4px;font-size:20px;color:#0b1f3a">Timesheet Needs Review</h2>
    <p style="margin:0 0 20px;font-size:14px;color:#64748b">${weekLabel}</p>
    <p style="font-size:14px;color:#334155;line-height:1.6">
      Hi ${professionalName},<br><br>
      <strong>${businessName}</strong> has requested a review of your timesheet for <strong>${weekLabel}</strong>.
    </p>
    <div style="background:#fef2f2;border-left:4px solid #ef4444;border-radius:4px;padding:12px 16px;margin:16px 0">
      <div style="font-size:13px;color:#991b1b;font-weight:600">Reason:</div>
      <div style="font-size:14px;color:#7f1d1d;margin-top:4px">${reason}</div>
    </div>
    <p style="font-size:14px;color:#334155">Please review your entries, make any corrections, and resubmit.</p>
    <div style="text-align:center">
      <a href="${APP_URL}/timesheets" style="display:inline-block;padding:12px 32px;background:#0fd4b0;color:#0b1f3a;font-size:14px;font-weight:700;text-decoration:none;border-radius:8px">Review & Resubmit</a>
    </div>
  `);

  return sendEmail(toEmail, `Timesheet Needs Review — ${weekLabel}`, html);
}

export async function sendTimesheetResubmittedEmail(toEmail, { businessName, professionalName, weekLabel }) {
  const html = emailWrapper(`
    <h2 style="margin:0 0 4px;font-size:20px;color:#0b1f3a">Timesheet Resubmitted</h2>
    <p style="margin:0 0 20px;font-size:14px;color:#64748b">${weekLabel}</p>
    <p style="font-size:14px;color:#334155;line-height:1.6">
      Hi,<br><br>
      <strong>${professionalName}</strong> has resubmitted their timesheet for <strong>${weekLabel}</strong> for your review.
    </p>
    <div style="text-align:center;margin-top:20px">
      <a href="${APP_URL}/timesheets" style="display:inline-block;padding:12px 32px;background:#0fd4b0;color:#0b1f3a;font-size:14px;font-weight:700;text-decoration:none;border-radius:8px">Review Timesheet</a>
    </div>
  `);

  return sendEmail(toEmail, `Timesheet Resubmitted — ${professionalName} — ${weekLabel}`, html);
}

export async function sendInvoiceEmail(toEmail, { businessName, invoiceNumber, weekLabel, totalAmount }) {
  const html = emailWrapper(`
    <h2 style="margin:0 0 4px;font-size:20px;color:#0b1f3a">Invoice Ready</h2>
    <p style="margin:0 0 20px;font-size:14px;color:#64748b">${invoiceNumber} &mdash; ${weekLabel}</p>
    <p style="font-size:14px;color:#334155;line-height:1.6">
      Hi ${businessName},<br><br>
      Your invoice for <strong>${weekLabel}</strong> is ready.
    </p>
    <div style="background:#f8fafc;border-radius:8px;padding:16px;margin:16px 0;text-align:center">
      <div style="font-size:13px;color:#64748b;margin-bottom:4px">Amount Due</div>
      <div style="font-size:28px;font-weight:800;color:#0b1f3a">$${totalAmount}</div>
      <div style="font-size:12px;color:#64748b;margin-top:4px">Due Net 30</div>
    </div>
    <div style="text-align:center">
      <a href="${APP_URL}/invoices" style="display:inline-block;padding:12px 32px;background:#0fd4b0;color:#0b1f3a;font-size:14px;font-weight:700;text-decoration:none;border-radius:8px">View Invoice</a>
    </div>
  `);

  return sendEmail(toEmail, `Invoice ${invoiceNumber} — $${totalAmount} — ${weekLabel}`, html);
}

// ── Email wrapper with Remagent branding ──

function emailWrapper(content) {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <div style="max-width:600px;margin:0 auto;padding:24px 16px">
    <!-- Header -->
    <div style="text-align:center;margin-bottom:24px">
      <div style="display:inline-block;background:linear-gradient(135deg,#0fd4b0,#06b6d4);width:40px;height:40px;border-radius:10px;line-height:40px;text-align:center;font-weight:900;font-size:18px;color:#0b1f3a;vertical-align:middle">R</div>
      <span style="font-size:18px;font-weight:800;color:#0b1f3a;margin-left:8px;vertical-align:middle">rem<span style="color:#0fd4b0">agent</span></span>
    </div>
    <!-- Content -->
    <div style="background:#ffffff;border-radius:12px;padding:32px;border:1px solid #e2e8f0">
      ${content}
    </div>
    <!-- Footer -->
    <div style="text-align:center;margin-top:24px;font-size:12px;color:#94a3b8">
      <p>&copy; ${new Date().getFullYear()} Remagent Employment Professionals</p>
      <p><a href="${APP_URL}" style="color:#0fd4b0;text-decoration:none">remagentemploymentprofessionals.com</a></p>
    </div>
  </div>
</body>
</html>`;
}
