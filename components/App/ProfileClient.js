"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { to12hr as to12hrUtil, tzLabel } from "@/utilities/TimeZoneHelper";

function safeParse(val, fallback = []) {
  if (!val) return fallback;
  if (typeof val === "object") return val; // already parsed
  try { return JSON.parse(val); } catch { return fallback; }
}

function formatPhone(phone) {
  if (!phone) return "";
  const digits = phone.replace(/\D/g, "");
  const d = digits.length === 11 && digits[0] === "1" ? digits.slice(1) : digits;
  if (d.length === 10) return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
  return phone;
}

const DAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
const DAY_LABELS = { sunday: "Sun", monday: "Mon", tuesday: "Tue", wednesday: "Wed", thursday: "Thu", friday: "Fri", saturday: "Sat" };

const to12hr = to12hrUtil;

function EditBtn({ step, incomplete }) {
  return (
    <Link
      href={`/onboarding?step=${step}`}
      className={`profile-edit-btn ${incomplete ? "profile-edit-btn-incomplete" : ""}`}
      title={incomplete ? "Incomplete — click to fill in" : "Edit"}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
      </svg>
      Edit
    </Link>
  );
}

function Section({ title, step, children, empty, incomplete }) {
  return (
    <div className="profile-section">
      <div className="profile-section-header">
        <h2 className="profile-section-title">{title}</h2>
        <EditBtn step={step} incomplete={incomplete} />
      </div>
      {empty ? (
        <p className="profile-empty">Not filled in yet.</p>
      ) : (
        children
      )}
    </div>
  );
}

function Tag({ children }) {
  return <span className="profile-tag">{children}</span>;
}

function ExpandableText({ html, maxHeight = 96 }) {
  const [expanded, setExpanded] = useState(false);
  const [needsExpand, setNeedsExpand] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current && ref.current.scrollHeight > maxHeight) {
      setNeedsExpand(true);
    }
  }, [html, maxHeight]);

  return (
    <div>
      <div
        ref={ref}
        className={`profile-summary ${!expanded && needsExpand ? "profile-summary-collapsed" : ""}`}
        style={!expanded && needsExpand ? { maxHeight } : {}}
        dangerouslySetInnerHTML={{ __html: html }}
      />
      {needsExpand && (
        <button
          type="button"
          className="btn-link"
          style={{ fontSize: "0.85rem", marginTop: 4, padding: 0 }}
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? "Show less" : "Read more"}
        </button>
      )}
    </div>
  );
}

