# Website 1 audit report: Saakh full-stack app

**Scope:** `apps/web` (Next.js) and `services/api` (FastAPI). See `AUDIT_INVENTORY.md` for every route, control and endpoint covered.

**Result:** the production build passed five full browser-test runs in a row with no failures. One required check, the `gitleaks` secret scan, could not run. See [Still open](#still-open).

## Test results

Each run covers three screen sizes: 1440, 768 and 375 pixels wide. Tests run with no retries, and a test also fails on any console error, uncaught exception or unexpected failed request.

| Run | Tests | Passed | Failed | Skipped |
|---|---|---|---|---|
| Before fixes | 510 | 9 | 497 | 4 |
| Final, runs 1 to 5 (each) | 534 | 528 | 0 | 6 |
| Final, development mode (`next dev`, desktop only) | 178 | 175 | 0 | 3 |

**Skipped tests:** the production runs skip three tests that don't apply at some screen sizes: the phone drawer and phone tab bar at wider sizes, and the sidebar sign-out on narrow layouts. Development mode also skips the security header test, because Next.js only sends those headers in production.

## Other checks

| Check | Result |
|---|---|
| TypeScript (`apps/web`) | 0 errors |
| ESLint | 0 errors, 14 warnings |
| Vitest | 36 of 36 passed |
| pytest (`services/api`) | 66 of 66 passed, 1 warning |
| Emoji check | 0 found in 66 files |
| `pnpm audit --prod` | No known vulnerabilities |
| `pip-audit` (API dependencies) | No known vulnerabilities |
| Licences | One dependency outside the allowlist, see [Still open](#still-open) |
| `gitleaks` | **Not run**, see [Still open](#still-open) |

## Lighthouse (production build, one run per page)

| Page | Performance | Accessibility | Best practices | SEO |
|---|---|---|---|---|
| Home | 94 | 100 | 100 | 100 |
| Model | 94 | 100 | 100 | 100 |
| About | 93 | 100 | 100 | 100 |
| Sign in | 85 | 100 | 100 | 100 |

- **Performance varies between runs.** An earlier run of this build scored 98, 98, 89 and 90, so treat these as approximate.
- **Sign in is the slowest page,** with the largest paint at 3.6 s. Lighthouse estimates 73 KiB of unused JavaScript on it.
- **No fair before-and-after for performance.** The pre-fix scores came from a different server on port 3000, and the Sign in page failed to load in that run.

## Bugs fixed

### Found by repeating the full test suite

These only appeared in some runs. Each now has a test that was seen failing before the fix.

| Bug | What a user saw | Fix |
|---|---|---|
| The table wasn't redrawn after the server's history loaded | Right after sign-in, clicking an applicant row could do nothing | `syncBackendHistory` now redraws Applicants and Portfolio |
| An animation name stayed on a row for 600 ms after Back | Opening a different row straight after Back threw an uncaught animation error | `openDetail` clears old names first |
| The history loop checked for a token only once | Signing out during loading sent a request with no token, which returned a 401 | The token is checked before each page request |
| A late 401 was treated as an expired session | Deleting an account during loading could go to Sign in with a false "session expired" message, and the same late reply could end a newer session | `apiFetch` signs out only if the refused token is still the current one |

### Found earlier in the audit

- **Security:** toast messages are now escaped before being inserted as HTML.
- **PDF reports:** the Content Security Policy blocked the PDF engine, so it now allows WebAssembly and `data:` connections for it.
- **Page loading:** public pages now appear without waiting for JavaScript, and the page fade moved from JavaScript to CSS.
- **Saving:** Run no longer claims a save the server didn't make.
- **Clicks and focus:** toasts no longer block clicks underneath them, and keyboard focus stays on the same row when the table redraws.
- **Accounts:** sign-out and account deletion return the form to Sign in mode.
- **Guided demo:** it now works for signed-out visitors and opens the drawer on phones.
- **Small fixes:**
  - The monthly income field can be cleared.
  - Long account names now truncate on narrow screens.
  - The theme button is labelled when the page loads.
  - Wrong URLs get a proper 404 page.
- **Metadata:** page titles and social preview tags were added. `NEXT_PUBLIC_SITE_URL` is passed through the Docker build for the preview image.
- **Demo account:** the account advertised on the sign-in page is now created outside production.

## Test fixes

Some failures during the audit were faults in the tests, not the site. These were fixed in the tests:

- **Finished-run check:** the wizard tests now wait on the button's `aria-busy` attribute. The button is never disabled, so the old wait passed instantly and read the previous applicant's result.
- **Profile save:** the clear-income test now waits for the save to finish before reloading.
- **Shared test server:** the row test holds on to one row by its ID, and the PDF test records every toast, because other test workers can add rows and toasts at any moment.
- **Internet drops:** the failure check ignores network errors from Google Fonts, which has a system font fallback. HTTP errors from it still count.
- **Expected errors:** the delete-account test accepts a 401 on a history request, because a request in flight as the account goes really is refused.

## Still open

1. **`gitleaks` did not run.** The local shell allowlist blocks it. As a partial substitute, a regex search for common key formats found 0 matches, but it skips large and binary files. To allow it, run `lean-ctx allow gitleaks`.
2. **Licence outside the allowlist:** `caniuse-lite` (CC-BY-4.0) is a data package that Next.js depends on, so it can't simply be removed. The `UNLICENSED` entry is this project's own private package, and `png-js` reports `MIT*`, an inferred licence.
3. **Demo password in source:** `officer@saakh.ai` / `Saakh2026!` is in `services/api/app/db.py`. It's deliberately public and shown on the sign-in page. The account is not created when `SAAKH_ENV=production`, so any real deployment must set that value.
4. **Not hosted:** this site needs a Node server and a Python server, so GitHub Pages can't run it. It isn't live anywhere yet.
5. **Rare click loss:** a live table redraw landing between pressing and releasing the mouse could lose that one click. This wasn't observed in testing, and clicking again works.
6. **Performance:** the Sign in page's paint time and unused JavaScript are the clearest remaining improvements.
