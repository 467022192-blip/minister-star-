# Vercel Blob Persistence for Result Pages Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `/result/[sessionId]`, `/share/[sessionId]`, and `/api/share-card/[sessionId]` reliably load on Vercel without a database by persisting quiz/chart sessions in Vercel Blob.

**Architecture:** Keep the current page routes, server actions, and repository APIs in place, but extend persistence from `memory | prisma` to `memory | prisma | blob`. Add one small Blob JSON store helper, route quiz/chart repositories through it when Blob mode is active, and keep schema validation at the repository boundary so pages keep receiving either valid session objects or `null`.

**Tech Stack:** Next.js 15, Node 20, Vercel Blob (`@vercel/blob`), Prisma, Vitest, Testing Library

---

### File Structure

**Files:**
- Create: `lib/blob/session-store.ts`
- Create: `tests/unit/blob/session-store.test.ts`
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `lib/db.ts`
- Modify: `lib/repositories/quiz-session-repo.ts`
- Modify: `lib/repositories/chart-session-repo.ts`
- Modify: `tests/unit/db.test.ts`
- Modify: `tests/unit/repositories/quiz-session-repo.test.ts`
- Modify: `tests/unit/repositories/chart-session-repo.test.ts`
- Modify: `tests/unit/repositories/result-session-repo.test.ts`
- Modify: `tests/integration/chart-submit.test.ts`
- Modify: `tests/integration/chart-submit-failure.test.ts`
- Create: `tests/integration/quiz-submit-and-chart-page.test.tsx`
- Modify: `README.md`
- Modify: `.env.example`
- Reference only: `lib/repositories/result-session-repo.ts`
- Reference only: `app/quiz/actions.ts`
- Reference only: `app/chart/actions.ts`
- Reference only: `app/result/[sessionId]/page.tsx`
- Reference only: `app/share/[sessionId]/page.tsx`
- Reference only: `app/api/share-card/[sessionId]/route.ts`
- Reference: `docs/superpowers/specs/2026-04-24-vercel-blob-persistence-for-result-pages-design.md`

### Task 1: Add the Blob SDK and a private JSON store helper

**Files:**
- Create: `lib/blob/session-store.ts`
- Create: `tests/unit/blob/session-store.test.ts`
- Modify: `package.json`
- Modify: `package-lock.json`

- [ ] **Step 1: Write the failing helper tests**

```ts
import { beforeEach, describe, expect, it, vi } from 'vitest'

const getMock = vi.fn()
const putMock = vi.fn()

vi.mock('@vercel/blob', () => ({
  get: (...args: unknown[]) => getMock(...args),
  put: (...args: unknown[]) => putMock(...args),
}))

describe('session-store', () => {
  it('writes private JSON blobs without random suffix', async () => {
    // expect put(..., { access: 'private', addRandomSuffix: false })
  })

  it('uses no-store semantics when reading private blobs', async () => {
    // expect get(..., { access: 'private', useCache: false })
  })

  it('forwards allowOverwrite when overwrite is requested', async () => {
    // putPrivateJson('chart-sessions/x.json', value, { allowOverwrite: true })
    // expect put(..., { allowOverwrite: true })
  })

  it('returns null when the blob does not exist', async () => {
    // getMock.mockResolvedValue(null)
  })

  it('throws when blob JSON is malformed', async () => {
    // getMock returns invalid JSON bytes/text
  })
})
```

- [ ] **Step 2: Run the helper test to verify it fails**

Run: `npm run test:unit -- tests/unit/blob/session-store.test.ts`
Expected: FAIL because the helper file and dependency do not exist yet.

- [ ] **Step 3: Install `@vercel/blob` and update the lockfile**

Run: `npm install @vercel/blob`
Expected: `package.json` gains `@vercel/blob`, `package-lock.json` updates accordingly, and no unrelated dependency drift appears.

- [ ] **Step 4: Implement the minimal Blob helper**

Create `lib/blob/session-store.ts` with a small API like:

```ts
import { get, put } from '@vercel/blob'

export async function putPrivateJson(pathname: string, value: unknown, options?: { allowOverwrite?: boolean }) {
  return put(pathname, JSON.stringify(value), {
    access: 'private',
    addRandomSuffix: false,
    allowOverwrite: options?.allowOverwrite ?? false,
    contentType: 'application/json; charset=utf-8',
  })
}

export async function getPrivateJson(pathname: string) {
  const result = await get(pathname, { access: 'private', useCache: false })
  if (!result) return null
  return JSON.parse(await new Response(result.stream).text())
}
```

