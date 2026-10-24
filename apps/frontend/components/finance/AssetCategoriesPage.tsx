"use client";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/finance/ConfirmDialog";
import { FormDialog } from "@/components/finance/FormDialog";
import { PageHeader } from "@/components/finance/PageHeader";
import { useFinApp } from "@/lib/finance/auth-context";
import { asset } from "@/lib/finance/service";
import type {
  AssetCategory,
  AssetDepreciationMethod,
} from "@/lib/finance/types";
const methodText: Record<AssetDepreciationMethod, string> = {
  average: "平均年限法",
  workload: "工作量法",
  "double-declining": "双倍余额递减法",
  "sum-of-years": "年数总和法",
};
const blank = (accountSetId: string): AssetCategory => ({
  id: `asset-cat-${Date.now()}`,
  accountSetId,
  code: "",
  name: "",
  depreciationMethod: "average",
  usefulLifeMonths: 60,
  residualRate: 5,
  fixedAssetSubjectCode: "1601",
  accumulatedDepreciationSubjectCode: "1602",
  remark: "",
});
export default function AssetCategoriesPage() {
  const { currentAccountSet } = useFinApp();
  const [rows, setRows] = useState<AssetCategory[]>([]);
  const [form, setForm] = useState<AssetCategory | null>(null);
  const [removing, setRemoving] = useState<AssetCategory | null>(null);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    if (currentAccountSet)
      setRows(await asset.categories.list(currentAccountSet.id));
  }, [currentAccountSet]);
  useEffect(() => {
    void load();
  }, [load]);
  const save = async () => {
    if (!form || !form.name) return;
    await asset.categories.save(form);
    setForm(null);
    await load();
  };
  return (
    <div className="space-y-5">
      <PageHeader
        title="资产类别"
        subtitle="维护固定资产类别及折旧参数"
        actions={
          <Button
            onClick={() =>
              currentAccountSet && setForm(blank(currentAccountSet.id))
            }
          >
            新增
          </Button>
        }
      />
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      <div className="overflow-x-auto rounded-xl border bg-white">
        <table className="w-full min-w-[1100px] text-sm">
          <thead className="bg-slate-50">
            <tr>
              {[
                "编码",
                "名称",
                "折旧方法",
                "使用年限(月)",
                "残值率(%)",
                "固定资产科目",
                "累计折旧科目",
                "备注",
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
                <td className="p-3">{row.code}</td>
                <td className="p-3">{row.name}</td>
                <td className="p-3">{methodText[row.depreciationMethod]}</td>
                <td className="p-3">{row.usefulLifeMonths}</td>
                <td className="p-3">{row.residualRate}</td>
                <td className="p-3">{row.fixedAssetSubjectCode}</td>
                <td className="p-3">
                  {row.accumulatedDepreciationSubjectCode}
                </td>
                <td className="p-3">{row.remark || "—"}</td>
                <td className="flex gap-2 p-3">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setForm({ ...row })}
                  >
                    编辑
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => setRemoving(row)}
                  >
                    删除
                  </Button>
                </td>
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td colSpan={9} className="p-12 text-center text-slate-400">
                  暂无数据
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <FormDialog
        open={!!form}
        title="资产类别"
        onClose={() => setForm(null)}
        onSubmit={() => void save()}
      >
        {form && (
          <div className="grid gap-4 md:grid-cols-2">
            <label>
              编码
              <input
                required
                className="mt-1 w-full rounded border px-3 py-2"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
              />
            </label>
            <label>
              名称
              <input
                required
                className="mt-1 w-full rounded border px-3 py-2"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </label>
            <label>
              折旧方法
              <select
                className="mt-1 w-full rounded border px-3 py-2"
                value={form.depreciationMethod}
                onChange={(e) =>
                  setForm({
                    ...form,
                    depreciationMethod: e.target
                      .value as AssetDepreciationMethod,
                  })
                }
              >
                {Object.entries(methodText).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              使用年限(月)
              <input
                type="number"
                className="mt-1 w-full rounded border px-3 py-2"
                value={form.usefulLifeMonths}
                onChange={(e) =>
                  setForm({ ...form, usefulLifeMonths: Number(e.target.value) })
                }
              />
            </label>
            <label>
              残值率(%)
              <input
                type="number"
                className="mt-1 w-full rounded border px-3 py-2"
                value={form.residualRate}
                onChange={(e) =>
                  setForm({ ...form, residualRate: Number(e.target.value) })
                }
              />
            </label>
            <label>
              固定资产科目
              <input
                className="mt-1 w-full rounded border px-3 py-2"
                value={form.fixedAssetSubjectCode}
                onChange={(e) =>
                  setForm({ ...form, fixedAssetSubjectCode: e.target.value })
                }
              />
            </label>
            <label>
              累计折旧科目
              <input
                className="mt-1 w-full rounded border px-3 py-2"
                value={form.accumulatedDepreciationSubjectCode}
                onChange={(e) =>
                  setForm({
                    ...form,
                    accumulatedDepreciationSubjectCode: e.target.value,
                  })
                }
              />
            </label>
            <label className="md:col-span-2">
              备注
              <textarea
                className="mt-1 w-full rounded border px-3 py-2"
                value={form.remark || ""}
                onChange={(e) => setForm({ ...form, remark: e.target.value })}
              />
            </label>
          </div>
        )}
      </FormDialog>
      <ConfirmDialog
        open={!!removing}
        destructive
        description={`确认删除类别 ${removing?.name}？`}
        onClose={() => setRemoving(null)}
        onConfirm={async () => {
          if (!removing) return;
          try {
            await asset.categories.delete(removing.id);
            setRemoving(null);
            await load();
          } catch (cause) {
            setError(cause instanceof Error ? cause.message : "删除失败");
            setRemoving(null);
          }
        }}
      />
    </div>
  );
}
