"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";

function formatPhone(value) {
  // Strip everything except digits
  const digits = value.replace(/\D/g, "").slice(0, 10);
  if (digits.length === 0) return "";
  if (digits.length <= 3) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

export default function StepContact({ data, onNext, onBack, onSaveExit, onSkip, saving }) {
  const { data: session } = useSession();
  const [email, setEmail] = useState(session?.user?.email || "");

  const [phone, setPhone] = useState(() => {
    const saved = data?.user?.phone || "";
    return saved ? formatPhone(saved) : "";
  });
  const [whatsapp, setWhatsapp] = useState("");
  const [agreeTexts, setAgreeTexts] = useState(false);

  const handlePhoneChange = (e) => {
    setPhone(formatPhone(e.target.value));
  };

  const getData = () => ({
    email: email.trim(),
    phone: phone.replace(/\D/g, ""),
    whatsapp: whatsapp.replace(/\D/g, ""),
  });

  return (
    <div className="onboarding-step">
      <p className="onboarding-step-desc">
        Add your contact information so businesses and Remagent can reach you when needed.
      </p>

      <div className="form-group">
        <label className="form-label">Email</label>
        <input
          className="form-input"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
        />
      </div>

      <div className="form-row">
        <div className="form-group form-half">
          <label className="form-label">Phone Number</label>
          <input
            className="form-input"
            type="tel"
            placeholder="(123) 456-7890"
            value={phone}
            onChange={handlePhoneChange}
          />
        </div>
        <div className="form-group form-half">
          <label className="form-label">WhatsApp (optional)</label>
          <input
            className="form-input"
            type="tel"
            placeholder="(123) 456-7890"
            value={whatsapp}
            onChange={(e) => setWhatsapp(formatPhone(e.target.value))}
          />
        </div>
      </div>

      <div className="form-group">
        <label className="form-checkbox">
          <input type="checkbox" checked={agreeTexts} onChange={(e) => setAgreeTexts(e.target.checked)} />
          I agree to receive text messages from Remagent
        </label>
      </div>

      <div className="onboarding-actions">
        <button className="btn-secondary" onClick={onBack} disabled={saving}>Back</button>
        <div className="onboarding-actions-right">
          <button className="btn-link" onClick={onSkip}>Skip</button>
          <button className="btn-secondary" onClick={() => onSaveExit(getData())} disabled={saving}>Save & Exit</button>
          <button className="btn-primary" style={{ width: "auto" }} onClick={() => onNext(getData())} disabled={saving}>{saving ? "Saving..." : "Next"}</button>
        </div>
      </div>
    </div>
  );
}
