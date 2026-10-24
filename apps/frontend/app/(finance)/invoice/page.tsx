"use client";

import { useEffect, useState } from "react";
import { useFinApp } from "@/lib/finance/auth-context";
import { invoice } from "@/lib/finance/service";
import type { Invoice, InvoiceTab } from "@/lib/finance/types";

const tabs: Array<[InvoiceTab, string]> = [
  ["output", "销项发票"],
  ["input", "进项发票"],
  ["receipt", "费用小票"],
];
const money = (n: number) => n.toFixed(2);

function InvoiceFilters({
  keyword,
  detail,
  onKeywordChange,
  onDetailChange,
  onMessage,
}: {
  keyword: string;
  detail: boolean;
  onKeywordChange: (value: string) => void;
  onDetailChange: (value: boolean) => void;
  onMessage: (message: string) => void;
}) {
  return (
    <div className="rounded-lg border bg-white p-4">
      <div className="flex flex-wrap gap-2">
        <select className="rounded border px-3 py-2 text-sm">
          <option>开票日期</option>
          <option>制单日期</option>
        </select>
        <input
          type="date"
          className="rounded border px-3 py-2 text-sm"
          defaultValue="2026-10-01"
        />
        <span className="py-2">至</span>
        <input
          type="date"
          className="rounded border px-3 py-2 text-sm"
          defaultValue="2026-10-31"
        />
        <input
          value={keyword}
          onChange={(event) => onKeywordChange(event.target.value)}
          className="min-w-40 flex-1 rounded border px-3 py-2 text-sm"
          placeholder="备注/发票号/客户名称"
        />
        <label className="flex items-center gap-2 px-2 text-sm">
          <input
            type="checkbox"
            checked={detail}
            onChange={(event) => onDetailChange(event.target.checked)}
          />
          显示发票明细
        </label>
        <button
          className="rounded bg-sky-600 px-4 py-2 text-sm text-white"
          onClick={() => onMessage("已模拟从税局同步 3 张发票")}
        >
          获取发票原件
        </button>
        <button
          className="rounded border px-4 py-2 text-sm"
          onClick={() => onMessage("导入成功（模拟）")}
        >
          导入
        </button>
        <button
          className="rounded border px-4 py-2 text-sm"
          onClick={() => onMessage("查验结果：发票状态正常，真伪校验通过")}
        >
          查验
        </button>
        <button
          className="rounded border px-4 py-2 text-sm"
          onClick={() => onMessage("导出任务已生成")}
        >
          导出
        </button>
      </div>
    </div>
  );
}

