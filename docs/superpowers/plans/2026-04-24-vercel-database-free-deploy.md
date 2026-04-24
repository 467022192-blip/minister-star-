# Vercel Database-Free Deploy Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the app install, build, and run on Vercel without `DATABASE_URL`, while preserving the Prisma path for later database rollout.

**Architecture:** Keep Prisma dependencies and schema in place, but decouple Vercel build from Prisma migration/generate and make runtime persistence mode environment-aware. Replace the lockfile's private registry tarball URLs with public npm registry URLs and pin project-level npm registry so future installs stay deployable.

**Tech Stack:** Next.js 15, Node/npm, Vercel, Prisma, Vitest

---

### File Structure

**Files:**
- Create: `.npmrc`
- Create: `tests/unit/db.test.ts`
- Modify: `package-lock.json`
- Modify: `vercel.json`
- Modify: `lib/db.ts`
- Modify: `README.md`
- Reference: `docs/superpowers/specs/2026-04-24-vercel-database-free-deploy-design.md`

### Task 1: Lock npm installs to the public registry

**Files:**
- Create: `.npmrc`
- Modify: `package-lock.json`

- [ ] **Step 1: Create project-level npm registry config**

```ini
registry=https://registry.npmjs.org
```

- [ ] **Step 2: Rewrite lockfile tarball hosts without changing locked versions**

Run: use a targeted script to replace `https://bnpm.byted.org/` with `https://registry.npmjs.org/` in `package-lock.json`
Expected: dependency versions stay unchanged and the lockfile now resolves packages from `registry.npmjs.org`

- [ ] **Step 3: Verify private registry URLs are gone and versions stayed pinned**

Run: `rg -n 'bnpm\.byted\.org' package-lock.json && git diff -- package-lock.json`
Expected: no private registry matches, and the diff only changes resolved hosts / related metadata instead of re-resolving versions wholesale

- [ ] **Step 4: Commit**

```bash
git add .npmrc package-lock.json
git commit -m "fix: use public npm registry for deployable installs"
```

### Task 2: Make runtime persistence environment-aware and decouple build from Prisma migration

**Files:**
- Modify: `lib/db.ts`
- Modify: `vercel.json`
- Test: `tests/unit/db.test.ts`

- [ ] **Step 1: Write failing tests for persistence mode resolution and explicit Prisma access errors**

```ts
import { describe, expect, it } from 'vitest'

describe('db persistence mode', () => {
  it('defaults to memory when DATABASE_URL is missing', () => {})
  it('defaults to prisma when DATABASE_URL exists', () => {})
})

describe('db access', () => {
  it('throws when prisma is forced without DATABASE_URL', () => {})
})
```

Note: these tests must explicitly clear and restore `process.env.ZIWEI_PERSISTENCE_MODE` because `tests/setup.ts` globally sets it to `memory`. The `DATABASE_URL => prisma` default-branch test must also temporarily stub `process.env.NODE_ENV = 'production'` and restore it afterwards, because Vitest runs under `NODE_ENV=test`.

- [ ] **Step 2: Run the targeted test to verify failure**

Run: `npm run test:unit -- tests/unit/db.test.ts`
Expected: FAIL because the new test file does not exist yet or assertions fail against current logic

- [ ] **Step 3: Implement the persistence rules and simplify Vercel build**

```ts
export function getPersistenceMode(): PersistenceMode {
  const configuredMode = process.env.ZIWEI_PERSISTENCE_MODE
  if (configuredMode === 'memory' || configuredMode === 'prisma') return configuredMode
  if (process.env.NODE_ENV === 'test') return 'memory'
  return process.env.DATABASE_URL ? 'prisma' : 'memory'
}
```

Keep the explicit failure in `getDb()`:

```ts
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required when ZIWEI_PERSISTENCE_MODE=prisma')
}
```

`vercel.json` becomes:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "framework": "nextjs",
  "buildCommand": "next build"
}
```

- [ ] **Step 4: Run tests to verify the new runtime rules pass**

Run: `npm run test:unit -- tests/unit/db.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/db.ts vercel.json tests/unit/db.test.ts
git commit -m "fix: support database-free Vercel runtime"
```

### Task 3: Update deployment docs to match the new rollout path

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Update local and production deployment guidance**

Document:
- no-DB Vercel rollout path
- recommended `ZIWEI_PERSISTENCE_MODE=memory` for first rollout
- future Prisma re-enable order: migrate DB first, then add `DATABASE_URL`, then redeploy

- [ ] **Step 2: Verify the README reflects the implemented behavior**

Run: `rg -n 'DATABASE_URL|ZIWEI_PERSISTENCE_MODE|prisma migrate deploy|next build' README.md vercel.json`
Expected: README matches the no-DB rollout path and `vercel.json` no longer runs Prisma commands at build time

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "docs: describe database-free Vercel deployment"
```

### Task 4: Verify install, build, and runtime behavior end to end

**Files:**
- Modify: none

- [ ] **Step 1: Isolate local env files from no-DB verification**

Run: temporarily move `.env` / `.env.local` out of the project before verification
Expected: subsequent checks cannot accidentally pick up a local `DATABASE_URL`

- [ ] **Step 2: Reinstall dependencies from scratch**

Run: `rm -rf node_modules && npm install`
Expected: PASS with no private registry references needed

- [ ] **Step 3: Run focused unit coverage for persistence behavior**

Run: `npm run test:unit -- tests/unit/db.test.ts tests/unit/repositories/quiz-session-repo.test.ts tests/unit/repositories/chart-session-repo.test.ts`
Expected: PASS

- [ ] **Step 4: Run a production build without DATABASE_URL**

Run: `env -u DATABASE_URL -u ZIWEI_PERSISTENCE_MODE npm run build`
Expected: PASS

- [ ] **Step 5: Start the production server and smoke check critical routes**

Run: `env -u DATABASE_URL ZIWEI_PERSISTENCE_MODE=memory npm run start`
Expected: server starts successfully

Then verify:
- `/`
- `/quiz`
- `/chart`
- the chart submission server action path still executes successfully in no-DB mode
- known degraded paths `/result/[sessionId]` and `/share/[sessionId]` return 404 via `notFound()` for missing sessions
- known degraded path `/api/share-card/[sessionId]` returns HTTP 404 for missing sessions

Prefer reusing existing integration coverage for the degraded paths where possible, especially `tests/integration/chart-submit.test.ts`, `tests/integration/result-page.test.tsx`, `tests/integration/share-page.test.tsx`, and `tests/integration/share-card-route.test.ts`.

- [ ] **Step 6: Restore local env files after verification**

Run: move `.env` / `.env.local` back into place
Expected: local developer setup is restored

- [ ] **Step 7: Commit verification-safe code changes if needed**

```bash
git add .
git commit -m "test: verify database-free deploy path"
```

### Task 5: Push changes and hand off Vercel rollout steps

**Files:**
- Modify: none

- [ ] **Step 1: Review git status and branch**

Run: `git status --short --branch`
Expected: clean working tree on `main`

- [ ] **Step 2: Push to GitHub**

Run: `git push origin main`
Expected: PASS

- [ ] **Step 3: Hand off the exact Vercel settings**

Tell the operator to:
- remove any existing `ZIWEI_PERSISTENCE_MODE=prisma`
- set `ZIWEI_PERSISTENCE_MODE=memory` for the first deploy (recommended)
- leave `DATABASE_URL` unset
- redeploy
