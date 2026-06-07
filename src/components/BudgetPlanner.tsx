/**
 * BudgetPlanner — month-scoped list of budget cards plus an inline form
 * to add new budgets. Shows the "unallocated" delta so the user can fully
 * assign every đồng of income to a category (zero-based budgeting).
 */
import { useActionState, useState } from "react";
import { PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AmountInput } from "@/components/AmountInput";
import { BudgetCard } from "@/components/BudgetCard";
import { CategoryCombobox } from "@/components/CategoryCombobox";
import { formatMonthLabel } from "@/lib/dates";
import { formatVNDSymbol } from "@/lib/money";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { BudgetWithMetrics, Category } from "@/types";

interface Props {
  month: string;
  budgets: BudgetWithMetrics[];
  /** expense categories available for selection */
  categories: Category[];
  /** income for this month, from useSummary — used for unallocated delta */
  income: number;
  onReload: () => void;
  /** called when a new expense category is created inline from the combobox */
  onCategoryCreated: () => void;
}

export function BudgetPlanner({
  month,
  budgets,
  categories,
  income,
  onReload,
  onCategoryCreated,
}: Props) {
  const [categoryId, setCategoryId] = useState("");
  const [amount, setAmount] = useState(0);

  const totalAllocated = budgets.reduce((sum, b) => sum + b.amount, 0);
  const unallocated = income - totalAllocated;

  const [addError, addAction, adding] = useActionState<string | null, FormData>(
    async () => {
      if (!categoryId) return "Select a category";
      if (amount <= 0) return "Enter an amount";
      try {
        await api.createBudget({ category_id: Number(categoryId), month, amount });
        setCategoryId("");
        setAmount(0);
        onReload();
        return null;
      } catch (err) {
        return String((err as Error).message ?? err);
      }
    },
    null,
  );

  return (
    <div className="flex flex-col gap-4">
      {/* Unallocated summary */}
      <div className="flex items-center justify-between rounded-lg border bg-muted/40 px-4 py-3 text-sm">
        <span className="text-muted-foreground">Unallocated this month</span>
        <span
          className={cn(
            "font-semibold tabular-nums",
            unallocated < 0 ? "text-destructive" : "text-foreground",
          )}
        >
          {formatVNDSymbol(unallocated)}
        </span>
      </div>

      {/* Budget cards */}
      {budgets.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          No budgets for {formatMonthLabel(month)} yet. Add one below.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {budgets.map((b) => (
            <BudgetCard key={b.id} budget={b} onReload={onReload} />
          ))}
        </div>
      )}

      {/* Inline add-budget form */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <PlusCircle className="size-4" />
            Add budget
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form action={addAction} className="flex flex-col gap-3">
            <CategoryCombobox
              categories={categories}
              type="expense"
              value={categoryId}
              onChange={setCategoryId}
              onCategoryCreated={onCategoryCreated}
            />
            <AmountInput
              value={amount}
              onChange={setAmount}
              placeholder="Monthly cap (₫)"
            />
            <Button type="submit" disabled={adding || !categoryId || amount <= 0}>
              {adding ? "Adding…" : "Add budget"}
            </Button>
            {addError && <p className="text-sm text-destructive">{addError}</p>}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
