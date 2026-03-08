"use client";

import { useSession, signOut } from "next-auth/react";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function DashboardClient() {
  const { data: session } = useSession();
  const user = session?.user;
  const isBusiness = user?.role === "BUSINESS";

  // Professional state
  const [profileStatus, setProfileStatus] = useState("new");
  const [completedCount, setCompletedCount] = useState(0);
  const [firstIncompleteStep, setFirstIncompleteStep] = useState(null);
  const TOTAL_STEPS = 13;

  // Business state
  const [bizProfile, setBizProfile] = useState(null);

  useEffect(() => {
    if (isBusiness) {
      fetch("/api/business/profile")
        .then((r) => r.json())
        .then((data) => setBizProfile(data.profile))
        .catch(() => {});
    } else {
      fetch("/api/onboarding/load")
        .then((r) => r.json())
        .then((data) => {
          const completed = data.profile?.completedSteps ? JSON.parse(data.profile.completedSteps) : [];
          setCompletedCount(completed.length);
          for (let i = 1; i <= TOTAL_STEPS; i++) {
            if (!completed.includes(i)) { setFirstIncompleteStep(i); break; }
          }
          if (data.profile?.profileComplete) {
            setProfileStatus("complete");
          } else if (data.profile?.onboardingStep > 1) {
            setProfileStatus("started");
          }
        })
        .catch(() => {});
    }
  }, [isBusiness]);

  if (isBusiness) {
    const hasProfile = bizProfile && bizProfile.businessName;
    return (
      <div>
        <div className="page-header">
          <h1 className="page-title">Welcome{user?.firstName ? `, ${user.firstName}` : ""}!</h1>
          <p className="page-subtitle">Manage your job postings and find professionals.</p>
        </div>

        <div className="stat-grid">
          <div className="stat-card">
            <div className="stat-card-label">Job Postings</div>
            <div className="stat-card-value">0</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-label">Invites Sent</div>
            <div className="stat-card-value">0</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-label">Applicants</div>
            <div className="stat-card-value">0</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-label">Active Hires</div>
            <div className="stat-card-value">0</div>
          </div>
        </div>

        <div className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div>
            <div className="card-title">{hasProfile ? "Company Profile" : "Set Up Your Company"}</div>
            <div className="card-subtitle">
              {hasProfile
                ? `${bizProfile.businessName}${bizProfile.industry ? ` · ${bizProfile.industry}` : ""}`
                : "Complete your company profile to start posting jobs and finding professionals."}
            </div>
          </div>
          <Link href="/company-profile" className="btn-primary" style={{ width: "auto", whiteSpace: "nowrap", textDecoration: "none" }}>
            {hasProfile ? "Edit Profile" : "Get Started"}
          </Link>
        </div>

        {hasProfile && (
          <div className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div>
              <div className="card-title">Find Professionals</div>
              <div className="card-subtitle">Search and filter from our network of qualified professionals.</div>
            </div>
            <Link href="/search" className="btn-secondary" style={{ whiteSpace: "nowrap", textDecoration: "none" }}>
              Search Now
            </Link>
          </div>
        )}

        <div className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div className="card-title">Account</div>
            <div className="card-subtitle">Manage your session.</div>
          </div>
          <button className="btn-secondary" onClick={() => signOut({ callbackUrl: "/login" })} style={{ whiteSpace: "nowrap" }}>
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  // Professional dashboard
  const buttonText = profileStatus === "complete" ? "Update Profile" : profileStatus === "started" ? "Complete Profile" : "Get Started";
  const cardTitle = profileStatus === "complete" ? "Your Profile" : "Complete Your Profile";
  const cardSubtitle = profileStatus === "complete"
    ? "Your profile is live. Update it anytime to keep it current."
    : "Fill out your professional profile to start getting matched with opportunities.";

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Welcome{user?.firstName ? `, ${user.firstName}` : ""}!</h1>
        <p className="page-subtitle">Here&apos;s what&apos;s happening with your account.</p>
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-card-label">Profile Views</div>
          <div className="stat-card-value">0</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Invitations</div>
          <div className="stat-card-value">0</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Active Jobs</div>
          <div className="stat-card-value">0</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Messages</div>
          <div className="stat-card-value">0</div>
        </div>
      </div>

      <div className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <div className="card-title">{cardTitle}</div>
          <div className="card-subtitle">{cardSubtitle}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
          {profileStatus !== "new" && (
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              {Array.from({ length: TOTAL_STEPS }, (_, i) => (
                <div
                  key={i}
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: i < completedCount ? "var(--teal)" : "var(--gray-200)",
                  }}
                />
              ))}
              <span style={{ fontSize: "0.75rem", color: "var(--gray-500)", marginLeft: 4, whiteSpace: "nowrap" }}>
                {completedCount}/{TOTAL_STEPS}
              </span>
            </div>
          )}
          <Link href={firstIncompleteStep ? `/onboarding?step=${firstIncompleteStep}` : "/onboarding"} className="btn-primary" style={{ width: "auto", whiteSpace: "nowrap", textDecoration: "none" }}>
            {buttonText}
          </Link>
        </div>
      </div>

      <div className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div className="card-title">Account</div>
          <div className="card-subtitle">Manage your session.</div>
        </div>
        <button className="btn-secondary" onClick={() => signOut({ callbackUrl: "/login" })} style={{ whiteSpace: "nowrap" }}>
          Sign Out
        </button>
      </div>
    </div>
  );
}
