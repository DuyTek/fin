# Finance App — Codebase Overview

A single-user personal finance webapp: record income & expenses, categorize them
(built-in + custom categories), and see a per-month dashboard (income / expense /
balance + spending-by-category breakdown).

This document is both a map of the current code and the planning base for the
follow-up phase (savings/income **goals** and a richer **analytics** dashboard).

## Stack

- **Runtime / server:** Bun (`Bun.serve` with `routes`), single long-running process.
- **DB:** `bun:sqlite` (a local file). No ORM — hand-written SQL with prepared statements.
- **Frontend:** React 19 + Tailwind v4 + shadcn/ui primitives, bundled by Bun's
  built-in bundler via HTML imports (no Vite/webpack).
- **Currency:** **VND only.** Amounts are whole integers (đồng has no minor units).

## Architecture at a glance

```
Browser (React)
  └─ hooks/useFinance.ts ── lib/api.ts ──HTTP──▶ src/index.ts (routes)
                                                    └─ server/db.ts ──▶ finance.db (SQLite)
```

The browser never touches the DB; all reads/writes go through the REST API.
Shared TypeScript types ([src/types.ts](../src/types.ts)) are imported by **both**
server and frontend, so payload shapes stay in sync.

## File layout

| Path | Responsibility |
|------|----------------|
| [src/types.ts](../src/types.ts) | Shared domain types + request payloads (server ↔ client). |
| [src/server/db.ts](../src/server/db.ts) | SQLite schema, seeding, and all data-access functions. |
| [src/server/http.ts](../src/server/http.ts) | JSON/error response helpers + request validators. |
| [src/index.ts](../src/index.ts) | `Bun.serve` route table (REST API) + SPA catch-all. |
| [src/lib/money.ts](../src/lib/money.ts) | `formatVND` / `formatVNDSymbol` / `parseVND` (+ tests). |
| [src/lib/dates.ts](../src/lib/dates.ts) | Month/`YYYY-MM-DD` helpers used by the period picker. |
| [src/lib/api.ts](../src/lib/api.ts) | Typed `fetch` wrappers for every endpoint. |
| [src/hooks/useAsync.ts](../src/hooks/useAsync.ts) | Generic async-data hook (loading/error/data/reload). Reusable. |
| [src/hooks/useFinance.ts](../src/hooks/useFinance.ts) | `useCategories` / `useTransactions` / `useSummary` over `useAsync`. |
| [src/components/](../src/components/) | UI: `AmountInput`, `TransactionForm`, `TransactionList`, `SummaryCards`, `MonthPicker`, `CategoryManager`. |
| [src/App.tsx](../src/App.tsx) | Page shell: month state, wires hooks → components, `refreshAll`. |
| [src/components/ui/](../src/components/ui/) | shadcn primitives (button, card, input, label, select, textarea). |

## Data model

**categories** — `id`, `name`, `type` (`income`|`expense`), `is_custom` (0 builtin /
1 user), `created_at`. `UNIQUE(name, type)`. Built-ins are seeded once on first run.

**transactions** — `id`, `type`, `amount` (INTEGER VND, `> 0`), `category_id`
(FK → categories), `note`, `occurred_on` (`YYYY-MM-DD`), `created_at`.
Indexed on `occurred_on`, `category_id`, `type`.

## API reference

| Method | Path | Notes |
|--------|------|-------|
| GET | `/api/categories?type=` | List, optional type filter. |
| POST | `/api/categories` | Create custom (`{name, type}`). 409 on duplicate. |
| DELETE | `/api/categories/:id` | 403 builtin · 409 if used by a transaction. |
| GET | `/api/transactions?from=&to=&type=&category_id=` | Filtered, newest first, joined w/ category name. |
| POST | `/api/transactions` | Validates amount>0 and that category type matches. |
| PATCH | `/api/transactions/:id` | Partial update. |
| DELETE | `/api/transactions/:id` | — |
| GET | `/api/summary?from=&to=` | `{income, expense, balance, expense_by_category[]}` via SQL aggregation. |

## Conventions

- **Money:** store integers; format only at the edges. Input uses
  `AmountInput` (shows `10,000`, emits `10000`); display uses `formatVNDSymbol`
  (`₫10,000`). Never do float math on amounts.
- **Forms:** React 19 `useActionState` owns submit pending + error
  (see `TransactionForm`, `CategoryManager`).
- **Data fetching:** all views use `useAsync`; after any mutation call the
  relevant `reload()` (App's `refreshAll` reloads transactions + summary + categories).
- **Validation:** server is the source of truth (`server/http.ts`); the client
  surfaces returned `error` strings.

## Running / deploying

- Dev: `bun dev` (HMR). Tests: `bun test`. Typecheck: `bunx tsc --noEmit`.
- DB path: `DATABASE_PATH` env var (default `./finance.db`).
- **Deploy to a long-running Bun host** (Railway / Fly.io / Render / VPS), **not
  Vercel** — Vercel runs ephemeral Node serverless functions, so neither the
  `Bun.serve` process nor a local SQLite file survives there. Mount a
  **persistent volume** and point `DATABASE_PATH` at it, then run `bun run start`.
  Without a mounted volume the data is wiped on each deploy.

---

## Roadmap — follow-up phase

### 1. Savings / income goals
- **New table `goals`:** `id`, `name`, `type` (`saving` | `income`),
  `target_amount` INTEGER, `period` (e.g. `monthly` | one-off w/ `deadline` date),
  `created_at`.
- **API:** `GET/POST/PATCH/DELETE /api/goals`; progress is **derived** — reuse
  `getSummary(from, to)` (saving progress = balance for the period; income goal
  progress = income for the period) rather than storing computed values.
- **UI:** a `Goals` card with a progress bar per goal (reuse the bar markup from
  `SummaryCards`). New hook `useGoals` on top of `useAsync`.

### 2. Analytics dashboard
- **Trend over time:** add `GET /api/summary/series?months=N` returning per-month
  `{month, income, expense}` (one `GROUP BY strftime('%Y-%m', occurred_on)` query).
  Render an income-vs-expense line/bar chart + savings-rate line.
- **Category breakdown:** the existing `expense_by_category` already powers a
  pie/donut; promote the bars in `SummaryCards` to a chart.
- **Charting lib:** TBD — `recharts` is the conventional React choice; evaluate
  bundle size vs. a lightweight SVG approach before adding a dependency.
- Keep aggregation in SQL (fast, indexed) and the client purely presentational.

### Nice-to-haves (unscoped)
- CSV import/export, recurring transactions, search/filter UI on the list,
  multi-currency (explicitly deferred — would require rates + conversion),
  and auth (if it ever becomes multi-user).
