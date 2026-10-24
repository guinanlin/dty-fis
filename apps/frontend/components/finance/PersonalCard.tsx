"use client";

import type { ReactNode } from "react";

export function PersonalCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-2xl rounded-xl border bg-white p-6">
      <h1 className="text-2xl font-semibold">{title}</h1>
      <p className="mt-1 mb-6 text-sm text-slate-500">{subtitle}</p>
      {children}
    </div>
  );
}
