"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import ProgressBubbles from "./ProgressBubbles";

const DAY_ORDER = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
const DAY_LABELS = { monday: "Mon", tuesday: "Tue", wednesday: "Wed", thursday: "Thu", friday: "Fri", saturday: "Sat", sunday: "Sun" };

const HIRING_MODELS = [
  { value: "direct_hire", label: "Direct Hire", desc: "One-time $500 placement fee" },
  { value: "contract", label: "Contract through Remagent", desc: "1099/Corp-to-Corp — convenience fee applied" },
  { value: "w2_employee", label: "W-2 Employee", desc: "Remagent hires PU — W-2 markup + convenience fee" },
];

function formatDate(d) {
  if (!d) return "";
  return new Date(d).toISOString().split("T")[0];
}

export default function SowFormClient() {
  const { offerId } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [offer, setOffer] = useState(null);
  const [role, setRole] = useState(null);
  const [agreeing, setAgreeing] = useState(false);
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [declineReason, setDeclineReason] = useState("");
  const [convenienceFee, setConvenienceFee] = useState(3);
  const [w2Markup, setW2Markup] = useState(11);

  const [form, setForm] = useState({
    resourceName: "",
    resourceTitle: "",
    isExtension: false,
    previousPo: "",
    additionalSkills: "",
    workDescription: "",
    channels: "",
    schedule: {},
    reportingManager: "",
    department: "",
    workLocations: "",
    hourlyRate: "",
    estimatedHours: "",
    startDate: "",
    endDate: "",
    equipment: "",
    hiringModel: "",
    billingRate: "",
    poNumber: "",
    status: "draft",
  });

  useEffect(() => {
    fetch(`/api/sow?offerId=${offerId}`)
      .then((r) => r.json())
      .then((data) => {
        setOffer(data.offer);
        setRole(data.role);
        setConvenienceFee(data.convenienceFee ?? 3);
        setW2Markup(data.w2Markup ?? 11);
        if (data.sow) {
          setForm({
            ...data.sow,
            startDate: formatDate(data.sow.startDate),
            endDate: formatDate(data.sow.endDate),
            hourlyRate: data.sow.hourlyRate || "",
            estimatedHours: data.sow.estimatedHours || "",
            billingRate: data.sow.billingRate || "",
            schedule: data.sow.schedule || {},
          });
        } else {
          setForm((prev) => ({
            ...prev,
            resourceName: data.offer?.professionalName || "",
            resourceTitle: data.offer?.professionalTitle || "",
          }));
        }
      })
      .finally(() => setLoading(false));
  }, [offerId]);

  const updateField = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const updateSchedule = (day, field, value) => {
    setForm((prev) => ({
      ...prev,
      schedule: {
        ...prev.schedule,
        [day]: { ...(prev.schedule?.[day] || {}), [field]: value },
      },
    }));
  };

  const toggleDay = (day) => {
    setForm((prev) => {
      const newSchedule = { ...prev.schedule };
      if (newSchedule[day]) {
        delete newSchedule[day];
      } else {
        newSchedule[day] = { start: "09:00", end: "17:00" };
      }
      return { ...prev, schedule: newSchedule };
    });
  };

  // Auto-calculate billing rate
  useEffect(() => {
    if (form.hiringModel && form.hiringModel !== "direct_hire" && form.hourlyRate) {
      const rate = parseFloat(form.hourlyRate) || 0;
      let computed = "";
      if (form.hiringModel === "contract") {
        computed = (rate + convenienceFee).toFixed(2);
      } else if (form.hiringModel === "w2_employee") {
        computed = (rate * (1 + w2Markup / 100) + convenienceFee).toFixed(2);
      }
      if (computed) updateField("billingRate", computed);
    }
  }, [form.hourlyRate, form.hiringModel, convenienceFee, w2Markup]);

  const isDirectHire = form.hiringModel === "direct_hire";

  // Validation for required fields
  const validateRequired = () => {
    const missing = [];
    if (!form.resourceName?.trim()) missing.push("Resource Name");
    if (!form.resourceTitle?.trim()) missing.push("Resource Job Title");
    if (!form.workDescription?.trim()) missing.push("Work to be Performed");
    if (!form.workLocations?.trim()) missing.push("Work Location(s)");
    if (!form.hourlyRate) missing.push("Hourly Rate");
    if (!form.estimatedHours) missing.push("Estimated Weekly Hours");
    if (!form.startDate) missing.push("Start Date");
    if (!form.hiringModel) missing.push("Hiring Model");
    return missing;
  };

  const handleSave = async (status = "draft") => {
    if (status === "sent") {
      const missing = validateRequired();
      if (missing.length > 0) {
        alert(`Please fill in the following required fields:\n\n${missing.join("\n")}`);
        return;
      }
    }
    const setFn = status === "sent" ? setSending : setSaving;
    setFn(true);
    try {
      await fetch("/api/sow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ offerId, ...form, status }),
      });
      if (status === "sent") {
        router.push("/invites");
      }
    } catch {}
    setFn(false);
  };

  const handleAgree = async (action, reason) => {
    if (action === "agree" && !confirm("By agreeing, you confirm you accept the terms of this Statement of Work. Continue?")) return;
    setAgreeing(true);
    try {
      const body = { offerId, action };
      if (action === "decline" && reason) body.declineReason = reason;
      const res = await fetch("/api/sow", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        router.push("/invitations");
      }
    } catch {}
    setAgreeing(false);
  };

  const handleResend = async () => {
    if (confirm("Resend this updated SOW to the professional for review?")) {
      handleSave("sent");
    }
  };

  if (loading) {
    return (
      <div className="onboarding-loading">
        <div className="onboarding-spinner" />
        <p>Loading...</p>
      </div>
    );
  }

  if (!offer) {
    return (
      <div className="positions-page">
        <div className="card" style={{ textAlign: "center", padding: "48px 24px" }}>
          <h3 style={{ color: "var(--gray-600)" }}>Not found</h3>
          <p style={{ color: "var(--gray-400)" }}>This invitation was not found or you don't have access.</p>
        </div>
      </div>
    );
  }

  const isPro = role === "professional";
  const isSent = form.status === "sent";
  const isAgreed = form.status === "agreed";
  const isDeclined = form.status === "declined";
  const readOnly = isPro || isSent || isAgreed || (isDeclined && isPro);

  const labelStyle = { fontSize: "0.82rem", fontWeight: 600, color: "var(--gray-600)", marginBottom: 4, display: "block" };
  const inputStyle = { width: "100%", margin: 0 };
  const req = <span style={{ color: "#ef4444" }}>*</span>;

  return (
    <div className="positions-page" style={{ maxWidth: 800, margin: "0 auto" }}>
      <div className="page-header">
        <button
          onClick={() => router.push(isPro ? "/invitations" : "/invites")}
          style={{ background: "none", border: "none", color: "var(--teal)", cursor: "pointer", fontSize: "0.85rem", fontWeight: 600, marginBottom: 8, padding: 0 }}
        >
          &larr; Back to {isPro ? "Invitations" : "Invites"}
        </button>
        <h1 className="page-title">Statement of Work</h1>
        <p className="page-subtitle">
          {offer.positionTitle} — {offer.professionalName}
        </p>
      </div>

      {/* Progress */}
      <div className="card" style={{ marginBottom: 20 }}>
        <ProgressBubbles currentStep={offer.progressStep || 1} role={isPro ? "professional" : "business"} />
      </div>

      {/* Status banners */}
      {isAgreed && (
        <div style={{ padding: "14px 18px", marginBottom: 16, background: "#d1fae5", borderLeft: "4px solid #10b981", borderRadius: 6, fontSize: "0.88rem", color: "#065f46" }}>
          This Statement of Work has been agreed to. The hire is active.
        </div>
      )}
      {isDeclined && (
        <div style={{ padding: "14px 18px", marginBottom: 16, background: "#fee2e2", borderLeft: "4px solid #ef4444", borderRadius: 6, fontSize: "0.88rem", color: "#991b1b" }}>
          <div style={{ fontWeight: 600, marginBottom: form.declineReason ? 8 : 0 }}>
            {isPro ? "You declined this Statement of Work." : "This Statement of Work was declined by the professional."}
          </div>
          {form.declineReason && (
            <div style={{ background: "#fff5f5", padding: "10px 14px", borderRadius: 6, marginTop: 6 }}>
              <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "#991b1b", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.04em" }}>Reason for Decline</div>
              <p style={{ margin: 0, fontSize: "0.88rem", color: "#7f1d1d", whiteSpace: "pre-wrap" }}>{form.declineReason}</p>
            </div>
          )}
          {!isPro && (
            <p style={{ margin: "8px 0 0", fontSize: "0.82rem", color: "#991b1b" }}>
              You can edit the SOW below and resend it to the professional.
            </p>
          )}
        </div>
      )}
      {isSent && isPro && (
        <div style={{ padding: "14px 18px", marginBottom: 16, background: "#fef3c7", borderLeft: "4px solid #f59e0b", borderRadius: 6, fontSize: "0.88rem", color: "#92400e" }}>
          Please review the details below and agree or decline.
        </div>
      )}
      {isSent && !isPro && (
        <div style={{ padding: "14px 18px", marginBottom: 16, background: "#dbeafe", borderLeft: "4px solid #3b82f6", borderRadius: 6, fontSize: "0.88rem", color: "#1e40af" }}>
          SOW has been sent to the professional. Waiting for their response.
        </div>
      )}

      {/* Form */}
      <div className="card">
        <div className="card-title" style={{ marginBottom: 20 }}>Details</div>

        {/* Hiring Model — at top */}
        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>Hiring Model {req}</label>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {HIRING_MODELS.map((model) => (
              <label
                key={model.value}
                style={{
                  display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 14px",
                  borderRadius: 8, cursor: readOnly ? "default" : "pointer",
                  border: form.hiringModel === model.value ? "2px solid var(--teal)" : "2px solid var(--gray-200)",
                  background: form.hiringModel === model.value ? "var(--teal-dim)" : "white",
                }}
              >
                <input
                  type="radio" name="hiringModel" value={model.value}
                  checked={form.hiringModel === model.value}
                  onChange={(e) => updateField("hiringModel", e.target.value)}
                  disabled={readOnly} style={{ marginTop: 2 }}
                />
                <div>
                  <div style={{ fontWeight: 600, fontSize: "0.88rem", color: "var(--gray-700)" }}>{model.label}</div>
                  <div style={{ fontSize: "0.78rem", color: "var(--gray-500)" }}>{model.desc}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
          <div>
            <label style={labelStyle}>Resource Name {req}</label>
            <input className="form-input" style={inputStyle} value={form.resourceName || ""} onChange={(e) => updateField("resourceName", e.target.value)} readOnly={readOnly} />
          </div>
          <div>
            <label style={labelStyle}>Resource Job Title {req}</label>
            <input className="form-input" style={inputStyle} value={form.resourceTitle || ""} onChange={(e) => updateField("resourceTitle", e.target.value)} readOnly={readOnly} />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
          <div>
            <label style={labelStyle}>
              <input type="checkbox" checked={form.isExtension} onChange={(e) => updateField("isExtension", e.target.checked)} disabled={readOnly} style={{ marginRight: 6 }} />
              Is this an Extension?
            </label>
            {form.isExtension && (
              <input className="form-input" style={{ ...inputStyle, marginTop: 6 }} placeholder="Previous PO#" value={form.previousPo || ""} onChange={(e) => updateField("previousPo", e.target.value)} readOnly={readOnly} />
            )}
          </div>
          <div>
            <label style={labelStyle}>PO Number</label>
            <input className="form-input" style={inputStyle} placeholder="Internal tracking" value={form.poNumber || ""} onChange={(e) => updateField("poNumber", e.target.value)} readOnly={readOnly} />
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Additional Skills & Experience Required</label>
          <textarea className="form-input" style={{ ...inputStyle, minHeight: 70 }} value={form.additionalSkills || ""} onChange={(e) => updateField("additionalSkills", e.target.value)} readOnly={readOnly} />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Work to be Performed {req}</label>
          <textarea className="form-input" style={{ ...inputStyle, minHeight: 100 }} value={form.workDescription || ""} onChange={(e) => updateField("workDescription", e.target.value)} readOnly={readOnly} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
          <div>
            <label style={labelStyle}>Channels</label>
            <input className="form-input" style={inputStyle} value={form.channels || ""} onChange={(e) => updateField("channels", e.target.value)} readOnly={readOnly} />
          </div>
          <div>
            <label style={labelStyle}>Work Location(s) {req}</label>
            <input className="form-input" style={inputStyle} value={form.workLocations || ""} onChange={(e) => updateField("workLocations", e.target.value)} readOnly={readOnly} />
          </div>
        </div>

        {/* Schedule — hidden for Direct Hire */}
        {!isDirectHire && (
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>General Schedule</label>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
              {DAY_ORDER.map((day) => {
                const active = !!form.schedule?.[day];
                return (
                  <button key={day} type="button" onClick={() => !readOnly && toggleDay(day)}
                    style={{
                      padding: "6px 14px", borderRadius: 6, fontSize: "0.82rem", fontWeight: 600,
                      border: active ? "2px solid var(--teal)" : "2px solid var(--gray-200)",
                      background: active ? "var(--teal-dim)" : "white",
                      color: active ? "var(--teal)" : "var(--gray-400)",
                      cursor: readOnly ? "default" : "pointer",
                    }}
                  >{DAY_LABELS[day]}</button>
                );
              })}
            </div>
            {DAY_ORDER.filter((d) => form.schedule?.[d]).map((day) => (
              <div key={day} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
                <span style={{ width: 40, fontSize: "0.82rem", fontWeight: 600, color: "var(--gray-600)" }}>{DAY_LABELS[day]}</span>
                <input type="time" className="form-input" style={{ width: 130, margin: 0, padding: "4px 8px", fontSize: "0.82rem" }} value={form.schedule[day]?.start || "09:00"} onChange={(e) => updateSchedule(day, "start", e.target.value)} readOnly={readOnly} />
                <span style={{ color: "var(--gray-400)" }}>to</span>
                <input type="time" className="form-input" style={{ width: 130, margin: 0, padding: "4px 8px", fontSize: "0.82rem" }} value={form.schedule[day]?.end || "17:00"} onChange={(e) => updateSchedule(day, "end", e.target.value)} readOnly={readOnly} />
              </div>
            ))}
          </div>
        )}

        {/* Reporting Manager / Department — hidden for Direct Hire */}
        {!isDirectHire && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
            <div>
              <label style={labelStyle}>Reporting Manager</label>
              <input className="form-input" style={inputStyle} value={form.reportingManager || ""} onChange={(e) => updateField("reportingManager", e.target.value)} readOnly={readOnly} />
            </div>
            <div>
              <label style={labelStyle}>Business Unit / Department</label>
              <input className="form-input" style={inputStyle} value={form.department || ""} onChange={(e) => updateField("department", e.target.value)} readOnly={readOnly} />
            </div>
          </div>
        )}

        {/* Rates */}
        <div style={{ display: "grid", gridTemplateColumns: isDirectHire || isPro ? "1fr 1fr" : "1fr 1fr 1fr", gap: 16, marginBottom: 16 }}>
          <div>
            <label style={labelStyle}>Hourly Rate ($) {req}</label>
            <input type="number" className="form-input" style={inputStyle} min="10" step="0.50" value={form.hourlyRate || ""} onChange={(e) => updateField("hourlyRate", e.target.value)} readOnly={readOnly} />
          </div>
          <div>
            <label style={labelStyle}>Estimated Weekly Hours {req}</label>
            <input type="number" className="form-input" style={inputStyle} min="1" value={form.estimatedHours || ""} onChange={(e) => updateField("estimatedHours", e.target.value)} readOnly={readOnly} />
          </div>
          {/* Billing rate — hidden for Direct Hire AND hidden from PU */}
          {!isDirectHire && !isPro && (
            <div>
              <label style={labelStyle}>
                Billing Rate ($)
                <span style={{ fontWeight: 400, fontSize: "0.72rem", color: "var(--gray-400)", marginLeft: 4 }}>
                  {form.hiringModel === "contract" ? "(rate + fee)" : `(rate × ${(1 + w2Markup / 100).toFixed(2)} + fee)`}
                </span>
              </label>
              <input type="number" className="form-input" style={{ ...inputStyle, background: "var(--gray-50)", color: "var(--gray-600)" }} value={form.billingRate || ""} readOnly />
            </div>
          )}
        </div>

        {/* Dates */}
        <div style={{ display: "grid", gridTemplateColumns: isDirectHire ? "1fr" : "1fr 1fr", gap: 16, marginBottom: 16 }}>
          <div>
            <label style={labelStyle}>Start Date {req}</label>
            <input type="date" className="form-input" style={inputStyle} value={form.startDate || ""} onChange={(e) => updateField("startDate", e.target.value)} readOnly={readOnly} />
          </div>
          {!isDirectHire && (
            <div>
              <label style={labelStyle}>End Date</label>
              <input type="date" className="form-input" style={inputStyle} value={form.endDate || ""} onChange={(e) => updateField("endDate", e.target.value)} readOnly={readOnly} />
            </div>
          )}
        </div>

        {/* Equipment — hidden for Direct Hire */}
        {!isDirectHire && (
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Equipment to be Supplied by Professional</label>
            <textarea className="form-input" style={{ ...inputStyle, minHeight: 60 }} value={form.equipment || ""} onChange={(e) => updateField("equipment", e.target.value)} readOnly={readOnly} />
          </div>
        )}
      </div>

      {/* Actions */}
      {!isPro && !isSent && !isAgreed && (
        <div style={{ display: "flex", gap: 12, marginTop: 20, justifyContent: "flex-end" }}>
          <button className="btn-secondary" style={{ width: "auto", padding: "10px 24px" }} onClick={() => handleSave("draft")} disabled={saving}>
            {saving ? "Saving..." : "Save Draft"}
          </button>
          <button className="btn-primary" style={{ width: "auto", padding: "10px 24px" }}
            onClick={() => { if (confirm("Send this SOW to the professional for review? They will be notified.")) handleSave("sent"); }}
            disabled={sending}
          >
            {sending ? "Sending..." : "Send to Professional"}
          </button>
        </div>
      )}

      {isPro && isSent && (
        <div style={{ display: "flex", gap: 12, marginTop: 20, justifyContent: "flex-end" }}>
          <button className="btn-secondary" style={{ width: "auto", padding: "10px 24px", color: "#ef4444", borderColor: "#ef4444" }} onClick={() => setShowDeclineModal(true)} disabled={agreeing}>
            Decline
          </button>
          <button className="btn-primary" style={{ width: "auto", padding: "10px 24px", background: "#10b981" }} onClick={() => handleAgree("agree")} disabled={agreeing}>
            {agreeing ? "Processing..." : "I Agree to this SOW"}
          </button>
        </div>
      )}

      {/* BU can resend after decline */}
      {!isPro && isDeclined && (
        <div style={{ display: "flex", gap: 12, marginTop: 20, justifyContent: "flex-end" }}>
          <button className="btn-secondary" style={{ width: "auto", padding: "10px 24px" }} onClick={() => handleSave("draft")} disabled={saving}>
            {saving ? "Saving..." : "Save Draft"}
          </button>
          <button className="btn-primary" style={{ width: "auto", padding: "10px 24px" }} onClick={handleResend} disabled={sending}>
            {sending ? "Sending..." : "Resend SOW"}
          </button>
        </div>
      )}

      {/* Decline Modal */}
      {showDeclineModal && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.4)", display: "flex",
          alignItems: "center", justifyContent: "center", zIndex: 1000,
        }}>
          <div style={{
            background: "#fff", borderRadius: 12, padding: 28, width: 440,
            maxWidth: "90vw", boxShadow: "0 10px 40px rgba(0,0,0,0.15)",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: "1.1rem", color: "var(--gray-800)" }}>Decline Statement of Work</h3>
              <button onClick={() => setShowDeclineModal(false)} style={{ background: "none", border: "none", fontSize: "1.3rem", color: "var(--gray-400)", cursor: "pointer" }}>&times;</button>
            </div>
            <p style={{ fontSize: "0.88rem", color: "var(--gray-500)", marginBottom: 16, lineHeight: 1.5 }}>
              Please let the business know why you are declining and if there are any adjustments that could be made (e.g. rate, schedule, terms).
            </p>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--gray-600)", marginBottom: 6, display: "block" }}>
                Reason for Declining / Suggested Adjustments
              </label>
              <textarea
                className="form-input"
                rows={4}
                placeholder="E.g. The hourly rate should be $X, or I need a different start date..."
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                style={{ width: "100%", resize: "vertical", margin: 0 }}
              />
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button className="btn-secondary" style={{ width: "auto", padding: "8px 20px" }} onClick={() => setShowDeclineModal(false)}>
                Cancel
              </button>
              <button
                className="btn-primary"
                style={{ width: "auto", padding: "8px 20px", background: "#ef4444" }}
                onClick={() => {
                  setShowDeclineModal(false);
                  handleAgree("decline", declineReason);
                }}
                disabled={agreeing}
              >
                {agreeing ? "Declining..." : "Submit & Decline"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
