"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { calculateHours, getWeekRange } from "@/lib/timesheet";

export default function TimeLogClient() {
  const { data: session } = useSession();
  const [entries, setEntries] = useState([]);
  const [activeHires, setActiveHires] = useState([]);
  const [selectedHireId, setSelectedHireId] = useState("");
  const [loading, setLoading] = useState(true);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualForm, setManualForm] = useState({
    hireId: "",
    date: "",
    startTime: "",
    endTime: "",
    breakMinutes: 0,
    description: "",
  });
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  // Default to current week
  const today = new Date();
  const { weekStart, weekEnd } = getWeekRange(today);
  const [fromDate, setFromDate] = useState(weekStart.toISOString().slice(0, 10));
  const [toDate, setToDate] = useState(weekEnd.toISOString().slice(0, 10));

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedHireId) params.set("hireId", selectedHireId);
      if (fromDate) params.set("from", fromDate);
      if (toDate) params.set("to", toDate);
      const res = await fetch(`/api/time-entries?${params}`);
      const data = await res.json();
      setEntries(data.entries || []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [selectedHireId, fromDate, toDate]);

  const fetchHires = useCallback(async () => {
    try {
      const res = await fetch("/api/timer");
      const data = await res.json();
      setActiveHires(data.activeHires || []);
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    fetchHires();
  }, [fetchHires]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  // Group entries by date
  const grouped = entries.reduce((acc, entry) => {
    const dateKey = new Date(entry.date).toISOString().slice(0, 10);
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(entry);
    return acc;
  }, {});
  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  // Weekly total
  const weekTotal = entries.reduce((sum, e) => {
    if (e.endTime) {
      return sum + calculateHours(new Date(e.startTime), new Date(e.endTime), e.breakMinutes);
    }
    return sum;
  }, 0);

  const formatTime = (dt) =>
    new Date(dt).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

  const formatDate = (dateStr) => {
    const d = new Date(dateStr + "T12:00:00");
    return d.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const getHireLabel = (hire) => {
    const biz = hire.business?.businessProfile?.businessName || "Unknown";
    const pos = hire.position?.title || "Position";
    return `${biz} — ${pos}`;
  };

  const statusBadge = (status) => {
    const colors = {
      pending: { bg: "#fef3c7", color: "#92400e" },
      approved: { bg: "#d1fae5", color: "#065f46" },
      under_review: { bg: "#fee2e2", color: "#991b1b" },
    };
    const c = colors[status] || colors.pending;
    const label = status === "under_review" ? "Under Review" : status.charAt(0).toUpperCase() + status.slice(1);
    return (
      <span
        style={{
          fontSize: "0.65rem",
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.04em",
          padding: "2px 8px",
          borderRadius: 4,
          background: c.bg,
          color: c.color,
        }}
      >
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
      <span
        style={{
          fontSize: "0.65rem",
          fontWeight: 600,
          padding: "2px 6px",
          borderRadius: 4,
          background: c.bg,
          color: c.color,
        }}
      >
        {label}
      </span>
    );
  };

  const handleDelete = async (entryId) => {
    if (!confirm("Delete this entry?")) return;
    await fetch(`/api/time-entries?entryId=${entryId}`, { method: "DELETE" });
    fetchEntries();
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setSaving(true);
    try {
      const res = await fetch("/api/time-entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...manualForm,
          breakMinutes: parseInt(manualForm.breakMinutes) || 0,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || "Failed to save");
        return;
      }
      setShowManualEntry(false);
      setManualForm({ hireId: "", date: "", startTime: "", endTime: "", breakMinutes: 0, description: "" });
      fetchEntries();
    } catch {
      setFormError("Network error");
    } finally {
      setSaving(false);
    }
  };

  const setWeekNav = (direction) => {
    const from = new Date(fromDate);
    from.setDate(from.getDate() + direction * 7);
    const { weekStart: ws, weekEnd: we } = getWeekRange(from);
    setFromDate(ws.toISOString().slice(0, 10));
    setToDate(we.toISOString().slice(0, 10));
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Time Log</h1>
        <p className="page-subtitle">Track and manage your work hours</p>
      </div>

      {/* Filters bar */}
      <div className="card" style={{ marginBottom: 20, display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <button
            className="btn-secondary"
            onClick={() => setWeekNav(-1)}
            style={{ padding: "6px 12px", width: "auto" }}
          >
            &larr;
          </button>
          <span style={{ fontSize: "0.85rem", fontWeight: 600, minWidth: 180, textAlign: "center" }}>
            {formatDate(fromDate)} – {formatDate(toDate)}
          </span>
          <button
            className="btn-secondary"
            onClick={() => setWeekNav(1)}
            style={{ padding: "6px 12px", width: "auto" }}
          >
            &rarr;
          </button>
        </div>

        {activeHires.length > 1 && (
          <select
            className="form-input"
            value={selectedHireId}
            onChange={(e) => setSelectedHireId(e.target.value)}
            style={{ width: "auto", minWidth: 200 }}
          >
            <option value="">All Jobs</option>
            {activeHires.map((h) => (
              <option key={h.id} value={h.id}>
                {getHireLabel(h)}
              </option>
            ))}
          </select>
        )}

        <div style={{ marginLeft: "auto" }}>
          <button
            className="btn-primary"
            onClick={() => {
              setShowManualEntry(!showManualEntry);
              if (activeHires.length === 1) {
                setManualForm((f) => ({ ...f, hireId: activeHires[0].id }));
              }
            }}
            style={{ width: "auto", padding: "8px 16px" }}
          >
            + Add Entry
          </button>
        </div>
      </div>

      {/* Manual entry form */}
      {showManualEntry && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-title" style={{ marginBottom: 12 }}>Add Manual Entry</div>
          <form onSubmit={handleManualSubmit}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
              {activeHires.length > 1 && (
                <div className="form-group">
                  <label className="form-label">Job</label>
                  <select
                    className="form-input"
                    value={manualForm.hireId}
                    onChange={(e) => setManualForm({ ...manualForm, hireId: e.target.value })}
                    required
                  >
                    <option value="">Select...</option>
                    {activeHires.map((h) => (
                      <option key={h.id} value={h.id}>{getHireLabel(h)}</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="form-group">
                <label className="form-label">Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={manualForm.date}
                  onChange={(e) => setManualForm({ ...manualForm, date: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Start Time</label>
                <input
                  type="time"
                  className="form-input"
                  value={manualForm.startTime}
                  onChange={(e) => setManualForm({ ...manualForm, startTime: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">End Time</label>
                <input
                  type="time"
                  className="form-input"
                  value={manualForm.endTime}
                  onChange={(e) => setManualForm({ ...manualForm, endTime: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Break (min)</label>
                <input
                  type="number"
                  className="form-input"
                  min="0"
                  value={manualForm.breakMinutes}
                  onChange={(e) => setManualForm({ ...manualForm, breakMinutes: e.target.value })}
                />
              </div>
            </div>
            <div className="form-group" style={{ marginTop: 12 }}>
              <label className="form-label">Description</label>
              <textarea
                className="form-input"
                rows={2}
                placeholder="What did you work on?"
                value={manualForm.description}
                onChange={(e) => setManualForm({ ...manualForm, description: e.target.value })}
                style={{ resize: "vertical" }}
              />
            </div>
            {formError && (
              <div style={{ color: "#ef4444", fontSize: "0.8rem", marginTop: 8 }}>{formError}</div>
            )}
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <button className="btn-primary" type="submit" disabled={saving} style={{ width: "auto", padding: "8px 20px" }}>
                {saving ? "Saving..." : "Save Entry"}
              </button>
              <button
                className="btn-secondary"
                type="button"
                onClick={() => setShowManualEntry(false)}
                style={{ width: "auto", padding: "8px 20px" }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Weekly total */}
      <div className="stat-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}>
        <div className="stat-card">
          <div className="stat-card-label">This Period</div>
          <div className="stat-card-value">{Math.round(weekTotal * 100) / 100}h</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Entries</div>
          <div className="stat-card-value">{entries.length}</div>
        </div>
      </div>

      {/* Entries grouped by date */}
      {loading ? (
        <div className="card" style={{ textAlign: "center", padding: 40, color: "var(--gray-400)" }}>
          Loading entries...
        </div>
      ) : sortedDates.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: 40, color: "var(--gray-400)" }}>
          No time entries for this period.
        </div>
      ) : (
        sortedDates.map((dateKey) => {
          const dayEntries = grouped[dateKey];
          const dayTotal = dayEntries.reduce((sum, e) => {
            if (e.endTime) {
              return sum + calculateHours(new Date(e.startTime), new Date(e.endTime), e.breakMinutes);
            }
            return sum;
          }, 0);

          return (
            <div key={dateKey} className="card" style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div style={{ fontWeight: 700, fontSize: "0.85rem" }}>{formatDate(dateKey)}</div>
                <div style={{ fontWeight: 700, fontSize: "0.85rem", color: "var(--teal-dark)" }}>
                  {Math.round(dayTotal * 100) / 100}h
                </div>
              </div>

              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8rem" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--gray-200)" }}>
                      <th style={thStyle}>Time</th>
                      <th style={thStyle}>Break</th>
                      <th style={thStyle}>Hours</th>
                      <th style={thStyle}>Type</th>
                      <th style={thStyle}>Description</th>
                      <th style={thStyle}>Status</th>
                      <th style={{ ...thStyle, width: 50 }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {dayEntries.map((entry) => {
                      const hrs = entry.endTime
                        ? calculateHours(new Date(entry.startTime), new Date(entry.endTime), entry.breakMinutes)
                        : 0;
                      return (
                        <tr key={entry.id} style={{ borderBottom: "1px solid var(--gray-100)" }}>
                          <td style={tdStyle}>
                            {formatTime(entry.startTime)} – {entry.endTime ? formatTime(entry.endTime) : "..."}
                          </td>
                          <td style={tdStyle}>{entry.breakMinutes}m</td>
                          <td style={{ ...tdStyle, fontWeight: 700 }}>{hrs > 0 ? hrs.toFixed(2) : "—"}</td>
                          <td style={tdStyle}>{rateTypeBadge(entry.rateType)}</td>
                          <td style={{ ...tdStyle, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {entry.description || "—"}
                          </td>
                          <td style={tdStyle}>{statusBadge(entry.status)}</td>
                          <td style={tdStyle}>
                            {(entry.status === "pending" || entry.status === "under_review") && (
                              <button
                                onClick={() => handleDelete(entry.id)}
                                style={{
                                  background: "none",
                                  border: "none",
                                  color: "#ef4444",
                                  cursor: "pointer",
                                  fontSize: "0.75rem",
                                  padding: "2px 6px",
                                }}
                              >
                                Del
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Show hire label if multiple hires */}
              {dayEntries[0]?.hire && activeHires.length > 1 && (
                <div style={{ marginTop: 6, fontSize: "0.7rem", color: "var(--gray-400)" }}>
                  {getHireLabel(dayEntries[0].hire)}
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}

const thStyle = {
  textAlign: "left",
  padding: "6px 8px",
  fontWeight: 600,
  color: "var(--gray-500)",
  fontSize: "0.7rem",
  textTransform: "uppercase",
  letterSpacing: "0.04em",
};

const tdStyle = {
  padding: "8px 8px",
  color: "var(--gray-700)",
};
