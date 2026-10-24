"use client";

import { useEffect, useState } from "react";
import { MoneyText } from "@/components/finance/MoneyText";
import { useFinApp } from "@/lib/finance/auth-context";
import { accountBook } from "@/lib/finance/service";
import type { SubjectBalanceRow } from "@/lib/finance/types";

function FilterBar({
  period,
  currentYear,
  level,
  includeAssist,
  onPeriodChange,
  onLevelChange,
  onAssistChange,
}: {
  period: { year: number; month: number };
  currentYear: number;
  level: number;
  includeAssist: boolean;
  onPeriodChange: (period: { year: number; month: number }) => void;
  onLevelChange: (level: number) => void;
  onAssistChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border bg-white p-4">
      <select
        value={period.year}
        onChange={(event) =>
          onPeriodChange({ ...period, year: Number(event.target.value) })
        }
        className="rounded-md border px-3 py-2 text-sm"
      >
        {Array.from({ length: 5 }, (_, index) => currentYear - index).map(
          (year) => (
            <option key={year}>{year}年</option>
          ),
        )}
      </select>
      <select
        value={period.month}
        onChange={(event) =>
          onPeriodChange({ ...period, month: Number(event.target.value) })
        }
        className="rounded-md border px-3 py-2 text-sm"
      >
        {Array.from({ length: 12 }, (_, index) => index + 1).map((month) => (
          <option key={month} value={month}>
            第{month}期
          </option>
        ))}
      </select>
      <label className="text-sm">
        显示级次{" "}
        <select
          value={level}
          onChange={(event) => onLevelChange(Number(event.target.value))}
          className="ml-2 rounded-md border px-3 py-2"
        >
          {[1, 2, 3, 4].map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
      </label>
      <label className="ml-auto flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={includeAssist}
          onChange={(event) => onAssistChange(event.target.checked)}
        />
        显示辅助核算
      </label>
    </div>
  );
}

function BalanceTable({ rows }: { rows: SubjectBalanceRow[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border bg-white">
      <table className="w-full min-w-[1000px] text-sm">
        <thead className="bg-slate-50">
          <tr>
            <th rowSpan={2} className="border p-3">
              科目编码
            </th>
            <th rowSpan={2} className="border p-3 text-left">
              科目名称
            </th>
            <th colSpan={2} className="border p-3">
              期初余额
            </th>
            <th colSpan={2} className="border p-3">
              本期发生额
            </th>
            <th colSpan={2} className="border p-3">
              期末余额
            </th>
          </tr>
          <tr>
            {["借方", "贷方", "借方", "贷方", "借方", "贷方"].map(
              (title, index) => (
                <th key={`${title}-${index}`} className="border p-2 text-right">
                  {title}
                </th>
              ),
            )}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="hover:bg-sky-50">
              <td className="border px-3 py-2">{row.subjectCode}</td>
              <td
                className="border px-3 py-2"
                style={{ paddingLeft: `${12 + row.level * 10}px` }}
              >
                {row.subjectName}
              </td>
              {[
                row.openingDebit,
                row.openingCredit,
                row.periodDebit,
                row.periodCredit,
                row.closingDebit,
                row.closingCredit,
              ].map((amount, index) => (
                <td key={index} className="border px-3 py-2 text-right">
                  <MoneyText value={amount} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function SubjectBalancePage() {
  const { currentAccountSet, currentPeriod } = useFinApp();
  const [period, setPeriod] = useState(currentPeriod);
  const [level, setLevel] = useState(4);
  const [includeAssist, setIncludeAssist] = useState(false);
  const [rows, setRows] = useState<SubjectBalanceRow[]>([]);

  useEffect(() => {
    if (currentAccountSet)
      accountBook
        .subjectBalance(
          currentAccountSet.id,
          period.year,
          period.month,
          level,
          includeAssist,
        )
        .then(setRows);
  }, [currentAccountSet, includeAssist, level, period]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">科目余额表</h1>
        <p className="mt-1 text-sm text-slate-500">
          查看各级科目的期初、本期发生及期末余额
        </p>
      </div>
      <FilterBar
        period={period}
        currentYear={currentPeriod.year}
        level={level}
        includeAssist={includeAssist}
        onPeriodChange={setPeriod}
        onLevelChange={setLevel}
        onAssistChange={setIncludeAssist}
      />
      <BalanceTable rows={rows} />
    </div>
  );
}
