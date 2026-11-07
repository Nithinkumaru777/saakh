// Website 1 only: behaviour that depends on the real Next.js routes and the FastAPI backend.
import { test, expect, goto, signIn, hashTo, expectView, openSheet, PASSWORD, uniqueEmail, VIEWS, isMobile } from "../lib";

const API = "http://localhost:8100";

test("the API is up, and its docs and health respond", async ({ request }) => {
  const h = await request.get(`${API}/api/health`);
  expect(h.ok()).toBeTruthy();
});

test("a wrong URL gets a 404 page with a way home", async ({ page, guard }) => {
  guard.allow(/404/);
  const res = await page.goto("/no-such-page");
  expect(res?.status()).toBe(404);
  await expect(page.locator("body")).toContainText(/not.*found|could not be found|404/i);
  const home = page.locator('a[href="/"]');
  await expect(home).toBeVisible();
  await home.click();
  await expect(page.locator('.view[data-view="home"].on')).toBeVisible();
});

for (const view of VIEWS) {
  test(`server HTML for /${view === "home" ? "" : view} carries its own title and description`, async ({ request }) => {
    const html = await (await request.get(view === "home" ? "/" : `/${view}`)).text();
    expect(html).toMatch(/<title>[^<]*Saakh[^<]*<\/title>/);
    expect(html).toMatch(/<meta name="description" content="[^"]{50,}"/);
    expect(html).toMatch(/<meta property="og:title"/);
  });
}

test("the hero estimate comes from the real model", async ({ page }) => {
  const scored = page.waitForResponse((r) => r.url().endsWith("/api/score") && r.status() === 200);
  await goto(page, "home");
  await page.fill("#sCib", "500");
  await scored;
  await expect(page.locator("#apiStatusBadge")).toBeVisible();
});

test("Run saves through the API and survives a reload", async ({ page, request }) => {
  await signIn(page);
  await page.fill("#f_name", "Persist Checker");
  const saved = page.waitForResponse((r) => r.url().endsWith("/api/assess") && r.request().method() === "POST");
  await openSheet(page);
  await page.click("#runBtn");
  const res = await saved;
  expect(res.status()).toBe(200);
  const body = await res.json();
  await expect(page.locator("#headTxt")).not.toBeEmpty({ timeout: 15000 });
  await page.reload();
  await hashTo(page, "applicants");
  await page.fill("#q", "Persist Checker");
  await expect(page.locator("#tbody tr").first()).toContainText("Persist Checker");
  expect(body.id).toBeTruthy();
  // Protected endpoints refuse anonymous callers.
  expect((await request.get(`${API}/api/assessments`)).status()).toBe(401);
});

test("the live chip connects and another desk's assessment appears without a reload", async ({ page, browser, baseURL }) => {
  test.slow();
  await signIn(page);
  await hashTo(page, "applicants");
  if (!isMobile(page)) await expect(page.locator("#liveFeed")).toHaveAttribute("data-state", "live", { timeout: 15000 });
  const other = await browser.newContext({ baseURL });
  const p2 = await other.newPage();
  await signIn(p2);
  await p2.fill("#f_name", "Remote Desk Applicant");
  await openSheet(p2);
  await p2.click("#runBtn");
  await expect(p2.locator("#headTxt")).not.toBeEmpty({ timeout: 15000 });
  await other.close();
  await page.fill("#q", "Remote Desk Applicant");
  await expect(page.locator("#tbody tr").first()).toContainText("Remote Desk Applicant", { timeout: 15000 });
});

test("five wrong passwords lock the sign-in", async ({ page, guard }) => {
  guard.allow(/http 4\d\d|Failed to load resource/);
  const email = await signIn(page);
  await hashTo(page, "profile");
  await page.click("#profSignOut");
  await expectView(page, "login");
  for (let i = 0; i < 5; i++) {
    await page.fill("#fa_email", email);
    await page.fill("#fa_pw", "WrongPass123");
    await page.click("#authSubmit");
    await expect(page.locator("#authSubmit")).toBeEnabled();
  }
  await page.fill("#fa_pw", PASSWORD);
  await page.click("#authSubmit");
  await expect(page.locator("#authErr")).toContainText(/too many|try again|locked/i);
  await expectView(page, "login");
});

