#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TMP_DIR="$ROOT_DIR/.tmp"
LOGFILE="$TMP_DIR/dev-server.log"
POSTGRES_BIN_DIR="${POSTGRES_BIN_DIR:-/Applications/Postgres.app/Contents/Versions/latest/bin}"

mkdir -p "$TMP_DIR"

if [ -f "$ROOT_DIR/.env" ]; then
  set -a
  source "$ROOT_DIR/.env"
  set +a
fi

bash "$ROOT_DIR/scripts/local-postgres-app.sh"

cd "$ROOT_DIR"
npx prisma migrate deploy
node scripts/seed-prisma-sample.mjs

npm run dev >"$LOGFILE" 2>&1 &
DEV_PID=$!

cleanup() {
  kill "$DEV_PID" >/dev/null 2>&1 || true
}

trap cleanup EXIT

for _ in $(seq 1 40); do
  if curl -sf http://127.0.0.1:3000 >/dev/null; then
    break
  fi
  sleep 1
done

echo "analytics route response:"
curl -sS -X POST http://127.0.0.1:3000/api/analytics \
  -H 'Content-Type: application/json' \
  --data '{"name":"landing_view","payload":{"source":"smoke-script"}}'

echo
echo
echo "share-card route response:"
curl -sS http://127.0.0.1:3000/api/share-card/prisma-computed-session

echo
echo
echo "result page markers:"
curl -sS http://127.0.0.1:3000/result/prisma-computed-session | rg -o '你的核心气质更偏向关系与自我理解的联动|人格与天赋|感情模式|事业与财运' | sort -u

echo
echo "share page markers:"
curl -sS http://127.0.0.1:3000/share/prisma-computed-session | rg -o '你的核心气质更偏向关系与自我理解的联动|人格优先|关系承接|真实排盘入口' | sort -u

echo
echo "latest analytics row in db:"
"$POSTGRES_BIN_DIR/psql" "$DATABASE_URL" -c 'SELECT name, payload FROM "AnalyticsEvent" ORDER BY "createdAt" DESC LIMIT 1;'
