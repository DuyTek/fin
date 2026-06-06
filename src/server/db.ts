/**
 * SQLite data layer (bun:sqlite).
 *
 * The DB file path comes from DATABASE_PATH so it can point at a persistent
 * volume in production (see docs/OVERVIEW.md). Schema + builtin categories are
 * created/seeded once on import.
 */
import { Database } from "bun:sqlite";
import type {
  Category,
  CategoryBreakdown,
  CreateCategoryInput,
  CreateTransactionInput,
  Summary,
  Transaction,
  TransactionWithCategory,
  TxType,
  UpdateTransactionInput,
} from "@/types";

const DB_PATH = process.env.DATABASE_PATH ?? "./finance.db";

export const db = new Database(DB_PATH, { create: true });
db.exec("PRAGMA journal_mode = WAL;");
db.exec("PRAGMA foreign_keys = ON;");

db.exec(`
  CREATE TABLE IF NOT EXISTS categories (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT NOT NULL,
    type       TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    is_custom  INTEGER NOT NULL DEFAULT 0 CHECK (is_custom IN (0, 1)),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE (name, type)
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    type        TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    amount      INTEGER NOT NULL CHECK (amount > 0),
    category_id INTEGER NOT NULL REFERENCES categories(id),
    note        TEXT NOT NULL DEFAULT '',
    occurred_on TEXT NOT NULL,
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_tx_occurred_on ON transactions(occurred_on);
  CREATE INDEX IF NOT EXISTS idx_tx_category    ON transactions(category_id);
  CREATE INDEX IF NOT EXISTS idx_tx_type        ON transactions(type);
`);

// ---- Seed builtin categories (once) ----

const BUILTIN: Record<TxType, string[]> = {
  expense: [
    "Food & Drink",
    "Transport",
    "Housing",
    "Utilities",
    "Shopping",
    "Health",
    "Entertainment",
    "Education",
    "Other",
  ],
  income: ["Salary", "Bonus", "Investment", "Gift", "Other"],
};

{
  const count = db.query("SELECT COUNT(*) AS n FROM categories").get() as { n: number };
  if (count.n === 0) {
    const insert = db.query(
      "INSERT INTO categories (name, type, is_custom) VALUES (?, ?, 0)",
    );
    const seed = db.transaction(() => {
      for (const type of ["expense", "income"] as TxType[]) {
        for (const name of BUILTIN[type]) insert.run(name, type);
      }
    });
    seed();
  }
}

// ---- Categories ----

export function listCategories(type?: TxType): Category[] {
  if (type) {
    return db
      .query("SELECT * FROM categories WHERE type = ? ORDER BY is_custom, name")
      .all(type) as Category[];
  }
  return db
    .query("SELECT * FROM categories ORDER BY type, is_custom, name")
    .all() as Category[];
}

export function getCategory(id: number): Category | null {
  return (db.query("SELECT * FROM categories WHERE id = ?").get(id) as Category) ?? null;
}

export function createCategory(input: CreateCategoryInput): Category {
  const row = db
    .query(
      "INSERT INTO categories (name, type, is_custom) VALUES (?, ?, 1) RETURNING *",
    )
    .get(input.name, input.type) as Category;
  return row;
}

export function deleteCategory(id: number): "ok" | "not_found" | "builtin" | "in_use" {
  const cat = getCategory(id);
  if (!cat) return "not_found";
  if (cat.is_custom === 0) return "builtin";
  const used = db
    .query("SELECT 1 FROM transactions WHERE category_id = ? LIMIT 1")
    .get(id);
  if (used) return "in_use";
  db.query("DELETE FROM categories WHERE id = ?").run(id);
  return "ok";
}

// ---- Transactions ----

export interface TxFilters {
  from?: string;
  to?: string;
  type?: TxType;
  category_id?: number;
}

export function listTransactions(filters: TxFilters = {}): TransactionWithCategory[] {
  const where: string[] = [];
  const params: (string | number)[] = [];
  if (filters.from) {
    where.push("t.occurred_on >= ?");
    params.push(filters.from);
  }
  if (filters.to) {
    where.push("t.occurred_on <= ?");
    params.push(filters.to);
  }
  if (filters.type) {
    where.push("t.type = ?");
    params.push(filters.type);
  }
  if (filters.category_id) {
    where.push("t.category_id = ?");
    params.push(filters.category_id);
  }
  const clause = where.length ? `WHERE ${where.join(" AND ")}` : "";
  return db
    .query(
      `SELECT t.*, c.name AS category_name
       FROM transactions t
       JOIN categories c ON c.id = t.category_id
       ${clause}
       ORDER BY t.occurred_on DESC, t.id DESC`,
    )
    .all(...params) as TransactionWithCategory[];
}

export function createTransaction(input: CreateTransactionInput): Transaction {
  return db
    .query(
      `INSERT INTO transactions (type, amount, category_id, note, occurred_on)
       VALUES (?, ?, ?, ?, ?) RETURNING *`,
    )
    .get(
      input.type,
      input.amount,
      input.category_id,
      input.note ?? "",
      input.occurred_on,
    ) as Transaction;
}

export function getTransaction(id: number): Transaction | null {
  return (
    (db.query("SELECT * FROM transactions WHERE id = ?").get(id) as Transaction) ?? null
  );
}

export function updateTransaction(
  id: number,
  input: UpdateTransactionInput,
): Transaction | null {
  const existing = getTransaction(id);
  if (!existing) return null;
  const merged = { ...existing, ...input };
  return db
    .query(
      `UPDATE transactions
       SET type = ?, amount = ?, category_id = ?, note = ?, occurred_on = ?
       WHERE id = ? RETURNING *`,
    )
    .get(
      merged.type,
      merged.amount,
      merged.category_id,
      merged.note,
      merged.occurred_on,
      id,
    ) as Transaction;
}

export function deleteTransaction(id: number): boolean {
  const res = db.query("DELETE FROM transactions WHERE id = ?").run(id);
  return res.changes > 0;
}

// ---- Summary / analytics ----

export function getSummary(from?: string, to?: string): Summary {
  const where: string[] = [];
  const params: string[] = [];
  if (from) {
    where.push("occurred_on >= ?");
    params.push(from);
  }
  if (to) {
    where.push("occurred_on <= ?");
    params.push(to);
  }
  const clause = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const totals = db
    .query(
      `SELECT
         COALESCE(SUM(CASE WHEN type = 'income'  THEN amount END), 0) AS income,
         COALESCE(SUM(CASE WHEN type = 'expense' THEN amount END), 0) AS expense
       FROM transactions ${clause}`,
    )
    .get(...params) as { income: number; expense: number };

  const expenseClause = clause ? `${clause} AND t.type = 'expense'` : "WHERE t.type = 'expense'";
  const expense_by_category = db
    .query(
      `SELECT t.category_id, c.name AS category_name, SUM(t.amount) AS total
       FROM transactions t
       JOIN categories c ON c.id = t.category_id
       ${expenseClause}
       GROUP BY t.category_id
       ORDER BY total DESC`,
    )
    .all(...params) as CategoryBreakdown[];

  return {
    income: totals.income,
    expense: totals.expense,
    balance: totals.income - totals.expense,
    expense_by_category,
  };
}
