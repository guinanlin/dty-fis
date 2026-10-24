"use client";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { MoneyText } from "@/components/finance/MoneyText";
import { PageHeader } from "@/components/finance/PageHeader";
import { useFinApp } from "@/lib/finance/auth-context";
import { asset } from "@/lib/finance/service";
import type { DepreciationDetailRow } from "@/lib/finance/types";
type NumKey =
  | "originalValue"
  | "openingAccumulatedDepreciation"
  | "currentDepreciation"
  | "yearDepreciation"
  | "endingAccumulatedDepreciation"
  | "impairmentProvision"
  | "netValue";
const keys: NumKey[] = [
  "originalValue",
  "openingAccumulatedDepreciation",
  "currentDepreciation",
  "yearDepreciation",
  "endingAccumulatedDepreciation",
  "impairmentProvision",
  "netValue",
];
const years = (year: number) => Array.from({ length: 5 }, (_, i) => year - i);
const months = Array.from({ length: 12 }, (_, i) => i + 1);
export default function DepreciationDetailPage() {
  const { currentAccountSet, currentPeriod } = useFinApp();
  const previous =
    currentPeriod.month === 1
      ? { year: currentPeriod.year - 1, month: 12 }
      : { year: currentPeriod.year, month: currentPeriod.month - 1 };
  const [startYear, setStartYear] = useState(previous.year);
  const [startMonth, setStartMonth] = useState(previous.month);
  const [endYear, setEndYear] = useState(currentPeriod.year);
  const [endMonth, setEndMonth] = useState(currentPeriod.month);
  const [byDepartment, setByDepartment] = useState(false);
  const [includeCleared, setIncludeCleared] = useState(false);
  const [showChanges, setShowChanges] = useState(false);
  const [rows, setRows] = useState<DepreciationDetailRow[]>([]);
  const [loaded, setLoaded] = useState(false);
  const load = useCallback(async () => {
    if (!currentAccountSet) return;
    setRows(
      await asset.depreciation.detail(
        currentAccountSet.id,
        startYear,
        startMonth,
        endYear,
        endMonth,
        { byDepartment, includeCleared, showChanges },
      ),
    );
    setLoaded(true);
  }, [
    byDepartment,
    currentAccountSet,
    endMonth,
    endYear,
    includeCleared,
    showChanges,
    startMonth,
    startYear,
  ]);
  useEffect(() => {
    void load();
  }, [load]);
  const grouped = rows.reduce<Record<string, DepreciationDetailRow[]>>(
    (all, row) => {
      (all[row.categoryCode] ??= []).push(row);
      return all;
    },
    {},
  );
  const total = (items: DepreciationDetailRow[], key: NumKey) =>
    items.reduce((sum, row) => sum + row[key], 0);
  const rowCells = (item: DepreciationDetailRow) => (
    <>
      {keys.map((key) => (
        <td key={key} className="p-3 text-right">
          <MoneyText value={item[key]} />
        </td>
      ))}
    </>
  );
  return (
    <div className="space-y-5">
      <PageHeader title="折旧明细表" subtitle="按资产卡片查看期间折旧明细" />
      <div className="flex flex-wrap items-center gap-3 rounded-xl border bg-white p-4 text-sm">
        起始期间
        <select
          value={startYear}
          onChange={(e) => setStartYear(Number(e.target.value))}
          className="rounded border px-2 py-2"
        >
          {years(currentPeriod.year).map((y) => (
            <option key={y}>{y}</option>
          ))}
        </select>
        <select
          value={startMonth}
          onChange={(e) => setStartMonth(Number(e.target.value))}
          className="rounded border px-2 py-2"
        >
          {months.map((m) => (
            <option key={m}>{m}</option>
          ))}
        </select>
        结束期间
        <select
          value={endYear}
          onChange={(e) => setEndYear(Number(e.target.value))}
          className="rounded border px-2 py-2"
        >
          {years(currentPeriod.year).map((y) => (
            <option key={y}>{y}</option>
          ))}
        </select>
        <select
          value={endMonth}
          onChange={(e) => setEndMonth(Number(e.target.value))}
          className="rounded border px-2 py-2"
        >
          {months.map((m) => (
            <option key={m}>{m}</option>
          ))}
        </select>
        <label>
          <input
            type="checkbox"
            checked={byDepartment}
            onChange={(e) => setByDepartment(e.target.checked)}
            className="mr-1"
          />
          按部门汇总
        </label>
        <label>
          <input
            type="checkbox"
            checked={includeCleared}
            onChange={(e) => setIncludeCleared(e.target.checked)}
            className="mr-1"
          />
          显示已清理
        </label>
        <label>
          <input
            type="checkbox"
            checked={showChanges}
            onChange={(e) => setShowChanges(e.target.checked)}
            className="mr-1"
          />
          显示变动信息
        </label>
        <Button variant="outline" onClick={() => void load()}>
          查询
        </Button>
      </div>
      <div className="overflow-x-auto rounded-xl border bg-white">
        <table className="w-full min-w-[1300px] text-sm">
          <thead className="bg-slate-50">
            <tr>
              {(byDepartment ? ["部门"] : ["类别", "编码", "名称", "部门"])
                .concat(
                  [
                    "原值",
                    "期初累计折旧",
                    "本期折旧",
                    "本年折旧",
                    "期末累计折旧",
                    "减值准备",
                    "净值",
                  ],
                  showChanges ? ["变动信息"] : [],
                )
                .map((x) => (
                  <th key={x} className="p-3 text-left">
                    {x}
                  </th>
                ))}
            </tr>
          </thead>
          <tbody>
            {byDepartment
              ? Object.entries(
                  rows.reduce<Record<string, DepreciationDetailRow[]>>(
                    (a, r) => {
                      (a[r.department] ??= []).push(r);
                      return a;
                    },
                    {},
                  ),
                ).map(([department, items]) => (
                  <tr key={department} className="border-t">
                    <td className="p-3">{department}</td>
                    {keys.map((k) => (
                      <td key={k} className="p-3 text-right">
                        <MoneyText value={total(items, k)} />
                      </td>
                    ))}
                  </tr>
                ))
              : Object.entries(grouped).map(([code, items]) => (
                  <>
                    {items.map((row) => (
                      <tr key={row.id} className="border-t">
                        <td className="p-3">{row.categoryName}</td>
                        <td className="p-3">{row.code}</td>
                        <td className="p-3">{row.name}</td>
                        <td className="p-3">{row.department}</td>
                        {rowCells(row)}
                        {showChanges && (
                          <td className="p-3">{row.changeInfo || "—"}</td>
                        )}
                      </tr>
                    ))}
                    <tr
                      key={`${code}-subtotal`}
                      className="border-t bg-slate-50 font-semibold"
                    >
                      <td className="p-3">小计</td>
                      <td colSpan={3} className="p-3">
                        —
                      </td>
                      {keys.map((k) => (
                        <td key={k} className="p-3 text-right">
                          <MoneyText value={total(items, k)} />
                        </td>
                      ))}
                      {showChanges && <td className="p-3">—</td>}
                    </tr>
                  </>
                ))}
            {loaded && !rows.length && (
              <tr>
                <td
                  colSpan={showChanges ? 12 : 11}
                  className="p-12 text-center text-slate-400"
                >
                  暂无数据
                </td>
              </tr>
            )}
            <tr className="border-t bg-sky-50 font-semibold">
              <td className="p-3">合计</td>
              <td colSpan={byDepartment ? 0 : 3} className="p-3">
                {byDepartment ? "" : "—"}
              </td>
              {keys.map((k) => (
                <td key={k} className="p-3 text-right">
                  <MoneyText value={total(rows, k)} />
                </td>
              ))}
              {showChanges && <td>—</td>}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
