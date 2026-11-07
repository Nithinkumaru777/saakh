# Website 2 inventory: Saakh static site

**Location:** `prototype/`, published to `https://nithinkumaru777.github.io/saakh/` from the `gh-pages` branch by `scripts/deploy_gh_pages.py`.

**Stack:** one hand-written HTML file (`index.html`, about 230 KB) with inline CSS and JavaScript. No framework, build step or `package.json`. Fonts come from Google Fonts. Tutorial videos are copied from `apps/web/public/tutorial` when deploying.

**How it works:** all views live in one document and hash routing switches between them. There is no server: scoring uses an in-browser model, and accounts are held in `localStorage`.

## Pages and routes

All live on the single page `/saakh/`.

| Route | View | Access |
|---|---|---|
| `#home` | Home (landing) | Public |
| `#about` | About this project | Public |
| `#model` | How the AI decides | Public |
| `#login` | Sign in and create account | Public; signed-in users go to Profile |
| `#assess` | Assessment wizard and sheet | Sign-in required |
| `#what-if` | What-if simulator | Sign-in required |
| `#applicants` | History table and detail view | Sign-in required |
| `#batch` | CSV batch scoring | Sign-in required |
| `#portfolio` | KPIs and charts | Sign-in required |
| `#tutorials` | Full guide and 44 clips | Sign-in required |
| `#profile` | Account details, password, delete | Sign-in required |

## Links

- **Sidebar, top bar, phone tab bar, Home and Login links:** same set as website 1.
- **Anchor links:** all in-app navigation uses hashes.
- **External resources:** Google Fonts stylesheet only.
- **`tel:`, `mailto:`, WhatsApp:** none exist anywhere in the site.

## Buttons and actions

| Area | Controls |
|---|---|
| Shell | Guided demo, Search, theme toggle, More (phone) |
| Assess | Load sample applicant, Clear, Back, Continue, stepper, Run assessment, Try changes, drawer handle (phone). No PDF button on the sheet: reports come from Applicants. |
| What-if | Reset to application, sliders, apply a path to a better grade |
| Applicants | Search, filter, Previous, Next, row open, Back to applicants, Download report |
| Batch | Copy CSV template, Choose file, Use the 50-row sample, drag and drop, Download results CSV |
| Model | Tabs, stage cards, trace applicant select, Trace an application |
| Tutorials | Search box, topic toggles, video players |
| About | Start guided demo |
| Login | Mode switch, Use demo, submit |
| Profile | Save profile, Update password, Sign out, Delete my account |

## Forms

| Form | Fields | Validation | Submits to |
|---|---|---|---|
| Hero sentence | employment, income, CIBIL, amount, tenure | Values clamped | In-browser model |
| Sign in, Create account | email, password, name | Same rules as website 1 | `localStorage` |
| Assess wizard | 20+ fields | Per-step range checks | In-browser model |
| Batch CSV | File upload | Columns and per-row checks | In-browser model |
| Profile, Change password, Delete account | As website 1 | In-browser | `localStorage` |

There are no contact, booking, enquiry or newsletter forms.

## Interactive elements

- **Mobile menu:** tab bar plus More, which opens the command palette.
- **Modals and overlays:** command palette (Ctrl+K), guided demo, browser confirm on account delete.
- **Tabs:** Model page. **Accordion:** Tutorials topics.
- **Charts:** four on Portfolio, three on Model.
- **Videos:** full guide and 44 clips, loaded relative to the site path.
- **Not present:** carousels, image galleries, maps, embedded third-party video, live-updates chip.

## Animations

Same set as website 1, written in vanilla JavaScript and CSS.

## Backend

None by design, and no email sending or database. Before this audit the page still tried `http://localhost:8000` for sign-in.
