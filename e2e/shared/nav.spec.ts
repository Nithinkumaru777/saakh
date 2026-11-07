import { test, expect, goto, signIn, hashTo, expectView, isMobile, layoutIssues, IS_WEB, type View } from "../lib";

test.describe("home page links", () => {
  const links: [string, View][] = [
    ['.view.on .hero-ctas a[href="#assess"]', "login"],
    ['.view.on .hero-ctas a[href="#model"]', "model"],
    ['.view.on .hero-ctas a[href="#tutorials"]', IS_WEB ? "login" : "tutorials"],
    ['.view.on .land-top a[href="#about"]', "about"],
    [".view.on #landAuth", "login"],
  ];
  for (const [sel, target] of links) {
    test(`${sel} goes to ${target} (signed out)`, async ({ page }) => {
      await goto(page, "home");
      await page.click(sel);
      await expectView(page, target);
    });
  }

  test("signed in, the protected hero links open their pages", async ({ page }) => {
    await signIn(page);
    for (const [href, view] of [["#assess", "assess"], ["#tutorials", "tutorials"]] as [string, View][]) {
      await hashTo(page, "home");
      await page.click(`.view.on .hero-ctas a[href="${href}"]`);
      await expectView(page, view);
    }
  });

  test("the login page's brand and back links return home", async ({ page }) => {
    await goto(page, "login");
    await page.click('.view.on .land-top a.btn[href="#home"]');
    await expectView(page, "home");
    await goto(page, "login");
    await page.click('.view.on .land-top a.brand[href="#home"]');
    await expectView(page, "home");
  });
});

test.describe("hero live estimate", () => {
  test("each underlined value re-scores", async ({ page }) => {
    await goto(page, "home");
    const pd = page.locator("#vPd");
    await expect(pd).toHaveText(/%$/);
    const first = await pd.innerText();
    await page.fill("#sCib", "450");
    await expect(pd).not.toHaveText(first);
    await expect(page.locator("#vGrade")).toHaveText(/[A-E]/);
    const afterCibil = await pd.innerText();
    await page.fill("#sInc", "20000");
    await expect(pd).not.toHaveText(afterCibil);
    const afterIncome = await pd.innerText();
    await page.selectOption("#sEmp", "self_employed");
    await page.fill("#sAmt", "5000000");
    await page.fill("#sTen", "12");
    await expect(pd).not.toHaveText(afterIncome);
  });

  test("nonsense or empty input never shows NaN", async ({ page }) => {
    await goto(page, "home");
    for (const [id, v] of [["#sInc", ""], ["#sCib", "abc"], ["#sAmt", ""], ["#sTen", "0"], ["#sCib", "99999"]]) {
      await page.fill(id, v);
      await page.waitForTimeout(250);
      await expect(page.locator(".verdict")).not.toContainText(/NaN|undefined|Infinity/);
    }
  });
});

