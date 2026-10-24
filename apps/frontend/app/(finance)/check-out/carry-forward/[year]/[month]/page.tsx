"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowRight, FileCheck2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MoneyText } from "@/components/finance/MoneyText";
import { useFinApp } from "@/lib/finance/auth-context";
import { checkout, voucher } from "@/lib/finance/service";
import type { CarryForwardItem, Voucher } from "@/lib/finance/types";

export default function CarryForwardPage() {
  const { year, month } = useParams<{ year: string; month: string }>(); const router = useRouter(); const { currentAccountSet, currentUser } = useFinApp(); const [items, setItems] = useState<CarryForwardItem[]>([]); const [existing, setExisting] = useState<Voucher | null>(null); const [busy, setBusy] = useState(false); const [message, setMessage] = useState("");
  useEffect(() => { if (!currentAccountSet) return; checkout.carryForward(currentAccountSet.id, Number(year), Number(month)).then(setItems); voucher.carryForward(currentAccountSet.id, Number(year), Number(month)).then((rows) => setExisting(rows[0] ?? null)); }, [currentAccountSet, month, year]);
  return <div className="space-y-5"><div><h1 className="text-2xl font-semibold">月末结转</h1><p className="mt-1 text-sm text-slate-500">{year}年第{month}期 · 将损益类科目本期发生额结转至本年利润</p></div>{message && <div className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div>}<div className="overflow-x-auto rounded-xl border bg-white"><div className="min-w-[880px] grid grid-cols-[1fr_160px_160px_160px] bg-slate-50 px-5 py-3 text-sm font-medium text-slate-600"><span>损益科目</span><span className="text-right">借方发生额</span><span className="text-right">贷方发生额</span><span className="text-right">结转净额</span></div>{items.map((item) => <div key={item.subjectId} className="min-w-[880px] grid grid-cols-[1fr_160px_160px_160px] border-t px-5 py-4 text-sm"><span><b className="mr-2 text-sky-600">{item.subjectCode}</b>{item.subjectName}</span><MoneyText className="text-right" value={item.debitAmount}/><MoneyText className="text-right" value={item.creditAmount}/><MoneyText className="text-right font-semibold" value={item.netAmount}/></div>)}{!items.length && <div className="p-12 text-center text-slate-400">本期没有需要结转的损益发生额</div>}</div><div className="rounded-xl border bg-white p-5"><div className="flex items-center justify-between"><div><h2 className="font-semibold">结转损益凭证</h2><p className="mt-1 text-sm text-slate-500">系统自动生成平衡的“转”字凭证，生成后可进入凭证页审核。</p></div>{existing ? <Button asChild variant="outline"><Link href={`/voucher/form/${existing.id}`}><FileCheck2 size={16} className="mr-2"/>查看凭证</Link></Button> : <Button disabled={!items.length || busy} onClick={async () => { if (!currentAccountSet || !currentUser) return; setBusy(true); try { const created = await checkout.confirmCarryForward(currentAccountSet.id, Number(year), Number(month), currentUser.id); setExisting(created); setMessage(`已生成结转凭证 ${created.word}-${created.number}`); } finally { setBusy(false); } }}>{busy ? "生成中..." : "生成凭证"}</Button>}</div></div><div className="flex justify-center gap-3"><Button variant="outline" onClick={() => router.back()}>上一步</Button><Button asChild><Link href={`/check-out/check/${year}/${month}`}>下一步<ArrowRight size={16} className="ml-2"/></Link></Button></div></div>;
}
