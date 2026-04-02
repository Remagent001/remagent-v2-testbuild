"use client";

import { useState, useEffect, useCallback } from "react";

export default function TimeLogClient() {
  const [activeHires, setActiveHires] = useState([]);
  const [selectedHireId, setSelectedHireId] = useState("");
  const [entries, setEntries] = useState([]);
  const [activeTimer, setActiveTimer] = useState(null);
  const [activeBreakEntry, setActiveBreakEntry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [showEndModal, setShowEndModal] = useState(false);
  const [workDone, setWorkDone] = useState("");
  const [remarksInput, setRemarksInput] = useState("");
  const [editingCell, setEditingCell] = useState(null); // { entryId, field }
  const [editValue, setEditValue] = useState("");
  const [allowEditing, setAllowEditing] = useState(true);

  const fetchState = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (selectedHireId) params.set("hireId", selectedHireId);
      const res = await fetch(`/api/timer?${params}`);
      const data = await res.json();
      setActiveTimer(data.activeTimer || null);
      setActiveBreakEntry(data.activeBreakEntry || null);
      setActiveHires(data.activeHires || []);
      setEntries(data.entries || []);

      // Auto-select first hire if none selected
      if (!selectedHireId && data.activeHires?.length) {
        setSelectedHireId(data.activeHires[0].id);
      }

      // Determine if editing allowed for selected hire
      if (selectedHireId && data.activeHires?.length) {
        const hire = data.activeHires.find((h) => h.id === selectedHireId);
        setAllowEditing(hire?.business?.businessProfile?.allowTimeEditing !== false);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [selectedHireId]);

  useEffect(() => {
    fetchState();
  }, [fetchState]);

  // Re-fetch when hire changes
  const handleHireChange = (hireId) => {
    setSelectedHireId(hireId);
    setEditingCell(null);
  };

  const selectedHire = activeHires.find((h) => h.id === selectedHireId);
  const businessName = selectedHire?.business?.businessProfile?.businessName || "";
  const positionTitle = selectedHire?.position?.title || "";

  // Timer state
  const timerRunning = activeTimer && activeTimer.status === "running";
  const onBreak = activeTimer && activeTimer.status === "break";
  const timerActive = !!activeTimer;

  const doAction = async (body) => {
    setError("");
    setActionLoading(true);
    try {
      const res = await fetch("/api/timer", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong");
        return null;
      }
      return data;
    } catch {
      setError("Network error");
      return null;
    } finally {
      setActionLoading(false);
    }
  };

  const handleStartTimer = async () => {
    if (!selectedHireId) {
      setError("Select a job first");
      return;
    }
    setError("");
    setActionLoading(true);
    try {
      const res = await fetch("/api/timer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hireId: selectedHireId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to start timer");
      } else {
        setActiveTimer(data.timer);
        fetchState();
      }
    } catch {
      setError("Network error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddBreak = async () => {
    const data = await doAction({ action: "addBreak" });
    if (data) fetchState();
  };

  const handleEndBreak = async () => {
    const data = await doAction({ action: "endBreak" });
    if (data) fetchState();
  };

  const handleEndDay = () => {
    setShowEndModal(true);
  };

  const handleSubmitEnd = async () => {
    const data = await doAction({ action: "endDay", description: workDone, remarks: remarksInput });
    if (data) {
      setShowEndModal(false);
      setWorkDone("");
      setRemarksInput("");
      fetchState();
    }
  };

  // ── Inline editing ──
  const startEdit = (entryId, field, currentValue) => {
    if (!allowEditing) return;
    setEditingCell({ entryId, field });
    setEditValue(currentValue || "");
  };

  const cancelEdit = () => {
    setEditingCell(null);
    setEditValue("");
  };

  const saveEdit = async (entryId, field) => {
    const entry = entries.find((e) => e.id === entryId);
    if (!entry) return;

    const body = { entryId };
    if (field === "startTime" || field === "endTime") {
      // editValue is HH:MM
      if (field === "startTime") {
        const endTimeStr = entry.endTime ? formatTime24(new Date(entry.endTime)) : null;
        body.startTime = editValue;
        body.endTime = endTimeStr;
      } else {
        const startTimeStr = formatTime24(new Date(entry.startTime));
        body.startTime = startTimeStr;
        body.endTime = editValue;
      }
    } else if (field === "description") {
      body.description = editValue;
    } else if (field === "remarks") {
      body.remarks = editValue;
    }

    try {
      const res = await fetch("/api/time-entries", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setEditingCell(null);
        setEditValue("");
        fetchState();
      } else {
        const data = await res.json();
        setError(data.error || "Failed to save");
      }
    } catch {
      setError("Network error");
    }
  };

  const handleEditKeyDown = (e, entryId, field) => {
    if (e.key === "Enter") {
      e.preventDefault();
      saveEdit(entryId, field);
    } else if (e.key === "Escape") {
      cancelEdit();
    }
  };

  // Format time as HH:MM for display
  const formatTimeDisplay = (dt) => {
    if (!dt) return "";
    const d = new Date(dt);
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  };

  const formatTime24 = (d) => {
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toISOString().slice(0, 10);
  };

  if (loading) {
    return (
      <div className="onboarding-loading">
        <div className="onboarding-spinner" />
        <p>Loading...</p>
      </div>
    );
  }

  if (!activeHires.length) {
    return (
      <div>
        <div className="page-header">
          <h1 className="page-title">Timesheet Management</h1>
        </div>
        <div className="card" style={{ textAlign: "center", padding: 40, color: "var(--gray-400)" }}>
          No active jobs found.
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* End Day Modal */}
      {showEndModal && (
        <div style={modalOverlay}>
          <div style={modalBox}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: "1.1rem", color: "var(--teal-dark)" }}>Timesheet</h3>
              <button onClick={() => setShowEndModal(false)} style={closeBtn}>&times;</button>
            </div>
            <div className="form-group" style={{ marginBottom: 12 }}>
              <label className="form-label">Work Done</label>
              <textarea
                className="form-input"
                rows={2}
                value={workDone}
                onChange={(e) => setWorkDone(e.target.value)}
                style={{ resize: "vertical" }}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 16 }}>
              <label className="form-label">Remarks</label>
              <textarea
                className="form-input"
                rows={2}
                value={remarksInput}
                onChange={(e) => setRemarksInput(e.target.value)}
                style={{ resize: "vertical" }}
              />
            </div>
            <div style={{ textAlign: "right" }}>
              <button
                className="btn-primary"
                onClick={handleSubmitEnd}
                disabled={actionLoading}
                style={{ width: "auto", padding: "8px 24px" }}
              >
                {actionLoading ? "Saving..." : "Submit"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>
        {/* Left Sidebar */}
        <div style={{ width: 220, flexShrink: 0 }}>
          <div style={{ marginBottom: 16 }}>
            <label style={sideLabel}>Jobs:</label>
            <select
              className="form-input form-select"
              value={selectedHireId}
              onChange={(e) => handleHireChange(e.target.value)}
              style={{ width: "100%", fontSize: "0.85rem" }}
            >
              {activeHires.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.position?.title || "Position"}
                </option>
              ))}
            </select>
          </div>
          <div style={{ marginBottom: 8 }}>
            <label style={sideLabel}>Name of Business:</label>
            <p style={sideValue}>{businessName}</p>
          </div>
          <div>
            <label style={sideLabel}>Total Payment till Job:</label>
            <p style={sideValue}>
              {calculateTotalPayment(entries)}
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div style={{ flex: 1 }}>
          {/* Header with action buttons */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <h1 style={{ margin: 0, fontSize: "1.4rem", fontWeight: 700, color: "var(--gray-800)" }}>
              Timesheet Management
            </h1>
            <div style={{ display: "flex", gap: 10 }}>
              {!timerActive && (
                <button
                  className="btn-primary"
                  onClick={handleStartTimer}
                  disabled={actionLoading}
                  style={{ width: "auto", padding: "8px 18px", fontSize: "0.85rem" }}
                >
                  Start Today&apos;s Job Timer +
                </button>
              )}
              {timerRunning && (
                <>
                  <button
                    className="btn-primary"
                    onClick={handleAddBreak}
                    disabled={actionLoading}
                    style={{ width: "auto", padding: "8px 18px", fontSize: "0.85rem", background: "var(--teal)" }}
                  >
                    Add a break +
                  </button>
                  <button
                    className="btn-primary"
                    onClick={handleEndDay}
                    disabled={actionLoading}
                    style={{ width: "auto", padding: "8px 18px", fontSize: "0.85rem" }}
                  >
                    End Today&apos;s Job Timer +
                  </button>
                </>
              )}
              {onBreak && (
                <button
                  className="btn-primary"
                  onClick={handleEndBreak}
                  disabled={actionLoading}
                  style={{ width: "auto", padding: "8px 18px", fontSize: "0.85rem", background: "#ef4444" }}
                >
                  End break +
                </button>
              )}
            </div>
          </div>

          {error && (
            <div style={{ color: "#ef4444", fontSize: "0.85rem", marginBottom: 12 }}>{error}</div>
          )}

          {/* Jobs engaged with */}
          <p style={{ fontWeight: 600, fontSize: "0.95rem", marginBottom: 12, color: "var(--gray-700)" }}>
            Jobs engaged with :
          </p>

          {/* Entries Table */}
          <div style={{ overflowX: "auto" }}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Date</th>
                  <th style={thStyle}>Start Time</th>
                  <th style={thStyle}>End Time</th>
                  <th style={thStyle}>Work Done</th>
                  <th style={thStyle}>Remarks</th>
                  <th style={thStyle}>Status</th>
                </tr>
              </thead>
              <tbody>
                {entries.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ ...tdStyle, textAlign: "center", color: "var(--gray-400)", padding: 32 }}>
                      No time entries yet.
                    </td>
                  </tr>
                ) : (
                  entries.map((entry, idx) => {
                    const isPending = entry.status === "pending" || entry.status === "under_review";
                    const canEdit = allowEditing && isPending;
                    const isBreak = entry.type === "break";
                    const rowBg = idx % 2 === 0 ? "#fff" : "#f9fafb";

                    return (
                      <tr key={entry.id} style={{ background: rowBg }}>
                        <td style={tdStyle}>{formatDate(entry.date)}</td>

                        {/* Start Time */}
                        <td
                          style={{ ...tdStyle, cursor: canEdit ? "pointer" : "default" }}
                          onClick={() => canEdit && startEdit(entry.id, "startTime", formatTimeDisplay(entry.startTime))}
                        >
                          {editingCell?.entryId === entry.id && editingCell?.field === "startTime" ? (
                            <input
                              type="time"
                              className="form-input"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onKeyDown={(e) => handleEditKeyDown(e, entry.id, "startTime")}
                              onBlur={() => saveEdit(entry.id, "startTime")}
                              autoFocus
                              style={{ padding: "2px 4px", fontSize: "0.85rem", width: 100 }}
                            />
                          ) : (
                            formatTimeDisplay(entry.startTime)
                          )}
                        </td>

                        {/* End Time */}
                        <td
                          style={{ ...tdStyle, cursor: canEdit ? "pointer" : "default" }}
                          onClick={() => canEdit && entry.endTime && startEdit(entry.id, "endTime", formatTimeDisplay(entry.endTime))}
                        >
                          {editingCell?.entryId === entry.id && editingCell?.field === "endTime" ? (
                            <input
                              type="time"
                              className="form-input"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onKeyDown={(e) => handleEditKeyDown(e, entry.id, "endTime")}
                              onBlur={() => saveEdit(entry.id, "endTime")}
                              autoFocus
                              style={{ padding: "2px 4px", fontSize: "0.85rem", width: 100 }}
                            />
                          ) : (
                            entry.endTime ? formatTimeDisplay(entry.endTime) : ""
                          )}
                        </td>

                        {/* Work Done */}
                        <td
                          style={{ ...tdStyle, cursor: canEdit && !isBreak ? "pointer" : "default" }}
                          onClick={() => canEdit && !isBreak && startEdit(entry.id, "description", entry.description || "")}
                        >
                          {editingCell?.entryId === entry.id && editingCell?.field === "description" ? (
                            <input
                              type="text"
                              className="form-input"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onKeyDown={(e) => handleEditKeyDown(e, entry.id, "description")}
                              onBlur={() => saveEdit(entry.id, "description")}
                              autoFocus
                              style={{ padding: "2px 4px", fontSize: "0.85rem", width: "100%" }}
                            />
                          ) : (
                            entry.description || ""
                          )}
                        </td>

                        {/* Remarks */}
                        <td
                          style={{ ...tdStyle, cursor: canEdit && !isBreak ? "pointer" : "default" }}
                          onClick={() => canEdit && !isBreak && startEdit(entry.id, "remarks", entry.remarks || "")}
                        >
                          {editingCell?.entryId === entry.id && editingCell?.field === "remarks" ? (
                            <input
                              type="text"
                              className="form-input"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onKeyDown={(e) => handleEditKeyDown(e, entry.id, "remarks")}
                              onBlur={() => saveEdit(entry.id, "remarks")}
                              autoFocus
                              style={{ padding: "2px 4px", fontSize: "0.85rem", width: "100%" }}
                            />
                          ) : (
                            isBreak ? "Break" : (entry.remarks || "")
                          )}
                        </td>

                        {/* Status */}
                        <td style={tdStyle}>
                          <span style={entry.status === "approved" ? statusApproved : statusPending}>
                            {entry.status === "approved" ? "Approved" : entry.status === "under_review" ? "Under Review" : "Pending"}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function calculateTotalPayment(entries) {
  // Sum up hours * rates would require rate data; show 0 for now as in original
  return "0";
}

// ── Styles ──

const sideLabel = {
  fontSize: "0.82rem",
  fontWeight: 600,
  color: "var(--gray-600)",
  display: "block",
  marginBottom: 4,
};

const sideValue = {
  fontSize: "0.85rem",
  color: "var(--gray-800)",
  margin: "0 0 0 0",
};

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
  fontSize: "0.85rem",
};

const thStyle = {
  textAlign: "left",
  padding: "10px 12px",
  fontWeight: 700,
  color: "var(--gray-700)",
  borderBottom: "2px solid var(--gray-200)",
  fontSize: "0.82rem",
  whiteSpace: "nowrap",
};

const tdStyle = {
  padding: "10px 12px",
  color: "var(--gray-700)",
  borderBottom: "1px solid var(--gray-100)",
  fontSize: "0.85rem",
};

const statusApproved = {
  color: "#065f46",
  fontWeight: 600,
  fontSize: "0.82rem",
};

const statusPending = {
  color: "#92400e",
  fontWeight: 600,
  fontSize: "0.82rem",
};

const modalOverlay = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: "rgba(0,0,0,0.4)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1000,
};

const modalBox = {
  background: "#fff",
  borderRadius: 10,
  padding: 24,
  width: 400,
  maxWidth: "90vw",
  boxShadow: "0 10px 40px rgba(0,0,0,0.15)",
};

const closeBtn = {
  background: "none",
  border: "none",
  fontSize: "1.4rem",
  color: "#ef4444",
  cursor: "pointer",
  lineHeight: 1,
};
