"use client";
import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/finance/ConfirmDialog";
import { MoneyText } from "@/components/finance/MoneyText";
import { PageHeader } from "@/components/finance/PageHeader";
import { useFinApp } from "@/lib/finance/auth-context";
import { asset } from "@/lib/finance/service";
import type { DepreciationVoucherItem } from "@/lib/finance/types";

const statusText = {
  draft: "草稿",
  audited: "已审核",
  posted: "已记账",
  void: "已作废",
} as const;
const periodSelect = (
  value: number,
  values: number[],
  onChange: (value: number) => void,
) => (
  <select
    value={value}
    onChange={(event) => onChange(Number(event.target.value))}
    className="rounded-md border px-3 py-2 text-sm"
  >
    {values.map((item) => (
      <option key={item} value={item}>
        {item}
        {values.length === 12 ? "期" : "年"}
      </option>
    ))}
  </select>
);

export default function DepreciationVouchersPage() {
  const { currentAccountSet, currentPeriod } = useFinApp();
  const [year, setYear] = useState(currentPeriod.year);
  const [month, setMonth] = useState(currentPeriod.month);
  const [preview, setPreview] = useState<Awaited<
    ReturnType<typeof asset.depreciation.preview>
  > | null>(null);
  const [rows, setRows] = useState<DepreciationVoucherItem[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [confirm, setConfirm] = useState<{
    year: number;
    month: number;
  } | null>(null);
  const load = useCallback(async () => {
    if (!currentAccountSet) return;
    setPreview(
      await asset.depreciation.preview(currentAccountSet.id, year, month),
    );
    setRows(asset.depreciation.vouchers(currentAccountSet.id));
  }, [currentAccountSet, month, year]);
  useEffect(() => {
    void load();
  }, [load]);
  const remove = async (periodYear: number, periodMonth: number) => {
    if (!currentAccountSet) return;
    await asset.deleteDepreciationVoucher(
      currentAccountSet.id,
      periodYear,
      periodMonth,
    );
    setConfirm(null);
    setMessage("已删除折旧凭证");
    await load();
  };
  const generate = async () => {
    if (!currentAccountSet) return;
    setError("");
    try {
      await asset.generateDepreciationVoucher(
        currentAccountSet.id,
        year,
        month,
      );
      setMessage("已生成折旧凭证");
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "生成失败");
    }
  };
  return (
    <div className="space-y-5">
      <PageHeader
        title="折旧凭证"
        subtitle="预览、生成和管理固定资产折旧凭证"
        actions={
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => void generate()}>生成凭证</Button>
            <Button
              variant="outline"
              onClick={() => setConfirm({ year, month })}
            >
              删除凭证
            </Button>
          </div>
        }
      />
      <div className="flex flex-wrap items-center gap-2 rounded-xl border bg-white p-4">
        <span className="text-sm text-slate-600">期间</span>
        {periodSelect(
          year,
          Array.from({ length: 5 }, (_, i) => currentPeriod.year - i),
          setYear,
        )}
        {periodSelect(
          month,
          Array.from({ length: 12 }, (_, i) => i + 1),
          setMonth,
        )}
      </div>
      {message && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {message}
        </div>
      )}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      <section>
        <h2 className="mb-3 text-lg font-semibold">本期计提折旧预览</h2>
        <div className="overflow-x-auto rounded-xl border bg-white">
          <table className="w-full min-w-[1000px] text-sm">
            <thead className="bg-slate-50">
              <tr>
                {[
                  "编码",
                  "名称",
                  "类别",
                  "部门",
                  "原值",
                  "期初累计折旧",
                  "本期折旧",
                  "期末累计折旧",
                  "期末净值",
                ].map((x) => (
                  <th key={x} className="p-3 text-left">
                    {x}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {preview?.cardRows.map((row) => (
                <tr key={row.id} className="border-t">
                  <td className="p-3">{row.code}</td>
                  <td className="p-3">{row.name}</td>
                  <td className="p-3">{row.categoryCode}</td>
                  <td className="p-3">{row.department}</td>
                  {[
                    row.originalValue,
                    row.openingAccumulatedDepreciation,
                    row.currentDepreciation,
                    row.endingAccumulatedDepreciation,
                    row.netValue,
                  ].map((value, i) => (
                    <td key={i} className="p-3 text-right">
                      <MoneyText value={value} />
                    </td>
                  ))}
                </tr>
              ))}
              {!preview?.cardRows.length && (
                <tr>
                  <td colSpan={9} className="p-12 text-center text-slate-400">
                    暂无数据
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-sm text-slate-500">
          共 {preview?.cardRows.length ?? 0} 张卡片
        </p>
      </section>
      <section>
        <h2 className="mb-3 text-lg font-semibold">
          凭证预览（按部门/费用科目汇总）
        </h2>
        <div className="overflow-x-auto rounded-xl border bg-white">
          <table className="w-full min-w-[700px] text-sm">
            <thead className="bg-slate-50">
              <tr>
                {["摘要", "科目编码", "科目名称", "借方金额", "贷方金额"].map(
                  (x) => (
                    <th key={x} className="p-3 text-left">
                      {x}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {preview?.voucherLines.map((line) => (
                <tr key={line.id} className="border-t">
                  <td className="p-3">{line.summary}</td>
                  <td className="p-3">{line.subjectCode}</td>
                  <td className="p-3">{line.subjectName}</td>
                  <td className="p-3 text-right">
                    <MoneyText value={line.debitAmount} />
                  </td>
                  <td className="p-3 text-right">
                    <MoneyText value={line.creditAmount} />
                  </td>
                </tr>
              ))}
              <tr className="border-t bg-slate-50 font-semibold">
                <td colSpan={3} className="p-3">
                  合计{" "}
                  <span
                    className={
                      preview?.balanced
                        ? "ml-2 text-emerald-600"
                        : "ml-2 text-red-600"
                    }
                  >
                    {preview?.balanced ? "借贷平衡" : "借贷不平"}
                  </span>
                </td>
                <td className="p-3 text-right">
                  <MoneyText value={preview?.debitTotal ?? 0} />
                </td>
                <td className="p-3 text-right">
                  <MoneyText value={preview?.creditTotal ?? 0} />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-sm text-slate-500">
          借 管理费用/销售费用-折旧，贷 累计折旧（1602）
        </p>
      </section>
      <section>
        <h2 className="mb-3 text-lg font-semibold">已生成凭证列表</h2>
        <div className="overflow-x-auto rounded-xl border bg-white">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="bg-slate-50">
              <tr>
                {[
                  "凭证字号",
                  "期间",
                  "日期",
                  "摘要",
                  "借方金额",
                  "贷方金额",
                  "状态",
                  "操作",
                ].map((x) => (
                  <th key={x} className="p-3 text-left">
                    {x}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-t">
                  <td className="p-3">{row.voucherWordLabel}</td>
                  <td className="p-3">
                    {row.year}年第{row.month}期
                  </td>
                  <td className="p-3">{row.date}</td>
                  <td className="p-3">{row.summary}</td>
                  <td className="p-3 text-right">
                    <MoneyText value={row.debitTotal} />
                  </td>
                  <td className="p-3 text-right">
                    <MoneyText value={row.creditTotal} />
                  </td>
                  <td className="p-3">
                    <Badge
                      variant={
                        row.status === "audited"
                          ? "default"
                          : row.status === "void"
                            ? "destructive"
                            : "secondary"
                      }
                    >
                      {statusText[row.status]}
                    </Badge>
                  </td>
                  <td className="p-3">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        setConfirm({ year: row.year, month: row.month })
                      }
                    >
                      删除
                    </Button>
                  </td>
                </tr>
              ))}
              {!rows.length && (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-slate-400">
                    暂无数据
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
      <ConfirmDialog
        open={!!confirm}
        destructive
        description={`将删除期间 ${confirm?.year}-${String(confirm?.month).padStart(2, "0")} 的折旧凭证，确定？`}
        onClose={() => setConfirm(null)}
        onConfirm={() => confirm && void remove(confirm.year, confirm.month)}
      />
    </div>
  );
}
