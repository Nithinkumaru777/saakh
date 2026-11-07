import { test, expect, goto, signIn, hashTo, expectView, uniqueEmail, PASSWORD, IS_WEB } from "../lib";

const ALLOW_4XX = /http 4\d\d: .*\/api\/auth|Failed to load resource/;

test.describe("sign in form", () => {
  test("empty submit shows a message and stays put", async ({ page }) => {
    await goto(page, "login");
    await page.click("#authSubmit");
    await expect(page.locator("#authErr")).toHaveText("Enter a valid email address.");
    await expect(page.locator("#fa_email")).toBeFocused();
    await expectView(page, "login");
  });

  test("bad email and missing password are rejected", async ({ page }) => {
    await goto(page, "login");
    await page.fill("#fa_email", "not-an-email");
    await page.fill("#fa_pw", "x");
    await page.click("#authSubmit");
    await expect(page.locator("#authErr")).toHaveText("Enter a valid email address.");
    await page.fill("#fa_email", "a@example.com");
    await page.fill("#fa_pw", "");
    await page.click("#authSubmit");
    await expect(page.locator("#authErr")).toHaveText("Enter your password.");
  });

  test("wrong password shows an error and does not sign in", async ({ page, guard }) => {
    guard.allow(ALLOW_4XX);
    await goto(page, "login");
    await page.fill("#fa_email", uniqueEmail());
    await page.fill("#fa_pw", "WrongPass123");
    await page.click("#authSubmit");
    await expect(page.locator("#authErr")).toContainText(/incorrect/i);
    await expectView(page, "login");
    await expect(page.locator("#authBtn")).toHaveText("Sign in");
  });

  test("Use demo fills the form and the demo account signs in", async ({ page }) => {
    await goto(page, "login");
    await page.click("#demoCredBtn");
    await expect(page.locator("#fa_email")).toHaveValue("officer@saakh.ai");
    await page.click("#authSubmit");
    await expectView(page, "assess");
    await expect(page.locator("#authBtn")).not.toHaveText("Sign in");
  });

  test("pressing Enter in the password box submits", async ({ page }) => {
    await goto(page, "login");
    await page.click("#demoCredBtn");
    await page.focus("#fa_pw");
    await page.keyboard.press("Enter");
    await expectView(page, "assess");
  });

  test("a signed-in visitor opening the login page goes to their profile", async ({ page }) => {
    await signIn(page);
    await hashTo(page, "profile");
    await page.evaluate(() => { location.hash = "login"; });
    await expectView(page, "profile");
  });
});

test.describe("create account form", () => {
  test("switching mode changes the form", async ({ page }) => {
    await goto(page, "login");
    await page.locator('#authSeg button[data-v="register"]').click();
    await expect(page.locator("#fa_name")).toBeVisible();
    await expect(page.locator("#authTitle")).toHaveText("Create your account");
    await expect(page.locator("#authSubmit")).toHaveText("Create account");
    await expect(page.locator("#fa_pw")).toHaveAttribute("autocomplete", "new-password");
    await page.locator('#authSeg button[data-v="login"]').click();
    await expect(page.locator("#fa_name")).toBeHidden();
    await expect(page.locator("#authSubmit")).toHaveText("Sign in");
  });

  test("validates name and password strength", async ({ page }) => {
    await goto(page, "login");
    await page.locator('#authSeg button[data-v="register"]').click();
    await page.fill("#fa_email", uniqueEmail());
    await page.fill("#fa_pw", PASSWORD);
    await page.click("#authSubmit");
    await expect(page.locator("#authErr")).toHaveText("Enter your full name using letters only.");
    await page.fill("#fa_name", "R2D2");
    await page.click("#authSubmit");
    await expect(page.locator("#authErr")).toHaveText("Enter your full name using letters only.");
    await page.fill("#fa_name", "Valid Name");
    await page.fill("#fa_pw", "short1");
    await page.click("#authSubmit");
    await expect(page.locator("#authErr")).toContainText("at least 8 characters");
    await page.fill("#fa_pw", "onlyletters");
    await page.click("#authSubmit");
    await expect(page.locator("#authErr")).toContainText("at least 8 characters");
    await expectView(page, "login");
  });

  test("valid data creates the account and it can sign in again", async ({ page }) => {
    const email = await signIn(page, "Meera Iyer");
    await expect(page.locator("#toasts")).toContainText(IS_WEB ? "Welcome to Saakh, Meera" : "Account created");
    await hashTo(page, "profile");
    await page.click("#profSignOut");
    await expectView(page, "login");
    await expect(page.locator("#toasts")).toContainText("signed out");
    await page.fill("#fa_email", email);
    await page.fill("#fa_pw", PASSWORD);
    await page.click("#authSubmit");
    await expectView(page, "assess");
    await expect(page.locator("#authBtn")).toHaveText("Meera");
  });

  test("an email already in use is refused", async ({ page, guard }) => {
    guard.allow(ALLOW_4XX);
    const email = await signIn(page);
    await hashTo(page, "profile");
    await page.click("#profSignOut");
    await expectView(page, "login");
    await page.locator('#authSeg button[data-v="register"]').click();
    await page.fill("#fa_name", "Second Person");
    await page.fill("#fa_email", email);
    await page.fill("#fa_pw", PASSWORD);
    await page.click("#authSubmit");
    await expect(page.locator("#authErr")).toContainText(/already/i);
    await expectView(page, "login");
  });
});

