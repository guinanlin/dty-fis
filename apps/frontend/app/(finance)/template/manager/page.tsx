"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/finance/ConfirmDialog";
import { MoneyText } from "@/components/finance/MoneyText";
import { useFinApp } from "@/lib/finance/auth-context";
import { voucherTemplateService } from "@/lib/finance/service";
import type { VoucherTemplate } from "@/lib/finance/types";

function TemplateDetails({ row }: { row: VoucherTemplate }) {
  return (
    <table className="w-full min-w-[720px] border-t text-sm">
      <thead className="bg-slate-50">
        <tr>
          <th className="p-3 text-left">摘要</th>
          <th className="p-3 text-left">科目</th>
          <th className="p-3 text-right">借方金额</th>
          <th className="p-3 text-right">贷方金额</th>
        </tr>
      </thead>
      <tbody>
        {row.details.map((detail) => (
          <tr key={detail.id}>
            <td className="border-t p-3">{detail.summary}</td>
            <td className="border-t p-3">
              {detail.subjectCode} {detail.subjectName}
            </td>
            <td className="border-t p-3 text-right">
              <MoneyText value={detail.debitAmount} />
            </td>
            <td className="border-t p-3 text-right">
              <MoneyText value={detail.creditAmount} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function TemplateManagerPage() {
  const { currentAccountSet } = useFinApp();
  const [rows, setRows] = useState<VoucherTemplate[]>([]);
  const [expanded, setExpanded] = useState<string[]>([]);
  const [removing, setRemoving] = useState<VoucherTemplate | null>(null);

  const load = useCallback(() => {
    if (currentAccountSet)
      voucherTemplateService.list(currentAccountSet.id).then(setRows);
  }, [currentAccountSet]);

  useEffect(load, [load]);

  const toggleExpanded = (id: string) => {
    setExpanded(
      expanded.includes(id)
        ? expanded.filter((item) => item !== id)
        : [...expanded, id],
    );
  };

  const handleDelete = async () => {
    if (removing) await voucherTemplateService.delete(removing.id);
    setRemoving(null);
    load();
  };

  return (
    <div className="space-y-5">
      <div className="flex justify-between">
        <div>
          <h1 className="text-2xl font-semibold">凭证模板</h1>
          <p className="mt-1 text-sm text-slate-500">
            维护常用业务的凭证分录模板
          </p>
        </div>
        <Button asChild>
          <Link href="/template/design">新增模板</Link>
        </Button>
      </div>
      <div className="space-y-3">
        {rows.map((row) => (
          <div
            key={row.id}
            className="overflow-x-auto rounded-xl border bg-white"
          >
            <div className="flex items-center gap-4 p-4">
              <div className="flex-1">
                <b>{row.name}</b>
                <p className="mt-1 text-xs text-slate-500">
                  {row.type} · {row.details.length} 条分录
                </p>
              </div>
              <Button variant="ghost" onClick={() => toggleExpanded(row.id)}>
                {expanded.includes(row.id) ? "收起" : "明细"}
              </Button>
              <Button asChild variant="outline">
                <Link href={`/template/design/${row.id}`}>设计模板</Link>
              </Button>
              <Button variant="destructive" onClick={() => setRemoving(row)}>
                删除
              </Button>
            </div>
            {expanded.includes(row.id) && <TemplateDetails row={row} />}
          </div>
        ))}
      </div>
      <ConfirmDialog
        open={!!removing}
        destructive
        description={`确认删除模板 ${removing?.name}？`}
        onClose={() => setRemoving(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
