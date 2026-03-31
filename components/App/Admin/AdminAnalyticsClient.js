"use client";

import { useState, useEffect } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line,
} from "recharts";

const COLORS = ["#0fd4b0", "#06b6d4", "#f59e0b", "#ef4444", "#8b5cf6"];

export default function AdminAnalyticsClient() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/analytics")
      .then((r) => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const fmt = (val) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(val);

  if (loading) {
    return <div className="card" style={{ textAlign: "center", padding: 40, color: "var(--gray-400)" }}>Loading analytics...</div>;
  }
  if (!data) {
    return <div className="card" style={{ textAlign: "center", padding: 40, color: "var(--gray-400)" }}>Failed to load.</div>;
  }

  const { stats, charts } = data;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Analytics</h1>
        <p className="page-subtitle">Platform-wide metrics and trends.</p>
      </div>

      {/* Stat cards */}
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-card-label">Hours This Week</div>
          <div className="stat-card-value">{stats.totalHoursThisWeek}h</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Revenue This Week</div>
          <div className="stat-card-value">{fmt(stats.revenueThisWeek)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Pending Approvals</div>
          <div className="stat-card-value" style={{ color: stats.pendingApprovals > 0 ? "#f59e0b" : "inherit" }}>
            {stats.pendingApprovals}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Overdue Invoices</div>
          <div className="stat-card-value" style={{ color: stats.overdueInvoices > 0 ? "#ef4444" : "inherit" }}>
            {stats.overdueInvoices}
          </div>
          {stats.overdueTotal > 0 && (
            <div style={{ fontSize: "0.75rem", color: "#ef4444", fontWeight: 600, marginTop: 2 }}>
              {fmt(stats.overdueTotal)}
            </div>
          )}
        </div>
      </div>

      {/* Charts grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        {/* Weekly Revenue */}
        <div className="card">
          <div className="card-title" style={{ marginBottom: 16 }}>Weekly Revenue (Last 12 Weeks)</div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={charts.weeklyRevenue}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="week" tick={{ fontSize: 11, fill: "#64748b" }} />
              <YAxis tick={{ fontSize: 11, fill: "#64748b" }} tickFormatter={(v) => `$${v}`} />
              <Tooltip formatter={(v) => fmt(v)} />
              <Bar dataKey="amount" fill="#0fd4b0" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Hours by Business */}
        <div className="card">
          <div className="card-title" style={{ marginBottom: 16 }}>Hours by Business (This Month)</div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={charts.hoursByBusiness} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis type="number" tick={{ fontSize: 11, fill: "#64748b" }} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: "#64748b" }} width={120} />
              <Tooltip />
              <Bar dataKey="hours" fill="#06b6d4" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Status Breakdown */}
        <div className="card">
          <div className="card-title" style={{ marginBottom: 16 }}>Timesheet Status Breakdown</div>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={charts.statusBreakdown}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={3}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {charts.statusBreakdown.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue Trend */}
        <div className="card">
          <div className="card-title" style={{ marginBottom: 16 }}>Revenue Trend (Last 6 Months)</div>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={charts.revenueTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#64748b" }} />
              <YAxis tick={{ fontSize: 11, fill: "#64748b" }} tickFormatter={(v) => `$${v}`} />
              <Tooltip formatter={(v) => fmt(v)} />
              <Line type="monotone" dataKey="amount" stroke="#0fd4b0" strokeWidth={2} dot={{ fill: "#0fd4b0" }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
