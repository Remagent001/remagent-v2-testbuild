"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { convertTime, to12hr, tzLabel, isOvernightAfterConvert, nextDayLabel, shiftDurationHrs } from "@/utilities/TimeZoneHelper";

const DAY_LABELS = { monday: "Mon", tuesday: "Tue", wednesday: "Wed", thursday: "Thu", friday: "Fri", saturday: "Sat", sunday: "Sun" };
const DAY_ORDER = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

const US_STATES = [
  { abbr: "AL", name: "Alabama" }, { abbr: "AK", name: "Alaska" }, { abbr: "AZ", name: "Arizona" },
  { abbr: "AR", name: "Arkansas" }, { abbr: "CA", name: "California" }, { abbr: "CO", name: "Colorado" },
  { abbr: "CT", name: "Connecticut" }, { abbr: "DE", name: "Delaware" }, { abbr: "FL", name: "Florida" },
  { abbr: "GA", name: "Georgia" }, { abbr: "HI", name: "Hawaii" }, { abbr: "ID", name: "Idaho" },
  { abbr: "IL", name: "Illinois" }, { abbr: "IN", name: "Indiana" }, { abbr: "IA", name: "Iowa" },
  { abbr: "KS", name: "Kansas" }, { abbr: "KY", name: "Kentucky" }, { abbr: "LA", name: "Louisiana" },
  { abbr: "ME", name: "Maine" }, { abbr: "MD", name: "Maryland" }, { abbr: "MA", name: "Massachusetts" },
  { abbr: "MI", name: "Michigan" }, { abbr: "MN", name: "Minnesota" }, { abbr: "MS", name: "Mississippi" },
  { abbr: "MO", name: "Missouri" }, { abbr: "MT", name: "Montana" }, { abbr: "NE", name: "Nebraska" },
  { abbr: "NV", name: "Nevada" }, { abbr: "NH", name: "New Hampshire" }, { abbr: "NJ", name: "New Jersey" },
  { abbr: "NM", name: "New Mexico" }, { abbr: "NY", name: "New York" }, { abbr: "NC", name: "North Carolina" },
  { abbr: "ND", name: "North Dakota" }, { abbr: "OH", name: "Ohio" }, { abbr: "OK", name: "Oklahoma" },
  { abbr: "OR", name: "Oregon" }, { abbr: "PA", name: "Pennsylvania" }, { abbr: "RI", name: "Rhode Island" },
  { abbr: "SC", name: "South Carolina" }, { abbr: "SD", name: "South Dakota" }, { abbr: "TN", name: "Tennessee" },
  { abbr: "TX", name: "Texas" }, { abbr: "UT", name: "Utah" }, { abbr: "VT", name: "Vermont" },
  { abbr: "VA", name: "Virginia" }, { abbr: "WA", name: "Washington" }, { abbr: "WV", name: "West Virginia" },
  { abbr: "WI", name: "Wisconsin" }, { abbr: "WY", name: "Wyoming" },
];

const CONTRACT_TYPES = [
  { value: "", label: "Any" },
  { value: "open_ended", label: "Open Ended" },
  { value: "fixed", label: "Fixed Term" },
  { value: "direct_hire", label: "Direct Hire" },
];

const ENV_OPTIONS = [
  { value: "", label: "Any" },
  { value: "home", label: "Remote / Work from Home" },
  { value: "office", label: "In Office" },
  { value: "mix", label: "Hybrid" },
];

function stripHtml(html) {
  if (!html) return "";
  return html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();
}

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return new Date(dateStr).toLocaleDateString();
}

