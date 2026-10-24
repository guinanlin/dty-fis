"use client";

import { useCallback, useEffect, useState } from "react";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/finance/ConfirmDialog";
import { useFinApp } from "@/lib/finance/auth-context";
import { checkout } from "@/lib/finance/service";
import type { AccountSetPeriod } from "@/lib/finance/types";

function ClosedPeriod({
  period,
  onSelect,
}: {
  period: AccountSetPeriod;
  onSelect: (period: AccountSetPeriod) => void;
}) {
  return (
    <button
      key={period.id}
      onClick={() => onSelect(period)}
      className="rounded-lg border border-slate-300 p-4 text-left transition hover:border-sky-400 hover:shadow"
    >
      <RotateCcw className="mb-3 text-slate-500" size={20} />
      <p className="text-lg font-semibold">
        {period.year}年{period.month}月
      </p>
      <p className="mt-1 text-xs text-slate-500">点击执行反结账</p>
    </button>
  );
}

export default function UnCheckOutPage() {
  const { currentAccountSet } = useFinApp();
  const [periods, setPeriods] = useState<AccountSetPeriod[]>([]);
  const [selected, setSelected] = useState<AccountSetPeriod | null>(null);

  const load = useCallback(() => {
    if (currentAccountSet)
      checkout
        .list(currentAccountSet.id)
        .then((rows) =>
          setPeriods(rows.filter((item) => item.status === "closed")),
        );
  }, [currentAccountSet]);

  useEffect(load, [load]);

  const handleUnCheck = async () => {
    if (!currentAccountSet || !selected) return;
    await checkout.unCheck(currentAccountSet.id, selected.year, selected.month);
    setSelected(null);
    load();
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">反结账</h1>
        <p className="mt-1 text-sm text-slate-500">
          将已结账期间恢复为未结账状态
        </p>
      </div>
      <div className="rounded-xl border bg-white p-5">
        {periods.length ? (
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {periods.map((period) => (
              <ClosedPeriod
                key={period.id}
                period={period}
                onSelect={setSelected}
              />
            ))}
          </div>
        ) : (
          <div className="p-12 text-center text-slate-400">
            亲，目前没有已结账的期间！
          </div>
        )}
      </div>
      <Button variant="outline" onClick={() => history.back()}>
        返回
      </Button>
      <ConfirmDialog
        open={!!selected}
        title="反结账操作"
        description={`确定对 ${selected?.year}年第${selected?.month}期进行反结账吗？`}
        confirmText="确认反结账"
        onClose={() => setSelected(null)}
        onConfirm={handleUnCheck}
      />
    </div>
  );
}
