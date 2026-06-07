import { useState } from "react";
import { LayoutList, PiggyBank, Wallet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BudgetPlanner } from "@/components/BudgetPlanner";
import { MonthPicker } from "@/components/MonthPicker";
import { SummaryCards } from "@/components/SummaryCards";
import { TransactionForm } from "@/components/TransactionForm";
import { TransactionList } from "@/components/TransactionList";
import { useBudgets, useCategories, useSummary, useTransactions } from "@/hooks/useFinance";
import { currentMonth, formatMonthLabel, monthRange } from "@/lib/dates";
import { cn } from "@/lib/utils";
import "./index.css";

type Tab = "transactions" | "budgets";

export function App() {
  const [month, setMonth] = useState(currentMonth());
  const [tab, setTab] = useState<Tab>("transactions");
  const { from, to } = monthRange(month);

  const categories = useCategories();
  const transactions = useTransactions(from, to);
  const summary = useSummary(from, to);
  const budgets = useBudgets({ month });

  function refreshAll() {
    transactions.reload();
    summary.reload();
    categories.reload();
    budgets.reload();
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
        <div className="ml-auto flex items-center gap-3">
          <MonthPicker month={month} onChange={setMonth} />
        </div>
      </header>

      {/* Tab switcher */}
      <div className="mb-6 flex gap-2 border-b pb-0">
        <TabButton
          active={tab === "transactions"}
          icon={<LayoutList className="size-4" />}
          label="Transactions"
          onClick={() => setTab("transactions")}
        />
        <TabButton
          active={tab === "budgets"}
          icon={<PiggyBank className="size-4" />}
          label="Budget Planner"
          onClick={() => setTab("budgets")}
        />
      </div>

      {(summary.error || budgets.error) && (
        <p className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          Failed to load data:{" "}
          {summary.error ?? budgets.error}
        </p>
      )}

      {tab === "transactions" && (
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
                <TransactionForm
                  categories={categories.data}
                  onCreated={refreshAll}
                  onCategoryCreated={categories.reload}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {tab === "budgets" && (
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="flex flex-col gap-6">
            <SummaryCards summary={summary.data} />
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Budget Planner · {formatMonthLabel(month)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <BudgetPlanner
                  month={month}
                  budgets={budgets.data}
                  categories={categories.data}
                  income={summary.data.income}
                  onReload={refreshAll}
                  onCategoryCreated={categories.reload}
                />
              </CardContent>
            </Card>
          </div>

          {/* Right: add transaction (budget planner still lets you log transactions) */}
          <div className="flex flex-col gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Add transaction</CardTitle>
              </CardHeader>
              <CardContent>
                <TransactionForm
                  categories={categories.data}
                  onCreated={refreshAll}
                  onCategoryCreated={categories.reload}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

// ---- Small helper component so the tab JSX stays readable ----

function TabButton({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      onClick={onClick}
      className={cn(
        "relative flex items-center gap-2 rounded-none rounded-t-sm pb-3 text-sm font-medium",
        active
          ? "text-primary after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:bg-primary"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      {icon}
      {label}
    </Button>
  );
}

export default App;
