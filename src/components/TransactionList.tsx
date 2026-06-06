/** Table of transactions for the selected period, with inline edit + delete. */
import { useState } from "react";
import { AmountInput } from "@/components/AmountInput";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { formatVNDSymbol } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { TransactionWithCategory } from "@/types";

interface Props {
  transactions: TransactionWithCategory[];
  loading: boolean;
  onChanged: () => void;
}

export function TransactionList({ transactions, loading, onChanged }: Props) {
  if (loading && transactions.length === 0) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }
  if (transactions.length === 0) {
    return <p className="text-sm text-muted-foreground">No transactions this period yet.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-muted-foreground">
            <th className="py-2 pr-3 font-medium">Date</th>
            <th className="py-2 pr-3 font-medium">Category</th>
            <th className="py-2 pr-3 font-medium">Note</th>
            <th className="py-2 pr-3 text-right font-medium">Amount</th>
            <th className="py-2 pl-3" />
          </tr>
        </thead>
        <tbody>
          {transactions.map((t) => (
            <Row key={t.id} tx={t} onChanged={onChanged} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Row({ tx, onChanged }: { tx: TransactionWithCategory; onChanged: () => void }) {
  const [editing, setEditing] = useState(false);
  const [amount, setAmount] = useState(tx.amount);
  const [note, setNote] = useState(tx.note);
  const [busy, setBusy] = useState(false);

  const income = tx.type === "income";

  async function save() {
    setBusy(true);
    try {
      await api.updateTransaction(tx.id, { amount, note });
      setEditing(false);
      onChanged();
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!confirm("Delete this transaction?")) return;
    setBusy(true);
    try {
      await api.deleteTransaction(tx.id);
      onChanged();
    } finally {
      setBusy(false);
    }
  }

  return (
    <tr className="border-b last:border-0 align-top">
      <td className="py-2 pr-3 whitespace-nowrap tabular-nums">{tx.occurred_on}</td>
      <td className="py-2 pr-3">
        <span
          className={cn(
            "inline-block rounded-full px-2 py-0.5 text-xs",
            income ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700",
          )}
        >
          {tx.category_name}
        </span>
      </td>
      <td className="py-2 pr-3 max-w-[16rem]">
        {editing ? (
          <Input value={note} onChange={(e) => setNote(e.target.value)} className="h-8" />
        ) : (
          <span className="text-muted-foreground">{tx.note || "—"}</span>
        )}
      </td>
      <td className="py-2 pr-3 text-right whitespace-nowrap tabular-nums">
        {editing ? (
          <AmountInput value={amount} onChange={setAmount} className="h-8 text-right" />
        ) : (
          <span className={cn("font-medium", income ? "text-emerald-600" : "text-rose-600")}>
            {income ? "+" : "−"}
            {formatVNDSymbol(tx.amount)}
          </span>
        )}
      </td>
      <td className="py-2 pl-3">
        <div className="flex justify-end gap-1">
          {editing ? (
            <>
              <Button size="sm" variant="secondary" onClick={save} disabled={busy}>
                Save
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setEditing(false);
                  setAmount(tx.amount);
                  setNote(tx.note);
                }}
                disabled={busy}
              >
                Cancel
              </Button>
            </>
          ) : (
            <>
              <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>
                Edit
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-destructive hover:text-destructive"
                onClick={remove}
                disabled={busy}
              >
                Delete
              </Button>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}
