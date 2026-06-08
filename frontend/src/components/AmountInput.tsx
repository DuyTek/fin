/**
 * Controlled VND amount input: shows the value with thousand separators
 * (10000 -> "10,000") while emitting the raw integer via onChange.
 */
import { Input } from "@/components/ui/input";
import { formatVND, parseVND } from "@/lib/money";
import type { ComponentProps } from "react";

interface AmountInputProps extends Omit<ComponentProps<typeof Input>, "value" | "onChange" | "type"> {
  value: number;
  onChange: (value: number) => void;
}

export function AmountInput({ value, onChange, ...props }: AmountInputProps) {
  return (
    <Input
      type="text"
      inputMode="numeric"
      value={value === 0 ? "" : formatVND(value)}
      onChange={(e) => onChange(parseVND(e.target.value))}
      {...props}
    />
  );
}
