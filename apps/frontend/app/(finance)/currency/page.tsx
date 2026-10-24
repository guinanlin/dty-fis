"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FinTable, type FinColumn } from "@/components/finance/FinTable";
import { FormDialog } from "@/components/finance/FormDialog";
import { ConfirmDialog } from "@/components/finance/ConfirmDialog";
import { Field } from "@/components/finance/Field";
import { useFinApp } from "@/lib/finance/auth-context";
import { currency } from "@/lib/finance/service";
import type { Currency } from "@/lib/finance/types";

function createEmptyCurrency(accountSetId: string): Currency {
  return {
    id: `currency-${Date.now()}`,
    accountSetId,
    code: "",
    name: "",
    exchangeRate: 1,
    isBase: false,
  };
}

function CurrencyFormFields({
  form,
  onChange,
}: {
  form: Currency;
  onChange: (patch: Partial<Currency>) => void;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Field
        label="编码"
        value={form.code}
        onChange={(value) => onChange({ code: value.toUpperCase() })}
      />
      <Field
        label="名称"
        value={form.name}
        onChange={(value) => onChange({ name: value })}
      />
      <Field
        label="汇率"
        type="number"
        value={String(form.exchangeRate)}
        onChange={(value) => onChange({ exchangeRate: Number(value) })}
      />
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={form.isBase}
          onChange={(event) => onChange({ isBase: event.target.checked })}
        />
        设为本位币
      </label>
    </div>
  );
}

export default function CurrencyPage() {
  const { currentAccountSet } = useFinApp();
  const [rows, setRows] = useState<Currency[]>([]);
  const [form, setForm] = useState<Currency | null>(null);
  const [removing, setRemoving] = useState<Currency | null>(null);

  const load = useCallback(() => {
    if (currentAccountSet) currency.list(currentAccountSet.id).then(setRows);
  }, [currentAccountSet]);

  useEffect(load, [load]);

  const openCreate = () => {
    if (!currentAccountSet) return;
    setForm(createEmptyCurrency(currentAccountSet.id));
  };

  const openEdit = (row: Currency) => setForm({ ...row });
  const closeForm = () => setForm(null);

  const handleSave = async () => {
    if (!form) return;
    await currency.save(form);
    setForm(null);
    load();
  };

  const handleDelete = async () => {
    if (!removing) return;
    await currency.delete(removing.id);
    setRemoving(null);
    load();
  };

  const columns: FinColumn<Currency>[] = [
    { key: "code", title: "币别编码", render: (row) => <b>{row.code}</b> },
    { key: "name", title: "币别名称", render: (row) => row.name },
    { key: "rate", title: "汇率", render: (row) => row.exchangeRate },
    {
      key: "base",
      title: "本位币",
      render: (row) => (row.isBase ? <Badge>是</Badge> : "否"),
    },
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
            disabled={row.isBase}
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
      <div className="flex justify-between">
        <div>
          <h1 className="text-2xl font-semibold">币别设置</h1>
          <p className="mt-1 text-sm text-slate-500">
            维护币别、汇率及唯一记账本位币
          </p>
        </div>
        <Button onClick={openCreate}>新增</Button>
      </div>
      <FinTable columns={columns} data={rows} />
      <FormDialog
        open={!!form}
        title="币别信息"
        onClose={closeForm}
        onSubmit={handleSave}
      >
        {form && (
          <CurrencyFormFields
            form={form}
            onChange={(patch) => setForm({ ...form, ...patch })}
          />
        )}
      </FormDialog>
      <ConfirmDialog
        open={!!removing}
        destructive
        description={`确认删除币别 ${removing?.name}？`}
        onClose={() => setRemoving(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
