"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function InvoiceDetailClient({ invoiceId }) {
  const { data: session } = useSession();
  const router = useRouter();
  const isAdmin = session?.user?.role === "ADMIN";
  const isPro = session?.user?.role === "PROFESSIONAL";

  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/invoices/${invoiceId}`)
      .then((r) => r.json())
      .then((data) => setInvoice(data.invoice))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [invoiceId]);

  const fmt = (val) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(val);

  const formatDate = (d) =>
    new Date(d).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  const handleMarkPaid = async () => {
    if (!confirm("Mark this invoice as paid?")) return;
    await fetch("/api/invoices", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ invoiceId, status: "paid" }),
    });
    const res = await fetch(`/api/invoices/${invoiceId}`);
    const data = await res.json();
    setInvoice(data.invoice);
  };

  if (loading) {
    return <div className="card" style={{ textAlign: "center", padding: 40, color: "var(--gray-400)" }}>Loading...</div>;
  }
  if (!invoice) {
    return <div className="card" style={{ textAlign: "center", padding: 40, color: "var(--gray-400)" }}>Invoice not found.</div>;
  }

  const biz = invoice.business?.businessProfile || {};
  const isOverdue = invoice.status === "due" && new Date(invoice.dueDate) < new Date();

  const statusStyles = {
    due: { bg: "#fef3c7", color: "#92400e" },
    paid: { bg: "#d1fae5", color: "#065f46" },
    overdue: { bg: "#fee2e2", color: "#991b1b" },
    cancelled: { bg: "#f1f5f9", color: "#64748b" },
  };
  const effectiveStatus = isOverdue ? "overdue" : invoice.status;
  const ss = statusStyles[effectiveStatus] || statusStyles.due;

  return (
    <div>
      <button
        onClick={() => router.push("/invoices")}
        style={{ background: "none", border: "none", color: "var(--teal-dark)", cursor: "pointer", fontSize: "0.85rem", fontWeight: 600, marginBottom: 12, padding: 0 }}
      >
        &larr; Back to Invoices
      </button>

      {/* Header card */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700 }}>{invoice.invoiceNumber}</h2>
            <div style={{ fontSize: "0.85rem", color: "var(--gray-500)", marginTop: 4 }}>
              {biz.businessName || "Business"} — {formatDate(invoice.weekStart)} to {formatDate(invoice.weekEnd)}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{
              fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase",
              letterSpacing: "0.04em", padding: "3px 10px", borderRadius: 4,
              background: ss.bg, color: ss.color,
            }}>
              {effectiveStatus.charAt(0).toUpperCase() + effectiveStatus.slice(1)}
            </span>
          </div>
        </div>

        <div style={{ display: "flex", gap: 24, marginTop: 16, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: "0.7rem", color: "var(--gray-400)", textTransform: "uppercase", fontWeight: 600 }}>Issued</div>
            <div style={{ fontSize: "0.85rem", fontWeight: 600 }}>{formatDate(invoice.createdAt)}</div>
          </div>
          <div>
            <div style={{ fontSize: "0.7rem", color: "var(--gray-400)", textTransform: "uppercase", fontWeight: 600 }}>Due</div>
            <div style={{ fontSize: "0.85rem", fontWeight: 600, color: isOverdue ? "#991b1b" : "inherit" }}>{formatDate(invoice.dueDate)}</div>
          </div>
          {invoice.paidAt && (
            <div>
              <div style={{ fontSize: "0.7rem", color: "var(--gray-400)", textTransform: "uppercase", fontWeight: 600 }}>Paid</div>
              <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#065f46" }}>{formatDate(invoice.paidAt)}</div>
            </div>
          )}
        </div>
      </div>

      {/* Line items */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-title" style={{ marginBottom: 12 }}>Line Items</div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid var(--gray-200)" }}>
              <th style={thStyle}>Professional</th>
              <th style={thStyle}>Position</th>
              <th style={{ ...thStyle, textAlign: "right" }}>Hours</th>
              <th style={{ ...thStyle, textAlign: "right" }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {invoice.lineItems.map((li) => {
              const totalHrs = li.regularHrs + li.afterHrs + li.holidayHrs;
              return (
                <tr key={li.id} style={{ borderBottom: "1px solid var(--gray-100)" }}>
                  <td style={{ ...tdStyle, fontWeight: 600 }}>{li.professionalName}</td>
                  <td style={{ ...tdStyle, color: "var(--gray-500)" }}>{li.positionTitle}</td>
                  <td style={{ ...tdStyle, textAlign: "right" }}>{Math.round(totalHrs * 100) / 100}</td>
                  <td style={{ ...tdStyle, textAlign: "right", fontWeight: 600 }}>{fmt(li.subtotal)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Rate breakdown per line item */}
        {invoice.lineItems.map((li) => (
          <div key={li.id + "-detail"} style={{ marginTop: 8, paddingLeft: 12, borderLeft: "3px solid var(--gray-100)" }}>
            <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--gray-500)", marginBottom: 4 }}>{li.professionalName} — Rate Breakdown</div>
            {li.regularHrs > 0 && (
              <div style={{ fontSize: "0.78rem", color: "var(--gray-600)" }}>
                Regular: {li.regularHrs}h × {fmt(li.regularRate)}/hr = {fmt(li.regularAmount)}
              </div>
            )}
            {li.afterHrs > 0 && (
              <div style={{ fontSize: "0.78rem", color: "var(--gray-600)" }}>
                After Hours: {li.afterHrs}h × {fmt(li.afterHoursRate)}/hr = {fmt(li.afterHrsAmount)}
              </div>
            )}
            {li.holidayHrs > 0 && (
              <div style={{ fontSize: "0.78rem", color: "var(--gray-600)" }}>
                Holiday: {li.holidayHrs}h × {fmt(li.holidayRate)}/hr = {fmt(li.holidayAmount)}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ maxWidth: 320, marginLeft: "auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--gray-100)" }}>
            <span style={{ color: "var(--gray-500)" }}>Subtotal</span>
            <span style={{ fontWeight: 600 }}>{fmt(invoice.subtotal)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--gray-100)" }}>
            <span style={{ color: "var(--gray-500)" }}>Admin Fee ({invoice.adminMarkupPct}%)</span>
            <span>{fmt(invoice.adminFee)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0" }}>
            <span style={{ fontSize: "1.1rem", fontWeight: 800 }}>Total Due</span>
            <span style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--teal-dark)" }}>
              {fmt(isPro ? invoice.subtotal : invoice.totalAmount)}
            </span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 8 }}>
        <button
          className="btn-primary"
          onClick={() => window.open(`/api/invoices/${invoiceId}/html`, "_blank")}
          style={{ width: "auto", padding: "10px 24px" }}
        >
          Print Invoice
        </button>
        {isAdmin && invoice.status === "due" && (
          <button
            className="btn-secondary"
            onClick={handleMarkPaid}
            style={{ width: "auto", padding: "10px 24px", color: "#10b981", borderColor: "#86efac" }}
          >
            Mark as Paid
          </button>
        )}
      </div>
    </div>
  );
}

const thStyle = {
  textAlign: "left", padding: "8px 10px", fontWeight: 600,
  color: "var(--gray-500)", fontSize: "0.7rem",
  textTransform: "uppercase", letterSpacing: "0.04em",
};
const tdStyle = { padding: "10px 10px", color: "var(--gray-700)" };