Keep this file storage-only: pathname in, JSON out, no quiz/chart business rules.

- [ ] **Step 5: Run the helper test to verify it passes**

Run: `npm run test:unit -- tests/unit/blob/session-store.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json lib/blob/session-store.ts tests/unit/blob/session-store.test.ts
git commit -m "feat: add Blob JSON session store helper"
```

### Task 2: Extend persistence mode selection to support Blob

**Files:**
- Modify: `lib/db.ts`
- Modify: `tests/unit/db.test.ts`

- [ ] **Step 1: Add failing tests for Blob mode resolution**

Extend `tests/unit/db.test.ts` with cases like:

```ts
it('defaults to blob when DATABASE_URL is missing and BLOB_READ_WRITE_TOKEN exists outside tests', () => {
  process.env.NODE_ENV = 'production'
  delete process.env.DATABASE_URL
  process.env.BLOB_READ_WRITE_TOKEN = 'blob-token'
  delete process.env.ZIWEI_PERSISTENCE_MODE
  expect(getPersistenceMode()).toBe('blob')
})

it('keeps explicit blob mode when BLOB_READ_WRITE_TOKEN exists', () => {
  process.env.NODE_ENV = 'production'
  process.env.ZIWEI_PERSISTENCE_MODE = 'blob'
  process.env.BLOB_READ_WRITE_TOKEN = 'blob-token'
  expect(getPersistenceMode()).toBe('blob')
})

it('throws when blob is forced without BLOB_READ_WRITE_TOKEN', () => {
  process.env.NODE_ENV = 'production'
  process.env.ZIWEI_PERSISTENCE_MODE = 'blob'
  delete process.env.BLOB_READ_WRITE_TOKEN
  expect(() => getPersistenceMode()).toThrow('BLOB_READ_WRITE_TOKEN is required when ZIWEI_PERSISTENCE_MODE=blob')
})
```

Also restore `BLOB_READ_WRITE_TOKEN` in the existing env cleanup block. Remember: `tests/setup.ts` pins `ZIWEI_PERSISTENCE_MODE=memory`, so each new test must explicitly delete or override it.

- [ ] **Step 2: Run the targeted db test to verify failure**

Run: `npm run test:unit -- tests/unit/db.test.ts`
Expected: FAIL because `lib/db.ts` only knows `memory | prisma` today.

- [ ] **Step 3: Implement Blob-aware persistence mode resolution**

Update `lib/db.ts` so it behaves like:

```ts
export type PersistenceMode = 'memory' | 'prisma' | 'blob'

export function getPersistenceMode(): PersistenceMode {
  const configuredMode = process.env.ZIWEI_PERSISTENCE_MODE

  if (configuredMode === 'memory') return 'memory'
  if (configuredMode === 'blob') {
    if (!process.env.BLOB_READ_WRITE_TOKEN) throw new Error('BLOB_READ_WRITE_TOKEN is required when ZIWEI_PERSISTENCE_MODE=blob')
    return 'blob'
  }
  if (configuredMode === 'prisma') {
    if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required when ZIWEI_PERSISTENCE_MODE=prisma')
    return 'prisma'
  }

  if (process.env.NODE_ENV === 'test') return 'memory'
  if (process.env.DATABASE_URL) return 'prisma'
  if (process.env.BLOB_READ_WRITE_TOKEN) return 'blob'
  return 'memory'
}
```

Keep `getDb()` Prisma-only; Blob mode must not instantiate Prisma client.

- [ ] **Step 4: Run the db test to verify it passes**

Run: `npm run test:unit -- tests/unit/db.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/db.ts tests/unit/db.test.ts
git commit -m "feat: add blob persistence mode selection"
```

### Task 3: Route quiz sessions through Blob when Blob mode is active

**Files:**
- Modify: `lib/repositories/quiz-session-repo.ts`
- Modify: `tests/unit/repositories/quiz-session-repo.test.ts`

- [ ] **Step 1: Write failing quiz repository tests for Blob mode**

Extend `tests/unit/repositories/quiz-session-repo.test.ts` to cover Blob mode explicitly:

