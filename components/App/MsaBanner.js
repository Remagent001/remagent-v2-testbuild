"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

export default function MsaBanner() {
  const { data: session } = useSession();
  const [show, setShow] = useState(false);
  const [signing, setSigning] = useState(false);

  useEffect(() => {
    if (session?.user?.role !== "BUSINESS") return;

    fetch("/api/business/profile")
      .then((r) => r.json())
      .then((data) => {
        if (data.profile && !data.profile.agreementSigned) {
          setShow(true);
        }
      })
      .catch(() => {});
  }, [session]);

  if (!show) return null;

  const handleSign = async () => {
    setSigning(true);
    try {
      const res = await fetch("/api/docusign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "msa" }),
      });
      const data = await res.json();
      if (data.signingUrl) {
        window.location.href = data.signingUrl;
      } else if (data.alreadySigned) {
        setShow(false);
      } else {
        alert("Could not start signing. Please try again or contact support@remagent.com");
      }
    } catch {
      alert("Could not start signing. Please try again or contact support@remagent.com");
    }
    setSigning(false);
  };

  return (
    <div style={{
      background: "linear-gradient(90deg, #0b1f3a, #163a5f)",
      padding: "10px 24px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 16,
      flexWrap: "wrap",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0fd4b0" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <path d="M9 15l2 2 4-4" />
        </svg>
        <span style={{ color: "white", fontSize: "0.85rem" }}>
          Sign your Master Services Agreement to unlock full access to professional profiles and invitations.
        </span>
      </div>
      <button
        onClick={handleSign}
        disabled={signing}
        style={{
          background: "#0fd4b0",
          color: "#0b1f3a",
          border: "none",
          padding: "6px 16px",
          borderRadius: 6,
          fontSize: "0.8rem",
          fontWeight: 600,
          cursor: signing ? "wait" : "pointer",
          whiteSpace: "nowrap",
        }}
      >
        {signing ? "Starting..." : "Sign Agreement"}
      </button>
    </div>
  );
}
