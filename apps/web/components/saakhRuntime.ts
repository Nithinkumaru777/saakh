/* eslint-disable @typescript-eslint/no-explicit-any */
import { pauseTutorials, renderTutorials } from "./tutorial/tutorials";

export function initSaakhRuntime(
  initialView?: string,
  onDownloadPdf?: (app: any, res: any, id?: string, dateStr?: string) => Promise<void>
) {
  if (typeof window === "undefined") return;
  const w = window as any;
  if (w.__saakhInited) {
    if (initialView && (!location.hash || location.hash === "#home")) {
      location.hash = initialView;
    }
    w.__saakhRoute && w.__saakhRoute();
    return;
  }
  w.__saakhInited = true;

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  /* ---------------- auth core (token + authenticated fetch) ---------------- */
  const TOKEN_KEY = "saakh-token";
  let AUTH_USER: any = null;
  let sessionLoaded = false;
  let RETURN_TO = "";
  const getToken = () => { try { return localStorage.getItem(TOKEN_KEY) || ""; } catch { return ""; } };
  const setToken = (t: string) => { try { if (t) localStorage.setItem(TOKEN_KEY, t); else localStorage.removeItem(TOKEN_KEY); } catch {} };
  function apiFetch(url: string, init: RequestInit = {}) {
    const t = getToken();
    const headers: Record<string, string> = { ...((init.headers as Record<string, string>) || {}) };
    if (t) headers.Authorization = `Bearer ${t}`;
    return fetch(url, { ...init, headers }).then((r) => {
      // Only if this token is still the current one: an answer to an older request says nothing about a later session or sign-out.
      if (r.status === 401 && t && getToken() === t) signOut(true);
      return r;
    });
  }
  const esc = (v: any) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" } as Record<string, string>)[c]);

  const ICONS: Record<string, string> = {
    "file-check": '<path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z" /> <path d="M14 2v5a1 1 0 0 0 1 1h5" /> <path d="m9 15 2 2 4-4" />',
    "sliders-horizontal": '<path d="M10 5H3" /> <path d="M12 19H3" /> <path d="M14 3v4" /> <path d="M16 17v4" /> <path d="M21 12h-9" /> <path d="M21 19h-5" /> <path d="M21 5h-7" /> <path d="M8 10v4" /> <path d="M8 12H3" />',
    "users": '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /> <path d="M16 3.128a4 4 0 0 1 0 7.744" /> <path d="M22 21v-2a4 4 0 0 0-3-3.87" /> <circle cx="9" cy="7" r="4" />',
    "cloud-upload": '<path d="M12 13v8" /> <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" /> <path d="m8 17 4-4 4 4" />',
    "chart-column-increasing": '<path d="M13 17V9" /> <path d="M18 17V5" /> <path d="M3 3v16a2 2 0 0 0 2 2h16" /> <path d="M8 17v-3" />',
    "brain": '<path d="M12 18V5" /> <path d="M15 13a4.17 4.17 0 01-3-4 4.17 4.17 0 01-3 4" /> <path d="M17.707 6.294A3 3 0 1012 5a3 3 0 10-5.707 1.294" /> <path d="M17.996 5.125a4 4 0 012.526 5.77" /> <path d="M18 18a4 4 0 002-7.465" /> <path d="M19.967 17.482a4 4 0 11-7.967.517 4 4 0 11-7.967-.517" /> <path d="M6 18a4 4 0 01-2-7.465" /> <path d="M6.004 5.125a4 4 0 00-2.526 5.77" />',
    "circle-help": '<circle cx="12" cy="12" r="10" /> <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /> <path d="M12 17h.01" />',
    "gauge": '<path d="m12 14 4-4" /> <path d="M3.34 19a10 10 0 1 1 17.32 0" />',
    "stamp": '<path d="M14 13V8.5C14 7 15 7 15 5a3 3 0 0 0-6 0c0 2 1 2 1 3.5V13" /> <path d="M20 15.5a2.5 2.5 0 0 0-2.5-2.5h-11A2.5 2.5 0 0 0 4 15.5V17a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1z" /> <path d="M5 22h14" />',
    "circle-check": '<circle cx="12" cy="12" r="10" /> <path d="m16 9-5.5 5.5L8 12" />',
    "badge-alert": '<path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z" /> <line x1="12" x2="12" y1="8" y2="12" /> <line x1="12" x2="12.01" y1="16" y2="16" />',
    "ban": '<circle cx="12" cy="12" r="10" /> <path d="M4.929 4.929 19.07 19.071" />',
    "gavel": '<path d="m14 13-8.381 8.38a1 1 0 0 1-3.001-3l8.384-8.381" /> <path d="m16 16 6-6" /> <path d="m21.5 10.5-8-8" /> <path d="m8 8 6-6" /> <path d="m8.5 7.5 8 8" />',
    "indian-rupee": '<path d="m14 20-8-8h4c5.333 0 5.333-8 0-8" /> <path d="M6 4h12" /> <path d="M6 8h12" />',
    "receipt-indian-rupee": '<path d="M4 3a1 1 0 0 1 1-1 1.3 1.3 0 0 1 .7.2l.933.6a1.3 1.3 0 0 0 1.4 0l.934-.6a1.3 1.3 0 0 1 1.4 0l.933.6a1.3 1.3 0 0 0 1.4 0l.933-.6a1.3 1.3 0 0 1 1.4 0l.934.6a1.3 1.3 0 0 0 1.4 0l.933-.6A1.3 1.3 0 0 1 19 2a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1 1.3 1.3 0 0 1-.7-.2l-.933-.6a1.3 1.3 0 0 0-1.4 0l-.934.6a1.3 1.3 0 0 1-1.4 0l-.933-.6a1.3 1.3 0 0 0-1.4 0l-.933.6a1.3 1.3 0 0 1-1.4 0l-.934-.6a1.3 1.3 0 0 0-1.4 0l-.933.6a1.3 1.3 0 0 1-.7.2 1 1 0 0 1-1-1z" /> <path d="M8 11h8" /> <path d="M8 7h8" /> <path d="M9 7a4 4 0 0 1 0 8H8l3 2" />',
    "hand-coins": '<path d="M11 15h2a2 2 0 1 0 0-4h-3c-.6 0-1.1.2-1.4.6L3 17" /> <path d="m7 21 1.6-1.4c.3-.4.8-.6 1.4-.6h4c1.1 0 2.1-.4 2.8-1.2l4.6-4.4a2 2 0 0 0-2.75-2.91l-4.2 3.9" /> <path d="m2 16 6 6" /> <circle cx="16" cy="9" r="2.9" /> <circle cx="6" cy="5" r="3" />',
    "credit-card": '<rect width="20" height="14" x="2" y="5" rx="2" /> <line x1="2" x2="22" y1="10" y2="10" /> <path d="M6 14h2" />',
    "briefcase-business": '<path d="M12 12h.01" /> <path d="M16 6V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" /> <path d="M22 13a18.15 18.15 0 0 1-20 0" /> <rect width="20" height="14" x="2" y="6" rx="2" />',
    "id-card": '<path d="M13 19a4 4 0 00-8 0" /> <path d="M16 10h2" /> <path d="M16 14h2" /> <circle cx="9" cy="12" r="3" /> <rect x="2" y="5" width="20" height="14" rx="2" />',
    "house": '<path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8" /> <path d="M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />',
    "car": '<path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" /> <circle cx="7" cy="17" r="2" /> <path d="M9 17h6" /> <circle cx="17" cy="17" r="2" />',
    "graduation-cap": '<path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z" /> <path d="M22 10v6" /> <path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5" />',
    "wallet": '<path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1" /> <path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4" />',
    "trending-up": '<path d="M16 7h6v6" /> <path d="m22 7-8.5 8.5-5-5L2 17" />',
    "trending-down": '<path d="M16 17h6v-6" /> <path d="m22 17-8.5-8.5-5 5L2 7" />',
    "sparkles": '<path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z" /> <path d="M20 2v4" /> <path d="M22 4h-4" /> <circle cx="4" cy="20" r="2" />',
    "history": '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /> <path d="M3 3v5h5" /> <path d="M12 7v5l4 2" />',
    "download": '<path d="M12 15V3" /> <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /> <path d="m7 10 5 5 5-5" />',
    "upload": '<path d="M12 3v12" /> <path d="m17 8-5-5-5 5" /> <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />',
    "search": '<path d="m21 21-4.34-4.34" /> <circle cx="11" cy="11" r="8" />',
    "sun": '<circle cx="12" cy="12" r="4" /> <path d="M12 2v2" /> <path d="M12 20v2" /> <path d="m4.93 4.93 1.41 1.41" /> <path d="m17.66 17.66 1.41 1.41" /> <path d="M2 12h2" /> <path d="M20 12h2" /> <path d="m6.34 17.66-1.41 1.41" /> <path d="m19.07 4.93-1.41 1.41" />',
    "moon": '<path d="M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401" />',
    "keyboard": '<path d="M10 8h.01" /> <path d="M12 12h.01" /> <path d="M14 8h.01" /> <path d="M16 12h.01" /> <path d="M18 8h.01" /> <path d="M6 8h.01" /> <path d="M7 16h10" /> <path d="M8 12h.01" /> <rect width="20" height="16" x="2" y="4" rx="2" />',
    "copy": '<rect width="14" height="14" x="8" y="8" rx="2" ry="2" /> <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />',
    "refresh-cw": '<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" /> <path d="M21 3v5h-5" /> <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" /> <path d="M8 16H3v5" />',
    "play": '<path d="M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z" />',
    "loader-circle": '<path d="M21 12a9 9 0 1 1-6.219-8.56" />',
    "check": '<path d="M20 6 9 17l-5-5" />',
    "x": '<path d="M18 6 6 18" /> <path d="m6 6 12 12" />',
    "workflow": '<rect width="8" height="8" x="3" y="3" rx="2" /> <path d="M7 11v4a2 2 0 0 0 2 2h4" /> <rect width="8" height="8" x="13" y="13" rx="2" />',
    "chart-scatter": '<circle cx="7.5" cy="7.5" r=".5" fill="currentColor" /> <circle cx="18.5" cy="5.5" r=".5" fill="currentColor" /> <circle cx="11.5" cy="11.5" r=".5" fill="currentColor" /> <circle cx="7.5" cy="16.5" r=".5" fill="currentColor" /> <circle cx="17.5" cy="14.5" r=".5" fill="currentColor" /> <path d="M3 3v16a2 2 0 0 0 2 2h16" />',
    "palette": '<path d="M12 22a1 1 0 0 1 0-20 10 9 0 0 1 10 9 5 5 0 0 1-5 5h-2.25a1.75 1.75 0 0 0-1.4 2.8l.3.4a1.75 1.75 0 0 1-1.4 2.8z" /> <circle cx="13.5" cy="6.5" r=".5" fill="currentColor" /> <circle cx="17.5" cy="10.5" r=".5" fill="currentColor" /> <circle cx="6.5" cy="12.5" r=".5" fill="currentColor" /> <circle cx="8.5" cy="7.5" r=".5" fill="currentColor" />',
    "sun-moon": '<path d="M12 2v2" /> <path d="M14.837 16.385a6 6 0 1 1-7.223-7.222c.624-.147.97.66.715 1.248a4 4 0 0 0 5.26 5.259c.589-.255 1.396.09 1.248.715" /> <path d="M16 12a4 4 0 0 0-4-4" /> <path d="m19 5-1.256 1.256" /> <path d="M20 12h2" />',
    "command": '<path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3" />',
    "arrow-left": '<path d="m12 19-7-7 7-7" /> <path d="M19 12H5" />',
    "chevron-right": '<path d="m9 18 6-6-6-6" />',
    "menu": '<path d="M4 5h16" /> <path d="M4 12h16" /> <path d="M4 19h16" />',
    "layers": '<path d="M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z" /> <path d="M2 12a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 12" /> <path d="M2 17a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 17" />',
  };

  function iconSvg(name: string, opts: any = {}) {
    const inner = (ICONS[name] || "").replace(/<(path|circle|rect|line|polyline|polygon|ellipse)\b/g, '<$1 pathLength="1"');
    const sz = opts.s ? " s" + opts.s : "";
    return `<svg class="ic${sz}${opts.cls ? " " + opts.cls : ""}" viewBox="0 0 24 24" aria-hidden="true"${opts.a ? ` data-a="${opts.a}"` : ""}>${inner}</svg>`;
  }
  function hydrateIcons(root: ParentNode = document) {
    root.querySelectorAll("[data-icon]").forEach((el: any) => {
      const html = iconSvg(el.dataset.icon, { a: el.dataset.a, s: el.dataset.s, cls: el.dataset.cls });
      if (el.tagName === "I") {
        el.outerHTML = html;
      } else {
        el.innerHTML = html;
        el.removeAttribute("data-icon");
      }
    });
  }

  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const SPR: Record<string, { k: number; c: number; m: number }> = {
    snappy: { k: 420, c: 32, m: 1 },
    gentle: { k: 180, c: 24, m: 1 },
    marker: { k: 260, c: 20, m: 1 },
    stamp: { k: 650, c: 20, m: 1.3 },
  };
  function springEase(p: { k: number; c: number; m: number }) {
    const dt = 1 / 240;
    let x = 0, v = 0, t = 0;
    const pts: number[] = [];
    while (t < 3) {
      const a = (-p.k * (x - 1) - p.c * v) / p.m;
      v += a * dt;
      x += v * dt;
      t += dt;
      pts.push(x);
      if (t > 0.25 && Math.abs(x - 1) < 0.0008 && Math.abs(v) < 0.01) break;
    }
    const n = pts.length, step = Math.max(1, Math.floor(n / 60));
    const out = [0];
    for (let i = step; i < n; i += step) out.push(+pts[i].toFixed(4));
    out.push(1);
    return { easing: `linear(${out.join(",")})`, duration: Math.round(n * dt * 1000) };
  }
  const EASE: Record<string, { easing: string; duration: number }> = Object.fromEntries(
    Object.entries(SPR).map(([k, v]) => [k, springEase(v)])
  );
  function anim(el: any, frames: any[], spring?: any, extra: any = {}) {
    if (!el) return null;
    if (reduce) return el.animate(frames, { duration: 1, fill: "forwards" });
    const e = typeof spring === "string" ? EASE[spring] : { easing: spring?.easing || "cubic-bezier(.25,1,.5,1)", duration: spring?.duration || 320 };
    return el.animate(frames, { duration: e.duration, easing: e.easing, fill: "forwards", ...extra });
  }
  function moveTo(el: any, x: number, y: number, w: number, spring = "snappy") {
    const from = el._pos || { x, y, w };
    el._pos = { x, y, w };
    anim(
      el,
      [
        { transform: `translate(${from.x}px,${from.y}px)`, width: from.w + "px" },
        { transform: `translate(${x}px,${y}px)`, width: w + "px" },
      ],
      spring
    );
  }
  const sleep = (ms: number) => new Promise((r) => setTimeout(r, reduce ? 0 : ms));
  function tweenNumber(el: any, to: number, fmt: (v: number) => string, ms = 520) {
    if (!el) return;
    const from = el._v ?? to;
    el._v = to;
    if (reduce || from === to) {
      el.textContent = fmt(to);
      return;
    }
    const t0 = performance.now();
    const step = (now: number) => {
      const p = Math.min(1, (now - t0) / ms);
      const e = 1 - Math.pow(1 - p, 4);
      el.textContent = fmt(from + (to - from) * e);
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  const fmtINR = (n: number) => "₹" + Math.round(n).toLocaleString("en-IN");
  const fmtShort = (n: number) =>
    n >= 1e7
      ? "₹" + (n / 1e7).toFixed(n >= 1e8 ? 0 : 1).replace(/\.0$/, "") + " Cr"
      : n >= 1e5
      ? "₹" + (n / 1e5).toFixed(1).replace(/\.0$/, "") + " L"
      : fmtINR(n);
  const fmtPct = (x: number, d = 1) => (x * 100).toFixed(d) + "%";
  const parseINR = (s: any) => +String(s).replace(/[^\d]/g, "") || 0;
  function inrWords(n: number): string {
    n = Math.round(n);
    if (!n) return "";
    const a = ["", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];
    const b = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];
    const two = (x: number) => (x < 20 ? a[x] : b[Math.floor(x / 10)] + (x % 10 ? " " + a[x % 10] : ""));
    const three = (x: number) => (x >= 100 ? a[Math.floor(x / 100)] + " hundred" + (x % 100 ? " " : "") : "") + (x % 100 ? two(x % 100) : "");
    const parts: string[] = [];
    const cr = Math.floor(n / 1e7), l = Math.floor((n % 1e7) / 1e5), th = Math.floor((n % 1e5) / 1e3), r = n % 1e3;
    if (cr) parts.push((cr >= 1000 ? inrWords(cr).replace(/ rupees$/, "") : three(cr)) + " crore");
    if (l) parts.push(two(l) + " lakh");
    if (th) parts.push(two(th) + " thousand");
    if (r) parts.push(three(r));
    const s = parts.join(" ") + " rupees";
    return s[0].toUpperCase() + s.slice(1);
  }

  const BASE_RATE: Record<string, number> = { home: 8.5, auto: 9.25, education: 9.75, personal: 11.5, business: 13 };
  const SPREAD: Record<string, number> = { A: 0, B: 0.75, C: 1.75, D: 3.25 };
  const TYPE_MAX: Record<string, number> = { personal: 4e6, auto: 1e7, education: 1.5e7, business: 2e7, home: 1e8 };
  const TENURE: Record<string, [number, number]> = { personal: [6, 84], auto: [12, 96], education: [12, 180], business: [12, 120], home: [60, 360] };
  const BANDS = [0, 0.03, 0.07, 0.15, 0.3, 0.6];
  const GRADES = ["A", "B", "C", "D", "E"];
  const GLABEL: Record<string, string> = { A: "Low risk", B: "Low risk", C: "Moderate", D: "Elevated", E: "High" };
  const sigmoid = (z: number) => 1 / (1 + Math.exp(-z));
  function emi(P: number, rate: number, n: number) {
    const r = rate / 1200;
    if (!r) return P / n;
    const f = Math.pow(1 + r, n);
    return (P * r * f) / (f - 1);
  }
  function pvOfEmi(E: number, rate: number, n: number) {
    const r = rate / 1200;
    if (!r) return E * n;
    const f = Math.pow(1 + r, n);
    return (E * (f - 1)) / (r * f);
  }
  function feats(a: any) {
    const ti = a.monthly_income + 0.5 * a.other_monthly_income;
    const ref = BASE_RATE[a.loan_type] + 1;
    const ne = emi(a.loan_amount, ref, a.tenure_months);
    const secured = (a.loan_type === "home" || a.loan_type === "auto") && a.collateral_value > 0;
    const ltv = a.collateral_value > 0 ? a.loan_amount / a.collateral_value : null;
    return {
      ti,
      ref,
      ne,
      foir: (a.existing_emi + ne) / ti,
      lti: a.loan_amount / (12 * ti),
      ltv,
      secured,
      dti: (a.outstanding_debt + a.loan_amount) / (12 * ti),
      ageMat: a.age + a.tenure_months / 12,
      noHist: a.cibil_score === -1,
      cib: a.cibil_score === -1 ? 650 : a.cibil_score,
    };
  }
  const TERMS: Array<[string, string, (a: any, f: any) => number]> = [
    ["cibil", "credit-card", (_a, f) => 0.011 * (720 - f.cib)],
    ["nohist", "id-card", (_a, f) => 0.6 * (f.noHist ? 1 : 0)],
    ["foir", "hand-coins", (_a, f) => 3.0 * (f.foir - 0.35)],
    ["util", "credit-card", (a) => 0.016 * (a.credit_utilisation_pct - 30)],
    ["missed", "badge-alert", (a) => 0.32 * a.missed_payments_24m],
    ["enq", "search", (a) => 0.1 * a.enquiries_6m],
    ["job", "briefcase-business", (a) => -0.035 * Math.min(a.years_in_job, 10)],
    ["hist", "history", (a) => -0.025 * Math.min(a.credit_history_years, 15)],
    ["emp", "id-card", (a) => 0.25 * (a.employment_type !== "salaried" ? 1 : 0)],
    ["lti", "indian-rupee", (_a, f) => 0.35 * Math.max(0, f.lti - 3)],
    ["def", "ban", (a) => 1.1 * (a.past_default ? 1 : 0)],
    ["dep", "users", (a) => 0.08 * a.dependents],
    ["res", "house", (a) => -0.15 * (a.residence === "owned" ? 1 : 0)],
    ["ltv", "car", (_a, f) => (f.secured && f.ltv !== null ? 0.4 * Math.max(0, f.ltv - 0.8) : 0)],
  ];
  const REF_APP: any = {
    monthly_income: 60000,
    other_monthly_income: 0,
    cibil_score: 720,
    credit_history_years: 6,
    credit_utilisation_pct: 30,
    missed_payments_24m: 0,
    enquiries_6m: 1,
    years_in_job: 4,
    employment_type: "salaried",
    past_default: false,
    dependents: 1,
    residence: "rented",
    existing_emi: 6000,
    outstanding_debt: 200000,
    loan_type: "personal",
    loan_amount: 500000,
    tenure_months: 48,
    collateral_value: 0,
    age: 32,
  };
  function labelFor(key: string, a: any, f: any) {
    switch (key) {
      case "cibil": return f.noHist ? "No CIBIL score yet" : "CIBIL score " + a.cibil_score;
      case "nohist": return "New to credit";
      case "foir": return "EMIs take " + Math.round(f.foir * 100) + "% of income";
      case "util": return "Card limit used " + Math.round(a.credit_utilisation_pct) + "%";
      case "missed": return a.missed_payments_24m + " missed payment" + (a.missed_payments_24m === 1 ? "" : "s");
      case "enq": return a.enquiries_6m + " recent enquir" + (a.enquiries_6m === 1 ? "y" : "ies");
      case "job": return a.years_in_job + " years in job";
      case "hist": return a.credit_history_years + " years of credit history";
      case "emp": return a.employment_type === "salaried" ? "Salaried income" : "Self-employed income";
      case "lti": return "Loan is " + f.lti.toFixed(1) + "x annual income";
      case "def": return a.past_default ? "Previous default" : "No previous default";
      case "dep": return a.dependents + " dependent" + (a.dependents === 1 ? "" : "s");
      case "res": return a.residence === "owned" ? "Owns a home" : "Does not own a home";
      case "ltv": return "Loan is " + Math.round((f.ltv || 0) * 100) + "% of asset value";
      default: return key;
    }
  }
  function sentenceFor(key: string, dir: string, a: any, f: any) {
    const up = dir === "raises";
    switch (key) {
      case "cibil": return f.noHist ? "With no CIBIL history yet, the model treats repayment behaviour as unknown." : up ? `A CIBIL score of ${a.cibil_score} is below the 720 that most lenders look for.` : `A CIBIL score of ${a.cibil_score} shows a strong repayment record.`;
      case "foir": return up ? `Your EMIs would take ${Math.round(f.foir * 100)}% of your monthly income. Lenders prefer under 40%.` : `Your EMIs would take only ${Math.round(f.foir * 100)}% of your monthly income, leaving room to repay.`;
      case "util": return up ? `You are using ${Math.round(a.credit_utilisation_pct)}% of your card limits. Keeping it under 30% lowers risk.` : `Using ${Math.round(a.credit_utilisation_pct)}% of card limits signals careful borrowing.`;
      case "missed": return `${a.missed_payments_24m} missed payment${a.missed_payments_24m === 1 ? "" : "s"} in two years raise the chance of another.`;
      case "enq": return up ? `${a.enquiries_6m} credit enquiries in six months can mean you are seeking credit from many lenders.` : `Few recent enquiries suggest no urgent need for credit.`;
      case "job": return `${a.years_in_job} years in the current job or business points to steady income.`;
      case "hist": return `${a.credit_history_years} years of credit history gives the model more evidence of repayment.`;
      case "lti": return `The loan is ${f.lti.toFixed(1)} times annual income; above 3 times, risk climbs.`;
      case "def": return "A previous default is the strongest single warning sign.";
      default: return labelFor(key, a, f) + (up ? " adds a little risk." : " lowers risk a little.");
    }
  }
  function gradeOf(pd: number) {
    for (let i = 1; i < BANDS.length - 1; i++) if (pd < BANDS[i]) return GRADES[i - 1];
    return "E";
  }
  function policy(a: any, f: any) {
    const K: Array<[string, string]> = [], R: Array<[string, string]> = [];
    if (a.age < 21) K.push(["K1", "Applicants must be at least 21."]);
    const lim = a.employment_type === "salaried" ? 65 : 70;
    if (f.ageMat > lim) {
      const mx = Math.max(0, Math.floor((lim - a.age) * 12));
      K.push(["K2", `The loan would end after age ${lim}. Choose a tenure of at most ${mx} months.`]);
    }
    if (a.cibil_score >= 300 && a.cibil_score < 600) K.push(["K3", `CIBIL score ${a.cibil_score} is below the minimum of 600.`]);
    if (f.foir > 0.65) K.push(["K4", `EMIs would take ${Math.round(f.foir * 100)}% of income; the limit is 65%.`]);
    if (f.ltv !== null && ((a.loan_type === "home" && f.ltv > 0.9) || (a.loan_type === "auto" && f.ltv > 0.85)))
      K.push(["K5", `Loan is ${Math.round(f.ltv * 100)}% of the asset value; the limit is ${a.loan_type === "home" ? 90 : 85}%.`]);
    if (a.existing_emi / f.ti >= 0.55) K.push(["K6", `Existing EMIs already use ${Math.round((a.existing_emi / f.ti) * 100)}% of income.`]);
    if (a.past_default) R.push(["R1", "A previous default needs a manual review."]);
    if (a.missed_payments_24m >= 3) R.push(["R2", `${a.missed_payments_24m} missed payments in 24 months need a manual review.`]);
    if (f.noHist && a.loan_amount > 500000) R.push(["R3", "New to credit and asking for more than ₹5,00,000."]);
    if (f.foir > 0.55 && f.foir <= 0.65) R.push(["R4", `EMIs would take ${Math.round(f.foir * 100)}% of income, above the 55% comfort limit.`]);
    return { K, R };
  }
  function shortReason(code: string) {
    return ({
      K1: "applicant under 21",
      K2: "loan ends past the age limit",
      K3: "CIBIL score below 600",
      K4: "EMIs above 65% of income",
      K5: "loan too large for the asset value",
      K6: "existing EMIs use too much income",
    } as Record<string, string>)[code];
  }
  function score(a: any, withCf = false): any {
    const f = feats(a);
    const z0 = -2.9;
    const contrib = TERMS.map(([k, ic, fn]) => [k, ic, fn(a, f)] as [string, string, number]);
    const z = z0 + contrib.reduce((s, c) => s + c[2], 0);
    const pd = sigmoid(z);
    const fr = feats(REF_APP);
    const factors = contrib
      .map(([k, ic, v]) => {
        const vr = TERMS.find((t) => t[0] === k)![2](REF_APP, fr);
        const d = v - vr;
        const pp = 100 * (pd - sigmoid(z - d));
        return { k, ic, pp };
      })
      .filter((x) => Math.abs(x.pp) > 0.05)
      .sort((x, y) => Math.abs(y.pp) - Math.abs(x.pp))
      .slice(0, 6)
      .map((x) => ({
        ...x,
        dir: x.pp > 0 ? "raises" : "lowers",
        label: labelFor(x.k, a, f),
        sentence: sentenceFor(x.k, x.pp > 0 ? "raises" : "lowers", a, f),
      }));
    const grade = gradeOf(pd);
    const { K, R } = policy(a, f);
    let outcome: string, headline: string;
    if (K.length) {
      outcome = "DECLINED";
      headline = "Declined: " + shortReason(K[0][0]);
    } else if (grade === "E") {
      outcome = "DECLINED";
      headline = "Declined: risk " + fmtPct(pd);
    } else if (R.length || grade === "C" || grade === "D") {
      outcome = "REFER";
      headline = "Refer for review, grade " + grade;
    } else {
      outcome = "SANCTIONED";
      headline = "Sanctioned at grade " + grade;
    }
    const rate = outcome === "DECLINED" ? null : Math.round((BASE_RATE[a.loan_type] + SPREAD[grade]) * 20) / 20;
    const useRate = rate ?? f.ref;
    const E = emi(a.loan_amount, useRate, a.tenure_months);
    const maxEmi = Math.max(0, 0.55 * f.ti - a.existing_emi);
    let mx = pvOfEmi(maxEmi, useRate, a.tenure_months);
    if (a.loan_type === "home" && a.collateral_value > 0) mx = Math.min(mx, 0.8 * a.collateral_value);
    if (a.loan_type === "auto" && a.collateral_value > 0) mx = Math.min(mx, 0.85 * a.collateral_value);
    mx = Math.floor(Math.min(mx, TYPE_MAX[a.loan_type]) / 1000) * 1000;
    const res: any = { pd, grade, outcome, headline, rate, emi: E, foir: (a.existing_emi + E) / f.ti, maxAmt: mx, factors, K, R, f };
    if (withCf) res.cf = counterfactuals(a, res);
    return res;
  }
  function counterfactuals(a: any, res: any) {
    const gi = GRADES.indexOf(res.grade);
    if (!res.K.length && gi === 0) return [];
    const ok = (r: any) => (res.K.length ? r.K.length === 0 && r.grade !== "E" : r.K.length === 0 && GRADES.indexOf(r.grade) <= gi - 1);
    const out: any[] = [];
    const tryLever = (lever: string, gen: () => Generator<[any, number]>, say: (v: any, r: any) => string) => {
      for (const [val, rel] of gen()) {
        const b = { ...a, ...val };
        const r = score(b);
        if (ok(r)) {
          out.push({ lever, rel, patch: val, r, sentence: say(val, r) });
          return;
        }
      }
    };
    const tmax = TENURE[a.loan_type][1];
    tryLever(
      "loan_amount",
      function* () {
        for (let p = 0.05; p <= 0.601; p += 0.05) yield [{ loan_amount: Math.round((a.loan_amount * (1 - p)) / 1000) * 1000 }, p];
      },
      (v, r) => `Reduce the loan to ${fmtINR(v.loan_amount)} to reach grade ${r.grade} (risk ${fmtPct(r.pd)}).`
    );
    tryLever(
      "tenure_months",
      function* () {
        for (let t = a.tenure_months + 12; t <= tmax; t += 12) yield [{ tenure_months: t }, (t - a.tenure_months) / a.tenure_months];
      },
      (v, r) => `Extend the tenure to ${v.tenure_months} months to reach grade ${r.grade} (risk ${fmtPct(r.pd)}).`
    );
    if (a.credit_utilisation_pct > 10)
      tryLever(
        "credit_utilisation_pct",
        function* () {
          for (let u = a.credit_utilisation_pct - 5; u >= 10; u -= 5) yield [{ credit_utilisation_pct: u }, (a.credit_utilisation_pct - u) / 100];
        },
        (v, r) => `Bring card usage down to ${v.credit_utilisation_pct}% of the limit to reach grade ${r.grade} (risk ${fmtPct(r.pd)}).`
      );
    if (a.existing_emi > 0)
      tryLever(
        "existing_emi",
        function* () {
          for (let p = 0.1; p <= 1.001; p += 0.1) yield [{ existing_emi: Math.round(a.existing_emi * (1 - p)) }, p];
        },
        (v, r) => `Prepay loans so existing EMIs fall to ${fmtINR(v.existing_emi)} to reach grade ${r.grade} (risk ${fmtPct(r.pd)}).`
      );
    tryLever(
      "co_applicant",
      function* () {
        for (let p = 0.1; p <= 1.001; p += 0.1) yield [{ other_monthly_income: a.other_monthly_income + a.monthly_income * p * 2 }, p];
      },
      (v, r) => `Add a co-applicant earning ${fmtINR((v.other_monthly_income - a.other_monthly_income) / 2)} a month to reach grade ${r.grade} (risk ${fmtPct(r.pd)}).`
    );
    return out.sort((x, y) => x.rel - y.rel).slice(0, 3);
  }

  /* ====================================================================
     REAL FASTAPI + XGBOOST + TREESHAP BRIDGE
  ==================================================================== */
  const FEATURE_ICONS: Record<string, string> = {
    cibil_score: "credit-card",
    cibil_filled: "credit-card",
    no_credit_history: "id-card",
    foir: "hand-coins",
    credit_utilisation_pct: "credit-card",
    missed_payments_24m: "badge-alert",
    enquiries_6m: "search",
    years_in_job: "briefcase-business",
    credit_history_years: "history",
    employment_type: "id-card",
    emp_salaried: "id-card",
    emp_self_employed: "briefcase-business",
    emp_business_owner: "hand-coins",
    lti: "indian-rupee",
    dti: "indian-rupee",
    past_default: "ban",
    dependents: "users",
    residence: "house",
    res_owned: "house",
    ltv: "car",
    ltv_filled: "car",
  };

  function cleanPayload(a: any) {
    const b = safeApp(a);
    const isHomeOrAuto = b.loan_type === "home" || b.loan_type === "auto";
    const [tmin, tmax] = TENURE[b.loan_type] || [6, 84];
    const maxAmt = TYPE_MAX[b.loan_type] || 4000000;
    const age = Math.min(75, Math.max(18, Math.round(+b.age || 32)));
    const cibil = b.cibil_score === -1 ? -1 : Math.min(900, Math.max(300, Math.round(+b.cibil_score || 720)));
    return {
      full_name: (b.full_name && /^[A-Za-z .'-]{2,80}$/.test(String(b.full_name).trim())) ? String(b.full_name).trim() : "Applicant",
      age,
      employment_type: ["salaried", "self_employed", "business_owner"].includes(b.employment_type) ? b.employment_type : "salaried",
      years_in_job: Math.min(Math.max(0, age - 16), Math.max(0, +b.years_in_job || 0)),
      city_tier: [1, 2, 3].includes(+b.city_tier) ? +b.city_tier : 1,
      dependents: Math.min(6, Math.max(0, Math.round(+b.dependents || 0))),
      residence: ["owned", "rented", "family"].includes(b.residence) ? b.residence : "rented",
      monthly_income: Math.min(5000000, Math.max(10000, Math.round(+b.monthly_income || 60000))),
      other_monthly_income: Math.min(2000000, Math.max(0, Math.round(+b.other_monthly_income || 0))),
      cibil_score: cibil,
      credit_history_years: cibil === -1 ? 0 : Math.min(40, Math.max(0, +b.credit_history_years || 0)),
      open_credit_lines: Math.min(30, Math.max(0, Math.round(+b.open_credit_lines || 0))),
      credit_utilisation_pct: Math.min(100, Math.max(0, +b.credit_utilisation_pct || 0)),
      missed_payments_24m: Math.min(24, Math.max(0, Math.round(+b.missed_payments_24m || 0))),
      enquiries_6m: Math.min(20, Math.max(0, Math.round(+b.enquiries_6m || 0))),
      past_default: Boolean(b.past_default),
      existing_emi: Math.min(2000000, Math.max(0, Math.round(+b.existing_emi || 0))),
      outstanding_debt: Math.min(50000000, Math.max(0, Math.round(+b.outstanding_debt || 0))),
      loan_type: ["home", "auto", "personal", "education", "business"].includes(b.loan_type) ? b.loan_type : "personal",
      loan_amount: Math.min(maxAmt, Math.max(10000, Math.round(+b.loan_amount || 500000))),
      tenure_months: Math.min(tmax, Math.max(tmin, Math.round(+b.tenure_months || tmin))),
      collateral_value: isHomeOrAuto ? Math.max(100000, Math.round(+b.collateral_value || Math.round((+b.loan_amount || 500000) * 1.25))) : Math.max(0, Math.round(+b.collateral_value || 0)),
      purpose: String(b.purpose || "").slice(0, 200),
    };
  }

  function mapApiAssessment(apiRes: any, origApp: any) {
    const f = feats(origApp);
    if (apiRes.features) {
      f.foir = apiRes.features.foir;
      f.lti = apiRes.features.lti;
      f.ltv = apiRes.features.ltv;
      f.dti = apiRes.features.dti;
      f.ti = apiRes.features.total_income;
      f.ref = apiRes.features.reference_rate;
      f.ne = apiRes.features.new_emi_ref;
      f.ageMat = apiRes.features.age_at_maturity;
      f.noHist = apiRes.features.no_credit_history;
    }
    const factors = (apiRes.factors || []).map((x: any) => ({
      k: x.feature,
      ic: FEATURE_ICONS[x.feature] || "sparkles",
      pp: x.contribution_pp,
      dir: x.direction,
      label: x.label,
      sentence: x.sentence,
    }));
    const K: Array<[string, string]> = (apiRes.knockouts || []).map((k: any) => [k.code, k.message]);
    const R: Array<[string, string]> = (apiRes.flags || []).map((fl: any) => [fl.code, fl.message]);
    const cf = (apiRes.counterfactuals || []).map((c: any) => {
      const patchKey = c.lever === "co_applicant" ? "other_monthly_income" : c.lever;
      return {
        lever: c.lever,
        rel: c.relative_change,
        patch: { [patchKey]: c.to },
        r: { grade: c.new_grade, pd: c.new_pd },
        sentence: c.sentence,
      };
    });
    return {
      id: apiRes.id,
      created_at: apiRes.created_at,
      pd: apiRes.pd,
      grade: apiRes.grade,
      outcome: apiRes.outcome,
      headline: apiRes.headline,
      rate: apiRes.indicative_rate,
      emi: apiRes.emi,
      foir: f.foir,
      maxAmt: apiRes.max_eligible_amount,
      factors: factors.length ? factors : score(origApp).factors,
      K,
      R,
      f,
      cf: cf.length ? cf : counterfactuals(origApp, { grade: apiRes.grade, K }),
      rawApi: apiRes,
    };
  }

  async function scoreViaBackend(a: any, withCf = false, persist = false): Promise<any> {
    try {
      const payload = cleanPayload(a);
      const endpoint = persist ? `${API_BASE}/api/assess` : `${API_BASE}/api/score`;
      const resp = await apiFetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      if (persist && data.id) OWN_SAVES.add(data.id); // live feed must not call our own save "another desk"
      const mapped: any = mapApiAssessment(data, a);
      mapped.saved = persist;
      if (withCf && (!data.counterfactuals || !data.counterfactuals.length)) {
        mapped.cf = counterfactuals(a, mapped);
      }
      return mapped;
    } catch {
      return score(a, withCf);
    }
  }

  function downloadFile(filename: string, content: string, mime = "text/csv;charset=utf-8;") {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  /* ====================================================================
     SAMPLE DATA: personas (SPEC F22) + seeded synthetic applicants
  ==================================================================== */
  const base: any = {
    other_monthly_income: 0,
    open_credit_lines: 3,
    missed_payments_24m: 0,
    past_default: false,
    outstanding_debt: 0,
    collateral_value: 0,
    purpose: "",
    city_tier: 1,
    dependents: 0,
    residence: "rented",
    enquiries_6m: 1,
  };
  const PERSONAS: any[] = [
    { ...base, full_name: "Ananya Rao", age: 29, employment_type: "salaried", years_in_job: 6, monthly_income: 145000, cibil_score: 791, credit_history_years: 7, credit_utilisation_pct: 18, existing_emi: 0, loan_type: "personal", loan_amount: 600000, tenure_months: 36, purpose: "Home renovation", note: "Salaried engineer, Bengaluru" },
    { ...base, full_name: "Rahul Mehta", age: 41, employment_type: "salaried", years_in_job: 12, monthly_income: 95000, cibil_score: 742, credit_history_years: 11, credit_utilisation_pct: 25, enquiries_6m: 2, existing_emi: 3000, outstanding_debt: 90000, dependents: 2, loan_type: "home", loan_amount: 4500000, tenure_months: 240, collateral_value: 6200000, purpose: "Flat in Pune", note: "Salaried, Pune" },
    { ...base, full_name: "Fatima Shaikh", age: 34, employment_type: "self_employed", years_in_job: 6, monthly_income: 70000, cibil_score: 701, credit_history_years: 8, credit_utilisation_pct: 68, missed_payments_24m: 1, enquiries_6m: 3, existing_emi: 4000, outstanding_debt: 150000, dependents: 1, loan_type: "business", loan_amount: 1200000, tenure_months: 60, purpose: "Second boutique outlet", note: "Boutique owner, Hyderabad" },
    { ...base, full_name: "Karthik Iyer", age: 26, employment_type: "salaried", years_in_job: 3, monthly_income: 48000, cibil_score: -1, credit_history_years: 0, credit_utilisation_pct: 0, open_credit_lines: 0, enquiries_6m: 2, existing_emi: 0, loan_type: "auto", loan_amount: 750000, tenure_months: 60, collateral_value: 920000, purpose: "First car", note: "New to credit, Chennai" },
    { ...base, full_name: "Priya Nair", age: 38, employment_type: "salaried", years_in_job: 10, monthly_income: 62000, cibil_score: 748, credit_history_years: 12, credit_utilisation_pct: 45, existing_emi: 8000, outstanding_debt: 240000, dependents: 2, residence: "owned", city_tier: 2, loan_type: "education", loan_amount: 1500000, tenure_months: 120, purpose: "Daughter’s engineering degree", note: "Teacher, Kochi" },
    { ...base, full_name: "Vikram Singh", age: 52, employment_type: "business_owner", years_in_job: 18, monthly_income: 210000, cibil_score: 655, credit_history_years: 20, credit_utilisation_pct: 52, missed_payments_24m: 4, enquiries_6m: 2, existing_emi: 22000, outstanding_debt: 1100000, dependents: 3, residence: "owned", city_tier: 2, loan_type: "home", loan_amount: 8000000, tenure_months: 240, collateral_value: 11500000, purpose: "Villa in Jaipur", note: "Business owner, Jaipur" },
    { ...base, full_name: "Sneha Kulkarni", age: 31, employment_type: "salaried", years_in_job: 5, monthly_income: 55000, cibil_score: 712, credit_history_years: 6, credit_utilisation_pct: 61, enquiries_6m: 4, existing_emi: 31000, outstanding_debt: 900000, loan_type: "personal", loan_amount: 800000, tenure_months: 48, purpose: "Wedding", note: "Salaried, Mumbai" },
    { ...base, full_name: "Arjun Das", age: 45, employment_type: "salaried", years_in_job: 15, monthly_income: 120000, cibil_score: 812, credit_history_years: 18, credit_utilisation_pct: 12, enquiries_6m: 0, existing_emi: 5000, outstanding_debt: 120000, dependents: 2, residence: "owned", loan_type: "auto", loan_amount: 1400000, tenure_months: 60, collateral_value: 1700000, purpose: "Family SUV", note: "Salaried, Kolkata" },
  ];
  function rng(seed: number) {
    return function () {
      seed |= 0;
      seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function gauss(r: () => number) {
    let u = 0, v = 0;
    while (!u) u = r();
    while (!v) v = r();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }
  const FIRST = ["Aarav", "Diya", "Rohan", "Meera", "Sameer", "Kavya", "Imran", "Nisha", "Aditya", "Pooja", "Harish", "Lakshmi", "Varun", "Sana", "Gaurav", "Ritika", "Manoj", "Divya", "Faizan", "Shreya", "Naveen", "Anjali", "Deepak", "Tanvi"];
  const LAST = ["Sharma", "Reddy", "Patel", "Menon", "Gupta", "Khan", "Joshi", "Pillai", "Bose", "Hegde", "Verma", "Naidu", "Chopra", "Mishra", "Rao", "Desai", "Kapoor", "Banerjee", "Shetty", "Agarwal"];
  function genApp(r: () => number, _i: number) {
    const types = ["personal", "personal", "personal", "home", "home", "auto", "auto", "education", "business", "personal"];
    const lt = types[Math.floor(r() * types.length)];
    const inc = Math.round(Math.min(5e6, Math.max(12000, Math.exp(Math.log(55000) + 0.6 * gauss(r)))) / 500) * 500;
    const nh = r() < 0.06;
    const cib = nh ? -1 : Math.round(Math.min(900, Math.max(300, 720 + 70 * gauss(r))));
    const emp = r() < 0.7 ? "salaried" : r() < 0.67 ? "self_employed" : "business_owner";
    const [tmin, tmax] = TENURE[lt];
    const ten = Math.round((tmin + r() * (tmax - tmin)) / 12) * 12 || tmin;
    const mult = ({ personal: 8, home: 45, auto: 12, education: 18, business: 16 } as Record<string, number>)[lt];
    const amt = Math.round(Math.min(TYPE_MAX[lt], inc * mult * (0.4 + r() * 0.9)) / 10000) * 10000;
    const age = Math.round(23 + r() * 30);
    const a: any = {
      ...base,
      full_name: FIRST[Math.floor(r() * FIRST.length)] + " " + LAST[Math.floor(r() * LAST.length)],
      age,
      employment_type: emp,
      years_in_job: Math.max(0, Math.min(age - 18, Math.round(r() * 14))),
      monthly_income: inc,
      cibil_score: cib,
      credit_history_years: nh ? 0 : Math.round(1 + r() * 14),
      credit_utilisation_pct: Math.round((100 * (r() + r())) / 2.4),
      missed_payments_24m: r() < 0.75 ? 0 : Math.ceil(r() * 4),
      enquiries_6m: Math.floor(r() * 4),
      past_default: r() < 0.04,
      existing_emi: r() < 0.5 ? 0 : Math.round((inc * r() * 0.35) / 500) * 500,
      outstanding_debt: Math.round((r() * inc * 12) / 10000) * 10000,
      dependents: Math.floor(r() * 4),
      residence: r() < 0.35 ? "owned" : r() < 0.7 ? "rented" : "family",
      city_tier: 1 + Math.floor(r() * 3),
      loan_type: lt,
      loan_amount: Math.max(50000, amt),
      tenure_months: ten,
      collateral_value: 0,
    };
    if (lt === "home" || lt === "auto") a.collateral_value = Math.round(a.loan_amount / (0.55 + r() * 0.4) / 10000) * 10000;
    return a;
  }

  const today = new Date();
  let HISTORY: any[] = [];
  (function seed() {
    const r = rng(42);
    PERSONAS.forEach((p, i) => {
      const s = score(p, true);
      HISTORY.push({ id: "p" + i, app: p, res: s, date: new Date(+today - (i + 1) * 86400000 * 0.6) });
    });
    for (let i = 0; i < 120; i++) {
      const a = genApp(r, i);
      HISTORY.push({ id: "g" + i, app: a, res: score(a), date: new Date(+today - (10 + i * 1.3) * 86400000) });
    }
  })();

  async function syncBackendHistory() {
    let replaced = false;
    try {
      // ponytail: loads at most 1,000 records into the browser; page through the API if a book ever outgrows that.
      const items: any[] = [];
      for (let p = 1; p <= 10; p++) {
        if (!getToken()) return; // signed out, perhaps mid-load: the endpoint requires sign-in, so asking only logs a 401
        const resp = await apiFetch(`${API_BASE}/api/assessments?page=${p}&page_size=100`);
        if (!resp.ok) return;
        const data = await resp.json();
        if (!Array.isArray(data.items) || !data.items.length) break;
        items.push(...data.items);
        if (data.items.length < 100) break;
      }
      if (items.length > 0) {
        const dbItems = items.map((item: any) => ({
          id: item.id,
          app: item.application,
          res: mapApiAssessment(item, item.application),
          date: item.created_at ? new Date(item.created_at) : new Date(),
        }));
        const existingIds = new Set(dbItems.map((d: any) => d.id));
        // The server is the record: the browser's offline sample rows (p0.., g0..) would duplicate its seed data.
        HISTORY = [...dbItems, ...HISTORY.filter((h) => !existingIds.has(h.id) && !/^[pg]\d+$/.test(h.id))];
        portDrawn = false;
        replaced = true;
      }
    } catch {
      // Fallback to seeded history if offline
    }
    if (!replaced) return;
    // Rows on screen may name ids that no longer exist, and clicking one of those would do nothing.
    const view = (document.querySelector(".view.on") as HTMLElement | null)?.dataset.view;
    if (view === "applicants" && !document.getElementById("appList")?.hidden) renderTable();
    if (view === "portfolio") drawPortfolio();
  }
  syncBackendHistory();

  /* ---------------------------------------------------------------------------------------
     LIVE FEED (GET /api/events): assessments saved or deleted at another desk show up in
     Applicants and Portfolio without a reload. Bursts (batch save) collapse into one sync.
     --------------------------------------------------------------------------------------- */
  const LIVE_LABEL: Record<string, string> = { live: "Live", connecting: "Reconnecting", offline: "Offline" };
  function setLive(state: "live" | "connecting" | "offline") {
    const el = document.getElementById("liveFeed");
    if (!el) return;
    el.dataset.state = state;
    const t = el.querySelector(".txt");
    if (t) t.textContent = LIVE_LABEL[state];
  }
  let livePending: string[] = [];
  let liveTimer = 0;
  // Ids this browser saved via /api/assess. The local row is added to HISTORY only after the stamp
  // animation (~1 s), so without this every own save would toast as "another desk".
  const OWN_SAVES = new Set<string>();
  function refreshLive() {
    clearTimeout(liveTimer);
    liveTimer = window.setTimeout(async () => {
      // "unknown id after 250 ms and not saved by us" = another desk.
      const known = new Set(HISTORY.map((h) => h.id));
      const remote = livePending.filter((id) => !known.has(id) && !OWN_SAVES.has(id)).length;
      livePending = [];
      await syncBackendHistory();
      if (remote > 0) toast(remote === 1 ? "New assessment from another desk" : `${remote} new assessments from other desks`);
    }, 250);
  }
  if (typeof EventSource === "undefined") {
    setLive("offline");
  } else {
    const es = new EventSource(`${API_BASE}/api/events`);
    let everConnected = false;
    es.addEventListener("ready", () => {
      if (everConnected) refreshLive(); // events sent while we were offline were missed
      everConnected = true;
      setLive("live");
    });
    es.addEventListener("change", (msg) => {
      let e: { kind?: string; ids?: unknown };
      try {
        e = JSON.parse((msg as MessageEvent<string>).data);
      } catch {
        return;
      }
      const ids = Array.isArray(e.ids) ? e.ids.filter((x): x is string => typeof x === "string") : [];
      if (e.kind === "assessment.deleted") {
        const gone = new Set(ids);
        HISTORY = HISTORY.filter((h) => !gone.has(h.id));
      } else if (e.kind === "assessment.created") {
        livePending.push(...ids);
      } else {
        return;
      }
      refreshLive();
    });
    es.onerror = () => setLive(es.readyState === EventSource.CLOSED ? "offline" : "connecting");
  }

  const fmtDate = (d: Date) => (d instanceof Date && !isNaN(+d) ? d : new Date()).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

  function pdToPos(pd: number) {
    let i = 0;
    while (i < 4 && pd >= BANDS[i + 1]) i++;
    const fr = Math.min(1, Math.max(0, (pd - BANDS[i]) / (BANDS[i + 1] - BANDS[i])));
    return (i + fr) / 5;
  }

  class Ruler {
    el: HTMLElement;
    m: HTMLElement;
    x = 0;
    v = 0;
    t = 0;
    raf = 0;
    constructor(el: HTMLElement) {
      this.el = el;
      el.classList.add("ruler");
      el.setAttribute("role", "img");
      el.innerHTML = `<div class="rbands">${GRADES.map((g) => `<span style="--g:var(--g${g})">${g}</span>`).join("")}</div><div class="rticks"><i style="left:0">0%</i>${["3%", "7%", "15%", "30%"].map((t, i) => `<i style="left:${(i + 1) * 20}%">${t}</i>`).join("")}<i style="left:100%">60%+</i></div><div class="rmark"></div>`;
      this.m = el.querySelector(".rmark") as HTMLElement;
      this.draw();
    }
    draw() {
      this.m.style.left = (Math.max(0, Math.min(1, this.x)) * 100).toFixed(3) + "%";
    }
    jump(pd: number, label?: string) {
      this.x = this.t = pdToPos(pd);
      this.v = 0;
      this.draw();
      if (label) this.el.setAttribute("aria-label", label);
    }
    set(pd: number, label?: string) {
      this.t = pdToPos(pd);
      if (label) this.el.setAttribute("aria-label", label);
      if (reduce) {
        this.x = this.t;
        this.v = 0;
        this.draw();
        return;
      }
      if (this.raf) return;
      let last = performance.now();
      const tick = (now: number) => {
        const dt = Math.min(0.032, (now - last) / 1000);
        last = now;
        const { k, c, m } = SPR.marker;
        for (let s = 0; s < 4; s++) {
          const a = (-k * (this.x - this.t) - c * this.v) / m;
          this.v += (a * dt) / 4;
          this.x += (this.v * dt) / 4;
        }
        this.draw();
        if (Math.abs(this.x - this.t) < 0.0004 && Math.abs(this.v) < 0.0004) {
          this.x = this.t;
          this.draw();
          this.raf = 0;
          return;
        }
        this.raf = requestAnimationFrame(tick);
      };
      this.raf = requestAnimationFrame(tick);
    }
  }

  function setGradeChip(el: any, grade: string, _big?: boolean) {
    if (!el) return;
    const label = GLABEL[grade];
    el.style.setProperty("--g", `var(--g${grade})`);
    const cur = el.querySelector(".gl span:last-child");
    if (!cur) {
      el.innerHTML = `<span class="gl"><span>${grade}</span></span><span class="gtx">${label}</span>`;
      el.dataset.g = grade;
      return;
    }
    if (el.dataset.g === grade) return;
    el.dataset.g = grade;
    el.querySelector(".gtx").textContent = label;
    const gl = el.querySelector(".gl");
    const n = document.createElement("span");
    n.textContent = grade;
    if (reduce) {
      gl.innerHTML = "";
      gl.appendChild(n);
      return;
    }
    gl.querySelectorAll("span").forEach((s: any) => {
      s.animate(
        [
          { transform: "none", opacity: 1 },
          { transform: "translateY(-100%)", opacity: 0 },
        ],
        { duration: 200, easing: "cubic-bezier(.25,1,.5,1)", fill: "forwards" }
      ).onfinish = () => s.remove();
    });
    gl.appendChild(n);
    n.animate(
      [
        { transform: "translateY(100%)", opacity: 0 },
        { transform: "none", opacity: 1 },
      ],
      { duration: 200, easing: "cubic-bezier(.25,1,.5,1)" }
    );
  }
  const OUTICON: Record<string, string> = { SANCTIONED: "circle-check", REFER: "badge-alert", DECLINED: "ban" };
  const OUTWORD: Record<string, string> = { SANCTIONED: "Sanctioned", REFER: "Refer", DECLINED: "Declined" };
  const chipOutcome = (o: string) => `<span class="chip ${o}">${iconSvg(OUTICON[o] || "circle-check", { s: 16 })}${OUTWORD[o] || o}</span>`;
  const chipGrade = (g: string) => `<span class="gchip" style="--g:var(--g${g})"><span class="gl"><span>${g}</span></span>${GLABEL[g]}</span>`;

  function toast(msg: string, kind = "ok") {
    const box = document.getElementById("toasts");
    if (!box) return;
    const t = document.createElement("div");
    t.className = "toast " + kind;
    t.innerHTML = iconSvg(kind === "ok" ? "check" : "x") + `<span>${esc(msg)}</span>`;
    box.appendChild(t);
    const all = document.querySelectorAll(".toast:not(.out)");
    if (all.length > 3) all[0].remove();
    setTimeout(() => {
      t.classList.add("out");
      setTimeout(() => t.remove(), 220);
    }, 4000);
  }

  function segInit(seg: any, onChange?: (v: string) => void) {
    if (!seg) return;
    const ind = seg.querySelector(".seg-ind");
    const place = (btn: any, inst?: boolean) => {
      if (!btn || !btn.offsetWidth) return;
      const x = btn.offsetLeft - 3;
      if (inst || !ind._pos) {
        ind._pos = { x, y: 0, w: btn.offsetWidth };
        ind.style.transform = `translate(${x}px,0)`;
        ind.style.width = btn.offsetWidth + "px";
      } else moveTo(ind, x, 0, btn.offsetWidth, "snappy");
    };
    seg._set = (v: string, inst?: boolean) => {
      seg.querySelectorAll("button").forEach((b: any) => b.setAttribute("aria-pressed", String(b.dataset.v === v)));
      place(seg.querySelector(`button[data-v="${v}"]`), inst);
    };
    seg._place = () => {
      const b = seg.querySelector('button[aria-pressed="true"]');
      if (b) {
        ind._pos = null;
        place(b, true);
      }
    };
    seg.addEventListener("click", (e: any) => {
      const b = e.target.closest("button");
      if (!b) return;
      seg._set(b.dataset.v);
      onChange && onChange(b.dataset.v);
    });
    const pre = seg.querySelector('button[aria-pressed="true"]') || seg.querySelector("button");
    if (pre) seg._set(pre.dataset.v, true);
  }
  function rangeInit(wrap: any, fmt?: (v: number) => string) {
    const inp = wrap.querySelector("input"), bub = wrap.querySelector(".bub");
    const upd = () => {
      const p = ((inp.value - inp.min) / (inp.max - inp.min)) * 100;
      wrap.style.setProperty("--p", p + "%");
      inp.style.setProperty("--p", p + "%");
      if (bub) bub.textContent = fmt ? fmt(+inp.value) : inp.value;
    };
    inp.addEventListener("input", upd);
    upd();
    wrap._upd = upd;
  }

  function moneyInit(inp: any) {
    if (!inp) return;
    const words = document.querySelector(`[data-words="${inp.id}"]`);
    const fmt = () => {
      const n = parseINR(inp.value);
      if (words) words.textContent = n ? inrWords(n) : "";
    };
    inp.addEventListener("input", () => {
      const pos = inp.selectionStart || 0;
      const digitsBefore = inp.value.slice(0, pos).replace(/\D/g, "").length;
      const n = parseINR(inp.value);
      inp.value = n ? n.toLocaleString("en-IN") : "";
      let i = 0, c = 0;
      while (i < inp.value.length && c < digitsBefore) {
        if (/\d/.test(inp.value[i])) c++;
        i++;
      }
      try { inp.setSelectionRange(i, i); } catch {}
      fmt();
    });
    inp._fmt = () => {
      const n = parseINR(inp.value);
      inp.value = n ? n.toLocaleString("en-IN") : "";
      fmt();
    };
    inp._fmt();
  }

  async function btnRun(btn: any, work: () => Promise<void>, label?: string) {
    if (btn.classList.contains("loading")) return;
    btn.style.width = btn.offsetWidth + "px";
    btn.classList.add("loading");
    btn.setAttribute("aria-busy", "true");
    await work();
    btn.classList.remove("loading");
    btn.classList.add("success");
    btn.setAttribute("aria-busy", "false");
    await sleep(1600);
    btn.classList.remove("success");
    btn.style.width = "";
    if (label) {
      const l = btn.querySelector(".lbl");
      if (l) l.textContent = label;
    }
  }
  function holdInit(btn: any, onDone: () => void) {
    if (!btn) return;
    const fill = btn.querySelector(".fill");
    let a: any = null, done = false;
    const start = (e: any) => {
      e.preventDefault();
      done = false;
      btn.classList.add("filling");
      a = fill.animate([{ transform: "scaleX(0)" }, { transform: "scaleX(1)" }], { duration: reduce ? 1 : 800, easing: "linear", fill: "forwards" });
      a.onfinish = () => {
        done = true;
        btn.classList.add("done");
        setTimeout(() => {
          btn.classList.remove("done", "filling");
          fill.animate([{ transform: "scaleX(1)" }, { transform: "scaleX(0)" }], { duration: 300, fill: "forwards" });
        }, 400);
        onDone();
      };
    };
    const stop = () => {
      if (!a || done) return;
      const p = a.effect.getComputedTiming().progress || 0;
      a.cancel();
      btn.classList.remove("filling");
      fill.animate([{ transform: `scaleX(${p})` }, { transform: "scaleX(0)" }], { duration: 200, easing: "cubic-bezier(.25,1,.5,1)", fill: "forwards" });
    };
    btn.addEventListener("pointerdown", start);
    btn.addEventListener("pointerup", stop);
    btn.addEventListener("pointerleave", stop);
    btn.addEventListener("keydown", (e: any) => {
      if ((e.key === " " || e.key === "Enter") && !e.repeat) start(e);
    });
    btn.addEventListener("keyup", (e: any) => {
      if (e.key === " " || e.key === "Enter") stop();
    });
  }

  function safeApp(a: any) {
    const b = { ...a };
    for (const k in REF_APP) {
      if (typeof REF_APP[k] === "number" && !Number.isFinite(b[k])) b[k] = REF_APP[k];
    }
    if (!b.monthly_income || b.monthly_income < 1000) b.monthly_income = 1000;
    if (!b.tenure_months) b.tenure_months = 12;
    if (!b.loan_amount) b.loan_amount = 10000;
    return b;
  }

  /* ====================================================================
     ASSESS PAGE
  ==================================================================== */
  let FORM: any = { ...PERSONAS[0] };
  let step = 0;
  let maxStep = 0;
  let lastRun: any = null;
  let stamped = false;
  const STEPS = ["Applicant", "Income", "Credit and debts", "Loan request"];
  let mainDial: Ruler, wiDial: Ruler, heroRuler: Ruler;

  function renderStepper() {
    const s = document.getElementById("stepper");
    if (!s) return;
    let h = "";
    STEPS.forEach((n, i) => {
      const cls = i === step ? "cur" : i < maxStep || i < step ? "done" : "";
      h += `<button type="button" class="${cls}" data-go="${i}" ${i > maxStep ? "disabled" : ""} aria-current="${i === step ? "step" : "false"}" aria-label="Step ${i + 1}: ${n}"><span class="num">${i + 1}${iconSvg("check")}</span><span class="sl">${n}</span></button>`;
      if (i < 3) h += `<span class="conn ${i < maxStep ? "fill" : ""}"><i></i></span>`;
    });
    s.innerHTML = h;
  }
  function fillForm(a: any) {
    document.querySelectorAll("#stage [data-k]").forEach((el: any) => {
      const k = el.dataset.k;
      let v = a[k];
      if (k === "cibil_score" && v === -1) v = "";
      if ("money" in el.dataset) {
        el.value = v ? (+v).toLocaleString("en-IN") : "";
        el._fmt && el._fmt();
      } else el.value = v ?? "";
    });
    const ntc = document.getElementById("f_ntc") as HTMLInputElement;
    const cib = document.getElementById("f_cibil") as HTMLInputElement;
    const def = document.getElementById("f_def") as HTMLInputElement;
    if (ntc) ntc.checked = a.cibil_score === -1;
    if (cib) cib.disabled = a.cibil_score === -1;
    if (def) def.checked = !!a.past_default;
    ["employment_type", "residence", "loan_type"].forEach((k) => {
      const sg: any = document.querySelector(`[data-seg="${k}"]`);
      if (sg && sg._set) sg._set(a[k], true);
    });
    typeChanged(false);
  }
  function readForm() {
    const a: any = { ...FORM };
    document.querySelectorAll("#stage [data-k]").forEach((el: any) => {
      const k = el.dataset.k;
      if (k === "full_name" || k === "purpose") {
        a[k] = el.value;
        return;
      }
      // `data-money` is a bare attribute, so dataset.money is "" (falsy); test presence, not value.
      a[k] = "money" in el.dataset ? parseINR(el.value) : el.value === "" ? NaN : +el.value;
    });
    const ntc = document.getElementById("f_ntc") as HTMLInputElement;
    const def = document.getElementById("f_def") as HTMLInputElement;
    a.cibil_score = ntc?.checked ? -1 : a.cibil_score;
    if (a.cibil_score === -1) a.credit_history_years = 0;
    a.past_default = Boolean(def?.checked);
    ["employment_type", "residence", "loan_type"].forEach((k) => {
      const b: any = document.querySelector(`[data-seg="${k}"] button[aria-pressed="true"]`);
      if (b) a[k] = b.dataset.v;
    });
    return a;
  }
  function typeChanged(adjust = true) {
    const btn: any = document.querySelector('[data-seg="loan_type"] button[aria-pressed="true"]');
    if (!btn) return;
    const t = btn.dataset.v;
    const cf = document.getElementById("collField");
    if (cf) cf.style.display = t === "home" || t === "auto" ? "" : "none";
    const [a, b] = TENURE[t];
    const th = document.getElementById("tenHelp");
    if (th) th.textContent = `${a} to ${b} months for a ${t} loan`;
    if (adjust) {
      const tn = document.getElementById("f_ten") as HTMLInputElement;
      if (tn) {
        const v = +tn.value;
        if (!(v >= a && v <= b)) tn.value = String(Math.min(b, Math.max(a, v || a)));
      }
    }
  }
  function validateStep(i: number) {
    const a = readForm();
    const errs: Array<[string, string]> = [];
    const E = (id: string, msg: string) => errs.push([id, msg]);
    if (i === 0) {
      if (!/^[A-Za-z .'-]{2,80}$/.test((a.full_name || "").trim())) E("f_name", "Enter the full name using letters only.");
      if (!(a.age >= 18 && a.age <= 75)) E("f_age", "Enter an age between 18 and 75.");
      if (!(a.years_in_job >= 0 && a.years_in_job <= Math.max(0, a.age - 16))) E("f_job", `Enter 0 to ${Math.max(0, (a.age || 16) - 16)} years.`);
      if (!(a.dependents >= 0 && a.dependents <= 6)) E("f_dep", "Enter 0 to 6 dependents.");
    }
    if (i === 1) {
      if (!(a.monthly_income >= 10000 && a.monthly_income <= 5000000)) E("f_inc", "Enter a monthly income between ₹10,000 and ₹50,00,000.");
      if (!(a.other_monthly_income >= 0 && a.other_monthly_income <= 2000000)) E("f_oth", "Enter up to ₹20,00,000.");
    }
    if (i === 2) {
      if (a.cibil_score !== -1 && !(a.cibil_score >= 300 && a.cibil_score <= 900)) E("f_cibil", "Enter a score from 300 to 900, or turn on New to credit.");
      if (!(a.credit_utilisation_pct >= 0 && a.credit_utilisation_pct <= 100)) E("f_util", "Enter a percentage from 0 to 100.");
      if (!(a.credit_history_years >= 0 && a.credit_history_years <= 40)) E("f_hist", "Enter 0 to 40 years.");
    }
    if (i === 3) {
      const [tmin, tmax] = TENURE[a.loan_type];
      if (!(a.loan_amount >= 10000 && a.loan_amount <= TYPE_MAX[a.loan_type])) E("f_amt", `Enter ₹10,000 to ${fmtINR(TYPE_MAX[a.loan_type])} for a ${a.loan_type} loan.`);
      if (!(a.tenure_months >= tmin && a.tenure_months <= tmax)) E("f_ten", `Tenure for a ${a.loan_type} loan must be ${tmin} to ${tmax} months.`);
      if ((a.loan_type === "home" || a.loan_type === "auto") && !(a.collateral_value > 0)) E("f_col", "Enter the value of the home or vehicle.");
    }
    document.querySelectorAll(`.pane[data-step="${i}"] .field.err`).forEach((f) => f.classList.remove("err"));
    errs.forEach(([id, msg]) => {
      const f = document.getElementById(id)?.closest(".field") as HTMLElement;
      if (f) {
        const box = f.querySelector(".errmsg > div");
        if (box) box.innerHTML = iconSvg("x", { s: 16 }) + "<span>" + msg + "</span>";
        void f.offsetWidth;
        f.classList.add("err");
      }
    });
    if (errs.length) document.getElementById(errs[0][0])?.focus();
    return !errs.length;
  }
  function goStep(n: number) {
    if (n === step) return;
    const dir = n > step ? 1 : -1;
    const panes = document.querySelectorAll(".pane");
    const old = panes[step] as HTMLElement, nu = panes[n] as HTMLElement;
    const show = () => {
      old.classList.remove("on");
      nu.classList.add("on");
      nu.querySelectorAll(".seg").forEach((s: any) => s._place && s._place());
    };
    if (reduce) {
      show();
    } else {
      old.animate(
        [
          { transform: "none", opacity: 1 },
          { transform: `translateX(${-24 * dir}px)`, opacity: 0 },
        ],
        { duration: 160, easing: "cubic-bezier(.65,0,.35,1)" }
      ).onfinish = () => {
        show();
        nu.animate(
          [
            { transform: `translateX(${24 * dir}px)`, opacity: 0 },
            { transform: "none", opacity: 1 },
          ],
          { duration: 320, easing: "cubic-bezier(.25,1,.5,1)" }
        );
      };
    }
    step = n;
    maxStep = Math.max(maxStep, n);
    renderStepper();
    const bb = document.getElementById("backBtn") as HTMLButtonElement;
    if (bb) bb.disabled = step === 0;
    const nb = document.getElementById("nextBtn") as HTMLElement;
    if (nb) nb.style.visibility = step === 3 ? "hidden" : "visible";
  }
  function renderFactors(el: any, factors: any[], animate?: boolean) {
    if (!el) return;
    const max = Math.max(4, ...factors.map((f) => Math.abs(f.pp)));
    const rows = el.querySelectorAll(".fbar");
    if (rows.length !== factors.length || el.dataset.keys !== factors.map((f) => f.k).join()) {
      el.dataset.keys = factors.map((f) => f.k).join();
      el.innerHTML = factors
        .map(
          (f) =>
            `<div class="fbar ih" tabindex="0"><span class="fl">${iconSvg(f.ic, { s: 16, a: "pop" })}<span>${f.label}</span></span><span class="track"><span class="b ${f.dir === "raises" ? "hi" : "lo"}"></span></span><span class="pp">${f.pp > 0 ? "+" : "−"}${Math.abs(f.pp).toFixed(1)}</span><span class="tip" role="tooltip">${f.sentence}</span></div>`
        )
        .join("");
    } else {
      factors.forEach((f, i) => {
        const r = rows[i];
        r.querySelector(".fl span").textContent = f.label;
        const b = r.querySelector(".b");
        b.className = "b " + (f.dir === "raises" ? "hi" : "lo");
        r.querySelector(".pp").textContent = (f.pp > 0 ? "+" : "−") + Math.abs(f.pp).toFixed(1);
        r.querySelector(".tip").textContent = f.sentence;
      });
    }
    el.querySelectorAll(".fbar").forEach((r: any, i: number) => {
      const b = r.querySelector(".b");
      const w = (Math.abs(factors[i].pp) / max) * 50 + "%";
      if (animate && !reduce) {
        b.style.transition = "none";
        b.style.width = "0";
        void b.offsetWidth;
        setTimeout(() => {
          b.style.transition = "width .5s cubic-bezier(.25,1,.5,1)";
          b.style.width = w;
        }, i * 40);
      } else {
        b.style.width = w;
      }
    });
  }
  function paintSheet(res: any, { animateBars = false } = {}) {
    if (!mainDial) return;
    mainDial.set(res.pd, `Estimated default risk ${(res.pd * 100).toFixed(1)} percent, grade ${res.grade}`);
    tweenNumber(document.getElementById("pdVal"), res.pd * 100, (v) => v.toFixed(1) + "%");
    setGradeChip(document.getElementById("gradeChip"), res.grade, true);
    setGradeChip(document.getElementById("peekGrade"), res.grade);
    tweenNumber(document.getElementById("emiVal"), res.emi, fmtINR);
    const rv = document.getElementById("rateVal");
    if (rv) rv.textContent = res.rate ? `${res.rate.toFixed(2)}%` : "None";
    tweenNumber(document.getElementById("foirVal"), res.foir * 100, (v) => Math.round(v) + "%");
    tweenNumber(document.getElementById("maxVal"), res.maxAmt, fmtShort);
    const pt = document.getElementById("peekTxt");
    if (pt) pt.textContent = `Risk ${fmtPct(res.pd)}, EMI ${fmtINR(res.emi)}`;
    renderFactors(document.getElementById("fbars"), res.factors, animateBars);
    const rs = document.getElementById("reasons");
    if (rs) {
      const list = res.K.length ? res.K : res.R;
      if (list.length) {
        rs.className = "reasons on" + (res.K.length ? "" : " refer");
        rs.innerHTML = iconSvg(res.K.length ? "gavel" : "badge-alert", { s: 20 }) + "<div>" + list.map((x: any) => x[1]).join("<br>") + "</div>";
      } else rs.className = "reasons";
    }
  }
  let liveT: any = 0;
  function liveUpdate() {
    clearTimeout(liveT);
    liveT = setTimeout(async () => {
      FORM = readForm();
      const sApp = safeApp(FORM);
      const localRes = score(sApp);
      paintSheet(localRes);
      if (stamped) {
        liftStamp();
        document.getElementById("headline")?.classList.remove("on");
        document.getElementById("live")?.classList.remove("off");
        const pdfBtn = document.getElementById("shPdf");
        if (pdfBtn) pdfBtn.style.display = "none";
      }
      document.querySelectorAll("#fbars .fbar.mark").forEach((f) => f.classList.remove("mark"));
      const apiRes = await scoreViaBackend(sApp, false, false);
      if (!stamped) paintSheet(apiRes);
    }, 180);
  }
  function liftStamp() {
    const st = document.getElementById("stamp");
    stamped = false;
    anim(
      st,
      [
        { opacity: 0.92, transform: "rotate(-8deg) scale(1)" },
        { opacity: 0, transform: "rotate(-8deg) translateY(-12px) scale(1)" },
      ],
      { duration: 180 }
    );
  }
  function landStamp(st: any, outcome: string, date: string) {
    if (!st) return;
    st.className = "stamp " + outcome;
    st.querySelector("b").textContent = outcome;
    st.querySelector("small").textContent = date;
    anim(
      st,
      [
        { opacity: 0, transform: "rotate(-16deg) scale(2.2)", filter: "url(#inkTex) blur(6px)" },
        { opacity: 0.92, transform: "rotate(-8deg) scale(1)", filter: "url(#inkTex) blur(0px)" },
      ],
      "stamp"
    );
    const ring = st.querySelector(".inkring");
    setTimeout(() => {
      if (!reduce && ring)
        ring.animate(
          [
            { opacity: 0.5, transform: "scale(1)" },
            { opacity: 0, transform: "scale(1.12)" },
          ],
          { duration: 500, easing: "ease-out" }
        );
    }, reduce ? 0 : EASE.stamp.duration * 0.35);
  }
  async function runAssessment() {
    for (let i = 0; i < 4; i++) {
      if (!validateStep(i)) {
        if (i !== step) goStep(i);
        toast("Fix the highlighted field to continue", "bad");
        return;
      }
    }
    const btn = document.getElementById("runBtn")!;
    const sheet = document.getElementById("asheet")!;
    if (window.innerWidth < 768) sheet.classList.add("open");
    await btnRun(
      btn,
      async () => {
        if (stamped) {
          liftStamp();
          await sleep(180);
        }
        document.getElementById("headline")?.classList.remove("on");
        const scan = document.getElementById("scan")!;
        if (!reduce)
          scan.animate(
            [
              { top: "0%", opacity: 1 },
              { top: "100%", opacity: 1 },
              { top: "100%", opacity: 0 },
            ],
            { duration: 650, easing: "cubic-bezier(.65,0,.35,1)" }
          );
        FORM = readForm();
        const [res] = await Promise.all([scoreViaBackend(FORM, true, true), sleep(450)]);
        lastRun = { id: res.id || "r" + Date.now(), app: { ...FORM }, res, date: new Date() };
        paintSheet(res);
        await sleep(150);
        renderFactors(document.getElementById("fbars"), res.factors, true);
        await sleep(400);
        landStamp(
          document.getElementById("stamp"),
          res.outcome,
          today.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }).toUpperCase() + ", SAAKH AI"
        );
        await sleep(EASE.stamp.duration * 0.3);
        if (!reduce) sheet.animate([{ translate: "0 0" }, { translate: "0 2px" }, { translate: "0 0" }], { duration: 90 });
        stamped = true;
        await sleep(260);
        const ht = document.getElementById("headTxt");
        if (ht) ht.innerHTML = '<span class="hl">' + res.headline + "</span>";
        document.getElementById("headline")?.classList.add("on");
        setTimeout(() => {
          const rows = [...document.querySelectorAll("#fbars .fbar")];
          const i = res.factors.findIndex((f: any) => f.dir === "raises");
          if (rows[i]) rows[i].classList.add("mark");
        }, reduce ? 0 : 420);
        document.getElementById("live")?.classList.add("off");
        const pdfBtn = document.getElementById("shPdf");
        if (pdfBtn) pdfBtn.style.display = "inline-flex";
        HISTORY.unshift(lastRun);
        portDrawn = false;
        // scoreViaBackend falls back to the in-browser model, so a decision here does not prove it was stored.
        if (res.saved) toast("Assessment saved to database");
        else toast("The server could not be reached. This result was not saved.", "bad");
      },
      "Run again"
    );
  }
  function initAssess() {
    const sel = document.getElementById("persona") as HTMLSelectElement;
    if (!sel) return;
    sel.innerHTML = '<option value="">Choose a demo persona</option>' + PERSONAS.map((p, i) => `<option value="${i}">${p.full_name}, ${p.note}</option>`).join("");
    sel.addEventListener("change", () => {
      if (sel.value === "") return;
      FORM = { ...PERSONAS[+sel.value] };
      fillForm(FORM);
      document.querySelectorAll(".field.err").forEach((f) => f.classList.remove("err"));
      liveUpdate();
      toast(`Loaded ${FORM.full_name}`);
    });
    document.getElementById("clearForm")?.addEventListener("click", () => {
      document.querySelectorAll("#stage [data-k]").forEach((el: any) => (el.value = ""));
      sel.value = "";
      (document.getElementById("f_ntc") as HTMLInputElement).checked = false;
      (document.getElementById("f_def") as HTMLInputElement).checked = false;
      (document.getElementById("f_cibil") as HTMLInputElement).disabled = false;
      document.querySelectorAll("#stage .field.err").forEach((f) => f.classList.remove("err"));
      maxStep = 0;
      goStep(0);
      renderStepper();
      liveUpdate(); // lifts an old decision stamp too, so it cannot stay on an empty form
    });
    document.querySelectorAll("#stage [data-money]").forEach(moneyInit);
    document.querySelectorAll("#stage .seg").forEach((sg: any) =>
      segInit(sg, () => {
        if (sg.dataset.seg === "loan_type") typeChanged();
        liveUpdate();
      })
    );
    document.getElementById("stage")?.addEventListener("input", (e: any) => {
      const f = e.target.closest(".field");
      if (f) f.classList.remove("err");
      liveUpdate();
    });
    document.getElementById("f_ntc")?.addEventListener("change", (e: any) => {
      const cib = document.getElementById("f_cibil") as HTMLInputElement;
      if (cib) cib.disabled = e.target.checked;
      liveUpdate();
    });
    document.getElementById("f_def")?.addEventListener("change", liveUpdate);
    document.getElementById("f_tier")?.addEventListener("change", liveUpdate);
    document.getElementById("stepper")?.addEventListener("click", (e: any) => {
      const b = e.target.closest("[data-go]");
      if (!b || b.disabled) return;
      const n = +b.dataset.go;
      if (n > step && !validateStep(step)) return;
      goStep(n);
    });
    document.getElementById("nextBtn")?.addEventListener("click", () => {
      if (validateStep(step)) goStep(step + 1);
    });
    document.getElementById("backBtn")?.addEventListener("click", () => {
      if (step > 0) goStep(step - 1);
    });
    document.getElementById("runBtn")?.addEventListener("click", runAssessment);
    document.getElementById("shPdf")?.addEventListener("click", (e: any) => {
      const cur = lastRun || { id: "live", app: readForm(), res: score(safeApp(readForm()), true), date: new Date() };
      btnRun(e.currentTarget, async () => {
        if (onDownloadPdf) await onDownloadPdf(cur.app, cur.res, cur.id, fmtDate(cur.date));
        toast(`Downloaded Saakh_${cur.app.full_name.replace(/\s+/g, "_")}.pdf`);
      });
    });
    document.getElementById("toWhatIf")?.addEventListener("click", () => {
      FORM = readForm();
      location.hash = "what-if";
    });
    document.getElementById("peek")?.addEventListener("click", () => document.getElementById("asheet")?.classList.toggle("open"));
    document.querySelectorAll(".pane")[0]?.classList.add("on");
    mainDial = new Ruler(document.getElementById("mainRuler")!);
    fillForm(FORM);
    renderStepper();
    const bb = document.getElementById("backBtn") as HTMLButtonElement;
    if (bb) bb.disabled = true;
    sel.value = "0";
    paintSheet(score(FORM));
    scoreViaBackend(FORM, false, false).then((r) => paintSheet(r));
  }

  /* ====================================================================
     WHAT-IF
  ==================================================================== */
  let WI: any = null, WIbase: any = null;
  const WISL: Array<[string, string, (a: any) => [number, number, number], (v: number) => string]> = [
    ["loan_amount", "Loan amount", (a) => [50000, TYPE_MAX[a.loan_type], 10000], fmtShort],
    ["tenure_months", "Tenure", (a) => [...TENURE[a.loan_type], 6] as [number, number, number], (v) => v + " months"],
    ["monthly_income", "Monthly income", () => [10000, 500000, 1000], fmtINR],
    ["existing_emi", "Existing EMIs", () => [0, 150000, 500], fmtINR],
    ["credit_utilisation_pct", "Card limit used", () => [0, 100, 1], (v) => v + "%"],
    ["cibil_score", "CIBIL score", () => [300, 900, 1], (v) => String(v)],
    ["enquiries_6m", "Recent enquiries", () => [0, 12, 1], (v) => String(v)],
  ];
  function initWhatIf() {
    wiDial = new Ruler(document.getElementById("wiRuler")!);
    document.getElementById("wiReset")?.addEventListener("click", () => {
      WI = { ...WIbase };
      buildSliders();
      wiPaint();
    });
  }
  function enterWhatIf() {
    WIbase = safeApp(readForm());
    if (WIbase.cibil_score === -1) WIbase.cibil_score = 650;
    WI = { ...WIbase };
    buildSliders();
    wiPaint();
  }
  function buildSliders() {
    const box = document.getElementById("wiSliders")!;
    box.innerHTML =
      `<h2 class="subtitle" style="margin-bottom:4px">${esc(WI.full_name || "Applicant")}</h2><p class="small" style="margin:0 0 6px">${WI.loan_type[0].toUpperCase() + WI.loan_type.slice(1)} loan. Values from the Assess page.</p>` +
      WISL.map(([k, lab, rf]) => {
        const [mn, mx, st] = rf(WI);
        return `<div class="srow"><div class="lab"><span>${lab}</span></div><div class="rng" style="padding-top:28px"><label class="sr" for="wi_${k}">${lab}</label><input type="range" id="wi_${k}" data-k="${k}" min="${mn}" max="${mx}" step="${st}" value="${Math.min(mx, Math.max(mn, WI[k]))}"><span class="bub"></span></div></div>`;
      }).join("");
    WISL.forEach(([k, , , fmt]) => {
      const w = document.getElementById("wi_" + k)?.closest(".rng");
      if (w) rangeInit(w, fmt);
    });
    let t: any = 0;
    box.oninput = (e: any) => {
      const k = e.target.dataset.k;
      if (!k) return;
      WI[k] = +e.target.value;
      clearTimeout(t);
      t = setTimeout(wiPaint, 120);
    };
  }
  function wiPaint() {
    const paintRes = (res: any) => {
      wiDial.set(res.pd, `Estimated default risk ${(res.pd * 100).toFixed(1)} percent, grade ${res.grade}`);
      tweenNumber(document.getElementById("wiPd"), res.pd * 100, (v) => v.toFixed(1) + "%");
      setGradeChip(document.getElementById("wiGrade"), res.grade, true);
      const out = document.getElementById("wiOutcome");
      if (out) out.innerHTML = chipOutcome(res.outcome);
      tweenNumber(document.getElementById("wiEmi"), res.emi, fmtINR);
      tweenNumber(document.getElementById("wiFoir"), res.foir * 100, (v) => Math.round(v) + "%");
      const cf = document.getElementById("cfList")!;
      const cfs = res.cf || [];
      if (!cfs.length) {
        cf.innerHTML = `<div class="cfcard">${iconSvg("circle-check", { s: 24 })}<p>${res.grade === "A" ? "This application is already at the best grade." : "No single change reaches a better grade. Try combining changes with the sliders."}</p></div>`;
        return;
      }
      cf.innerHTML = cfs
        .map(
          (c: any, i: number) =>
            `<div class="cfcard ih">${iconSvg("trending-up", { s: 24, a: "draw" })}<p>${c.sentence}</p><button class="btn btn-secondary btn-sm" data-cf="${i}">Apply</button></div>`
        )
        .join("");
      cf.querySelectorAll("[data-cf]").forEach((b: any) => b.addEventListener("click", () => applyCf(cfs[+b.dataset.cf])));
    };
    const syncRes = score(WI, true);
    paintRes(syncRes);
    scoreViaBackend(WI, true, false).then((apiRes) => paintRes(apiRes));
  }
  function applyCf(c: any) {
    const patch = { ...c.patch };
    const keys = Object.keys(patch);
    keys.forEach((k) => {
      const inp = document.getElementById("wi_" + k) as HTMLInputElement;
      if (!inp) {
        WI[k] = patch[k];
        return;
      }
      const from = +inp.value, to = patch[k];
      const t0 = performance.now(), d = reduce ? 1 : 600;
      const step = (now: number) => {
        const p = Math.min(1, (now - t0) / d), e = 1 - Math.pow(1 - p, 4);
        inp.value = String(from + (to - from) * e);
        (inp.closest(".rng") as any)?._upd();
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
      WI[k] = to;
    });
    setTimeout(() => {
      wiPaint();
      toast("Change applied. Grade " + c.r.grade + " reached.");
    }, reduce ? 0 : 620);
  }

  /* ====================================================================
     APPLICANTS + shared-element detail
  ==================================================================== */
  let page = 0, filt = "ALL", query = "";
  function filtered() {
    return HISTORY.filter((h) => (filt === "ALL" || h.res.outcome === filt) && h.app.full_name.toLowerCase().includes(query));
  }
  function renderTable() {
    const rows = filtered();
    const per = 12;
    const pages = Math.max(1, Math.ceil(rows.length / per));
    page = Math.min(page, pages - 1);
    const slice = rows.slice(page * per, page * per + per);
    const tb = document.getElementById("tbody");
    if (tb) {
      // Live updates redraw this table at any moment; keep a keyboard user's place in it.
      const focusId = (document.activeElement as HTMLElement | null)?.closest?.("#tbody tr")?.getAttribute("data-id");
      tb.innerHTML = slice
        .map(
          (h) =>
            `<tr data-id="${esc(h.id)}" tabindex="0"><td class="nm"><span data-vt="name">${esc(h.app.full_name)}</span></td><td>${esc(h.app.loan_type[0].toUpperCase() + h.app.loan_type.slice(1))}</td><td class="num">${fmtINR(h.app.loan_amount)}</td><td><span data-vt="grade">${chipGrade(h.res.grade)}</span></td><td>${chipOutcome(h.res.outcome)}</td><td class="num">${fmtPct(h.res.pd)}</td><td>${fmtDate(h.date)}</td></tr>`
        )
        .join("");
      if (focusId) ([...tb.querySelectorAll("tr")].find((r) => r.dataset.id === focusId) as HTMLElement | undefined)?.focus();
    }
    const te = document.getElementById("tblEmpty");
    if (te) {
      te.innerHTML = rows.length
        ? ""
        : `<div class="empty">${iconSvg("users", { s: 40 })}<p style="margin:0 0 14px">No applicants match "${esc(query)}". Clear the search or run a new assessment.</p><a class="btn btn-primary" href="#assess">Assess an application</a></div>`;
    }
    const pi = document.getElementById("pinfo");
    if (pi) pi.textContent = rows.length ? `Showing ${page * per + 1} to ${page * per + slice.length} of ${rows.length}` : "";
    const pv = document.getElementById("pprev") as HTMLButtonElement;
    const nx = document.getElementById("pnext") as HTMLButtonElement;
    if (pv) pv.disabled = page === 0;
    if (nx) nx.disabled = page >= pages - 1;
  }
  function withVT(fn: () => void) {
    if ((document as any).startViewTransition && !reduce) (document as any).startViewTransition(fn);
    else fn();
  }
  function openDetail(id: string, fromRow?: HTMLElement) {
    const h = HISTORY.find((x) => x.id === id);
    if (!h) return;
    // A row closed in the last 600 ms still holds these names, and a duplicate name aborts the transition.
    document.querySelectorAll('[style*="view-transition-name"]').forEach((e: any) => (e.style.viewTransitionName = ""));
    if (fromRow) {
      (fromRow.querySelector('[data-vt="name"]') as HTMLElement).style.viewTransitionName = "ap-name";
      (fromRow.querySelector('[data-vt="grade"]') as HTMLElement).style.viewTransitionName = "ap-grade";
    }
    withVT(() => {
      document.querySelectorAll('[style*="view-transition-name"]').forEach((e: any) => (e.style.viewTransitionName = ""));
      const a = h.app;
      const res = h.res.factors && h.res.cf ? h.res : score(a, true);
      const d = document.getElementById("appDetail")!;
      d.innerHTML = `<button class="btn btn-ghost ih" id="detBack" style="margin-left:-12px"><i data-icon="arrow-left" data-a="nudge-x"></i><span class="lbl">Back to applicants</span></button>
      <div class="detail-head"><span class="nm" style="view-transition-name:ap-name">${esc(a.full_name)}</span><span style="view-transition-name:ap-grade">${chipGrade(res.grade)}</span>${chipOutcome(res.outcome)}<span class="grow" style="flex:1"></span>
        <button class="btn btn-primary ih" id="detPdf" style="min-width:180px"><i data-icon="download" data-a="nudge-y"></i><span class="lbl">Download report</span><span class="state load"><i data-icon="loader-circle" data-cls="spin"></i></span><span class="state ok"><span style="display:flex;gap:8px;align-items:center"><i data-icon="check" data-raw></i>Report downloaded</span></span></button></div>
      <div class="detail-grid">
        <div class="panel" style="padding:24px"><h2 class="subtitle" style="margin-bottom:14px">Application</h2><dl class="dl">
          <dt>Age</dt><dd>${a.age}</dd><dt>Employment</dt><dd>${({ salaried: "Salaried", self_employed: "Self-employed", business_owner: "Business owner" } as Record<string, string>)[a.employment_type] || esc(a.employment_type)}, ${esc(a.years_in_job)} years</dd>
          <dt>Monthly income</dt><dd>${fmtINR(a.monthly_income)}</dd><dt>CIBIL score</dt><dd>${a.cibil_score === -1 ? "New to credit" : a.cibil_score}</dd>
          <dt>Existing EMIs</dt><dd>${fmtINR(a.existing_emi)}</dd><dt>Card limit used</dt><dd>${a.credit_utilisation_pct}%</dd>
          <dt>Loan</dt><dd>${fmtINR(a.loan_amount)} ${esc(a.loan_type)}, ${esc(a.tenure_months)} months</dd>${a.collateral_value ? `<dt>Asset value</dt><dd>${fmtINR(a.collateral_value)}</dd>` : ""}
          <dt>Assessed</dt><dd>${fmtDate(h.date)}</dd></dl></div>
        <div class="sheet" style="padding:22px 24px"><div class="sh-figs"><div><div class="k">Estimated chance of default</div><div class="bigpd">${fmtPct(res.pd)}</div></div></div><div id="detRuler"></div>
          <div class="kv4"><div><div class="k">EMI</div><div class="v">${fmtINR(res.emi)}</div></div><div><div class="k">Indicative rate</div><div class="v">${res.rate ? res.rate.toFixed(2) + "%" : "None"}</div></div><div><div class="k">EMIs vs income</div><div class="v">${Math.round(res.foir * 100)}%</div></div><div><div class="k">Max eligible</div><div class="v">${fmtShort(res.maxAmt)}</div></div></div>
          <div class="sh-div"></div><h3 class="ui" style="margin:0 0 8px;font-size:15px;font-weight:600">What moved the score</h3><div class="fbars" id="detBars"></div>
          ${res.cf && res.cf.length ? `<div class="sh-div"></div><h3 class="ui" style="margin:0 0 8px;font-size:15px;font-weight:600">Paths to a better grade</h3>${res.cf.map((c: any) => `<p style="margin:0 0 8px;display:flex;gap:8px;font-size:14px;line-height:21px">${iconSvg("trending-up", { s: 16 })}<span>${c.sentence}</span></p>`).join("")}` : ""}
        </div></div>`;
      hydrateIcons(d);
      document.getElementById("appList")!.hidden = true;
      d.hidden = false;
      new Ruler(document.getElementById("detRuler")!).jump(res.pd, `Estimated chance of default ${(res.pd * 100).toFixed(1)} percent, grade ${res.grade}`);
      renderFactors(document.getElementById("detBars"), res.factors, false);
      document.getElementById("detBack")!.onclick = () => closeDetail(id);
      document.getElementById("detPdf")!.onclick = (e: any) => {
        btnRun(e.currentTarget, async () => {
          if (onDownloadPdf) await onDownloadPdf(a, res, h.id, fmtDate(h.date));
          toast("Downloaded Saakh_" + a.full_name.replace(/ /g, "_") + ".pdf");
        });
      };
      window.scrollTo({ top: 0 });
    });
  }
  function closeDetail(id: string) {
    withVT(() => {
      document.getElementById("appDetail")!.hidden = true;
      document.getElementById("appList")!.hidden = false;
      renderTable();
      const row = document.querySelector(`tr[data-id="${id}"]`);
      if (row) {
        (row.querySelector('[data-vt="name"]') as HTMLElement).style.viewTransitionName = "ap-name";
        (row.querySelector('[data-vt="grade"]') as HTMLElement).style.viewTransitionName = "ap-grade";
        setTimeout(() => {
          row.querySelectorAll("[data-vt]").forEach((e: any) => (e.style.viewTransitionName = ""));
        }, 600);
      }
    });
  }
  function initApplicants() {
    segInit(document.getElementById("fseg"), (v) => {
      filt = v;
      page = 0;
      renderTable();
    });
    document.getElementById("q")?.addEventListener("input", (e: any) => {
      query = e.target.value.toLowerCase().trim();
      page = 0;
      renderTable();
    });
    const pv = document.getElementById("pprev");
    const nx = document.getElementById("pnext");
    if (pv) pv.onclick = () => { page--; renderTable(); };
    if (nx) nx.onclick = () => { page++; renderTable(); };
    const tb = document.getElementById("tbody");
    tb?.addEventListener("click", (e: any) => {
      const tr = e.target.closest("tr");
      if (tr) openDetail(tr.dataset.id, tr);
    });
    tb?.addEventListener("keydown", (e: any) => {
      if (e.key === "Enter") {
        const tr = e.target.closest("tr");
        if (tr) openDetail(tr.dataset.id, tr);
      }
    });
  }

  /* ====================================================================
     BATCH
  ==================================================================== */
  const TEMPLATE_COLS = [
    "full_name", "age", "employment_type", "years_in_job", "city_tier", "dependents", "residence",
    "monthly_income", "other_monthly_income", "cibil_score", "credit_history_years", "open_credit_lines",
    "credit_utilisation_pct", "missed_payments_24m", "enquiries_6m", "past_default", "existing_emi",
    "outstanding_debt", "loan_type", "loan_amount", "tenure_months", "collateral_value", "purpose",
  ];
  // Same limits as the Assess form, so a CSV row cannot be scored on values the form would refuse.
  function rowErrors(a: any) {
    if (!/^[A-Za-z .'-]{2,80}$/.test(String(a.full_name || "").trim())) return ["full_name", "Name must use letters only"];
    if (!(a.age >= 18 && a.age <= 75)) return ["age", "Age must be 18 to 75"];
    if (!(a.monthly_income >= 10000 && a.monthly_income <= 5000000)) return ["monthly_income", "Monthly income must be ₹10,000 to ₹50,00,000"];
    if (a.cibil_score !== -1 && !(a.cibil_score >= 300 && a.cibil_score <= 900)) return ["cibil_score", "CIBIL score must be 300 to 900, or -1 for new to credit"];
    if (!(a.credit_utilisation_pct >= 0 && a.credit_utilisation_pct <= 100)) return ["credit_utilisation_pct", "Card limit used must be 0 to 100"];
    if (!TENURE[a.loan_type]) return ["loan_type", "Unknown loan type"];
    if (!(a.loan_amount >= 10000 && a.loan_amount <= TYPE_MAX[a.loan_type])) return ["loan_amount", `Loan amount must be ₹10,000 to ${fmtINR(TYPE_MAX[a.loan_type])}`];
    const [t0, t1] = TENURE[a.loan_type];
    if (!(a.tenure_months >= t0 && a.tenure_months <= t1)) return ["tenure_months", `Tenure must be ${t0} to ${t1} months`];
    if ((a.loan_type === "home" || a.loan_type === "auto") && !(a.collateral_value > 0)) return ["collateral_value", "Asset value is required for home and auto loans"];
    return null;
  }
  async function runBatch(apps: any[]) {
    const out = document.getElementById("batchOut")!;
    out.innerHTML = `<div class="panel" style="padding:24px;margin-top:24px"><div style="display:flex;justify-content:space-between"><b>Scoring ${apps.length} applications</b><span class="tnum" id="bcount">0 of ${apps.length}</span></div><div class="prog"><i id="bprog"></i></div><div class="small">Validating rows and running the calibrated XGBoost model</div></div>`;
    const bar = document.getElementById("bprog")!, cnt = document.getElementById("bcount")!;
    const results: any[] = [], errs: any[] = [];
    for (let i = 0; i < apps.length; i++) {
      const a = apps[i];
      const e = rowErrors(a);
      if (e) errs.push({ row: i + 2, field: e[0], msg: e[1] });
      else {
        const r = await scoreViaBackend(a, false, false);
        results.push({ a, r });
      }
      if (i % 3 === 0 || i === apps.length - 1) {
        bar.style.width = ((i + 1) / apps.length) * 100 + "%";
        cnt.textContent = `${i + 1} of ${apps.length}`;
        await sleep(reduce ? 0 : 12);
      }
    }
    await sleep(150);
    const g: Record<string, number> = { A: 0, B: 0, C: 0, D: 0, E: 0 };
    results.forEach((x) => g[x.r.grade]++);
    const o: Record<string, number> = { SANCTIONED: 0, REFER: 0, DECLINED: 0 };
    results.forEach((x) => o[x.r.outcome]++);
    out.innerHTML = `<div class="panel" style="padding:24px;margin-top:24px">
      <div style="display:flex;gap:16px;align-items:flex-start;flex-wrap:wrap"><div style="flex:1;min-width:260px"><h2 class="title">${results.length} scored, ${errs.length} need fixing</h2>
      <p class="muted" style="margin:4px 0 0">${o.SANCTIONED} sanctioned, ${o.REFER} referred, ${o.DECLINED} declined.</p></div>
      <button class="btn btn-primary ih" id="dlRes" style="min-width:210px"><i data-icon="download" data-a="nudge-y"></i><span class="lbl">Download results CSV</span><span class="state load"><i data-icon="loader-circle" data-cls="spin"></i></span><span class="state ok"><span style="display:flex;gap:8px;align-items:center"><i data-icon="check" data-raw></i>CSV downloaded</span></span></button></div>
      <div class="gstrip">${GRADES.map((k, i) => (g[k] ? `<i style="flex:${g[k]};background:var(--g${k});animation-delay:${i * 60}ms" title="Grade ${k}: ${g[k]}"></i>` : "")).join("")}</div>
      <div class="legend">${GRADES.map((k) => `<span><i style="background:var(--g${k})"></i>Grade ${k}: ${g[k]}</span>`).join("")}</div></div>
      ${errs.length ? `<div class="panel" style="padding:20px 24px;margin-top:16px"><h3 class="subtitle" style="margin-bottom:6px">Rows to fix</h3><ul class="errlist">${errs.map((e) => `<li>${iconSvg("x", { s: 16 })}<span>Row ${e.row}, ${e.field}: ${e.msg}</span></li>`).join("")}</ul></div>` : ""}
      <div class="panel" style="margin-top:16px"><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Applicant</th><th>Loan</th><th class="num">Amount</th><th>Grade</th><th>Decision</th><th class="num">Risk</th></tr></thead><tbody>${results
        .slice(0, 10)
        .map(
          (x) =>
            `<tr><td class="nm">${esc(x.a.full_name)}</td><td>${esc(x.a.loan_type)}</td><td class="num">${fmtINR(x.a.loan_amount)}</td><td>${chipGrade(x.r.grade)}</td><td>${chipOutcome(x.r.outcome)}</td><td class="num">${fmtPct(x.r.pd)}</td></tr>`
        )
        .join("")}</tbody></table></div><div class="pager"><span>Showing ${Math.min(10, results.length)} of ${results.length} scored rows</span></div></div>`;
    hydrateIcons(out);
    document.getElementById("dlRes")!.onclick = (e: any) => {
      btnRun(e.currentTarget, async () => {
        await sleep(300);
        const hdr = ["full_name", "loan_type", "loan_amount", "tenure_months", "pd_pct", "grade", "outcome", "indicative_rate", "emi", "foir_pct", "max_eligible_amount", "headline"];
        const csvRows = [
          hdr.join(","),
          ...results.map((x) =>
            [
              `"${String(x.a.full_name).replace(/"/g, '""')}"`,
              x.a.loan_type,
              x.a.loan_amount,
              x.a.tenure_months,
              (x.r.pd * 100).toFixed(2),
              x.r.grade,
              x.r.outcome,
              x.r.rate ?? "",
              Math.round(x.r.emi),
              (x.r.foir * 100).toFixed(1),
              x.r.maxAmt,
              `"${String(x.r.headline).replace(/"/g, '""')}"`,
            ].join(",")
          ),
        ].join("\n");
        downloadFile("saakh_results.csv", csvRows);
      });
      toast("Downloaded saakh_results.csv");
    };
    toast(`${results.length} applications scored`);
  }
  // RFC 4180 fields, so quoted names and purposes may contain commas.
  // ponytail: a line break inside a quoted field is not supported; the template has no such field.
  function csvFields(line: string) {
    const out: string[] = [];
    let cur = "", quoted = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (quoted) {
        if (c === '"' && line[i + 1] === '"') { cur += '"'; i++; }
        else if (c === '"') quoted = false;
        else cur += c;
      } else if (c === '"') quoted = true;
      else if (c === ",") { out.push(cur); cur = ""; }
      else cur += c;
    }
    out.push(cur);
    return out;
  }
  function parseCSV(text: string) {
    const lines = text.replace(/^﻿/, "").trim().split(/\r?\n/); // Excel adds a byte-order mark
    const head = csvFields(lines.shift() || "").map((s) => s.trim());
    const missing = TEMPLATE_COLS.filter((c) => c !== "purpose" && !head.includes(c));
    if (missing.length) return { error: `The file is missing these columns: ${missing.join(", ")}. Download the template and try again.` };
    if (!lines.length) return { error: "The file has no rows to score. Add at least one application under the header." };
    if (lines.length > 5000) return { error: `The file has ${lines.length.toLocaleString("en-IN")} rows. The limit is 5,000.` };
    return {
      apps: lines.map((l) => {
        const v = csvFields(l);
        const o: any = {};
        head.forEach((h, i) => {
          const x = (v[i] || "").trim();
          o[h] = ["full_name", "employment_type", "residence", "loan_type", "purpose"].includes(h)
            ? x
            : h === "past_default"
            ? /^(1|true|yes)$/i.test(x)
            : x === ""
            ? NaN // a blank number must fail validation, not count as 0
            : +x;
        });
        return { ...base, ...o };
      }),
    };
  }
  function initBatch() {
    document.getElementById("sampleBtn")?.addEventListener("click", () => {
      const r = rng(7);
      const apps = Array.from({ length: 50 }, (_, i) => genApp(r, i));
      apps[11].age = 17;
      apps[27].tenure_months = 400;
      apps[38].collateral_value = 0;
      if (apps[38].loan_type !== "home" && apps[38].loan_type !== "auto") {
        apps[38].loan_type = "auto";
        apps[38].tenure_months = 60;
      }
      runBatch(apps);
    });
    const drop = document.getElementById("drop")!, file = document.getElementById("file") as HTMLInputElement;
    const handle = (f?: File) => {
      if (!f) return;
      if (!/\.csv$/i.test(f.name)) {
        toast("That is not a CSV file. Choose a file ending in .csv.", "bad");
        return;
      }
      if (f.size > 5 * 1024 * 1024) {
        toast("That file is over the 5 MB limit.", "bad");
        return;
      }
      const rd = new FileReader();
      rd.onerror = () => toast("The file could not be read. Try again.", "bad");
      rd.onload = () => {
        const p = parseCSV(String(rd.result));
        if (p.error) {
          toast(p.error, "bad");
          return;
        }
        runBatch(p.apps!);
      };
      rd.readAsText(f);
    };
    file?.addEventListener("change", () => {
      handle(file.files?.[0]);
      file.value = ""; // otherwise choosing the same file again does nothing
    });
    drop?.addEventListener("dragover", (e) => {
      e.preventDefault();
      drop.classList.add("over");
    });
    drop?.addEventListener("dragleave", () => drop.classList.remove("over"));
    drop?.addEventListener("drop", (e) => {
      e.preventDefault();
      drop.classList.remove("over");
      handle(e.dataTransfer?.files[0]);
    });
    document.getElementById("tplBtn")?.addEventListener("click", async () => {
      const sampleRow = [
        "Aarav Sharma", 29, "salaried", 4.5, 1, 0, "rented", 85000, 0, 760, 5, 3, 22.5, 0, 1, "false", 10000, 120000, "personal", 500000, 36, 0, "Home improvement"
      ].join(",");
      const csvContent = TEMPLATE_COLS.join(",") + "\n" + sampleRow + "\n";
      downloadFile("saakh_batch_template.csv", csvContent);
      try { await navigator.clipboard.writeText(TEMPLATE_COLS.join(",") + "\n"); } catch {}
      toast("Downloaded saakh_batch_template.csv");
    });
  }

  /* ====================================================================
     PORTFOLIO CHARTS
  ==================================================================== */
  let portDrawn = false;
  function svgEl(svg: any, html: string) {
    if (svg) svg.innerHTML = html;
  }
  function drawPortfolio() {
    const H = HISTORY;
    const n = H.length || 1;
    const oc: Record<string, number> = { SANCTIONED: 0, REFER: 0, DECLINED: 0 };
    H.forEach((h) => oc[h.res.outcome]++);
    const avg = H.reduce((s, h) => s + h.res.pd, 0) / n;
    const el = H.filter((h) => h.res.outcome !== "DECLINED").reduce((s, h) => s + h.res.pd * 0.45 * h.app.loan_amount, 0);
    const k = document.getElementById("kpis")!;
    k.innerHTML = [
      ["Applications", n],
      ["Sanction rate", (oc.SANCTIONED / n) * 100],
      ["Average default risk", avg * 100],
      ["Expected loss", el],
    ]
      .map(([l], i) => `<div class="kpi"><div class="v" id="kv${i}">0</div><div class="l">${l}</div></div>`)
      .join("");
    const fmts: Array<[number, (v: number) => string]> = [
      [n, (v) => Math.round(v).toLocaleString("en-IN")],
      [(oc.SANCTIONED / n) * 100, (v) => v.toFixed(0) + "%"],
      [avg * 100, (v) => v.toFixed(1) + "%"],
      [el, fmtShort],
    ];
    fmts.forEach(([v, f], i) => {
      const e: any = document.getElementById("kv" + i);
      if (e) {
        e._v = 0;
        tweenNumber(e, v, f, 900);
      }
    });
    if (portDrawn) return;
    portDrawn = true;
    const W = 520, Hh = 240, L = 40, B = 24, T = 10;
    const g: Record<string, number> = { A: 0, B: 0, C: 0, D: 0, E: 0 };
    H.forEach((h) => g[h.res.grade]++);
    const gm = Math.max(1, ...Object.values(g));
    let s = `<g class="grid">${[0, 0.25, 0.5, 0.75, 1].map((t) => `<line x1="${L}" x2="${W}" y1="${T + (Hh - B - T) * (1 - t)}" y2="${T + (Hh - B - T) * (1 - t)}"/>`).join("")}</g>`;
    [0, 0.5, 1].forEach((t) => (s += `<text x="${L - 8}" y="${T + (Hh - B - T) * (1 - t) + 4}" text-anchor="end">${Math.round(gm * t)}</text>`));
    const bw = (W - L) / 5;
    GRADES.forEach((gr, i) => {
      const h = ((Hh - B - T) * g[gr]) / gm;
      const x = L + i * bw + bw * 0.22;
      s += `<rect x="${x}" y="${Hh - B - h}" width="${bw * 0.56}" height="${h}" fill="var(--g${gr})" class="grow" style="transform-origin:${x}px ${Hh - B}px"/><text x="${x + bw * 0.28}" y="${Hh - B - h - 6}" text-anchor="middle" style="fill:var(--ink-2);font-weight:600">${g[gr]}</text><text x="${x + bw * 0.28}" y="${Hh - 6}" text-anchor="middle" style="font-weight:600">Grade ${gr}</text>`;
    });
    svgEl(document.getElementById("chGrade"), s);

    const bins = new Array(12).fill(0);
    H.forEach((h) => bins[Math.min(11, Math.floor(h.res.pd / 0.05))]++);
    const bm = Math.max(1, ...bins);
    s = `<g class="grid">${[0, 0.5, 1].map((t) => `<line x1="${L}" x2="${W}" y1="${T + (Hh - B - T) * (1 - t)}" y2="${T + (Hh - B - T) * (1 - t)}"/>`).join("")}</g>`;
    [0, 0.5, 1].forEach((t) => (s += `<text x="${L - 8}" y="${T + (Hh - B - T) * (1 - t) + 4}" text-anchor="end">${Math.round(bm * t)}</text>`));
    const hw = (W - L) / 12;
    bins.forEach((c, i) => {
      const h = ((Hh - B - T) * c) / bm;
      const x = L + i * hw + 1;
      s += `<rect x="${x}" y="${Hh - B - h}" width="${hw - 2}" height="${h}" fill="var(--chart-1)" class="grow" style="transform-origin:${x}px ${Hh - B}px"/>`;
      if (i % 2 === 0) s += `<text x="${x}" y="${Hh - 6}">${i * 5}%</text>`;
    });
    s += `<text x="${W}" y="${Hh - 6}" text-anchor="end">60%+</text>`;
    svgEl(document.getElementById("chHist"), s);

    const types = ["personal", "home", "auto", "education", "business"];
    s = "";
    const rh = 36;
    types.forEach((t, i) => {
      const rows = H.filter((h) => h.app.loan_type === t);
      const tot = rows.length || 1;
      let x = 100;
      const y = 12 + i * 44;
      s += `<text x="0" y="${y + rh / 2 + 4}" style="fill:var(--ink-2);font-size:13px;font-weight:500">${t[0].toUpperCase() + t.slice(1)}</text>`;
      [
        ["SANCTIONED", "var(--sanction)"],
        ["REFER", "var(--refer)"],
        ["DECLINED", "var(--decline)"],
      ].forEach(([o, c]) => {
        const w = ((W - 100 - 40) * rows.filter((h) => h.res.outcome === o).length) / tot;
        if (w > 0) {
          s += `<rect x="${x}" y="${y}" width="${Math.max(0, w - 2)}" height="${rh - 12}" fill="${c}" class="growx" style="transform-origin:100px ${y}px"/>`;
          x += w;
        }
      });
      s += `<text x="${W}" y="${y + rh / 2}" text-anchor="end">${rows.length}</text>`;
    });
    s += `<g transform="translate(100,${Hh - 6})"><rect width="10" height="10" y="-9" rx="2" fill="var(--sanction)"/><text x="16">Sanctioned</text><rect x="100" width="10" height="10" y="-9" rx="2" fill="var(--refer)"/><text x="116">Refer</text><rect x="180" width="10" height="10" y="-9" rx="2" fill="var(--decline)"/><text x="196">Declined</text></g>`;
    svgEl(document.getElementById("chType"), s);

    s = `<g class="grid">${[0, 0.5, 1].map((t) => `<line x1="${L}" x2="${W}" y1="${T + (Hh - B - T) * (1 - t)}" y2="${T + (Hh - B - T) * (1 - t)}"/>`).join("")}</g>`;
    [0, 0.3, 0.6].forEach((t, i) => (s += `<text x="${L - 8}" y="${T + (Hh - B - T) * (1 - i / 2) + 4}" text-anchor="end">${t * 100}%</text>`));
    [0, 0.25, 0.5, 0.75, 1].forEach((t) => (s += `<text x="${L + (W - L) * t}" y="${Hh - 6}" text-anchor="middle">${Math.round(t * 100)}%</text>`));
    H.forEach((h, i) => {
      const x = L + (W - L) * Math.min(1, h.res.foir);
      const y = T + (Hh - B - T) * (1 - Math.min(0.6, h.res.pd) / 0.6);
      s += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3.5" fill="var(--g${h.res.grade})" fill-opacity=".75" class="pop" style="animation-delay:${Math.min(600, i * 4)}ms;transform-origin:${x.toFixed(1)}px ${y.toFixed(1)}px"/>`;
    });
    svgEl(document.getElementById("chScatter"), s);
  }

  /* ====================================================================
     MODEL PAGE: pipeline trace, live stage inspector, ROC/AUC & SHAP
  ==================================================================== */
  const PIPE = [
    ["file-check", "Application", "23 fields from the wizard or a CSV row"],
    ["gavel", "Policy rules", "Six knock-outs and four review flags"],
    ["layers", "Features", "FOIR, loan-to-income, loan-to-value, utilisation"],
    ["brain", "XGBoost model", "Monotone gradient-boosted trees"],
    ["gauge", "Calibration", "Platt scaling turns scores into probabilities"],
    ["sparkles", "SHAP explanation", "Each input’s contribution in plain words"],
    ["stamp", "Decision", "Sanctioned, refer or declined, with rate and limit"],
  ];
  let perfDrawn = false, impDrawn = false;
  let activeTraceApp: any = PERSONAS[0];
  let activeTraceRes: any = score(PERSONAS[0], true);
  let activeStageIdx = 0;

  function renderStageInspector(idx: number, a: any, res: any) {
    activeStageIdx = idx;
    const box = document.getElementById("pipeInspector");
    if (!box) return;
    box.style.display = "block";
    const f = res.f || feats(a);
    const stageTitle = PIPE[idx][1];
    const stageDesc = PIPE[idx][2];
    let body = "";

    if (idx === 0) {
      body = `<div class="kv4" style="border-top:0;margin-top:0">
        <div><div class="k">Applicant</div><div class="v" style="font-size:18px">${a.full_name} (${a.age} yrs, ${a.employment_type.replace("_", "-")})</div></div>
        <div><div class="k">Monthly income</div><div class="v" style="font-size:18px">${fmtINR(a.monthly_income)}</div></div>
        <div><div class="k">CIBIL & Utilisation</div><div class="v" style="font-size:18px">${a.cibil_score === -1 ? "New to credit" : a.cibil_score} (${a.credit_utilisation_pct}% used)</div></div>
        <div><div class="k">Loan request</div><div class="v" style="font-size:18px">${fmtINR(a.loan_amount)} (${a.loan_type}, ${a.tenure_months}m)</div></div>
      </div>`;
    } else if (idx === 1) {
      const kHtml = res.K.length
        ? res.K.map((x: any) => `<span class="chip DECLINED" style="margin-right:8px">${iconSvg("ban", { s: 16 })}${x[0]}: ${x[1]}</span>`).join("")
        : `<span class="chip SANCTIONED">${iconSvg("circle-check", { s: 16 })}All 6 hard knock-out rules (K1–K6) passed</span>`;
      const rHtml = res.R.length
        ? res.R.map((x: any) => `<span class="chip REFER" style="margin-right:8px">${iconSvg("badge-alert", { s: 16 })}${x[0]}: ${x[1]}</span>`).join("")
        : `<span class="chip SANCTIONED">${iconSvg("circle-check", { s: 16 })}0 referral flags (R1–R4) triggered</span>`;
      body = `<div style="display:flex;flex-direction:column;gap:10px;margin-top:8px">
        <div><b class="small" style="display:block;margin-bottom:4px">Hard knock-out checks (K1–K6)</b>${kHtml}</div>
        <div><b class="small" style="display:block;margin-bottom:4px">Soft referral flags (R1–R4)</b>${rHtml}</div>
      </div>`;
    } else if (idx === 2) {
      body = `<div class="kv4" style="border-top:0;margin-top:0">
        <div><div class="k">FOIR (EMIs / Income)</div><div class="v" style="font-size:18px">${(f.foir * 100).toFixed(1)}%</div></div>
        <div><div class="k">Loan-to-Income (LTI)</div><div class="v" style="font-size:18px">${f.lti.toFixed(2)}x annual</div></div>
        <div><div class="k">Debt-to-Income (DTI)</div><div class="v" style="font-size:18px">${f.dti.toFixed(2)}x annual</div></div>
        <div><div class="k">LTV / Age at Maturity</div><div class="v" style="font-size:18px">${f.ltv ? (f.ltv * 100).toFixed(0) + "% LTV" : "Unsecured"} · ${f.ageMat.toFixed(1)} yrs</div></div>
      </div>`;
    } else if (idx === 3) {
      const logOdds = Math.log(Math.max(1e-5, res.pd) / Math.max(1e-5, 1 - res.pd));
      body = `<div class="kv4" style="border-top:0;margin-top:0">
        <div><div class="k">Estimator</div><div class="v" style="font-size:18px">XGBClassifier (22 features)</div></div>
        <div><div class="k">Raw Tree Margin</div><div class="v" style="font-size:18px">${logOdds.toFixed(3)} log-odds</div></div>
        <div><div class="k">Monotone Constraints</div><div class="v" style="font-size:16px">CIBIL (−1), FOIR (+1), Util (+1)</div></div>
        <div><div class="k">Directional Guarantee</div><div class="v" style="font-size:16px">Verified (0 inversions)</div></div>
      </div>`;
    } else if (idx === 4) {
      body = `<div class="kv4" style="border-top:0;margin-top:0">
        <div><div class="k">Calibrator</div><div class="v" style="font-size:18px">Platt Sigmoid Scaling</div></div>
        <div><div class="k">Calibrated Default Risk</div><div class="v" style="font-size:22px">${(res.pd * 100).toFixed(2)}%</div></div>
        <div><div class="k">Assigned Risk Grade</div><div class="v" style="font-size:18px">${chipGrade(res.grade)}</div></div>
        <div><div class="k">Grade Band Cut-off</div><div class="v" style="font-size:16px">A &lt;3% · B &lt;7% · C &lt;15% · D &lt;30%</div></div>
      </div>`;
    } else if (idx === 5) {
      body = `<div style="margin-top:6px"><div class="fbars" id="pipeShapBars"></div></div>`;
    } else if (idx === 6) {
      body = `<div class="kv4" style="border-top:0;margin-top:0">
        <div><div class="k">Final Verdict</div><div class="v" style="font-size:18px">${chipOutcome(res.outcome)}</div></div>
        <div><div class="k">Indicative Rate</div><div class="v" style="font-size:18px">${res.rate ? res.rate.toFixed(2) + "% p.a." : "Declined"}</div></div>
        <div><div class="k">Monthly EMI</div><div class="v" style="font-size:18px">${fmtINR(res.emi)}</div></div>
        <div><div class="k">Max Eligible Amount</div><div class="v" style="font-size:18px">${fmtShort(res.maxAmt)}</div></div>
      </div>`;
    }

    box.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;padding-bottom:10px;border-bottom:1px solid var(--rule)">
      <div><span class="small">Stage ${idx + 1} of 7 · ${a.full_name}</span><h3 class="subtitle" style="margin:2px 0 0">${stageTitle}: <span style="font-weight:400;color:var(--ink-2)">${stageDesc}</span></h3></div>
      <span style="display:flex;gap:10px;align-items:center">${chipGrade(res.grade)}${chipOutcome(res.outcome)}</span>
    </div>${body}`;
    if (idx === 5) {
      renderFactors(document.getElementById("pipeShapBars"), res.factors, true);
    }
  }

  function initModel() {
    const pipeEl = document.getElementById("pipe")!;
    pipeEl.innerHTML = PIPE.map(
      (p, i) =>
        `<div class="pnode ih" data-pstage="${i}" tabindex="0"><span class="n">${i + 1}</span><br>${iconSvg(p[0], { s: 24, a: "pop" })}<h2>${p[1]}</h2><p>${p[2]}</p></div>${
          i < PIPE.length - 1 ? '<span class="pedge"><span class="dot"></span></span>' : ""
        }`
    ).join("");

    const tp = document.getElementById("tracePersona") as HTMLSelectElement;
    if (tp) {
      tp.innerHTML = PERSONAS.map((p, i) => `<option value="${i}">Trace: ${p.full_name} (${p.loan_type}, ${fmtShort(p.loan_amount)})</option>`).join("");
      tp.addEventListener("change", async () => {
        const p = PERSONAS[+tp.value] || PERSONAS[0];
        activeTraceApp = p;
        activeTraceRes = await scoreViaBackend(p, true, false);
        const sub = document.getElementById("traceSub");
        if (sub) sub.textContent = `Tracing ${p.full_name}'s ${p.loan_type} loan application through each stage. Click any stage above to inspect its computation.`;
        renderStageInspector(activeStageIdx, activeTraceApp, activeTraceRes);
      });
    }

    scoreViaBackend(activeTraceApp, true, false).then((r) => {
      activeTraceRes = r;
      const nodes = [...document.querySelectorAll(".pnode")];
      nodes[0]?.classList.add("hot");
      renderStageInspector(0, activeTraceApp, activeTraceRes);
    });

    pipeEl.addEventListener("keydown", (e: any) => {
      if (e.key !== "Enter" && e.key !== " ") return;
      e.preventDefault();
      e.target.closest(".pnode")?.click();
    });
    pipeEl.addEventListener("click", (e: any) => {
      const node = e.target.closest(".pnode");
      if (!node) return;
      const idx = +node.dataset.pstage;
      document.querySelectorAll(".pnode").forEach((n, i) => n.classList.toggle("hot", i === idx));
      renderStageInspector(idx, activeTraceApp, activeTraceRes);
    });

    document.getElementById("traceBtn")?.addEventListener("click", async (e: any) => {
      const b = e.currentTarget as HTMLButtonElement;
      b.disabled = true;
      const idxSel = tp ? +tp.value : 0;
      activeTraceApp = PERSONAS[idxSel] || PERSONAS[0];
      activeTraceRes = await scoreViaBackend(activeTraceApp, true, false);
      const nodes = [...document.querySelectorAll(".pnode")] as HTMLElement[];
      const dots = [...document.querySelectorAll(".pedge .dot")] as HTMLElement[];
      for (let i = 0; i < nodes.length; i++) {
        nodes.forEach((n) => n.classList.remove("hot"));
        nodes[i].classList.add("hot");
        renderStageInspector(i, activeTraceApp, activeTraceRes);
        nodes[i].scrollIntoView({ block: "nearest", inline: "center", behavior: reduce ? "auto" : "smooth" });
        await sleep(520);
        if (dots[i] && !reduce) {
          dots[i].animate(
            [
              { left: "-5px", opacity: 1 },
              { left: "calc(100% - 5px)", opacity: 1 },
            ],
            { duration: 300, easing: "cubic-bezier(.65,0,.35,1)" }
          );
          await sleep(300);
        }
      }
      toast(`${activeTraceApp.full_name}: ${activeTraceRes.headline.toLowerCase()}`);
      b.disabled = false;
    });

    const tabs: any = document.getElementById("mtabs"), ul: any = document.getElementById("mtabUl");
    const place = (b: any, inst?: boolean) => {
      if (!b || !b.offsetWidth) return;
      if (inst || !ul._pos) {
        ul._pos = { x: b.offsetLeft, y: 0, w: b.offsetWidth };
        ul.style.transform = `translate(${b.offsetLeft}px,0)`;
        ul.style.width = b.offsetWidth + "px";
      } else moveTo(ul, b.offsetLeft, 0, b.offsetWidth, "snappy");
    };
    tabs._place = () => {
      ul._pos = null;
      place(tabs.querySelector('[aria-selected="true"]'), true);
    };
    tabs.addEventListener("keydown", (e: any) => {
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      const all = [...tabs.querySelectorAll('[role="tab"]')] as HTMLElement[];
      const i = all.indexOf(e.target);
      if (i < 0) return;
      e.preventDefault();
      const next = all[(i + (e.key === "ArrowRight" ? 1 : -1) + all.length) % all.length];
      next.focus();
      next.click();
    });
    tabs.addEventListener("click", (e: any) => {
      const b = e.target.closest('[role="tab"]');
      if (!b) return;
      tabs.querySelectorAll('[role="tab"]').forEach((t: any) => t.setAttribute("aria-selected", String(t === b)));
      place(b);
      document.querySelectorAll(".tabpanel").forEach((p: any) => p.classList.toggle("on", p.dataset.p === b.dataset.t));
      if (b.dataset.t === "perf") drawPerf();
      if (b.dataset.t === "imp") drawImp();
    });
  }

  let SYN: any[] | null = null;
  function synth() {
    if (SYN) return SYN;
    const r = rng(2026);
    SYN = [];
    for (let i = 0; i < 3000; i++) {
      const a = genApp(r, i);
      const s = score(a);
      const z = Math.log(s.pd / (1 - s.pd)) + 0.6 * gauss(r);
      SYN.push({ a, s, y: r() < sigmoid(z) ? 1 : 0 });
    }
    return SYN;
  }

  async function drawPerf() {
    if (perfDrawn) return;
    perfDrawn = true;
    const D = synth();
    const P = D.filter((d) => d.y).length, N = D.length - P;
    const sorted = [...D].sort((a, b) => b.s.pd - a.s.pd);
    const pts: Array<[number, number]> = [[0, 0]];
    let tp = 0, fp = 0, auc = 0, px = 0, py = 0;
    sorted.forEach((d) => {
      if (d.y) tp++;
      else fp++;
      const x = fp / N, y = tp / P;
      auc += ((x - px) * (y + py)) / 2;
      px = x;
      py = y;
      pts.push([x, y]);
    });
    const W = 520, H = 300, L = 40, B = 30, T = 10, X = (v: number) => L + (W - L - 10) * v, Y = (v: number) => T + (H - B - T) * (1 - v);
    const step = Math.ceil(pts.length / 200);
    const path = pts
      .filter((_, i) => i % step === 0)
      .concat([[1, 1]])
      .map((p, i) => (i ? "L" : "M") + X(p[0]).toFixed(1) + " " + Y(p[1]).toFixed(1))
      .join("");
    let s = `<g class="grid">${[0, 0.25, 0.5, 0.75, 1].map((t) => `<line x1="${L}" x2="${W - 10}" y1="${Y(t)}" y2="${Y(t)}"/>`).join("")}</g>`;
    [0, 0.5, 1].forEach((t) => {
      s += `<text x="${L - 8}" y="${Y(t) + 4}" text-anchor="end">${t}</text><text x="${X(t)}" y="${H - 10}" text-anchor="middle">${t}</text>`;
    });
    s += `<line x1="${X(0)}" y1="${Y(0)}" x2="${X(1)}" y2="${Y(1)}" stroke="var(--chart-4)" stroke-dasharray="4 4"/><path d="${path}" fill="none" stroke="var(--chart-1)" stroke-width="2.5" pathLength="1" class="drawl"/>`;
    s += `<text x="${X(1)}" y="${Y(0) - 8}" text-anchor="end" style="font-size:12.8px;fill:var(--ink-2)">False positive rate</text><text transform="translate(12,${Y(0.5)}) rotate(-90)" text-anchor="middle" style="font-size:12.8px;fill:var(--ink-2)">True positive rate</text>`;
    document.getElementById("chRoc")!.innerHTML = s;
    document.getElementById("aucSub")!.textContent = `Area under the curve ${auc.toFixed(3)} on ${D.length.toLocaleString("en-IN")} synthetic applicants (${((P / D.length) * 100).toFixed(1)}% defaulted)`;
    let TP = 0, FP = 0, FN = 0, TN = 0;
    D.forEach((d) => {
      const p = d.s.pd >= 0.3;
      if (p && d.y) TP++;
      else if (p) FP++;
      else if (d.y) FN++;
      else TN++;
    });
    const cell = (v: number, c: string) => `<div class="c" style="background:color-mix(in srgb,${c} ${12 + Math.min(50, (v / D.length) * 140)}%,transparent);color:var(--ink)">${v.toLocaleString("en-IN")}</div>`;
    document.getElementById("cm")!.innerHTML = `<div class="h"></div><div class="h">Predicted high risk</div><div class="h">Predicted lower risk</div><div class="h" style="text-align:right;align-self:center">Defaulted</div>${cell(TP, "var(--chart-1)")}${cell(FN, "var(--chart-2)")}<div class="h" style="text-align:right;align-self:center">Repaid</div>${cell(FP, "var(--chart-2)")}${cell(TN, "var(--chart-1)")}`;

    try {
      const resp = await fetch(`${API_BASE}/api/model`);
      if (resp.ok) {
        const data = await resp.json();
        const m = data.metrics || {};
        const mk = document.getElementById("modelKpis");
        if (mk && m.auc) {
          mk.innerHTML = [
            ["Held-out Test ROC-AUC", m.auc.toFixed(4)],
            ["Calibrated Brier Score", m.brier.toFixed(4)],
            ["KS Statistic", m.ks.toFixed(4)],
            ["Baseline LogReg AUC", (m.baseline_auc || 0.781).toFixed(4)],
          ]
            .map(([l, v]) => `<div class="kpi"><div class="v" style="font-size:36px;line-height:42px">${v}</div><div class="l">${l}</div></div>`)
            .join("");
        }
      }
    } catch {}
  }

  function drawImp() {
    if (impDrawn) return;
    impDrawn = true;
    const D = synth().slice(0, 1500);
    const acc: Record<string, number> = {};
    D.forEach((d) => {
      const sc = score(d.a);
      const f = feats(d.a);
      const z = Math.log(sc.pd / (1 - sc.pd));
      const fr = feats(REF_APP);
      TERMS.forEach(([k, , fn]) => {
        const dlt = fn(d.a, f) - fn(REF_APP, fr);
        acc[k] = (acc[k] || 0) + Math.abs(100 * (sc.pd - sigmoid(z - dlt)));
      });
    });
    const NAMES: Record<string, string> = {
      cibil: "CIBIL score",
      nohist: "New to credit",
      foir: "EMIs vs income (FOIR)",
      util: "Card limit used",
      missed: "Missed payments",
      enq: "Recent enquiries",
      job: "Years in job",
      hist: "Credit history length",
      emp: "Employment type",
      lti: "Loan vs income",
      def: "Previous default",
      dep: "Dependents",
      res: "Home ownership",
      ltv: "Loan vs asset value",
    };
    const rows = Object.entries(acc)
      .map(([k, v]) => [k, v / D.length] as [string, number])
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
    const m = rows[0][1];
    let s = "";
    rows.forEach(([k, v], i) => {
      const y = 8 + i * 32, w = ((640 - 210 - 60) * v) / m;
      s += `<text x="0" y="${y + 15}" style="fill:var(--ink-2);font-size:13px;font-weight:500">${NAMES[k]}</text><rect x="200" y="${y + 3}" width="${w}" height="16" fill="var(--chart-1)" class="growx" style="transform-origin:200px 0;animation-delay:${i * 40}ms"/><text x="${206 + w}" y="${y + 15}" style="font-weight:600;fill:var(--ink-2)">${v.toFixed(2)}</text>`;
    });
    document.getElementById("chImp")!.innerHTML = s;
  }

  /* ====================================================================
     HOME
  ==================================================================== */
  function initHome() {
    heroRuler = new Ruler(document.getElementById("heroRuler")!);
    const $ = (id: string) => document.getElementById(id) as HTMLInputElement;
    ["sInc", "sAmt"].forEach((id) => moneyInit($(id)));
    const cl = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
    const upd = async () => {
      const a = {
        ...REF_APP,
        loan_type: "personal",
        existing_emi: 0,
        outstanding_debt: 0,
        employment_type: $("sEmp").value,
        monthly_income: cl(parseINR($("sInc").value) || 10000, 10000, 5000000),
        cibil_score: cl(+$("sCib").value || 300, 300, 900),
        loan_amount: cl(parseINR($("sAmt").value) || 10000, 10000, 4000000),
        tenure_months: cl(+$("sTen").value || 6, 6, 84),
      };
      const paintHero = (r: any) => {
        heroRuler.set(r.pd, `Estimated chance of default ${(r.pd * 100).toFixed(1)} percent, grade ${r.grade}`);
        tweenNumber($("vPd"), r.pd * 100, (v) => v.toFixed(1) + "%", 300);
        setGradeChip($("vGrade"), r.grade);
        $("vOut").innerHTML = chipOutcome(r.outcome);
      };
      paintHero(score(a));
      const apiRes = await scoreViaBackend(a, false, false);
      paintHero(apiRes);
    };
    let t: any = 0;
    $("sentence").addEventListener("input", () => {
      clearTimeout(t);
      t = setTimeout(upd, 120);
    });
    $("sEmp").addEventListener("change", upd);
    upd();
  }

  /* ====================================================================
     ROUTER, NAV PILL, THEME, COMMAND PALETTE, TOUR
  ==================================================================== */
  const ROUTES: Record<string, string> = {
    home: "Home",
    assess: "Assess",
    "what-if": "What-if",
    applicants: "Applicants",
    batch: "Batch",
    portfolio: "Portfolio",
    model: "Model",
    tutorials: "Tutorials",
    about: "About",
    login: "Sign in",
    profile: "Your profile",
  };
  const PUBLIC_VIEWS = ["home", "login", "about", "model"];
  // Same strings as each route's `metadata`, so a hash move and a full page load show one title.
  const DEFAULT_TITLE = "Saakh - AI-Based Loan Eligibility & Risk Assessment System";
  const PAGE_TITLES: Record<string, string> = {
    assess: "Assess an application",
    "what-if": "What if the numbers changed?",
    applicants: "Applicants",
    batch: "Score a batch",
    portfolio: "Portfolio",
    model: "How the AI decides",
    tutorials: "Tutorial videos",
    about: "About this project",
    login: "Sign in",
    profile: "Your profile",
  };
  const inited: Record<string, boolean> = {};
  function placePill(inst?: boolean) {
    const a = document.querySelector('#nav a[aria-current="page"]') as HTMLElement;
    const pill: any = document.getElementById("navPill");
    if (!pill) return;
    if (!a || !a.offsetHeight) {
      pill.style.opacity = "0";
      return;
    }
    pill.style.opacity = "1";
    if (inst || !pill._pos) {
      pill._pos = { x: 0, y: a.offsetTop, w: a.offsetWidth };
      pill.style.transform = `translate(0,${a.offsetTop}px)`;
      return;
    }
    const from = pill._pos.y;
    pill._pos = { x: 0, y: a.offsetTop };
    anim(pill, [{ transform: `translate(0,${from}px)` }, { transform: `translate(0,${a.offsetTop}px)` }], "snappy");
  }
  function route() {
    if (!sessionLoaded) return;
    let r = (location.hash || "").slice(1);
    if (!ROUTES[r]) {
      const p = location.pathname.replace(/^\/+|\/+$/g, "");
      r = ROUTES[p] ? p : initialView && ROUTES[initialView] ? initialView : "home";
    }
    if (!PUBLIC_VIEWS.includes(r) && !AUTH_USER) {
      RETURN_TO = r;
      location.hash = "login";
      return;
    }
    if (r === "login" && AUTH_USER) {
      location.hash = "profile";
      return;
    }
    document.body.classList.toggle("landing", r === "home" || r === "login");
    document.querySelectorAll(".view").forEach((v: any) => v.classList.toggle("on", v.dataset.view === r));
    document.querySelectorAll("[data-route]").forEach((a: any) => a.setAttribute("aria-current", a.dataset.route === r ? "page" : "false"));
    const cr = document.getElementById("crumb");
    if (cr) cr.textContent = ROUTES[r];
    document.title = PAGE_TITLES[r] ? `${PAGE_TITLES[r]} | Saakh` : DEFAULT_TITLE;
    placePill(!inited._pill);
    inited._pill = true;
    const once: Record<string, () => void> = {
      home: initHome,
      assess: initAssess,
      "what-if": initWhatIf,
      applicants: initApplicants,
      batch: initBatch,
      model: initModel,
      tutorials: () => renderTutorials(document.getElementById("tutRoot")!, hydrateIcons),
    };
    if (r !== "tutorials") pauseTutorials();
    if (!inited[r] && once[r]) {
      once[r]();
      inited[r] = true;
    }
    if (r === "what-if") {
      if (!inited.assess) {
        initAssess();
        inited.assess = true;
      }
      enterWhatIf();
    }
    if (r === "applicants") {
      document.getElementById("appDetail")!.hidden = true;
      document.getElementById("appList")!.hidden = false;
      renderTable();
    }
    if (r === "portfolio") drawPortfolio();
    if (r === "profile") renderProfile();
    requestAnimationFrame(() => {
      document.querySelectorAll(".view.on .seg").forEach((s: any) => s._place && s._place());
      const t: any = document.getElementById("mtabs");
      if (r === "model" && t?._place) t._place();
    });
    if (r !== "home") window.scrollTo({ top: 0 });
  }
  w.__saakhRoute = route;
  window.addEventListener("hashchange", route);
  window.addEventListener("resize", () => {
    placePill(true);
    document.querySelectorAll(".view.on .seg").forEach((s: any) => s._place && s._place());
    const t: any = document.getElementById("mtabs");
    t?._place && t._place();
  });

  function labelTheme(t: string) {
    document.querySelectorAll("#themeBtn,[data-theme-toggle]").forEach((b) =>
      b.setAttribute("aria-label", t === "dark" ? "Switch to light theme" : "Switch to dark theme")
    );
  }
  function setTheme(t: string) {
    document.documentElement.dataset.theme = t;
    try { localStorage.setItem("saakh-theme", t); } catch {}
    labelTheme(t);
  }
  try {
    const t = localStorage.getItem("saakh-theme");
    if (t) document.documentElement.dataset.theme = t;
  } catch {}
  labelTheme(document.documentElement.dataset.theme || "light");
  document.addEventListener("click", (e: any) => {
    if (e.target.closest("#themeBtn,[data-theme-toggle]")) setTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark");
  });

  // Command palette
  const CMDS = [
    ...Object.entries(ROUTES).filter(([k]) => k !== "login").map(([k, v]) => ({
      g: "Go to",
      t: v,
      ic: ({
        home: "house",
        assess: "file-check",
        "what-if": "sliders-horizontal",
        applicants: "users",
        batch: "cloud-upload",
        portfolio: "chart-column-increasing",
        model: "brain",
        tutorials: "play",
        about: "circle-help",
        profile: "id-card",
      } as Record<string, string>)[k],
      run: () => (location.hash = k),
    })),
    ...PERSONAS.map((p, i) => ({
      g: "Load sample applicant",
      t: p.full_name + ", " + p.note,
      ic: "id-card",
      run: () => {
        location.hash = "assess";
        setTimeout(() => {
          const s = document.getElementById("persona") as HTMLSelectElement;
          if (s) {
            s.value = String(i);
            s.dispatchEvent(new Event("change"));
          }
        }, 60);
      },
    })),
    { g: "Actions", t: "Toggle dark theme", ic: "sun-moon", run: () => setTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark") },
    { g: "Actions", t: "Start guided demo", ic: "play", run: () => startTour() },
  ];
  let cmdSel = 0, cmdItems: any[] = [];
  function openCmd() {
    const d = document.getElementById("cmd")!, s = document.getElementById("scrim")!;
    d.classList.add("on");
    s.classList.add("on");
    const i = document.getElementById("cmdIn") as HTMLInputElement;
    i.value = "";
    renderCmd("");
    setTimeout(() => i.focus(), 30);
  }
  function closeCmd() {
    document.getElementById("cmd")?.classList.remove("on");
    document.getElementById("scrim")?.classList.remove("on");
  }
  function renderCmd(q: string) {
    cmdItems = CMDS.filter((c) => c.t.toLowerCase().includes(q.toLowerCase()));
    cmdSel = 0;
    let g = "", h = "";
    cmdItems.forEach((c, i) => {
      if (c.g !== g) {
        g = c.g;
        h += `<li class="grp" role="presentation">${g}</li>`;
      }
      h += `<li><button role="option" class="ih" data-i="${i}" aria-selected="${i === 0}">${iconSvg(c.ic, { a: "pop" })}${c.t}</button></li>`;
    });
    document.getElementById("cmdList")!.innerHTML = h || `<li class="grp">Nothing matches "${esc(q)}"</li>`;
  }
  document.getElementById("cmdBtn")!.onclick = openCmd;
  document.getElementById("scrim")!.onclick = () => {
    closeCmd();
  };
  document.getElementById("cmdIn")?.addEventListener("input", (e: any) => renderCmd(e.target.value));
  document.getElementById("cmdList")?.addEventListener("click", (e: any) => {
    const b = e.target.closest("[data-i]");
    if (b) {
      closeCmd();
      cmdItems[+b.dataset.i].run();
    }
  });
  document.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      document.getElementById("cmd")?.classList.contains("on") ? closeCmd() : openCmd();
    }
    if (!document.getElementById("cmd")?.classList.contains("on")) {
      if (e.key === "Escape") endTour();
      return;
    }
    if (e.key === "Escape") closeCmd();
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      cmdSel = (cmdSel + (e.key === "ArrowDown" ? 1 : -1) + cmdItems.length) % cmdItems.length;
      document.querySelectorAll("#cmdList [data-i]").forEach((b: any) => b.setAttribute("aria-selected", String(+b.dataset.i === cmdSel)));
      document.querySelector(`#cmdList [data-i="${cmdSel}"]`)?.scrollIntoView({ block: "nearest" });
    }
    if (e.key === "Enter" && cmdItems[cmdSel]) {
      e.preventDefault();
      closeCmd();
      cmdItems[cmdSel].run();
    }
  });
  document.getElementById("moreBtn")!.onclick = openCmd;

  /* ====================================================================
     ACCOUNTS: sign in, register, profile
  ==================================================================== */
  function firstName(u: any) {
    return String(u?.full_name || "").trim().split(/\s+/)[0] || "Account";
  }
  function updateAuthUI() {
    const topA = document.getElementById("authBtn") as HTMLAnchorElement | null;
    const landA = document.getElementById("landAuth") as HTMLAnchorElement | null;
    [topA, landA].forEach((a) => {
      if (!a) return;
      a.textContent = AUTH_USER ? firstName(AUTH_USER) : "Sign in";
      a.title = AUTH_USER ? AUTH_USER.full_name : ""; // a long name shortens with an ellipsis on phones
      a.href = AUTH_USER ? "#profile" : "#login";
    });
    const pl = document.getElementById("navProfileLink");
    if (pl) pl.style.display = AUTH_USER ? "flex" : "none";
    const rail = document.getElementById("railAuth");
    if (!rail) return;
    rail.textContent = "";
    if (AUTH_USER) {
      const who = document.createElement("a");
      who.className = "who";
      who.href = "#profile";
      who.title = `${AUTH_USER.full_name}, ${AUTH_USER.email}`; // both lines shorten with an ellipsis in the narrow rail
      const b = document.createElement("b");
      b.textContent = AUTH_USER.full_name;
      const sp = document.createElement("span");
      sp.textContent = AUTH_USER.email;
      who.append(b, sp);
      const out = document.createElement("button");
      out.className = "btn btn-ghost btn-sm";
      out.type = "button";
      out.textContent = "Sign out";
      out.onclick = () => signOut(false);
      rail.append(who, out);
    } else {
      const a = document.createElement("a");
      a.className = "btn btn-primary btn-sm";
      a.href = "#login";
      a.textContent = "Sign in";
      rail.append(a);
    }
  }
  // Someone who just registered would otherwise come back to "Create your account" and be told the email is taken.
  function showSignInMode() {
    (document.querySelector('#authSeg [data-v="login"]') as HTMLElement | null)?.click();
  }
  function signOut(expired: boolean) {
    const hadUser = !!AUTH_USER;
    setToken("");
    AUTH_USER = null;
    updateAuthUI();
    if (hadUser || expired) toast(expired ? "Your session expired. Sign in again." : "You are signed out", expired ? "bad" : "ok");
    showSignInMode();
    location.hash = "login";
    route();
  }
  async function loadSession() {
    const t = getToken();
    if (!t) return;
    try {
      const r = await fetch(`${API_BASE}/api/auth/me`, { headers: { Authorization: `Bearer ${t}` } });
      if (r.ok) { AUTH_USER = await r.json(); return; }
      else if (r.status === 401) { setToken(""); return; }
    } catch {
      // API unreachable
    }
  }
  function apiError(body: any, fallback: string): string {
    const d = body && body.detail;
    if (typeof d === "string") return d;
    if (Array.isArray(d) && d.length) return d.map((x: any) => String(x.msg || "").replace(/^Value error, /, "")).filter(Boolean).join(" ") || fallback;
    return fallback;
  }
  async function authCall(path: string, method: string, body?: any) {
    try {
      const r = await fetch(`${API_BASE}${path}`, {
        method,
        headers: { "Content-Type": "application/json", ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}) },
        body: body ? JSON.stringify(body) : undefined,
      });
      if (r.ok || (r.status >= 400 && r.status < 500)) {
        const data = await r.json().catch(() => ({}));
        return { ok: r.ok, status: r.status, data };
      }
    } catch {
      // Network failure: reported below, like a 5xx. Sign-in must never succeed without the server.
    }
    return { ok: false, status: 503, data: { detail: "Cannot reach the Saakh server right now. Check that it is running and try again." } };
  }
  function setBusy(btn: HTMLButtonElement, busy: boolean, label?: string) {
    btn.disabled = busy;
    btn.setAttribute("aria-busy", String(busy));
    const l = btn.querySelector(".lbl");
    if (l && label) l.textContent = label;
  }
  function onSignedIn(data: any, msg: string) {
    setToken(data.token);
    AUTH_USER = data.user;
    updateAuthUI();
    syncBackendHistory();
    toast(msg);
    const go = RETURN_TO && RETURN_TO !== "login" ? RETURN_TO : "assess";
    RETURN_TO = "";
    location.hash = go;
  }
  function initAuth() {
    let mode = "login";
    const $ = (id: string) => document.getElementById(id) as HTMLInputElement;
    const err = document.getElementById("authErr")!;
    const apply = (m: string) => {
      mode = m;
      const reg = m === "register";
      (document.getElementById("fa_name_f") as HTMLElement).hidden = !reg;
      document.getElementById("authTitle")!.textContent = reg ? "Create your account" : "Sign in";
      document.getElementById("authSub")!.textContent = reg ? "Create a free account to run assessments and keep your history." : "Sign in to run assessments and keep your history.";
      $("fa_pw").autocomplete = reg ? "new-password" : "current-password";
      document.getElementById("fa_pw_help")!.textContent = reg ? "At least 8 characters with a letter and a number." : "";
      document.querySelector("#authSubmit .lbl")!.textContent = reg ? "Create account" : "Sign in";
      err.textContent = "";
    };
    segInit(document.getElementById("authSeg"), apply);
    const demoBtn = document.getElementById("demoCredBtn");
    // The API only creates the demo account outside production, so do not advertise it on a public deployment.
    if (!/^https?:\/\/(localhost|127\.0\.0\.1)(:|\/|$)/.test(API_BASE) && demoBtn?.parentElement) demoBtn.parentElement.style.display = "none";
    if (demoBtn) {
      demoBtn.onclick = () => {
        $("fa_email").value = "officer@saakh.ai";
        $("fa_pw").value = "Saakh2026!";
      };
    }
    document.getElementById("authForm")!.addEventListener("submit", async (e) => {
      e.preventDefault();
      err.textContent = "";
      const email = $("fa_email").value.trim();
      const password = $("fa_pw").value;
      const full_name = $("fa_name").value.trim();
      if (!/^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/.test(email)) { err.textContent = "Enter a valid email address."; $("fa_email").focus(); return; }
      if (!password) { err.textContent = "Enter your password."; $("fa_pw").focus(); return; }
      if (mode === "register") {
        if (!/^[A-Za-z .'-]{2,80}$/.test(full_name)) { err.textContent = "Enter your full name using letters only."; $("fa_name").focus(); return; }
        if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) { err.textContent = "Password must be at least 8 characters with a letter and a number."; $("fa_pw").focus(); return; }
      }
      const btn = document.getElementById("authSubmit") as HTMLButtonElement;
      const idle = mode === "register" ? "Create account" : "Sign in";
      setBusy(btn, true, mode === "register" ? "Creating..." : "Signing in...");
      const res = await authCall(`/api/auth/${mode}`, "POST", mode === "register" ? { email, password, full_name } : { email, password });
      setBusy(btn, false, idle);
      if (!res.ok) { err.textContent = apiError(res.data, "Something went wrong. Try again."); return; }
      $("fa_pw").value = "";
      onSignedIn(res.data, mode === "register" ? `Welcome to Saakh, ${firstName(res.data.user)}` : `Welcome back, ${firstName(res.data.user)}`);
    });

    // ---- profile
    const pe = document.getElementById("profErr")!;
    document.getElementById("profForm")!.addEventListener("submit", async (e) => {
      e.preventDefault();
      pe.textContent = "";
      const body: any = {
        full_name: $("pf_name").value.trim(),
        phone: $("pf_phone").value.trim(),
        city: $("pf_city").value.trim(),
        employment_type: $("pf_emp").value,
      };
      // Blank clears the income. The API ignores nulls, and the page already shows 0 as blank.
      body.monthly_income = Number($("pf_inc").value.replace(/[^0-9]/g, ""));
      const btn = document.getElementById("profSave") as HTMLButtonElement;
      setBusy(btn, true, "Saving...");
      const res = await authCall("/api/auth/me", "PATCH", body);
      setBusy(btn, false, "Save profile");
      if (!res.ok) { pe.textContent = apiError(res.data, "Could not save your profile."); return; }
      AUTH_USER = res.data;
      updateAuthUI();
      renderProfile();
      toast("Profile saved");
    });
    const we = document.getElementById("pwErr")!;
    document.getElementById("pwForm")!.addEventListener("submit", async (e) => {
      e.preventDefault();
      we.textContent = "";
      const btn = document.getElementById("pwSave") as HTMLButtonElement;
      setBusy(btn, true, "Updating...");
      const res = await authCall("/api/auth/change-password", "POST", { current_password: $("pw_cur").value, new_password: $("pw_new").value });
      setBusy(btn, false, "Update password");
      if (!res.ok) { we.textContent = apiError(res.data, "Could not update the password."); return; }
      $("pw_cur").value = "";
      $("pw_new").value = "";
      toast("Password updated");
    });
    document.getElementById("profSignOut")!.addEventListener("click", () => signOut(false));
    document.getElementById("profDelete")!.addEventListener("click", async () => {
      if (!window.confirm("Delete your account permanently? This cannot be undone.")) return;
      const res = await authCall("/api/auth/me", "DELETE");
      if (!res.ok) { pe.textContent = apiError(res.data, "Could not delete the account."); return; }
      AUTH_USER = null;
      setToken("");
      updateAuthUI();
      showSignInMode();
      toast("Your account was deleted");
      location.hash = "home";
    });
  }
  function renderProfile() {
    if (!AUTH_USER) return;
    const set = (id: string, v: any) => ((document.getElementById(id) as HTMLInputElement).value = v == null ? "" : String(v));
    set("pf_name", AUTH_USER.full_name);
    set("pf_email", AUTH_USER.email);
    set("pf_phone", AUTH_USER.phone);
    set("pf_city", AUTH_USER.city);
    set("pf_emp", AUTH_USER.employment_type);
    set("pf_inc", AUTH_USER.monthly_income ? AUTH_USER.monthly_income : "");
    document.getElementById("profSub")!.textContent = `Signed in as ${AUTH_USER.email}.`;
    const since = AUTH_USER.created_at ? new Date(AUTH_USER.created_at) : null;
    document.getElementById("profSince")!.textContent = since && !isNaN(+since) ? `Member since ${since.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}.` : "";
  }

  // Guided demo (F24)
  const TOUR = [
    ["home", "#sentence", "Try it live", "Change any underlined value. The model re-scores instantly and the marker moves along the A to E risk ruler."],
    ["assess", "#persona", "Sample data", "Eight demo personas cover every outcome. Ananya Rao is loaded: a salaried engineer asking for a ₹6 lakh personal loan."],
    ["assess", "#runBtn", "Run the model", "Press Run assessment. The sheet scans, the marker settles on the estimated risk, the headline is highlighted and the decision is stamped."],
    ["assess", "#fbars", "Explainable AI", "SHAP values show which inputs lowered or raised the risk, in percentage points. Hover a row for the plain-language reason."],
    ["what-if", "#wiSliders", "What-if simulator", "Move any slider and the model re-scores instantly. The cards below show the smallest single change that earns a better grade."],
    ["applicants", ".tbl", "History", "Every assessment is stored. Open a row to see the full decision with a shared-element transition."],
    ["portfolio", "#kpis", "Portfolio view", "Risk teams see the sanction rate, average default risk and expected loss across all applications."],
    ["model", "#pipe", "How the AI decides", "Policy rules, engineered features, a monotone XGBoost model, calibration and SHAP explanations, in that order."],
  ];
  let tourI = -1;
  function startTour() {
    tourI = 0;
    showTour();
  }
  function endTour() {
    tourI = -1;
    const sp = document.getElementById("spot"), tc = document.getElementById("tour");
    if (sp) sp.style.display = "none";
    if (tc) tc.style.display = "none";
  }
  function showTour() {
    const [r, sel, t, p] = TOUR[tourI];
    const tourStep = tourI;
    const sheet = document.getElementById("asheet");
    // Protected pages would bounce a signed-out visitor to Sign in and leave the card pointing at nothing.
    if (!PUBLIC_VIEWS.includes(r) && !AUTH_USER) {
      const sp = document.getElementById("spot")!, tc = document.getElementById("tour")!;
      sp.style.display = "none";
      document.getElementById("tourT")!.textContent = t;
      document.getElementById("tourP")!.textContent = `${p} Sign in to see this step on the live page, or press Next to read on.`;
      document.getElementById("tourN")!.textContent = `Step ${tourI + 1} of ${TOUR.length}`;
      document.getElementById("tourNext")!.textContent = tourI === TOUR.length - 1 ? "Finish" : "Next";
      tc.style.display = "block";
      tc.style.top = Math.max(16, (innerHeight - tc.offsetHeight) / 2) + "px";
      tc.style.left = Math.max(16, (innerWidth - tc.offsetWidth) / 2) + "px";
      return;
    }
    if (location.hash.slice(1) !== r) location.hash = r;
    setTimeout(() => {
      if (tourStep !== tourI) return; // ended or moved on while waiting
      if (sel === "#persona") {
        const s = document.getElementById("persona") as HTMLSelectElement;
        s.value = "0";
        s.dispatchEvent(new Event("change"));
      }
      const el = document.querySelector(`.view.on ${sel}`) || document.querySelector(sel);
      if (!el) return;
      // On phones these targets live in the bottom drawer, which is closed otherwise.
      if (sheet && window.innerWidth < 768) sheet.classList.toggle("open", sheet.contains(el));
      el.scrollIntoView({ block: "center", behavior: reduce ? "auto" : "smooth" });
      setTimeout(() => {
        if (tourStep !== tourI) return;
        const b = el.getBoundingClientRect();
        const sp = document.getElementById("spot")!, tc = document.getElementById("tour")!;
        sp.style.display = "block";
        Object.assign(sp.style, {
          left: b.left - 8 + "px",
          top: b.top - 8 + "px",
          width: b.width + 16 + "px",
          height: Math.min(b.height, innerHeight * 0.6) + 16 + "px",
        });
        document.getElementById("tourT")!.textContent = t;
        document.getElementById("tourP")!.textContent = p;
        document.getElementById("tourN")!.textContent = `Step ${tourI + 1} of ${TOUR.length}`;
        document.getElementById("tourNext")!.textContent = tourI === TOUR.length - 1 ? "Finish" : "Next";
        tc.style.display = "block";
        const below = b.top + Math.min(b.height, innerHeight * 0.6) + 24;
        const cardH = tc.offsetHeight;
        const top = below + cardH + 16 < innerHeight ? below : b.top - cardH - 24;
        // On a phone the target can fill the screen, leaving no room above or below it: keep the card visible.
        tc.style.top = Math.max(16, Math.min(top, innerHeight - cardH - 16)) + "px";
        tc.style.left = Math.min(innerWidth - tc.offsetWidth - 16, Math.max(16, b.left)) + "px";
        anim(tc, [{ opacity: 0, transform: "translateY(6px)" }, { opacity: 1, transform: "none" }], "gentle");
      }, reduce ? 0 : 420);
    }, 80);
  }
  document.getElementById("tourNext")!.onclick = () => {
    if (tourI >= TOUR.length - 1) {
      endTour();
      toast("Guided demo finished");
      return;
    }
    tourI++;
    showTour();
  };
  document.getElementById("tourEnd")!.onclick = endTour;
  document.getElementById("tourBtn")!.onclick = startTour;
  document.getElementById("aboutTour")!.onclick = startTour;

  if (initialView && (!location.hash || location.hash === "#home") && initialView !== "home") {
    location.hash = initialView;
  }
  hydrateIcons();
  initAuth();
  updateAuthUI();
  loadSession().then(() => {
    sessionLoaded = true;
    updateAuthUI();
    route();
  });
}
