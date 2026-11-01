/**
 * Indian currency and financial formatting utilities.
 * SPEC §F21 & DESIGN §0 (Rule 5).
 */

const ONES = [
  "",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
  "eleven",
  "twelve",
  "thirteen",
  "fourteen",
  "fifteen",
  "sixteen",
  "seventeen",
  "eighteen",
  "nineteen",
];

const TENS = [
  "",
  "",
  "twenty",
  "thirty",
  "forty",
  "fifty",
  "sixty",
  "seventy",
  "eighty",
  "ninety",
];

function twoDigitsToWords(n: number): string {
  if (n < 20) return ONES[n];
  const ten = Math.floor(n / 10);
  const one = n % 10;
  return one > 0 ? `${TENS[ten]} ${ONES[one]}` : TENS[ten];
}

function threeDigitsToWords(n: number): string {
  const hundred = Math.floor(n / 100);
  const rest = n % 100;
  const hundredPart = hundred > 0 ? `${ONES[hundred]} hundred` : "";
  const restPart = rest > 0 ? twoDigitsToWords(rest) : "";
  if (hundredPart && restPart) return `${hundredPart} ${restPart}`;
  return hundredPart || restPart;
}

/**
 * Format a number as Indian currency with symbol and grouping (e.g. ₹12,50,000).
 */
export function formatINR(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) return "₹0";
  const isNegative = amount < 0;
  const abs = Math.round(Math.abs(amount));
  const s = abs.toString();

  if (s.length <= 3) {
    return `${isNegative ? "-" : ""}₹${s}`;
  }

  const lastThree = s.slice(-3);
  const rest = s.slice(0, -3);

  // Group pairs of digits
  const parts: string[] = [];
  let remaining = rest;
  while (remaining.length > 2) {
    parts.unshift(remaining.slice(-2));
    remaining = remaining.slice(0, -2);
  }
  if (remaining.length > 0) {
    parts.unshift(remaining);
  }

  const formatted = `${parts.join(",")},${lastThree}`;
  return `${isNegative ? "-" : ""}₹${formatted}`;
}

/**
 * Format a number into short Indian financial notation (e.g. ₹12.5 L, ₹1.2 Cr).
 */
export function formatINRShort(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) return "₹0";
  const isNegative = amount < 0;
  const abs = Math.abs(amount);
  const prefix = isNegative ? "-₹" : "₹";

  if (abs >= 1_00_00_000) {
    const cr = abs / 1_00_00_000;
    let formatted = cr >= 10 ? cr.toFixed(1) : cr.toFixed(2);
    formatted = formatted.replace(/\.?0+$/, "");
    return `${prefix}${formatted} Cr`;
  }

  if (abs >= 1_00_000) {
    const l = abs / 1_00_000;
    let formatted = l >= 10 ? l.toFixed(1) : l.toFixed(2);
    formatted = formatted.replace(/\.?0+$/, "");
    return `${prefix}${formatted} L`;
  }

  return formatINR(amount);
}

/**
 * Parse an Indian currency formatted string back to an integer.
 */
export function parseINR(str: string): number {
  if (!str) return 0;
  const cleaned = str.replace(/[₹,\s]/g, "");
  const num = parseInt(cleaned, 10);
  return isNaN(num) ? 0 : num;
}

/**
 * Convert an amount in Rupees into plain English words using the Indian numbering system.
 * e.g. 1250000 -> "Twelve lakh fifty thousand rupees"
 */
export function inrToWords(amount: number): string {
  const abs = Math.floor(Math.abs(amount));
  if (abs === 0) return "Zero rupees";

  const crore = Math.floor(abs / 1_00_00_000);
  let rem = abs % 1_00_00_000;

  const lakh = Math.floor(rem / 1_00_000);
  rem = rem % 1_00_000;

  const thousand = Math.floor(rem / 1_000);
  rem = rem % 1_000;

  const rest = rem;

  const parts: string[] = [];
  if (crore > 0) parts.push(`${twoDigitsToWords(crore)} crore`);
  if (lakh > 0) parts.push(`${twoDigitsToWords(lakh)} lakh`);
  if (thousand > 0) parts.push(`${twoDigitsToWords(thousand)} thousand`);
  if (rest > 0) parts.push(threeDigitsToWords(rest));

  const text = parts.join(" ") + " rupees";
  // Capitalize first letter
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * Format a probability / decimal as a percentage with a space before the % sign.
 * e.g. formatPct(0.041) -> "4.1 %"
 */
export function formatPct(val: number, decimals: number = 1): string {
  if (isNaN(val) || val === null || val === undefined) return "0.0 %";
  const pct = val * 100;
  return `${pct.toFixed(decimals)} %`;
}
