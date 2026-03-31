"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { calculateHours } from "@/lib/timesheet";

export default function TimesheetDetailClient({ timesheetId }) {
  const { data: session } = useSession();
  const router = useRouter();
  const isBiz = session?.user?.role === "BUSINESS";
  const isAdmin = session?.user?.role === "ADMIN";
  const isPro = session?.user?.role === "PROFESSIONAL";

  const [ts, setTs] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewReason, setReviewReason] = useState("");
  const [reviewEntryId, setReviewEntryId] = useState(null);
  const [viewMode, setViewMode] = useState("manager");
  const [error, setError] = useState("");

  const fetchTimesheet = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/timesheets/${timesheetId}`);
      const data = await res.json();
      setTs(data.timesheet);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [timesheetId]);

  useEffect(() => {
    fetchTimesheet();
  }, [fetchTimesheet]);

  const doAction = async (body) => {
    setError("");
    setActionLoading(true);
    try {
      const res = await fetch("/api/timesheets", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ timesheetId, ...body }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong");
        return false;
      }
      return true;
    } catch {
      setError("Network error");
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!confirm("Approve this timesheet? This will proceed to invoicing.")) return;
    const ok = await doAction({ action: "approve" });
    if (ok) fetchTimesheet();
  };

  const handleReviewSubmit = async () => {
    if (!reviewReason.trim()) return;
    const body = reviewEntryId
      ? { action: "review_entry", entryId: reviewEntryId, reason: reviewReason }
      : { action: "review", reason: reviewReason };
    const ok = await doAction(body);
    if (ok) {
      setShowReviewModal(false);
      setReviewReason("");
      setReviewEntryId(null);
      fetchTimesheet();
    }
  };

  const handleResubmit = async () => {
    const ok = await doAction({ action: "resubmit" });
    if (ok) fetchTimesheet();
  };

  const formatTime = (dt) =>
    new Date(dt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  };

  const formatWeek = (ws, we) => {
    const s = new Date(ws);
    const e = new Date(we);
    const opts = { month: "short", day: "numeric" };
    return `${s.toLocaleDateString("en-US", opts)} – ${e.toLocaleDateString("en-US", opts)}, ${s.getFullYear()}`;
  };

  const formatCurrency = (val) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(val);

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
        fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase",
        letterSpacing: "0.04em", padding: "3px 10px", borderRadius: 4,
        background: s.bg, color: s.color,
      }}>
        {label}
      </span>
    );
  };

  const rateTypeBadge = (rateType) => {
    const colors = {
      regular: { bg: "var(--teal-dim)", color: "var(--teal-dark)" },
      after_hours: { bg: "#ede9fe", color: "#5b21b6" },
      holiday: { bg: "#fce7f3", color: "#9d174d" },
    };
    const c = colors[rateType] || colors.regular;
    const label = rateType === "after_hours" ? "After Hours" : rateType.charAt(0).toUpperCase() + rateType.slice(1);
    return (
      <span style={{ fontSize: "0.65rem", fontWeight: 600, padding: "2px 6px", borderRadius: 4, background: c.bg, color: c.color }}>
        {label}
      </span>
    );
  };

  if (loading) {
    return <div className="card" style={{ textAlign: "center", padding: 40, color: "var(--gray-400)" }}>Loading...</div>;
  }
  if (!ts) {
    return <div className="card" style={{ textAlign: "center", padding: 40, color: "var(--gray-400)" }}>Timesheet not found.</div>;
  }

  const proName = ts.professional ? `${ts.professional.firstName} ${ts.professional.lastName}` : "Unknown";
  const bizName = ts.business?.businessProfile?.businessName || "Unknown";
  const posTitle = ts.hire?.position?.title || "Position";
  const totalHrs = Math.round((ts.totalRegularHrs + ts.totalAfterHrs + ts.totalHolidayHrs) * 100) / 100;

  // Group entries by date for daily view
  const grouped = (ts.entries || []).reduce((acc, entry) => {
    const dateKey = new Date(entry.date).toISOString().slice(0, 10);
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(entry);
    return acc;
  }, {});
  const sortedDates = Object.keys(grouped).sort();

  return (
    <div>
      {/* Back button */}
      <button
        onClick={() => router.push("/timesheets")}
        style={{ background: "none", border: "none", color: "var(--teal-dark)", cursor: "pointer", fontSize: "0.85rem", fontWeight: 600, marginBottom: 12, padding: 0 }}
      >
        &larr; Back to Timesheets
      </button>

      {/* Header */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700 }}>
              {formatWeek(ts.weekStart, ts.weekEnd)}
            </h2>
            <div style={{ fontSize: "0.85rem", color: "var(--gray-500)", marginTop: 4 }}>
              {isBiz || isAdmin ? proName : bizName} — {posTitle}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {statusBadge(ts.status)}
          </div>
        </div>

        {/* Review banner for professional */}
        {isPro && ts.status === "under_review" && ts.reviewReason && (
          <div style={{
            marginTop: 16, padding: "12px 16px", background: "#fef2f2",
            borderRadius: 8, borderLeft: "4px solid #ef4444",
          }}>
            <div style={{ fontWeight: 700, fontSize: "0.85rem", color: "#991b1b", marginBottom: 4 }}>
              Review Requested
            </div>
            <div style={{ fontSize: "0.8rem", color: "#7f1d1d" }}>{ts.reviewReason}</div>
            <div style={{ fontSize: "0.75rem", color: "var(--gray-500)", marginTop: 6 }}>
              Please review the flagged entries, make corrections in your Time Log, and then resubmit.
            </div>
          </div>
        )}

        {/* Approval info */}
        {ts.status === "approved" && ts.approvedAt && (
          <div style={{ marginTop: 12, fontSize: "0.78rem", color: "#065f46" }}>
            Approved on {new Date(ts.approvedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </div>
        )}
      </div>

      {/* View mode toggle + action buttons */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
        {(isBiz || isAdmin) && (
          <div style={{ display: "flex", gap: 4 }}>
            <button
              onClick={() => setViewMode("manager")}
              style={{
                padding: "6px 14px", fontSize: "0.8rem", fontWeight: 600, borderRadius: 6, border: "1.5px solid",
                borderColor: viewMode === "manager" ? "var(--teal)" : "var(--gray-200)",
                background: viewMode === "manager" ? "var(--teal-dim)" : "var(--white)",
                color: viewMode === "manager" ? "var(--teal-dark)" : "var(--gray-600)", cursor: "pointer",
              }}
            >
              Hours View
            </button>
            <button
              onClick={() => setViewMode("financial")}
              style={{
                padding: "6px 14px", fontSize: "0.8rem", fontWeight: 600, borderRadius: 6, border: "1.5px solid",
                borderColor: viewMode === "financial" ? "var(--teal)" : "var(--gray-200)",
                background: viewMode === "financial" ? "var(--teal-dim)" : "var(--white)",
                color: viewMode === "financial" ? "var(--teal-dark)" : "var(--gray-600)", cursor: "pointer",
              }}
            >
              Financial View
            </button>
          </div>
        )}

        <div style={{ display: "flex", gap: 8, marginLeft: "auto" }}>
          {/* Approve button (biz/admin, when pending) */}
          {(isBiz || isAdmin) && ts.status === "pending" && (
            <>
              <button className="btn-primary" onClick={handleApprove} disabled={actionLoading}
                style={{ width: "auto", padding: "8px 20px" }}>
                Approve Timesheet
              </button>
              <button
                className="btn-secondary"
                onClick={() => { setReviewEntryId(null); setShowReviewModal(true); }}
                disabled={actionLoading}
                style={{ width: "auto", padding: "8px 20px", color: "#dc2626", borderColor: "#fca5a5" }}
              >
                Submit for Review
              </button>
            </>
          )}

          {/* Resubmit button (pro, when under review) */}
          {isPro && ts.status === "under_review" && (
            <button className="btn-primary" onClick={handleResubmit} disabled={actionLoading}
              style={{ width: "auto", padding: "8px 20px" }}>
              Resubmit for Approval
            </button>
          )}
        </div>
      </div>

      {error && (
        <div style={{ marginBottom: 12, color: "#ef4444", fontSize: "0.8rem" }}>{error}</div>
      )}

      {/* Financial summary card (financial view or always for pro) */}
      {(viewMode === "financial" || isPro) && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-title" style={{ marginBottom: 12 }}>Financial Summary</div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--gray-200)" }}>
                <th style={{ ...thStyle, textAlign: "left" }}>Rate Type</th>
                <th style={{ ...thStyle, textAlign: "right" }}>Hours</th>
                <th style={{ ...thStyle, textAlign: "right" }}>Rate</th>
                <th style={{ ...thStyle, textAlign: "right" }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {ts.totalRegularHrs > 0 && (
                <tr style={{ borderBottom: "1px solid var(--gray-100)" }}>
                  <td style={tdStyle}>Regular</td>
                  <td style={{ ...tdStyle, textAlign: "right" }}>{ts.totalRegularHrs}</td>
                  <td style={{ ...tdStyle, textAlign: "right" }}>{formatCurrency(ts.hire?.regularRate || 0)}/hr</td>
                  <td style={{ ...tdStyle, textAlign: "right" }}>{formatCurrency(ts.regularAmount)}</td>
                </tr>
              )}
              {ts.totalAfterHrs > 0 && (
                <tr style={{ borderBottom: "1px solid var(--gray-100)" }}>
                  <td style={tdStyle}>After Hours</td>
                  <td style={{ ...tdStyle, textAlign: "right" }}>{ts.totalAfterHrs}</td>
                  <td style={{ ...tdStyle, textAlign: "right" }}>{formatCurrency(ts.hire?.afterHoursRate || ts.hire?.regularRate || 0)}/hr</td>
                  <td style={{ ...tdStyle, textAlign: "right" }}>{formatCurrency(ts.afterHrsAmount)}</td>
                </tr>
              )}
              {ts.totalHolidayHrs > 0 && (
                <tr style={{ borderBottom: "1px solid var(--gray-100)" }}>
                  <td style={tdStyle}>Holiday</td>
                  <td style={{ ...tdStyle, textAlign: "right" }}>{ts.totalHolidayHrs}</td>
                  <td style={{ ...tdStyle, textAlign: "right" }}>{formatCurrency(ts.hire?.holidayRate || ts.hire?.regularRate || 0)}/hr</td>
                  <td style={{ ...tdStyle, textAlign: "right" }}>{formatCurrency(ts.holidayAmount)}</td>
                </tr>
              )}
              <tr style={{ borderTop: "2px solid var(--gray-300)" }}>
                <td colSpan={3} style={{ ...tdStyle, textAlign: "right", fontWeight: 700 }}>Subtotal</td>
                <td style={{ ...tdStyle, textAlign: "right", fontWeight: 700 }}>{formatCurrency(ts.subtotal)}</td>
              </tr>
              {(isBiz || isAdmin) && (
                <>
                  <tr>
                    <td colSpan={3} style={{ ...tdStyle, textAlign: "right", color: "var(--gray-500)" }}>
                      Admin Fee ({ts.adminMarkup}%)
                    </td>
                    <td style={{ ...tdStyle, textAlign: "right", color: "var(--gray-500)" }}>
                      {formatCurrency(ts.adminFee)}
                    </td>
                  </tr>
                  <tr style={{ borderTop: "1px solid var(--gray-200)" }}>
                    <td colSpan={3} style={{ ...tdStyle, textAlign: "right", fontWeight: 800, fontSize: "0.95rem" }}>
                      Total Due
                    </td>
                    <td style={{ ...tdStyle, textAlign: "right", fontWeight: 800, fontSize: "0.95rem", color: "var(--teal-dark)" }}>
                      {formatCurrency(ts.totalAmount)}
                    </td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Entries by day */}
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div className="card-title" style={{ margin: 0 }}>Time Entries</div>
          <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--teal-dark)" }}>{totalHrs}h total</div>
        </div>

        {sortedDates.map((dateKey) => {
          const dayEntries = grouped[dateKey];
          const dayTotal = dayEntries.reduce((sum, e) => {
            if (e.endTime) return sum + calculateHours(new Date(e.startTime), new Date(e.endTime), e.breakMinutes);
            return sum;
          }, 0);

          return (
            <div key={dateKey} style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <div style={{ fontWeight: 600, fontSize: "0.8rem", color: "var(--gray-600)" }}>
                  {formatDate(dateKey)}
                </div>
                <div style={{ fontWeight: 600, fontSize: "0.8rem", color: "var(--gray-600)" }}>
                  {Math.round(dayTotal * 100) / 100}h
                </div>
              </div>

              {dayEntries.map((entry) => {
                const hrs = entry.endTime
                  ? calculateHours(new Date(entry.startTime), new Date(entry.endTime), entry.breakMinutes)
                  : 0;
                const isUnderReview = entry.status === "under_review";

                return (
                  <div
                    key={entry.id}
                    style={{
                      padding: "8px 12px",
                      marginBottom: 4,
                      borderRadius: 6,
                      background: isUnderReview ? "#fef2f2" : "var(--gray-50)",
                      border: isUnderReview ? "1px solid #fca5a5" : "1px solid var(--gray-100)",
                      fontSize: "0.8rem",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ color: "var(--gray-600)" }}>
                          {formatTime(entry.startTime)} – {entry.endTime ? formatTime(entry.endTime) : "..."}
                        </span>
                        {rateTypeBadge(entry.rateType)}
                        {entry.breakMinutes > 0 && (
                          <span style={{ fontSize: "0.7rem", color: "var(--gray-400)" }}>
                            {entry.breakMinutes}m break
                          </span>
                        )}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontWeight: 700 }}>{hrs.toFixed(2)}h</span>
                        {/* Flag button for biz */}
                        {(isBiz || isAdmin) && ts.status === "pending" && entry.status !== "under_review" && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setReviewEntryId(entry.id);
                              setShowReviewModal(true);
                            }}
                            style={{
                              background: "none", border: "none", color: "#f59e0b",
                              cursor: "pointer", fontSize: "0.7rem", fontWeight: 600,
                            }}
                          >
                            Flag
                          </button>
                        )}
                      </div>
                    </div>
                    {entry.description && (
                      <div style={{ marginTop: 4, color: "var(--gray-500)", fontSize: "0.75rem" }}>
                        {entry.description}
                      </div>
                    )}
                    {entry.reviewReason && (
                      <div style={{ marginTop: 4, color: "#991b1b", fontSize: "0.72rem", fontStyle: "italic" }}>
                        Review note: {entry.reviewReason}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Review reason modal */}
      {showReviewModal && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
        }}>
          <div className="card" style={{ width: 440, maxWidth: "90vw" }}>
            <div className="card-title" style={{ marginBottom: 12 }}>
              {reviewEntryId ? "Flag Entry for Review" : "Submit Timesheet for Review"}
            </div>
            <div style={{ fontSize: "0.8rem", color: "var(--gray-500)", marginBottom: 12 }}>
              Provide a reason so the professional knows what to review or correct.
            </div>
            <textarea
              className="form-input"
              rows={3}
              placeholder="e.g., Hours on Thursday seem too high, please double-check..."
              value={reviewReason}
              onChange={(e) => setReviewReason(e.target.value)}
              style={{ width: "100%", resize: "vertical", marginBottom: 12 }}
            />
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn-primary" onClick={handleReviewSubmit} disabled={actionLoading || !reviewReason.trim()}
                style={{ flex: 1 }}>
                {actionLoading ? "Submitting..." : "Submit for Review"}
              </button>
              <button className="btn-secondary" onClick={() => { setShowReviewModal(false); setReviewReason(""); setReviewEntryId(null); }}
                style={{ flex: 0, width: "auto", padding: "8px 20px" }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const thStyle = {
  padding: "6px 8px", fontWeight: 600, color: "var(--gray-500)",
  fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.04em",
};

const tdStyle = {
  padding: "8px 8px", color: "var(--gray-700)",
};
