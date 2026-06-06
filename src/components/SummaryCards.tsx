/** Income / Expense / Balance cards + per-category expense breakdown bars. */
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatVNDSymbol } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { Summary } from "@/types";

export function SummaryCards({ summary }: { summary: Summary }) {
  const { income, expense, balance, expense_by_category } = summary;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Income" value={income} className="text-emerald-600" />
        <StatCard label="Expense" value={expense} className="text-rose-600" />
        <StatCard
          label="Balance"
          value={balance}
          className={balance >= 0 ? "text-emerald-600" : "text-rose-600"}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Spending by category</CardTitle>
        </CardHeader>
        <CardContent>
          {expense_by_category.length === 0 ? (
            <p className="text-sm text-muted-foreground">No expenses this period.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {expense_by_category.map((row) => {
                const pct = expense > 0 ? Math.round((row.total / expense) * 100) : 0;
                return (
                  <li key={row.category_id}>
                    <div className="mb-1 flex justify-between text-sm">
                      <span>{row.category_name}</span>
                      <span className="tabular-nums text-muted-foreground">
                        {formatVNDSymbol(row.total)} · {pct}%
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-rose-500" style={{ width: `${pct}%` }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ label, value, className }: { label: string; value: number; className?: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className={cn("text-2xl font-bold tabular-nums", className)}>{formatVNDSymbol(value)}</p>
      </CardContent>
    </Card>
  );
}
