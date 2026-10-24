"use client";

import { useMemo, useState } from "react";
import { ChevronDown, CopyPlus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type {
  AssistingCategory,
  AssistingValue,
  Subject,
  VoucherDetail,
} from "@/lib/finance/types";
import { formatMoney, MoneyText } from "./MoneyText";

export type VoucherDraftRow = Omit<VoucherDetail, "id" | "voucherId"> & {
  id: string;
};

export function emptyVoucherRow(index = Date.now()): VoucherDraftRow {
  return {
    id: `draft-${index}`,
    summary: "",
    subjectId: "",
    subjectCode: "",
    subjectName: "",
    debitAmount: 0,
    creditAmount: 0,
    assistAccountings: {},
    currencyId: "",
    exchangeRate: 1,
  };
}

function SearchableTreeSelect({
  value,
  subjects,
  onChange,
}: {
  value: string;
  subjects: Subject[];
  onChange: (subject: Subject) => void;
}) {
  const [open, setOpen] = useState(false);
  const [keyword, setKeyword] = useState("");
  const selected = subjects.find((item) => item.id === value);
  const filtered = subjects.filter((item) =>
    `${item.code} ${item.name}`.includes(keyword),
  );
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex min-h-10 w-full items-center justify-between rounded border bg-white px-3 text-left text-sm"
      >
        <span className={selected ? "" : "text-slate-400"}>
          {selected ? `${selected.code} ${selected.name}` : "请选择会计科目"}
        </span>
        <ChevronDown size={15} />
      </button>
      {open && (
        <div className="absolute left-0 top-full z-30 mt-1 w-full min-w-72 rounded-lg border bg-white p-2 shadow-xl">
          <Input
            autoFocus
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="输入科目编码或名称"
          />
          <div className="mt-2 max-h-60 overflow-auto">
            {filtered.map((subject) => (
              <button
                type="button"
                key={subject.id}
                onClick={() => {
                  onChange(subject);
                  setOpen(false);
                  setKeyword("");
                }}
                className="block w-full rounded px-3 py-2 text-left text-sm hover:bg-sky-50"
              >
                <span className="mr-2 text-sky-600">{subject.code}</span>
                {subject.name}
                <span className="float-right text-xs text-slate-400">
                  {subject.category}
                </span>
              </button>
            ))}
            {!filtered.length && (
              <p className="p-4 text-center text-sm text-slate-400">
                未找到科目
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function VoucherTable({
  rows,
  subjects,
  categories,
  assistingValues,
  disabled,
  onChange,
}: {
  rows: VoucherDraftRow[];
  subjects: Subject[];
  categories: AssistingCategory[];
  assistingValues: AssistingValue[];
  disabled?: boolean;
  onChange: (rows: VoucherDraftRow[]) => void;
}) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const debitTotal = useMemo(
    () => rows.reduce((sum, row) => sum + Number(row.debitAmount || 0), 0),
    [rows],
  );
  const creditTotal = useMemo(
    () => rows.reduce((sum, row) => sum + Number(row.creditAmount || 0), 0),
    [rows],
  );
  const difference = debitTotal - creditTotal;
  const update = (id: string, patch: Partial<VoucherDraftRow>) =>
    onChange(rows.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  const insert = (index: number) =>
    onChange([
      ...rows.slice(0, index + 1),
      emptyVoucherRow(),
      ...rows.slice(index + 1),
    ]);
  const remove = (ids: string[]) => {
    const next = rows.filter((row) => !ids.includes(row.id));
    onChange(next.length ? next : [emptyVoucherRow()]);
    setSelectedIds([]);
  };
  return (
    <div className="overflow-visible rounded-lg border border-slate-300 bg-white">
      <div className="flex items-center justify-between border-b bg-slate-50 px-4 py-3">
        <div>
          <span className="font-semibold">凭证明细</span>
          <span
            className={`ml-4 text-sm ${Math.abs(difference) < 0.001 ? "text-emerald-600" : "text-red-600"}`}
          >
            {Math.abs(difference) < 0.001
              ? "借贷平衡"
              : `借贷差：${formatMoney(Math.abs(difference))}`}
          </span>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={disabled}
            onClick={() => onChange([...rows, emptyVoucherRow()])}
          >
            <Plus size={15} className="mr-1" />
            新增行
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={disabled || !selectedIds.length}
            onClick={() => remove(selectedIds)}
          >
            <Trash2 size={15} className="mr-1" />
            批量删除
          </Button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1050px] border-collapse text-sm">
          <thead>
            <tr className="bg-[#eff8ff] text-slate-700">
              <th className="w-10 border p-2">
                <input
                  type="checkbox"
                  checked={
                    rows.length > 0 && selectedIds.length === rows.length
                  }
                  onChange={(event) =>
                    setSelectedIds(
                      event.target.checked ? rows.map((row) => row.id) : [],
                    )
                  }
                />
              </th>
              <th className="w-56 border p-2">摘要</th>
              <th className="w-72 border p-2">会计科目</th>
              <th className="w-52 border p-2">辅助核算</th>
              <th className="w-40 border p-2 text-right">借方金额</th>
              <th className="w-40 border p-2 text-right">贷方金额</th>
              <th className="w-24 border p-2">操作</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => {
              const selectedSubject = subjects.find(
                (item) => item.id === row.subjectId,
              );
              return (
                <tr key={row.id} className="align-top hover:bg-emerald-50/40">
                  <td className="border p-3 text-center">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(row.id)}
                      onChange={() =>
                        setSelectedIds(
                          selectedIds.includes(row.id)
                            ? selectedIds.filter((id) => id !== row.id)
                            : [...selectedIds, row.id],
                        )
                      }
                    />
                  </td>
                  <td className="border p-2">
                    <textarea
                      disabled={disabled}
                      value={row.summary}
                      onChange={(event) =>
                        update(row.id, { summary: event.target.value })
                      }
                      className="min-h-10 w-full resize-none rounded border px-2 py-2"
                      placeholder="请输入摘要"
                    />
                  </td>
                  <td className="border p-2">
                    <SearchableTreeSelect
                      value={row.subjectId}
                      subjects={subjects}
                      onChange={(subject) =>
                        update(row.id, {
                          subjectId: subject.id,
                          subjectCode: subject.code,
                          subjectName: subject.name,
                          subjectPath: `${subject.code} ${subject.name}`,
                          balanceDirection: subject.balanceDirection,
                          currencyId: `${subject.accountSetId}-CNY`,
                          assistAccountings: {},
                        })
                      }
                    />
                    {selectedSubject?.unit && (
                      <p className="mt-1 text-xs text-slate-500">
                        计量单位：{selectedSubject.unit}
                      </p>
                    )}
                  </td>
                  <td className="border p-2">
                    {selectedSubject?.assistAccountingIds.length ? (
                      selectedSubject.assistAccountingIds.map((categoryId) => {
                        const category = categories.find(
                          (item) => item.id === categoryId,
                        );
                        return (
                          <label
                            key={categoryId}
                            className="mb-1 block text-xs text-slate-500"
                          >
                            {category?.name ?? "辅助项"}
                            <select
                              disabled={disabled}
                              value={row.assistAccountings[categoryId] ?? ""}
                              onChange={(event) =>
                                update(row.id, {
                                  assistAccountings: {
                                    ...row.assistAccountings,
                                    [categoryId]: event.target.value,
                                  },
                                })
                              }
                              className="mt-1 h-9 w-full rounded border bg-white px-2 text-sm text-slate-800"
                            >
                              <option value="">请选择</option>
                              {assistingValues
                                .filter(
                                  (item) => item.categoryId === categoryId,
                                )
                                .map((item) => (
                                  <option key={item.id} value={item.id}>
                                    {item.code} {item.name}
                                  </option>
                                ))}
                            </select>
                          </label>
                        );
                      })
                    ) : (
                      <span className="inline-block py-2 text-xs text-slate-400">
                        无辅助核算
                      </span>
                    )}
                  </td>
                  <td className="border p-2">
                    <input
                      disabled={disabled}
                      type="number"
                      value={row.debitAmount || ""}
                      onChange={(event) =>
                        update(row.id, {
                          debitAmount: Number(event.target.value),
                          creditAmount: event.target.value
                            ? 0
                            : row.creditAmount,
                        })
                      }
                      className="h-10 w-full rounded border px-3 text-right text-base tabular-nums"
                      placeholder="0.00"
                    />
                  </td>
                  <td className="border p-2">
                    <input
                      disabled={disabled}
                      type="number"
                      value={row.creditAmount || ""}
                      onChange={(event) =>
                        update(row.id, {
                          creditAmount: Number(event.target.value),
                          debitAmount: event.target.value ? 0 : row.debitAmount,
                        })
                      }
                      className="h-10 w-full rounded border px-3 text-right text-base tabular-nums"
                      placeholder="0.00"
                    />
                  </td>
                  <td className="border p-2">
                    <div className="flex justify-center gap-1">
                      <Button
                        title="下方插入"
                        type="button"
                        size="icon"
                        variant="ghost"
                        disabled={disabled}
                        onClick={() => insert(index)}
                      >
                        <CopyPlus size={16} />
                      </Button>
                      <Button
                        title="删除"
                        type="button"
                        size="icon"
                        variant="ghost"
                        disabled={disabled}
                        onClick={() => remove([row.id])}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
            <tr className="bg-slate-50 font-semibold">
              <td className="border p-3" />
              <td className="border p-3" colSpan={3}>
                合计{" "}
                <span className="ml-3 text-xs font-normal text-slate-500">
                  共{" "}
                  {
                    rows.filter(
                      (row) =>
                        row.subjectId ||
                        row.summary ||
                        row.debitAmount ||
                        row.creditAmount,
                    ).length
                  }{" "}
                  条分录
                </span>
              </td>
              <td className="border p-3 text-right">
                <MoneyText value={debitTotal} />
              </td>
              <td className="border p-3 text-right">
                <MoneyText value={creditTotal} />
              </td>
              <td className="border p-3" />
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
