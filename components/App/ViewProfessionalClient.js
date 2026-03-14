"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import InviteModal from "./InviteModal";

function safeParse(val, fallback = []) {
  if (!val) return fallback;
  if (typeof val === "object") return val;
  try { return JSON.parse(val); } catch { return fallback; }
}

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
const DAY_LABELS = { sunday: "Sun", monday: "Mon", tuesday: "Tue", wednesday: "Wed", thursday: "Thu", friday: "Fri", saturday: "Sat" };

function to12hr(time24) {
  if (!time24) return "";
  const [h, m] = time24.split(":");
  const hr = parseInt(h, 10);
  return `${hr === 0 ? 12 : hr > 12 ? hr - 12 : hr}:${m} ${hr >= 12 ? "PM" : "AM"}`;
}

function timeAgo(dateStr) {
  if (!dateStr) return "Never";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}


export default function ViewProfessionalClient({ professionalId }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromPage = searchParams.get("from");
  const [pro, setPro] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);

  useEffect(() => {
    fetch(`/api/search/professionals/${professionalId}`)
      .then((r) => r.json())
      .then((data) => setPro(data.professional || null))
      .finally(() => setLoading(false));
  }, [professionalId]);

  if (loading) {
    return (
      <div className="onboarding-loading">
        <div className="onboarding-spinner" />
        <p>Loading profile...</p>
      </div>
    );
  }

  if (!pro) {
    return <div className="card" style={{ padding: 24 }}>Professional not found.</div>;
  }

  const profile = pro.professionalProfile || {};
  const loc = pro.location;
  const rate = pro.hourlyRate;
  const schedule = (pro.availability || []).sort((a, b) => DAYS.indexOf(a.day) - DAYS.indexOf(b.day));
  const computers = safeParse(pro.environment?.computers);
  const internetTypes = safeParse(pro.environment?.internetTypes);

  return (
    <div className="positions-page">
      <button
        className="btn-link"
        style={{ padding: 0, fontSize: "0.85rem", marginBottom: 12 }}
        onClick={() => {
          if (fromPage === "invites") router.push("/invites");
          else if (fromPage === "applicants") router.push("/applicants");
          else if (fromPage === "hires") router.push("/hires");
          else router.back();
        }}
      >
        &larr; {fromPage === "invites" ? "Back to Invites Sent" : fromPage === "applicants" ? "Back to Applicants" : fromPage === "hires" ? "Back to Hires" : "Back to Search"}
      </button>

      {/* Hero card */}
      <div className="card" style={{ padding: "28px 32px", marginBottom: 20 }}>
        <div style={{ display: "flex", gap: 20, alignItems: "flex-start", flexWrap: "wrap" }}>
          {/* Avatar */}
          <div style={{
            width: 80,
            height: 80,
            minWidth: 80,
            borderRadius: "50%",
            background: "var(--teal-dim)",
            border: "3px solid var(--teal-border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "1.6rem",
            fontWeight: 700,
            color: "var(--teal)",
          }}>
            {profile.photoUrl ? (
              <img src={profile.photoUrl} alt="" style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
            ) : (
              `${pro.firstName?.[0] || ""}${pro.lastName?.[0] || ""}`
            )}
          </div>

          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: "1.4rem", fontWeight: 700, color: "var(--gray-800)", marginBottom: 4 }}>
              {pro.firstName} {pro.lastName}
            </h1>
            {profile.title && (
              <p style={{ fontSize: "1rem", color: "var(--gray-500)", marginBottom: 8 }}>{profile.title}</p>
            )}
            <div style={{ display: "flex", gap: 16, fontSize: "0.85rem", color: "var(--gray-400)", flexWrap: "wrap" }}>
              {loc && (loc.city || loc.state) && (
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                  </svg>
                  {[loc.city, loc.state].filter(Boolean).join(", ")}
                </span>
              )}
              {pro.timezone && (
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                  </svg>
                  {pro.timezone}
                </span>
              )}
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
                Last active {timeAgo(pro.lastLogin)}
              </span>
            </div>
          </div>

          {/* Rate */}
          {rate?.regularRate && (
            <div style={{
              textAlign: "center",
              padding: "16px 24px",
              background: "var(--teal-dim)",
              borderRadius: 12,
              border: "1px solid var(--teal-border)",
            }}>
              <div style={{ fontSize: "1.6rem", fontWeight: 700, color: "var(--teal)" }}>
                ${rate.regularRate}
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--gray-500)" }}>per hour</div>
              {rate.afterHoursRate && (
                <div style={{ fontSize: "0.75rem", color: "var(--gray-400)", marginTop: 4 }}>
                  After-hours: ${rate.afterHoursRate}
                </div>
              )}
              {rate.holidayRate && (
                <div style={{ fontSize: "0.75rem", color: "var(--gray-400)" }}>
                  Holiday: ${rate.holidayRate}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Links */}
        <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
          {profile.website && (
            <a href={profile.website} target="_blank" rel="noopener noreferrer"
              style={{ fontSize: "0.85rem", color: "var(--teal)" }}>
              Website
            </a>
          )}
          {profile.linkedinUrl && (
            <a href={profile.linkedinUrl} target="_blank" rel="noopener noreferrer"
              style={{ fontSize: "0.85rem", color: "var(--teal)" }}>
              LinkedIn
            </a>
          )}
        </div>

        {/* Invite button — hide when coming from invites/applicants/hires */}
        {!fromPage && (
          <div style={{ marginTop: 20 }}>
            <button className="btn-primary" style={{ width: "auto" }} onClick={() => setShowInvite(true)}>
              Invite to Apply
            </button>
          </div>
        )}
      </div>

      {/* Sections */}
      <div style={{ display: "grid", gap: 20 }}>
        {/* About */}
        {profile.summary && (
          <Section title="About">
            <div
              style={{ fontSize: "0.9rem", color: "var(--gray-700)", lineHeight: 1.7 }}
              dangerouslySetInnerHTML={{ __html: profile.summary }}
            />
          </Section>
        )}

        {/* Skills */}
        {pro.skills?.length > 0 && (
          <Section title="Skills">
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {pro.skills.map((s, i) => (
                <span key={i} className="profile-tag">
                  {s.skill.name} · {s.experience}
                </span>
              ))}
            </div>
          </Section>
        )}

        {/* Industries */}
        {pro.industries?.length > 0 && (
          <Section title="Industries">
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {pro.industries.map((ind, i) => (
                <span key={i} className="profile-tag">
                  {ind.industry.name} · {ind.experience}
                </span>
              ))}
            </div>
          </Section>
        )}

        {/* Applications */}
        {pro.applications?.length > 0 && (
          <Section title="Applications">
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {pro.applications.map((a, i) => (
                <span key={i} className="profile-tag">
                  {a.application.name} · {a.experience}
                </span>
              ))}
            </div>
          </Section>
        )}

        {/* Channels */}
        {pro.channels?.length > 0 && (
          <Section title="Communication Channels">
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {pro.channels.map((c, i) => (
                <span key={i} className="profile-tag">
                  {c.channel.name} · {c.experience}
                </span>
              ))}
            </div>
          </Section>
        )}

        {/* Availability */}
        {schedule.length > 0 && (
          <Section title="Availability">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 8 }}>
              {schedule.map((s) => (
                <div key={s.day} style={{
                  padding: "10px 14px",
                  background: "var(--teal-dim)",
                  borderRadius: 8,
                  border: "1px solid var(--teal-border)",
                }}>
                  <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--teal)", marginBottom: 2 }}>
                    {DAY_LABELS[s.day] || s.day}
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "var(--gray-600)" }}>
                    {to12hr(s.startTime)} - {to12hr(s.endTime)}
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Employment */}
        {pro.employment?.length > 0 && (
          <Section title="Employment History">
            {pro.employment.map((emp, i) => (
              <div key={i} style={{
                padding: "12px 0",
                borderBottom: i < pro.employment.length - 1 ? "1px solid var(--gray-100)" : "none",
              }}>
                <div style={{ fontWeight: 600, fontSize: "0.9rem", color: "var(--gray-800)" }}>
                  {emp.title || "Untitled Role"}
                </div>
                <div style={{ fontSize: "0.85rem", color: "var(--gray-500)" }}>
                  {emp.company}
                  {(emp.city || emp.state) && ` — ${[emp.city, emp.state].filter(Boolean).join(", ")}`}
                  {emp.remote && " (Remote)"}
                </div>
                <div style={{ fontSize: "0.8rem", color: "var(--gray-400)" }}>
                  {emp.fromMonth && emp.fromYear ? `${emp.fromMonth} ${emp.fromYear}` : emp.fromYear || ""}
                  {" — "}
                  {emp.currentlyWorking ? "Present" : (emp.throughMonth && emp.throughYear ? `${emp.throughMonth} ${emp.throughYear}` : emp.throughYear || "")}
                </div>
              </div>
            ))}
          </Section>
        )}

        {/* Education */}
        {pro.education?.length > 0 && (
          <Section title="Education">
            {pro.education.map((edu, i) => (
              <div key={i} style={{
                padding: "12px 0",
                borderBottom: i < pro.education.length - 1 ? "1px solid var(--gray-100)" : "none",
              }}>
                <div style={{ fontWeight: 600, fontSize: "0.9rem", color: "var(--gray-800)" }}>
                  {edu.degree}{edu.areaOfStudy ? ` in ${edu.areaOfStudy}` : ""}
                </div>
                <div style={{ fontSize: "0.85rem", color: "var(--gray-500)" }}>{edu.institution}</div>
                {(edu.fromDate || edu.toDate) && (
                  <div style={{ fontSize: "0.8rem", color: "var(--gray-400)" }}>
                    {edu.fromDate ? new Date(edu.fromDate).getFullYear() : ""}
                    {edu.fromDate && edu.toDate ? " — " : ""}
                    {edu.toDate ? new Date(edu.toDate).getFullYear() : ""}
                  </div>
                )}
              </div>
            ))}
          </Section>
        )}

        {/* Languages */}
        {pro.languages?.length > 0 && (
          <Section title="Languages">
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {pro.languages.map((l, i) => (
                <span key={i} className="profile-tag">
                  {l.language} · {l.proficiency}
                </span>
              ))}
            </div>
          </Section>
        )}

        {/* Work Environment */}
        {pro.environment && (
          <Section title="Work Environment">
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, fontSize: "0.85rem", color: "var(--gray-600)" }}>
              {pro.environment.workFromHome && <span className="profile-tag">Work from Home</span>}
              {pro.environment.workFromOffice && <span className="profile-tag">Work from Office</span>}
              {pro.environment.internetSpeed && <span className="profile-tag">Internet: {pro.environment.internetSpeed}</span>}
              {internetTypes.length > 0 && internetTypes.map((t, i) => (
                <span key={i} className="profile-tag">{t}</span>
              ))}
            </div>
          </Section>
        )}

      </div>

      {/* Invite Modal */}
      {showInvite && (
        <InviteModal
          professionalId={pro.id}
          professionalName={`${pro.firstName} ${pro.lastName}`}
          onClose={() => setShowInvite(false)}
        />
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
