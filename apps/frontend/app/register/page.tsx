"use client";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/finance/service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function RegisterPage() { const router = useRouter(); const [message, setMessage] = useState(""); async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const data = new FormData(event.currentTarget); try { await auth.register({ username: String(data.get("mobile")), password: String(data.get("password")), realName: String(data.get("name")), mobile: String(data.get("mobile")), email: String(data.get("email")) }); router.push("/login"); } catch (cause) { setMessage(cause instanceof Error ? cause.message : "注册失败"); } } return <AuthPanel title="注册纷析云账户" subtitle="创建账户后即可建立企业账套"><form onSubmit={submit} className="space-y-4"><Input name="name" placeholder="姓名" required/><Input name="mobile" placeholder="手机号" required/><Input name="email" type="email" placeholder="邮箱" required/><Input name="password" type="password" placeholder="设置密码" required/><div className="flex gap-2"><Input name="code" placeholder="邮箱验证码" required/><Button type="button" variant="outline">发送验证码</Button></div>{message && <p className="text-sm text-red-600">{message}</p>}<Button className="w-full bg-sky-600">注册</Button><p className="text-center text-sm text-slate-500">已有账户？ <Link href="/login" className="text-sky-600">返回登录</Link></p></form></AuthPanel>; }
function AuthPanel({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) { return <main className="grid min-h-screen place-items-center bg-slate-100 p-6"><section className="w-full max-w-md rounded-2xl border bg-white p-8 shadow-xl"><h1 className="text-2xl font-semibold">{title}</h1><p className="mb-7 mt-2 text-sm text-slate-500">{subtitle}</p>{children}</section></main>; }

