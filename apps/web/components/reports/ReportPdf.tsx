import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { AssessmentResponse } from "@/lib/api";
import { formatINR, formatPct } from "@/lib/format";

const styles = StyleSheet.create({
  page: {
    padding: 36,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#17171A",
    backgroundColor: "#FFFFFF",
  },
  header: {
    borderBottomWidth: 1.5,
    borderBottomColor: "#17171A",
    paddingBottom: 12,
    marginBottom: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
  },
  subtitle: {
    fontSize: 9,
    color: "#4D4E55",
    marginTop: 2,
  },
  refBadge: {
    fontSize: 8,
    fontFamily: "Helvetica-Oblique",
    color: "#6B6C73",
  },
  verdictBanner: {
    padding: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderRadius: 2,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  verdictTitle: {
    fontSize: 14,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  gradeBox: {
    fontSize: 12,
    fontWeight: "bold",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderRadius: 2,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "bold",
    borderBottomWidth: 0.5,
    borderBottomColor: "#C9C8C0",
    paddingBottom: 4,
    marginBottom: 8,
    marginTop: 10,
    textTransform: "uppercase",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  col: {
    width: "48%",
  },
  label: {
    color: "#6B6C73",
    fontSize: 9,
  },
  value: {
    fontWeight: "bold",
    fontSize: 9,
  },
  table: {
    marginTop: 6,
    marginBottom: 12,
    borderWidth: 0.5,
    borderColor: "#E1E0DA",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: "#E1E0DA",
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  tableHeader: {
    backgroundColor: "#FAFAF8",
    fontWeight: "bold",
    fontSize: 8,
    textTransform: "uppercase",
  },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 36,
    right: 36,
    borderTopWidth: 0.5,
    borderTopColor: "#E1E0DA",
    paddingTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 8,
    color: "#6B6C73",
  },
});

export interface ReportPdfProps {
  assessment: AssessmentResponse;
}

export function ReportPdfDocument({ assessment }: ReportPdfProps) {
  const { application } = assessment;

  const isSanctioned = assessment.decision === "sanctioned";
  const isRefer = assessment.decision === "refer";

  const bannerBg = isSanctioned ? "#DDF2E6" : isRefer ? "#FCE8D4" : "#FBE1E3";
  const bannerColor = isSanctioned ? "#0B7A4B" : isRefer ? "#A04A00" : "#C42B3B";

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Saakh Underwriting Note</Text>
            <Text style={styles.subtitle}>AI-Based Credit Assessment & Risk Sanction Memorandum</Text>
          </View>
          <View>
            <Text style={styles.refBadge}>REF: {assessment.id.slice(0, 12)}</Text>
            <Text style={styles.refBadge}>DATE: {new Date(assessment.created_at || Date.now()).toLocaleDateString()}</Text>
          </View>
        </View>

        {/* Verdict Banner */}
        <View style={[styles.verdictBanner, { backgroundColor: bannerBg, borderColor: bannerColor }]}>
          <View>
            <Text style={[styles.verdictTitle, { color: bannerColor }]}>
              {assessment.decision === "sanctioned" ? "SANCTIONED" : assessment.decision === "refer" ? "REFER FOR SENIOR REVIEW" : "DECLINED"}
            </Text>
            <Text style={{ fontSize: 9, color: bannerColor, marginTop: 2 }}>
              Calibrated Default Risk: {formatPct(assessment.pd)} (Expected Loss: {(assessment.pd * 0.45 * 100).toFixed(2)}%)
            </Text>
          </View>
          <Text style={[styles.gradeBox, { borderColor: bannerColor, color: bannerColor }]}>
            GRADE {assessment.grade}
          </Text>
        </View>

        {/* Applicant Profile */}
        <Text style={styles.sectionTitle}>1. Applicant Profile</Text>
        <View style={styles.row}>
          <View style={styles.col}>
            <View style={styles.row}>
              <Text style={styles.label}>Full Name:</Text>
              <Text style={styles.value}>{application.full_name}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Age:</Text>
              <Text style={styles.value}>{application.age} years</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Employment:</Text>
              <Text style={styles.value}>{application.employment_type} ({application.years_in_current_job} yrs)</Text>
            </View>
          </View>

          <View style={styles.col}>
            <View style={styles.row}>
              <Text style={styles.label}>Monthly Income:</Text>
              <Text style={styles.value}>{formatINR(application.monthly_income)}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>CIBIL Score:</Text>
              <Text style={styles.value}>{application.cibil_score}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Credit Card Utilisation:</Text>
              <Text style={styles.value}>{application.credit_card_utilisation}%</Text>
            </View>
          </View>
        </View>

        {/* Sanction Terms */}
        <Text style={styles.sectionTitle}>2. Sanctioned Financial Terms</Text>
        <View style={styles.row}>
          <View style={styles.col}>
            <View style={styles.row}>
              <Text style={styles.label}>Requested Loan:</Text>
              <Text style={styles.value}>{formatINR(application.loan_amount)}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Tenure:</Text>
              <Text style={styles.value}>{application.loan_tenure_months} months</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Purpose:</Text>
              <Text style={styles.value}>{application.loan_purpose}</Text>
            </View>
          </View>

          <View style={styles.col}>
            <View style={styles.row}>
              <Text style={styles.label}>Monthly EMI:</Text>
              <Text style={styles.value}>{formatINR(assessment.monthly_emi)}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Indicative Rate:</Text>
              <Text style={styles.value}>{assessment.indicative_rate.toFixed(2)}% p.a.</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>FOIR Ratio:</Text>
              <Text style={styles.value}>{(assessment.foir * 100).toFixed(1)}%</Text>
            </View>
          </View>
        </View>

        {/* SHAP Explanations Table */}
        <Text style={styles.sectionTitle}>3. AI Feature Attribution (SHAP Decomposition)</Text>
        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={{ width: "30%" }}>Risk Factor</Text>
            <Text style={{ width: "20%" }}>Impact</Text>
            <Text style={{ width: "50%" }}>Underwriting Narrative</Text>
          </View>
          {assessment.shap_explanations.slice(0, 4).map((exp, idx) => (
            <View key={idx} style={styles.tableRow}>
              <Text style={{ width: "30%", fontWeight: "bold" }}>{exp.display_name}</Text>
              <Text style={{ width: "20%" }}>
                {exp.contribution_pp < 0 ? "" : "+"}
                {exp.contribution_pp.toFixed(2)} pp
              </Text>
              <Text style={{ width: "50%", color: "#4D4E55" }}>{exp.sentence}</Text>
            </View>
          ))}
        </View>

        {/* Policy Compliance */}
        <Text style={styles.sectionTitle}>4. Policy Rules & Compliance</Text>
        <Text style={{ fontSize: 9, color: "#4D4E55", marginBottom: 6 }}>
          {assessment.passed_policy
            ? "Applicant satisfied all 6 mandatory knockout policy filters (K1–K6). FOIR remains below regulatory maximum."
            : `Knockout filters triggered: ${assessment.knockout_rules.join(", ")}`}
        </Text>

        {/* Academic Accreditation Footer */}
        <View style={styles.footer}>
          <Text>Course: AI for Finance — CIA-2 · Topic 4: Risk Assessment System</Text>
          <Text>Student: NITHIN KUMAR U · USN: 2102508611</Text>
        </View>
      </Page>
    </Document>
  );
}
