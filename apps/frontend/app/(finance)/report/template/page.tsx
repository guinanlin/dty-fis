"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/finance/ConfirmDialog";
import { FinTable, type FinColumn } from "@/components/finance/FinTable";
import { useFinApp } from "@/lib/finance/auth-context";
import { report } from "@/lib/finance/service";
import type { FinanceReportTemplate } from "@/lib/finance/types";

export default function TemplateListPage() {
  const { currentAccountSet } = useFinApp();
  const [rows, setRows] = useState<FinanceReportTemplate[]>([]);
  const [removing, setRemoving] = useState<FinanceReportTemplate | null>(null);

  const load = useCallback(() => {
    if (currentAccountSet)
      report.template.list(currentAccountSet.id).then(setRows);
  }, [currentAccountSet]);

  useEffect(load, [load]);

  const handleDelete = async () => {
    if (removing) await report.template.delete(removing.id);
    setRemoving(null);
    load();
  };

  const columns: FinColumn<FinanceReportTemplate>[] = [
    { key: "name", title: "模板名称", render: (row) => <b>{row.name}</b> },
    { key: "category", title: "报表分类", render: (row) => row.category },
    { key: "description", title: "描述", render: (row) => row.description },
    { key: "items", title: "项目数", render: (row) => row.items.length },
    {
      key: "actions",
      title: "操作",
      render: (row) => (
        <div className="flex gap-2">
          <Button asChild size="sm" variant="outline">
            <Link href={`/report/template/form/${row.id}`}>编辑设计</Link>
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => setRemoving(row)}
          >
            删除
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">报表模板</h1>
          <p className="mt-1 text-sm text-slate-500">
            维护报表表头、行次和取数公式
          </p>
        </div>
        <Button asChild>
          <Link href="/report/template/form/new">
            <Plus size={16} className="mr-2" />
            新增模板
          </Link>
        </Button>
      </div>
      <FinTable columns={columns} data={rows} />
      <ConfirmDialog
        open={!!removing}
        destructive
        title="删除模板"
        description={`确认删除“${removing?.name}”吗？`}
        onClose={() => setRemoving(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
