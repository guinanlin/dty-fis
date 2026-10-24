"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useFinApp } from "@/lib/finance/auth-context";
import { asset } from "@/lib/finance/service";
import type { AssetCard, AssetChangeRecord } from "@/lib/finance/types";
import DepreciationVouchersPage from "@/components/finance/DepreciationVouchersPage";
import DepreciationDetailPage from "@/components/finance/DepreciationDetailPage";
import DepreciationSummaryPage from "@/components/finance/DepreciationSummaryPage";
import AssetCategoriesPage from "@/components/finance/AssetCategoriesPage";

export default function AssetPage({
  mode,
}: {
  mode: "cards" | "vouchers" | "detail" | "summary" | "changes" | "categories";
}) {
  if (mode === "vouchers") return <DepreciationVouchersPage />;
  if (mode === "detail") return <DepreciationDetailPage />;
  if (mode === "summary") return <DepreciationSummaryPage />;
  if (mode === "categories") return <AssetCategoriesPage />;
  return <AssetCardsView mode={mode} />;
}

function AssetCardsView({ mode }: { mode: "cards" | "changes" }) {
  const { currentAccountSet, currentPeriod } = useFinApp();
  const [rows, setRows] = useState<Array<AssetCard | AssetChangeRecord>>([]);
  const [message, setMessage] = useState("");
  useEffect(() => {
    if (!currentAccountSet) return;
    if (mode === "changes")
      asset.changes.list(currentAccountSet.id).then(setRows);
    else
      asset
        .report(currentAccountSet.id, currentPeriod.year, currentPeriod.month)
        .then(setRows);
  }, [currentAccountSet, currentPeriod, mode]);
  const title = {
    cards: "资产卡片",
    vouchers: "折旧凭证",
    detail: "折旧明细表",
    summary: "折旧汇总表",
    changes: "资产变动记录",
    categories: "资产类别",
  }[mode];
  const cards = rows as Array<AssetCard & { currentDepreciation: number }>;
  const changes = rows as AssetChangeRecord[];
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{title}</h1>
          <p className="mt-1 text-sm text-slate-500">
            固定资产全生命周期管理（Mock 数据）
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setMessage("操作已完成（原型提示）")}>
            新增
          </Button>
          <Button
            variant="outline"
            onClick={() => setMessage("导出任务已生成（模拟）")}
          >
            导出
          </Button>
        </div>
      </div>
      {message && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {message}
        </div>
      )}
      <div className="rounded-lg border bg-white p-4">
        <div className="mb-4 flex flex-wrap gap-3">
          <input
            className="rounded-md border px-3 py-2 text-sm"
            placeholder="编码、名称关键字"
          />
          <select className="rounded-md border px-3 py-2 text-sm">
            <option>全部部门</option>
            <option>运输部</option>
            <option>财务部</option>
            <option>仓储部</option>
          </select>
          <Button variant="outline">查询</Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                {(mode === "changes"
                  ? [
                      "资产编码",
                      "名称",
                      "变动项",
                      "变动前",
                      "变动后",
                      "期间",
                      "修改人",
                    ]
                  : [
                      "编码",
                      "名称",
                      "类别",
                      "部门",
                      "原值",
                      "期初累计折旧",
                      "本期折旧",
                      "期末累计折旧",
                      "期末净值",
                      "状态",
                    ]
                ).map((x) => (
                  <th key={x} className="px-3 py-3">
                    {x}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {mode === "changes"
                ? changes.map((x) => (
                    <tr key={x.id} className="border-t">
                      <td className="px-3 py-3">{x.assetCode}</td>
                      <td className="px-3 py-3">{x.assetName}</td>
                      <td className="px-3 py-3">{x.changeItem}</td>
                      <td className="px-3 py-3">{x.beforeValue}</td>
                      <td className="px-3 py-3">{x.afterValue}</td>
                      <td className="px-3 py-3">{x.period}</td>
                      <td className="px-3 py-3">{x.modifier}</td>
                    </tr>
                  ))
                : cards.map((x) => (
                    <tr key={x.id} className="border-t">
                      <td className="px-3 py-3 font-medium text-sky-700">
                        {x.code}
                      </td>
                      <td className="px-3 py-3">{x.name}</td>
                      <td className="px-3 py-3">{x.categoryCode}</td>
                      <td className="px-3 py-3">{x.department}</td>
                      <td className="px-3 py-3 text-right">
                        {x.originalValue.toFixed(2)}
                      </td>
                      <td className="px-3 py-3 text-right">
                        {x.openingAccumulatedDepreciation.toFixed(2)}
                      </td>
                      <td className="px-3 py-3 text-right">
                        {x.currentDepreciation.toFixed(2)}
                      </td>
                      <td className="px-3 py-3 text-right">
                        {x.endingAccumulatedDepreciation.toFixed(2)}
                      </td>
                      <td className="px-3 py-3 text-right">
                        {x.netValue.toFixed(2)}
                      </td>
                      <td className="px-3 py-3">{x.status}</td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 text-sm text-slate-500">
          共 {rows.length} 条记录 · 期末累计折旧 = 期初累计折旧 + 本期折旧 ·
          净值 = 原值 - 期末累计折旧 - 减值准备
        </div>
      </div>
    </div>
  );
}
