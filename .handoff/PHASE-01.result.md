# Phase 1 Result: Finance Core

Status: **All pass criteria met**. Date: 2026-11-01.

## Summary of Completed Work
- **F02 (`calc_emi`)**: Exact amortization formula implemented with half-up rounding to whole rupees. Golden cases `calc_emi(10_00_000, 10.0, 120) == 13_215` and `calc_emi(5_00_000, 0.0, 50) == 10_000` pass. Monotonicity and amortization balance bounds proved across 100 Hypothesis executions.
- **F03 (`calc_foir`)**: Implemented Fixed Obligation to Income Ratio with 50% haircut on other income. Monotonicity and formula identity proved across 100 Hypothesis executions.
- **F11 (`indicative_rate`)**: Base rates for 5 loan types + grade spreads (A: 0.0, B: 0.75, C: 1.75, D: 3.25, E: None) mapped on a 0.05 grid. Proved across 100 Hypothesis executions.
- **F12 (`max_eligible_amount`)**: Regulatory 55% FOIR cap and loan-type/collateral caps implemented. Rounded down to nearest 1,000 rupees. Proved across 100 Hypothesis executions.
- **F21 (`lib/format.ts`)**: `formatINR`, `formatINRShort`, `parseINR`, `inrToWords`, and `formatPct`. Proved across 300 fast-check executions.

## Ledger Excerpt
```
| F02 calc_emi | SPEC §F02 | 101 | 101 | 0 | PASS |
| F03 calc_foir | SPEC §F03 | 101 | 101 | 0 | PASS |
| F11 indicative_rate | SPEC §F11 | 101 | 101 | 0 | PASS |
| F12 max_eligible_amount | SPEC §F12 | 101 | 101 | 0 | PASS |
| F21 web formatting (lib/format.ts) | SPEC §F21 | 300 | 300 | 0 | PASS |
| F25 quality gate: no emoji | SPEC §F25 | 200 | 200 | 0 | PASS |
```

## Pass Criteria Status
1. `uv run --project services/api pytest`: 19 passed.
2. `pnpm --filter @saakh/web test`: 16 passed.
3. `node scripts/check_no_emoji.mjs`: 0 emoji found, exit 0.
4. `python scripts/test_ledger.py`: 6 PASS, 0 failed.