test.describe("profile", () => {
  test("shows the account and saves changes across a reload", async ({ page }) => {
    const email = await signIn(page, "Rohan Das");
    await hashTo(page, "profile");
    await expect(page.locator("#pf_email")).toHaveValue(email);
    await expect(page.locator("#pf_email")).toBeDisabled();
    await expect(page.locator("#profSince")).toContainText("Member since");
    await page.fill("#pf_name", "Rohan Kumar Das");
    await page.fill("#pf_phone", "9876543210");
    await page.fill("#pf_city", "Pune");
    await page.selectOption("#pf_emp", "self_employed");
    await page.fill("#pf_inc", "120000");
    await page.click("#profSave");
    await expect(page.locator("#toasts")).toContainText("Profile saved");
    await expect(page.locator("#authBtn")).toHaveText("Rohan");
    await page.reload();
    await expectView(page, "profile");
    await expect(page.locator("#pf_name")).toHaveValue("Rohan Kumar Das");
    await expect(page.locator("#pf_phone")).toHaveValue("9876543210");
    await expect(page.locator("#pf_city")).toHaveValue("Pune");
    await expect(page.locator("#pf_emp")).toHaveValue("self_employed");
    await expect(page.locator("#pf_inc")).toHaveValue("120000");
  });

  test("monthly income can be cleared again", async ({ page }) => {
    await signIn(page);
    await hashTo(page, "profile");
    await page.fill("#pf_inc", "120000");
    await page.click("#profSave");
    await expect(page.locator("#toasts")).toContainText("Profile saved");
    await page.fill("#pf_inc", "");
    await page.click("#profSave");
    // The box is already blank, so wait for the save itself: reloading any sooner would abort it.
    await expect(page.locator("#profSave")).toBeEnabled();
    await expect(page.locator("#pf_inc")).toHaveValue("");
    await page.reload();
    await expectView(page, "profile");
    await expect(page.locator("#pf_inc")).toHaveValue("");
  });

  test("invalid details show messages and are not saved", async ({ page, guard }) => {
    guard.allow(ALLOW_4XX);
    await signIn(page, "Rohan Das");
    await hashTo(page, "profile");
    await page.fill("#pf_name", "");
    await page.click("#profSave");
    await expect(page.locator("#profErr")).not.toBeEmpty();
    await page.fill("#pf_name", "Rohan Das");
    await page.fill("#pf_phone", "12");
    await page.click("#profSave");
    await expect(page.locator("#profErr")).not.toBeEmpty();
    await expect(page.locator("#toasts")).not.toContainText("Profile saved");
  });

  test("password change: wrong, weak, empty, then correct", async ({ page, guard }) => {
    guard.allow(ALLOW_4XX);
    const email = await signIn(page);
    await hashTo(page, "profile");
    await page.click("#pwSave");
    await expect(page.locator("#pwErr")).not.toBeEmpty();
    await page.fill("#pw_cur", "NotMyPassword1");
    await page.fill("#pw_new", "BrandNewPass2");
    await page.click("#pwSave");
    await expect(page.locator("#pwErr")).toContainText(/current password/i);
    await page.fill("#pw_cur", PASSWORD);
    await page.fill("#pw_new", "weak");
    await page.click("#pwSave");
    await expect(page.locator("#pwErr")).toContainText(/8 characters/);
    await page.fill("#pw_new", "BrandNewPass2");
    await page.click("#pwSave");
    await expect(page.locator("#toasts")).toContainText("Password updated");
    await page.click("#profSignOut");
    await expectView(page, "login");
    await page.fill("#fa_email", email);
    await page.fill("#fa_pw", "BrandNewPass2");
    await page.click("#authSubmit");
    await expectView(page, "assess");
  });

  test("sign out from the sidebar", async ({ page }) => {
    test.skip((page.viewportSize()?.width ?? 0) <= 1180, "sidebar account block is hidden on narrow layouts");
    await signIn(page);
    await page.locator("#railAuth button", { hasText: "Sign out" }).click();
    await expectView(page, "login");
    await expect(page.locator("#authBtn")).toHaveText("Sign in");
  });

  test("delete account: cancel keeps it, confirm removes it", async ({ page, guard }) => {
    guard.allow(ALLOW_4XX);
    guard.allow(/http 401: .*\/api\/assessments/); // a live history refresh can be in flight as the account goes
    const email = await signIn(page);
    await hashTo(page, "profile");
    page.once("dialog", (d) => d.dismiss());
    await page.click("#profDelete");
    await expectView(page, "profile");
    page.once("dialog", (d) => d.accept());
    await page.click("#profDelete");
    await expect(page.locator("#toasts")).toContainText("deleted");
    await expectView(page, "home");
    await goto(page, "login");
    await page.fill("#fa_email", email);
    await page.fill("#fa_pw", PASSWORD);
    await page.click("#authSubmit");
    await expect(page.locator("#authErr")).toContainText(/incorrect/i);
  });

  test("an expired session returns to sign in with a message", async ({ page, guard }) => {
    test.skip(!IS_WEB, "website 2 has no server sessions");
    guard.allow(ALLOW_4XX);
    guard.allow(/http 401/);
    await signIn(page);
    await page.evaluate(() => localStorage.setItem("saakh-token", "garbage.token"));
    await page.reload();
    await expectView(page, "login");
  });
});
