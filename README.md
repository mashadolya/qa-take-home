# Product A: cleaning up data from an optional form section (Playwright)

This is the automation part of my Appfire Senior QA take-home. It models the critical path of a real incident I found on Product A (Nov 2023 – May 2024, test and pre-prod environments). All names are anonymized.

> A form has an **"Add additional details"** checkbox. When you tick it, an extra section opens with its own fields and images.
>
> - **BUG-001 (backend/data):** a user saved the form with the section enabled, then went to edit, unticked the box and saved again. The section's images were **not deleted**. They stayed in image storage and could still be opened by their old URL, and they came back when the box was ticked again.
> - **BUG-002 (UI state):** a user ticked the box, typed into the section and then unticked it. The hidden values were **still sent on save**, so the user got a validation error for a field they could not see.

The real product (a React Native app on iOS and Android) is not available, so `src/` contains a small stand-in that has only this path. The bugs live in the backend and in the client form state, not in anything mobile-specific, so the stand-in is a web form that Playwright can drive. It is a Node HTTP server with SQLite (`node:sqlite`) and one HTML page, and it needs no runtime dependencies. Each original bug can be switched back on with an environment variable, which lets you check that the tests catch it.

## Requirements

- Node.js **22.13+** (24 recommended) for the built-in `node:sqlite`
- macOS, Linux or WSL

## Install

```bash
npm ci
npx playwright install chromium
```

## Run

```bash
npm run e2e            # all 11 tests on the fixed build (the app starts automatically on :3100)
npm run e2e:api        # API + SQL layer only
npm run e2e:ui         # UI journey only (Chromium)
npm run e2e:headed     # UI journey in a visible browser
npm run e2e:report     # open the last HTML report
npm run e2e:typecheck  # tsc over the e2e project
npm start              # run the app alone: http://localhost:3100 (BUGS=BUG-001 npm start to see the bug)
```

**Expected runtime:** about 2–5 s for the tests on a laptop. The first install takes about 1 minute because it downloads Chromium.

### Proving the tests catch the original bugs

```bash
npm run e2e:bug-001    # app restores the original backend behaviour
npm run e2e:bug-002    # app restores the original client behaviour
```

When a bug is switched on, every test tagged with it (`@bug-001` / `@bug-002`) is marked as **expected to fail**: see the `bugGuard` auto-fixture in `e2e/common/fixtures/base.fixture.ts`. The run is green **only if those tests really fail**. The output shows them as `✘`, and the untagged tests still pass. CI runs all three modes as a matrix (`.github/workflows/playwright.yml`).

## What is covered

| Test                                                                            | Layer                  | Edge case                                                                                                                                                        |
| ------------------------------------------------------------------------------- | ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `BUG-001: disabling the details section deletes its images and fields`          | API + SQL              | after the PATCH: `details: null`, the old image URLs return **404**, `stored_images` has **0** rows, and the section columns are `NULL`                          |
| `BUG-001: re-enabling ... old images are not resurrected`                       | API                    | turn off, then turn on again: `images: []`                                                                                                                       |
| `deleting a form removes all of its images (cascade)`                           | API + SQL              | deleting the whole form removes its images                                                                                                                       |
| `image upload is rejected (409) while the details section is disabled`          | API                    | no back door for orphaned images                                                                                                                                 |
| `enabled details section requires a reference code`                             | API                    | the validation rule that made BUG-002 visible                                                                                                                    |
| `BUG-002: details filled then unchecked are not sent on save`                   | UI + network           | checks the request body (`details: null`), then the visible result ("Saved", no error)                                                                           |
| `BUG-001: removing the details section in edit makes its image unreachable ...` | UI E2E                 | real file upload, then edit, then the old URL returns 404, then re-ticking shows an empty section                                                                |
| `BUG-001 / BUG-002: details edited then unchecked and saved are removed ...`    | UI + network + API     | edit, attach an image, untick, save: `details: null` sent, re-ticking **without reload** shows an empty section (draft dropped), API has no images, old URLs 404 |
| `unticking and re-ticking during one edit restores the draft ...`               | UI + API               | untick, then tick again **before save**: fields and images come back from the edit draft, and after save the old and new images are kept                         |
| `unchecking and then cancelling the edit keeps the saved images`                | UI                     | data is deleted only on **save**, not when the box is unticked                                                                                                   |
| `failed image upload is reported to the user (mocked 500)`                      | UI + `page.route` mock | storage failure is reported to the user and not hidden                                                                                                           |

## Test data and isolation

- The app starts with a **fresh SQLite file** on every run (`.data/`, ignored by git).
- Every test creates its own forms with unique titles (`[w<worker>] <test> <random>`). There is no shared state or global reset, so tests run with `fullyParallel`.
- Data is arranged through the API (fast). UI tests drive only the path under test.
- SQL checks open the database **read-only** (`e2e/db/clients/db.client.ts`).

## Layout

```
src/                                  the app under test (stand-in for Product A)
  server.mjs                          REST API + image storage + SQLite; bug switches BUGS=BUG-001,BUG-002
  public/index.html                   form editor (vanilla JS)
e2e/
  api/                                API + data layer (project "api", no browser)
    clients/forms-api.client.ts       thin REST client, returns raw APIResponse
    data/api.routes.ts                REST endpoints
    fixtures/api.fixture.ts           formsApi, formsApiSteps, formsApiVerificationSteps (extends db)
    steps/forms-api.steps.ts          API arrange flows and actions, each in test.step
    steps/forms-api.verification.steps.ts  API expectations
    tests/details-cleanup.spec.ts
  ui/                                 user journey layer (project "ui", Chromium)
    data/                             app routes, URL patterns, UI messages
    fixtures/ui.fixture.ts            formEditorPage (+ JS error guard), formEditorSteps, formEditorVerificationSteps (extends api)
    pages/form-editor.page.ts         Page Object: locators and simple actions only
    steps/form-editor.steps.ts        UI flows and actions, each in test.step
    steps/form-editor.verification.steps.ts  UI expectations
    tests/details-section.spec.ts
  db/                                 data layer (read-only SQL), used by API tests
    clients/db.client.ts              read-only SQLite client
    fixtures/db.fixture.ts            dbClient, formsDbVerificationSteps (extends common base)
    steps/forms-db.verification.steps.ts  SQL expectations, each in test.step
    types/                            table row shapes, SqlBoolean
  common/                             shared by all layers
    data/                             reference codes, upload files
    fixtures/base.fixture.ts          generateFormTitle, bugGuard (auto)
    types/                            API request/response types
    utils/                            env, payload builders
  tsconfig.json
playwright.config.ts                  projects api / ui, webServer starts the app with the requested BUGS
eslint.config.mjs  .prettierrc        curly: all, naming-convention; Prettier 100 / singleQuote
.github/workflows/playwright.yml      typecheck, lint, format, then tests in the matrix fixed / BUG-001 / BUG-002
.claude/skills/playwright-cli/        Playwright agent CLI skill for Claude Code
docs/                                 report source (HTML), PDF, evidence/ screenshots
```

Dependency direction: `ui → api → common`. `common` never imports from a layer, and `api` never imports from `ui`. UI tests use the API fixtures only to arrange data quickly.
