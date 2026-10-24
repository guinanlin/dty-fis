"use client";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { auth } from "@/lib/finance/service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function PasswordRecoveryPage() { const [message, setMessage] = useState(""); async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const data = new FormData(event.currentTarget); const password = String(data.get("password")); if (password !== data.get("repeatPassword")) { setMessage("两次输入的密码不一致"); return; } try { await auth.resetPassword(String(data.get("username")), password); setMessage("密码重置成功，请返回登录"); } catch (cause) { setMessage(cause instanceof Error ? cause.message : "重置失败"); } } return <main className="grid min-h-screen place-items-center bg-slate-100 p-6"><section className="w-full max-w-md rounded-2xl border bg-white p-8 shadow-xl"><h1 className="text-2xl font-semibold">找回密码</h1><p className="mb-7 mt-2 text-sm text-slate-500">验证身份并设置新的登录密码</p><form onSubmit={submit} className="space-y-4"><Input name="username" placeholder="账号或手机号" required/><div className="flex gap-2"><Input name="code" placeholder="验证码" required/><Button type="button" variant="outline">获取验证码</Button></div><Input name="password" type="password" placeholder="新密码" required/><Input name="repeatPassword" type="password" placeholder="确认新密码" required/>{message && <p className={`text-sm ${message.includes("成功") ? "text-emerald-600" : "text-red-600"}`}>{message}</p>}<Button className="w-full bg-sky-600">修改密码</Button><Link href="/login" className="block text-center text-sm text-sky-600">返回登录</Link></form></section></main>; }

