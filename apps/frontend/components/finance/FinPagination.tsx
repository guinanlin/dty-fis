"use client";

import { Button } from "@/components/ui/button";

export function FinPagination({ page, totalPages, total, onChange }: { page: number; totalPages: number; total: number; onChange: (page: number) => void }) {
  if (!total) return null;
  return <div className="flex items-center justify-between border-t px-4 py-3 text-sm text-slate-500"><span>共 {total} 条</span><div className="flex items-center gap-2"><Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onChange(page - 1)}>上一页</Button><span>第 {page} / {Math.max(totalPages, 1)} 页</span><Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => onChange(page + 1)}>下一页</Button></div></div>;
}
