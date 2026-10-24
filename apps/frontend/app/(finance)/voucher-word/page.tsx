"use client";

import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckboxField } from "@/components/finance/CheckboxField";
import { Field } from "@/components/finance/Field";
import { FinTable, type FinColumn } from "@/components/finance/FinTable";
import { FormDialog } from "@/components/finance/FormDialog";
import { PageHeader } from "@/components/finance/PageHeader";
import { useFinApp } from "@/lib/finance/auth-context";
import { voucherWord } from "@/lib/finance/service";
import type { VoucherWord } from "@/lib/finance/types";

function createEmptyVoucherWord(accountSetId: string): VoucherWord {
  return {
    id: `word-${Date.now()}`,
    accountSetId,
    name: "",
    word: "",
    printTitle: "记账凭证",
    isDefault: false,
    annualNumbering: false,
  };
}

function VoucherWordFormFields({
  form,
  onChange,
}: {
  form: VoucherWord;
  onChange: (patch: Partial<VoucherWord>) => void;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Field
        label="凭证字"
        value={form.word}
        onChange={(value) => onChange({ word: value.slice(0, 2) })}
      />
      <Field
        label="名称"
        value={form.name}
        onChange={(value) => onChange({ name: value })}
      />
      <Field
        label="打印标题"
        value={form.printTitle}
        onChange={(value) => onChange({ printTitle: value })}
      />
      <CheckboxField
        label="设为默认"
        checked={form.isDefault}
        onChange={(value) => onChange({ isDefault: value })}
      />
      <CheckboxField
        label="按年度连续编号"
        checked={form.annualNumbering}
        onChange={(value) => onChange({ annualNumbering: value })}
      />
    </div>
  );
}

export default function VoucherWordPage() {
  const { currentAccountSet } = useFinApp();
  const [rows, setRows] = useState<VoucherWord[]>([]);
  const [form, setForm] = useState<VoucherWord | null>(null);

  const load = useCallback(() => {
    if (currentAccountSet) voucherWord.list(currentAccountSet.id).then(setRows);
  }, [currentAccountSet]);

  useEffect(load, [load]);

  const openCreate = () => {
    if (currentAccountSet)
      setForm(createEmptyVoucherWord(currentAccountSet.id));
  };

  const openEdit = (row: VoucherWord) => setForm({ ...row });
  const closeForm = () => setForm(null);

  const handleSave = async () => {
    if (!form) return;
    await voucherWord.save(form);
    setForm(null);
    load();
  };

  const columns: FinColumn<VoucherWord>[] = [
    {
      key: "word",
      title: "凭证字",
      render: (row) => <b className="text-lg">{row.word}</b>,
    },
    { key: "name", title: "名称", render: (row) => row.name },
    { key: "title", title: "打印标题", render: (row) => row.printTitle },
    {
      key: "annual",
      title: "年度连续编号",
      render: (row) => (row.annualNumbering ? "是" : "否"),
    },
    {
      key: "default",
      title: "默认",
      render: (row) => (row.isDefault ? <Badge>默认</Badge> : "否"),
    },
    {
      key: "actions",
      title: "操作",
      render: (row) => (
        <Button size="sm" variant="outline" onClick={() => openEdit(row)}>
          编辑
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="凭证字"
        subtitle="管理记、收、付、转等凭证字及编号规则"
        actions={<Button onClick={openCreate}>新增</Button>}
      />
      <FinTable columns={columns} data={rows} />
      <FormDialog
        open={!!form}
        title="凭证字信息"
        onClose={closeForm}
        onSubmit={handleSave}
      >
        {form && (
          <VoucherWordFormFields
            form={form}
            onChange={(patch) => setForm({ ...form, ...patch })}
          />
        )}
      </FormDialog>
    </div>
  );
}
