"use client";

import { useSession, signOut } from "next-auth/react";
import { useState, useEffect } from "react";
import Link from "next/link";


export default function DashboardClient() {
  const { data: session } = useSession();
  const user = session?.user;
  const isBusiness = user?.role === "BUSINESS";
  const isAdmin = user?.role === "ADMIN";

  // Professional state
  const [profileStatus, setProfileStatus] = useState("new");
  const [completedCount, setCompletedCount] = useState(0);
  const [firstIncompleteStep, setFirstIncompleteStep] = useState(null);
  const TOTAL_STEPS = 13;

  // Professional invitation state
  const [invitationCount, setInvitationCount] = useState(0);
  const [totalInvitations, setTotalInvitations] = useState(0);

  // Professional hires state
  const [activeHireCount, setActiveHireCount] = useState(0);
  const [weekHours, setWeekHours] = useState(0);

  // Business state
  const [bizProfile, setBizProfile] = useState(null);
  const [positionAlerts, setPositionAlerts] = useState([]);
  const [positionCounts, setPositionCounts] = useState({ total: 0, invites: 0, applicants: 0, hires: 0 });
  const [newApplicantCount, setNewApplicantCount] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState([]);
  const [bizTimesheetStats, setBizTimesheetStats] = useState({ pendingTimesheets: 0, totalHoursWeek: 0, outstandingInvoices: 0, outstandingAmount: 0, spentThisMonth: 0 });

  useEffect(() => {
    if (isBusiness || isAdmin) {
      fetch("/api/business/profile")
        .then((r) => r.json())
        .then((data) => setBizProfile(data.profile))
        .catch(() => {});

      // Load positions to get counts and check for admin notes
      fetch("/api/positions")
        .then((r) => r.json())
        .then((data) => {
          const positions = data.positions || [];
          const alerts = positions.filter((p) => p.reviewRequired && p.adminNote);
          setPositionAlerts(alerts);
          let invites = 0, applicants = 0, hires = 0;
          positions.forEach((p) => {
            invites += p._count?.offers || 0;
            applicants += p._count?.applications || 0;
            hires += p._count?.hires || 0;
          });
          setPositionCounts({ total: positions.length, invites, applicants, hires });
        })
        .catch(() => {});

      // Load new applicant count
      fetch("/api/applicants?status=new")
        .then((r) => r.json())
        .then((data) => setNewApplicantCount(data.counts?.new || 0))
        .catch(() => {});

      // Load unread messages across invites
      fetch("/api/invites")
        .then((r) => r.json())
        .then((data) => {
          const msgs = (data.invites || [])
            .filter((inv) => inv.messageStatus === "unread" || inv.messageStatus === "awaiting_reply")
            .map((inv) => ({
              id: inv.id,
              name: `${inv.user?.firstName || ""} ${inv.user?.lastName || ""}`.trim(),
              title: inv.position?.title || "Untitled",
              status: inv.messageStatus,
              unread: inv.unreadMessages || 0,
            }));
          setUnreadMessages(msgs);
        })
        .catch(() => {});

      // Fetch timesheet + invoice stats for business dashboard
      fetch("/api/timesheets")
        .then((r) => r.json())
        .then((data) => {
          const ts = data.timesheets || [];
          const pending = ts.filter((t) => t.status === "pending").length;
          // Current week hours
          const now = new Date();
          const day = now.getDay();
          const diffMon = day === 0 ? -6 : 1 - day;
          const weekMon = new Date(now);
          weekMon.setDate(now.getDate() + diffMon);
          weekMon.setHours(0, 0, 0, 0);
          const thisWeek = ts.filter((t) => new Date(t.weekStart) >= weekMon);
          const totalHrs = thisWeek.reduce((s, t) => s + t.totalRegularHrs + t.totalAfterHrs + t.totalHolidayHrs, 0);
          setBizTimesheetStats((prev) => ({ ...prev, pendingTimesheets: pending, totalHoursWeek: Math.round(totalHrs * 100) / 100 }));
        })
        .catch(() => {});

      fetch("/api/invoices")
        .then((r) => r.json())
        .then((data) => {
          const invs = data.invoices || [];
          const outstanding = invs.filter((i) => i.status === "due");
          const outAmt = outstanding.reduce((s, i) => s + i.totalAmount, 0);
          // Spent this month (paid invoices this month)
          const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
          const paidThisMonth = invs.filter((i) => i.status === "paid" && i.paidAt && new Date(i.paidAt) >= monthStart);
          const spent = paidThisMonth.reduce((s, i) => s + i.totalAmount, 0);
          setBizTimesheetStats((prev) => ({
            ...prev,
            outstandingInvoices: outstanding.length,
            outstandingAmount: Math.round(outAmt * 100) / 100,
            spentThisMonth: Math.round(spent * 100) / 100,
          }));
        })
        .catch(() => {});
    } else {
      // Fetch invitation count for professionals
      fetch("/api/invitations")
        .then((r) => r.json())
        .then((data) => {
          setInvitationCount(data.counts?.pending || 0);
          setTotalInvitations(data.counts?.all || 0);
          // Collect message alerts
          const msgs = (data.invitations || [])
            .filter((inv) => inv.messageStatus === "unread" || inv.messageStatus === "awaiting_reply")
            .map((inv) => ({
              id: inv.id,
              name: inv.position?.user?.businessProfile?.businessName || `${inv.position?.user?.firstName || ""} ${inv.position?.user?.lastName || ""}`.trim(),
              title: inv.position?.title || "Untitled",
              status: inv.messageStatus,
            }));
          setUnreadMessages(msgs);
        })
        .catch(() => {});

      // Fetch active hire count and this week's hours
      fetch("/api/timer")
        .then((r) => r.json())
        .then((data) => {
          setActiveHireCount((data.activeHires || []).length);
        })
        .catch(() => {});

      // Fetch this week's time entries for total hours
      const now = new Date();
      const day = now.getDay();
      const diffToMonday = day === 0 ? -6 : 1 - day;
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() + diffToMonday);
      weekStart.setHours(0, 0, 0, 0);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      fetch(`/api/time-entries?from=${weekStart.toISOString().slice(0, 10)}&to=${weekEnd.toISOString().slice(0, 10)}`)
        .then((r) => r.json())
        .then((data) => {
          const total = (data.entries || []).reduce((sum, e) => {
            if (e.endTime) {
              const ms = new Date(e.endTime).getTime() - new Date(e.startTime).getTime() - (e.breakMinutes || 0) * 60000;
              return sum + Math.max(0, ms / 3600000);
            }
            return sum;
          }, 0);
          setWeekHours(Math.round(total * 100) / 100);
        })
        .catch(() => {});

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
  }, [isBusiness, isAdmin]);

  if (isBusiness || isAdmin) {
    const hasProfile = bizProfile && bizProfile.businessName;
    return (
      <div>
        <div className="page-header">
          <h1 className="page-title">Welcome{user?.firstName ? `, ${user.firstName}` : ""}!</h1>
          <p className="page-subtitle">Manage your job postings and find professionals.</p>
        </div>

        {/* Admin note alerts */}
        {positionAlerts.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            {positionAlerts.map((pos) => (
              <Link key={pos.id} href={`/positions/${pos.id}`} style={{ textDecoration: "none" }}>
                <div style={{
                  padding: "14px 18px",
                  marginBottom: 8,
                  background: "#fef2f2",
                  borderLeft: "4px solid #ef4444",
                  borderRadius: 6,
                  cursor: "pointer",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <strong style={{ color: "#dc2626", fontSize: "0.9rem" }}>
                        Action Required: {pos.title || "Untitled Position"}
                      </strong>
                      <p style={{ margin: "4px 0 0", color: "#7f1d1d", fontSize: "0.85rem" }}>{pos.adminNote}</p>
                    </div>
                    <span style={{ color: "#dc2626", fontSize: "0.8rem", fontWeight: 600, whiteSpace: "nowrap", marginLeft: 16 }}>
                      Review &rarr;
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        <div className="stat-grid">
          <Link href="/inbox" className="stat-card" style={{ textDecoration: "none", color: "inherit" }}>
            <div className="stat-card-label">Inbox</div>
            <div className="stat-card-value">
              {unreadMessages.filter((m) => m.status === "unread").length || 0}
            </div>
            <div style={{ fontSize: "0.75rem", color: "var(--gray-400)", marginTop: 2, display: "flex", gap: 8 }}>
              {unreadMessages.filter((m) => m.status === "unread").length > 0 && (
                <span style={{ color: "#ef4444", fontWeight: 600 }}>
                  {unreadMessages.filter((m) => m.status === "unread").length} unread
                </span>
              )}
              {unreadMessages.filter((m) => m.status === "awaiting_reply").length > 0 && (
                <span style={{ color: "#f59e0b", fontWeight: 600 }}>
                  {unreadMessages.filter((m) => m.status === "awaiting_reply").length} need reply
                </span>
              )}
            </div>
          </Link>
          <Link href="/positions" className="stat-card" style={{ textDecoration: "none", color: "inherit" }}>
            <div className="stat-card-label">Job Postings</div>
            <div className="stat-card-value">{positionCounts.total}</div>
          </Link>
          <Link href="/applicants" className="stat-card" style={{ textDecoration: "none", color: "inherit" }}>
            <div className="stat-card-label">Applicants</div>
            <div className="stat-card-value">{positionCounts.applicants}</div>
            {newApplicantCount > 0 && (
              <div style={{ fontSize: "0.75rem", color: "#ef4444", fontWeight: 600, marginTop: 2 }}>
                {newApplicantCount} new
              </div>
            )}
          </Link>
          <Link href="/hires" className="stat-card" style={{ textDecoration: "none", color: "inherit" }}>
            <div className="stat-card-label">Active Hires</div>
            <div className="stat-card-value">{positionCounts.hires}</div>
          </Link>
        </div>

        {/* Timesheet & Invoice stats */}
        {positionCounts.hires > 0 && (
          <div className="stat-grid">
            <Link href="/timesheets" className="stat-card" style={{ textDecoration: "none", color: "inherit" }}>
              <div className="stat-card-label">Hours This Week</div>
              <div className="stat-card-value">{bizTimesheetStats.totalHoursWeek}h</div>
            </Link>
            <Link href="/timesheets?status=pending" className="stat-card" style={{ textDecoration: "none", color: "inherit" }}>
              <div className="stat-card-label">Pending Timesheets</div>
              <div className="stat-card-value" style={{ color: bizTimesheetStats.pendingTimesheets > 0 ? "#f59e0b" : "inherit" }}>
                {bizTimesheetStats.pendingTimesheets}
              </div>
            </Link>
            <Link href="/invoices?status=due" className="stat-card" style={{ textDecoration: "none", color: "inherit" }}>
              <div className="stat-card-label">Outstanding Invoices</div>
              <div className="stat-card-value">{bizTimesheetStats.outstandingInvoices}</div>
              {bizTimesheetStats.outstandingAmount > 0 && (
                <div style={{ fontSize: "0.75rem", color: "var(--gray-400)", marginTop: 2 }}>
                  ${bizTimesheetStats.outstandingAmount.toLocaleString()}
                </div>
              )}
            </Link>
            <div className="stat-card">
              <div className="stat-card-label">Spent This Month</div>
              <div className="stat-card-value">${bizTimesheetStats.spentThisMonth.toLocaleString()}</div>
            </div>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
          <div className="card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", margin: 0 }}>
            <div style={{ marginBottom: 16 }}>
              <div className="card-title">{hasProfile ? "Company Profile" : "Set Up Your Company"}</div>
              <div className="card-subtitle">
                {hasProfile
                  ? `${bizProfile.businessName}${bizProfile.city ? `, ${bizProfile.city}` : ""}${bizProfile.state ? `, ${bizProfile.state}` : ""}`
                  : "Complete your company profile to start posting jobs and finding professionals."}
              </div>
            </div>
            <Link href="/company-profile" className="btn-primary" style={{ width: "auto", whiteSpace: "nowrap", textDecoration: "none", alignSelf: "flex-start" }}>
              {hasProfile ? "Edit Profile" : "Get Started"}
            </Link>
          </div>

          {hasProfile && (
            <div className="card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", margin: 0 }}>
              <div style={{ marginBottom: 16 }}>
                <div className="card-title">Find Professionals</div>
                <div className="card-subtitle">Search and filter from our network of qualified professionals.</div>
              </div>
              <Link href="/search" className="btn-secondary" style={{ whiteSpace: "nowrap", textDecoration: "none", alignSelf: "flex-start" }}>
                Search Now
              </Link>
            </div>
          )}

          <div className="card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", margin: 0 }}>
            <div style={{ marginBottom: 16 }}>
              <div className="card-title">Account</div>
              <div className="card-subtitle">Manage your session.</div>
            </div>
            <button className="btn-secondary" onClick={() => signOut({ callbackUrl: "/login" })} style={{ whiteSpace: "nowrap", alignSelf: "flex-start" }}>
              Sign Out
            </button>
          </div>
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
        <Link href="/inbox" className="stat-card" style={{ textDecoration: "none", color: "inherit" }}>
          <div className="stat-card-label">Inbox</div>
          <div className="stat-card-value">
            {unreadMessages.filter((m) => m.status === "unread").length || 0}
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--gray-400)", marginTop: 2, display: "flex", gap: 8 }}>
            {unreadMessages.filter((m) => m.status === "unread").length > 0 && (
              <span style={{ color: "#ef4444", fontWeight: 600 }}>
                {unreadMessages.filter((m) => m.status === "unread").length} unread
              </span>
            )}
            {unreadMessages.filter((m) => m.status === "awaiting_reply").length > 0 && (
              <span style={{ color: "#f59e0b", fontWeight: 600 }}>
                {unreadMessages.filter((m) => m.status === "awaiting_reply").length} need reply
              </span>
            )}
          </div>
        </Link>
        <Link href="/invitations" className="stat-card" style={{ textDecoration: "none", color: "inherit" }}>
          <div className="stat-card-label">Invitations</div>
          <div className="stat-card-value">{totalInvitations}</div>
          {invitationCount > 0 && (
            <div style={{ fontSize: "0.75rem", color: "#f59e0b", fontWeight: 600, marginTop: 2 }}>
              {invitationCount} new
            </div>
          )}
        </Link>
        <Link href="/time-log" className="stat-card" style={{ textDecoration: "none", color: "inherit" }}>
          <div className="stat-card-label">Hours This Week</div>
          <div className="stat-card-value">{weekHours}h</div>
        </Link>
        <Link href="/hires" className="stat-card" style={{ textDecoration: "none", color: "inherit" }}>
          <div className="stat-card-label">Active Jobs</div>
          <div className="stat-card-value">{activeHireCount}</div>
        </Link>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        <Link href="/time-log" className="card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", margin: 0, textDecoration: "none", color: "inherit" }}>
          <div style={{ marginBottom: 16 }}>
            <div className="card-title">Time Log</div>
            <div className="card-subtitle">Track your work hours and manage timesheets.</div>
          </div>
          <span className="btn-primary" style={{ width: "auto", whiteSpace: "nowrap", alignSelf: "flex-start" }}>
            Open Time Log
          </span>
        </Link>
        <div className="card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", margin: 0 }}>
          <div style={{ marginBottom: 16 }}>
            <div className="card-title">{cardTitle}</div>
            <div className="card-subtitle">{cardSubtitle}</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
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

        <div className="card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", margin: 0 }}>
          <div style={{ marginBottom: 16 }}>
            <div className="card-title">Browse Jobs</div>
            <div className="card-subtitle">Find opportunities that match your skills and experience.</div>
          </div>
          <Link href="/jobs" className="btn-secondary" style={{ whiteSpace: "nowrap", textDecoration: "none", alignSelf: "flex-start" }}>
            View Jobs
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
