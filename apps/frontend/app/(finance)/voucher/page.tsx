"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  Copy,
  FileDown,
  FilePlus2,
  Printer,
  Search,
  ShieldCheck,
  ShieldOff,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/finance/ConfirmDialog";
import { FinTable, type FinColumn } from "@/components/finance/FinTable";
import { MoneyText } from "@/components/finance/MoneyText";
import { useFinApp } from "@/lib/finance/auth-context";
import { voucher, voucherWord } from "@/lib/finance/service";
import type {
  PageResult,
  Voucher,
  VoucherStatus,
  VoucherWord,
} from "@/lib/finance/types";

const statusText: Record<VoucherStatus, string> = {
  draft: "待审核",
  audited: "已审核",
  posted: "已记账",
  void: "已作废",
};

type ConfirmAction = { ids: string[]; action: "delete" | "audit" | "cancel" };

function FilterBar({
  filters,
  currentYear,
  words,
  onChange,
  onQuery,
}: {
  filters: {
    year: number;
    month: number;
    wordId: string;
    keyword: string;
    status: VoucherStatus | "all";
    page: number;
  };
  currentYear: number;
  words: VoucherWord[];
  onChange: (filters: {
    year: number;
    month: number;
    wordId: string;
    keyword: string;
    status: VoucherStatus | "all";
    page: number;
  }) => void;
  onQuery: () => void;
}) {
  return (
    <div className="rounded-lg border bg-white p-4">
      <div className="grid gap-3 md:grid-cols-6">
        <select
          value={filters.year}
          onChange={(event) =>
            onChange({ ...filters, year: Number(event.target.value), page: 1 })
          }
          className="rounded-md border px-3 text-sm"
        >
          {Array.from({ length: 5 }, (_, index) => currentYear - index).map(
            (year) => (
              <option key={year}>{year}年</option>
            ),
          )}
        </select>
        <select
          value={filters.month}
          onChange={(event) =>
            onChange({ ...filters, month: Number(event.target.value), page: 1 })
          }
          className="rounded-md border px-3 text-sm"
        >
          {Array.from({ length: 12 }, (_, index) => index + 1).map((month) => (
            <option key={month} value={month}>
              第{month}期
            </option>
          ))}
        </select>
        <select
          value={filters.wordId}
          onChange={(event) =>
            onChange({ ...filters, wordId: event.target.value, page: 1 })
          }
          className="rounded-md border px-3 text-sm"
        >
          <option value="">全部凭证字</option>
          {words.map((word) => (
            <option key={word.id} value={word.id}>
              {word.word}
            </option>
          ))}
        </select>
        <select
          value={filters.status}
          onChange={(event) =>
            onChange({
              ...filters,
              status: event.target.value as VoucherStatus | "all",
              page: 1,
            })
          }
          className="rounded-md border px-3 text-sm"
        >
          <option value="all">全部状态</option>
          {Object.entries(statusText).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <Input
          value={filters.keyword}
          onChange={(event) =>
            onChange({ ...filters, keyword: event.target.value })
          }
          placeholder="摘要、科目或凭证号"
        />
        <Button variant="outline" onClick={onQuery}>
          <Search size={16} className="mr-2" />
          查询
        </Button>
      </div>
    </div>
  );
}

function BatchActionBar({
  selected,
  onConfirm,
  onPrint,
  onExport,
}: {
  selected: string[];
  onConfirm: (action: ConfirmAction["action"]) => void;
  onPrint: () => void;
  onExport: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        variant="outline"
        disabled={!selected.length}
        onClick={() => onConfirm("audit")}
      >
        <ShieldCheck size={16} className="mr-2" />
        批量审核
      </Button>
      <Button
        variant="outline"
        disabled={!selected.length}
        onClick={() => onConfirm("cancel")}
      >
        <ShieldOff size={16} className="mr-2" />
        反审核
      </Button>
      <Button
        variant="outline"
        disabled={!selected.length}
        onClick={() => onConfirm("delete")}
      >
        <Trash2 size={16} className="mr-2" />
        批量删除
      </Button>
      <Button variant="outline" onClick={onPrint}>
        <Printer size={16} className="mr-2" />
        打印
      </Button>
      <Button variant="outline" onClick={onExport}>
        <FileDown size={16} className="mr-2" />
        导出
      </Button>
      <span className="ml-auto text-sm text-slate-500">
        已选择 {selected.length} 项
      </span>
    </div>
  );
}

export default function VoucherListPage() {
  const { currentAccountSet, currentPeriod, currentUser } = useFinApp();
  const [result, setResult] = useState<PageResult<Voucher>>({
    content: [],
    page: 1,
    size: 10,
    total: 0,
    totalPages: 0,
  });
  const [words, setWords] = useState<VoucherWord[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [confirm, setConfirm] = useState<ConfirmAction | null>(null);
  const [filters, setFilters] = useState({
    year: currentPeriod.year,
    month: currentPeriod.month,
    wordId: "",
    keyword: "",
    status: "all" as VoucherStatus | "all",
    page: 1,
  });

  const load = useCallback(async () => {
    if (!currentAccountSet) return;
    setLoading(true);
    const data = await voucher.page({
      accountSetId: currentAccountSet.id,
      periodYear: filters.year,
      periodMonth: filters.month,
      wordId: filters.wordId || undefined,
      keyword: filters.keyword,
      status: filters.status,
      page: filters.page,
      size: 8,
    });
    setResult(data);
    setSelected([]);
    setLoading(false);
  }, [currentAccountSet, filters]);

  useEffect(() => {
    if (currentAccountSet)
      voucherWord.list(currentAccountSet.id).then(setWords);
  }, [currentAccountSet]);

  useEffect(() => {
    void load();
  }, [load]);

  const runAction = async () => {
    if (!confirm || !currentUser) return;
    if (confirm.action === "delete") await voucher.batchDelete(confirm.ids);
    if (confirm.action === "audit")
      await voucher.audit(confirm.ids, currentUser.id);
    if (confirm.action === "cancel") await voucher.cancelAudit(confirm.ids);
    setMessage(
      confirm.action === "delete"
        ? "删除成功"
        : confirm.action === "audit"
          ? "审核成功"
          : "取消审核成功",
    );
    setConfirm(null);
    await load();
  };

  const handleCopy = async (item: Voucher) => {
    const copied = await voucher.copy(item.id);
    setMessage(`已复制为 ${copied.word}-${copied.number}`);
    await load();
  };

  const handleVoid = async (item: Voucher) => {
    await voucher.void(item.id);
    await load();
  };

  const columns: FinColumn<Voucher>[] = [
    {
      key: "voucher",
      title: "凭证字号",
      render: (item) => (
        <Link
          className="font-medium text-sky-600 hover:underline"
          href={`/voucher/form/${item.id}`}
        >
          {item.word}-{item.number}
        </Link>
      ),
    },
    { key: "date", title: "日期", render: (item) => item.date },
    {
      key: "summary",
      title: "摘要 / 科目",
      render: (item) => (
        <div className="max-w-sm">
          <p className="truncate font-medium">{item.details[0]?.summary}</p>
          <p className="truncate text-xs text-slate-500">
            {item.details
              .map((detail) => `${detail.subjectCode} ${detail.subjectName}`)
              .join("；")}
          </p>
        </div>
      ),
    },
    {
      key: "debit",
      title: <span className="block text-right">借方金额</span>,
      className: "text-right",
      render: (item) => (
        <MoneyText
          value={item.details.reduce(
            (sum, detail) => sum + detail.debitAmount,
            0,
          )}
        />
      ),
    },
    {
      key: "status",
      title: "状态",
      render: (item) => (
        <Badge
          variant={
            item.status === "audited"
              ? "default"
              : item.status === "void"
                ? "destructive"
                : "secondary"
          }
        >
          {statusText[item.status]}
        </Badge>
      ),
    },
    {
      key: "actions",
      title: "操作",
      render: (item) => (
        <div className="flex flex-wrap gap-1">
          <Button asChild size="sm" variant="ghost">
            <Link href={`/voucher/form/${item.id}`}>
              {item.status === "draft" ? "编辑" : "查看"}
            </Link>
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => void handleCopy(item)}
          >
            <Copy size={14} />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            disabled={item.status === "posted"}
            onClick={() => setConfirm({ ids: [item.id], action: "delete" })}
          >
            <Trash2 size={14} />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            disabled={item.status === "posted" || item.status === "void"}
            onClick={() => void handleVoid(item)}
          >
            作废
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">凭证列表</h1>
          <p className="mt-1 text-sm text-slate-500">
            查看、审核和管理当前账套凭证
          </p>
        </div>
        <Button asChild>
          <Link href="/voucher/form">
            <FilePlus2 size={17} className="mr-2" />
            新增凭证
          </Link>
        </Button>
      </div>
      {message && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {message}
        </div>
      )}
      <FilterBar
        filters={filters}
        currentYear={currentPeriod.year}
        words={words}
        onChange={setFilters}
        onQuery={() => setFilters({ ...filters, page: 1 })}
      />
      <BatchActionBar
        selected={selected}
        onConfirm={(action) => setConfirm({ ids: selected, action })}
        onPrint={() => window.print()}
        onExport={() => setMessage("导出任务已生成（模拟）")}
      />
      <FinTable
        columns={columns}
        data={result.content}
        loading={loading}
        selectedIds={selected}
        onSelectionChange={setSelected}
        page={result.page}
        totalPages={result.totalPages}
        total={result.total}
        onPageChange={(page) => setFilters({ ...filters, page })}
      />
      <ConfirmDialog
        open={!!confirm}
        destructive={confirm?.action === "delete"}
        title={
          confirm?.action === "audit"
            ? "审核凭证"
            : confirm?.action === "cancel"
              ? "取消审核"
              : "删除凭证"
        }
        description={`确认对已选择的 ${confirm?.ids.length ?? 0} 张凭证执行此操作吗？`}
        onClose={() => setConfirm(null)}
        onConfirm={() => void runAction()}
      />
    </div>
  );
}
