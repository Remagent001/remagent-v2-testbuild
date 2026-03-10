"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import InviteModal from "./InviteModal";

const LAST_LOGIN_OPTIONS = [
  { value: 0, label: "Any time" },
  { value: 7, label: "Last 7 days" },
  { value: 14, label: "Last 14 days" },
  { value: 30, label: "Last 30 days" },
  { value: 60, label: "Last 60 days" },
  { value: 90, label: "Last 90 days" },
];

const US_STATES = [
  "Alabama","Alaska","Arizona","Arkansas","California","Colorado","Connecticut",
  "Delaware","Florida","Georgia","Hawaii","Idaho","Illinois","Indiana","Iowa",
  "Kansas","Kentucky","Louisiana","Maine","Maryland","Massachusetts","Michigan",
  "Minnesota","Mississippi","Missouri","Montana","Nebraska","Nevada","New Hampshire",
  "New Jersey","New Mexico","New York","North Carolina","North Dakota","Ohio",
  "Oklahoma","Oregon","Pennsylvania","Rhode Island","South Carolina","South Dakota",
  "Tennessee","Texas","Utah","Vermont","Virginia","Washington","West Virginia",
  "Wisconsin","Wyoming",
];

const DAY_LABELS = { monday: "Mon", tuesday: "Tue", wednesday: "Wed", thursday: "Thu", friday: "Fri", saturday: "Sat", sunday: "Sun" };
const DAY_ORDER = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

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

function stripHtml(html) {
  if (!html) return "";
  return html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();
}

