"use client";

import { Input } from "@/components/ui/input";

interface FieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  disabled?: boolean;
}

export function Field({
  label,
  value,
  onChange,
  type = "text",
  disabled,
}: FieldProps) {
  return (
    <label className="text-sm">
      {label}
      <Input
        className="mt-1"
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
      />
    </label>
  );
}
