"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { to12hr as to12hrUtil, tzLabel } from "@/utilities/TimeZoneHelper";

function safeParse(val) {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  try { return JSON.parse(val); } catch { return []; }
}

const DAY_ORDER = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
const DAY_LABELS = { monday: "Mon", tuesday: "Tue", wednesday: "Wed", thursday: "Thu", friday: "Fri", saturday: "Sat", sunday: "Sun" };

const to12hr = to12hrUtil;

export default function AdminReviewDetailClient({ positionId }) {
  const router = useRouter();
  const [position, setPosition] = useState(null);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    fetch(`/api/admin/positions/${positionId}`)
      .then((r) => r.json())
      .then((data) => setPosition(data.position || null))
      .finally(() => setLoading(false));
  }, [positionId]);

  const handleAction = async (action) => {
    if (action === "request_changes" && !note.trim()) {
      alert("Please write a note explaining what needs to change.");
      return;
    }
    setSubmitting(true);
    const res = await fetch(`/api/admin/positions/${positionId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, note: note.trim() }),
    });
    const data = await res.json();
    setSubmitting(false);

    if (data.success) {
      setResult(action === "approve"
        ? `Approved! Posting is now ${data.newStatus}.`
        : "Sent back to business user for changes."
      );
      setTimeout(() => router.push("/admin/review-postings"), 2000);
    }
  };

  if (loading) {
    return (
      <div className="onboarding-loading">
        <div className="onboarding-spinner" />
        <p>Loading posting details...</p>
      </div>
    );
  }

  if (!position) {
    return <div className="card" style={{ padding: 24 }}>Position not found.</div>;
  }

  const pos = position;
  const businessName = pos.user?.businessProfile?.businessName || `${pos.user?.firstName} ${pos.user?.lastName}`;
  const schedule = (pos.availability || []).sort((a, b) => DAY_ORDER.indexOf(a.day) - DAY_ORDER.indexOf(b.day));
  const questions = safeParse(pos.screeningQuestions);
  const workLocation = safeParse(pos.environment?.workLocation);

  return (
    <div className="positions-page">
      <button
        className="btn-link"
        style={{ padding: 0, fontSize: "0.85rem", marginBottom: 12 }}
        onClick={() => router.push("/admin/review-postings")}
      >
        &larr; Back to Review Queue
      </button>

      {result && (
        <div className="card" style={{
          padding: "16px 20px",
          marginBottom: 20,
          background: "#ecfdf5",
          borderLeft: "4px solid #10b981",
        }}>
          <strong style={{ color: "#059669" }}>{result}</strong>
        </div>
      )}

      {/* Header */}
      <div className="card" style={{ padding: "24px 28px", marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
          <div>
            <h1 style={{ fontSize: "1.4rem", marginBottom: 4 }}>{pos.title || "Untitled Position"}</h1>
            <p style={{ color: "var(--gray-500)", fontSize: "0.9rem" }}>
              Submitted by <strong>{businessName}</strong>
              {" · "}<a href={`mailto:${pos.user?.email}`} style={{ color: "var(--teal)", textDecoration: "none" }} onClick={(e) => e.stopPropagation()}>{pos.user?.email}</a>
              {pos.user?.phone && (
                <>{" · "}<a href={`tel:${pos.user.phone}`} style={{ color: "var(--teal)", textDecoration: "none" }} onClick={(e) => e.stopPropagation()}>{pos.user.phone}</a></>
              )}
              {!pos.user?.phone && pos.user?.businessProfile?.phone && (
                <>{" · "}<a href={`tel:${pos.user.businessProfile.phone}`} style={{ color: "var(--teal)", textDecoration: "none" }} onClick={(e) => e.stopPropagation()}>{pos.user.businessProfile.phone}</a></>
              )}
            </p>
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <span style={{
                padding: "4px 12px", borderRadius: 20, fontSize: "0.8rem", fontWeight: 600,
                background: pos.visibility === "public" ? "var(--teal-light)" : "var(--gray-100)",
                color: pos.visibility === "public" ? "var(--teal)" : "var(--gray-500)",
              }}>
                {pos.visibility === "public" ? "Public" : "Private"}
              </span>
              {pos.reviewRequired && (
                <span style={{
                  padding: "4px 12px", borderRadius: 20, fontSize: "0.8rem", fontWeight: 600,
                  background: "#ef444418", color: "#ef4444",
                }}>
                  Previously Sent Back
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Existing admin note */}
      {pos.reviewRequired && pos.adminNote && (
        <div className="card" style={{
          padding: "16px 20px",
          marginBottom: 20,
          background: "#fef2f2",
          borderLeft: "4px solid #ef4444",
        }}>
          <strong style={{ color: "#dc2626", fontSize: "0.9rem" }}>Previous Note to Business:</strong>
          <p style={{ margin: "6px 0 0", color: "#7f1d1d", fontSize: "0.85rem" }}>{pos.adminNote}</p>
        </div>
      )}

      {/* Position details */}
      <div style={{ display: "grid", gap: 20 }}>
        {/* Description */}
        {pos.description && (
          <Section title="Description">
            <p style={{ whiteSpace: "pre-wrap", color: "var(--gray-700)", fontSize: "0.9rem", lineHeight: 1.6 }}>
              {pos.description}
            </p>
          </Section>
        )}

        {/* Key details */}
        <Section title="Position Details">
          <DetailGrid>
            <DetailItem label="Number of Hires" value={pos.numberOfHires} />
            <DetailItem label="Regular Rate" value={pos.regularRate ? `$${pos.regularRate}/hr` : "Not set"} />
            <DetailItem label="Contract Type" value={
              pos.contractType === "open_ended" ? "Open-ended" :
              pos.contractType === "fixed" ? "Fixed term" :
              pos.contractType === "direct_hire" ? "Direct hire" : "Not set"
            } />
            <DetailItem label="Start" value={
              pos.startOption === "immediately" ? "Immediately" :
              pos.startOption === "flexible" ? "Flexible" :
              pos.expectedStartDate ? new Date(pos.expectedStartDate).toLocaleDateString() : "Not set"
            } />
            {pos.expectedEndDate && (
              <DetailItem label="End Date" value={new Date(pos.expectedEndDate).toLocaleDateString()} />
            )}
            {pos.timezone && <DetailItem label="Timezone" value={pos.timezone} />}
          </DetailGrid>
        </Section>

        {/* Skills */}
        {pos.skills?.length > 0 && (
          <Section title="Skills">
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {pos.skills.map((s) => (
                <span key={s.id} style={{
                  padding: "6px 14px", borderRadius: 20, fontSize: "0.82rem",
                  background: s.requirement === "required" ? "var(--teal-light)" : "var(--gray-100)",
                  color: s.requirement === "required" ? "var(--teal)" : "var(--gray-600)",
                  border: s.requirement === "required" ? "1px solid var(--teal)" : "1px solid var(--gray-200)",
                }}>
                  {s.skill.name}
                  {s.requirement === "required" && " (Required)"}
                </span>
              ))}
            </div>
          </Section>
        )}

        {/* Channels */}
        {pos.channels?.length > 0 && (
          <Section title="Channels">
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {pos.channels.map((c) => (
                <span key={c.id} style={{
                  padding: "6px 14px", borderRadius: 20, fontSize: "0.82rem",
                  background: c.requirement === "required" ? "var(--teal-light)" : "var(--gray-100)",
                  color: c.requirement === "required" ? "var(--teal)" : "var(--gray-600)",
                  border: c.requirement === "required" ? "1px solid var(--teal)" : "1px solid var(--gray-200)",
                }}>
                  {c.channel.name} · {c.experience}
                  {c.requirement === "required" && " (Required)"}
                </span>
              ))}
            </div>
          </Section>
        )}

        {/* Applications */}
        {pos.positionApps?.length > 0 && (
          <Section title="Applications">
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {pos.positionApps.map((a) => (
                <span key={a.id} style={{
                  padding: "6px 14px", borderRadius: 20, fontSize: "0.82rem",
                  background: a.requirement === "required" ? "var(--teal-light)" : "var(--gray-100)",
                  color: a.requirement === "required" ? "var(--teal)" : "var(--gray-600)",
                  border: a.requirement === "required" ? "1px solid var(--teal)" : "1px solid var(--gray-200)",
                }}>
                  {a.application.name}
                  {a.requirement === "required" && " (Required)"}
                </span>
              ))}
            </div>
          </Section>
        )}

        {/* Environment */}
        {pos.environment && (
          <Section title="Work Environment">
            <DetailGrid>
              {workLocation.length > 0 && (
                <DetailItem label="Work Location" value={workLocation.join(", ")} />
              )}
              {pos.environment.equipmentPolicy && (
                <DetailItem label="Equipment" value={
                  pos.environment.equipmentPolicy === "provided" ? "Provided by company" : "Bring your own"
                } />
              )}
            </DetailGrid>
            {pos.environment.requirements && (
              <p style={{ marginTop: 12, fontSize: "0.85rem", color: "var(--gray-600)" }}>{pos.environment.requirements}</p>
            )}
          </Section>
        )}

        {/* Schedule */}
        {schedule.length > 0 && (
          <Section title={`Availability / Schedule${pos.timezone ? ` (${pos.timezone})` : ""}`}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {schedule.map((s) => (
                <span key={s.id} style={{
                  padding: "6px 14px", borderRadius: 20, fontSize: "0.82rem",
                  background: "var(--gray-100)", color: "var(--gray-600)",
                }}>
                  {DAY_LABELS[s.day] || s.day}: {to12hr(s.startTime)} - {to12hr(s.endTime)} {tzLabel(pos.timezone)}
                </span>
              ))}
            </div>
          </Section>
        )}

        {/* Screening Questions */}
        {questions.length > 0 && (
          <Section title="Screening Questions">
            <ol style={{ margin: "0 0 0 20px", fontSize: "0.85rem", color: "var(--gray-700)" }}>
              {questions.filter((q) => q.enabled !== false).map((q, i) => (
                <li key={i} style={{ marginBottom: 6 }}>{q.text}</li>
              ))}
            </ol>
          </Section>
        )}
      </div>

      {/* Admin action area */}
      {!result && (
        <div className="card" style={{ padding: "24px 28px", marginTop: 24 }}>
          <h2 style={{ fontSize: "1.1rem", marginBottom: 16, color: "var(--gray-800)" }}>Your Decision</h2>

          <div className="form-group">
            <label className="form-label">Note to Business User (required if sending back)</label>
            <textarea
              className="form-input"
              rows={4}
              placeholder="Explain what needs to be changed before this posting can be approved..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              style={{ resize: "vertical" }}
            />
          </div>

          <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
            <button
              className="btn-primary"
              style={{ width: "auto", background: "#10b981" }}
              onClick={() => handleAction("approve")}
              disabled={submitting}
            >
              {submitting ? "..." : "Approve Posting"}
            </button>
            <button
              className="btn-secondary"
              style={{ width: "auto", color: "#ef4444", borderColor: "#ef4444" }}
              onClick={() => handleAction("request_changes")}
              disabled={submitting}
            >
              {submitting ? "..." : "Request Changes"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="card" style={{ padding: "20px 24px" }}>
      <h3 style={{ fontSize: "0.95rem", color: "var(--gray-700)", marginBottom: 12, fontWeight: 600 }}>{title}</h3>
      {children}
    </div>
  );
}

function DetailGrid({ children }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "12px 24px" }}>
      {children}
    </div>
  );
}

function DetailItem({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: "0.75rem", color: "var(--gray-400)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 2 }}>
        {label}
      </div>
      <div style={{ fontSize: "0.9rem", color: "var(--gray-800)" }}>{value}</div>
    </div>
  );
}
