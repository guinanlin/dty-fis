"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Copy,
  Save,
  ShieldCheck,
  ShieldOff,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/finance/ConfirmDialog";
import {
  emptyVoucherRow,
  VoucherTable,
  type VoucherDraftRow,
} from "@/components/finance/VoucherTable";
import { useFinApp } from "@/lib/finance/auth-context";
import {
  assistCategory,
  subject,
  voucher,
  voucherWord,
} from "@/lib/finance/service";
import type {
  AssistingCategory,
  AssistingValue,
  Subject,
  VoucherWord,
} from "@/lib/finance/types";

type VoucherForm = {
  wordId: string;
  word: string;
  number: number;
  date: string;
  attachmentCount: number;
  remark: string;
  status: "draft" | "audited" | "posted" | "void";
};

function VoucherMetaFields({
  form,
  words,
  readonly,
  onChange,
  onWordChange,
}: {
  form: VoucherForm;
  words: VoucherWord[];
  readonly: boolean;
  onChange: (patch: Partial<VoucherForm>) => void;
  onWordChange: (wordId: string) => void;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-6">
      <label className="text-sm text-slate-600">
        凭证字
        <select
          disabled={readonly}
          value={form.wordId}
          onChange={(event) => void onWordChange(event.target.value)}
          className="mt-1 h-10 w-full rounded-md border bg-white px-3 text-slate-900"
        >
          {words.map((word) => (
            <option key={word.id} value={word.id}>
              {word.name}（{word.word}）
            </option>
          ))}
        </select>
      </label>
      <label className="text-sm text-slate-600">
        凭证号
        <Input
          disabled={readonly}
          className="mt-1"
          type="number"
          min={1}
          value={form.number || ""}
          onChange={(event) => onChange({ number: Number(event.target.value) })}
        />
      </label>
      <label className="text-sm text-slate-600 md:col-span-2">
        日期
        <Input
          disabled={readonly}
          className="mt-1"
          type="date"
          value={form.date}
          onChange={(event) => onChange({ date: event.target.value })}
        />
      </label>
      <label className="text-sm text-slate-600">
        附件数
        <Input
          disabled={readonly}
          className="mt-1"
          type="number"
          min={0}
          value={form.attachmentCount}
          onChange={(event) =>
            onChange({ attachmentCount: Number(event.target.value) })
          }
        />
      </label>
      <label className="text-sm text-slate-600">
        状态
        <div className="mt-1 flex h-10 items-center rounded-md bg-slate-100 px-3">
          {
            {
              draft: "待审核",
              audited: "已审核",
              posted: "已记账",
              void: "已作废",
            }[form.status]
          }
        </div>
      </label>
      <label className="text-sm text-slate-600 md:col-span-6">
        备注
        <Input
          disabled={readonly}
          className="mt-1"
          value={form.remark}
          onChange={(event) => onChange({ remark: event.target.value })}
          placeholder="选填"
        />
      </label>
    </div>
  );
}

