# lomalista – agent guide

Vacation scheduling web app for teams in Nordic companies. A team's vacation list is a *document*
with a unique random URL. The creator shares the URL; everyone enters their own vacation dates. There is no
authentication or authorization: the unguessable URL is the only access control.

## Hard constraints
- The only data allowed: self-entered names (Nordic letters only, ≤15 characters) and date ranges
  (plus each list's creation date, which drives archiving). Do not add other personal data, titles, free text, IPs, or analytics.
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
- Frontend: `cd frontend && pnpm test && pnpm typecheck && pnpm check && pnpm build`; `pnpm check:fix` formats and fixes with Biome (`biome.json`); CI uses `pnpm ci:lint` and `pnpm ci:typecheck`; local Node and pnpm versions are pinned in `mise.toml` (run `mise install`), CI pins pnpm via `packageManager` in `package.json` (keep the two in sync); `devEngines` in `package.json` makes pnpm refuse to run on another major version of Node or pnpm (update its ranges only on a major upgrade); dev server `pnpm dev`
  (proxies `/api` to 127.0.0.1:3000).
- CI: Forgejo Actions in `.forgejo/workflows/ci.yml`. The backend job runs in `node:<version>-bookworm`
  (keep the tag in sync with `mise.toml`) and pins Rust in `RUST_VERSION` (local toolchains are not
  pinned). The frontend job runs in `node:24-alpine`, where `pnpm/setup` installs pnpm from
  `packageManager`, Node from `devEngines.runtime`, and the dependencies.
- GitHub Actions: `.github/workflows/test.yml` runs the checks on pull requests; `build.yml` builds the
  release binary and `frontend/dist` on pushes to `main` and uploads them as artifacts. Same Rust pin
  and `pnpm/setup` use as the Forgejo workflow; keep the two in step.
- Lint workflows with jactionlint (pinned in `mise.toml`, with shellcheck for `run:` scripts): `jactionlint`
  for `.github` (config `.github/jactionlint.yaml`) and
  `jactionlint -c .forgejo/jactionlint.yaml .forgejo/workflows/*.yml` for Forgejo.
- Pin workflow actions to commit SHAs with pinprick (pinned in `mise.toml`): `pinprick pin` pins new
  `uses:` references and `pinprick update` checks pinned actions for updates; both are dry runs until
  you add `--write`. It covers both `.github` and `.forgejo`; run jactionlint afterwards.

## Code search
- Text: use ripgrep (`rg`) for literal strings, translation keys, error codes, comments, and config.
  Add `-F` when the search string contains regex characters, and `-g`/`-t` to limit it to certain
  files (`rg -F "err_range" -t ts`). Do not use `grep -r` or `find | xargs grep`.
- Structure: use ast-grep (`ast-grep run -p '<pattern>' -l <lang>`) for code shapes such as call
  sites, JSX usage, or functions with a given signature, where text search would match comments,
  strings, or similar names.
- Dependencies: to search a library's types or source under `node_modules`, pass its path and add
  `-u`; packages ship their own ignore files, so without it ripgrep silently finds nothing.

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
