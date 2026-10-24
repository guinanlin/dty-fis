"use client";

import type { ReactNode } from "react";

interface SelectFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
}

export function SelectField({
  label,
  value,
  onChange,
  children,
}: SelectFieldProps) {
  return (
    <label className="text-sm">
      {label}
      <select
        className="mt-1 h-10 w-full rounded border px-3"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {children}
      </select>
    </label>
  );
}
