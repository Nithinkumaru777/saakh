/**
 * Saakh API Client: Type-safe interaction with the FastAPI backend.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export type EmploymentType = "salaried" | "self_employed" | "business" | "professional";
export type ResidenceType = "owned" | "rented" | "mortgaged";
export type LoanPurpose = "home" | "personal" | "auto" | "education" | "business";

export interface ApplicationInput {
  full_name: string;
  age: number;
  monthly_income: number;
  employment_type: EmploymentType;
  years_in_current_job: number;
  residence_type: ResidenceType;
  cibil_score: number;
  existing_emi: number;
  credit_card_utilisation: number;
  savings_balance: number;
  loan_amount: number;
  loan_tenure_months: number;
  loan_purpose: LoanPurpose;
  co_applicant: boolean;
}

export interface ScoreResponse {
  pd: number;
  grade: "A" | "B" | "C" | "D" | "E";
  expected_loss_pct: number;
  decision: "sanctioned" | "refer" | "declined";
  indicative_rate: number;
  monthly_emi: number;
  foir: number;
  max_eligible_amount: number;
  is_eligible: boolean;
}

export interface ShapExplanation {
  feature: string;
  display_name: string;
  contribution_pp: number;
  direction: "increases_risk" | "decreases_risk";
  sentence: string;
}

export interface CounterfactualAdvice {
  lever: string;
  change_description: string;
  new_pd: number;
  new_grade: "A" | "B" | "C" | "D" | "E";
  new_decision: "sanctioned" | "refer" | "declined";
  new_rate: number;
  feasible: boolean;
  delta_description?: string;
  patch?: Partial<ApplicationInput>;
}

export interface AssessmentResponse {
  id: string;
  created_at: string;
  application: ApplicationInput;
  pd: number;
  grade: "A" | "B" | "C" | "D" | "E";
  decision: "sanctioned" | "refer" | "declined";
  indicative_rate: number;
  monthly_emi: number;
  foir: number;
  max_eligible_amount: number;
  passed_policy: boolean;
  knockout_rules: string[];
  referral_reasons: string[];
  shap_explanations: ShapExplanation[];
  counterfactuals: CounterfactualAdvice[];
  student: string;
  usn: string;
}

export interface Persona {
  id: string;
  name: string;
  description: string;
  category: string;
  target_outcome: "sanctioned" | "refer" | "declined";
  tag: string;
  application: ApplicationInput;
}

export interface PortfolioStats {
  total_applications: number;
  sanction_rate: number;
  refer_rate: number;
  decline_rate: number;
  avg_pd: number;
  total_volume_sanctioned: number;
  grade_distribution: Record<string, number>;
  loan_type_distribution: Record<string, number>;
  foir_vs_pd_scatter: Array<{ foir: number; pd: number; outcome: string }>;
  pd_histogram: Array<{ bin: string; count: number }>;
}

export interface ModelTransparency {
  model_name: string;
  version: string;
  train_date: string;
  test_auc: number;
  test_brier: number;
  baseline_auc: number;
  feature_importances: Record<string, number>;
  metrics: {
    accuracy: number;
    precision: number;
    recall: number;
    f1: number;
    auc_roc: number;
    brier_score: number;
    log_loss: number;
  };
  confusion_matrix: {
    tn: number;
    fp: number;
    fn: number;
    tp: number;
  };
  roc_curve: Array<{ fpr: number; tpr: number }>;
  calibration_curve: Array<{ prob_pred: number; prob_true: number }>;
  model_card_markdown: string;
}

export interface BatchItemResult {
  row_index: number;
  full_name: string;
  monthly_income: number;
  loan_amount: number;
  cibil_score: number;
  pd: number;
  grade: string;
  decision: string;
  indicative_rate: number;
  monthly_emi: number;
  errors?: string[];
}

export interface BatchScoreResponse {
  total_rows: number;
  successful_rows: number;
  failed_rows: number;
  grade_counts: Record<string, number>;
  decision_counts: Record<string, number>;
  results: BatchItemResult[];
}

export async function fetchHealth(): Promise<{ status: string; product: string; student: string; usn: string }> {
  const res = await fetch(`${API_BASE}/api/health`);
  if (!res.ok) throw new Error(`Health check failed: ${res.statusText}`);
  return res.json();
}

export async function scoreApplication(app: Partial<ApplicationInput>): Promise<ScoreResponse> {
  const res = await fetch(`${API_BASE}/api/score`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(app),
  });
  if (!res.ok) throw new Error(`Score failed: ${res.statusText}`);
  return res.json();
}

export async function assessApplication(app: ApplicationInput): Promise<AssessmentResponse> {
  const res = await fetch(`${API_BASE}/api/assess`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(app),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail ? JSON.stringify(err.detail) : `Assessment failed: ${res.statusText}`);
  }
  return res.json();
}

export async function fetchPersonas(): Promise<Persona[]> {
  const res = await fetch(`${API_BASE}/api/personas`);
  if (!res.ok) throw new Error(`Fetch personas failed: ${res.statusText}`);
  return res.json();
}

export async function fetchPortfolioStats(): Promise<PortfolioStats> {
  const res = await fetch(`${API_BASE}/api/portfolio`);
  if (!res.ok) throw new Error(`Fetch portfolio failed: ${res.statusText}`);
  return res.json();
}

export async function fetchModelInfo(): Promise<ModelTransparency> {
  const res = await fetch(`${API_BASE}/api/model`);
  if (!res.ok) throw new Error(`Fetch model info failed: ${res.statusText}`);
  return res.json();
}

export async function fetchAssessments(limit = 50, offset = 0, outcome?: string): Promise<{ total: number; items: AssessmentResponse[] }> {
  const url = new URL(`${API_BASE}/api/assessments`);
  url.searchParams.set("limit", limit.toString());
  url.searchParams.set("offset", offset.toString());
  if (outcome) url.searchParams.set("outcome", outcome);
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Fetch assessments failed: ${res.statusText}`);
  return res.json();
}

export async function fetchAssessmentById(id: string): Promise<AssessmentResponse> {
  const res = await fetch(`${API_BASE}/api/assessments/${id}`);
  if (!res.ok) throw new Error(`Assessment ${id} not found`);
  return res.json();
}

export async function deleteAssessment(id: string): Promise<{ deleted: boolean; id: string }> {
  const res = await fetch(`${API_BASE}/api/assessments/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error(`Delete failed: ${res.statusText}`);
  return res.json();
}

export async function uploadBatchFile(file: File): Promise<BatchScoreResponse> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${API_BASE}/api/batch`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) throw new Error(`Batch upload failed: ${res.statusText}`);
  return res.json();
}
