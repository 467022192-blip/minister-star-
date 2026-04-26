# Ziwei Growth Site

A mainland Chinese Ziwei Dou Shu content growth website built with Next.js.

## Local setup

1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env`
3. Choose one persistence mode in `.env`:
   - `ZIWEI_PERSISTENCE_MODE=prisma` + `DATABASE_URL=...` (full local DB mode)
   - `ZIWEI_PERSISTENCE_MODE=blob` + `BLOB_READ_WRITE_TOKEN=...` (no-DB but cross-request persistent sessions)
   - `ZIWEI_PERSISTENCE_MODE=memory` (ephemeral fallback)
4. If using Prisma mode, start Postgres and make sure `DATABASE_URL` is reachable
5. If using Prisma mode, generate Prisma client: `npx prisma generate`
6. If using Prisma mode, apply the initial schema: `npx prisma migrate dev`
7. Run `npm run dev`

### Mac + Postgres.app quick path

- Start a local dev instance and ensure the app database exists: `npm run db:local:start`
- Apply migrations: `npm run db:migrate`
- Seed a persisted computed sample session: `npm run db:seed:sample`
- Run a full app+DB smoke check: `npm run smoke:local`
- Run the full local verification chain: `npm run verify:local`

The default helper scripts look for Postgres.app binaries under:

- `/Applications/Postgres.app/Contents/Versions/latest/bin`

Override with `POSTGRES_BIN_DIR=/your/path` if needed.

## City data

- The current `data/cities/cn-cities.json` is generated from the open-source project `modood/Administrative-divisions-of-China`.
- Refresh the local city dataset with: `npm run data:cities:update`
- The generated file keeps mainland prefecture-level cities and normalizes municipality city names to `北京市` / `上海市` / `天津市` / `重庆市`.

## Testing

- Unit/integration: `npm run test:unit`
- E2E: `npm run test:e2e`

## Production deployment

The repo is prepared for Vercel deployment.

### Recommended first production deploy (database-free)

- Set `ZIWEI_PERSISTENCE_MODE=blob`
- Set `BLOB_READ_WRITE_TOKEN=<your vercel blob read-write token>`
- Do not set `DATABASE_URL`
- Set `NEXT_PUBLIC_SITE_URL=https://<your production domain>`

This mode is deployable on Vercel without Postgres and persists quiz/chart sessions in Blob, so `/result/[sessionId]`, `/share/[sessionId]`, and `/api/share-card/[sessionId]` can read across requests and instances.

### Memory mode note

`memory` is kept as test/local fallback. It is not recommended for production because in-memory sessions are not shared across Vercel instances.

### Persistent production env (later, after Postgres is ready)

- `DATABASE_URL=<your managed postgres connection string>`
- `NEXT_PUBLIC_SITE_URL=https://<your production domain>`

`ZIWEI_PERSISTENCE_MODE=prisma` is optional once `DATABASE_URL` is present. Use it only when you want to force Prisma mode explicitly.

### Vercel path

1. Authenticate and link the project:
   - `npx vercel login`
   - `npx vercel link`
2. For the first no-database rollout, add production env values:
   - `npx vercel env add ZIWEI_PERSISTENCE_MODE production`
   - use value `blob`
   - `npx vercel env add BLOB_READ_WRITE_TOKEN production`
   - `npx vercel env add NEXT_PUBLIC_SITE_URL production`
3. Deploy:
   - `npx vercel --prod`

### Re-enable Prisma later

1. Prepare the target Postgres instance.
2. Run Prisma migration against the target database manually:
   - `DATABASE_URL=<your managed postgres connection string> npx prisma migrate deploy`
3. Add or update production env values:
   - `npx vercel env add ZIWEI_PERSISTENCE_MODE production`
   - optional value `prisma`
   - `npx vercel env add DATABASE_URL production`
   - `npx vercel env add NEXT_PUBLIC_SITE_URL production`
4. Deploy:
   - `npx vercel --prod`

`vercel.json` is configured so Vercel build will automatically run:

- `next build`

This keeps the initial Vercel deploy path independent from database availability.

## Persistence modes

- `memory`: default in tests, and fallback when no persistence env is available.
- `prisma`: active when `DATABASE_URL` exists (outside tests), or when explicitly forced.
- `blob`: active when `BLOB_READ_WRITE_TOKEN` exists and `DATABASE_URL` is absent (outside tests), or when explicitly forced.

Automatic inference (when `ZIWEI_PERSISTENCE_MODE` is not set):
- `NODE_ENV=test` -> `memory`
- non-test with `DATABASE_URL` -> `prisma`
- non-test with no `DATABASE_URL` and with `BLOB_READ_WRITE_TOKEN` -> `blob`
- otherwise -> `memory`

Note: this rollout only changes quiz/chart session persistence. Analytics persistence remains unchanged.

## Prisma status

- Prisma client generation has been validated.
- Initial SQL migration has been generated at `prisma/migrations/20260424_init/migration.sql`.
- Local Postgres migration and Prisma-path smoke verification have been completed.

## Current status

This repository is being implemented from the approved design and implementation plan.
