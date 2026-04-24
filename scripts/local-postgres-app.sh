#!/usr/bin/env bash
set -euo pipefail

POSTGRES_BIN_DIR="${POSTGRES_BIN_DIR:-/Applications/Postgres.app/Contents/Versions/latest/bin}"
POSTGRES_PORT="${POSTGRES_PORT:-5432}"
POSTGRES_USER="${POSTGRES_USER:-postgres}"
POSTGRES_DB="${POSTGRES_DB:-ziwei_growth_site}"
PGDATA_DIR="${PGDATA_DIR:-$HOME/Library/Application Support/Postgres/ziwei-growth-site-db}"
LOGFILE="$PGDATA_DIR/server.log"

for bin in initdb pg_ctl createdb psql; do
  if [ ! -x "$POSTGRES_BIN_DIR/$bin" ]; then
    echo "missing postgres binary: $POSTGRES_BIN_DIR/$bin" >&2
    exit 1
  fi
done

mkdir -p "$(dirname "$PGDATA_DIR")"

if [ ! -f "$PGDATA_DIR/PG_VERSION" ]; then
  rm -rf "$PGDATA_DIR"
  "$POSTGRES_BIN_DIR/initdb" -D "$PGDATA_DIR" -U "$POSTGRES_USER" -A trust --locale=C --encoding=UTF8 >/tmp/ziwei-initdb.log
fi

if ! nc -z localhost "$POSTGRES_PORT" >/dev/null 2>&1; then
  "$POSTGRES_BIN_DIR/pg_ctl" -D "$PGDATA_DIR" -l "$LOGFILE" -o "-p $POSTGRES_PORT" start
fi

for _ in $(seq 1 20); do
  if nc -z localhost "$POSTGRES_PORT" >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

if ! nc -z localhost "$POSTGRES_PORT" >/dev/null 2>&1; then
  echo "postgres did not start on localhost:$POSTGRES_PORT" >&2
  exit 1
fi

"$POSTGRES_BIN_DIR/createdb" -h localhost -p "$POSTGRES_PORT" -U "$POSTGRES_USER" "$POSTGRES_DB" 2>/dev/null || true

echo "postgres ready on localhost:$POSTGRES_PORT"
echo "database: $POSTGRES_DB"
