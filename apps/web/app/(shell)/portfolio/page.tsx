"use client";

import React, { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  CartesianGrid,
  Cell,
} from "recharts";
import { formatINRShort, formatPct } from "@/lib/format";
import { type PortfolioStats, fetchPortfolioStats } from "@/lib/api";

const GRADE_COLORS: Record<string, string> = {
  A: "var(--grade-a)",
  B: "var(--grade-b)",
  C: "var(--grade-c)",
  D: "var(--grade-d)",
  E: "var(--grade-e)",
};

export default function PortfolioPage() {
  const [stats, setStats] = useState<PortfolioStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    fetchPortfolioStats()
      .then((data) => {
        if (mounted) setStats(data);
      })
      .catch((err) => console.error(err))
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  if (loading || !stats) {
    return (
      <div className="p-8 text-xs text-[var(--ink-3)] font-mono">
        Loading portfolio analytics...
      </div>
    );
  }

  const gradeData = Object.entries(stats.grade_distribution).map(([grade, count]) => ({
    grade,
    count,
  }));

  const loanTypeData = Object.entries(stats.loan_type_distribution).map(([purpose, count]) => ({
    purpose: purpose.charAt(0).toUpperCase() + purpose.slice(1),
    count,
  }));

  return (
    <div className="flex flex-col gap-8">
      {/* Page Title */}
      <div className="flex flex-col gap-1 border-b border-[var(--ink)] pb-4">
        <h1 className="font-display font-semibold text-3xl sm:text-4xl text-[var(--ink)]">
          Portfolio Risk Analytics
        </h1>
        <p className="text-sm text-[var(--ink-2)]">
          Executive underwriting overview across {stats.total_applications} assessed retail lending applicants.
        </p>
      </div>

      {/* KPI Row: 4 big figures separated by hairlines (no rounded cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 border-y border-[var(--rule)] divide-x divide-[var(--rule)] py-4">
        <div className="p-4 flex flex-col">
          <span className="text-xs font-mono uppercase text-[var(--ink-3)]">
            Volume Sanctioned
          </span>
          <span className="font-ui font-semibold text-4xl text-[var(--ink)] mt-2 tabular-nums">
            {formatINRShort(stats.total_volume_sanctioned)}
          </span>
          <span className="text-[11px] text-[var(--ink-3)] mt-1 font-mono">
            Across approved loans
          </span>
        </div>

        <div className="p-4 flex flex-col">
          <span className="text-xs font-mono uppercase text-[var(--sanction)]">
            Sanction Rate
          </span>
          <span className="font-ui font-semibold text-4xl text-[var(--sanction)] mt-2 tabular-nums">
            {(stats.sanction_rate * 100).toFixed(1)}%
          </span>
          <span className="text-[11px] text-[var(--ink-3)] mt-1 font-mono">
            Straight-through approval
          </span>
        </div>

        <div className="p-4 flex flex-col">
          <span className="text-xs font-mono uppercase text-[var(--refer)]">
            Referral Rate
          </span>
          <span className="font-ui font-semibold text-4xl text-[var(--refer)] mt-2 tabular-nums">
            {(stats.refer_rate * 100).toFixed(1)}%
          </span>
          <span className="text-[11px] text-[var(--ink-3)] mt-1 font-mono">
            Manual credit review
          </span>
        </div>

        <div className="p-4 flex flex-col">
          <span className="text-xs font-mono uppercase text-[var(--ink-3)]">
            Portfolio Avg PD
          </span>
          <span className="font-ui font-semibold text-4xl text-[var(--ink)] mt-2 tabular-nums">
            {formatPct(stats.avg_pd)}
          </span>
          <span className="text-[11px] text-[var(--ink-3)] mt-1 font-mono">
            Calibrated default risk
          </span>
        </div>
      </div>

      {/* 4 Flat Chart Panels Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Panel 1: Grade Distribution */}
        <div className="p-6 bg-[var(--sheet)] border border-[var(--rule)] rounded-[2px] flex flex-col gap-4">
          <div className="flex items-center justify-between pb-2 border-b border-[var(--rule)]">
            <span className="text-xs font-semibold text-[var(--ink)] uppercase font-mono">
              Grade Distribution (A–E)
            </span>
            <span className="text-[11px] text-[var(--ink-3)] font-mono">
              Tier Breakdown
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={gradeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="grade" stroke="var(--ink-3)" fontSize={11} tickLine={false} />
                <YAxis stroke="var(--ink-3)" fontSize={11} tickLine={false} />
                <Tooltip
                  cursor={{ fill: "var(--haldi-wash)", opacity: 0.4 }}
                  contentStyle={{
                    backgroundColor: "var(--sheet)",
                    borderColor: "var(--rule-strong)",
                    borderRadius: "2px",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="count" radius={[1, 1, 0, 0]}>
                  {gradeData.map((entry) => (
                    <Cell key={entry.grade} fill={GRADE_COLORS[entry.grade] || "var(--ink)"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Panel 2: Default Probability Histogram */}
        <div className="p-6 bg-[var(--sheet)] border border-[var(--rule)] rounded-[2px] flex flex-col gap-4">
          <div className="flex items-center justify-between pb-2 border-b border-[var(--rule)]">
            <span className="text-xs font-semibold text-[var(--ink)] uppercase font-mono">
              Default Probability (PD) Histogram
            </span>
            <span className="text-[11px] text-[var(--ink-3)] font-mono">
              Risk Density
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.pd_histogram} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="bin" stroke="var(--ink-3)" fontSize={10} tickLine={false} />
                <YAxis stroke="var(--ink-3)" fontSize={11} tickLine={false} />
                <Tooltip
                  cursor={{ fill: "var(--haldi-wash)", opacity: 0.4 }}
                  contentStyle={{
                    backgroundColor: "var(--sheet)",
                    borderColor: "var(--rule-strong)",
                    borderRadius: "2px",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="count" fill="var(--chart-1)" radius={[1, 1, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Panel 3: Loan Type Volume */}
        <div className="p-6 bg-[var(--sheet)] border border-[var(--rule)] rounded-[2px] flex flex-col gap-4">
          <div className="flex items-center justify-between pb-2 border-b border-[var(--rule)]">
            <span className="text-xs font-semibold text-[var(--ink)] uppercase font-mono">
              Loan Purpose Distribution
            </span>
            <span className="text-[11px] text-[var(--ink-3)] font-mono">
              By Category
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={loanTypeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="purpose" stroke="var(--ink-3)" fontSize={11} tickLine={false} />
                <YAxis stroke="var(--ink-3)" fontSize={11} tickLine={false} />
                <Tooltip
                  cursor={{ fill: "var(--haldi-wash)", opacity: 0.4 }}
                  contentStyle={{
                    backgroundColor: "var(--sheet)",
                    borderColor: "var(--rule-strong)",
                    borderRadius: "2px",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="count" fill="var(--chart-3)" radius={[1, 1, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Panel 4: FOIR vs PD Scatter */}
        <div className="p-6 bg-[var(--sheet)] border border-[var(--rule)] rounded-[2px] flex flex-col gap-4">
          <div className="flex items-center justify-between pb-2 border-b border-[var(--rule)]">
            <span className="text-xs font-semibold text-[var(--ink)] uppercase font-mono">
              FOIR vs Default Probability
            </span>
            <span className="text-[11px] text-[var(--ink-3)] font-mono">
              Scatter Matrix
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--rule)" />
                <XAxis
                  type="number"
                  dataKey="foir"
                  name="FOIR"
                  unit="%"
                  stroke="var(--ink-3)"
                  fontSize={11}
                  tickFormatter={(v) => `${(v * 100).toFixed(0)}`}
                />
                <YAxis
                  type="number"
                  dataKey="pd"
                  name="PD"
                  unit="%"
                  stroke="var(--ink-3)"
                  fontSize={11}
                  tickFormatter={(v) => `${(v * 100).toFixed(0)}`}
                />
                <Tooltip
                  cursor={{ strokeDasharray: "3 3" }}
                  formatter={(val: any) => `${(Number(val) * 100).toFixed(1)}%`}
                  contentStyle={{
                    backgroundColor: "var(--sheet)",
                    borderColor: "var(--rule-strong)",
                    borderRadius: "2px",
                    fontSize: "12px",
                  }}
                />
                <Scatter name="Applicants" data={stats.foir_vs_pd_scatter} fill="var(--chart-2)" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
