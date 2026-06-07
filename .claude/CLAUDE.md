
# Project: Finance Webapp

A single-user personal finance tracker (VND only, whole-integer amounts — đồng
has no minor units). Full product context lives in `.claude/docs/`:
[PRODUCT.md](docs/PRODUCT.md) (features, roadmap) and
[OVERVIEW.md](docs/OVERVIEW.md) (file-by-file codebase map). Read those before
making non-trivial changes — this file only covers conventions to follow.
Default to using Bun instead of Node.js.


- Use `bun <file>` instead of `node <file>` or `ts-node <file>`
- Use `bun test` instead of `jest` or `vitest`
- Use `bun build <file.html|file.ts|file.css>` instead of `webpack` or `esbuild`
- Use `bun install` instead of `npm install` or `yarn install` or `pnpm install`
- Use `bun run <script>` instead of `npm run <script>` or `yarn run <script>` or `pnpm run <script>`
- Use `bunx <package> <command>` instead of `npx <package> <command>`
- Bun automatically loads `.env`, so don't use `dotenv`.

## APIs

- `Bun.serve()` supports WebSockets, HTTPS, and routes. Don't use `express`.
- `bun:sqlite` for SQLite. Don't use `better-sqlite3`.
- `Bun.redis` / `Bun.sql` for Redis/Postgres if ever needed. Don't use `ioredis`/`pg`.
- `WebSocket` is built-in. Don't use `ws`.
- Prefer `Bun.file` over `node:fs` readFile/writeFile.

## Frontend

HTML imports + `Bun.serve()` — no Vite/webpack. See `src/index.html` →
`src/frontend.tsx` → `src/index.ts` for the live wiring (HTML imports a `.tsx`
entry, Bun's bundler transpiles React/Tailwind/CSS automatically, `development.hmr`
gives hot reload). Follow that existing pattern for any new entry points.

## Testing

`bun test` (see `src/lib/money.test.ts` for the project's style — plain
`import { test, expect } from "bun:test"`, no mocking framework).

---

## Architecture

```
Browser (React) → hooks/useFinance.ts → lib/api.ts →HTTP→ src/index.ts (routes)
                                                            → server/db.ts → finance.db (SQLite)
```

The browser never touches the DB — every read/write goes through the REST API.
`src/types.ts` is shared by server and client so payload shapes stay in sync;
update it first when changing any request/response shape.

## File Layout

| Path | Responsibility |
|---|---|
| `src/types.ts` | Shared domain types + request payloads (server ↔ client) |
| `src/server/db.ts` | SQLite schema, seeding, all data-access functions |
| `src/server/http.ts` | JSON/error helpers + request validators (`parseAmount`, `parseDate`, …) |
| `src/index.ts` | `Bun.serve` route table (REST API) + SPA catch-all |
| `src/lib/api.ts` | Typed `fetch` wrappers for every endpoint |
| `src/lib/money.ts` / `dates.ts` | VND formatting/parsing · month/date helpers |
| `src/hooks/useAsync.ts` | Generic async-data hook (loading/error/data/reload) |
| `src/hooks/useFinance.ts` | Resource hooks (`useCategories`, `useTransactions`, `useSummary`) over `useAsync` |
| `src/components/` | Feature UI (`TransactionForm`, `TransactionList`, `SummaryCards`, `MonthPicker`, `CategoryCombobox`, …) |
| `src/components/ui/` | shadcn/Radix primitives (button, card, input, select, …) |
| `src/App.tsx` | Page shell — month state, wires hooks → components, `refreshAll` |

## Conventions to Follow

- **Money is always a whole VND integer.** Never do float math on amounts.
  Parse user input with `parseVND`/`AmountInput`; format for display only at the
  edge with `formatVND`/`formatVNDSymbol`. The DB enforces `amount > 0` via CHECK.
- **Path alias:** `@/*` maps to `src/*` (see `tsconfig.json`) — use it for imports.
- **Forms** use React 19 `useActionState` to own submit-pending + error state
  (see `TransactionForm.tsx` / `CategoryManager.tsx` for the pattern).
- **Data fetching** always goes through `useAsync` — don't hand-roll
  loading/error state. After any mutation, call the relevant hook's `reload()`
  (App's `refreshAll` reloads transactions + summary + categories together).
- **Validation lives on the server** (`server/http.ts` validators +
  `ValidationError`); the client only surfaces the returned `error` string —
  don't duplicate validation logic in components.
- **Dates** are plain `YYYY-MM-DD` / `YYYY-MM` strings, no timezone math — use
  the helpers in `lib/dates.ts` (`monthRange`, `currentMonth`, `shiftMonth`, …).
- **New DB tables** follow the existing pattern in `db.ts`: `CREATE TABLE IF NOT
  EXISTS` in the schema block, FK constraints + indexes, hand-written prepared
  statements (no ORM), seeded/migrated at startup — not via separate migration files.
- **New REST resources** mirror the existing route shape in `src/index.ts`:
  thin handlers that validate input, call a `db.ts` function, and return JSON
  via the `json()`/`error()` helpers from `server/http.ts`.

## Running & Verifying

- `bun dev` — dev server with HMR · `bun start` — production server
- `bun test` — run tests · `bunx tsc --noEmit` — typecheck · `bun run lint` — ESLint
- DB path is configurable via the `DATABASE_PATH` env var (default `./finance.db`)
