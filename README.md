# lomalista

Shared vacation lists for teams. A list is a document with an unguessable URL; anyone with the URL can
add names and date ranges. No accounts. Stored data: names (Nordic letters, ≤15 chars) and dates only.
Lists become read-only 14 days after the season ends and are deleted after `LOMALISTA_RETENTION_DAYS` (365).

## Develop
```
cd backend  && cargo run                 # API on 127.0.0.1:3000
cd frontend && pnpm install && pnpm dev  # proxies /api to the backend
```
Tests: `cargo test` (backend), `pnpm test && pnpm typecheck` (frontend).

## Deploy
```
cd frontend && pnpm build
cd backend  && cargo build --release
LOMALISTA_DB=/var/lib/lomalista/db.sqlite LOMALISTA_BIND=0.0.0.0:3000 \
LOMALISTA_STATIC_DIR=../frontend/dist ./target/release/lomalista
```
Put it behind a TLS-terminating reverse proxy and do not log request paths there: the URL is the secret.
