"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { calculateHours } from "@/lib/timesheet";

export default function TimerWidget() {
  const [activeTimer, setActiveTimer] = useState(null);
  const [todayEntries, setTodayEntries] = useState([]);
  const [activeHires, setActiveHires] = useState([]);
  const [selectedHireId, setSelectedHireId] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showStopModal, setShowStopModal] = useState(false);
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const intervalRef = useRef(null);

  const fetchState = useCallback(async () => {
    try {
      const res = await fetch("/api/timer");
      const data = await res.json();
      setActiveTimer(data.activeTimer);
      setTodayEntries(data.todayEntries || []);
      setActiveHires(data.activeHires || []);
      if (data.activeHires?.length && !selectedHireId) {
        setSelectedHireId(data.activeHires[0].id);
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

  // Tick the elapsed counter every second when timer is running
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);

    if (activeTimer) {
      const tick = () => {
        const start = new Date(activeTimer.startTime).getTime();
        const now = Date.now();
        let breakMs = activeTimer.totalBreakMs || 0;
        if (activeTimer.status === "paused" && activeTimer.breakStart) {
          breakMs += now - new Date(activeTimer.breakStart).getTime();
        }
        setElapsed(Math.max(0, now - start - breakMs));
      };
      tick();
      if (activeTimer.status === "running") {
        intervalRef.current = setInterval(tick, 1000);
      }
    } else {
      setElapsed(0);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [activeTimer]);

  const formatElapsed = (ms) => {
    const totalSec = Math.floor(ms / 1000);
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const formatTime = (dt) => {
    return new Date(dt).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const doAction = async (url, method, body) => {
    setError("");
    setActionLoading(true);
    try {
      const res = await fetch(url, {
        method,
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

  const handleStart = async () => {
    if (!selectedHireId) {
      setError("Select a job first");
      return;
    }
    const data = await doAction("/api/timer", "POST", { hireId: selectedHireId });
    if (data?.timer) {
      setActiveTimer(data.timer);
    }
  };

  const handlePause = async () => {
    const data = await doAction("/api/timer", "PUT", { action: "pause" });
    if (data?.timer) setActiveTimer(data.timer);
  };

  const handleResume = async () => {
    const data = await doAction("/api/timer", "PUT", { action: "resume" });
    if (data?.timer) setActiveTimer(data.timer);
  };

  const handleStop = async () => {
    const data = await doAction("/api/timer", "PUT", {
      action: "stop",
      description,
    });
    if (data?.entries) {
      setActiveTimer(null);
      setDescription("");
      setShowStopModal(false);
      fetchState();
    }
  };

  const getHireLabel = (hire) => {
    const biz = hire.business?.businessProfile?.businessName || "Unknown";
    const pos = hire.position?.title || "Position";
    return `${biz} — ${pos}`;
  };

  if (loading) {
    return (
      <div className="card" style={{ textAlign: "center", padding: "32px" }}>
        <div style={{ color: "var(--gray-400)", fontSize: "0.85rem" }}>Loading timer...</div>
      </div>
    );
  }

  if (!activeHires.length) {
    return null; // No active hires, don't show timer
  }

  const timerHire = activeTimer?.hire;

  return (
    <div className="card" style={{ margin: 0 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div className="card-title" style={{ margin: 0 }}>Time Tracker</div>
        {activeTimer && (
          <span
            style={{
              fontSize: "0.7rem",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              color: activeTimer.status === "running" ? "#10b981" : "#f59e0b",
            }}
          >
            {activeTimer.status === "running" ? "Running" : "Paused"}
          </span>
        )}
      </div>

      {/* Hire selector — only when no timer is running */}
      {!activeTimer && (
        <div style={{ marginBottom: 16 }}>
          <select
            className="form-input"
            value={selectedHireId}
            onChange={(e) => setSelectedHireId(e.target.value)}
            style={{ width: "100%" }}
          >
            <option value="">Select a job...</option>
            {activeHires.map((h) => (
              <option key={h.id} value={h.id}>
                {getHireLabel(h)}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Active hire label */}
      {activeTimer && timerHire && (
        <div style={{ marginBottom: 12, fontSize: "0.8rem", color: "var(--gray-500)" }}>
          {getHireLabel(timerHire)}
        </div>
      )}

      {/* Timer display */}
      <div
        style={{
          textAlign: "center",
          fontSize: "2.5rem",
          fontWeight: 800,
          fontVariantNumeric: "tabular-nums",
          color: activeTimer ? "var(--gray-800)" : "var(--gray-300)",
          marginBottom: 20,
          letterSpacing: "-0.02em",
        }}
      >
        {formatElapsed(elapsed)}
      </div>

      {/* Controls */}
      <div style={{ display: "flex", gap: 10 }}>
        {!activeTimer && (
          <button
            className="btn-primary"
            onClick={handleStart}
            disabled={actionLoading || !selectedHireId}
            style={{ flex: 1 }}
          >
            Start Timer
          </button>
        )}

        {activeTimer?.status === "running" && (
          <>
            <button
              className="btn-secondary"
              onClick={handlePause}
              disabled={actionLoading}
              style={{ flex: 1 }}
            >
              Pause
            </button>
            <button
              className="btn-secondary"
              onClick={() => setShowStopModal(true)}
              disabled={actionLoading}
              style={{
                flex: 1,
                color: "#ef4444",
                borderColor: "#fca5a5",
              }}
            >
              Stop
            </button>
          </>
        )}

        {activeTimer?.status === "paused" && (
          <>
            <button
              className="btn-primary"
              onClick={handleResume}
              disabled={actionLoading}
              style={{ flex: 1 }}
            >
              Resume
            </button>
            <button
              className="btn-secondary"
              onClick={() => setShowStopModal(true)}
              disabled={actionLoading}
              style={{
                flex: 1,
                color: "#ef4444",
                borderColor: "#fca5a5",
              }}
            >
              Stop
            </button>
          </>
        )}
      </div>

      {error && (
        <div style={{ marginTop: 10, color: "#ef4444", fontSize: "0.8rem" }}>{error}</div>
      )}

      {/* Stop modal — what did you work on? */}
      {showStopModal && (
        <div style={{ marginTop: 16, padding: 16, background: "var(--gray-50)", borderRadius: 8 }}>
          <div style={{ fontSize: "0.85rem", fontWeight: 600, marginBottom: 8 }}>
            What did you work on?
          </div>
          <textarea
            className="form-input"
            rows={3}
            placeholder="Brief description of work done..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            style={{ width: "100%", resize: "vertical", marginBottom: 10 }}
          />
          <div style={{ display: "flex", gap: 8 }}>
            <button
              className="btn-primary"
              onClick={handleStop}
              disabled={actionLoading}
              style={{ flex: 1 }}
            >
              {actionLoading ? "Saving..." : "Stop & Save"}
            </button>
            <button
              className="btn-secondary"
              onClick={() => setShowStopModal(false)}
              style={{ flex: 0 }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Today's entries */}
      {todayEntries.length > 0 && (
        <div style={{ marginTop: 20, borderTop: "1px solid var(--gray-200)", paddingTop: 16 }}>
          <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--gray-500)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 10 }}>
            Today's Entries
          </div>
          {todayEntries.map((entry) => {
            const hrs = entry.endTime
              ? calculateHours(new Date(entry.startTime), new Date(entry.endTime), entry.breakMinutes)
              : 0;
            return (
              <div
                key={entry.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "8px 0",
                  borderBottom: "1px solid var(--gray-100)",
                  fontSize: "0.8rem",
                }}
              >
                <div>
                  <span style={{ color: "var(--gray-600)" }}>
                    {formatTime(entry.startTime)} – {entry.endTime ? formatTime(entry.endTime) : "..."}
                  </span>
                  {entry.description && (
                    <div style={{ color: "var(--gray-400)", fontSize: "0.75rem", marginTop: 2 }}>
                      {entry.description.length > 60
                        ? entry.description.slice(0, 60) + "..."
                        : entry.description}
                    </div>
                  )}
                </div>
                <div style={{ fontWeight: 700, color: "var(--gray-700)" }}>
                  {hrs > 0 ? `${hrs}h` : "—"}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
