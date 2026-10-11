# lomalista – agent guide

Vacation scheduling web app for teams in Nordic companies. A team's vacation list for a season is a *document*
with a unique random URL. The creator shares the URL; everyone enters their own vacation dates. There is no
authentication or authorization: the unguessable URL is the only access control.

## Hard constraints
- The only data allowed: self-entered names (Nordic letters only, ≤15 characters) and date ranges
  (plus the season window dates). Do not add other personal data, titles, free text, IPs, or analytics.
- Never log document IDs or request paths. Keep `Referrer-Policy: no-referrer` and the CSP.
- Name rules live in two places and must stay in sync:
  `backend/src/validation.rs` (authoritative) and `frontend/src/lib/validation.ts` (UX mirror).
- XSS: names can only be Nordic letters, so markup is never stored. Never use `dangerouslySetInnerHTML`,
  `innerHTML`, `eval` or dynamic `href`s (`frontend/src/tests/xss.test.tsx` scans for them). Keep the CSP free of
  `unsafe-inline` for scripts. Hostile-input tests: `backend/tests/xss.rs`, `frontend/src/tests/xss.test.tsx`;
  add new payloads there when touching validation.
- Archived documents are read-only (mutations return 409).

## Layout
- `backend/` – Rust (axum, rusqlite/SQLite). `src/validation.rs` rules, `src/store.rs` DB + archiver,
  `src/api.rs` routes/headers, `tests/api.rs` integration tests.
- `frontend/` – pnpm, rsbuild, React, TypeScript, Tailwind CSS v4, TanStack Query (5 s polling). `src/app/` shell,
  `src/pages/` routes, `src/components/` UI (shared Tailwind class helpers in `ui.tsx`), `src/lib/` api, dates,
  validation, navigation, i18n (`i18n.ts`: en/fi/sv; add every key to all three), `src/styles/` Tailwind theme
  tokens (light/dark), `src/tests/` tests (rstest, happy-dom, Testing Library).

## Commands
- Backend: `cd backend && cargo test && cargo clippy --all-targets -- -D warnings`; run with `cargo run`
  (env: `LOMALISTA_DB`, `LOMALISTA_BIND`, `LOMALISTA_STATIC_DIR`, `LOMALISTA_RETENTION_DAYS`).
- Frontend: `cd frontend && pnpm test && pnpm typecheck && pnpm check && pnpm build`; `pnpm check:fix` formats and fixes with Biome (`biome.json`); CI uses `pnpm ci:lint` and `pnpm ci:typecheck`; Node and pnpm versions are pinned in `mise.toml` (run `mise install`); dev server `pnpm dev`
  (proxies `/api` to 127.0.0.1:3000).

## Running processes (servers, watchers, anything long-lived)
If you start a process, record its PID in a temp file and use that file to stop it. Never use `pkill -f`,
`killall`, or name/pattern matching: it can kill your own shell or unrelated processes.

```bash
nohup ./target/debug/lomalista > "$TMP/server.log" 2>&1 &
echo $! > "$TMP/lomalista.pid"
# ...later
kill "$(cat "$TMP/lomalista.pid")" && rm -f "$TMP/lomalista.pid"
```
Use the session scratchpad or another temp directory (not the repo) for the PID and log files. Always stop
what you started before finishing, and never kill a process you did not start.

## Git
Merge branches into `main` with a rebase-style merge (rebase onto `main`, then fast-forward). Never create
merge commits.
