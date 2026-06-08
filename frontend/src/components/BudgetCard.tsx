/**
 * BudgetCard — displays a single budget row with progress bar, inline editing,
 * delete, and an expandable month-over-month history panel.
 */
import { useActionState, useState } from "react";
import { ChevronDown, ChevronUp, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AmountInput } from "@/components/AmountInput";
import { useBudgets } from "@/hooks/useFinance";
import { formatMonthLabel } from "@/lib/dates";
import { formatVNDSymbol } from "@/lib/money";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import type { BudgetWithMetrics } from "@/types";

// ---- History panel (own component so the hook only fires when expanded) ----

function BudgetHistoryPanel({ categoryId }: { categoryId: number }) {
  const history = useBudgets({ category_id: categoryId });

  if (history.loading) {
    return <p className="py-2 text-xs text-muted-foreground">Loading…</p>;
  }
  if (history.error) {
    return <p className="py-2 text-xs text-destructive">{history.error}</p>;
  }
  if (!history.data?.length) {
    return <p className="py-2 text-xs text-muted-foreground">No history yet.</p>;
  }

  return (
    <table className="mt-1 w-full text-xs">
      <thead>
        <tr className="border-b text-muted-foreground">
          <th className="py-1 text-left font-medium">Month</th>
          <th className="py-1 text-right font-medium">Cap</th>
          <th className="py-1 text-right font-medium">Spent</th>
          <th className="py-1 text-right font-medium">%</th>
        </tr>
      </thead>
      <tbody>
        {history.data.map((row) => (
          <tr key={row.id} className="border-b last:border-0">
            <td className="py-1">{formatMonthLabel(row.month)}</td>
            <td className="py-1 text-right">{formatVNDSymbol(row.amount)}</td>
            <td className="py-1 text-right">{formatVNDSymbol(row.spent)}</td>
            <td
              className={cn(
                "py-1 text-right font-medium",
                row.status === "exceeded"
                  ? "text-red-600"
                  : row.status === "warning"
                    ? "text-amber-600"
                    : "text-green-600",
              )}
            >
              {row.percent_used}%
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ---- Main card ----

interface Props {
  budget: BudgetWithMetrics;
  onReload: () => void;
}

const STATUS_BAR: Record<BudgetWithMetrics["status"], string> = {
  on_track: "bg-green-500",
  warning: "bg-amber-500",
  exceeded: "bg-red-500",
};

const STATUS_TEXT: Record<BudgetWithMetrics["status"], string> = {
  on_track: "text-green-700 dark:text-green-400",
  warning: "text-amber-700 dark:text-amber-400",
  exceeded: "text-red-700 dark:text-red-400",
};

export function BudgetCard({ budget, onReload }: Props) {
  const [editing, setEditing] = useState(false);
  const [editAmount, setEditAmount] = useState(budget.amount);
  const [historyOpen, setHistoryOpen] = useState(false);

  const [saveError, saveAction, saving] = useActionState<string | null, FormData>(
    async () => {
      if (editAmount <= 0) return "Amount must be greater than 0";
      try {
        await api.updateBudget(budget.id, { amount: editAmount });
        setEditing(false);
        onReload();
        return null;
      } catch (err) {
        return String((err as Error).message ?? err);
      }
    },
    null,
  );

  const [, deleteAction, deleting] = useActionState<null, FormData>(async () => {
    try {
      await api.deleteBudget(budget.id);
      onReload();
    } catch (err) {
      alert(String((err as Error).message ?? err));
    }
    return null;
  }, null);

  function startEdit() {
    setEditAmount(budget.amount);
    setEditing(true);
  }

  const clampedPct = Math.min(budget.percent_used, 100);

  return (
    <Card className="p-4">
      <div className="flex items-start gap-2">
        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-medium">{budget.category_name}</span>
            <span className={cn("text-xs font-medium capitalize", STATUS_TEXT[budget.status])}>
              {budget.status.replace("_", " ")}
            </span>
          </div>

          {editing ? (
            <form action={saveAction} className="mt-2 flex flex-wrap items-center gap-2">
              <AmountInput
                value={editAmount}
                onChange={setEditAmount}
                placeholder="New cap (₫)"
                className="h-7 w-40 text-sm"
                autoFocus
              />
              <Button type="submit" size="sm" disabled={saving || editAmount <= 0}>
                {saving ? "Saving…" : "Save"}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setEditing(false)}
              >
                Cancel
              </Button>
              {saveError && <p className="w-full text-xs text-destructive">{saveError}</p>}
            </form>
          ) : (
            <>
              <p className="mt-0.5 text-xs text-muted-foreground">
                <span className="font-medium text-foreground">
                  {formatVNDSymbol(budget.spent)}
                </span>{" "}
                / {formatVNDSymbol(budget.amount)}
                {budget.forecast > 0 && (
                  <span className="ml-2 opacity-70">
                    · Forecast {formatVNDSymbol(budget.forecast)}
                  </span>
                )}
              </p>
              {/* Progress bar */}
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={cn(
                    "h-full rounded-full transition-[width] duration-300",
                    STATUS_BAR[budget.status],
                  )}
                  style={{ width: `${clampedPct}%` }}
                />
              </div>
            </>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex shrink-0 items-center gap-0.5">
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="size-7"
            onClick={startEdit}
            aria-label="Edit budget"
          >
            <Pencil className="size-3.5" />
          </Button>
          <form action={deleteAction}>
            <Button
              type="submit"
              size="icon"
              variant="ghost"
              className="size-7 text-muted-foreground hover:text-destructive"
              disabled={deleting}
              aria-label="Delete budget"
            >
              <Trash2 className="size-3.5" />
            </Button>
          </form>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="size-7"
            onClick={() => setHistoryOpen((v) => !v)}
            aria-label={historyOpen ? "Hide history" : "Show history"}
          >
            {historyOpen ? (
              <ChevronUp className="size-3.5" />
            ) : (
              <ChevronDown className="size-3.5" />
            )}
          </Button>
        </div>
      </div>

      {/* History panel — rendered only when open so the hook fires on mount */}
      {historyOpen && (
        <div className="mt-2 border-t pt-2">
          <BudgetHistoryPanel categoryId={budget.category_id} />
        </div>
      )}
    </Card>
  );
}