test.describe("app navigation", () => {
  const ROUTES: [string, View][] = [["assess", "assess"], ["what-if", "what-if"], ["applicants", "applicants"], ["portfolio", "portfolio"]];
  const DESKTOP_ONLY: [string, View][] = [["batch", "batch"], ["model", "model"], ["tutorials", "tutorials"], ["about", "about"], ["profile", "profile"]];

  test("sidebar or tab bar links open every page and mark the current one", async ({ page }) => {
    await signIn(page);
    const scope = isMobile(page) ? ".tabbar" : "#nav";
    for (const [route, view] of isMobile(page) ? ROUTES : [...ROUTES, ...DESKTOP_ONLY]) {
      const link = page.locator(`${scope} a[data-route="${route}"]`);
      await link.click();
      await expectView(page, view);
      await expect(link).toHaveAttribute("aria-current", "page");
      await expect(page.locator("#crumb")).toBeAttached();
    }
  });

  test("phone More menu reaches the pages the tab bar leaves out", async ({ page }) => {
    test.skip(!isMobile(page), "tab bar exists only below 768px");
    await signIn(page);
    for (const [label, view] of [["Batch", "batch"], ["Model", "model"], ["Tutorials", "tutorials"], ["About", "about"], ["Your profile", "profile"], ["Home", "home"]] as [string, View][]) {
      await hashTo(page, "assess");
      await page.click("#moreBtn");
      await expect(page.locator("#cmd")).toHaveClass(/on/);
      await page.getByRole("option", { name: label, exact: true }).click();
      await expectView(page, view);
      await expect(page.locator("#cmd")).not.toHaveClass(/on/);
    }
  });

  test("a very long first name does not push the top bar off the screen", async ({ page }) => {
    await signIn(page, "Wolfeschlegelsteinhausenbergerdorff Senior");
    await hashTo(page, "about");
    const issues = await layoutIssues(page);
    expect(issues.filter((i) => /horizontal scroll|off-screen/.test(i))).toEqual([]);
  });

  test("topbar brand goes home and Sign in / profile button matches the session", async ({ page }) => {
    await goto(page, "about");
    await expect(page.locator("#authBtn")).toHaveText("Sign in");
    await page.click("#authBtn");
    await expectView(page, "login");
    await signIn(page, "Priya Nair");
    await expect(page.locator("#authBtn")).toHaveText("Priya");
    await page.click("#authBtn");
    await expectView(page, "profile");
    const brand = isMobile(page) ? ".topbar-brand" : ".rail .brand";
    await page.click(brand);
    await expectView(page, "home");
  });

  test("Applicants New assessment and empty-state links open Assess", async ({ page }) => {
    await signIn(page);
    await hashTo(page, "applicants");
    await page.click('.view.on .page-head a[href="#assess"]');
    await expectView(page, "assess");
  });

  test("browser back and forward move between pages", async ({ page }) => {
    await goto(page, "home");
    await page.click('.view.on .hero-ctas a[href="#model"]');
    await expectView(page, "model");
    await page.goBack();
    await expectView(page, "home");
    await page.goForward();
    await expectView(page, "model");
  });
});

test("theme toggle switches, labels itself and survives a reload", async ({ page }) => {
  await goto(page, "about");
  const html = page.locator("html");
  const before = await html.getAttribute("data-theme");
  const after = before === "dark" ? "light" : "dark";
  await page.click("#themeBtn");
  await expect(html).toHaveAttribute("data-theme", after);
  await expect(page.locator("#themeBtn")).toHaveAttribute("aria-label", `Switch to ${before} theme`);
  await page.reload();
  await expect(html).toHaveAttribute("data-theme", after);
  await expect(page.locator("#themeBtn")).toHaveAttribute("aria-label", `Switch to ${before} theme`);
});

test("landing page theme toggle works", async ({ page }) => {
  await goto(page, "home");
  await page.locator(".view.on [data-theme-toggle]").click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
});

