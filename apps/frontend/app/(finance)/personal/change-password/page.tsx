"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useFinApp } from "@/lib/finance/auth-context";
import { userSettings } from "@/lib/finance/service";
import { PersonalCard } from "@/components/finance/PersonalCard";

export default function ChangePasswordPage() {
  const { currentUser } = useFinApp();
  const [form, setForm] = useState({ old: "", next: "", repeat: "" });
  const [message, setMessage] = useState("");

  const updateField = (field: keyof typeof form, value: string) => {
    setForm({ ...form, [field]: value });
  };

  const handleSubmit = async () => {
    if (!currentUser) return;
    if (form.next !== form.repeat) {
      setMessage("两次输入的密码不一致");
      return;
    }
    try {
      await userSettings.changePassword(currentUser.id, form.old, form.next);
      setForm({ old: "", next: "", repeat: "" });
      setMessage("更新密码成功");
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : "更新失败");
    }
  };

  return (
    <PersonalCard title="修改密码" subtitle="验证原密码后设置新的登录密码">
      <div className="space-y-4">
        <Field
          label="原密码"
          value={form.old}
          onChange={(value) => updateField("old", value)}
        />
        <Field
          label="新密码"
          value={form.next}
          onChange={(value) => updateField("next", value)}
        />
        <Field
          label="确认密码"
          value={form.repeat}
          onChange={(value) => updateField("repeat", value)}
        />
        {message && <p className="text-sm text-sky-600">{message}</p>}
        <Button onClick={() => void handleSubmit()}>保存</Button>
      </div>
    </PersonalCard>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block text-sm">
      {label}
      <Input
        className="mt-1"
        type="password"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}
