"use client";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { MoneyText } from "@/components/finance/MoneyText";
import { PageHeader } from "@/components/finance/PageHeader";
import { useFinApp } from "@/lib/finance/auth-context";
import { asset } from "@/lib/finance/service";
import type { DepreciationSummaryRow } from "@/lib/finance/types";
const fields: (keyof DepreciationSummaryRow)[] = [
  "openingOriginalValue",
  "addedOriginalValue",
  "decreasedOriginalValue",
  "endingOriginalValue",
  "openingAccumulatedDepreciation",
  "currentDepreciation",
  "endingAccumulatedDepreciation",
  "openingNetValue",
  "endingNetValue",
];
const labels = [
  "期初原值",
  "本期增加原值",
  "本期减少原值",
  "期末原值",
  "期初累计折旧",
  "本期计提折旧",
  "期末累计折旧",
  "期初净值",
  "期末净值",
];
export default function DepreciationSummaryPage() {
  const { currentAccountSet, currentPeriod } = useFinApp();
  const [year, setYear] = useState(currentPeriod.year);
  const [month, setMonth] = useState(currentPeriod.month);
  const [rows, setRows] = useState<DepreciationSummaryRow[]>([]);
  const load = useCallback(async () => {
    if (currentAccountSet)
      setRows(
        await asset.depreciation.summary(currentAccountSet.id, year, month),
      );
  }, [currentAccountSet, month, year]);
  useEffect(() => {
    void load();
  }, [load]);
  return (
    <div className="space-y-5">
      <PageHeader title="折旧汇总表" subtitle="按资产类别汇总固定资产折旧" />
      <div className="flex flex-wrap gap-3 rounded-xl border bg-white p-4">
        <select
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="rounded border px-3 py-2"
        >
          {Array.from({ length: 5 }, (_, i) => currentPeriod.year - i).map(
            (y) => (
              <option key={y}>{y}</option>
            ),
          )}
        </select>
        <select
          value={month}
          onChange={(e) => setMonth(Number(e.target.value))}
          className="rounded border px-3 py-2"
        >
          {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
            <option key={m} value={m}>
              第{m}期
            </option>
          ))}
        </select>
        <Button variant="outline" onClick={() => void load()}>
          查询
        </Button>
      </div>
      <div className="overflow-x-auto rounded-xl border bg-white">
        <table className="w-full min-w-[1400px] text-sm">
          <thead className="bg-slate-50">
            <tr>
              {["类别", ...labels].map((x) => (
                <th key={x} className="p-3 text-left">
                  {x}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.categoryCode} className="border-t">
                <td className="p-3">
                  {row.categoryCode} {row.categoryName}
                </td>
                {fields.map((field) => (
                  <td key={field} className="p-3 text-right">
                    <MoneyText value={row[field] as number} />
                  </td>
                ))}
              </tr>
            ))}
            <tr className="border-t bg-sky-50 font-semibold">
              <td className="p-3">合计</td>
              {fields.map((field) => (
                <td key={field} className="p-3 text-right">
                  <MoneyText
                    value={rows.reduce(
                      (sum, row) => sum + (row[field] as number),
                      0,
                    )}
                  />
                </td>
              ))}
            </tr>
            {!rows.length && (
              <tr>
                <td colSpan={10} className="p-12 text-center text-slate-400">
                  暂无数据
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
