# Finance App — Product Overview

A single-user personal finance webapp: record income & expenses, categorize them
(built-in + custom categories), and review a per-month dashboard (income / expense /
balance + spending-by-category breakdown). Currency is VND only — amounts are whole
integers (đồng has no minor units).

This document is the high-level map of what the product is today and where it's
headed. For line-by-line code structure, see [OVERVIEW.md](OVERVIEW.md); for the
active Budget Planner build-out, see the implementation plan referenced at the bottom.

## Architecture

```
Browser (React)
  └─ hooks/useFinance.ts ── lib/api.ts ──HTTP──▶ src/index.ts (routes)
                                                    └─ server/db.ts ──▶ finance.db (SQLite)
```

- **Server:** Bun (`Bun.serve` + `routes`), single long-running process, no Express.
- **DB:** `bun:sqlite`, hand-written SQL, no ORM. Schema + seeding run on startup.
- **Frontend:** React 19 + Tailwind v4 + shadcn/ui (Radix primitives), bundled via
  Bun's HTML-import pipeline (no Vite/webpack).
- **Type safety:** `src/types.ts` is imported by both server and client so REST
  payload shapes stay in sync end to end.
- The browser never touches the DB directly — every read/write goes through the
  REST API in `src/index.ts`.

## Current Capabilities

- **Transactions** — record income/expense with amount, category, note, date;
  inline edit & delete.
- **Categories** — built-in seeded set (Food & Drink, Transport, Salary, …) plus
  user-created custom categories, scoped to income or expense.
- **Month dashboard** — `MonthPicker`-driven summary: total income, expense,
  balance, and an expense-by-category breakdown with progress bars.

### Current Data Model

| Table | Key columns |
|---|---|
| `categories` | `id`, `name`, `type` (income\|expense), `is_custom`, `created_at`. `UNIQUE(name, type)` |
| `transactions` | `id`, `type`, `amount` (INTEGER VND, >0), `category_id` (FK), `note`, `occurred_on` (`YYYY-MM-DD`), `created_at` |

### Conventions Worth Knowing

- **Money:** store/transmit whole-VND integers; format only at the UI edge
  (`formatVND` / `formatVNDSymbol`); never do float math on amounts.
- **Forms:** React 19 `useActionState` owns submit-pending + error state.
- **Data fetching:** every view goes through the generic `useAsync` hook; after
  any mutation, call the relevant `reload()` (App's `refreshAll` does this for
  transactions + summary + categories together).
- **Validation:** the server (`server/http.ts`) is the single source of truth;
  the client just surfaces the returned `error` string.

---

## Incoming Features

### 1. Budget Planner — Zero-Based Budgeting *(in progress)*

**What it does:** lets the user assign a monthly VND spending cap to each expense
category, then automatically maps live transactions onto those caps to show
real-time progress, a projected end-of-month position, and proactive alerts.

- **Zero-based rule:** Income − Σ(category budgets) should trend toward zero;
  the planner surfaces the "unallocated" delta so the user can fully assign
  every đồng of income to a job.
- **Live mapping:** spending per category is derived directly from the existing
  `transactions` table (no duplicated bookkeeping) via a join against a new
  `budgets` table (`category_id`, `month`, `amount`).
- **Burn rate & forecast:** `burn_rate = spent / days_elapsed`,
  `forecast = burn_rate × days_in_month` — projects whether a category is on
  pace to exceed its cap before the month ends.
- **Guardrail status:** each budget is classified `on_track` (<80% used),
  `warning` (80–100%), or `exceeded` (>100%), driving both card styling and
  notification triggers.
- **Notifications:** in-app alert banners plus opt-in browser
  `Notification` API pushes when a category enters warning/exceeded state.
- **New surface:** a "Budget Planner" tab alongside the existing "Transactions"
  view, sharing the same month-scoped navigation.

### 2. Analytics & Reports Dashboard

**What it does:** turns the single-month snapshot into a multi-month picture —
trend lines, category mix over time, and a savings-rate view — so the user can
spot patterns the monthly dashboard can't show.

- **Trend over time:** a new `GET /api/summary/series?months=N` endpoint
  (`GROUP BY strftime('%Y-%m', occurred_on)`) returning per-month
  `{month, income, expense}`, rendered as an income-vs-expense chart with a
  derived savings-rate line.
- **Category mix:** promote the existing `expense_by_category` bars into a
  proper chart (pie/donut or stacked bar) and let it span a selectable range.
- **Reports:** a printable/exportable month or quarter summary (income, expense,
  category mix, budget performance once the Budget Planner ships) — likely a
  simple formatted view that reuses `formatVNDSymbol` and existing summary data.
- **Charting approach:** keep all aggregation in SQL (fast, indexed); the client
  stays purely presentational. Evaluate `recharts` vs. a lightweight SVG
  approach before adding a charting dependency.

### 3. Savings & Income Goals

**What it does:** lets the user set a savings target or income target for a
period and track progress against it — a natural complement to budgets (budgets
constrain *outflow*, goals motivate *accumulation*).

- **New table `goals`:** `id`, `name`, `type` (`saving`|`income`),
  `target_amount`, `period` (`monthly` or one-off with `deadline`), `created_at`.
- **Derived progress:** reuse `getSummary(from, to)` rather than storing computed
  values — saving-goal progress = balance for the period, income-goal progress =
  income for the period.
- **UI:** a `Goals` card with per-goal progress bars (visually consistent with
  `BudgetCard`/`SummaryCards`), via a new `useGoals` hook over `useAsync`.

### 4. Unified Notifications & Alerts *(proposed)*

The Budget Planner introduces the app's first notification logic
(`useBudgetNotifications`: in-app banners + browser `Notification` pushes for
warning/exceeded budgets). Once Goals and Analytics exist, it's worth
generalizing this into a shared notification layer — e.g. "goal X reached",
"this month's spending is trending above last month's" — instead of growing
several bespoke alert hooks side by side.

### 5. Recurring Transactions *(proposed)*

A natural pairing with budgeting and forecasting: salaries, rent, subscriptions,
and utility bills repeat monthly. Auto-generating these (with a lightweight
`recurrence` rule on a transaction template, materialized into real
`transactions` rows on schedule or on month view) would remove manual re-entry
and make the Budget Planner's burn-rate/forecast numbers more accurate from
day one of each month.

---

## Suggested Build Order

1. **Budget Planner** (active) — depends only on existing `transactions` +
   `categories`; unlocks the guardrail/forecast UX the product description leads with.
2. **Analytics & Reports** — layers naturally on top of the summary aggregation
   that already exists; benefits from Budget Planner's `lib/budget.ts` math
   (burn rate, forecasting) being already proven out.
3. **Savings & Income Goals** — shares UI patterns (progress cards, `useAsync`
   hooks) with both of the above; cheap to add once those land.
4. **Recurring Transactions** — meaningfully improves the accuracy of Budget
   Planner forecasts and Analytics trends, so it pays off more once both exist.
5. **Unified Notifications** — a refactor once ≥2 features need alerting; not
   worth abstracting before then.

## Nice-to-Haves (Unscoped)

CSV import/export, search/filter UI on the transaction list, multi-currency
(deferred — requires rate conversion), and auth (only relevant if the app ever
becomes multi-user).

---

*Detailed file-by-file codebase map: [OVERVIEW.md](OVERVIEW.md). The active
Budget Planner build has its own step-by-step implementation plan tracked
outside this repo (Claude Code plan file).*