```ts
it('stores and reads quiz sessions via Blob in blob mode', async () => {
  process.env.ZIWEI_PERSISTENCE_MODE = 'blob'
  process.env.BLOB_READ_WRITE_TOKEN = 'blob-token'
  // mock putPrivateJson/getPrivateJson and assert quiz-sessions/<id>.json is used
})

it('returns null when Blob quiz data has the wrong shape', async () => {
  process.env.ZIWEI_PERSISTENCE_MODE = 'blob'
  process.env.BLOB_READ_WRITE_TOKEN = 'blob-token'
  // getPrivateJson returns { nope: true }
  // expect getQuizSessionById(...) resolves to null
})
```

Mock `lib/blob/session-store.ts` rather than mocking `@vercel/blob` again; this keeps repository tests focused on business shape validation.

In this file, snapshot and restore `ZIWEI_PERSISTENCE_MODE`, `BLOB_READ_WRITE_TOKEN`, and `NODE_ENV` in `beforeEach` / `afterEach` so Blob-mode cases do not leak into the existing memory-mode assertions.

- [ ] **Step 2: Run the targeted quiz repository test to verify failure**

Run: `npm run test:unit -- tests/unit/repositories/quiz-session-repo.test.ts`
Expected: FAIL because the repository has no Blob branch yet.

- [ ] **Step 3: Implement the Blob branch and minimum shape validation**

Update `lib/repositories/quiz-session-repo.ts` so it keeps existing `prisma` and `memory` branches, then adds:

```ts
if (getPersistenceMode() === 'blob') {
  const id = randomUUID()
  await putPrivateJson(`quiz-sessions/${id}.json`, { id, answer })
  return { id, answer }
}
```

and for reads:

```ts
const record = await getPrivateJson(`quiz-sessions/${sessionId}.json`)
if (!isQuizSessionRecord(record)) return null
return record
```

Define a small `isQuizSessionRecord()` guard in the repository that checks the minimum shape the page relies on: `id` is a string and `answer` contains the expected quiz answer keys.

- [ ] **Step 4: Run the targeted quiz repository test to verify it passes**

Run: `npm run test:unit -- tests/unit/repositories/quiz-session-repo.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/repositories/quiz-session-repo.ts tests/unit/repositories/quiz-session-repo.test.ts
git commit -m "feat: persist quiz sessions in blob mode"
```

### Task 4: Route chart/result sessions through Blob and keep updates on one pathname

**Files:**
- Modify: `lib/repositories/chart-session-repo.ts`
- Modify: `tests/unit/repositories/chart-session-repo.test.ts`
- Modify: `tests/unit/repositories/result-session-repo.test.ts`

- [ ] **Step 1: Write failing chart/result repository tests for Blob mode**

Add cases like:

```ts
it('stores draft chart sessions via Blob in blob mode', async () => {
  process.env.ZIWEI_PERSISTENCE_MODE = 'blob'
  process.env.BLOB_READ_WRITE_TOKEN = 'blob-token'
  // createDraftChartSession(...) then expect chart-sessions/<id>.json write
})

it('overwrites the same Blob pathname when saving computed results', async () => {
  // mock getPrivateJson + putPrivateJson and assert allowOverwrite: true behavior is requested
})

it('overwrites the same Blob pathname when marking failures', async () => {
  // failed path should also update chart-sessions/<id>.json in place
})

it('returns null when Blob chart data misses computed fields required by result pages', async () => {
  // malformed / incomplete shape => null
})
```

Also extend `tests/unit/repositories/result-session-repo.test.ts` so `getResultSessionById()` is exercised with a Blob-backed computed chart session instead of only checking an unknown ID.

In both files, snapshot and restore `ZIWEI_PERSISTENCE_MODE`, `BLOB_READ_WRITE_TOKEN`, and `NODE_ENV` so the mixed repository suite remains deterministic.

- [ ] **Step 2: Run the targeted repository tests to verify failure**

Run: `npm run test:unit -- tests/unit/repositories/chart-session-repo.test.ts tests/unit/repositories/result-session-repo.test.ts`
Expected: FAIL because the chart repository currently only handles memory/prisma and never calls Blob.

- [ ] **Step 3: Implement the Blob branch in the chart repository**

Update `lib/repositories/chart-session-repo.ts` so Blob mode does all of the following:

