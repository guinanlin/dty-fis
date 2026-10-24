"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FilePlus2, Landmark, ReceiptText } from "lucide-react";
import { RevenueProfitChart } from "@/components/finance/charts";
import { useFinApp } from "@/lib/finance/auth-context";
import { home } from "@/lib/finance/service";
import type { HomeDashboard } from "@/lib/finance/types";

const money = (value: number) =>
  new Intl.NumberFormat("zh-CN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

function MoneySummaryCard({
  title,
  icon: Icon,
  items,
}: {
  title: string;
  icon: typeof Landmark;
  items: HomeDashboard["cashData"];
}) {
  const total = (values: HomeDashboard["cashData"]) =>
    values.reduce((sum, item) => sum + item.value, 0);
  return (
    <section className="rounded-xl border bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">{title}</h2>
        <Icon className="text-sky-500" />
      </div>
      <p className="mt-3 text-sm text-slate-500">
        合计{" "}
        <strong className="ml-2 text-xl text-slate-900">
          ¥ {money(total(items))}
        </strong>
      </p>
      <div className="mt-4 space-y-2">
        {items.map((item) => (
          <div key={item.name} className="flex justify-between text-sm">
            <span className="text-slate-500">{item.name}</span>
            <span className="font-medium">¥ {money(item.value)}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { currentAccountSet, currentPeriod } = useFinApp();
  const [data, setData] = useState<HomeDashboard | null>(null);

  useEffect(() => {
    if (currentAccountSet) home.dashboard(currentAccountSet.id).then(setData);
  }, [currentAccountSet, currentPeriod]);

  if (!data)
    return (
      <div className="rounded-xl border bg-white p-10 text-slate-500">
        加载经营数据...
      </div>
    );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl leading-snug font-semibold sm:text-2xl">
          让每个决策都有数据支撑
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {currentPeriod.year}年第{String(currentPeriod.month).padStart(2, "0")}
          期经营概览
        </p>
      </div>
      <div className="grid gap-5 xl:grid-cols-3">
        <button
          onClick={() => router.push("/voucher/form")}
          className="rounded-xl border bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">当期有</p>
              <p className="mt-1 text-3xl font-semibold text-sky-600">
                {data.voucherCount}
                <span className="ml-1 text-sm font-normal text-slate-500">
                  张凭证
                </span>
              </p>
            </div>
            <FilePlus2 className="text-sky-500" size={40} />
          </div>
          <p className="mt-6 font-medium">新增凭证 →</p>
        </button>
        <MoneySummaryCard
          title="货币资金"
          icon={Landmark}
          items={data.cashData}
        />
        <MoneySummaryCard
          title="费用统计"
          icon={ReceiptText}
          items={data.costData}
        />
      </div>
      <section className="rounded-xl border bg-white p-5 shadow-sm">
        <h2 className="font-semibold">主营业务收入与本年利润</h2>
        <p className="mt-1 text-sm text-slate-500">单位：千元</p>
        <RevenueProfitChart data={data.revenueProfitByMonth} />
      </section>
    </div>
  );
}