export default function ProfileClient() {
  const { data: session } = useSession();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/onboarding/load")
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="onboarding-loading">
        <div className="onboarding-spinner" />
        <p>Loading your profile...</p>
      </div>
    );
  }

  const profile = data?.profile;
  const user = data?.user;
  const loc = data?.location;
  const env = data?.environment;
  const rate = data?.hourlyRate;
  const avail = data?.availability || [];
  const edu = data?.education || [];
  const emp = data?.employment || [];
  const langs = data?.languages || [];
  const channels = data?.userChannels || [];
  const allChannels = data?.allChannels || [];
  const userSkills = data?.userSkills || [];
  const allSkills = data?.allSkills || [];
  const userIndustries = data?.userIndustries || [];
  const allIndustries = data?.allIndustries || [];
  const userApplications = data?.userApplications || [];
  const allApplications = data?.allApplications || [];

  const completedSteps = profile?.completedSteps ? safeParse(profile.completedSteps, []) : [];
  const isIncomplete = (stepNum) => !completedSteps.includes(stepNum);

  const channelMap = {};
  allChannels.forEach((c) => { channelMap[c.id] = c.name; });
  const skillMap = {};
  allSkills.forEach((s) => { skillMap[s.id] = s.name; });
  const industryMap = {};
  allIndustries.forEach((ind) => { industryMap[ind.id] = ind.name; });
  const appMap = {};
  allApplications.forEach((a) => { appMap[a.id] = a.name; });

  const hasStarted = profile && profile.onboardingStep > 1;

  if (!hasStarted) {
    return (
      <div className="profile-empty-state">
        <h1 className="page-title">Your Profile</h1>
        <div className="card" style={{ textAlign: "center", padding: "60px 24px" }}>
          <p style={{ fontSize: "1.1rem", color: "var(--gray-500)", marginBottom: 20 }}>
            You haven&apos;t started your profile yet.
          </p>
          <Link href="/onboarding" className="btn-primary" style={{ width: "auto", textDecoration: "none" }}>
            Get Started
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      {/* Hero card */}
      <div className="profile-hero">
        <div className="profile-hero-left">
          {profile?.photoUrl ? (
            <img src={`/${profile.photoUrl}`} alt="Profile" className="profile-avatar" />
          ) : (
            <div className="profile-avatar-placeholder">
              {session?.user?.firstName?.[0] || "?"}
            </div>
          )}
          <div className="profile-hero-info">
            <h1 className="profile-name">
              {session?.user?.firstName} {session?.user?.lastName}
            </h1>
            <p className="profile-title">{profile.title}</p>
            {loc?.city && (
              <p className="profile-location">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                {loc.city}{loc.state ? `, ${loc.state}` : ""}
              </p>
            )}
          </div>
        </div>
        <div className="profile-hero-right">
          {rate && (
            <div className="profile-rate">
              <span className="profile-rate-amount">${rate.regularRate}</span>
              <span className="profile-rate-label">/hr</span>
            </div>
          )}
          <Link href="/onboarding" className="btn-secondary" style={{ textDecoration: "none", fontSize: "0.85rem" }}>
            Edit Profile
          </Link>
        </div>
      </div>

      {/* Summary */}
      <Section title="About" step={1} empty={!profile.summary} incomplete={isIncomplete(1)}>
        <ExpandableText html={profile.summary} />
        <div className="profile-links">
          {profile.website && (
            <a href={profile.website} target="_blank" rel="noopener noreferrer" className="profile-link">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M2 12h20" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>
              Website
            </a>
          )}
          {profile.linkedinUrl && (
            <a href={profile.linkedinUrl} target="_blank" rel="noopener noreferrer" className="profile-link">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" /><rect x="2" y="9" width="4" height="12" /><circle cx="4" cy="4" r="2" /></svg>
              LinkedIn
            </a>
          )}
        </div>
      </Section>

      {/* Experience & Skills */}
      <Section title="Experience & Skills" step={2} empty={!profile.overallExperience && userSkills.length === 0 && userIndustries.length === 0 && userApplications.length === 0} incomplete={isIncomplete(2)}>
        {profile.overallExperience && (
          <p className="profile-detail"><strong>Overall:</strong> {profile.overallExperience}</p>
        )}
        {userSkills.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <p className="profile-detail"><strong>Skills:</strong></p>
            <div className="profile-tags">
              {userSkills.map((us) => (
                <Tag key={us.id}>{skillMap[us.skillId] || us.skillId} ({us.experience})</Tag>
              ))}
            </div>
          </div>
        )}
        {userIndustries.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <p className="profile-detail"><strong>Industry Experience:</strong></p>
            <div className="profile-tags">
              {userIndustries.map((ui) => (
                <Tag key={ui.id}>{industryMap[ui.industryId] || ui.industryId} ({ui.experience})</Tag>
              ))}
            </div>
          </div>
        )}
        {userApplications.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <p className="profile-detail"><strong>Applications:</strong></p>
            <div className="profile-tags">
              {userApplications.map((ua) => (
                <Tag key={ua.id}>{appMap[ua.applicationId] || ua.applicationId} ({ua.experience})</Tag>
              ))}
            </div>
          </div>
        )}
      </Section>

      {/* Channels */}
      <Section title="Channels" step={3} empty={channels.length === 0} incomplete={isIncomplete(3)}>
        <div className="profile-channels">
          {channels.map((c) => (
            <div key={c.id} className="profile-channel-item">
              <span className="profile-channel-name">{channelMap[c.channelId] || c.channelId}</span>
              <span className="profile-channel-exp">{c.experience}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* Education */}
      <Section title="Education" step={4} empty={edu.length === 0} incomplete={isIncomplete(4)}>
        {edu.map((e) => (
          <div key={e.id} className="profile-entry">
            <div className="profile-entry-header">
              <strong>{e.institution}</strong>
              <span className="profile-entry-date">
                {e.fromDate ? new Date(e.fromDate).getFullYear() : ""}
                {e.toDate ? ` – ${new Date(e.toDate).getFullYear()}` : ""}
              </span>
            </div>
            <p className="profile-entry-sub">{e.degree}{e.areaOfStudy ? ` — ${e.areaOfStudy}` : ""}</p>
            {e.gpa && <p className="profile-detail">GPA: {e.gpa}</p>}
          </div>
        ))}
      </Section>

      {/* Employment */}
      <Section title="Employment" step={5} empty={emp.length === 0} incomplete={isIncomplete(5)}>
        {emp.map((e) => (
          <div key={e.id} className="profile-entry">
            <div className="profile-entry-header">
              <strong>{e.company}</strong>
              <span className="profile-entry-date">
                {e.fromMonth} {e.fromYear}
                {e.currentlyWorking ? " – Present" : e.throughMonth ? ` – ${e.throughMonth} ${e.throughYear}` : ""}
              </span>
            </div>
            <p className="profile-entry-sub">
              {e.title}
              {e.city ? ` · ${e.city}${e.state ? `, ${e.state}` : ""}` : ""}
              {e.remote ? " · Remote" : ""}
            </p>
            {e.description && <p className="profile-detail">{e.description}</p>}
          </div>
        ))}
      </Section>

      {/* Languages */}
      <Section title="Languages" step={6} empty={langs.length === 0} incomplete={isIncomplete(6)}>
        <div className="profile-tags">
          {langs.map((l) => (
            <Tag key={l.id}>{l.language} ({l.proficiency})</Tag>
          ))}
        </div>
      </Section>

      {/* Availability */}
      <Section title="Availability" step={7} empty={avail.length === 0} incomplete={isIncomplete(7)}>
        <div className="profile-availability">
          {DAYS.map((day) => {
            const slot = avail.find((a) => a.day === day);
            return (
              <div key={day} className={`profile-avail-row ${slot ? "" : "off"}`}>
                <span className="profile-avail-day">{DAY_LABELS[day]}</span>
                <span className="profile-avail-time">
                  {slot ? `${to12hr(slot.startTime)} – ${to12hr(slot.endTime)} ${tzLabel(session?.user?.timezone)}` : "Off"}
                </span>
              </div>
            );
          })}
        </div>
        {user?.timezone && (
          <p className="profile-detail" style={{ marginTop: 8 }}>Timezone: {user.timezone}</p>
        )}
      </Section>

      {/* Environment */}
      <Section title="Work Environment" step={8} empty={!env} incomplete={isIncomplete(8)}>
        {env && (
          <>
            <div className="profile-tags">
              {env.workFromHome && <Tag>Work from Home</Tag>}
              {env.workFromOffice && <Tag>Work from Office</Tag>}
            </div>
            {env.computers && safeParse(env.computers).length > 0 && (
              <div style={{ marginTop: 12 }}>
                <p className="profile-detail"><strong>Equipment:</strong></p>
                {safeParse(env.computers).map((c, i) => (
                  <p key={i} className="profile-detail">
                    {c.type} — {c.brand} {c.model}{c.ram ? `, ${c.ram} RAM` : ""}
                  </p>
                ))}
              </div>
            )}
            {env.internetTypes && safeParse(env.internetTypes).length > 0 && (
              <p className="profile-detail">
                <strong>Internet:</strong> {safeParse(env.internetTypes).join(", ")}
              </p>
            )}
          </>
        )}
      </Section>

      {/* Hourly Rate */}
      <Section title="Hourly Rate" step={9} empty={!rate} incomplete={isIncomplete(9)}>
        {rate && (
          <div className="profile-rates">
            <div className="profile-rate-card">
              <span className="profile-rate-label">Regular</span>
              <span className="profile-rate-amount">${rate.regularRate}/hr</span>
            </div>
            {rate.afterHoursRate && (
              <div className="profile-rate-card">
                <span className="profile-rate-label">After Hours</span>
                <span className="profile-rate-amount">${rate.afterHoursRate}/hr</span>
              </div>
            )}
          </div>
        )}
      </Section>

      {/* Photo & Video */}
      <Section title="Photo & Video" step={10} empty={!profile.photoUrl && !profile.videoUrl} incomplete={isIncomplete(10)}>
        <div className="profile-media">
          {profile.photoUrl && (
            <img src={`/${profile.photoUrl}`} alt="Profile photo" className="profile-media-photo" />
          )}
          {profile.videoUrl && (
            <video src={`/${profile.videoUrl}`} controls className="profile-media-video" />
          )}
        </div>
      </Section>

      {/* Location */}
      <Section title="Location" step={11} empty={!loc} incomplete={isIncomplete(11)}>
        {loc && (
          <>
            {loc.fullAddress && <p className="profile-detail">{loc.fullAddress}</p>}
            <p className="profile-detail">
              {loc.city}{loc.state ? `, ${loc.state}` : ""} {loc.zip}
            </p>
            {loc.workAddress && (
              <>
                <p className="profile-detail" style={{ marginTop: 8 }}><strong>Work Location:</strong></p>
                <p className="profile-detail">{loc.workAddress}</p>
                <p className="profile-detail">
                  {loc.workCity}{loc.workState ? `, ${loc.workState}` : ""} {loc.workZip}
                </p>
              </>
            )}
          </>
        )}
      </Section>

      {/* Contact */}
      <Section title="Contact" step={12} empty={!user?.phone && !session?.user?.email} incomplete={isIncomplete(12)}>
        {session?.user?.email && (
          <p className="profile-detail">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ verticalAlign: "middle", marginRight: 6 }}><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
            {session.user.email}
          </p>
        )}
        {user?.phone && (
          <p className="profile-detail">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ verticalAlign: "middle", marginRight: 6 }}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
            {formatPhone(user.phone)}
          </p>
        )}
      </Section>
    </div>
  );
}
