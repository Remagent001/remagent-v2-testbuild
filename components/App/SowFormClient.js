"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import ProgressBubbles from "./ProgressBubbles";

const DAY_ORDER = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
const DAY_LABELS = { monday: "Mon", tuesday: "Tue", wednesday: "Wed", thursday: "Thu", friday: "Fri", saturday: "Sat", sunday: "Sun" };

const HIRING_MODELS = [
  { value: "direct_hire", label: "Direct Hire", desc: "One-time $500 placement fee" },
  { value: "contract", label: "Contract through Remagent", desc: "1099/Corp-to-Corp — convenience fee applied" },
  { value: "w2_employee", label: "W-2 Employee", desc: "Remagent hires PU — 11% + convenience fee" },
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
  const [convenienceFee, setConvenienceFee] = useState(3);

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

  // Auto-calculate billing rate based on hiring model
  const calcBillingRate = () => {
    const rate = parseFloat(form.hourlyRate) || 0;
    if (!rate || !form.hiringModel) return "";
    if (form.hiringModel === "contract") {
      return (rate + convenienceFee).toFixed(2);
    }
    if (form.hiringModel === "w2_employee") {
      return (rate * 1.11 + convenienceFee).toFixed(2);
    }
    return ""; // direct_hire has no billing rate
  };

  // Recompute billing rate when dependencies change
  useEffect(() => {
    if (form.hiringModel && form.hiringModel !== "direct_hire" && form.hourlyRate) {
      const computed = calcBillingRate();
      if (computed) updateField("billingRate", computed);
    }
  }, [form.hourlyRate, form.hiringModel, convenienceFee]);

  const isDirectHire = form.hiringModel === "direct_hire";

  const handleSave = async (status = "draft") => {
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

  const handleAgree = async (action) => {
    if (action === "agree" && !confirm("By agreeing, you confirm you accept the terms of this Statement of Work. Continue?")) return;
    if (action === "decline" && !confirm("Are you sure you want to decline this Statement of Work?")) return;
    setAgreeing(true);
    try {
      const res = await fetch("/api/sow", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ offerId, action }),
      });
      const data = await res.json();
      if (data.success) {
        router.push("/invitations");
      }
    } catch {}
    setAgreeing(false);
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
  const readOnly = isPro || isSent || isAgreed;

  const labelStyle = { fontSize: "0.82rem", fontWeight: 600, color: "var(--gray-600)", marginBottom: 4, display: "block" };
  const inputStyle = { width: "100%", margin: 0 };

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

      {/* Status banner */}
      {isAgreed && (
        <div style={{ padding: "14px 18px", marginBottom: 16, background: "#d1fae5", borderLeft: "4px solid #10b981", borderRadius: 6, fontSize: "0.88rem", color: "#065f46" }}>
          This Statement of Work has been agreed to. The hire is active.
        </div>
      )}
      {isDeclined && (
        <div style={{ padding: "14px 18px", marginBottom: 16, background: "#fee2e2", borderLeft: "4px solid #ef4444", borderRadius: 6, fontSize: "0.88rem", color: "#991b1b" }}>
          This Statement of Work was declined by the professional.
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

        {/* 11a — Hiring Model at the top */}
        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>Hiring Model</label>
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
                  type="radio"
                  name="hiringModel"
                  value={model.value}
                  checked={form.hiringModel === model.value}
                  onChange={(e) => updateField("hiringModel", e.target.value)}
                  disabled={readOnly}
                  style={{ marginTop: 2 }}
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
            <label style={labelStyle}>Resource Name</label>
            <input className="form-input" style={inputStyle} value={form.resourceName || ""} onChange={(e) => updateField("resourceName", e.target.value)} readOnly={readOnly} />
          </div>
          <div>
            <label style={labelStyle}>Resource Job Title</label>
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
          <label style={labelStyle}>Work to be Performed</label>
          <textarea className="form-input" style={{ ...inputStyle, minHeight: 100 }} value={form.workDescription || ""} onChange={(e) => updateField("workDescription", e.target.value)} readOnly={readOnly} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
          <div>
            <label style={labelStyle}>Channels</label>
            <input className="form-input" style={inputStyle} value={form.channels || ""} onChange={(e) => updateField("channels", e.target.value)} readOnly={readOnly} />
          </div>
          <div>
            <label style={labelStyle}>Work Location(s)</label>
            <input className="form-input" style={inputStyle} value={form.workLocations || ""} onChange={(e) => updateField("workLocations", e.target.value)} readOnly={readOnly} />
          </div>
        </div>

        {/* 11c — Hide schedule section for Direct Hire */}
        {!isDirectHire && (
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>General Schedule</label>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
              {DAY_ORDER.map((day) => {
                const active = !!form.schedule?.[day];
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => !readOnly && toggleDay(day)}
                    style={{
                      padding: "6px 14px", borderRadius: 6, fontSize: "0.82rem", fontWeight: 600,
                      border: active ? "2px solid var(--teal)" : "2px solid var(--gray-200)",
                      background: active ? "var(--teal-dim)" : "white",
                      color: active ? "var(--teal)" : "var(--gray-400)",
                      cursor: readOnly ? "default" : "pointer",
                    }}
                  >
                    {DAY_LABELS[day]}
                  </button>
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

        {/* 11c — Hide Reporting Manager / Department for Direct Hire */}
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
        <div style={{ display: "grid", gridTemplateColumns: isDirectHire ? "1fr 1fr" : "1fr 1fr 1fr", gap: 16, marginBottom: 16 }}>
          <div>
            <label style={labelStyle}>Hourly Rate ($)</label>
            <input type="number" className="form-input" style={inputStyle} min="10" step="0.50" value={form.hourlyRate || ""} onChange={(e) => updateField("hourlyRate", e.target.value)} readOnly={readOnly} />
          </div>
          <div>
            <label style={labelStyle}>Estimated Hours</label>
            <input type="number" className="form-input" style={inputStyle} min="1" value={form.estimatedHours || ""} onChange={(e) => updateField("estimatedHours", e.target.value)} readOnly={readOnly} />
          </div>
          {/* 11b — Billing rate auto-calculated, only for contract/w2 */}
          {!isDirectHire && (
            <div>
              <label style={labelStyle}>
                Billing Rate ($)
                <span style={{ fontWeight: 400, fontSize: "0.72rem", color: "var(--gray-400)", marginLeft: 4 }}>
                  {form.hiringModel === "contract" ? "(rate + fee)" : "(rate × 1.11 + fee)"}
                </span>
              </label>
              <input
                type="number"
                className="form-input"
                style={{ ...inputStyle, background: "var(--gray-50)", color: "var(--gray-600)" }}
                value={form.billingRate || ""}
                readOnly
              />
            </div>
          )}
        </div>

        {/* Dates — hide End Date for Direct Hire */}
        <div style={{ display: "grid", gridTemplateColumns: isDirectHire ? "1fr" : "1fr 1fr", gap: 16, marginBottom: 16 }}>
          <div>
            <label style={labelStyle}>Start Date</label>
            <input type="date" className="form-input" style={inputStyle} value={form.startDate || ""} onChange={(e) => updateField("startDate", e.target.value)} readOnly={readOnly} />
          </div>
          {!isDirectHire && (
            <div>
              <label style={labelStyle}>End Date</label>
              <input type="date" className="form-input" style={inputStyle} value={form.endDate || ""} onChange={(e) => updateField("endDate", e.target.value)} readOnly={readOnly} />
            </div>
          )}
        </div>

        {/* 11c — Hide Equipment for Direct Hire */}
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
          <button
            className="btn-secondary"
            style={{ width: "auto", padding: "10px 24px" }}
            onClick={() => handleSave("draft")}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Draft"}
          </button>
          <button
            className="btn-primary"
            style={{ width: "auto", padding: "10px 24px" }}
            onClick={() => {
              if (confirm("Send this SOW to the professional for review? They will be notified.")) {
                handleSave("sent");
              }
            }}
            disabled={sending}
          >
            {sending ? "Sending..." : "Send to Professional"}
          </button>
        </div>
      )}

      {isPro && isSent && (
        <div style={{ display: "flex", gap: 12, marginTop: 20, justifyContent: "flex-end" }}>
          <button
            className="btn-secondary"
            style={{ width: "auto", padding: "10px 24px", color: "#ef4444", borderColor: "#ef4444" }}
            onClick={() => handleAgree("decline")}
            disabled={agreeing}
          >
            Decline
          </button>
          <button
            className="btn-primary"
            style={{ width: "auto", padding: "10px 24px", background: "#10b981" }}
            onClick={() => handleAgree("agree")}
            disabled={agreeing}
          >
            {agreeing ? "Processing..." : "I Agree to this SOW"}
          </button>
        </div>
      )}
    </div>
  );
}
