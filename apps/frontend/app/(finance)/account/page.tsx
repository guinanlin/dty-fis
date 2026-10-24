"use client";

import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/finance/Field";
import { FinTable, type FinColumn } from "@/components/finance/FinTable";
import { FormDialog } from "@/components/finance/FormDialog";
import { PageHeader } from "@/components/finance/PageHeader";
import { SelectField } from "@/components/finance/SelectField";
import { useFinApp } from "@/lib/finance/auth-context";
import { accountSet } from "@/lib/finance/service";
import type { AccountSet } from "@/lib/finance/types";

const blank = (): Partial<AccountSet> & Pick<AccountSet, "companyName"> => ({
  companyName: "",
  creditCode: "",
  accountingStandards: "小企业会计准则",
  industry: "IT·通信·电子·互联网",
  vatType: "小规模纳税人",
  address: "",
  enableDate: `${new Date().toISOString().slice(0, 7)}-01`,
  voucherReviewed: true,
  enabled: true,
});

function AccountFormFields({
  form,
  onChange,
}: {
  form: Partial<AccountSet> & Pick<AccountSet, "companyName">;
  onChange: (patch: Partial<AccountSet>) => void;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Field
        label="单位名称"
        value={form.companyName}
        onChange={(value) => onChange({ companyName: value })}
      />
      <Field
        label="统一社会信用代码"
        value={form.creditCode || ""}
        onChange={(value) => onChange({ creditCode: value })}
      />
      <Field
        label="启用日期"
        type="date"
        value={form.enableDate || ""}
        onChange={(value) => onChange({ enableDate: value })}
      />
      <Field
        label="单位所在地"
        value={form.address || ""}
        onChange={(value) => onChange({ address: value })}
      />
      <SelectField
        label="会计准则"
        value={form.accountingStandards || ""}
        onChange={(value) => onChange({ accountingStandards: value })}
      >
        <option>小企业会计准则</option>
        <option>企业会计准则</option>
      </SelectField>
      <SelectField
        label="行业"
        value={form.industry || ""}
        onChange={(value) => onChange({ industry: value })}
      >
        <option>IT·通信·电子·互联网</option>
        <option>贸易·批发·零售·租赁业</option>
        <option>生产·加工·制造</option>
      </SelectField>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={form.voucherReviewed ?? true}
          onChange={(event) =>
            onChange({ voucherReviewed: event.target.checked })
          }
        />
        凭证需要审核
      </label>
    </div>
  );
}

export default function AccountPage() {
  const { currentUser, currentAccountSet, refreshAccountSets } = useFinApp();
  const [rows, setRows] = useState<AccountSet[]>([]);
  const [form, setForm] = useState(blank());
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");

  const load = useCallback(() => {
    accountSet.list().then(setRows);
  }, []);

  useEffect(load, [load]);

  const openCreate = () => {
    setForm(blank());
    setOpen(true);
  };

  const openEdit = (row: AccountSet) => {
    setForm({ ...row });
    setOpen(true);
  };

  const closeForm = () => setOpen(false);

  const handleToggle = async (row: AccountSet) => {
    await accountSet.setEnabled(row.id, row.enabled === false);
    load();
  };

  const handleSave = async () => {
    if (!currentUser || !form.companyName) return;
    await accountSet.save(form, currentUser.id);
    await refreshAccountSets();
    load();
    setOpen(false);
    setMessage("账套保存成功");
  };

  const columns: FinColumn<AccountSet>[] = [
    {
      key: "current",
      title: "",
      render: (row) =>
        row.id === currentAccountSet?.id ? <Badge>当前</Badge> : null,
    },
    {
      key: "name",
      title: "单位名称",
      render: (row) => <b>{row.companyName}</b>,
    },
    {
      key: "period",
      title: "当前记账年月",
      render: (row) =>
        `${row.currentPeriod.year}年${row.currentPeriod.month}月`,
    },
    {
      key: "enable",
      title: "启用年月",
      render: (row) => row.enableDate.slice(0, 7),
    },
    {
      key: "standard",
      title: "会计准则",
      render: (row) => row.accountingStandards,
    },
    {
      key: "status",
      title: "状态",
      render: (row) => (
        <Badge variant={row.enabled === false ? "secondary" : "default"}>
          {row.enabled === false ? "已停用" : "正常"}
        </Badge>
      ),
    },
    {
      key: "actions",
      title: "操作",
      render: (row) => (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => openEdit(row)}>
            编辑
          </Button>
          <Button size="sm" variant="outline" onClick={() => handleToggle(row)}>
            {row.enabled === false ? "启用" : "停用"}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="账套管理"
        subtitle={`共 ${rows.length} 个账套`}
        actions={<Button onClick={openCreate}>新建账套</Button>}
      />
      {message && (
        <p className="rounded bg-emerald-50 p-3 text-sm text-emerald-700">
          {message}
        </p>
      )}
      <FinTable columns={columns} data={rows} />
      <FormDialog
        open={open}
        title={form.id ? "编辑账套" : "创建账套"}
        onClose={closeForm}
        onSubmit={handleSave}
      >
        <AccountFormFields
          form={form}
          onChange={(patch) => setForm({ ...form, ...patch })}
        />
      </FormDialog>
    </div>
  );
}