```ts
await putPrivateJson(`chart-sessions/${id}.json`, record)

const existing = await getPrivateJson(`chart-sessions/${payload.sessionId}.json`)
if (!isChartSessionRecord(existing)) throw new Error('session not found')

await putPrivateJson(`chart-sessions/${payload.sessionId}.json`, updated, {
  allowOverwrite: true,
})
```

Keep the seed data and `chartSessionStore` for memory mode. Add a small `isChartSessionRecord()` guard in this repository so Blob-loaded objects are validated before the rest of the code trusts them.

That guard should validate the minimum computed-session shape required by **all three** downstream consumers:
- `/result/[sessionId]`
- `/share/[sessionId]`
- `/api/share-card/[sessionId]`

At minimum, do not return Blob-loaded data as a valid computed session unless it safely provides:
- `status === 'computed'`
- top-level `chartOutput` and `interpretationOutput`
- `interpretationOutput.summary.title`
- `interpretationOutput.summary.tags`
- `interpretationOutput.sections.personality.blocks`
- `chartOutput.lifePalace`
- `chartOutput.bodyPalace`
- `chartOutput.primaryStars`
- `chartOutput.structureSummary` fields used by the share-card route

- [ ] **Step 4: Run the targeted repository tests to verify they pass**

Run: `npm run test:unit -- tests/unit/repositories/chart-session-repo.test.ts tests/unit/repositories/result-session-repo.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/repositories/chart-session-repo.ts tests/unit/repositories/chart-session-repo.test.ts tests/unit/repositories/result-session-repo.test.ts
git commit -m "feat: persist chart sessions in blob mode"
```

### Task 5: Prove the submit-to-result flow still works through the existing actions

**Files:**
- Create: `tests/integration/quiz-submit-and-chart-page.test.tsx`
- Modify: `tests/integration/chart-submit.test.ts`
- Modify: `tests/integration/chart-submit-failure.test.ts`

- [ ] **Step 1: Add failing integration tests for Blob mode action flow**

Adjust the action tests so they explicitly run in Blob mode with the Blob helper mocked:

```ts
it('persists quiz answers that ChartPage can read in blob mode', async () => {
  process.env.NODE_ENV = 'production'
  process.env.ZIWEI_PERSISTENCE_MODE = 'blob'
  process.env.BLOB_READ_WRITE_TOKEN = 'blob-token'
  // mock session-store with an in-memory object map
  // const session = await submitQuizAnswers(...)
  // const page = await ChartPage({ searchParams: Promise.resolve({ quizSessionId: session.id }) })
  // render(page) and assert the carried preference banner is shown
})

it('persists a computed session that getResultSessionById can read in blob mode', async () => {
  process.env.NODE_ENV = 'production'
  process.env.ZIWEI_PERSISTENCE_MODE = 'blob'
  process.env.BLOB_READ_WRITE_TOKEN = 'blob-token'
  // mock session-store with an in-memory object map
  // submitChartInput(...)
  // expect getResultSessionById(result.sessionId) toMatchObject({ status: 'computed' })
})

it('persists a failed session that getResultSessionById can read in blob mode', async () => {
  // same setup, but invalid time input => failed record should be readable after write
})
```

Use a per-test mock map in the helper mock so the test actually proves cross-call persistence without depending on `chartSessionStore`.

In all three integration files, snapshot and restore `ZIWEI_PERSISTENCE_MODE`, `BLOB_READ_WRITE_TOKEN`, and `NODE_ENV` in `beforeEach` / `afterEach`. Keep the Blob helper mock scoped to those files so the existing result/share/share-card tests can continue to run in memory mode inside the mixed suite.

- [ ] **Step 2: Run the targeted integration tests to verify failure**

Run: `npm run test:unit -- tests/integration/quiz-submit-and-chart-page.test.tsx tests/integration/chart-submit.test.ts tests/integration/chart-submit-failure.test.ts`
Expected: ideally RED first if the action flow is still coupled to in-memory state; if it already passes because Tasks 1-4 were sufficient, keep the new test as the regression guard and proceed without extra production-code changes.

- [ ] **Step 3: Make only the minimal integration-support changes needed**

If the tests expose missing cleanup or env reset behavior, add only the smallest fix necessary. Prefer adjusting test setup over production code unless the failure reveals a real bug.

- [ ] **Step 4: Run the targeted integration tests to verify they pass**

