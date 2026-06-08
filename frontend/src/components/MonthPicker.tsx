/** Month stepper that drives the period for transactions + summary. */
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatMonthLabel, shiftMonth } from "@/lib/dates";

interface Props {
  month: string; // "YYYY-MM"
  onChange: (month: string) => void;
}

export function MonthPicker({ month, onChange }: Props) {
  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="icon" onClick={() => onChange(shiftMonth(month, -1))} aria-label="Previous month">
        <ChevronLeft />
      </Button>
      <span className="min-w-[9rem] text-center font-medium">{formatMonthLabel(month)}</span>
      <Button variant="outline" size="icon" onClick={() => onChange(shiftMonth(month, 1))} aria-label="Next month">
        <ChevronRight />
      </Button>
    </div>
  );
}