function InvoiceTable({
  rows,
  tab,
  currentUserId,
  onMessage,
  onDelete,
  onGenerateVoucher,
}: {
  rows: Invoice[];
  tab: InvoiceTab;
  currentUserId?: string;
  onMessage: (message: string) => void;
  onDelete: (row: Invoice) => void;
  onGenerateVoucher: (row: Invoice) => void;
}) {
  const total = rows.reduce(
    (sum, row) => ({
      amount: sum.amount + row.amount,
      tax: sum.tax + row.tax,
      total: sum.total + row.total,
    }),
    { amount: 0, tax: 0, total: 0 },
  );
  return (
    <div className="overflow-x-auto rounded-lg border bg-white">
      <table className="min-w-[1100px] w-full text-left text-sm">
        <thead className="bg-slate-50 text-slate-600">
          <tr>
            {[
              "操作",
              "发票日期",
              "发票类型",
              "发票代码/号码",
              "数电发票号码",
              "客户/供应商",
              "金额",
              "税额",
              "价税合计",
              "状态",
              tab === "input" ? "认证状态" : "凭证号",
            ].map((heading) => (
              <th key={heading} className="px-3 py-3">
                {heading}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-t hover:bg-slate-50">
              <td className="px-3 py-3">
                <button
                  className="text-sky-600"
                  onClick={() => onMessage("编辑功能已打开（原型）")}
                >
                  编辑
                </button>
                <button
                  className="ml-2 text-red-600"
                  onClick={() => onDelete(row)}
                >
                  删除
                </button>
              </td>
              <td className="px-3 py-3">{row.date}</td>
              <td className="px-3 py-3">{row.type}</td>
              <td className="px-3 py-3">
                {row.code || "-"} {row.number}
              </td>
              <td className="px-3 py-3">
                <button
                  className="text-sky-600 hover:underline"
                  onClick={() =>
                    onMessage(`发票详情：${row.digitalNumber ?? row.number}`)
                  }
                >
                  {row.digitalNumber ?? "-"}
                </button>
              </td>
              <td className="px-3 py-3">{row.partner}</td>
              <td className="px-3 py-3 text-right">{money(row.amount)}</td>
              <td className="px-3 py-3 text-right">{money(row.tax)}</td>
              <td className="px-3 py-3 text-right font-medium">
                {money(row.total)}
              </td>
              <td className="px-3 py-3">{row.status}</td>
              <td className="px-3 py-3">
                {tab === "input" ? (
                  `${row.certification ?? "未勾选"}${row.certificationPeriod ? ` (${row.certificationPeriod})` : ""}`
                ) : row.voucherId ? (
                  <span className="text-sky-600">已生成</span>
                ) : (
                  <button
                    className="text-sky-600"
                    onClick={() => onGenerateVoucher(row)}
                  >
                    生成凭证
                  </button>
                )}
              </td>
            </tr>
          ))}
          <tr className="border-t bg-slate-50 font-medium">
            <td colSpan={6} className="px-3 py-3">
              合计（共 {rows.length} 张）
            </td>
            <td className="px-3 py-3 text-right">{money(total.amount)}</td>
            <td className="px-3 py-3 text-right">{money(total.tax)}</td>
            <td className="px-3 py-3 text-right">{money(total.total)}</td>
            <td colSpan={2} />
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function InvoiceDetails({ rows }: { rows: Invoice[] }) {
  return (
    <div className="rounded-lg border bg-white p-4 text-sm">
      <h2 className="font-medium">发票明细校验</h2>
      {rows.map((row) => (
        <div key={row.id} className="mt-2 border-b pb-2">
          {row.lines.map((line) => (
            <span key={line.name} className="mr-5">
              {line.name}：{line.quantity} × {line.price.toFixed(2)} ={" "}
              {line.amount.toFixed(2)}；税额 {line.tax.toFixed(2)}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}

export default function InvoicePage() {
  const { currentAccountSet, currentUser } = useFinApp();
  const [tab, setTab] = useState<InvoiceTab>("output");
  const [rows, setRows] = useState<Invoice[]>([]);
  const [keyword, setKeyword] = useState("");
  const [detail, setDetail] = useState(false);
  const [message, setMessage] = useState("");

  const load = () =>
    currentAccountSet &&
    invoice.list(currentAccountSet.id, tab, keyword).then(setRows);
  useEffect(() => {
    void load();
  }, [currentAccountSet, tab, keyword]);

  const handleDelete = async (row: Invoice) => {
    try {
      await invoice.delete(row.id);
      setMessage("删除成功");
      void load();
    } catch (error) {
      setMessage((error as Error).message);
    }
  };

  const handleGenerateVoucher = async (row: Invoice) => {
    try {
      await invoice.generateVoucher(row.id, currentUser?.id ?? "u1");
      setMessage("凭证生成成功");
      void load();
    } catch (error) {
      setMessage((error as Error).message);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">发票管理</h1>
        <p className="mt-1 text-sm text-slate-500">
          数电发票、增值税发票和费用小票统一管理
        </p>
      </div>
      <div className="flex gap-1 overflow-x-auto rounded-lg border bg-white p-1">
        {tabs.map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`whitespace-nowrap rounded-md px-4 py-2 text-sm ${tab === key ? "bg-sky-500 text-white" : "hover:bg-slate-100"}`}
          >
            {label}
          </button>
        ))}
      </div>
      {message && (
        <div className="rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {message}
        </div>
      )}
      <InvoiceFilters
        keyword={keyword}
        detail={detail}
        onKeywordChange={setKeyword}
        onDetailChange={setDetail}
        onMessage={setMessage}
      />
      <InvoiceTable
        rows={rows}
        tab={tab}
        currentUserId={currentUser?.id}
        onMessage={setMessage}
        onDelete={handleDelete}
        onGenerateVoucher={handleGenerateVoucher}
      />
      {detail && <InvoiceDetails rows={rows} />}
    </div>
  );
}
