"use client";

import { useState, useEffect } from "react";

export default function AdminBusinessesClient() {
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(null);

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

      {businesses.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "48px 24px" }}>
          <p style={{ color: "var(--gray-400)", fontSize: "0.9rem" }}>No businesses registered yet.</p>
        </div>
      ) : (
        <div className="positions-list">
          {businesses.map((biz) => {
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
                      {hasProfile && profile.industry ? ` · ${profile.industry}` : ""}
                      {hasProfile && profile.city ? ` · ${profile.city}${profile.state ? `, ${profile.state}` : ""}` : ""}
                      {` · ${biz._count.positions} posting${biz._count.positions !== 1 ? "s" : ""}`}
                      {` · Joined ${new Date(biz.createdAt).toLocaleDateString()}`}
                    </p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    {hasProfile && (
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
                    )}
                  </div>
                </div>

                {hasProfile && (
                  <div style={{ display: "flex", gap: 24, marginTop: 12, fontSize: "0.82rem", color: "var(--gray-500)" }}>
                    {profile.website && (
                      <span>Website: {profile.website}</span>
                    )}
                    {profile.phone && (
                      <span>Phone: {profile.phone}</span>
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
