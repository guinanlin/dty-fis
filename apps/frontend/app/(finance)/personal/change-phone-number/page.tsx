"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useFinApp } from "@/lib/finance/auth-context";
import { userSettings } from "@/lib/finance/service";
import { PersonalCard } from "@/components/finance/PersonalCard";

export default function ChangePhonePage() {
  const { currentUser, updateCurrentUser } = useFinApp();
  const [mobile, setMobile] = useState(currentUser?.mobile || "");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [message, setMessage] = useState("");

  const handleSendCode = () => {
    setSent(true);
    setMessage("验证码已发送（模拟）");
  };

  const handleCodeChange = (value: string) => {
    setCode(value.replace(/\D/g, ""));
  };

  const handleSave = async () => {
    if (!currentUser) return;
    try {
      await userSettings.changePhone(currentUser.id, mobile, code);
      updateCurrentUser({ ...currentUser, mobile });
      setMessage("手机号更新成功");
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : "更新失败");
    }
  };

  return (
    <PersonalCard
      title="修改手机"
      subtitle="短信验证码为模拟校验，任意6位数字均可"
    >
      <div className="space-y-4">
        <label className="block text-sm">
          新手机号
          <div className="mt-1 flex gap-2">
            <Input
              value={mobile}
              onChange={(event) => setMobile(event.target.value)}
            />
            <Button variant="outline" onClick={handleSendCode}>
              获取验证码
            </Button>
          </div>
        </label>
        <label className="block text-sm">
          验证码
          <Input
            className="mt-1"
            value={code}
            maxLength={6}
            onChange={(event) => handleCodeChange(event.target.value)}
          />
        </label>
        {message && <p className="text-sm text-sky-600">{message}</p>}
        <Button disabled={!sent} onClick={handleSave}>
          保存
        </Button>
      </div>
    </PersonalCard>
  );
}