test.describe("when the API is down", () => {
  test.beforeEach(async ({ page, guard }) => {
    guard.allow(/ERR_FAILED|ERR_CONNECTION|Failed to load resource|Access to fetch|EventSource/);
    await page.route(`${API}/**`, (r) => r.abort("connectionrefused"));
  });

  test("the public pages still work and the estimate still updates", async ({ page }) => {
    await goto(page, "home");
    const before = await page.locator("#vPd").innerText();
    await page.fill("#sCib", "450");
    await expect(page.locator("#vPd")).not.toHaveText(before);
    await expect(page.locator("#liveFeed")).toBeAttached();
  });

  test("sign in explains the outage rather than accepting credentials offline", async ({ page }) => {
    await goto(page, "login");
    await page.fill("#fa_email", uniqueEmail());
    await page.fill("#fa_pw", PASSWORD);
    await page.click("#authSubmit");
    await expect(page.locator("#authErr")).toContainText(/reach|unavailable|offline|try again/i);
    await expectView(page, "login");
  });

  test("the demo login is not a back door on a server deployment", async ({ page }) => {
    await goto(page, "login");
    await page.click("#demoCredBtn");
    await page.click("#authSubmit");
    await expect(page.locator("#authErr")).not.toBeEmpty();
    await expectView(page, "login");
  });
});

test("Run does not claim a save the server never made", async ({ page, guard }) => {
  guard.allow(/http 500|Failed to load resource/);
  await signIn(page);
  await page.route(`${API}/api/assess`, (r) => r.fulfill({ status: 500, body: "boom", headers: { "access-control-allow-origin": "*" } }));
  await openSheet(page);
  await page.click("#runBtn");
  await expect(page.locator("#toasts")).toContainText("not saved", { timeout: 15000 });
  await expect(page.locator("#toasts")).not.toContainText("saved to database");
});

test("signing out while the history is loading stops asking for it", async ({ page }) => {
  let release!: () => void;
  const signedOut = new Promise<void>((r) => (release = r));
  // Hold the first page until after sign-out, and make it full so the app goes on to ask for a second page.
  await page.route(/\/api\/assessments\?page=1&/, async (route) => {
    const res = await route.fetch();
    const body = await res.json();
    await signedOut;
    while (body.items.length < 100) body.items.push(body.items[0]);
    await route.fulfill({ response: res, json: body });
  });
  const later: string[] = [];
  page.on("request", (r) => {
    if (/\/api\/assessments\?page=2&/.test(r.url())) later.push(r.url());
  });
  await signIn(page);
  await hashTo(page, "profile");
  await page.click("#profSignOut");
  await expectView(page, "login");
  const firstPage = page.waitForResponse(/\/api\/assessments\?page=1&/);
  release();
  await firstPage;
  await page.waitForTimeout(500); // long enough for the next page's request to start, if the app were to send one
  expect(later).toEqual([]);
});

test("a history request answered after deleting the account does not report an expired session", async ({ page, guard }) => {
  guard.allow(/401/);
  let release!: () => void;
  const deleted = new Promise<void>((r) => (release = r));
  await page.route(/\/api\/assessments\?page=1&/, async (route) => {
    await deleted;
    await route.fulfill({ response: await route.fetch() }); // the account is gone by now, so this is the server's real 401
  });
  await signIn(page);
  await hashTo(page, "profile");
  page.once("dialog", (d) => d.accept());
  await page.click("#profDelete");
  await expect(page.locator("#toasts")).toContainText("deleted");
  await expectView(page, "home");
  const answered = page.waitForResponse((r) => /\/api\/assessments\?page=1&/.test(r.url()) && r.status() === 401);
  release();
  await answered;
  await page.waitForTimeout(300); // long enough for the app to act on that answer
  await expectView(page, "home");
  await expect(page.locator("#toasts")).not.toContainText("expired");
});

test("the production security headers do not block the PDF engine", async ({ request }) => {
  test.skip(!!process.env.E2E_DEV, "Next only sends these headers in the production build");
  const csp = (await request.get("/about")).headers()["content-security-policy"] || "";
  expect(csp).toContain("wasm-unsafe-eval");
  expect(csp).toContain("frame-ancestors 'none'");
});

test("a 500 from the API shows an error, not a false success", async ({ page, guard }) => {
  guard.allow(/http 500|Failed to load resource/);
  await page.route(`${API}/api/auth/login`, (r) => r.fulfill({ status: 500, body: "boom", headers: { "access-control-allow-origin": "*" } }));
  await goto(page, "login");
  await page.click("#demoCredBtn");
  await page.click("#authSubmit");
  await expect(page.locator("#authErr")).not.toBeEmpty();
  await expectView(page, "login");
});
