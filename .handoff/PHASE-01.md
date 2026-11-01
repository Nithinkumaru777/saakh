# Phase 1: Finance Core

## Goal
Implement the core mathematical and financial calculation functions in Python (`services/api/ml/finance.py`) for EMI, FOIR, indicative interest rates, and maximum eligible loan amounts, and the Indian currency formatting suite in TypeScript (`apps/web/lib/format.ts`). Every function must achieve ≥ 100 executions and 0 failures in the test ledger.

---

## Function Cards & Design Sections
- **SPEC §F02**: `calc_emi(principal: int, annual_rate_pct: float, months: int) -> int`
- **SPEC §F03**: `calc_foir(monthly_income: int, other_income: int, existing_emi: int, new_emi: int) -> float`
- **SPEC §F11**: `indicative_rate(loan_type: str, grade: str) -> float | None`
- **SPEC §F12**: `max_eligible_amount(app: dict | ApplicationIn, rate: float) -> int`
- **SPEC §F21**: Web formatting in `apps/web/lib/format.ts` (`formatINR`, `formatINRShort`, `parseINR`, `inrToWords`, `formatPct`)
- **DESIGN §0 (Rule 5)**: Indian money formatting everywhere (`en-IN` locale, `₹12,50,000`, `₹12.5 L`, `₹1.2 Cr`)

---

## Step-by-Step Build Order

1. **Python Finance Module (`services/api/ml/finance.py`)**:
   - `calc_emi(principal: int, annual_rate_pct: float, months: int) -> int`:
     - Monthly rate $r = \frac{\text{annual\_rate\_pct}}{12 \times 100}$.
     - If $r == 0$: return `int(round(principal / months))`
     - Else: $\text{EMI} = \text{principal} \times \frac{r \times (1+r)^n}{(1+r)^n - 1}$ where $n = \text{months}$.
     - Round half-up to whole rupees (using `decimal.Decimal` with `ROUND_HALF_UP` or `math.floor(val + 0.5)`).
     - Golden tests: `calc_emi(10_00_000, 10, 120) == 13_215`; `calc_emi(5_00_000, 0, 50) == 10_000`.

   - `calc_foir(monthly_income: int, other_income: int, existing_emi: int, new_emi: int) -> float`:
     - `total_income = monthly_income + 0.5 * other_income`
     - If `total_income <= 0`: return `1.0` (or `float('inf')` if appropriate, but standard cap)
     - `foir = (existing_emi + new_emi) / total_income`
     - Return `round(foir, 4)`.

   - `indicative_rate(loan_type: str, grade: str) -> float | None`:
     - `base_rates = {"home": 8.50, "auto": 9.25, "education": 9.75, "personal": 11.50, "business": 13.00}`
     - `spreads = {"A": 0.0, "B": 0.75, "C": 1.75, "D": 3.25}`
     - If `grade not in spreads` or `grade == "E"`: return `None`
     - `rate = base_rates[loan_type.lower()] + spreads[grade]`
     - Return `round(round(rate * 20) / 20, 2)` (round to nearest 0.05).

   - `max_eligible_amount(monthly_income: int, other_income: int, existing_emi: int, tenure_months: int, loan_type: str, rate: float, collateral_value: int = 0) -> int`:
     - `total_income = monthly_income + 0.5 * other_income`
     - `max_emi = 0.55 * total_income - existing_emi`
     - If `max_emi <= 0` or `rate <= 0`: return `0`
     - $r = \frac{\text{rate}}{12 \times 100}$; $n = \text{tenure\_months}$.
     - $p\_foir = \max\_emi \times \frac{(1+r)^n - 1}{r \times (1+r)^n}$
     - Caps by loan type:
       - `home`: `min(10_00_00_000, int(0.80 * collateral_value))` if collateral provided else `10_00_00_000`
       - `auto`: `min(1_00_00_000, int(0.85 * collateral_value))` if collateral provided else `1_00_00_000`
       - `personal`: `40_00_000`
       - `education`: `1_50_00_000`
       - `business`: `2_00_00_000`
     - `eligible = min(p_foir, cap)`
     - Result = `math.floor(max(0, eligible) / 1000) * 1000`.

2. **Python Hypothesis Tests (`services/api/tests/test_finance.py`)**:
   - Decorated with `@counts("F02")`:
     - Test `calc_emi` with Hypothesis `@settings(max_examples=100)`.
     - Properties: EMI > 0; EMI * n >= principal; increasing in rate; decreasing in months; `r=0` exact; amortising the loan for n months leaves |balance| < n.
     - Golden assertions for `calc_emi(1000000, 10, 120) == 13215` and `calc_emi(500000, 0, 50) == 10000`.
   - Decorated with `@counts("F03")`:
     - Test `calc_foir` with Hypothesis `@settings(max_examples=100)`.
     - Properties: foir >= 0; increasing in EMIs; decreasing in income; matches hand calculation.
   - Decorated with `@counts("F11")`:
     - Test `indicative_rate` with Hypothesis `@settings(max_examples=100)`.
     - Properties: worse grade is never cheaper; result always on 0.05 grid; grade E / invalid returns None.
   - Decorated with `@counts("F12")`:
     - Test `max_eligible_amount` with Hypothesis `@settings(max_examples=100)`.
     - Properties: `calc_emi(result, rate, n) <= max_emi + 1`; never exceeds loan type or collateral caps; returns 0 if existing_emi >= 0.55 * total_income; increasing with income.

3. **Web Formatting Module (`apps/web/lib/format.ts`)**:
   - `formatINR(amount: number): string`:
     - Indian number formatting with `₹` prefix, e.g., `formatINR(1250000) === "₹12,50,000"`.
     - Handles negative numbers and 0 cleanly.
   - `formatINRShort(amount: number): string`:
     - For >= 1,00,00,000: `₹X.X Cr` (e.g. `₹1.2 Cr`)
     - For >= 1,00,000: `₹X.X L` (e.g. `₹12.5 L`)
     - For >= 1,000: `₹X K` or standard Indian formatting
     - Avoid trailing `.0` if exact (e.g. `₹12 L`).
   - `parseINR(str: string): number`:
     - Strips `₹`, `,`, spaces and parses integer/float. `parseINR("₹12,50,000") === 1250000`.
   - `inrToWords(amount: number): string`:
     - Returns words in Indian numbering system: Crores, Lakhs, Thousands, Hundreds, Rupees.
     - E.g., `inrToWords(1250000) === "Twelve lakh fifty thousand rupees"`.
     - Capitalized sentence case, handles zero: "Zero rupees".
   - `formatPct(val: number, decimals: number = 1): string`:
     - `formatPct(0.041) === "4.1 %"` (space before `%` per spec).

4. **Web Fast-Check Tests (`apps/web/tests/format.test.ts`)**:
   - Uses `countRuns("F21", ...)`:
     - 100 fast-check runs proving:
       - `parseINR(formatINR(n)) === n` for random positive integers.
       - Regex check for `formatINR(n)` against `^₹\d{1,2}(,\d{2})*(,\d{3})?$` for $n \ge 1000$.
       - `inrToWords` produces non-empty string ending in "rupees" for 100 random amounts.
       - `formatPct` formats decimals cleanly with space before `%`.

---

## Pass Criteria
1. `uv run --project services/api pytest` passes all tests.
2. `pnpm --filter @saakh/web test` passes all tests.
3. `node scripts/check_no_emoji.mjs` exits with code 0.
4. `python scripts/test_ledger.py` runs and verifies that **F02, F03, F11, F12, and F21 all show PASS** with $\ge 100$ executions and 0 failures.
5. Write `.handoff/PHASE-01.result.md`.
