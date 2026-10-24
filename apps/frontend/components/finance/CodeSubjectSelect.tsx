"use client";
import { SubjectSelect } from "@/components/finance/SubjectSelect";
import type { Subject } from "@/lib/finance/types";
export function CodeSubjectSelect({
  subjects,
  value,
  onChange,
  placeholder,
}: {
  subjects: Subject[];
  value: string;
  onChange: (code: string) => void;
  placeholder?: string;
}) {
  const selected = subjects.find((subject) => subject.code === value);
  return (
    <SubjectSelect
      subjects={subjects}
      value={selected?.id ?? ""}
      placeholder={placeholder}
      onChange={(id) =>
        onChange(subjects.find((subject) => subject.id === id)?.code ?? "")
      }
    />
  );
}
