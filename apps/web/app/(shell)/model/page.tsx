"use client";

import React, { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { ModelPipeline } from "@/components/model/ModelPipeline";
import { type ModelTransparency, fetchModelInfo } from "@/lib/api";

export default function ModelPage() {
  const [modelInfo, setModelInfo] = useState<ModelTransparency | null>(null);
  const [activeTab, setActiveTab] = useState<"pipeline" | "curves" | "features" | "card">("pipeline");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    fetchModelInfo()
      .then((data) => {
        if (mounted) setModelInfo(data);
      })
      .catch((err) => console.error(err))
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  if (loading || !modelInfo) {
    return (
      <div className="p-8 text-xs text-[var(--ink-3)] font-mono">
        Loading model transparency metrics...
      </div>
    );
  }

  const featureData = Object.entries(modelInfo.feature_importances)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, val]) => ({
      name: name.replace(/_/g, " "),
      importance: Number((val * 100).toFixed(2)),
    }));

  return (
    <div className="flex flex-col gap-8">
      {/* Title */}
      <div className="flex flex-col gap-1 border-b border-[var(--ink)] pb-4">
        <h1 className="font-display font-semibold text-3xl sm:text-4xl text-[var(--ink)]">
          Model Transparency & Governance
        </h1>
        <p className="text-sm text-[var(--ink-2)]">
          Calibrated XGBoost credit model architecture, empirical validation curves, and explainability mechanisms.
        </p>
      </div>

      {/* KPI Cards: Model Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 border-y border-[var(--rule)] divide-x divide-[var(--rule)] py-4">
        <div className="p-4 flex flex-col">
          <span className="text-xs font-mono uppercase text-[var(--ink-3)]">
            Test AUC-ROC
          </span>
          <span className="font-ui font-semibold text-3xl text-[var(--ink)] mt-2 tabular-nums">
            {modelInfo.test_auc.toFixed(4)}
          </span>
          <span className="text-[11px] text-[var(--sanction)] font-mono mt-1">
            +{(modelInfo.test_auc - modelInfo.baseline_auc).toFixed(4)} vs Baseline
          </span>
        </div>

        <div className="p-4 flex flex-col">
          <span className="text-xs font-mono uppercase text-[var(--ink-3)]">
            Baseline LogReg AUC
          </span>
          <span className="font-ui font-semibold text-3xl text-[var(--ink-2)] mt-2 tabular-nums">
            {modelInfo.baseline_auc.toFixed(4)}
          </span>
          <span className="text-[11px] text-[var(--ink-3)] font-mono mt-1">
            Linear benchmark
          </span>
        </div>

        <div className="p-4 flex flex-col">
          <span className="text-xs font-mono uppercase text-[var(--ink-3)]">
            Brier Score
          </span>
          <span className="font-ui font-semibold text-3xl text-[var(--ink)] mt-2 tabular-nums">
            {modelInfo.test_brier.toFixed(4)}
          </span>
          <span className="text-[11px] text-[var(--ink-3)] font-mono mt-1">
            Target &lt; 0.12 (Excellent)
          </span>
        </div>

        <div className="p-4 flex flex-col">
          <span className="text-xs font-mono uppercase text-[var(--ink-3)]">
            Model Version
          </span>
          <span className="font-ui font-semibold text-2xl text-[var(--ink)] mt-2 font-mono">
            {modelInfo.version}
          </span>
          <span className="text-[11px] text-[var(--ink-3)] font-mono mt-1">
            Trained: {modelInfo.train_date}
          </span>
        </div>
      </div>

      {/* Navigation Tabs with haldi underline */}
      <div className="flex items-center gap-6 border-b border-[var(--rule)]">
        {[
          { key: "pipeline", label: "01 Architecture Pipeline" },
          { key: "curves", label: "02 ROC & Calibration" },
          { key: "features", label: "03 Feature Importances" },
          { key: "card", label: "04 Model Card" },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key as any)}
            className={`pb-3 text-xs font-medium cursor-pointer transition-colors relative outline-none ${
              activeTab === tab.key
                ? "text-[var(--ink)] font-bold"
                : "text-[var(--ink-3)] hover:text-[var(--ink)]"
            }`}
          >
            {tab.label}
            {activeTab === tab.key && (
              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[var(--haldi)]" />
            )}
          </button>
        ))}
      </div>

      {/* Tab 1: Architecture Pipeline */}
      {activeTab === "pipeline" && <ModelPipeline />}

      {/* Tab 2: ROC & Calibration Curves */}
      {activeTab === "curves" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* ROC Curve */}
          <div className="p-6 bg-[var(--sheet)] border border-[var(--rule)] rounded-[2px] flex flex-col gap-4">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--rule)]">
              <span className="text-xs font-semibold text-[var(--ink)] uppercase font-mono">
                ROC Curve (AUC = {modelInfo.test_auc.toFixed(4)})
              </span>
              <span className="text-[11px] text-[var(--ink-3)] font-mono">
                TPR vs FPR
              </span>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={modelInfo.roc_curve} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--rule)" />
                  <XAxis dataKey="fpr" stroke="var(--ink-3)" fontSize={11} tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} />
                  <YAxis dataKey="tpr" stroke="var(--ink-3)" fontSize={11} tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--sheet)",
                      borderColor: "var(--rule-strong)",
                      borderRadius: "2px",
                      fontSize: "12px",
                    }}
                  />
                  <Line type="monotone" dataKey="tpr" stroke="var(--ink)" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Calibration Curve */}
          <div className="p-6 bg-[var(--sheet)] border border-[var(--rule)] rounded-[2px] flex flex-col gap-4">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--rule)]">
              <span className="text-xs font-semibold text-[var(--ink)] uppercase font-mono">
                Platt Calibration Curve
              </span>
              <span className="text-[11px] text-[var(--ink-3)] font-mono">
                Predicted vs True PD
              </span>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={modelInfo.calibration_curve} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--rule)" />
                  <XAxis dataKey="prob_pred" stroke="var(--ink-3)" fontSize={11} tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} />
                  <YAxis dataKey="prob_true" stroke="var(--ink-3)" fontSize={11} tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--sheet)",
                      borderColor: "var(--rule-strong)",
                      borderRadius: "2px",
                      fontSize: "12px",
                    }}
                  />
                  <Line type="monotone" dataKey="prob_true" stroke="var(--haldi)" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Feature Importances */}
      {activeTab === "features" && (
        <div className="p-6 bg-[var(--sheet)] border border-[var(--rule)] rounded-[2px] flex flex-col gap-4">
          <div className="flex items-center justify-between pb-2 border-b border-[var(--rule)]">
            <span className="text-xs font-semibold text-[var(--ink)] uppercase font-mono">
              Top 10 Global Feature Importances (Gain Weight)
            </span>
            <span className="text-[11px] text-[var(--ink-3)] font-mono">
              XGBoost Gain
            </span>
          </div>

          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={featureData} margin={{ top: 10, right: 20, left: 80, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--rule)" />
                <XAxis type="number" stroke="var(--ink-3)" fontSize={11} unit="%" />
                <YAxis dataKey="name" type="category" stroke="var(--ink-3)" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--sheet)",
                    borderColor: "var(--rule-strong)",
                    borderRadius: "2px",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="importance" fill="var(--ink)" radius={[0, 2, 2, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Tab 4: Model Card */}
      {activeTab === "card" && (
        <div className="p-6 bg-[var(--sheet)] border border-[var(--rule)] rounded-[2px] flex flex-col gap-4 max-w-4xl">
          <div className="flex items-center justify-between pb-2 border-b border-[var(--rule)]">
            <span className="text-xs font-semibold text-[var(--ink)] uppercase font-mono">
              Model Card: Saakh Credit XGBoost v1
            </span>
            <span className="text-[11px] text-[var(--ink-3)] font-mono">
              artifacts/model_card.md
            </span>
          </div>

          <div className="prose prose-sm max-w-none text-xs text-[var(--ink-2)] leading-relaxed flex flex-col gap-3">
            <p>
              <strong>Intended Use:</strong> Automated credit scoring and probability of default (PD) estimation for prime and near-prime Indian retail loan applicants across Personal, Home, Auto, Education, and Small Business loans.
            </p>
            <p>
              <strong>Training Data:</strong> 5,000 synthetic Indian applicant profiles generated under realistic RBI retail credit distributions (default rate ~13.1%, CIBIL distribution centered at 720 with realistic credit card utilisation).
            </p>
            <p>
              <strong>Fairness & Monotonicity Constraints:</strong> Strictly enforces monotonicity on risk features: higher CIBIL, higher income, higher savings monotonically decrease PD; higher DTI, higher card utilisation, higher loan amount monotonically increase PD.
            </p>
            <p>
              <strong>Academic Citation:</strong> Course: AI for Finance — CIA-2 · Topic 4. Student: NITHIN KUMAR U, USN: 2102508611.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
