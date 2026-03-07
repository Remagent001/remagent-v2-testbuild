"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";

export default function DashboardPage() {
  const { data: session } = useSession();
  const user = session?.user;
  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">
          Welcome{user?.firstName ? `, ${user.firstName}` : ""}!
        </h1>
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
          <div className="card-title">Complete Your Profile</div>
          <div className="card-subtitle">Fill out your professional profile to start getting matched with opportunities.</div>
        </div>
        <Link href="/onboarding" className="btn-primary" style={{ width: "auto", whiteSpace: "nowrap", textDecoration: "none" }}>
          Get Started
        </Link>
      </div>

      <div className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div className="card-title">Account</div>
          <div className="card-subtitle">Manage your session.</div>
        </div>
        <button
          className="btn-secondary"
          onClick={() => signOut({ callbackUrl: "/login" })}
          style={{ whiteSpace: "nowrap" }}
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}
