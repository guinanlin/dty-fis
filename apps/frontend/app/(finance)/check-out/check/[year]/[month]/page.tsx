"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFinApp } from "@/lib/finance/auth-context";
import { checkout } from "@/lib/finance/service";
import type { CheckoutCheckRow } from "@/lib/finance/types";

export default function CheckPage() {
  const { year, month } = useParams<{ year: string; month: string }>(); const router = useRouter(); const { currentAccountSet } = useFinApp(); const [rows, setRows] = useState<CheckoutCheckRow[]>([]); const [loading, setLoading] = useState(true); const [message, setMessage] = useState("");
  useEffect(() => { if (!currentAccountSet) return; setLoading(true); checkout.preview(currentAccountSet.id, Number(year), Number(month)).then(setRows).finally(() => setLoading(false)); }, [currentAccountSet, month, year]); const passed = rows.length > 0 && rows.every((item) => item.passed);
  return <div className="mx-auto max-w-3xl space-y-5"><div><h1 className="text-2xl font-semibold">结账检查</h1><p className="mt-1 text-sm text-slate-500">{year}年第{month}期 · 结账前检查</p></div><div className="overflow-hidden rounded-xl border bg-white shadow-sm">{loading ? <div className="flex h-48 items-center justify-center gap-2 text-slate-500"><Loader2 className="animate-spin"/>检查中...</div> : rows.map((row) => <div key={row.key} className="flex items-center gap-4 border-b px-6 py-5 last:border-0">{row.passed ? <CheckCircle2 className="text-emerald-500"/> : <XCircle className="text-red-500"/>}<div className="flex-1"><p className="font-semibold">{row.name}</p><p className={`mt-1 text-sm ${row.passed ? "text-slate-500" : "text-red-600"}`}>{row.message}</p></div><span className={`rounded-full px-3 py-1 text-xs ${row.passed ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>{row.passed ? "通过" : "未通过"}</span></div>)}</div>{message && <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{message}</div>}<div className="flex justify-center gap-3"><Button variant="outline" onClick={() => router.back()}>上一步</Button><Button disabled={!passed || loading} onClick={async () => { if (!currentAccountSet) return; try { await checkout.checkOut(currentAccountSet.id, Number(year), Number(month)); router.push("/check-out/list"); } catch (reason) { setMessage(reason instanceof Error ? reason.message : "结账失败"); } }}>开始结账</Button></div></div>;
}