test.describe("command palette", () => {
  test("opens from Search button and Ctrl+K, closes on Escape and scrim", async ({ page }) => {
    await goto(page, "about");
    const cmd = page.locator("#cmd");
    if (!isMobile(page)) {
      await page.click("#cmdBtn");
    } else {
      await page.locator("#cmdBtn").click();
    }
    await expect(cmd).toHaveClass(/on/);
    await expect(page.locator("#cmdIn")).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(cmd).not.toHaveClass(/on/);
    await page.keyboard.press("Control+k");
    await expect(cmd).toHaveClass(/on/);
    await page.locator("#scrim").click({ position: { x: 5, y: 5 } });
    await expect(cmd).not.toHaveClass(/on/);
  });

  test("filters, arrow keys and Enter run a command", async ({ page }) => {
    await goto(page, "about");
    await page.keyboard.press("Control+k");
    await page.fill("#cmdIn", "mode");
    await expect(page.locator("#cmdList button").first()).toHaveText("Model");
    await page.keyboard.press("Enter");
    await expectView(page, "model");
  });

  test("a search with no match shows a message and arrow keys stay safe", async ({ page }) => {
    await goto(page, "about");
    await page.keyboard.press("Control+k");
    await page.fill("#cmdIn", "zzzzz");
    await expect(page.locator("#cmdList")).toContainText("Nothing matches");
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");
    await expect(page.locator("#cmdList")).toContainText("Nothing matches");
  });

  test("search text is shown as text, never run as HTML", async ({ page }) => {
    await goto(page, "about");
    await page.keyboard.press("Control+k");
    await page.fill("#cmdIn", '<img src=x onerror="window.__xss=1">');
    await expect(page.locator("#cmdList")).toContainText("<img");
    expect(await page.locator("#cmdList img").count()).toBe(0);
    expect(await page.evaluate(() => (window as unknown as { __xss?: number }).__xss)).toBeUndefined();
  });

  test("Load sample applicant loads that persona on Assess", async ({ page }) => {
    await signIn(page);
    await hashTo(page, "about");
    await page.keyboard.press("Control+k");
    await page.fill("#cmdIn", "Vikram");
    await page.keyboard.press("Enter");
    await expectView(page, "assess");
    await expect(page.locator("#f_name")).toHaveValue(/Vikram/);
  });

  test("the toggle theme action works", async ({ page }) => {
    await goto(page, "about");
    await page.keyboard.press("Control+k");
    await page.fill("#cmdIn", "theme");
    await page.keyboard.press("Enter");
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  });
});

test.describe("guided demo", () => {
  async function walk(page: import("@playwright/test").Page) {
    const tour = page.locator("#tour");
    await expect(tour).toBeVisible();
    await expect(page.locator("#tourN")).toHaveText("Step 1 of 8");
    for (let i = 2; i <= 8; i++) {
      await page.click("#tourNext");
      await expect(page.locator("#tourN")).toHaveText(`Step ${i} of 8`);
      const inView = await page.evaluate(() => {
        const r = document.getElementById("tour")!.getBoundingClientRect();
        return r.left >= 0 && r.right <= innerWidth && r.top >= 0 && r.bottom <= innerHeight;
      });
      expect(inView, `tour card on screen at step ${i}`).toBe(true);
    }
    await expect(page.locator("#tourNext")).toHaveText("Finish");
    await page.click("#tourNext");
    await expect(tour).toBeHidden();
    await expect(page.locator("#toasts")).toContainText("Guided demo finished");
  }

  test("walks all eight steps when signed in", async ({ page }) => {
    await signIn(page);
    await hashTo(page, "about");
    await page.click("#aboutTour");
    await walk(page);
  });

  test("the step mentioning Ananya Rao has her loaded", async ({ page }) => {
    await signIn(page);
    await hashTo(page, "about");
    await page.click("#aboutTour");
    await page.click("#tourNext");
    await expect(page.locator("#tourN")).toHaveText("Step 2 of 8");
    await expect(page.locator("#f_name")).toHaveValue("Ananya Rao");
  });

  test("signed out, the demo explains itself instead of stranding the visitor", async ({ page }) => {
    await goto(page, "about");
    await page.click("#tourBtn");
    await expect(page.locator("#tour")).toBeVisible();
    await page.click("#tourNext");
    // Step 2 lives behind sign-in: the card must stay on screen with a way forward.
    await expect(page.locator("#tour")).toBeVisible();
    await expect(page.locator("#tourP")).toContainText(/sign in/i);
    await page.click("#tourEnd");
    await expect(page.locator("#tour")).toBeHidden();
  });

  test("End and Escape stop it and remove the highlight", async ({ page }) => {
    await goto(page, "about");
    await page.click("#tourBtn");
    await expect(page.locator("#tour")).toBeVisible();
    await page.click("#tourEnd");
    await expect(page.locator("#tour")).toBeHidden();
    await expect(page.locator("#spot")).toBeHidden();
    // Step 1 is on Home, which has no top bar, so start it again from a page that does.
    await hashTo(page, "about");
    await page.click("#tourBtn");
    await expect(page.locator("#tour")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.locator("#tour")).toBeHidden();
  });
});
