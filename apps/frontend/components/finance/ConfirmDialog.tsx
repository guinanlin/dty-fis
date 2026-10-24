"use client";

import { Button } from "@/components/ui/button";

export function ConfirmDialog({
  open,
  title = "操作确认",
  description,
  confirmText = "确认",
  busy,
  destructive,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title?: string;
  description: string;
  confirmText?: string;
  busy?: boolean;
  destructive?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-4"
      onMouseDown={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="mt-3 text-sm leading-6 text-slate-600">{description}</p>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            取消
          </Button>
          <Button
            variant={destructive ? "destructive" : "default"}
            disabled={busy}
            onClick={onConfirm}
          >
            {busy ? "处理中..." : confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}
