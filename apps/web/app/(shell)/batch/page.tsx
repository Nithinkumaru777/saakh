"use client";

import React, { useState } from "react";
import { CloudUpload, Download, FileText, CheckCircle2, AlertCircle } from "lucide-react";
import { AnimatedIcon } from "@/components/icons/AnimatedIcon";
import { GradeChip } from "@/components/ui/GradeChip";
import { Button } from "@/components/ui/button";
import { formatINR, formatPct } from "@/lib/format";
import { type BatchScoreResponse, uploadBatchFile } from "@/lib/api";

export default function BatchPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [result, setResult] = useState<BatchScoreResponse | null>(null);
  const [dragActive, setDragActive] = useState<boolean>(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setIsUploading(true);
    try {
      const res = await uploadBatchFile(file);
      setResult(res);
    } catch (err) {
      console.error(err);
      alert("Failed to process batch CSV file. Ensure valid column formats.");
    } finally {
      setIsUploading(false);
    }
  };

  const downloadSampleTemplate = () => {
    const csvContent =
      "full_name,age,monthly_income,employment_type,years_in_current_job,residence_type,cibil_score,existing_emi,credit_card_utilisation,savings_balance,loan_amount,loan_tenure_months,loan_purpose,co_applicant\n" +
      "Priya Sharma,32,140000,salaried,5,owned,790,12000,15,850000,2500000,60,home,true\n" +
      "Rajesh Patel,44,85000,business,8,owned,680,18000,42,420000,1200000,48,personal,false\n" +
      "Sunita Verma,28,42000,salaried,2,rented,640,16000,68,90000,1500000,60,personal,false\n";
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "saakh_batch_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportResultsCsv = () => {
    if (!result) return;
    let csv = "row_index,full_name,monthly_income,loan_amount,cibil_score,pd,grade,decision,indicative_rate,monthly_emi\n";
    result.results.forEach((r) => {
      csv += `${r.row_index},"${r.full_name}",${r.monthly_income},${r.loan_amount},${r.cibil_score},${r.pd},${r.grade},${r.decision},${r.indicative_rate},${r.monthly_emi}\n`;
    });
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `saakh_batch_results_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Title */}
      <div className="flex flex-col gap-1 border-b border-[var(--ink)] pb-4">
        <h1 className="font-display font-semibold text-3xl sm:text-4xl text-[var(--ink)]">
          Batch Underwriting
        </h1>
        <p className="text-sm text-[var(--ink-2)]">
          Upload large retail loan application portfolios via CSV for automated high-throughput risk scoring, policy validation, and tier grading.
        </p>
      </div>

      {/* Upload Zone & Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {/* Drop zone (Cols 1–2) */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`md:col-span-2 p-8 border-2 border-dashed rounded-[2px] flex flex-col items-center justify-center text-center transition-colors ${
            dragActive
              ? "border-[var(--ink)] bg-[var(--haldi-wash)]"
              : "border-[var(--rule-strong)] bg-[var(--sheet)] hover:border-[var(--ink)]"
          }`}
        >
          <div className="w-12 h-12 rounded-full bg-[var(--sheet-2)] border border-[var(--rule)] flex items-center justify-center text-[var(--ink)] mb-3">
            <AnimatedIcon icon={CloudUpload} preset="nudge-y" size={24} />
          </div>

          <h3 className="font-display font-semibold text-lg text-[var(--ink)] mb-1">
            {file ? file.name : "Drag & drop your CSV file here"}
          </h3>
          <p className="text-xs text-[var(--ink-2)] mb-4">
            Supports CSV portfolios with up to 1,000 retail applicant rows per upload.
          </p>

          <div className="flex items-center gap-3">
            <label className="cursor-pointer">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
              />
              <Button variant="secondary" size="sm" type="button">
                Browse Files
              </Button>
            </label>

            {file && (
              <Button
                variant="primary"
                size="sm"
                loading={isUploading}
                onClick={handleUpload}
              >
                Process Portfolio
              </Button>
            )}
          </div>
        </div>

        {/* Template & Specs Card (Col 3) */}
        <div className="p-6 bg-[var(--sheet)] border border-[var(--rule)] rounded-[2px] flex flex-col gap-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-[var(--ink)] uppercase font-mono">
            <AnimatedIcon icon={FileText} preset="draw" size={16} />
            <span>CSV Requirements</span>
          </div>
          <p className="text-xs text-[var(--ink-2)] leading-relaxed">
            CSV must include columns: <code className="text-[10px] bg-[var(--sheet-2)] px-1 py-0.5 rounded">monthly_income</code>, <code className="text-[10px] bg-[var(--sheet-2)] px-1 py-0.5 rounded">loan_amount</code>, <code className="text-[10px] bg-[var(--sheet-2)] px-1 py-0.5 rounded">cibil_score</code>, <code className="text-[10px] bg-[var(--sheet-2)] px-1 py-0.5 rounded">tenure</code>, etc.
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={downloadSampleTemplate}
            className="flex items-center justify-center gap-2 text-xs border border-[var(--rule-strong)]"
          >
            <AnimatedIcon icon={Download} preset="nudge-y" size={14} />
            <span>Download Sample CSV</span>
          </Button>
        </div>
      </div>

      {/* Results View */}
      {result && (
        <div className="flex flex-col gap-6 mt-4">
          {/* Summary KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 bg-[var(--sheet)] border border-[var(--ink)] shadow-[4px_4px_0_0_var(--edge)] rounded-[2px]">
            <div>
              <span className="text-[11px] font-mono uppercase text-[var(--ink-3)] block">
                Total Rows
              </span>
              <span className="font-ui font-semibold text-2xl text-[var(--ink)]">
                {result.total_rows}
              </span>
            </div>
            <div>
              <span className="text-[11px] font-mono uppercase text-[var(--sanction)] block">
                Sanctioned
              </span>
              <span className="font-ui font-semibold text-2xl text-[var(--sanction)]">
                {result.decision_counts["sanctioned"] || 0}
              </span>
            </div>
            <div>
              <span className="text-[11px] font-mono uppercase text-[var(--refer)] block">
                Referred
              </span>
              <span className="font-ui font-semibold text-2xl text-[var(--refer)]">
                {result.decision_counts["refer"] || 0}
              </span>
            </div>
            <div>
              <span className="text-[11px] font-mono uppercase text-[var(--decline)] block">
                Declined
              </span>
              <span className="font-ui font-semibold text-2xl text-[var(--decline)]">
                {result.decision_counts["declined"] || 0}
              </span>
            </div>
          </div>

          {/* Stacked Grade Distribution Bar */}
          <div className="p-4 bg-[var(--sheet)] border border-[var(--rule)] rounded-[2px] flex flex-col gap-2">
            <span className="text-xs font-semibold text-[var(--ink)]">
              Grade Distribution Strip
            </span>
            <div className="flex h-4 w-full rounded-[2px] overflow-hidden border border-[var(--rule-strong)]">
              {(["A", "B", "C", "D", "E"] as const).map((g) => {
                const count = result.grade_counts[g] || 0;
                const pct = result.successful_rows > 0 ? (count / result.successful_rows) * 100 : 0;
                if (pct === 0) return null;
                const colors = {
                  A: "bg-[var(--grade-a)]",
                  B: "bg-[var(--grade-b)]",
                  C: "bg-[var(--grade-c)]",
                  D: "bg-[var(--grade-d)]",
                  E: "bg-[var(--grade-e)]",
                }[g];
                return (
                  <div
                    key={g}
                    style={{ width: `${pct}%` }}
                    className={`${colors} flex items-center justify-center text-[10px] text-white font-bold tracking-wider`}
                    title={`Grade ${g}: ${count} (${pct.toFixed(1)}%)`}
                  >
                    {pct > 5 ? g : ""}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Export & Results Table */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[var(--ink)] uppercase font-mono">
                Scored Records ({result.results.length})
              </span>
              <Button
                variant="secondary"
                size="sm"
                onClick={exportResultsCsv}
                className="flex items-center gap-1.5"
              >
                <AnimatedIcon icon={Download} preset="nudge-y" size={14} />
                <span>Export Results (CSV)</span>
              </Button>
            </div>

            <div className="bg-[var(--sheet)] border border-[var(--rule)] rounded-[2px] overflow-x-auto max-h-96">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[var(--ink)] bg-[var(--sheet-2)] font-mono text-[11px] text-[var(--ink-2)] uppercase">
                    <th className="py-2 px-3">#</th>
                    <th className="py-2 px-3">Applicant</th>
                    <th className="py-2 px-3">Income</th>
                    <th className="py-2 px-3">Loan</th>
                    <th className="py-2 px-3">CIBIL</th>
                    <th className="py-2 px-3">PD (%)</th>
                    <th className="py-2 px-3">Grade</th>
                    <th className="py-2 px-3">Decision</th>
                    <th className="py-2 px-3">Rate</th>
                    <th className="py-2 px-3">EMI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--rule)]">
                  {result.results.map((r) => (
                    <tr key={r.row_index} className="hover:bg-[var(--sheet-2)]">
                      <td className="py-2 px-3 font-mono text-[var(--ink-3)]">{r.row_index}</td>
                      <td className="py-2 px-3 font-medium text-[var(--ink)]">{r.full_name}</td>
                      <td className="py-2 px-3 tabular-nums">{formatINR(r.monthly_income)}</td>
                      <td className="py-2 px-3 tabular-nums">{formatINR(r.loan_amount)}</td>
                      <td className="py-2 px-3 font-mono">{r.cibil_score}</td>
                      <td className="py-2 px-3 font-mono font-semibold">{formatPct(r.pd)}</td>
                      <td className="py-2 px-3">
                        <GradeChip grade={r.grade as any} size="sm" showLabel={false} />
                      </td>
                      <td className="py-2 px-3">
                        <span
                          className={`inline-block px-1.5 py-0.5 rounded-[2px] font-mono text-[10px] uppercase font-bold ${
                            r.decision === "sanctioned"
                              ? "bg-[var(--sanction-wash)] text-[var(--sanction)]"
                              : r.decision === "refer"
                              ? "bg-[var(--refer-wash)] text-[var(--refer)]"
                              : "bg-[var(--decline-wash)] text-[var(--decline)]"
                          }`}
                        >
                          {r.decision}
                        </span>
                      </td>
                      <td className="py-2 px-3 font-mono">{r.indicative_rate.toFixed(2)}%</td>
                      <td className="py-2 px-3 tabular-nums">{formatINR(r.monthly_emi)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
