"use client";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";

export function FormDialog({ open, title, children, submitText = "保存", busy, onSubmit, onClose }: { open: boolean; title: string; children: ReactNode; submitText?: string; busy?: boolean; onSubmit: () => void; onClose: () => void }) {
  if (!open) return null;
  return <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-slate-950/40 p-4" onMouseDown={onClose}><div className="my-8 w-full max-w-2xl rounded-xl bg-white shadow-2xl" onMouseDown={(event) => event.stopPropagation()}><div className="border-b px-6 py-4"><h3 className="text-lg font-semibold">{title}</h3></div><div className="max-h-[70vh] overflow-y-auto p-6">{children}</div><div className="flex justify-end gap-2 border-t px-6 py-4"><Button variant="outline" onClick={onClose}>取消</Button><Button disabled={busy} onClick={onSubmit}>{busy ? "处理中..." : submitText}</Button></div></div></div>;
}
