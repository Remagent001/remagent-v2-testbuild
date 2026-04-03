"use client";

import { useState, useEffect } from "react";

function formatPhone(value) {
  if (!value) return "";
  const digits = value.replace(/\D/g, "").slice(0, 10);
  if (digits.length <= 3) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
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

export default function AdminBusinessesClient() {
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(null);
  const [showArchived, setShowArchived] = useState(false);
  const [expandedBiz, setExpandedBiz] = useState(null);
  const [approvers, setApprovers] = useState({});
  const [newApprover, setNewApprover] = useState({ name: "", email: "", phone: "" });
  const [lastActiveDays, setLastActiveDays] = useState("");
  const [sortBy, setSortBy] = useState("newest");

  const loadBusinesses = () => {
    fetch("/api/admin/businesses")
      .then((r) => r.json())
      .then((data) => setBusinesses(data.businesses || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadBusinesses(); }, []);

  const handleAutoApproveToggle = async (businessProfileId, currentValue) => {
    setToggling(businessProfileId);
    await fetch("/api/admin/businesses", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ businessProfileId, autoApprove: !currentValue }),
    });
    loadBusinesses();
    setToggling(null);
  };

  const handleAllowTimeEditingToggle = async (businessProfileId, currentValue) => {
    setToggling(businessProfileId);
    await fetch("/api/admin/businesses", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ businessProfileId, allowTimeEditing: !currentValue }),
    });
    loadBusinesses();
    setToggling(null);
  };

  const handleConvenienceFeeChange = async (businessProfileId, value) => {
    await fetch("/api/admin/businesses", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ businessProfileId, convenienceFee: value }),
    });
    loadBusinesses();
  };

  const handleArchiveToggle = async (businessProfileId, currentValue) => {
    const msg = currentValue ? "Unarchive this business?" : "Archive this business? They will be hidden from the active list.";
    if (!confirm(msg)) return;
    setToggling(businessProfileId);
    await fetch("/api/admin/businesses", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ businessProfileId, archived: !currentValue }),
    });
    loadBusinesses();
    setToggling(null);
  };

  const activeBiz = businesses.filter((b) => !b.businessProfile?.archived);
  const archivedBiz = businesses.filter((b) => b.businessProfile?.archived);
  let displayList = showArchived ? archivedBiz : activeBiz;

  // Filter by last active timeframe
  if (lastActiveDays) {
    const cutoff = Date.now() - parseInt(lastActiveDays) * 86400000;
    displayList = displayList.filter((b) => {
      if (!b.lastLogin) return false;
      return new Date(b.lastLogin).getTime() >= cutoff;
    });
  }

  // Sort
  if (sortBy === "mostJPs") {
    displayList = [...displayList].sort((a, b) => (b._count?.positions || 0) - (a._count?.positions || 0));
  } else if (sortBy === "fewestJPs") {
    displayList = [...displayList].sort((a, b) => (a._count?.positions || 0) - (b._count?.positions || 0));
  } else if (sortBy === "recentActive") {
    displayList = [...displayList].sort((a, b) => {
      const aTime = a.lastLogin ? new Date(a.lastLogin).getTime() : 0;
      const bTime = b.lastLogin ? new Date(b.lastLogin).getTime() : 0;
      return bTime - aTime;
    });
  } else if (sortBy === "oldest") {
    displayList = [...displayList].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }
  // "newest" is default from API (createdAt desc)

  if (loading) {
    return (
      <div className="onboarding-loading">
        <div className="onboarding-spinner" />
        <p>Loading businesses...</p>
      </div>
    );
  }

  return (
    <div className="positions-page">
      <div className="page-header">
        <h1 className="page-title">Businesses</h1>
        <p className="page-subtitle">View and manage business accounts.</p>
      </div>

      {/* Active / Archived toggle */}
      {archivedBiz.length > 0 && (
        <div style={{ display: "flex", gap: 0, borderBottom: "2px solid var(--gray-200)", marginBottom: 24 }}>
          <button
            onClick={() => setShowArchived(false)}
            style={{
              padding: "12px 20px", fontSize: "0.9rem", fontWeight: showArchived ? 400 : 600,
              color: showArchived ? "var(--gray-500)" : "var(--gray-700)", background: "none", border: "none",
              borderBottom: showArchived ? "3px solid transparent" : "3px solid var(--gray-700)",
              cursor: "pointer", marginBottom: -2,
            }}
          >
            Active ({activeBiz.length})
          </button>
          <button
            onClick={() => setShowArchived(true)}
            style={{
              padding: "12px 20px", fontSize: "0.9rem", fontWeight: showArchived ? 600 : 400,
              color: showArchived ? "#94a3b8" : "var(--gray-500)", background: "none", border: "none",
              borderBottom: showArchived ? "3px solid #94a3b8" : "3px solid transparent",
              cursor: "pointer", marginBottom: -2,
            }}
          >
            Archived ({archivedBiz.length})
          </button>
        </div>
      )}

      {/* Filters */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
        <select
          className="form-input form-select"
          value={lastActiveDays}
          onChange={(e) => setLastActiveDays(e.target.value)}
          style={{ width: "auto", fontSize: "0.85rem", padding: "6px 12px" }}
        >
          <option value="">Last Active: Any</option>
          <option value="1">Last 24 hours</option>
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
        </select>
        <select
          className="form-input form-select"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          style={{ width: "auto", fontSize: "0.85rem", padding: "6px 12px" }}
        >
          <option value="newest">Sort: Newest First</option>
          <option value="oldest">Sort: Oldest First</option>
          <option value="recentActive">Sort: Recently Active</option>
          <option value="mostJPs">Sort: Most Job Postings</option>
          <option value="fewestJPs">Sort: Fewest Job Postings</option>
        </select>
        {(lastActiveDays || sortBy !== "newest") && (
          <button
            type="button"
            onClick={() => { setLastActiveDays(""); setSortBy("newest"); }}
            style={{
              background: "none", border: "none", cursor: "pointer",
              fontSize: "0.82rem", color: "var(--gray-400)", textDecoration: "underline",
            }}
          >
            Clear filters
          </button>
        )}
        <span style={{ fontSize: "0.82rem", color: "var(--gray-400)", marginLeft: "auto" }}>
          {displayList.length} business{displayList.length !== 1 ? "es" : ""}
        </span>
      </div>

      {displayList.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "48px 24px" }}>
          <p style={{ color: "var(--gray-400)", fontSize: "0.9rem" }}>
            {showArchived ? "No archived businesses." : "No businesses registered yet."}
          </p>
        </div>
      ) : (
        <div className="positions-list">
          {displayList.map((biz) => {
            const profile = biz.businessProfile;
            const hasProfile = profile && profile.businessName;
            return (
              <div key={biz.id} className="card position-card">
                <div className="position-card-header">
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4, flexWrap: "wrap" }}>
                      <h3 className="position-card-title">
                        {hasProfile ? profile.businessName : `${biz.firstName} ${biz.lastName}`}
                      </h3>
                      {hasProfile && profile.autoApprove && (
                        <span className="position-status-badge" style={{ backgroundColor: "#10b98118", color: "#10b981" }}>
                          Auto-Approve
                        </span>
                      )}
                    </div>
                    <p className="position-card-meta">
                      {biz.email}
                      {biz.geoCountry ? ` · ${biz.geoCountry}` : ""}
                      {hasProfile && profile.industry ? ` · ${profile.industry}` : ""}
                      {hasProfile && profile.city ? ` · ${profile.city}${profile.state ? `, ${profile.state}` : ""}` : ""}
                      {` · ${biz._count.positions} posting${biz._count.positions !== 1 ? "s" : ""}`}
                      {` · Joined ${new Date(biz.createdAt).toLocaleDateString()}`}
                      {` · Last active: ${timeAgo(biz.lastLogin)}`}
                    </p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    {hasProfile && (
                      <>
                        <label style={{
                          display: "flex", alignItems: "center", gap: 8,
                          fontSize: "0.82rem", color: "var(--gray-600)", cursor: "pointer",
                          padding: "6px 14px", borderRadius: 8,
                          background: profile.autoApprove ? "#10b98118" : "var(--gray-50)",
                          border: `1px solid ${profile.autoApprove ? "#10b981" : "var(--gray-200)"}`,
                        }}>
                          <input
                            type="checkbox"
                            checked={profile.autoApprove || false}
                            onChange={() => handleAutoApproveToggle(profile.id, profile.autoApprove)}
                            disabled={toggling === profile.id}
                            style={{ accentColor: "var(--teal)" }}
                          />
                          Auto-Approve
                        </label>
                        <label style={{
                          display: "flex", alignItems: "center", gap: 8,
                          fontSize: "0.82rem", color: "var(--gray-600)", cursor: "pointer",
                          padding: "6px 14px", borderRadius: 8,
                          background: profile.allowTimeEditing !== false ? "#3b82f618" : "var(--gray-50)",
                          border: `1px solid ${profile.allowTimeEditing !== false ? "#3b82f6" : "var(--gray-200)"}`,
                        }}>
                          <input
                            type="checkbox"
                            checked={profile.allowTimeEditing !== false}
                            onChange={() => handleAllowTimeEditingToggle(profile.id, profile.allowTimeEditing !== false)}
                            disabled={toggling === profile.id}
                            style={{ accentColor: "#3b82f6" }}
                          />
                          Allow Time Editing
                        </label>
                        <div style={{
                          display: "flex", alignItems: "center", gap: 6,
                          fontSize: "0.82rem", color: "var(--gray-600)",
                          padding: "4px 10px", borderRadius: 8,
                          background: "var(--gray-50)", border: "1px solid var(--gray-200)",
                        }}>
                          <span style={{ whiteSpace: "nowrap" }}>Fee $/hr</span>
                          <input
                            type="number"
                            min="0" step="0.50"
                            value={profile.convenienceFee ?? 3}
                            onChange={(e) => handleConvenienceFeeChange(profile.id, e.target.value)}
                            style={{ width: 56, padding: "2px 6px", fontSize: "0.82rem", border: "1px solid var(--gray-200)", borderRadius: 4, textAlign: "center" }}
                          />
                        </div>
                        <div style={{
                          display: "flex", alignItems: "center", gap: 6,
                          fontSize: "0.82rem", color: "var(--gray-600)",
                          padding: "4px 10px", borderRadius: 8,
                          background: "var(--gray-50)", border: "1px solid var(--gray-200)",
                        }}>
                          <span style={{ whiteSpace: "nowrap" }}>W-2 %</span>
                          <input
                            type="number"
                            min="0" step="1"
                            value={profile.w2Markup ?? 11}
                            onChange={(e) => {
                              fetch("/api/admin/businesses", {
                                method: "PUT",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ businessProfileId: profile.id, w2Markup: e.target.value }),
                              }).then(() => loadBusinesses());
                            }}
                            style={{ width: 48, padding: "2px 6px", fontSize: "0.82rem", border: "1px solid var(--gray-200)", borderRadius: 4, textAlign: "center" }}
                          />
                        </div>
                        <button
                          className="btn-secondary"
                          style={{
                            width: "auto", fontSize: "0.82rem", padding: "6px 14px",
                            color: profile.archived ? "var(--teal)" : "#94a3b8",
                            borderColor: profile.archived ? "var(--teal)" : "#94a3b8",
                          }}
                          onClick={() => handleArchiveToggle(profile.id, profile.archived)}
                          disabled={toggling === profile.id}
                        >
                          {profile.archived ? "Unarchive" : "Archive"}
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {hasProfile && (
                  <div style={{ display: "flex", gap: 24, marginTop: 12, fontSize: "0.82rem", color: "var(--gray-500)" }}>
                    {profile.website && (
                      <span>Website: {profile.website}</span>
                    )}
                    {profile.phone && (
                      <span>Phone: {formatPhone(profile.phone)}</span>
                    )}
                    {profile.fullAddress && (
                      <span>Address: {profile.fullAddress}</span>
                    )}
                  </div>
                )}

                {/* Timecard Approvers - expandable */}
                {hasProfile && (
                  <div style={{ marginTop: 12 }}>
                    <button
                      style={{ background: "none", border: "none", cursor: "pointer", fontSize: "0.82rem", color: "var(--teal)", fontWeight: 600, padding: 0 }}
                      onClick={() => {
                        const isOpen = expandedBiz === profile.id;
                        setExpandedBiz(isOpen ? null : profile.id);
                        if (!isOpen && !approvers[profile.id]) {
                          fetch(`/api/timecard-approvers?businessProfileId=${profile.id}`)
                            .then((r) => r.json())
                            .then((data) => setApprovers((prev) => ({ ...prev, [profile.id]: data.approvers || [] })));
                        }
                      }}
                    >
                      {expandedBiz === profile.id ? "Hide" : "Manage"} Timecard Approvers
                    </button>

                    {expandedBiz === profile.id && (
                      <div style={{ marginTop: 8, padding: 12, background: "var(--gray-50)", borderRadius: 8 }}>
                        {(approvers[profile.id] || []).length > 0 ? (
                          <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 10 }}>
                            {(approvers[profile.id] || []).map((a) => (
                              <div key={a.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "0.82rem" }}>
                                <span><strong>{a.name}</strong> — {a.email}{a.phone ? ` — ${a.phone}` : ""}</span>
                                <button
                                  onClick={async () => {
                                    await fetch(`/api/timecard-approvers?id=${a.id}`, { method: "DELETE" });
                                    setApprovers((prev) => ({ ...prev, [profile.id]: prev[profile.id].filter((x) => x.id !== a.id) }));
                                  }}
                                  style={{ background: "none", border: "none", color: "var(--gray-400)", cursor: "pointer", fontSize: "0.75rem" }}
                                >
                                  Remove
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p style={{ fontSize: "0.82rem", color: "var(--gray-400)", marginBottom: 10 }}>No approvers added yet.</p>
                        )}
                        <div style={{ display: "flex", gap: 6, alignItems: "flex-end", flexWrap: "wrap" }}>
                          <input className="form-input" placeholder="Name" style={{ width: 130, margin: 0, fontSize: "0.82rem", padding: "4px 8px" }} value={expandedBiz === profile.id ? newApprover.name : ""} onChange={(e) => setNewApprover({ ...newApprover, name: e.target.value })} />
                          <input className="form-input" placeholder="Email" style={{ width: 170, margin: 0, fontSize: "0.82rem", padding: "4px 8px" }} value={expandedBiz === profile.id ? newApprover.email : ""} onChange={(e) => setNewApprover({ ...newApprover, email: e.target.value })} />
                          <input className="form-input" placeholder="Phone" style={{ width: 120, margin: 0, fontSize: "0.82rem", padding: "4px 8px" }} value={expandedBiz === profile.id ? newApprover.phone : ""} onChange={(e) => setNewApprover({ ...newApprover, phone: e.target.value })} />
                          <button
                            className="btn-primary"
                            style={{ width: "auto", padding: "4px 12px", fontSize: "0.82rem" }}
                            disabled={!newApprover.name.trim() || !newApprover.email.trim()}
                            onClick={async () => {
                              const res = await fetch("/api/timecard-approvers", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ ...newApprover, businessProfileId: profile.id }),
                              });
                              const data = await res.json();
                              if (data.approver) {
                                setApprovers((prev) => ({ ...prev, [profile.id]: [...(prev[profile.id] || []), data.approver] }));
                                setNewApprover({ name: "", email: "", phone: "" });
                              }
                            }}
                          >
                            Add
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
