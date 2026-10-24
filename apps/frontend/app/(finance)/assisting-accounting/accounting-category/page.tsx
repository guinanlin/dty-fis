"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/finance/ConfirmDialog";
import { Field } from "@/components/finance/Field";
import { FinTable, type FinColumn } from "@/components/finance/FinTable";
import { FormDialog } from "@/components/finance/FormDialog";
import { PageHeader } from "@/components/finance/PageHeader";
import { useFinApp } from "@/lib/finance/auth-context";
import { assistCategory } from "@/lib/finance/service";
import type { AssistingCategory } from "@/lib/finance/types";

type Row = AssistingCategory & { count: number };

function CategoryFormFields({
  form,
  onChange,
}: {
  form: AssistingCategory;
  onChange: (patch: Partial<AssistingCategory>) => void;
}) {
  return (
    <div className="space-y-4">
      <Field
        label="类别名称"
        value={form.name}
        onChange={(value) => onChange({ name: value })}
      />
      <Field
        label="自定义字段（逗号分隔）"
        value={form.customColumns.join(",")}
        onChange={(value) =>
          onChange({
            customColumns: value
              .split(",")
              .map((item) => item.trim())
              .filter(Boolean),
          })
        }
      />
    </div>
  );
}

export default function CategoryPage() {
  const { currentAccountSet } = useFinApp();
  const [rows, setRows] = useState<Row[]>([]);
  const [form, setForm] = useState<AssistingCategory | null>(null);
  const [removing, setRemoving] = useState<AssistingCategory | null>(null);

  const load = useCallback(async () => {
    if (!currentAccountSet) return;
    const categories = await assistCategory.list(currentAccountSet.id);
    setRows(
      await Promise.all(
        categories.map(async (item) => ({
          ...item,
          count: (await assistCategory.values(item.id)).length,
        })),
      ),
    );
  }, [currentAccountSet]);

  useEffect(() => {
    void load();
  }, [load]);

  const openCreate = () => {
    if (currentAccountSet) {
      setForm({
        id: `assist-${Date.now()}`,
        accountSetId: currentAccountSet.id,
        name: "",
        systemDefault: false,
        customColumns: [],
      });
    }
  };

  const openEdit = (row: Row) => setForm({ ...row });
  const closeForm = () => setForm(null);

  const handleSave = async () => {
    if (!form) return;
    await assistCategory.save(form);
    setForm(null);
    void load();
  };

  const handleDelete = async () => {
    if (removing) await assistCategory.delete(removing.id);
    setRemoving(null);
    void load();
  };

  const columns: FinColumn<Row>[] = [
    { key: "name", title: "辅助核算类别", render: (row) => <b>{row.name}</b> },
    { key: "count", title: "项目数量", render: (row) => row.count },
    {
      key: "type",
      title: "类别类型",
      render: (row) => (row.systemDefault ? "系统预设" : "自定义"),
    },
    {
      key: "columns",
      title: "自定义字段",
      render: (row) => row.customColumns.join("、") || "—",
    },
    {
      key: "actions",
      title: "操作",
      render: (row) => (
        <div className="flex gap-2">
          <Button asChild size="sm" variant="outline">
            <Link href={`/assisting-accounting/custom/${row.id}`}>
              项目管理
            </Link>
          </Button>
          <Button size="sm" variant="ghost" onClick={() => openEdit(row)}>
            编辑
          </Button>
          <Button
            size="sm"
            variant="ghost"
            disabled={row.systemDefault}
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
      <PageHeader
        title="辅助核算"
        subtitle="管理客户、供应商、部门、员工、项目及自定义类别"
        actions={<Button onClick={openCreate}>新增类别</Button>}
      />
      <FinTable columns={columns} data={rows} />
      <FormDialog
        open={!!form}
        title="辅助核算类别"
        onClose={closeForm}
        onSubmit={handleSave}
      >
        {form && (
          <CategoryFormFields
            form={form}
            onChange={(patch) => setForm({ ...form, ...patch })}
          />
        )}
      </FormDialog>
      <ConfirmDialog
        open={!!removing}
        destructive
        description={`确认删除类别 ${removing?.name}？`}
        onClose={() => setRemoving(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