export default function VoucherFormPage() {
  const params = useParams<{ id?: string[] }>();
  const router = useRouter();
  const id = params.id?.[0];
  const { currentAccountSet, currentPeriod, currentUser } = useFinApp();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [words, setWords] = useState<VoucherWord[]>([]);
  const [categories, setCategories] = useState<AssistingCategory[]>([]);
  const [values, setValues] = useState<AssistingValue[]>([]);
  const [rows, setRows] = useState<VoucherDraftRow[]>([
    emptyVoucherRow(1),
    emptyVoucherRow(2),
    emptyVoucherRow(3),
    emptyVoucherRow(4),
  ]);
  const [form, setForm] = useState<VoucherForm>({
    wordId: "",
    word: "记",
    number: 0,
    date: `${currentPeriod.year}-${String(currentPeriod.month).padStart(2, "0")}-${String(new Date(currentPeriod.year, currentPeriod.month, 0).getDate()).padStart(2, "0")}`,
    attachmentCount: 0,
    remark: "",
    status: "draft",
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!currentAccountSet) return;
    Promise.all([
      subject.tree(currentAccountSet.id),
      voucherWord.list(currentAccountSet.id),
      assistCategory.list(currentAccountSet.id),
    ]).then(async ([subjectRows, wordRows, categoryRows]) => {
      setSubjects(subjectRows);
      setWords(wordRows);
      setCategories(categoryRows);
      setValues(
        (
          await Promise.all(
            categoryRows.map((item) => assistCategory.values(item.id)),
          )
        ).flat(),
      );
      const defaultWord =
        wordRows.find((item) => item.isDefault) ?? wordRows[0];
      if (!id && defaultWord) {
        const number = await voucher.maxNumber(
          currentAccountSet.id,
          currentPeriod.year,
          currentPeriod.month,
          defaultWord.id,
        );
        setForm((value) => ({
          ...value,
          wordId: defaultWord.id,
          word: defaultWord.word,
          number: number + 1,
        }));
      }
    });
  }, [currentAccountSet, currentPeriod.month, currentPeriod.year, id]);

  useEffect(() => {
    if (!id) return;
    voucher.getDetail(id).then((item) => {
      if (!item) {
        setError("凭证不存在");
        return;
      }
      setForm({
        wordId: item.voucherWordId,
        word: item.word,
        number: item.number,
        date: item.date,
        attachmentCount: item.attachmentCount,
        remark: item.remark ?? "",
        status: item.status,
      });
      setRows(item.details.map((detail) => ({ ...detail })));
    });
  }, [id]);

  const readonly =
    form.status === "audited" ||
    form.status === "posted" ||
    form.status === "void";

  const selectWord = async (wordId: string) => {
    const selected = words.find((item) => item.id === wordId);
    if (!selected || !currentAccountSet) return;
    const date = new Date(`${form.date}T00:00:00`);
    const max = await voucher.maxNumber(
      currentAccountSet.id,
      date.getFullYear(),
      date.getMonth() + 1,
      wordId,
    );
    setForm({
      ...form,
      wordId,
      word: selected.word,
      number: selected.annualNumbering ? max + 1 : max + 1,
    });
  };

  const save = async () => {
    if (!currentAccountSet || !currentUser) return;
    setError("");
    setSaving(true);
    try {
      const activeRows = rows.filter(
        (row) =>
          row.subjectId || row.summary || row.debitAmount || row.creditAmount,
      );
      const date = new Date(`${form.date}T00:00:00`);
      await voucher.save({
        id,
        accountSetId: currentAccountSet.id,
        voucherWordId: form.wordId,
        word: form.word,
        number: form.number,
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        date: form.date,
        attachmentCount: form.attachmentCount,
        status: form.status,
        sourceType: "manual",
        remark: form.remark,
        createdBy: currentUser.id,
        details: activeRows.map(({ id: detailId, ...row }) => ({
          ...row,
          id: detailId.startsWith("draft-") ? undefined : detailId,
        })),
      });
      router.push("/voucher");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "保存失败");
    } finally {
      setSaving(false);
    }
  };

  const toggleAudit = async () => {
    if (!id || !currentUser) return;
    if (form.status === "audited") {
      await voucher.cancelAudit([id]);
      setForm({ ...form, status: "draft" });
    } else {
      await voucher.audit([id], currentUser.id);
      setForm({ ...form, status: "audited" });
    }
  };

  const handleCopy = async () => {
    if (!id) return;
    const copied = await voucher.copy(id);
    router.push(`/voucher/form/${copied.id}`);
  };

  const handleDelete = async () => {
    if (id) await voucher.delete(id);
    router.push("/voucher");
  };

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft size={16} className="mr-2" />
            返回
          </Button>
          <h1 className="mt-2 text-2xl font-semibold">
            {id ? "编辑凭证" : "新增凭证"}
          </h1>
        </div>
        <div className="flex flex-wrap gap-2">
          {id && (
            <Button variant="outline" onClick={() => void handleCopy()}>
              <Copy size={16} className="mr-2" />
              复制
            </Button>
          )}
          {id && (
            <Button variant="outline" onClick={() => void toggleAudit()}>
              {form.status === "audited" ? (
                <ShieldOff size={16} className="mr-2" />
              ) : (
                <ShieldCheck size={16} className="mr-2" />
              )}
              {form.status === "audited" ? "取消审核" : "审核"}
            </Button>
          )}
          {id && (
            <Button
              variant="destructive"
              disabled={form.status === "posted"}
              onClick={() => setConfirmDelete(true)}
            >
              <Trash2 size={16} className="mr-2" />
              删除
            </Button>
          )}
          <Button disabled={saving || readonly} onClick={() => void save()}>
            <Save size={16} className="mr-2" />
            {saving ? "保存中..." : "保存凭证"}
          </Button>
        </div>
      </div>
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      <div className="rounded-xl border bg-white p-5 shadow-sm">
        <VoucherMetaFields
          form={form}
          words={words}
          readonly={readonly}
          onChange={(patch) => setForm({ ...form, ...patch })}
          onWordChange={selectWord}
        />
      </div>
      <VoucherTable
        rows={rows}
        subjects={subjects}
        categories={categories}
        assistingValues={values}
        disabled={readonly}
        onChange={setRows}
      />
      <p className="text-sm text-slate-500">
        制单人：{currentUser?.realName}
        　凭证日期须位于当前会计期间，保存前会自动校验摘要、科目、金额及借贷平衡。
      </p>
      <ConfirmDialog
        open={confirmDelete}
        destructive
        title="删除凭证"
        description="删除后无法恢复，确认继续吗？"
        onClose={() => setConfirmDelete(false)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
