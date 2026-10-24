"use client";

import { useMemo, useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { Subject } from "@/lib/finance/types";

export function SubjectSelect({ subjects, value, onChange, placeholder = "请选择会计科目", allowAll = false }: { subjects: Subject[]; value?: string; onChange: (subjectId: string) => void; placeholder?: string; allowAll?: boolean }) {
  const [open, setOpen] = useState(false); const [keyword, setKeyword] = useState(""); const selected = subjects.find((item) => item.id === value); const filtered = useMemo(() => subjects.filter((item) => `${item.code} ${item.name}`.toLowerCase().includes(keyword.toLowerCase())), [keyword, subjects]);
  return <div className="relative min-w-64"><button type="button" onClick={() => setOpen(!open)} className="flex h-10 w-full items-center justify-between rounded-md border bg-white px-3 text-left text-sm"><span className={selected ? "" : "text-slate-500"}>{selected ? `${selected.code} ${selected.name}` : placeholder}</span><ChevronDown size={15}/></button>{open && <div className="absolute left-0 top-full z-40 mt-1 w-full min-w-80 rounded-lg border bg-white p-2 shadow-xl"><div className="relative"><Search className="absolute left-3 top-2.5 text-slate-400" size={15}/><Input autoFocus className="pl-9" value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="搜索科目编码或名称"/></div><div className="mt-2 max-h-72 overflow-auto">{allowAll && <button type="button" className="block w-full rounded px-3 py-2 text-left text-sm hover:bg-sky-50" onClick={() => { onChange(""); setOpen(false); }}>全部科目</button>}{filtered.map((subject) => <button type="button" key={subject.id} onClick={() => { onChange(subject.id); setOpen(false); setKeyword(""); }} className="block w-full rounded px-3 py-2 text-left text-sm hover:bg-sky-50"><span className="mr-2 text-sky-600">{subject.code}</span>{subject.name}<span className="float-right text-xs text-slate-400">{subject.category}</span></button>)}{!filtered.length && <p className="p-4 text-center text-sm text-slate-400">未找到匹配科目</p>}</div></div>}</div>;
}
