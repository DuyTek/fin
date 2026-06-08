/** Form to record a new income/expense transaction. */
import { useActionState, useState } from "react";
import { AmountInput } from "@/components/AmountInput";
import { CategoryCombobox } from "@/components/CategoryCombobox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { todayISO } from "@/lib/dates";
import type { Category, TxType } from "@/types";

interface Props {
  categories: Category[];
  onCreated: () => void;
  onCategoryCreated: () => void;
}

export function TransactionForm({ categories, onCreated, onCategoryCreated }: Props) {
  // UI state that drives rendering (formatting, category filter, button styles).
  const [type, setType] = useState<TxType>("expense");
  const [amount, setAmount] = useState(0);
  const [categoryId, setCategoryId] = useState<string>("");

  // Submission lifecycle (pending + error) is owned by the form action.
  const [error, submit, pending] = useActionState<string | null, FormData>(
    async (_prev, form) => {
      if (amount <= 0) return "Enter an amount greater than 0";
      if (!categoryId) return "Pick a category";
      try {
        await api.createTransaction({
          type,
          amount,
          category_id: Number(categoryId),
          note: String(form.get("note") ?? "").trim(),
          occurred_on: String(form.get("occurred_on") ?? todayISO()),
        });
        // reset entry fields; keep type so rapid same-type entry is easy
        setAmount(0);
        setCategoryId("");
        onCreated();
        return null;
      } catch (err) {
        return String((err as Error).message ?? err);
      }
    },
    null,
  );

  function switchType(next: TxType) {
    setType(next);
    setCategoryId(""); // category list differs per type
  }

  return (
    <form action={submit} className="flex flex-col gap-4">
      {/* Type toggle */}
      <div className="grid grid-cols-2 gap-2">
        {(["expense", "income"] as TxType[]).map((t) => (
          <Button
            key={t}
            type="button"
            variant={type === t ? "default" : "outline"}
            onClick={() => switchType(t)}
            className={cn(
              "capitalize",
              type === t && t === "expense" && "bg-rose-600 hover:bg-rose-600/90",
              type === t && t === "income" && "bg-emerald-600 hover:bg-emerald-600/90",
            )}
          >
            {t}
          </Button>
        ))}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="amount">Amount (₫)</Label>
        <AmountInput id="amount" value={amount} onChange={setAmount} placeholder="0" autoFocus />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="category">Category</Label>
        <CategoryCombobox
          id="category"
          categories={categories}
          type={type}
          value={categoryId}
          onChange={setCategoryId}
          onCategoryCreated={onCategoryCreated}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="date">Date</Label>
        <Input id="date" name="occurred_on" type="date" defaultValue={todayISO()} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="note">Note (optional)</Label>
        <Textarea
          id="note"
          name="note"
          placeholder="e.g. lunch with team"
          className="min-h-[60px] resize-y"
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" disabled={pending}>
        {pending ? "Adding…" : "Add transaction"}
      </Button>
    </form>
  );
}