Run: `npm run test:unit -- tests/integration/quiz-submit-and-chart-page.test.tsx tests/integration/chart-submit.test.ts tests/integration/chart-submit-failure.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add tests/integration/quiz-submit-and-chart-page.test.tsx tests/integration/chart-submit.test.ts tests/integration/chart-submit-failure.test.ts
git commit -m "test: cover blob-backed chart submit flow"
```

### Task 6: Update operational docs and environment examples for Blob mode

**Files:**
- Modify: `README.md`
- Modify: `.env.example`

- [ ] **Step 1: Update the env example to document Blob mode without removing Prisma mode**

Change `.env.example` from a Prisma-only example to a documented multi-mode example, for example:

```dotenv
# Prisma mode
ZIWEI_PERSISTENCE_MODE=prisma
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ziwei_growth_site

# Blob mode (for Vercel no-DB deploys)
# ZIWEI_PERSISTENCE_MODE=blob
# BLOB_READ_WRITE_TOKEN=

NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

- [ ] **Step 2: Update README deployment guidance to make Blob the recommended no-DB production mode**

Document all of the following:
- `memory` remains the test/local fallback
- `blob` is the recommended first production deploy mode when `DATABASE_URL` is absent
- `BLOB_READ_WRITE_TOKEN` is required for explicit Blob mode
- result/share pages now depend on Blob-backed session persistence in the no-DB path
- `analytics-repo` remains out of scope for this change

- [ ] **Step 3: Verify docs mention all supported persistence modes and env vars**

Run: `rg -n 'ZIWEI_PERSISTENCE_MODE|BLOB_READ_WRITE_TOKEN|DATABASE_URL|memory|blob|prisma' README.md .env.example lib/db.ts`
Expected: docs and code agree on the three supported modes.

- [ ] **Step 4: Commit**

```bash
git add README.md .env.example
git commit -m "docs: describe blob-backed no-db deployment mode"
```

### Task 7: Run local verification, push, and switch Vercel production to Blob mode

**Files:**
- Modify: none

- [ ] **Step 1: Run the focused unit and integration suite**

Run:

```bash
npm run test:unit -- \
  tests/unit/blob/session-store.test.ts \
  tests/unit/db.test.ts \
  tests/unit/repositories/quiz-session-repo.test.ts \
  tests/unit/repositories/chart-session-repo.test.ts \
  tests/unit/repositories/result-session-repo.test.ts \
  tests/integration/quiz-submit-and-chart-page.test.tsx \
  tests/integration/chart-submit.test.ts \
  tests/integration/chart-submit-failure.test.ts \
  tests/integration/result-page.test.tsx \
  tests/integration/share-page.test.tsx \
  tests/integration/share-card-route.test.ts
```

Expected: PASS.

- [ ] **Step 2: Run a production build with no database and no Blob token to preserve the safe fallback**

Run: `env -u DATABASE_URL -u BLOB_READ_WRITE_TOKEN -u ZIWEI_PERSISTENCE_MODE npm run build`
Expected: PASS, proving the app still compiles in the lowest-common-denominator environment.

- [ ] **Step 3: Review git status and push the implementation**

Run:

```bash
git status --short --branch
git push origin main
```

Expected: clean working tree on `main`, then push succeeds.

- [ ] **Step 4: Update Vercel production env to Blob mode**

Run:

```bash
npx vercel@52.0.0 env add ZIWEI_PERSISTENCE_MODE production --value blob --yes --force --scope 467022192-blips-projects
npx vercel@52.0.0 env list production --scope 467022192-blips-projects
```

Expected: production shows `ZIWEI_PERSISTENCE_MODE=blob`, `BLOB_READ_WRITE_TOKEN` remains present, and `DATABASE_URL` stays absent.

- [ ] **Step 5: Trigger a production deploy and verify the critical path in the browser**

Run:

```bash
npx vercel@52.0.0 --prod --scope 467022192-blips-projects
```

Then verify with `agent-browser` or equivalent browser automation:
- `/`
- `/quiz`
- submit quiz and confirm `/chart?quizSessionId=...` shows the carried preference banner
- submit chart and confirm `/result/[sessionId]` renders instead of 404
- open `/share/[sessionId]` and confirm it renders instead of 404
- request `/api/share-card/[sessionId]` and confirm HTTP 200 JSON payload

- [ ] **Step 6: Commit any last-mile docs/test adjustments if rollout surfaced them**

```bash
git add .
git commit -m "chore: finalize blob persistence rollout"
```