export default function SearchProfessionalsClient() {
  const router = useRouter();
  const [results, setResults] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [inviteTarget, setInviteTarget] = useState(null); // { id, name }

  // Filter data (lookups)
  const [allSkills, setAllSkills] = useState([]);
  const [allChannels, setAllChannels] = useState([]);
  const [allApplications, setAllApplications] = useState([]);

  // Filter values
  const [keyword, setKeyword] = useState("");
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [selectedChannels, setSelectedChannels] = useState([]);
  const [selectedApps, setSelectedApps] = useState([]);
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [minRate, setMinRate] = useState("");
  const [maxRate, setMaxRate] = useState("");
  const [lastLogin, setLastLogin] = useState(0);

  // Load lookup data
  useEffect(() => {
    fetch("/api/positions/lookup")
      .then((r) => r.json())
      .then((data) => {
        setAllSkills(data.allSkills || []);
        setAllChannels(data.allChannels || []);
        setAllApplications(data.allApplications || []);
      });
  }, []);

  // Search function
  const doSearch = useCallback(async (pageNum = 1) => {
    setLoading(true);
    const params = new URLSearchParams();
    if (keyword) params.set("keyword", keyword);
    if (state) params.set("state", state);
    if (city) params.set("city", city);
    if (minRate) params.set("minRate", minRate);
    if (maxRate) params.set("maxRate", maxRate);
    if (lastLogin) params.set("lastLogin", lastLogin);
    selectedSkills.forEach((id) => params.append("skill", id));
    selectedChannels.forEach((id) => params.append("channel", id));
    selectedApps.forEach((id) => params.append("application", id));
    params.set("page", pageNum);

    const res = await fetch(`/api/search/professionals?${params}`);
    const data = await res.json();
    setResults(data.professionals || []);
    setTotal(data.total || 0);
    setPage(data.page || 1);
    setTotalPages(data.totalPages || 1);
    setLoading(false);
    setInitialLoad(false);
  }, [keyword, state, city, minRate, maxRate, lastLogin, selectedSkills, selectedChannels, selectedApps]);

  // Initial search on mount
  useEffect(() => { doSearch(1); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = (e) => {
    e.preventDefault();
    doSearch(1);
  };

  const clearFilters = () => {
    setKeyword("");
    setSelectedSkills([]);
    setSelectedChannels([]);
    setSelectedApps([]);
    setState("");
    setCity("");
    setMinRate("");
    setMaxRate("");
    setLastLogin(0);
  };

  const hasFilters = keyword || selectedSkills.length || selectedChannels.length || selectedApps.length || state || city || minRate || maxRate || lastLogin;

  return (
    <div className="positions-page">
      <div className="page-header">
        <h1 className="page-title">Search Professionals</h1>
        <p className="page-subtitle">Find qualified professionals for your job postings.</p>
      </div>

      {/* Search bar */}
      <form onSubmit={handleSearch} style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <input
          type="text"
          className="form-input"
          placeholder="Search by name, title, or keyword..."
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          style={{ flex: 1 }}
        />
        <button type="submit" className="btn-primary" style={{ width: "auto", padding: "0 24px" }}>
          Search
        </button>
        <button
          type="button"
          className="btn-secondary"
          style={{ width: "auto", padding: "0 16px", fontSize: "0.85rem" }}
          onClick={() => setFiltersOpen(!filtersOpen)}
        >
          {filtersOpen ? "Hide Filters" : "Show Filters"}
        </button>
      </form>

      <div style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>
        {/* Filters panel */}
        {filtersOpen && (
          <div className="card" style={{ width: 280, minWidth: 280, padding: 20, position: "sticky", top: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ fontSize: "0.95rem", fontWeight: 600, color: "var(--gray-700)" }}>Filters</h3>
              {hasFilters && (
                <button className="btn-link" style={{ fontSize: "0.8rem", padding: 0 }} onClick={() => { clearFilters(); setTimeout(() => doSearch(1), 0); }}>
                  Clear All
                </button>
              )}
            </div>

            {/* Last Login */}
            <FilterSection title="Last Active">
              <select
                className="form-input"
                value={lastLogin}
                onChange={(e) => setLastLogin(parseInt(e.target.value))}
                style={{ fontSize: "0.85rem" }}
              >
                {LAST_LOGIN_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </FilterSection>

            {/* Location */}
            <FilterSection title="Location">
              <select
                className="form-input"
                value={state}
                onChange={(e) => setState(e.target.value)}
                style={{ fontSize: "0.85rem", marginBottom: 8 }}
              >
                <option value="">Any State</option>
                {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <input
                className="form-input"
                placeholder="City"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                style={{ fontSize: "0.85rem" }}
              />
            </FilterSection>

            {/* Hourly Rate */}
            <FilterSection title="Hourly Rate">
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input
                  className="form-input"
                  type="number"
                  placeholder="Min"
                  value={minRate}
                  onChange={(e) => setMinRate(e.target.value)}
                  style={{ fontSize: "0.85rem", width: "50%" }}
                />
                <span style={{ color: "var(--gray-400)" }}>—</span>
                <input
                  className="form-input"
                  type="number"
                  placeholder="Max"
                  value={maxRate}
                  onChange={(e) => setMaxRate(e.target.value)}
                  style={{ fontSize: "0.85rem", width: "50%" }}
                />
              </div>
            </FilterSection>

            {/* Skills */}
            <FilterSection title="Skills">
              <MultiSelect
                items={allSkills}
                selected={selectedSkills}
                onChange={setSelectedSkills}
                placeholder="Select skills..."
              />
            </FilterSection>

            {/* Channels */}
            <FilterSection title="Channels">
              <MultiSelect
                items={allChannels}
                selected={selectedChannels}
                onChange={setSelectedChannels}
                placeholder="Select channels..."
              />
            </FilterSection>

            {/* Applications */}
            <FilterSection title="Applications">
              <MultiSelect
                items={allApplications}
                selected={selectedApps}
                onChange={setSelectedApps}
                placeholder="Select applications..."
              />
            </FilterSection>

            <button
              className="btn-primary"
              style={{ width: "100%", marginTop: 16 }}
              onClick={() => doSearch(1)}
            >
              Apply Filters
            </button>
          </div>
        )}

        {/* Results */}
        <div style={{ flex: 1 }}>
          {/* Results count */}
          {!initialLoad && (
            <div style={{ marginBottom: 16, fontSize: "0.85rem", color: "var(--gray-500)" }}>
              {total === 0 ? "No professionals found" : `${total} professional${total !== 1 ? "s" : ""} found`}
              {hasFilters && " matching your filters"}
            </div>
          )}

          {loading && (
            <div className="onboarding-loading" style={{ padding: "48px 0" }}>
              <div className="onboarding-spinner" />
              <p>Searching...</p>
            </div>
          )}

          {!loading && results.length === 0 && !initialLoad && (
            <div className="card" style={{ textAlign: "center", padding: "48px 24px" }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--gray-300)" strokeWidth="1.5" style={{ margin: "0 auto 16px" }}>
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
              </svg>
              <h3 style={{ color: "var(--gray-600)", marginBottom: 8 }}>No results</h3>
              <p style={{ color: "var(--gray-400)", fontSize: "0.9rem" }}>
                Try adjusting your filters or search terms.
              </p>
            </div>
          )}

          {!loading && results.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {results.map((pro) => (
                <ProfessionalCard key={pro.id} pro={pro} router={router} onInvite={setInviteTarget} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && !loading && (
            <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 24 }}>
              <button
                className="btn-secondary"
                style={{ padding: "8px 16px", fontSize: "0.85rem" }}
                disabled={page <= 1}
                onClick={() => doSearch(page - 1)}
              >
                Previous
              </button>
              <span style={{ padding: "8px 16px", fontSize: "0.85rem", color: "var(--gray-500)" }}>
                Page {page} of {totalPages}
              </span>
              <button
                className="btn-secondary"
                style={{ padding: "8px 16px", fontSize: "0.85rem" }}
                disabled={page >= totalPages}
                onClick={() => doSearch(page + 1)}
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Invite Modal */}
      {inviteTarget && (
        <InviteModal
          professionalId={inviteTarget.id}
          professionalName={inviteTarget.name}
          onClose={() => setInviteTarget(null)}
        />
      )}
    </div>
  );
}

// Professional result card
function ProfessionalCard({ pro, router, onInvite }) {
  const profile = pro.professionalProfile || {};
  const loc = pro.location;
  const rate = pro.hourlyRate?.regularRate;
  const summary = stripHtml(profile.summary);
  const schedule = (pro.availability || []).sort((a, b) => DAY_ORDER.indexOf(a.day) - DAY_ORDER.indexOf(b.day));

  return (
    <div
      className="card"
      style={{ padding: "20px 24px", cursor: "pointer", transition: "box-shadow 0.15s" }}
      onClick={() => router.push(`/search/${pro.id}`)}
      onMouseEnter={(e) => e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.1)"}
      onMouseLeave={(e) => e.currentTarget.style.boxShadow = ""}
    >
      <div style={{ display: "flex", gap: 16 }}>
        {/* Avatar */}
        <div style={{
          width: 64,
          height: 64,
          minWidth: 64,
          borderRadius: "50%",
          background: "var(--teal-dim)",
          border: "2px solid var(--teal-border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "1.3rem",
          fontWeight: 700,
          color: "var(--teal)",
        }}>
          {profile.photoUrl ? (
            <img src={profile.photoUrl} alt="" style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
          ) : (
            `${pro.firstName?.[0] || ""}${pro.lastName?.[0] || ""}`
          )}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8 }}>
            <div>
              <h3 style={{ fontSize: "1.05rem", fontWeight: 600, color: "var(--gray-800)", marginBottom: 2 }}>
                {pro.firstName} {pro.lastName}
              </h3>
              {profile.title && (
                <p style={{ fontSize: "0.9rem", color: "var(--gray-500)", marginBottom: 4 }}>{profile.title}</p>
              )}
              <div style={{ display: "flex", gap: 12, fontSize: "0.82rem", color: "var(--gray-400)", flexWrap: "wrap" }}>
                {loc && (loc.city || loc.state) && (
                  <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                    </svg>
                    {[loc.city, loc.state].filter(Boolean).join(", ")}
                  </span>
                )}
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                  </svg>
                  Active {timeAgo(pro.lastLogin)}
                </span>
              </div>
            </div>

            {/* Rate */}
            <div style={{ textAlign: "right" }}>
              {rate ? (
                <div style={{
                  fontSize: "1.1rem",
                  fontWeight: 700,
                  color: "var(--teal)",
                }}>
                  ${rate}<span style={{ fontSize: "0.8rem", fontWeight: 400, color: "var(--gray-400)" }}>/hr</span>
                </div>
              ) : (
                <span style={{ fontSize: "0.8rem", color: "var(--gray-300)" }}>Rate not set</span>
              )}
              <button
                className="btn-primary"
                style={{ width: "auto", padding: "6px 14px", fontSize: "0.8rem", marginTop: 8 }}
                onClick={(e) => {
                  e.stopPropagation();
                  onInvite({ id: pro.id, name: `${pro.firstName} ${pro.lastName}` });
                }}
              >
                Invite to Apply
              </button>
            </div>
          </div>

          {/* Summary */}
          {summary && (
            <p style={{
              fontSize: "0.85rem",
              color: "var(--gray-500)",
              marginTop: 10,
              lineHeight: 1.5,
              overflow: "hidden",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
            }}>
              {summary}
            </p>
          )}

          {/* Skills tags */}
          {pro.skills?.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
              {pro.skills.slice(0, 6).map((s) => (
                <span key={s.skill.id} className="profile-tag" style={{ fontSize: "0.75rem", padding: "3px 10px" }}>
                  {s.skill.name}
                </span>
              ))}
              {pro.skills.length > 6 && (
                <span style={{ fontSize: "0.75rem", color: "var(--gray-400)", padding: "3px 0" }}>
                  +{pro.skills.length - 6} more
                </span>
              )}
            </div>
          )}

          {/* Channels */}
          {pro.channels?.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
              {pro.channels.map((c) => (
                <span key={c.channel.id} style={{
                  fontSize: "0.72rem",
                  padding: "2px 8px",
                  borderRadius: 10,
                  background: "var(--gray-100)",
                  color: "var(--gray-500)",
                }}>
                  {c.channel.name} · {c.experience}
                </span>
              ))}
            </div>
          )}

          {/* Availability mini */}
          {schedule.length > 0 && (
            <div style={{ display: "flex", gap: 4, marginTop: 8 }}>
              {DAY_ORDER.map((day) => {
                const entry = schedule.find((s) => s.day === day);
                return (
                  <div
                    key={day}
                    title={entry ? `${DAY_LABELS[day]}: ${to12hr(entry.startTime)} - ${to12hr(entry.endTime)}` : `${DAY_LABELS[day]}: Not available`}
                    style={{
                      width: 28,
                      height: 22,
                      borderRadius: 4,
                      fontSize: "0.6rem",
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: entry ? "var(--teal-dim)" : "var(--gray-100)",
                      color: entry ? "var(--teal)" : "var(--gray-300)",
                      border: entry ? "1px solid var(--teal-border)" : "1px solid var(--gray-200)",
                    }}
                  >
                    {DAY_LABELS[day]}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Collapsible filter section
function FilterSection({ title, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{
        display: "block",
        fontSize: "0.8rem",
        fontWeight: 600,
        color: "var(--gray-600)",
        marginBottom: 6,
        textTransform: "uppercase",
        letterSpacing: "0.04em",
      }}>
        {title}
      </label>
      {children}
    </div>
  );
}

// Multi-select dropdown with checkboxes
function MultiSelect({ items, selected, onChange, placeholder }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = search
    ? items.filter((i) => i.name.toLowerCase().includes(search.toLowerCase()))
    : items;

  const toggle = (id) => {
    onChange(selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id]);
  };

  return (
    <div style={{ position: "relative" }}>
      <div
        onClick={() => setOpen(!open)}
        style={{
          padding: "8px 12px",
          border: "1px solid var(--gray-200)",
          borderRadius: 8,
          fontSize: "0.85rem",
          cursor: "pointer",
          background: "white",
          minHeight: 38,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          color: selected.length ? "var(--gray-700)" : "var(--gray-400)",
        }}
      >
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {selected.length ? `${selected.length} selected` : placeholder}
        </span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          style={{ transform: open ? "rotate(180deg)" : "none", transition: "0.15s", minWidth: 12 }}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>

      {open && (
        <div style={{
          position: "absolute",
          top: "100%",
          left: 0,
          right: 0,
          background: "white",
          border: "1px solid var(--gray-200)",
          borderRadius: 8,
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          zIndex: 100,
          maxHeight: 240,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}>
          {items.length > 8 && (
            <div style={{ padding: 8, borderBottom: "1px solid var(--gray-100)" }}>
              <input
                className="form-input"
                placeholder="Type to filter..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ fontSize: "0.82rem" }}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          )}
          <div style={{ overflow: "auto", maxHeight: 200 }}>
            {filtered.map((item) => (
              <label
                key={item.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 12px",
                  fontSize: "0.82rem",
                  cursor: "pointer",
                  background: selected.includes(item.id) ? "var(--teal-dim)" : "transparent",
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <input
                  type="checkbox"
                  checked={selected.includes(item.id)}
                  onChange={() => toggle(item.id)}
                  style={{ accentColor: "var(--teal)" }}
                />
                {item.name}
              </label>
            ))}
            {filtered.length === 0 && (
              <div style={{ padding: "12px", fontSize: "0.82rem", color: "var(--gray-400)", textAlign: "center" }}>
                No matches
              </div>
            )}
          </div>
        </div>
      )}

      {/* Selected tags below */}
      {selected.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 6 }}>
          {selected.map((id) => {
            const item = items.find((i) => i.id === id);
            return item ? (
              <span
                key={id}
                style={{
                  fontSize: "0.7rem",
                  padding: "2px 8px",
                  borderRadius: 10,
                  background: "var(--teal-dim)",
                  color: "var(--teal)",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                {item.name}
                <button
                  type="button"
                  onClick={() => toggle(id)}
                  style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: "var(--teal)", fontSize: "0.8rem", lineHeight: 1 }}
                >
                  x
                </button>
              </span>
            ) : null;
          })}
        </div>
      )}
    </div>
  );
}
