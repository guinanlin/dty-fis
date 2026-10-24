"use client";

import { useEffect, useState } from "react";
import { PersonalCard } from "@/components/finance/PersonalCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useFinApp } from "@/lib/finance/auth-context";
import { updateAvatar, updateProfile } from "@/components/actions/auth-action";

export default function PersonalSettingPage() {
  const { currentUser, updateCurrentUser } = useFinApp();
  const [form, setForm] = useState({ nickname: "", email: "", avatarUrl: "" });
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (currentUser) {
      setForm({
        nickname: currentUser.realName,
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
    const result = await updateProfile(form);
    if (!result.ok) return setMessage(result.error);
    if (result.user) updateCurrentUser({ ...currentUser, realName: result.user.nickname ?? form.nickname, email: result.user.email, avatarUrl: result.user.avatar_url ?? form.avatarUrl });
    setMessage("更新成功");
  };

  return (
    <PersonalCard title="个人设置" subtitle="维护头像、邮箱和制单人姓名">
      <div className="mb-5 flex items-center gap-4">
        <div className="grid h-20 w-20 place-items-center rounded-full bg-sky-500 text-3xl text-white">
          {form.nickname.slice(0, 1) || "用"}
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
          value={form.nickname}
          onChange={(value) => updateField("nickname", value)}
        />
        <p className="text-xs text-red-500">
          * 录入或审核凭证时，此姓名将作为制单人、审核人姓名。
        </p>
        {message && <p className="text-sm text-emerald-600">{message}</p>}
        <input type="file" accept="image/*" onChange={async (event) => { const file = event.target.files?.[0]; if (!file) return; const data = new FormData(); data.set("file", file); const result = await updateAvatar(data); if (result.ok) setForm((value) => ({ ...value, avatarUrl: result.downloadUrl ?? value.avatarUrl })); else setMessage(result.error); }} />
        <Button onClick={() => void handleSave()}>保存</Button>
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
