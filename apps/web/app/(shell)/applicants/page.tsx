"use client";

import React, { useState, useEffect } from "react";
import { Search, Trash2, Eye, X } from "lucide-react";
import { AnimatedIcon } from "@/components/icons/AnimatedIcon";
import { GradeChip } from "@/components/ui/GradeChip";
import { Button } from "@/components/ui/button";
import { AssessmentSheet } from "@/components/assess/AssessmentSheet";
import { formatINR, formatPct } from "@/lib/format";
import {
  type AssessmentResponse,
  fetchAssessments,
  deleteAssessment,
} from "@/lib/api";

export default function ApplicantsPage() {
  const [assessments, setAssessments] = useState<AssessmentResponse[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>("");
  const [outcomeFilter, setOutcomeFilter] = useState<string>("all");
  const [page, setPage] = useState<number>(1);
  const [selectedRecord, setSelectedRecord] = useState<AssessmentResponse | null>(null);

  const limit = 12;

  const loadData = async () => {
    setLoading(true);
    try {
      const outcome = outcomeFilter === "all" ? undefined : outcomeFilter;
      const offset = (page - 1) * limit;
      const res = await fetchAssessments(limit, offset, outcome);
      setAssessments(res.items);
      setTotal(res.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [page, outcomeFilter]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to remove this assessment from the ledger?")) return;
    try {
      await deleteAssessment(id);
      loadData();
      if (selectedRecord?.id === id) setSelectedRecord(null);
    } catch (err) {
      console.error(err);
    }
  };

  const filteredItems = assessments.filter((item) =>
    item.application.full_name.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div className="flex flex-col gap-6">
      {/* Title */}
      <div className="flex flex-col gap-1 border-b border-[var(--ink)] pb-4">
        <h1 className="font-display font-semibold text-3xl sm:text-4xl text-[var(--ink)]">
          Applicants Ledger
        </h1>
        <p className="text-sm text-[var(--ink-2)]">
          Audited repository of assessed loan applications with credit scores, default probabilities, and underwriting decisions.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Outcome Filter Buttons */}
        <div className="flex items-center gap-1 p-0.5 bg-[var(--sheet-2)] border border-[var(--rule-strong)] rounded-[2px]">
          {["all", "sanctioned", "refer", "declined"].map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => {
                setOutcomeFilter(filter);
                setPage(1);
              }}
              className={`px-3 py-1.5 text-xs font-medium rounded-[1px] capitalize transition-colors cursor-pointer ${
                outcomeFilter === filter
                  ? "bg-[var(--ink)] text-[var(--on-ink)] font-semibold"
                  : "text-[var(--ink-2)] hover:text-[var(--ink)]"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative flex items-center max-w-xs w-full">
          <Search size={16} className="absolute left-3 text-[var(--ink-3)] pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search applicant name..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-[var(--sheet)] text-[var(--ink)] border border-[var(--rule-strong)] rounded-[2px] outline-none focus:border-[var(--ink)]"
          />
        </div>
      </div>

      {/* Swiss Style Data Table */}
      <div className="bg-[var(--sheet)] border border-[var(--rule)] rounded-[2px] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b-[1.5px] border-b-[var(--ink)] bg-[var(--sheet-2)] font-mono text-[11px] text-[var(--ink-2)] uppercase tracking-wider">
                <th className="py-2.5 px-4">Applicant</th>
                <th className="py-2.5 px-4">Income</th>
                <th className="py-2.5 px-4">Loan Amount</th>
                <th className="py-2.5 px-4">CIBIL</th>
                <th className="py-2.5 px-4">FOIR</th>
                <th className="py-2.5 px-4">PD (%)</th>
                <th className="py-2.5 px-4">Grade</th>
                <th className="py-2.5 px-4">Verdict</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--rule)]">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-[var(--ink-3)]">
                    Loading applicant ledger...
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-[var(--ink-3)]">
                    No applicant records found.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => setSelectedRecord(item)}
                    className="hover:bg-[var(--haldi-wash)] cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4 font-medium text-[var(--ink)]">
                      {item.application.full_name}
                      <span className="block text-[10px] text-[var(--ink-3)] font-mono">
                        {item.application.employment_type}
                      </span>
                    </td>
                    <td className="py-3 px-4 tabular-nums">
                      {formatINR(item.application.monthly_income)}
                    </td>
                    <td className="py-3 px-4 tabular-nums font-semibold">
                      {formatINR(item.application.loan_amount)}
                    </td>
                    <td className="py-3 px-4 tabular-nums font-mono">
                      {item.application.cibil_score}
                    </td>
                    <td className="py-3 px-4 tabular-nums font-mono">
                      {(item.foir * 100).toFixed(1)}%
                    </td>
                    <td className="py-3 px-4 tabular-nums font-mono font-semibold">
                      {formatPct(item.pd)}
                    </td>
                    <td className="py-3 px-4">
                      <GradeChip grade={item.grade} size="sm" showLabel={false} />
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-[2px] font-mono text-[10px] uppercase font-bold ${
                          item.decision === "sanctioned"
                            ? "bg-[var(--sanction-wash)] text-[var(--sanction)]"
                            : item.decision === "refer"
                            ? "bg-[var(--refer-wash)] text-[var(--refer)]"
                            : "bg-[var(--decline-wash)] text-[var(--decline)]"
                        }`}
                      >
                        {item.decision}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedRecord(item);
                          }}
                          className="p-1 text-[var(--ink-3)] hover:text-[var(--ink)] transition-colors cursor-pointer"
                          title="View Assessment"
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleDelete(item.id, e)}
                          className="p-1 text-[var(--ink-3)] hover:text-[var(--decline)] transition-colors cursor-pointer"
                          title="Delete Record"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="flex items-center justify-between px-4 py-3 bg-[var(--sheet-2)] border-t border-[var(--rule)] text-xs text-[var(--ink-3)] font-mono">
          <span>
            Showing {filteredItems.length} of {total} records
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-2 py-1 text-xs"
            >
              Previous
            </Button>
            <span>
              Page {page} of {totalPages}
            </span>
            <Button
              variant="secondary"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-2 py-1 text-xs"
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      {/* Detail Modal Overlay */}
      {selectedRecord && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--scrim)]"
          onClick={() => setSelectedRecord(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-[var(--canvas)] rounded-[2px]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setSelectedRecord(null)}
              className="absolute top-4 right-4 z-20 p-1.5 bg-[var(--sheet)] border border-[var(--rule)] rounded-[2px] text-[var(--ink)] hover:bg-[var(--sheet-2)] transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X size={16} />
            </button>
            <AssessmentSheet
              assessment={selectedRecord}
              onExportPdf={() => window.print()}
            />
          </div>
        </div>
      )}
    </div>
  );
}
