# Ziwei Growth Site

A mainland Chinese Ziwei Dou Shu content growth website built with Next.js.

## Local setup

1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env`
3. Make sure `.env` contains `ZIWEI_PERSISTENCE_MODE=prisma`
4. Start Postgres and make sure `DATABASE_URL` is reachable
5. Generate Prisma client: `npx prisma generate`
6. Apply the initial schema when Postgres is available: `npx prisma migrate dev`
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

### Required production env

- `ZIWEI_PERSISTENCE_MODE=prisma`
- `DATABASE_URL=<your managed postgres connection string>`
- `NEXT_PUBLIC_SITE_URL=https://<your production domain>`

### Vercel path

1. Authenticate and link the project:
   - `npx vercel login`
   - `npx vercel link`
2. Add production env values:
   - `npx vercel env add ZIWEI_PERSISTENCE_MODE production`
   - `npx vercel env add DATABASE_URL production`
   - `npx vercel env add NEXT_PUBLIC_SITE_URL production`
3. Deploy:
   - `npx vercel --prod`

`vercel.json` is configured so Vercel build will automatically run:

- `npx prisma migrate deploy`
- `npx prisma generate`
- `next build`

This keeps the MVP deployment path aligned with the persisted Prisma/Postgres production contract.

## Persistence modes

- `prisma`: default for local development and production. Result/share/analytics read from persisted sessions and events.
- `memory`: used by the test harness so unit/integration tests can run without a live Postgres instance.

## Prisma status

- Prisma client generation has been validated.
- Initial SQL migration has been generated at `prisma/migrations/20260424_init/migration.sql`.
- Local Postgres migration and Prisma-path smoke verification have been completed.

## Current status

This repository is being implemented from the approved design and implementation plan.
