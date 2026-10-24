"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CalendarCheck2, Lock, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFinApp } from "@/lib/finance/auth-context";
import { checkout } from "@/lib/finance/service";
import type { AccountSetPeriod } from "@/lib/finance/types";

export default function CheckOutListPage() {
  const { currentAccountSet } = useFinApp(); const [periods, setPeriods] = useState<AccountSetPeriod[]>([]);
  useEffect(() => { if (currentAccountSet) checkout.list(currentAccountSet.id).then(setPeriods); }, [currentAccountSet]);
  const byYear = Object.groupBy(periods, (item) => String(item.year));
  return <div className="space-y-6"><div className="flex items-center justify-between"><div><h1 className="text-2xl font-semibold">期末结转</h1><p className="mt-1 text-sm text-slate-500">按会计期间执行月末结转、检查与结账</p></div><Button asChild variant="outline"><Link href="/check-out/un-check"><RotateCcw size={16} className="mr-2"/>反结账</Link></Button></div>{Object.entries(byYear).sort(([a], [b]) => Number(b) - Number(a)).map(([year, rows]) => <section key={year} className="rounded-xl border bg-white p-5"><h2 className="mb-4 text-lg font-semibold">{year}年</h2><div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">{rows?.sort((a, b) => b.month - a.month).map((period) => <div key={period.id} className={`rounded-lg border p-4 ${period.status === "closed" ? "border-slate-200 bg-slate-50 text-slate-400" : "border-sky-200 bg-sky-50"}`}><div className="flex items-center justify-between"><span className="text-xl font-semibold">{period.month}月</span>{period.status === "closed" ? <Lock size={18}/> : <CalendarCheck2 size={18} className="text-sky-600"/>}</div><p className="mt-2 text-xs">{period.status === "closed" ? "已结账" : "未结账"}</p><div className="mt-4 flex flex-col gap-2">{period.status === "open" ? <><Button asChild size="sm"><Link href={`/check-out/carry-forward/${period.year}/${period.month}`}>月末结转</Link></Button><Button asChild size="sm" variant="outline"><Link href={`/check-out/check/${period.year}/${period.month}`}>结账检查</Link></Button></> : <span className="text-xs">结账时间：{period.closedAt?.slice(0, 10)}</span>}</div></div>)}</div></section>)}</div>;
}
