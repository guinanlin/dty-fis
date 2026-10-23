"use client";

import type { ReactNode } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FinPagination } from "./FinPagination";

export interface FinColumn<T> { key: string; title: ReactNode; className?: string; render: (row: T) => ReactNode }

export function FinTable<T extends { id: string }>({ columns, data, loading, selectedIds = [], onSelectionChange, page, totalPages, total, onPageChange }: { columns: FinColumn<T>[]; data: T[]; loading?: boolean; selectedIds?: string[]; onSelectionChange?: (ids: string[]) => void; page?: number; totalPages?: number; total?: number; onPageChange?: (page: number) => void }) {
  const allSelected = data.length > 0 && data.every((item) => selectedIds.includes(item.id));
  const toggleAll = () => onSelectionChange?.(allSelected ? selectedIds.filter((id) => !data.some((item) => item.id === id)) : Array.from(new Set([...selectedIds, ...data.map((item) => item.id)])));
  return <div className="overflow-hidden rounded-lg border bg-white"><Table><TableHeader><TableRow>{onSelectionChange && <TableHead className="w-12 text-center"><input aria-label="全选" type="checkbox" checked={allSelected} onChange={toggleAll}/></TableHead>}{columns.map((column) => <TableHead key={column.key} className={column.className}>{column.title}</TableHead>)}</TableRow></TableHeader><TableBody>{loading ? <TableRow><TableCell colSpan={columns.length + (onSelectionChange ? 1 : 0)} className="h-32 text-center text-slate-500">数据加载中...</TableCell></TableRow> : data.length ? data.map((row) => <TableRow key={row.id} data-state={selectedIds.includes(row.id) ? "selected" : undefined}>{onSelectionChange && <TableCell className="text-center"><input aria-label="选择记录" type="checkbox" checked={selectedIds.includes(row.id)} onChange={() => onSelectionChange(selectedIds.includes(row.id) ? selectedIds.filter((id) => id !== row.id) : [...selectedIds, row.id])}/></TableCell>}{columns.map((column) => <TableCell key={column.key} className={column.className}>{column.render(row)}</TableCell>)}</TableRow>) : <TableRow><TableCell colSpan={columns.length + (onSelectionChange ? 1 : 0)} className="h-32 text-center text-slate-400">暂无数据</TableCell></TableRow>}</TableBody></Table>{page && totalPages !== undefined && total !== undefined && onPageChange && <FinPagination page={page} totalPages={totalPages} total={total} onChange={onPageChange}/>}</div>;
}
