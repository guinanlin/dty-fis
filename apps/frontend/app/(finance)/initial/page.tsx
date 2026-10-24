"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/finance/PageHeader";
import { useFinApp } from "@/lib/finance/auth-context";
import { initialBalance, subject } from "@/lib/finance/service";
import type { InitialBalance, Subject } from "@/lib/finance/types";

function CellInput({
  ariaLabel,
  value,
  onChange,
}: {
  ariaLabel: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <input
      aria-label={ariaLabel}
      type="number"
      className="h-9 w-full rounded border px-2 text-right"
      value={value || ""}
      onChange={(event) => onChange(Number(event.target.value))}
    />
  );
}

export default function InitialPage() {
  const { currentAccountSet } = useFinApp();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [rows, setRows] = useState<InitialBalance[]>([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (currentAccountSet) {
      Promise.all([
        subject.tree(currentAccountSet.id),
        initialBalance.list(currentAccountSet.id),
      ]).then(([s, b]) => {
        setSubjects(s);
        setRows(
          s.map(
            (item) =>
              b.find((entry) => entry.subjectId === item.id) ?? {
                id: `initial-${item.id}`,
                accountSetId: currentAccountSet.id,
                subjectId: item.id,
                debitAmount: 0,
                creditAmount: 0,
                cumulativeDebit: 0,
                cumulativeCredit: 0,
                assistValueIds: [],
              },
          ),
        );
      });
    }
  }, [currentAccountSet]);

  const update = (id: string, field: keyof InitialBalance, value: number) => {
    setRows(
      rows.map((row) => (row.id === id ? { ...row, [field]: value } : row)),
    );
  };

  const handleTrialBalance = async () => {
    if (!currentAccountSet) return;
    const result = await initialBalance.trialBalance(currentAccountSet.id);
    setMessage(
      result.balanced
        ? `试算平衡：借贷双方 ${result.debit.toFixed(2)}`
        : `试算不平衡：借方 ${result.debit.toFixed(2)}，贷方 ${result.credit.toFixed(2)}`,
    );
  };

  const handleSave = async () => {
    await initialBalance.saveAll(rows);
    setMessage("期初余额保存成功");
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="期初余额"
        subtitle="录入启用期间的期初及本年累计发生额"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleTrialBalance}>
              试算平衡
            </Button>
            <Button onClick={handleSave}>保存</Button>
          </div>
        }
      />
      {message && (
        <p className="rounded bg-sky-50 p-3 text-sm text-sky-700">{message}</p>
      )}
      <div className="overflow-x-auto rounded-xl border bg-white">
        <table className="w-full min-w-[1000px] text-sm">
          <thead className="bg-slate-50">
            <tr>
              {[
                "科目编码",
                "科目名称",
                "方向",
                "期初借方",
                "期初贷方",
                "借方累计",
                "贷方累计",
                "年初余额",
              ].map((title) => (
                <th key={title} className="p-3 text-left">
                  {title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const item = subjects.find((entry) => entry.id === row.subjectId);
              return (
                <tr key={row.id}>
                  <td className="border-t p-3">{item?.code}</td>
                  <td className="border-t p-3">{item?.name}</td>
                  <td className="border-t p-3">{item?.balanceDirection}</td>
                  {(
                    [
                      "debitAmount",
                      "creditAmount",
                      "cumulativeDebit",
                      "cumulativeCredit",
                    ] as const
                  ).map((field) => (
                    <td key={field} className="border-t p-2">
                      <CellInput
                        ariaLabel={field}
                        value={row[field]}
                        onChange={(value) => update(row.id, field, value)}
                      />
                    </td>
                  ))}
                  <td className="border-t p-3 text-right">
                    {(
                      row.debitAmount -
                      row.creditAmount -
                      row.cumulativeDebit +
                      row.cumulativeCredit
                    ).toFixed(2)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
