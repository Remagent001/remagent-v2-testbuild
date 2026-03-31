"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { calculateHours } from "@/lib/timesheet";

const STATUS_TABS = [
  { key: "", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "under_review", label: "Under Review" },
  { key: "invoiced", label: "Invoiced" },
];

export default function TimesheetsClient() {
  const { data: session } = useSession();
  const router = useRouter();
  const isBiz = session?.user?.role === "BUSINESS";
  const isAdmin = session?.user?.role === "ADMIN";

  const [timesheets, setTimesheets] = useState([]);
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [viewMode, setViewMode] = useState("manager"); // "manager" or "financial"

  const fetchTimesheets = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);
      const res = await fetch(`/api/timesheets?${params}`);
      const data = await res.json();
      setTimesheets(data.timesheets || []);
      setCounts(data.counts || {});
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchTimesheets();
  }, [fetchTimesheets]);

  const formatWeek = (weekStart, weekEnd) => {
    const ws = new Date(weekStart);
    const we = new Date(weekEnd);
    const opts = { month: "short", day: "numeric" };
    return `${ws.toLocaleDateString("en-US", opts)} – ${we.toLocaleDateString("en-US", opts)}, ${ws.getFullYear()}`;
  };

  const statusBadge = (status) => {
    const styles = {
      pending: { bg: "#fef3c7", color: "#92400e" },
      approved: { bg: "#d1fae5", color: "#065f46" },
      under_review: { bg: "#fee2e2", color: "#991b1b" },
      invoiced: { bg: "#dbeafe", color: "#1e40af" },
    };
    const s = styles[status] || styles.pending;
    const label = status === "under_review" ? "Under Review" : status.charAt(0).toUpperCase() + status.slice(1);
    return (
      <span style={{
        fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase",
        letterSpacing: "0.04em", padding: "2px 8px", borderRadius: 4,
        background: s.bg, color: s.color,
      }}>
        {label}
      </span>
    );
  };

  const getTotalHours = (ts) =>
    Math.round((ts.totalRegularHrs + ts.totalAfterHrs + ts.totalHolidayHrs) * 100) / 100;

  // Build daily hours from entries for manager view
  const getDailyHours = (entries) => {
    const days = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 };
    const dayMap = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    for (const entry of entries || []) {
      if (entry.endTime) {
        const d = new Date(entry.date);
        const dayName = dayMap[d.getDay()];
        const hrs = calculateHours(new Date(entry.startTime), new Date(entry.endTime), entry.breakMinutes);
        days[dayName] = Math.round((days[dayName] + hrs) * 100) / 100;
      }
    }
    return days;
  };

  const formatCurrency = (val) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(val);

  // Group timesheets by business (for admin) or just list them
  const grouped = (isBiz || isAdmin) ? groupByProfessional(timesheets) : null;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Timesheets</h1>
        <p className="page-subtitle">
          {isBiz ? "Review and approve your team's weekly hours." : "View your weekly timesheet summaries."}
        </p>
      </div>

      {/* Controls bar */}
      <div className="card" style={{ marginBottom: 20, display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
        {/* Status tabs */}
        <div style={{ display: "flex", gap: 4 }}>
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              style={{
                padding: "6px 14px",
                fontSize: "0.8rem",
                fontWeight: 600,
                borderRadius: 6,
                border: "1.5px solid",
                borderColor: statusFilter === tab.key ? "var(--teal)" : "var(--gray-200)",
                background: statusFilter === tab.key ? "var(--teal-dim)" : "var(--white)",
                color: statusFilter === tab.key ? "var(--teal-dark)" : "var(--gray-600)",
                cursor: "pointer",
              }}
            >
              {tab.label}
              {tab.key && counts[tab.key] ? ` (${counts[tab.key]})` : ""}
            </button>
          ))}
        </div>

        {/* View mode toggle (biz/admin only) */}
        {(isBiz || isAdmin) && (
          <div style={{ marginLeft: "auto", display: "flex", gap: 4 }}>
            <button
              onClick={() => setViewMode("manager")}
              style={{
                padding: "6px 14px", fontSize: "0.8rem", fontWeight: 600,
                borderRadius: 6, border: "1.5px solid",
                borderColor: viewMode === "manager" ? "var(--teal)" : "var(--gray-200)",
                background: viewMode === "manager" ? "var(--teal-dim)" : "var(--white)",
                color: viewMode === "manager" ? "var(--teal-dark)" : "var(--gray-600)",
                cursor: "pointer",
              }}
            >
              Hours View
            </button>
            <button
              onClick={() => setViewMode("financial")}
              style={{
                padding: "6px 14px", fontSize: "0.8rem", fontWeight: 600,
                borderRadius: 6, border: "1.5px solid",
                borderColor: viewMode === "financial" ? "var(--teal)" : "var(--gray-200)",
                background: viewMode === "financial" ? "var(--teal-dim)" : "var(--white)",
                color: viewMode === "financial" ? "var(--teal-dark)" : "var(--gray-600)",
                cursor: "pointer",
              }}
            >
              Financial View
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="card" style={{ textAlign: "center", padding: 40, color: "var(--gray-400)" }}>
          Loading timesheets...
        </div>
      ) : timesheets.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: 40, color: "var(--gray-400)" }}>
          No timesheets found.
        </div>
      ) : (isBiz || isAdmin) ? (
        // ── BUSINESS / ADMIN VIEW ──
        Object.entries(grouped).map(([weekKey, weekGroup]) => (
          <div key={weekKey} className="card" style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: 700, fontSize: "0.9rem", marginBottom: 16 }}>
              {weekGroup.weekLabel}
            </div>

            {viewMode === "manager" ? (
              // Manager view — hours only, daily grid
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8rem" }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid var(--gray-200)" }}>
                      <th style={thStyle}>Professional</th>
                      <th style={thStyle}>Position</th>
                      <th style={{ ...thStyle, textAlign: "center" }}>Mon</th>
                      <th style={{ ...thStyle, textAlign: "center" }}>Tue</th>
                      <th style={{ ...thStyle, textAlign: "center" }}>Wed</th>
                      <th style={{ ...thStyle, textAlign: "center" }}>Thu</th>
                      <th style={{ ...thStyle, textAlign: "center" }}>Fri</th>
                      <th style={{ ...thStyle, textAlign: "center" }}>Sat</th>
                      <th style={{ ...thStyle, textAlign: "center" }}>Sun</th>
                      <th style={{ ...thStyle, textAlign: "center" }}>Total</th>
                      <th style={thStyle}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {weekGroup.timesheets.map((ts) => {
                      const daily = getDailyHours(ts.entries);
                      const proName = ts.professional
                        ? `${ts.professional.firstName} ${ts.professional.lastName}`
                        : "Unknown";
                      return (
                        <tr
                          key={ts.id}
                          onClick={() => router.push(`/timesheets/${ts.id}`)}
                          style={{ borderBottom: "1px solid var(--gray-100)", cursor: "pointer" }}
                        >
                          <td style={tdStyle}>{proName}</td>
                          <td style={{ ...tdStyle, color: "var(--gray-500)" }}>
                            {ts.hire?.position?.title || "—"}
                          </td>
                          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                            <td key={d} style={{ ...tdStyle, textAlign: "center", fontVariantNumeric: "tabular-nums" }}>
                              {daily[d] || "—"}
                            </td>
                          ))}
                          <td style={{ ...tdStyle, textAlign: "center", fontWeight: 700 }}>
                            {getTotalHours(ts)}
                          </td>
                          <td style={tdStyle}>{statusBadge(ts.status)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              // Financial view — hours x rate = amount per professional
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8rem" }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid var(--gray-200)" }}>
                      <th style={thStyle}>Professional</th>
                      <th style={thStyle}>Position</th>
                      <th style={{ ...thStyle, textAlign: "right" }}>Regular</th>
                      <th style={{ ...thStyle, textAlign: "right" }}>After Hrs</th>
                      <th style={{ ...thStyle, textAlign: "right" }}>Holiday</th>
                      <th style={{ ...thStyle, textAlign: "right" }}>Subtotal</th>
                      <th style={thStyle}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {weekGroup.timesheets.map((ts) => {
                      const proName = ts.professional
                        ? `${ts.professional.firstName} ${ts.professional.lastName}`
                        : "Unknown";
                      return (
                        <tr
                          key={ts.id}
                          onClick={() => router.push(`/timesheets/${ts.id}`)}
                          style={{ borderBottom: "1px solid var(--gray-100)", cursor: "pointer" }}
                        >
                          <td style={tdStyle}>{proName}</td>
                          <td style={{ ...tdStyle, color: "var(--gray-500)" }}>
                            {ts.hire?.position?.title || "—"}
                          </td>
                          <td style={{ ...tdStyle, textAlign: "right" }}>
                            {ts.totalRegularHrs}h = {formatCurrency(ts.regularAmount)}
                          </td>
                          <td style={{ ...tdStyle, textAlign: "right" }}>
                            {ts.totalAfterHrs > 0 ? `${ts.totalAfterHrs}h = ${formatCurrency(ts.afterHrsAmount)}` : "—"}
                          </td>
                          <td style={{ ...tdStyle, textAlign: "right" }}>
                            {ts.totalHolidayHrs > 0 ? `${ts.totalHolidayHrs}h = ${formatCurrency(ts.holidayAmount)}` : "—"}
                          </td>
                          <td style={{ ...tdStyle, textAlign: "right", fontWeight: 700 }}>
                            {formatCurrency(ts.subtotal)}
                          </td>
                          <td style={tdStyle}>{statusBadge(ts.status)}</td>
                        </tr>
                      );
                    })}
                    {/* Totals row */}
                    <tr style={{ borderTop: "2px solid var(--gray-300)" }}>
                      <td colSpan={5} style={{ ...tdStyle, textAlign: "right", fontWeight: 700 }}>
                        Subtotal
                      </td>
                      <td style={{ ...tdStyle, textAlign: "right", fontWeight: 700 }}>
                        {formatCurrency(weekGroup.timesheets.reduce((s, t) => s + t.subtotal, 0))}
                      </td>
                      <td />
                    </tr>
                    <tr>
                      <td colSpan={5} style={{ ...tdStyle, textAlign: "right", color: "var(--gray-500)" }}>
                        Admin Fee ({weekGroup.timesheets[0]?.adminMarkup || 10}%)
                      </td>
                      <td style={{ ...tdStyle, textAlign: "right", color: "var(--gray-500)" }}>
                        {formatCurrency(weekGroup.timesheets.reduce((s, t) => s + t.adminFee, 0))}
                      </td>
                      <td />
                    </tr>
                    <tr style={{ borderTop: "1px solid var(--gray-200)" }}>
                      <td colSpan={5} style={{ ...tdStyle, textAlign: "right", fontWeight: 800, fontSize: "0.9rem" }}>
                        Total Due
                      </td>
                      <td style={{ ...tdStyle, textAlign: "right", fontWeight: 800, fontSize: "0.9rem", color: "var(--teal-dark)" }}>
                        {formatCurrency(weekGroup.timesheets.reduce((s, t) => s + t.totalAmount, 0))}
                      </td>
                      <td />
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))
      ) : (
        // ── PROFESSIONAL VIEW ──
        timesheets.map((ts) => {
          const daily = getDailyHours(ts.entries);
          const totalHrs = getTotalHours(ts);
          return (
            <div
              key={ts.id}
              className="card"
              style={{ marginBottom: 12, cursor: "pointer" }}
              onClick={() => router.push(`/timesheets/${ts.id}`)}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: "0.85rem" }}>
                    {formatWeek(ts.weekStart, ts.weekEnd)}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--gray-500)", marginTop: 2 }}>
                    {ts.business?.businessProfile?.businessName || "Unknown"} — {ts.hire?.position?.title || "Position"}
                  </div>
                </div>
                {statusBadge(ts.status)}
              </div>

              {/* Mini daily grid */}
              <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                  <div key={d} style={{ textAlign: "center", flex: 1 }}>
                    <div style={{ fontSize: "0.6rem", color: "var(--gray-400)", fontWeight: 600 }}>{d}</div>
                    <div style={{ fontSize: "0.8rem", fontWeight: 600, color: daily[d] ? "var(--gray-700)" : "var(--gray-300)" }}>
                      {daily[d] || "—"}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--gray-100)", paddingTop: 8 }}>
                <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--teal-dark)" }}>
                  {totalHrs}h total
                </span>
                <span style={{ fontSize: "0.75rem", color: "var(--gray-500)" }}>
                  {formatCurrency(ts.subtotal)} earned
                </span>
              </div>

              {ts.status === "under_review" && ts.reviewReason && (
                <div style={{
                  marginTop: 10, padding: "8px 12px", background: "#fef2f2",
                  borderRadius: 6, fontSize: "0.78rem", color: "#991b1b",
                  borderLeft: "3px solid #ef4444",
                }}>
                  <strong>Review needed:</strong> {ts.reviewReason}
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}

// Group timesheets by week for biz/admin
function groupByProfessional(timesheets) {
  const groups = {};
  for (const ts of timesheets) {
    const weekKey = new Date(ts.weekStart).toISOString().slice(0, 10);
    if (!groups[weekKey]) {
      const ws = new Date(ts.weekStart);
      const we = new Date(ts.weekEnd);
      const opts = { month: "short", day: "numeric" };
      groups[weekKey] = {
        weekLabel: `Week of ${ws.toLocaleDateString("en-US", opts)} – ${we.toLocaleDateString("en-US", opts)}, ${ws.getFullYear()}`,
        timesheets: [],
      };
    }
    groups[weekKey].timesheets.push(ts);
  }
  return groups;
}

const thStyle = {
  textAlign: "left", padding: "8px 8px", fontWeight: 600,
  color: "var(--gray-500)", fontSize: "0.7rem",
  textTransform: "uppercase", letterSpacing: "0.04em",
};

const tdStyle = {
  padding: "10px 8px", color: "var(--gray-700)",
};
