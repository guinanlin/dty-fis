"use client";

import { useEffect, useState } from "react";
import { PersonalCard } from "@/components/finance/PersonalCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useFinApp } from "@/lib/finance/auth-context";
import { userSettings } from "@/lib/finance/service";

export default function PersonalSettingPage() {
  const { currentUser, updateCurrentUser } = useFinApp();
  const [form, setForm] = useState({ realName: "", email: "", avatarUrl: "" });
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (currentUser) {
      setForm({
        realName: currentUser.realName,
        email: currentUser.email,
        avatarUrl: currentUser.avatarUrl || "",
      });
    }
  }, [currentUser]);

  const updateField = (field: keyof typeof form, value: string) => {
    setForm({ ...form, [field]: value });
  };

  const handleSave = async () => {
    if (!currentUser) return;
    const user = await userSettings.updateProfile(currentUser.id, form);
    updateCurrentUser(user);
    setMessage("更新成功");
  };

  return (
    <PersonalCard title="个人设置" subtitle="维护头像、邮箱和制单人姓名">
      <div className="mb-5 flex items-center gap-4">
        <div className="grid h-20 w-20 place-items-center rounded-full bg-sky-500 text-3xl text-white">
          {form.realName.slice(0, 1) || "用"}
        </div>
        <div>
          <p className="font-medium">账号：{currentUser?.username}</p>
          <p className="text-sm text-slate-500">手机：{currentUser?.mobile}</p>
        </div>
      </div>
      <div className="space-y-4">
        <Field
          label="头像地址"
          value={form.avatarUrl}
          onChange={(value) => updateField("avatarUrl", value)}
        />
        <Field
          label="邮箱"
          type="email"
          value={form.email}
          onChange={(value) => updateField("email", value)}
        />
        <Field
          label="姓名"
          value={form.realName}
          onChange={(value) => updateField("realName", value)}
        />
        <p className="text-xs text-red-500">
          * 录入或审核凭证时，此姓名将作为制单人、审核人姓名。
        </p>
        {message && <p className="text-sm text-emerald-600">{message}</p>}
        <Button onClick={handleSave}>保存</Button>
      </div>
    </PersonalCard>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <label className="block text-sm">
      {label}
      <Input
        className="mt-1"
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}
