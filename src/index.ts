import { serve } from "bun";
import index from "./index.html";
import * as store from "./server/db";
import {
  error,
  isTxType,
  json,
  parseAmount,
  parseDate,
  parseId,
  parseMonth,
  ValidationError,
} from "./server/http";
import type { TxType } from "./types";

const server = serve({
  routes: {
    // ---- Categories ----
    "/api/categories": {
      GET(req) {
        const type = new URL(req.url).searchParams.get("type");
        return json(store.listCategories(isTxType(type) ? type : undefined));
      },
      async POST(req) {
        try {
          const body = (await req.json()) as { name?: unknown; type?: unknown };
          const name = typeof body.name === "string" ? body.name.trim() : "";
          if (!name) throw new ValidationError("name is required");
          if (!isTxType(body.type)) throw new ValidationError("type must be income or expense");
          return json(store.createCategory({ name, type: body.type }), 201);
        } catch (e) {
          if (e instanceof ValidationError) return error(e.message);
          // UNIQUE(name, type) violation
          return error("a category with that name and type already exists", 409);
        }
      },
    },

    "/api/categories/:id": {
      DELETE(req) {
        const id = parseId(req.params.id);
        if (id === null) return error("invalid id", 400);
        switch (store.deleteCategory(id)) {
          case "ok":
            return json({ ok: true });
          case "not_found":
            return error("category not found", 404);
          case "builtin":
            return error("built-in categories cannot be deleted", 403);
          case "in_use":
            return error("category is used by existing transactions", 409);
        }
      },
    },

    // ---- Transactions ----
    "/api/transactions": {
      GET(req) {
        const p = new URL(req.url).searchParams;
        const type = p.get("type");
        const categoryId = p.get("category_id");
        return json(
          store.listTransactions({
            from: p.get("from") ?? undefined,
            to: p.get("to") ?? undefined,
            type: isTxType(type) ? type : undefined,
            category_id: categoryId ? Number(categoryId) : undefined,
          }),
        );
      },
      async POST(req) {
        try {
          const body = (await req.json()) as Record<string, unknown>;
          if (!isTxType(body.type)) throw new ValidationError("type must be income or expense");
          const amount = parseAmount(body.amount);
          const categoryId = Number(body.category_id);
          const category = store.getCategory(categoryId);
          if (!category) throw new ValidationError("category not found");
          if (category.type !== body.type) {
            throw new ValidationError("category type does not match transaction type");
          }
          const occurred_on = parseDate(body.occurred_on);
          const note = typeof body.note === "string" ? body.note : "";
          return json(
            store.createTransaction({
              type: body.type,
              amount,
              category_id: categoryId,
              note,
              occurred_on,
            }),
            201,
          );
        } catch (e) {
          if (e instanceof ValidationError) return error(e.message);
          throw e;
        }
      },
    },

    "/api/transactions/:id": {
      async PATCH(req) {
        const id = parseId(req.params.id);
        if (id === null) return error("invalid id", 400);
        try {
          const body = (await req.json()) as Record<string, unknown>;
          const patch: {
            type?: TxType;
            amount?: number;
            category_id?: number;
            note?: string;
            occurred_on?: string;
          } = {};
          if (body.type !== undefined) {
            if (!isTxType(body.type)) throw new ValidationError("invalid type");
            patch.type = body.type;
          }
          if (body.amount !== undefined) patch.amount = parseAmount(body.amount);
          if (body.category_id !== undefined) {
            const cid = Number(body.category_id);
            if (!store.getCategory(cid)) throw new ValidationError("category not found");
            patch.category_id = cid;
          }
          if (body.note !== undefined) patch.note = String(body.note);
          if (body.occurred_on !== undefined) patch.occurred_on = parseDate(body.occurred_on);

          const updated = store.updateTransaction(id, patch);
          if (!updated) return error("transaction not found", 404);
          return json(updated);
        } catch (e) {
          if (e instanceof ValidationError) return error(e.message);
          throw e;
        }
      },
      DELETE(req) {
        const id = parseId(req.params.id);
        if (id === null) return error("invalid id", 400);
        return store.deleteTransaction(id)
          ? json({ ok: true })
          : error("transaction not found", 404);
      },
    },

    // ---- Summary / analytics ----
    "/api/summary": {
      GET(req) {
        const p = new URL(req.url).searchParams;
        return json(store.getSummary(p.get("from") ?? undefined, p.get("to") ?? undefined));
      },
    },

    // ---- Budgets ----
    "/api/budgets": {
      GET(req) {
        const p = new URL(req.url).searchParams;
        const rawMonth = p.get("month");
        const rawCategoryId = p.get("category_id");
        try {
          return json(
            store.listBudgets({
              month: rawMonth ? parseMonth(rawMonth) : undefined,
              category_id: rawCategoryId ? Number(rawCategoryId) : undefined,
            }),
          );
        } catch (e) {
          if (e instanceof ValidationError) return error(e.message);
          throw e;
        }
      },
      async POST(req) {
        try {
          const body = (await req.json()) as Record<string, unknown>;
          const month = parseMonth(body.month);
          const amount = parseAmount(body.amount);
          const categoryId = Number(body.category_id);
          const category = store.getCategory(categoryId);
          if (!category) throw new ValidationError("category not found");
          if (category.type !== "expense") {
            throw new ValidationError("budgets can only be set for expense categories");
          }
          return json(store.createBudget({ category_id: categoryId, month, amount }), 201);
        } catch (e) {
          if (e instanceof ValidationError) return error(e.message);
          // UNIQUE(category_id, month) violation
          return error("a budget for that category and month already exists", 409);
        }
      },
    },

    "/api/budgets/:id": {
      async PATCH(req) {
        const id = parseId(req.params.id);
        if (id === null) return error("invalid id", 400);
        try {
          const body = (await req.json()) as Record<string, unknown>;
          const amount = parseAmount(body.amount);
          const updated = store.updateBudget(id, { amount });
          if (!updated) return error("budget not found", 404);
          return json(updated);
        } catch (e) {
          if (e instanceof ValidationError) return error(e.message);
          throw e;
        }
      },
      DELETE(req) {
        const id = parseId(req.params.id);
        if (id === null) return error("invalid id", 400);
        return store.deleteBudget(id)
          ? json({ ok: true })
          : error("budget not found", 404);
      },
    },

    // Serve index.html for all unmatched routes (keep last).
    "/*": index,
  },

  development: process.env.NODE_ENV !== "production" && {
    hmr: true,
    console: true,
  },
});

console.log(`🚀 Server running at ${server.url}`);
