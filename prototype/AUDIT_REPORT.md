# Website 2 audit report: Saakh static site

**Scope:** `prototype/index.html`, published to `https://nithinkumaru777.github.io/saakh/` from the `gh-pages` branch. See `AUDIT_INVENTORY.md` for every route and control covered.

**Result:** the page passed five full browser-test runs in a row with no failures, served at `/saakh/` the way GitHub Pages serves it. One required check, the `gitleaks` secret scan, could not run. See [Still open](#still-open).

**Live site:** these results describe the local page. The live site only changes once this page is deployed.

## Test results

Each run covers three screen sizes: 1440, 768 and 375 pixels wide. Tests run with no retries, and a test also fails on any console error, uncaught exception or unexpected failed request.

| Run | Tests | Passed | Failed | Skipped |
|---|---|---|---|---|
| Before fixes | 483 | 113 | 363 | 7 |
| Final, runs 1 to 5 (each) | 489 | 474 | 0 | 15 |

**Skipped tests:** these cover the phone drawer and phone tab bar at wider sizes, the sidebar sign-out on narrow layouts, and three features this site doesn't have: server sessions, the PDF button on the assessment sheet, and the stage inspector on the Model page.

**After the five runs:** one line changed in the shared tests, allowing a 401 from a server history request during the delete-account test. This site has no server, so it can't affect these results, and the page itself did not change.

## Lighthouse (before and after, one run per page)

| Page | Performance | Accessibility | Best practices | SEO |
|---|---|---|---|---|
| Home | 98 to 99 | 100 | 100 | 90 to 100 |
| Model | 91 to 100 | 92 to 100 | 100 | 90 to 100 |
| About | 99 to 100 | 94 to 100 | 100 | 90 to 100 |
| Sign in | 99 to 100 | 100 | 100 | 90 to 100 |

## Bugs fixed

### Found by repeating the full test suite

| Bug | What a user saw | Fix |
|---|---|---|
| An animation name stayed on a row for 600 ms after Back | Opening a different row straight after Back threw an uncaught animation error | `openDetail` clears old names first |

A test for this was seen failing before the fix.

### Found earlier in the audit

**Security**
- Applicant names, search text and toast messages are now escaped. Before, a name in an imported CSV could run as markup.
- Local accounts now store salted PBKDF2 password hashes instead of plain text, and older plain-text accounts are upgraded.
- Profile and password changes are now validated.

**Things that didn't work**
- The site no longer tries to reach `localhost:8000`.
- The report and results CSV buttons now download real files. Before, they only showed a message saying what the app would do.
- People can now get past the income step: the money fields misread amounts with commas as invalid.
- CSV import follows the standard format and enforces batch limits.
- Assessment runs are kept in the browser between visits.
- Clear now resets every field.

**Accessibility and SEO**
- Added a meta description and per-page titles.
- Buttons now have accessible names, and the Model page's heading order is correct.
- The Model page's tabs work from the keyboard.

## Other checks

| Check | Result |
|---|---|
| Dependencies | None: one hand-written file with no build step |
| Secret search | A regex search for common key formats found 0 matches, but it isn't a full scan |
| `gitleaks` | **Not run**, see [Still open](#still-open) |

## Still open

1. **`gitleaks` did not run.** The local shell allowlist blocks it. To allow it, run `lean-ctx allow gitleaks`.
2. **Demo password is public by design:** `officer@saakh.ai` / `Saakh2026!` appears on the sign-in form and in its error message. It only opens a demo account stored in the visitor's own browser, because this site has no server.
3. **Browser-only data:** accounts and history stay in that browser's `localStorage`. They don't follow a person to another device, and clearing browser data removes them.
4. **Google Fonts:** this is the one outside resource the site loads. If it can't be reached, the page falls back to system fonts.
