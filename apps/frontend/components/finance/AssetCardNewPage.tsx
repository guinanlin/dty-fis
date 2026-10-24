"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CodeSubjectSelect } from "@/components/finance/CodeSubjectSelect";
import { PageHeader } from "@/components/finance/PageHeader";
import { useFinApp } from "@/lib/finance/auth-context";
import { asset, subject } from "@/lib/finance/service";
import type { AssetCategory, Subject } from "@/lib/finance/types";
import {
  calculateMonthlyDepreciation,
  defaultDateForPeriod,
  defaultSubjectCodes,
  entryPeriodText,
  expenseSubjectCodeForDepartment,
  methodDescriptions,
  methodLabels,
  validateAssetCardForm,
  type FormDepreciationMethod,
} from "@/lib/finance/asset-form";

const departments = [
  "运输部",
  "财务部",
  "仓储部",
  "销售部",
  "行政部",
  "生产部",
];
const initial = (year: number, month: number) => ({
  assetCode: "",
  name: "",
  categoryCode: "",
  department: "",
  startUseDate: defaultDateForPeriod(year, month),
  quantity: "1",
  model: "",
  location: "",
  user: "",
  depreciationMethod: "average" as FormDepreciationMethod,
  usefulLifeMonths: "60",
  originalValue: "0",
  taxAmount: "0",
  residualRate: "5",
  impairmentProvision: "0",
  depreciatedMonths: "0",
  openingAccumulatedDepreciation: "0",
  monthlyDepreciation: "0",
  remark: "",
  ...defaultSubjectCodes(),
  depreciationExpenseSubjectCode: "",
});
type Form = ReturnType<typeof initial>;
export default function AssetCardNewPage() {
  const { currentAccountSet, currentPeriod } = useFinApp();
  const router = useRouter();
  const [form, setForm] = useState<Form>(() =>
    initial(currentPeriod.year, currentPeriod.month),
  );
  const [categories, setCategories] = useState<AssetCategory[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState("");
  const [manual, setManual] = useState(false);
  const set = (key: keyof Form, value: string) =>
    setForm((old) => ({ ...old, [key]: value }));
  useEffect(() => {
    if (!currentAccountSet) return;
    Promise.all([
      asset.categories.list(currentAccountSet.id),
      subject.list(currentAccountSet.id),
      asset.cards.maxCode(currentAccountSet.id),
    ]).then(([cats, subs, code]) => {
      setCategories(cats);
      setSubjects(subs);
      setForm((old) => ({
        ...old,
        assetCode: code,
        depreciationExpenseSubjectCode: "",
      }));
    });
  }, [currentAccountSet]);
  useEffect(() => {
    if (!currentAccountSet) return;
    const selected = categories.find((x) => x.code === form.categoryCode);
    if (selected)
      setForm((old) => ({
        ...old,
        depreciationMethod: selected.depreciationMethod,
        usefulLifeMonths: String(selected.usefulLifeMonths),
        residualRate: String(selected.residualRate),
        fixedAssetSubjectCode: selected.fixedAssetSubjectCode,
        accumulatedDepreciationSubjectCode:
          selected.accumulatedDepreciationSubjectCode,
      }));
  }, [currentAccountSet, form.categoryCode, categories, subjects]);
  useEffect(() => {
    if (!manual)
      setForm((old) => ({
        ...old,
        monthlyDepreciation: String(
          calculateMonthlyDepreciation({
            method: old.depreciationMethod,
            usefulLifeMonths: Number(old.usefulLifeMonths),
            depreciatedMonths: Number(old.depreciatedMonths),
            originalValue: Number(old.originalValue),
            residualRate: Number(old.residualRate),
            openingAccumulatedDepreciation: Number(
              old.openingAccumulatedDepreciation,
            ),
            impairmentProvision: Number(old.impairmentProvision),
          }),
        ),
      }));
  }, [
    form.depreciationMethod,
    form.usefulLifeMonths,
    form.depreciatedMonths,
    form.originalValue,
    form.residualRate,
    form.openingAccumulatedDepreciation,
    form.impairmentProvision,
    manual,
  ]);
  const subjectFields = [
    ["fixedAssetSubjectCode", "固定资产科目*"],
    ["purchaseCounterpartSubjectCode", "资产购入对方科目*"],
    ["taxSubjectCode", "税金科目"],
    ["accumulatedDepreciationSubjectCode", "累计折旧科目*"],
    ["depreciationExpenseSubjectCode", "折旧费用科目*"],
    ["disposalSubjectCode", "资产清理科目"],
    ["impairmentSubjectCode", "减值准备科目"],
    ["impairmentCounterpartSubjectCode", "减值准备对方科目"],
  ] as const;
  const submit = async (action: "save" | "new" | "copy") => {
    const values = {
      ...form,
      monthlyDepreciation: Number(form.monthlyDepreciation),
      originalValue: Number(form.originalValue),
      residualRate: Number(form.residualRate),
      usefulLifeMonths: Number(form.usefulLifeMonths),
      depreciatedMonths: Number(form.depreciatedMonths),
      quantity: Number(form.quantity),
    };
    const nextErrors = validateAssetCardForm(values);
    subjectFields.forEach(([key]) => {
      if (form[key] && !subjects.some((x) => x.code === form[key]))
        nextErrors[key] = "请选择有效科目";
    });
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length || !currentAccountSet) return;
    setBusy(true);
    try {
      await asset.cards.create({
        ...values,
        code: form.assetCode,
        accountSetId: currentAccountSet.id,
        quantity: Number(form.quantity),
        taxAmount: Number(form.taxAmount),
        impairmentProvision: Number(form.impairmentProvision),
        openingAccumulatedDepreciation: Number(
          form.openingAccumulatedDepreciation,
        ),
      });
      setSuccess("资产卡片保存成功");
      const next = await asset.cards.maxCode(currentAccountSet.id);
      if (action === "save") router.push("/asset/cards");
      else
        setForm(
          action === "new"
            ? {
                ...initial(currentPeriod.year, currentPeriod.month),
                assetCode: next,
              }
            : { ...form, assetCode: next },
        );
    } finally {
      setBusy(false);
    }
  };
  const field = (label: string, key: keyof Form, type = "text") => (
    <label className="space-y-1 text-sm">
      <span>{label}</span>
      <Input
        type={type}
        value={form[key]}
        onChange={(e) => {
          set(key, e.target.value);
          if (key === "monthlyDepreciation") setManual(true);
        }}
      />
      {errors[key] && <em className="text-xs text-red-600">{errors[key]}</em>}
    </label>
  );
  if (!currentAccountSet) return null;
  return (
    <div className="space-y-5">
      <PageHeader
        title="新增资产卡片"
        subtitle={`录入期间：${entryPeriodText(currentPeriod.year, currentPeriod.month)}`}
        actions={
          <Button variant="outline" onClick={() => router.push("/asset/cards")}>
            返回
          </Button>
        }
      />
      {Object.keys(errors).length > 0 && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          请修正表单中的错误：{Object.values(errors).join("、")}
        </div>
      )}
      {success && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
          {success}
        </div>
      )}
      <section className="rounded-xl border bg-white p-5">
        <h2 className="mb-4 font-semibold">基本信息</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {field("资产编码*", "assetCode")}
          {field("资产名称*", "name")}
          <label className="space-y-1 text-sm">
            <span>资产类别*</span>
            <select
              className="h-10 w-full rounded-md border px-3"
              value={form.categoryCode}
              onChange={(e) => set("categoryCode", e.target.value)}
            >
              <option value="">请选择</option>
              {categories.map((x) => (
                <option key={x.id} value={x.code}>
                  {x.code} {x.name}
                </option>
              ))}
            </select>
            {errors.categoryCode && (
              <em className="text-xs text-red-600">{errors.categoryCode}</em>
            )}
            <Link className="text-xs text-sky-600" href="/asset/categories">
              管理类别
            </Link>
          </label>
          <label className="space-y-1 text-sm">
            <span>使用部门*</span>
            <select
              className="h-10 w-full rounded-md border px-3"
              value={form.department}
              onChange={(e) => {
                set("department", e.target.value);
                set(
                  "depreciationExpenseSubjectCode",
                  expenseSubjectCodeForDepartment(e.target.value),
                );
              }}
            >
              <option value="">请选择</option>
              {departments.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
            {errors.department && (
              <em className="text-xs text-red-600">{errors.department}</em>
            )}
          </label>
          {field("开始使用日期*", "startUseDate", "date")}
          <Stepper
            label="数量*"
            value={form.quantity}
            min={1}
            onChange={(value) => set("quantity", value)}
            error={errors.quantity}
          />
          {field("规格型号", "model")}
          {field("存放地点", "location")}
          <label className="space-y-1 text-sm">
            <span>使用人</span>
            <select
              className="h-10 w-full rounded-md border px-3"
              value={form.user}
              onChange={(e) => set("user", e.target.value)}
            >
              <option value="">请选择</option>
              {["管理员", "张三", "李四"].map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </label>
        </div>
      </section>
      <section className="rounded-xl border bg-white p-5">
        <h2 className="mb-4 font-semibold">折旧方法</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          <label className="space-y-1 text-sm">
            <span
              title={Object.entries(methodDescriptions)
                .map(
                  ([key, description]) =>
                    `${methodLabels[key as FormDepreciationMethod]}：${description}`,
                )
                .join("；")}
            >
              折旧方法*{" "}
              <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-slate-200 text-[10px]">
                ?
              </span>
            </span>
            <select
              className="h-10 w-full rounded-md border px-3"
              value={form.depreciationMethod}
              onChange={(e) => set("depreciationMethod", e.target.value)}
            >
              {Object.entries(methodLabels).map(([key, label]) => (
                <option
                  key={key}
                  value={key}
                  title={methodDescriptions[key as FormDepreciationMethod]}
                >
                  {label}
                </option>
              ))}
            </select>
            {errors.depreciationMethod && (
              <em className="text-xs text-red-600">
                {errors.depreciationMethod}
              </em>
            )}
          </label>
          <Stepper
            label="预计使用期数*"
            value={form.usefulLifeMonths}
            min={1}
            onChange={(value) => set("usefulLifeMonths", value)}
            error={errors.usefulLifeMonths}
          />
        </div>
      </section>
      <section className="rounded-xl border bg-white p-5">
        <h2 className="mb-4 font-semibold">原值、净值、累计折旧</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {field("原值*", "originalValue", "number")}
          {field("税额", "taxAmount", "number")}
          {field("残值率*", "residualRate", "number")}
          {field("减值准备", "impairmentProvision", "number")}
          <Stepper
            label="已折旧期间*"
            value={form.depreciatedMonths}
            min={0}
            onChange={(value) => set("depreciatedMonths", value)}
            error={errors.depreciatedMonths}
          />
          {field("期初累计折旧", "openingAccumulatedDepreciation", "number")}
          {field("月折旧额*（可手改）", "monthlyDepreciation", "number")}
        </div>
        <p className="mt-3 text-sm text-slate-500">
          预计残值：
          {(
            (Number(form.originalValue) * Number(form.residualRate)) /
            100
          ).toFixed(2)}
          ；期初净值：
          {(
            Number(form.originalValue) -
            Number(form.openingAccumulatedDepreciation) -
            Number(form.impairmentProvision)
          ).toFixed(2)}
        </p>
      </section>
      <section className="rounded-xl border bg-white p-5">
        <h2 className="mb-4 font-semibold">凭证科目设置</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {subjectFields.map(([key, label]) => (
            <label key={key} className="space-y-1 text-sm">
              <span>{label}</span>
              <CodeSubjectSelect
                subjects={subjects}
                value={form[key]}
                onChange={(code) => set(key, code)}
              />
              {errors[key] && (
                <em className="text-xs text-red-600">{errors[key]}</em>
              )}
            </label>
          ))}
        </div>
        <label className="mt-4 block space-y-1 text-sm">
          <span>备注</span>
          <textarea
            className="min-h-24 w-full rounded-md border p-3"
            value={form.remark}
            onChange={(e) => set("remark", e.target.value)}
          />
        </label>
      </section>
      <div className="flex flex-wrap justify-end gap-2">
        <Button
          variant="outline"
          disabled={busy}
          onClick={() => submit("copy")}
        >
          保存并复制
        </Button>
        <Button variant="outline" disabled={busy} onClick={() => submit("new")}>
          保存并新增
        </Button>
        <Button disabled={busy} onClick={() => submit("save")}>
          {busy ? "保存中..." : "保存"}
        </Button>
      </div>
    </div>
  );
}

function Stepper({
  label,
  value,
  min,
  onChange,
  error,
}: {
  label: string;
  value: string;
  min: number;
  onChange: (value: string) => void;
  error?: string;
}) {
  const change = (delta: number) =>
    onChange(String(Math.max(min, Number(value || min) + delta)));
  return (
    <label className="space-y-1 text-sm">
      <span>{label}</span>
      <div className="flex h-10">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-10 rounded-r-none"
          onClick={() => change(-1)}
        >
          −
        </Button>
        <Input
          type="number"
          min={min}
          className="h-10 rounded-none text-center"
          value={value}
          onChange={(event) =>
            onChange(String(Math.max(min, Number(event.target.value))))
          }
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-10 rounded-l-none"
          onClick={() => change(1)}
        >
          ＋
        </Button>
      </div>
      {error && <em className="text-xs text-red-600">{error}</em>}
    </label>
  );
}
