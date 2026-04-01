"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function InvoicesClient() {
  const { data: session } = useSession();
  const router = useRouter();
  const isAdmin = session?.user?.role === "ADMIN";
  const isPro = session?.user?.role === "PROFESSIONAL";

  useEffect(() => {
    if (isPro) router.replace("/dashboard");
  }, [isPro, router]);

  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    fetch(`/api/invoices?${params}`)
      .then((r) => r.json())
      .then((data) => setInvoices(data.invoices || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [statusFilter]);

  const formatCurrency = (val) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(val);

  const formatDate = (d) =>
    new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  const formatWeek = (ws, we) => {
    const s = new Date(ws);
    const e = new Date(we);
    const opts = { month: "short", day: "numeric" };
    return `${s.toLocaleDateString("en-US", opts)} – ${e.toLocaleDateString("en-US", opts)}`;
  };

  const statusBadge = (status, dueDate) => {
    // Check overdue
    const isOverdue = status === "due" && new Date(dueDate) < new Date();
    const effectiveStatus = isOverdue ? "overdue" : status;
    const styles = {
      due: { bg: "#fef3c7", color: "#92400e" },
      paid: { bg: "#d1fae5", color: "#065f46" },
      overdue: { bg: "#fee2e2", color: "#991b1b" },
      cancelled: { bg: "#f1f5f9", color: "#64748b" },
    };
    const s = styles[effectiveStatus] || styles.due;
    return (
      <span style={{
        fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase",
        letterSpacing: "0.04em", padding: "2px 8px", borderRadius: 4,
        background: s.bg, color: s.color,
      }}>
        {effectiveStatus.charAt(0).toUpperCase() + effectiveStatus.slice(1)}
      </span>
    );
  };

  const handleMarkPaid = async (invoiceId) => {
    if (!confirm("Mark this invoice as paid?")) return;
    await fetch("/api/invoices", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ invoiceId, status: "paid" }),
    });
    setStatusFilter(statusFilter); // trigger re-fetch
    // Quick refetch
    const res = await fetch(`/api/invoices?${statusFilter ? `status=${statusFilter}` : ""}`);
    const data = await res.json();
    setInvoices(data.invoices || []);
  };

  const STATUS_TABS = [
    { key: "", label: "All" },
    { key: "due", label: "Due" },
    { key: "paid", label: "Paid" },
  ];

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Invoices</h1>
        <p className="page-subtitle">
          {isPro ? "View invoices for your work." : "Manage invoices and payments."}
        </p>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: 20, display: "flex", gap: 4 }}>
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key)}
            style={{
              padding: "6px 14px", fontSize: "0.8rem", fontWeight: 600,
              borderRadius: 6, border: "1.5px solid",
              borderColor: statusFilter === tab.key ? "var(--teal)" : "var(--gray-200)",
              background: statusFilter === tab.key ? "var(--teal-dim)" : "var(--white)",
              color: statusFilter === tab.key ? "var(--teal-dark)" : "var(--gray-600)",
              cursor: "pointer",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="card" style={{ textAlign: "center", padding: 40, color: "var(--gray-400)" }}>Loading...</div>
      ) : invoices.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: 40, color: "var(--gray-400)" }}>No invoices found.</div>
      ) : (
        <div className="card">
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid var(--gray-200)" }}>
                  <th style={thStyle}>Invoice #</th>
                  <th style={thStyle}>{isPro ? "Business" : "Week"}</th>
                  {!isPro && <th style={thStyle}>Professionals</th>}
                  <th style={{ ...thStyle, textAlign: "right" }}>Amount</th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>Due Date</th>
                  <th style={{ ...thStyle, width: 120 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id} style={{ borderBottom: "1px solid var(--gray-100)" }}>
                    <td style={{ ...tdStyle, fontWeight: 700 }}>{inv.invoiceNumber}</td>
                    <td style={tdStyle}>
                      {isPro
                        ? inv.business?.businessProfile?.businessName || "Business"
                        : formatWeek(inv.weekStart, inv.weekEnd)}
                    </td>
                    {!isPro && (
                      <td style={{ ...tdStyle, fontSize: "0.78rem", color: "var(--gray-500)" }}>
                        {inv.lineItems?.map((li) => li.professionalName).join(", ")}
                      </td>
                    )}
                    <td style={{ ...tdStyle, textAlign: "right", fontWeight: 700 }}>
                      {formatCurrency(isPro ? inv.subtotal : inv.totalAmount)}
                    </td>
                    <td style={tdStyle}>{statusBadge(inv.status, inv.dueDate)}</td>
                    <td style={{ ...tdStyle, fontSize: "0.78rem" }}>{formatDate(inv.dueDate)}</td>
                    <td style={tdStyle}>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button
                          onClick={() => router.push(`/invoices/${inv.id}`)}
                          style={{ background: "none", border: "none", color: "var(--teal-dark)", cursor: "pointer", fontSize: "0.78rem", fontWeight: 600 }}
                        >
                          View
                        </button>
                        <button
                          onClick={() => window.open(`/api/invoices/${inv.id}/html`, "_blank")}
                          style={{ background: "none", border: "none", color: "var(--gray-500)", cursor: "pointer", fontSize: "0.78rem", fontWeight: 600 }}
                        >
                          Print
                        </button>
                        {isAdmin && inv.status === "due" && (
                          <button
                            onClick={() => handleMarkPaid(inv.id)}
                            style={{ background: "none", border: "none", color: "#10b981", cursor: "pointer", fontSize: "0.78rem", fontWeight: 600 }}
                          >
                            Mark Paid
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

const thStyle = {
  textAlign: "left", padding: "8px 10px", fontWeight: 600,
  color: "var(--gray-500)", fontSize: "0.7rem",
  textTransform: "uppercase", letterSpacing: "0.04em",
};
const tdStyle = { padding: "10px 10px", color: "var(--gray-700)" };
