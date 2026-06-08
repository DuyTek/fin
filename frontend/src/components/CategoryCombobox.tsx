/**
 * Autocomplete for category selection.
 *
 * - Filters existing categories of the given type as you type.
 * - When the typed text doesn't exactly match any option, shows a
 *   "Create '…'" row — clicking it calls the API, then auto-selects the
 *   new category, so the user never has to leave the form.
 * - Keyboard: ArrowUp/Down to move through options, Enter to select, Escape
 *   to close.
 */
import { useEffect, useRef, useState } from "react";
import { Check, ChevronsUpDown, Loader2, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { Category, TxType } from "@/types";

interface Props {
  categories: Category[];
  type: TxType;
  value: string; // selected category id as string, "" when unset
  onChange: (id: string) => void;
  onCategoryCreated: () => void;
  id?: string;
}

export function CategoryCombobox({
  categories,
  type,
  value,
  onChange,
  onCategoryCreated,
  id,
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);
  const [cursor, setCursor] = useState(-1); // keyboard-focused index in the rendered list
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const filtered = categories.filter(
    (c) => c.type === type && c.name.toLowerCase().includes(query.toLowerCase()),
  );
  const selected = categories.find((c) => String(c.id) === value);
  const exactMatch = filtered.some((c) => c.name.toLowerCase() === query.trim().toLowerCase());
  const canCreate = query.trim().length > 0 && !exactMatch;

  // total number of items in the rendered list (options + maybe the "Create" row)
  const total = filtered.length + (canCreate ? 1 : 0);

  // Close on click outside
  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) close();
    }
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, []);

  // Scroll the highlighted item into view
  useEffect(() => {
    if (cursor < 0) return;
    listRef.current?.children[cursor]?.scrollIntoView({ block: "nearest" });
  }, [cursor]);

  function openDropdown() {
    setOpen(true);
    setQuery("");
    setCursor(-1);
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  function close() {
    setOpen(false);
    setQuery("");
    setCursor(-1);
  }

  function select(id: string) {
    onChange(id);
    close();
  }

  async function createAndSelect() {
    const name = query.trim();
    if (!name || creating) return;
    setCreating(true);
    try {
      const cat = await api.createCategory({ name, type });
      onCategoryCreated();
      onChange(String(cat.id));
      close();
    } catch (err) {
      // surface inline — the input remains open so the user can try again
      console.error(err);
    } finally {
      setCreating(false);
    }
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (!open) {
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") openDropdown();
      return;
    }
    if (e.key === "Escape") { e.preventDefault(); close(); return; }
    if (e.key === "ArrowDown") { e.preventDefault(); setCursor((c) => Math.min(c + 1, total - 1)); return; }
    if (e.key === "ArrowUp")   { e.preventDefault(); setCursor((c) => Math.max(c - 1, 0)); return; }
    if (e.key === "Enter" && cursor >= 0) {
      e.preventDefault();
      if (cursor < filtered.length) {
        select(String(filtered[cursor]!.id));
      } else {
        void createAndSelect();
      }
    }
  }

  return (
    <div ref={containerRef} className="relative" onKeyDown={onKeyDown}>
      {/* Trigger */}
      <button
        type="button"
        id={id}
        onClick={openDropdown}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cn(
          "flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs",
          "focus-visible:outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
          !selected && "text-muted-foreground",
        )}
      >
        <span className="truncate">{selected ? selected.name : "Search or create a category…"}</span>
        <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md">
          {/* Search input */}
          <div className="p-2 pb-1">
            <Input
              ref={inputRef}
              value={query}
              onChange={(e) => { setQuery(e.target.value); setCursor(-1); }}
              placeholder="Search categories…"
              className="h-8"
            />
          </div>

          <ul ref={listRef} role="listbox" className="max-h-60 overflow-y-auto p-1">
            {filtered.length === 0 && !canCreate && (
              <li className="px-2 py-1.5 text-sm text-muted-foreground">No categories found.</li>
            )}

            {filtered.map((c, i) => (
              <li key={c.id} role="option" aria-selected={String(c.id) === value}>
                <button
                  type="button"
                  onClick={() => select(String(c.id))}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm",
                    "hover:bg-accent hover:text-accent-foreground",
                    cursor === i && "bg-accent text-accent-foreground",
                  )}
                >
                  <Check
                    className={cn("size-4 shrink-0", String(c.id) === value ? "opacity-100" : "opacity-0")}
                  />
                  <span className="flex-1 text-left">{c.name}</span>
                  {c.is_custom === 1 && (
                    <span className="text-xs text-muted-foreground">custom</span>
                  )}
                </button>
              </li>
            ))}

            {canCreate && (
              <li role="option">
                <button
                  type="button"
                  onClick={() => void createAndSelect()}
                  disabled={creating}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-primary",
                    "hover:bg-accent hover:text-accent-foreground disabled:opacity-60",
                    cursor === filtered.length && "bg-accent text-accent-foreground",
                  )}
                >
                  {creating ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Plus className="size-4 shrink-0" />
                  )}
                  {creating
                    ? "Creating…"
                    : `Create "${query.trim()}" as ${type} category`}
                </button>
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
