import { useState } from "react";
import { Wallet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CategoryManager } from "@/components/CategoryManager";
import { MonthPicker } from "@/components/MonthPicker";
import { SummaryCards } from "@/components/SummaryCards";
import { TransactionForm } from "@/components/TransactionForm";
import { TransactionList } from "@/components/TransactionList";
import { useCategories, useSummary, useTransactions } from "@/hooks/useFinance";
import { currentMonth, formatMonthLabel, monthRange } from "@/lib/dates";
import "./index.css";

export function App() {
  const [month, setMonth] = useState(currentMonth());
  const { from, to } = monthRange(month);

  const categories = useCategories();
  const transactions = useTransactions(from, to);
  const summary = useSummary(from, to);

  // Refresh everything after a mutation (transaction or category change).
  function refreshAll() {
    transactions.reload();
    summary.reload();
    categories.reload();
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8">
      <header className="mb-6 flex items-center gap-3">
        <div className="grid size-10 place-items-center rounded-xl bg-primary text-primary-foreground">
          <Wallet className="size-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold leading-none">Finance</h1>
          <p className="text-sm text-muted-foreground">Track income &amp; expenses in ₫</p>
        </div>
        <div className="ml-auto">
          <MonthPicker month={month} onChange={setMonth} />
        </div>
      </header>

      {summary.error && (
        <p className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          Failed to load data: {summary.error}
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* Left: overview + transactions */}
        <div className="flex flex-col gap-6">
          <SummaryCards summary={summary.data} />

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Transactions · {formatMonthLabel(month)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <TransactionList
                transactions={transactions.data}
                loading={transactions.loading}
                onChanged={refreshAll}
              />
            </CardContent>
          </Card>
        </div>

        {/* Right: add transaction + manage categories */}
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Add transaction</CardTitle>
            </CardHeader>
            <CardContent>
              <TransactionForm categories={categories.data} onCreated={refreshAll} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <CategoryManager categories={categories.data} onChanged={refreshAll} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default App;
