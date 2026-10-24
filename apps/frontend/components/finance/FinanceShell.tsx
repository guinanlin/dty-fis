"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Bell, BookOpen, ChevronDown, ChevronRight, FileBarChart, FileText, Home, LogOut, Menu, Settings, WalletCards, X } from "lucide-react";
import { useFinApp } from "@/lib/finance/auth-context";
import { resolveActiveMenu, type FinanceMenuItem } from "@/components/finance/active-menu";

const menus = [
  { title: "主页", href: "/dashboard", icon: Home },
  { title: "凭证", icon: FileText, children: [{ title: "新增凭证", href: "/voucher/form" }, { title: "凭证列表", href: "/voucher" }] },
  { title: "帐薄", icon: BookOpen, children: [{ title: "明细账", href: "/account-book/detailed" }, { title: "总账", href: "/account-book/general-ledger" }, { title: "科目余额", href: "/account-book/subject-balance" }, { title: "科目汇总", href: "/account-book/subject-summary" }, { title: "核算项目明细账", href: "/account-book/auxiliary-accounting-detail" }, { title: "核算项目余额", href: "/account-book/auxiliary-accounting-balance" }] },
  { title: "报表", href: "/report", icon: FileBarChart },
  { title: "结账", href: "/check-out/list", match: "/check-out/", icon: WalletCards },
  { title: "设置", icon: Settings, children: [{ title: "账套", href: "/account" }, { title: "科目", href: "/subject" }, { title: "期初", href: "/initial" }, { title: "币别", href: "/currency" }, { title: "凭证字", href: "/voucher-word" }, { title: "辅助核算", href: "/assisting-accounting/accounting-category", match: "/assisting-accounting/" }, { title: "权限设置", href: "/permission-setting" }] },
] satisfies FinanceMenuItem[];

export function FinanceShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname(); const router = useRouter();
  const { ready, token, currentUser, accountSets, currentAccountSet, currentPeriod, selectAccountSet, setPeriod, logout } = useFinApp();
  const [collapsed, setCollapsed] = useState(false); const [open, setOpen] = useState<Record<string, boolean>>({ 凭证: true, 帐薄: true, 设置: true }); const [messages, setMessages] = useState(false); const [profile, setProfile] = useState(false);

  useEffect(() => {
    if (!ready) return;
    if (!token) {
      router.replace("/login");
      return;
    }
    if (!currentAccountSet) router.replace("/select-account-set");
  }, [currentAccountSet, ready, router, token]);

  useEffect(() => {
    setOpen((current) => {
      const next = { ...current };
      let changed = false;
      for (const item of menus) {
        if (!item.children?.length) continue;
        if (resolveActiveMenu(pathname, item).active && !next[item.title]) {
          next[item.title] = true;
          changed = true;
        }
      }
      return changed ? next : current;
    });
  }, [pathname]);

  if (!ready) return <div className="grid min-h-screen place-items-center text-slate-500">正在加载纷析云财税...</div>;
  if (!token || !currentAccountSet) return null;
  const years = Array.from({ length: 5 }, (_, index) => new Date().getFullYear() - 2 + index);
  return <div className="min-h-screen bg-slate-100 text-slate-800">
    <aside className={`fixed inset-y-0 left-0 z-30 bg-[#152238] text-slate-200 transition-all ${collapsed ? "w-20" : "w-64"}`}>
      <div className="flex h-16 items-center justify-between border-b border-white/10 px-5"><Link href="/dashboard" className="font-semibold tracking-wide text-white">{collapsed ? "纷析" : "纷析云财税"}</Link><button onClick={() => setCollapsed(!collapsed)}>{collapsed ? <Menu size={18}/> : <X size={18}/>}</button></div>
      <nav className="space-y-1 p-3">{menus.map((item) => { const Icon = item.icon; const { active, activeChildHref } = resolveActiveMenu(pathname, item); return <div key={item.title}>{item.href ? <Link href={item.href} className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm ${active ? "bg-sky-500 text-white" : "hover:bg-white/10"}`}><Icon size={18}/>{!collapsed && item.title}</Link> : <><button onClick={() => setOpen((value) => ({ ...value, [item.title]: !value[item.title] }))} className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm ${active ? "text-sky-300" : "hover:bg-white/10"}`}><Icon size={18}/>{!collapsed && <><span className="flex-1 text-left">{item.title}</span>{open[item.title] ? <ChevronDown size={15}/> : <ChevronRight size={15}/>}</>}</button>{!collapsed && open[item.title] && <div className="ml-7 mt-1 space-y-1">{item.children?.map((child) => <Link key={child.href} href={child.href} className={`block rounded-md px-3 py-2 text-sm ${child.href === activeChildHref ? "bg-white/10 text-sky-300" : "text-slate-400 hover:text-white"}`}>{child.title}</Link>)}</div>}</>}</div>; })}</nav>
    </aside>
    <div className={`transition-all ${collapsed ? "ml-20" : "ml-64"}`}><header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b bg-white px-6 shadow-sm">
      <div className="flex items-center gap-3"><select value={currentAccountSet.id} onChange={(event) => selectAccountSet(event.target.value)} className="max-w-[280px] rounded-md border px-3 py-2 text-sm font-medium">{accountSets.map((item) => <option key={item.id} value={item.id}>{item.companyName}</option>)}</select><select value={currentPeriod.year} onChange={(event) => setPeriod(Number(event.target.value), currentPeriod.month)} className="rounded-md border px-2 py-2 text-sm">{years.map((year) => <option key={year}>{year}</option>)}</select><select value={currentPeriod.month} onChange={(event) => setPeriod(currentPeriod.year, Number(event.target.value))} className="rounded-md border px-2 py-2 text-sm">{Array.from({ length: 12 }, (_, index) => index + 1).map((month) => <option key={month} value={month}>第{month}期</option>)}</select></div>
      <div className="flex items-center gap-3"><div className="relative"><button onClick={() => setMessages(!messages)} className="rounded-full p-2 hover:bg-slate-100"><Bell size={19}/></button>{messages && <div className="absolute right-0 mt-2 w-72 rounded-lg border bg-white p-4 shadow-xl"><p className="font-medium">消息中心</p><p className="mt-3 text-sm text-slate-500">当前期间凭证尚未结账。</p><p className="mt-2 text-sm text-slate-500">欢迎使用纷析云财税。</p></div>}</div><div className="relative"><button onClick={() => setProfile(!profile)} className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2 text-sm"><span className="grid h-7 w-7 place-items-center rounded-full bg-sky-500 text-white">{currentUser?.realName.slice(0, 1)}</span>{currentUser?.realName}<ChevronDown size={14}/></button>{profile && <div className="absolute right-0 mt-2 w-44 rounded-lg border bg-white py-2 shadow-xl">{[["个人设置", "/personal/personal-setting"], ["修改密码", "/personal/change-password"], ["修改手机", "/personal/change-phone-number"], ["绑定微信", "/personal/binding-webchat"]].map(([title, href]) => <Link key={href} href={href} className="block px-4 py-2 text-sm hover:bg-slate-50">{title}</Link>)}<button onClick={async () => { await logout(); router.replace("/login"); }} className="flex w-full items-center gap-2 border-t px-4 py-2 text-sm text-red-600 hover:bg-red-50"><LogOut size={15}/>退出登录</button></div>}</div></div>
    </header><main className="p-6">{children}</main></div>
  </div>;
}
