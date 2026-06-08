/** Manage categories: view built-ins, add custom ones, delete unused customs. */
import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { Category, TxType } from "@/types";

interface Props {
  categories: Category[];
  onChanged: () => void;
}

export function CategoryManager({ categories, onChanged }: Props) {
  const [type, setType] = useState<TxType>("expense");

  const [error, addCategory, pending] = useActionState<string | null, FormData>(
    async (_prev, form) => {
      const name = String(form.get("name") ?? "").trim();
      if (!name) return "Enter a category name";
      try {
        await api.createCategory({ name, type });
        onChanged();
        return null;
      } catch (err) {
        return String((err as Error).message ?? err);
      }
    },
    null,
  );

  async function remove(c: Category) {
    try {
      await api.deleteCategory(c.id);
      onChanged();
    } catch (err) {
      alert(String((err as Error).message ?? err));
    }
  }

  const shown = categories.filter((c) => c.type === type);

  return (
    <div className="flex flex-col gap-4">
      {/* income/expense filter */}
      <div className="grid grid-cols-2 gap-2">
        {(["expense", "income"] as TxType[]).map((t) => (
          <Button
            key={t}
            type="button"
            variant={type === t ? "default" : "outline"}
            className="capitalize"
            onClick={() => setType(t)}
          >
            {t}
          </Button>
        ))}
      </div>

      <ul className="flex flex-wrap gap-2">
        {shown.map((c) => (
          <li
            key={c.id}
            className={cn(
              "flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm",
              c.is_custom === 1 ? "bg-accent" : "bg-muted/40",
            )}
          >
            {c.name}
            {c.is_custom === 1 && (
              <button
                type="button"
                onClick={() => remove(c)}
                className="text-muted-foreground hover:text-destructive"
                aria-label={`Delete ${c.name}`}
              >
                ✕
              </button>
            )}
          </li>
        ))}
      </ul>

      <form action={addCategory} className="flex flex-col gap-2">
        <div className="flex gap-2">
          <Input name="name" placeholder={`New ${type} category`} />
          <Button type="submit" variant="secondary" disabled={pending}>
            {pending ? "Adding…" : "Add"}
          </Button>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <p className="text-xs text-muted-foreground">
          Built-in categories can't be removed. Custom ones can be deleted only when unused.
        </p>
      </form>
    </div>
  );
}
