"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { convertTime, to12hr, tzLabel } from "@/utilities/TimeZoneHelper";

const DAY_ORDER = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
const DAY_LABELS = { monday: "Mon", tuesday: "Tue", wednesday: "Wed", thursday: "Thu", friday: "Fri", saturday: "Sat", sunday: "Sun" };

function stripHtml(html) {
  if (!html) return "";
  return html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();
}

export default function JobDetailClient({ jobId }) {
  const { data: session } = useSession();
  const viewerTz = session?.user?.timezone || "Americas/Eastern";
  const router = useRouter();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showApply, setShowApply] = useState(false);
  const [coverMessage, setCoverMessage] = useState("");
  const [screeningAnswers, setScreeningAnswers] = useState([]);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetch(`/api/jobs/${jobId}`)
      .then((r) => r.json())
      .then((data) => {
        setJob(data.job || null);
        // Initialize screening answers
        const questions = data.job?.screeningQuestions;
        if (Array.isArray(questions)) {
          const enabled = questions.filter((q) => q.enabled !== false);
          setScreeningAnswers(enabled.map((q) => ({ question: q.text, answer: "" })));
        }
      })
      .finally(() => setLoading(false));
  }, [jobId]);

  const handleApply = async () => {
    setApplying(true);
    setError("");
    try {
      const res = await fetch(`/api/jobs/${jobId}/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          coverMessage,
          screeningAnswers: screeningAnswers.length > 0 ? screeningAnswers : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to submit application");
      } else {
        setSuccess(true);
        setShowApply(false);
        setJob((prev) => ({ ...prev, alreadyApplied: true, applicationStatus: "new" }));
      }
    } catch {
      setError("Something went wrong. Please try again.");
    }
    setApplying(false);
  };

  if (loading) {
    return (
      <div className="onboarding-loading">
        <div className="onboarding-spinner" />
        <p>Loading job details...</p>
      </div>
    );
  }

  if (!job) {
    return <div className="card" style={{ padding: 24 }}>Job posting not found.</div>;
  }

  const description = stripHtml(job.description);
  const schedule = (job.availability || []).sort((a, b) => DAY_ORDER.indexOf(a.day) - DAY_ORDER.indexOf(b.day));
  const requiredSkills = job.skills?.filter((s) => s.requirement === "required") || [];
  const desiredSkills = job.skills?.filter((s) => s.requirement !== "required") || [];
  const channels = job.channels || [];
  const apps = job.apps || [];
  const envLabels = { home: "Remote", office: "In Office", mix: "Hybrid", optional: "Flexible" };
  const workLoc = (() => {
    if (!job.environment?.workLocation) return null;
    const locs = Array.isArray(job.environment.workLocation) ? job.environment.workLocation : (() => { try { return JSON.parse(job.environment.workLocation); } catch { return []; } })();
    return locs.map((l) => envLabels[l] || l).join(" / ");
  })();
  const questions = Array.isArray(job.screeningQuestions) ? job.screeningQuestions.filter((q) => q.enabled !== false) : [];

  return (
    <div>
      <button className="btn-link" onClick={() => router.back()} style={{ marginBottom: 16, fontSize: "0.85rem" }}>
        &larr; Back to Jobs
      </button>

      <div style={{ display: "flex", gap: 24 }}>
        {/* Main content */}
        <div style={{ flex: 1 }}>
          <div className="card" style={{ padding: 28 }}>
            {/* Header */}
            <div style={{ display: "flex", gap: 16, marginBottom: 20 }}>
              <div style={{
                width: 60, height: 60, minWidth: 60, borderRadius: 12,
                background: "var(--teal-dim)", border: "1px solid var(--teal-border)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "1.3rem", fontWeight: 700, color: "var(--teal)", overflow: "hidden",
              }}>
                {job.company?.logo ? (
                  <img src={`/${job.company.logo}`} alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                ) : (
                  job.company?.name?.[0] || "?"
                )}
              </div>
              <div>
                <h1 style={{ fontSize: "1.4rem", fontWeight: 700, color: "var(--gray-800)", marginBottom: 4 }}>
                  {job.title || "Untitled Position"}
                </h1>
                <div style={{ display: "flex", gap: 16, fontSize: "0.88rem", color: "var(--gray-500)", flexWrap: "wrap" }}>
                  {job.company?.name && <span style={{ fontWeight: 500, color: "var(--gray-700)" }}>{job.company.name}</span>}
                  {!job.company?.name && job.showCompanyName === false && <span style={{ fontStyle: "italic" }}>Company name revealed after acceptance</span>}
                  {(job.company?.city || job.company?.state) && <span>{[job.company.city, job.company.state].filter(Boolean).join(", ")}</span>}
                  {workLoc && <span>{workLoc}</span>}
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
              {job.alreadyApplied ? (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{
                    padding: "8px 20px", borderRadius: 8, fontSize: "0.88rem", fontWeight: 600,
                    background: "#10b98118", color: "#10b981",
                  }}>
                    Applied
                  </span>
                  <span style={{ fontSize: "0.82rem", color: "var(--gray-400)" }}>
                    Status: {job.applicationStatus || "pending"}
                  </span>
                </div>
              ) : (
                <button className="btn-primary" style={{ width: "auto", padding: "10px 32px" }} onClick={() => setShowApply(true)}>
                  Apply Now
                </button>
              )}
            </div>

            {success && (
              <div style={{ padding: 16, background: "#10b98118", borderRadius: 8, marginBottom: 20, color: "#065f46", fontSize: "0.88rem" }}>
                Your application has been submitted successfully!
              </div>
            )}

            {/* Description */}
            {description && (
              <Section title="Job Description">
                <div style={{ fontSize: "0.9rem", color: "var(--gray-600)", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
                  {description}
                </div>
              </Section>
            )}

            {/* Skills */}
            {(requiredSkills.length > 0 || desiredSkills.length > 0) && (
              <Section title="Skills">
                {requiredSkills.length > 0 && (
                  <div style={{ marginBottom: 8 }}>
                    <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--gray-600)", textTransform: "uppercase" }}>Required</span>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
                      {requiredSkills.map((s) => (
                        <span key={s.id} className="profile-tag">{s.name}</span>
                      ))}
                    </div>
                  </div>
                )}
                {desiredSkills.length > 0 && (
                  <div>
                    <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--gray-600)", textTransform: "uppercase" }}>Desired</span>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
                      {desiredSkills.map((s) => (
                        <span key={s.id} style={{
                          fontSize: "0.78rem", padding: "3px 10px", borderRadius: 12,
                          background: "var(--gray-100)", color: "var(--gray-500)",
                        }}>
                          {s.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </Section>
            )}

            {/* Channels */}
            {channels.length > 0 && (
              <Section title="Channels">
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {channels.map((c) => (
                    <span key={c.id} style={{
                      fontSize: "0.78rem", padding: "3px 10px", borderRadius: 12,
                      background: c.requirement === "required" ? "var(--teal-dim)" : "var(--gray-100)",
                      color: c.requirement === "required" ? "var(--teal)" : "var(--gray-500)",
                      border: c.requirement === "required" ? "1px solid var(--teal-border)" : "none",
                    }}>
                      {c.name} {c.requirement === "required" && "(required)"}
                    </span>
                  ))}
                </div>
              </Section>
            )}

            {/* Applications */}
            {apps.length > 0 && (
              <Section title="Software / Applications">
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {apps.map((a) => (
                    <span key={a.id} style={{
                      fontSize: "0.78rem", padding: "3px 10px", borderRadius: 12,
                      background: a.requirement === "required" ? "var(--teal-dim)" : "var(--gray-100)",
                      color: a.requirement === "required" ? "var(--teal)" : "var(--gray-500)",
                      border: a.requirement === "required" ? "1px solid var(--teal-border)" : "none",
                    }}>
                      {a.name} {a.requirement === "required" && "(required)"}
                    </span>
                  ))}
                </div>
              </Section>
            )}

            {/* Schedule */}
            {schedule.length > 0 && (
              <Section title="Schedule">
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 8 }}>
                  {schedule.map((s) => (
                    <div key={s.day} style={{
                      padding: "10px 14px", background: "var(--teal-dim)", borderRadius: 8,
                      border: "1px solid var(--teal-border)",
                    }}>
                      <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--teal)", marginBottom: 2 }}>
                        {DAY_LABELS[s.day] || s.day}
                      </div>
                      <div style={{ fontSize: "0.8rem", color: "var(--gray-600)" }}>
                        {to12hr(convertTime(s.startTime, job.timezone, viewerTz))} - {to12hr(convertTime(s.endTime, job.timezone, viewerTz))} {tzLabel(viewerTz)}
                      </div>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* Equipment */}
            {job.environment?.equipmentPolicy && (
              <Section title="Equipment">
                <p style={{ fontSize: "0.88rem", color: "var(--gray-600)" }}>
                  {job.environment.equipmentPolicy === "provided"
                    ? "Company will provide the required hardware"
                    : "BYOD - Professional uses their own equipment"}
                </p>
                {job.environment.requirements && (
                  <p style={{ fontSize: "0.85rem", color: "var(--gray-500)", marginTop: 8, whiteSpace: "pre-wrap" }}>
                    {job.environment.requirements}
                  </p>
                )}
              </Section>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div style={{ width: 280, minWidth: 280 }}>
          <div className="card" style={{ padding: 20, position: "sticky", top: 80 }}>
            <h3 style={{ fontSize: "0.88rem", fontWeight: 600, color: "var(--gray-700)", marginBottom: 16 }}>Position Details</h3>
            <DetailRow label="Rate" value={job.regularRate ? `$${job.regularRate}/hr` : "Not specified"} />
            <DetailRow label="Contract" value={
              job.contractType === "open_ended" ? "Open Ended" :
              job.contractType === "fixed" ? "Fixed Term" :
              job.contractType === "direct_hire" ? "Direct Hire" : "Not specified"
            } />
            <DetailRow label="Openings" value={job.numberOfHires || 1} />
            <DetailRow label="Start" value={
              job.startOption === "immediately" ? "Immediately" :
              job.startOption === "flexible" ? "Flexible" :
              job.expectedStartDate ? new Date(job.expectedStartDate).toLocaleDateString() : "Not specified"
            } />
            {job.expectedEndDate && (
              <DetailRow label="End" value={new Date(job.expectedEndDate).toLocaleDateString()} />
            )}
            {job.company?.industry && (
              <DetailRow label="Industry" value={job.company.industry} />
            )}
          </div>
        </div>
      </div>

      {/* Apply Modal */}
      {showApply && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000,
          display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
        }} onClick={() => setShowApply(false)}>
          <div className="card" style={{ padding: 28, width: "100%", maxWidth: 600, maxHeight: "80vh", overflow: "auto" }}
            onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: "1.15rem", fontWeight: 700, color: "var(--gray-800)", marginBottom: 4 }}>
              Apply to {job.title}
            </h2>
            {job.company?.name && (
              <p style={{ fontSize: "0.88rem", color: "var(--gray-500)", marginBottom: 20 }}>{job.company.name}</p>
            )}

            {error && (
              <div style={{ padding: 12, background: "#fee2e2", borderRadius: 8, marginBottom: 16, color: "#991b1b", fontSize: "0.85rem" }}>
                {error}
              </div>
            )}

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "var(--gray-700)", marginBottom: 6 }}>
                Cover Message
              </label>
              <textarea
                className="form-input form-textarea"
                rows={4}
                placeholder="Introduce yourself and explain why you're a great fit for this position..."
                value={coverMessage}
                onChange={(e) => setCoverMessage(e.target.value)}
              />
            </div>

            {/* Screening Questions */}
            {questions.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "var(--gray-700)", marginBottom: 12 }}>
                  Screening Questions
                </label>
                {questions.map((q, i) => (
                  <div key={i} style={{ marginBottom: 16 }}>
                    <p style={{ fontSize: "0.85rem", color: "var(--gray-600)", marginBottom: 6 }}>
                      {i + 1}. {q.text}
                    </p>
                    <textarea
                      className="form-input form-textarea"
                      rows={2}
                      placeholder="Your answer..."
                      value={screeningAnswers[i]?.answer || ""}
                      onChange={(e) => {
                        const updated = [...screeningAnswers];
                        updated[i] = { ...updated[i], answer: e.target.value };
                        setScreeningAnswers(updated);
                      }}
                    />
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
              <button className="btn-secondary" onClick={() => setShowApply(false)} disabled={applying}>Cancel</button>
              <button className="btn-primary" style={{ width: "auto", padding: "10px 28px" }} onClick={handleApply} disabled={applying}>
                {applying ? "Submitting..." : "Submit Application"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <h3 style={{ fontSize: "0.88rem", fontWeight: 600, color: "var(--gray-700)", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.04em" }}>
        {title}
      </h3>
      {children}
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", padding: "8px 0", borderBottom: "1px solid var(--gray-100)" }}>
      <span style={{ color: "var(--gray-500)" }}>{label}</span>
      <span style={{ fontWeight: 500, color: "var(--gray-700)" }}>{value}</span>
    </div>
  );
}
