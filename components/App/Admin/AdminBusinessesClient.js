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
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
