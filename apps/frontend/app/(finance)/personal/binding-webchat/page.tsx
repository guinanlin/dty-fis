"use client";
import { useState } from "react"; import { bindWechat } from "@/components/actions/auth-action"; import { Button } from "@/components/ui/button"; import { PersonalCard } from "@/components/finance/PersonalCard";
export default function BindingWechatPage() { const [message, setMessage] = useState("微信开放平台接入待开放，敬请期待"); return <PersonalCard title="微信绑定" subtitle="微信开放平台接入待开放，敬请期待"><p>{message}</p><Button className="mt-4" onClick={async () => setMessage((await bindWechat()).message)}>确认绑定</Button></PersonalCard>; }
