"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/finance/Field";
import { FinTable, type FinColumn } from "@/components/finance/FinTable";
import { FormDialog } from "@/components/finance/FormDialog";
import { useFinApp } from "@/lib/finance/auth-context";
import { assistCategory } from "@/lib/finance/service";
import type { AssistingValue } from "@/lib/finance/types";

function createEmptyValue(categoryId: string): AssistingValue {
  return {
    id: `assist-value-${Date.now()}`,
    categoryId,
    code: "",
    name: "",
    remark: "",
    customValues: {},
  };
}

function ValueFormFields({
  form,
  onChange,
}: {
  form: AssistingValue;
  onChange: (patch: Partial<AssistingValue>) => void;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Field
        label="编码"
        value={form.code}
        onChange={(value) => onChange({ code: value })}
      />
      <Field
        label="名称"
        value={form.name}
        onChange={(value) => onChange({ name: value })}
      />
      <div className="md:col-span-2">
        <Field
          label="备注"
          value={form.remark || ""}
          onChange={(value) => onChange({ remark: value })}
        />
      </div>
    </div>
  );
}

export default function CustomValuesPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [rows, setRows] = useState<AssistingValue[]>([]);
  const [form, setForm] = useState<AssistingValue | null>(null);

  const load = useCallback(() => {
    assistCategory.values(id).then(setRows);
  }, [id]);

  useEffect(load, [load]);

  const openCreate = () => setForm(createEmptyValue(id));
  const openEdit = (row: AssistingValue) => setForm({ ...row });
  const closeForm = () => setForm(null);

  const handleSave = async () => {
    if (!form) return;
    await assistCategory.saveValue(form);
    setForm(null);
    load();
  };

  const handleDelete = async (row: AssistingValue) => {
    await assistCategory.deleteValue(row.id);
    load();
  };

  const columns: FinColumn<AssistingValue>[] = [
    { key: "code", title: "编码", render: (row) => <b>{row.code}</b> },
    { key: "name", title: "名称", render: (row) => row.name },
    { key: "remark", title: "备注", render: (row) => row.remark || "—" },
    {
      key: "actions",
      title: "操作",
      render: (row) => (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => openEdit(row)}>
            编辑
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => handleDelete(row)}
          >
            删除
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex justify-between">
        <div>
          <Button variant="ghost" onClick={() => router.back()}>
            返回
          </Button>
          <h1 className="mt-2 text-2xl font-semibold">辅助核算项目</h1>
        </div>
        <Button onClick={openCreate}>新增项目</Button>
      </div>
      <FinTable columns={columns} data={rows} />
      <FormDialog
        open={!!form}
        title="辅助核算项目"
        onClose={closeForm}
        onSubmit={handleSave}
      >
        {form && (
          <ValueFormFields
            form={form}
            onChange={(patch) => setForm({ ...form, ...patch })}
          />
        )}
      </FormDialog>
    </div>
  );
}