export default function JobSearchClient() {
  const { data: session } = useSession();
  const viewerTz = session?.user?.timezone || "Americas/Eastern";
  const router = useRouter();
  const [jobs, setJobs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(true);

  // Filters
  const [keyword, setKeyword] = useState("");
  const [state, setState] = useState("");
  const [minRate, setMinRate] = useState("");
  const [maxRate, setMaxRate] = useState("");
  const [contractType, setContractType] = useState("");
  const [environment, setEnvironment] = useState("");

  // Search function
  const doSearch = useCallback(async (pageNum = 1) => {
    setLoading(true);
    const params = new URLSearchParams();
    if (keyword) params.set("keyword", keyword);
    if (state) params.set("state", state);
    if (minRate) params.set("minRate", minRate);
    if (maxRate) params.set("maxRate", maxRate);
    if (contractType) params.set("contractType", contractType);
    if (environment) params.set("environment", environment);
    params.set("page", pageNum);

    const res = await fetch(`/api/jobs?${params}`);
    const data = await res.json();
    setJobs(data.jobs || []);
    setTotal(data.total || 0);
    setPage(data.page || 1);
    setTotalPages(data.totalPages || 1);
    setLoading(false);
  }, [keyword, state, minRate, maxRate, contractType, environment]);

  // Auto-search on filter change
  const debounceRef = useRef(null);
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(1), 400);
    return () => clearTimeout(debounceRef.current);
  }, [keyword, state, minRate, maxRate, contractType, environment]); // eslint-disable-line react-hooks/exhaustive-deps

  const clearFilters = () => {
    setKeyword("");
    setState("");
    setMinRate("");
    setMaxRate("");
    setContractType("");
    setEnvironment("");
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 className="page-title">Browse Jobs</h1>
          <p className="page-subtitle">Find positions that match your skills</p>
        </div>
        <button className="btn-secondary" onClick={() => setFiltersOpen(!filtersOpen)} style={{ fontSize: "0.82rem" }}>
          {filtersOpen ? "Hide Filters" : "Show Filters"}
        </button>
      </div>

      <div style={{ display: "flex", gap: 24 }}>
        {/* Filters sidebar */}
        {filtersOpen && (
          <div style={{ width: 260, minWidth: 260 }}>
            <div className="card" style={{ padding: 20, position: "sticky", top: 80 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <span style={{ fontWeight: 600, fontSize: "0.9rem", color: "var(--gray-700)" }}>Filters</span>
                <button className="btn-link" style={{ fontSize: "0.75rem" }} onClick={clearFilters}>Clear All</button>
              </div>

              <FilterSection title="Keyword">
                <input className="form-input" placeholder="Search title or description..." value={keyword} onChange={(e) => setKeyword(e.target.value)} style={{ fontSize: "0.82rem" }} />
              </FilterSection>

              <FilterSection title="Location">
                <select className="form-input" value={state} onChange={(e) => setState(e.target.value)} style={{ fontSize: "0.82rem" }}>
                  <option value="">Any state</option>
                  {US_STATES.map((s) => <option key={s.abbr} value={s.abbr}>{s.name}</option>)}
                </select>
              </FilterSection>

              <FilterSection title="Rate ($/hr)">
                <div style={{ display: "flex", gap: 8 }}>
                  <input className="form-input" type="number" placeholder="Min" value={minRate} onChange={(e) => setMinRate(e.target.value)} style={{ fontSize: "0.82rem", width: "50%" }} />
                  <input className="form-input" type="number" placeholder="Max" value={maxRate} onChange={(e) => setMaxRate(e.target.value)} style={{ fontSize: "0.82rem", width: "50%" }} />
                </div>
              </FilterSection>

              <FilterSection title="Contract Type">
                <select className="form-input" value={contractType} onChange={(e) => setContractType(e.target.value)} style={{ fontSize: "0.82rem" }}>
                  {CONTRACT_TYPES.map((ct) => <option key={ct.value} value={ct.value}>{ct.label}</option>)}
                </select>
              </FilterSection>

              <FilterSection title="Work Environment">
                <select className="form-input" value={environment} onChange={(e) => setEnvironment(e.target.value)} style={{ fontSize: "0.82rem" }}>
                  {ENV_OPTIONS.map((e) => <option key={e.value} value={e.value}>{e.label}</option>)}
                </select>
              </FilterSection>
            </div>
          </div>
        )}

        {/* Results */}
        <div style={{ flex: 1 }}>
          <div style={{ marginBottom: 12, fontSize: "0.82rem", color: "var(--gray-500)" }}>
            {loading ? "Searching..." : `${total} job${total !== 1 ? "s" : ""} found`}
          </div>

          {!loading && jobs.length === 0 && (
            <div className="card" style={{ padding: 40, textAlign: "center" }}>
              <p style={{ color: "var(--gray-400)", fontSize: "0.95rem" }}>
                No jobs match your skills and filters. Try adjusting your filters or adding more skills to your profile.
              </p>
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} router={router} viewerTz={viewerTz} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 24 }}>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  className={p === page ? "btn-primary" : "btn-secondary"}
                  style={{ width: 36, height: 36, padding: 0, fontSize: "0.82rem" }}
                  onClick={() => doSearch(p)}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function JobCard({ job, router, viewerTz }) {
  const description = stripHtml(job.description);
  const schedule = (job.availability || []).sort((a, b) => DAY_ORDER.indexOf(a.day) - DAY_ORDER.indexOf(b.day));
  const requiredSkills = job.skills?.filter((s) => s.requirement === "required") || [];
  const desiredSkills = job.skills?.filter((s) => s.requirement !== "required") || [];
  const envLabels = { home: "Remote", office: "In Office", mix: "Hybrid", optional: "Flexible" };
  const workLoc = (() => {
    if (!job.environment?.workLocation) return null;
    const locs = Array.isArray(job.environment.workLocation) ? job.environment.workLocation : (() => { try { return JSON.parse(job.environment.workLocation); } catch { return []; } })();
    return locs.map((l) => envLabels[l] || l).join(" / ");
  })();

  return (
    <div
      className="card"
      style={{ padding: "20px 24px", cursor: "pointer", transition: "box-shadow 0.15s" }}
      onClick={() => router.push(`/jobs/${job.id}`)}
      onMouseEnter={(e) => e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.1)"}
      onMouseLeave={(e) => e.currentTarget.style.boxShadow = ""}
    >
      <div style={{ display: "flex", gap: 16 }}>
        {/* Company logo/initial */}
        <div style={{
          width: 52, height: 52, minWidth: 52, borderRadius: 10,
          background: "var(--teal-dim)", border: "1px solid var(--teal-border)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "1.1rem", fontWeight: 700, color: "var(--teal)", overflow: "hidden",
        }}>
          {job.company?.logo ? (
            <img src={`/${job.company.logo}`} alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
          ) : (
            job.company?.name?.[0] || "?"
          )}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8 }}>
            <div>
              <h3 style={{ fontSize: "1.05rem", fontWeight: 600, color: "var(--gray-800)", marginBottom: 2 }}>
                {job.title || "Untitled Position"}
              </h3>
              <div style={{ display: "flex", gap: 12, fontSize: "0.82rem", color: "var(--gray-400)", flexWrap: "wrap" }}>
                {job.company?.name && (
                  <span style={{ fontWeight: 500, color: "var(--gray-600)" }}>{job.company.name}</span>
                )}
                {!job.company?.name && job.showCompanyName === false && (
                  <span style={{ fontStyle: "italic", color: "var(--gray-400)" }}>Company name hidden</span>
                )}
                {(job.company?.city || job.company?.state) && (
                  <span>{[job.company.city, job.company.state].filter(Boolean).join(", ")}</span>
                )}
                {workLoc && <span>{workLoc}</span>}
                <span>Posted {timeAgo(job.createdAt)}</span>
              </div>
            </div>

            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              {job.alreadyApplied && (
                <span style={{
                  padding: "3px 10px", borderRadius: 12, fontSize: "0.72rem", fontWeight: 600,
                  background: "#10b98118", color: "#10b981",
                }}>
                  Applied
                </span>
              )}
              {job.regularRate && (
                <span style={{ fontWeight: 700, color: "var(--teal)", fontSize: "1rem" }}>
                  ${job.regularRate}/hr
                </span>
              )}
            </div>
          </div>

          {/* Description preview */}
          {description && (
            <p style={{ fontSize: "0.85rem", color: "var(--gray-500)", marginTop: 8, lineHeight: 1.5 }}>
              {description.length > 200 ? description.substring(0, 200) + "..." : description}
            </p>
          )}

          {/* Required skills */}
          {requiredSkills.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
              {requiredSkills.map((s) => (
                <span key={s.id} style={{
                  fontSize: "0.72rem", padding: "2px 8px", borderRadius: 10,
                  background: "var(--teal-dim)", color: "var(--teal)", border: "1px solid var(--teal-border)",
                }}>
                  {s.name}
                </span>
              ))}
              {desiredSkills.length > 0 && (
                <span style={{ fontSize: "0.72rem", color: "var(--gray-400)", padding: "2px 0" }}>
                  +{desiredSkills.length} desired
                </span>
              )}
            </div>
          )}

          {/* Schedule */}
          {schedule.length > 0 && (
            <div style={{ display: "flex", gap: 4, marginTop: 8 }}>
              {DAY_ORDER.map((day) => {
                const entry = schedule.find((s) => s.day === day);
                const overnight = entry && isOvernightAfterConvert(entry.startTime, entry.endTime, job.timezone, viewerTz);
                const hrs = entry ? shiftDurationHrs(entry.startTime, entry.endTime) : 0;
                const tooltip = entry
                  ? `${DAY_LABELS[day]}: ${to12hr(convertTime(entry.startTime, job.timezone, viewerTz))}${overnight ? ` → ${nextDayLabel(day)}` : ""} ${to12hr(convertTime(entry.endTime, job.timezone, viewerTz))} ${tzLabel(viewerTz)} (${hrs} hrs)`
                  : `${DAY_LABELS[day]}: Not scheduled`;
                return (
                  <div
                    key={day}
                    title={tooltip}
                    style={{
                      width: 28, height: 22, borderRadius: 4, fontSize: "0.6rem", fontWeight: 600,
                      display: "flex", alignItems: "center", justifyContent: "center",
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

function FilterSection({ title, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{
        display: "block", fontSize: "0.8rem", fontWeight: 600, color: "var(--gray-600)",
        marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.04em",
      }}>
        {title}
      </label>
      {children}
    </div>
  );
}
