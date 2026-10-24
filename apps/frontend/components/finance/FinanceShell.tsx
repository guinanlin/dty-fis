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
  const [collapsed, setCollapsed] = useState(false); const [mobileOpen, setMobileOpen] = useState(false); const [open, setOpen] = useState<Record<string, boolean>>({}); const [messages, setMessages] = useState(false); const [profile, setProfile] = useState(false);
  const sideCollapsed = collapsed && !mobileOpen;

  useEffect(() => { setMobileOpen(false); }, [pathname]);
  useEffect(() => { const mediaQuery = window.matchMedia("(min-width: 1024px)"); const handleChange = (event: MediaQueryListEvent) => { if (event.matches) setMobileOpen(false); }; mediaQuery.addEventListener("change", handleChange); return () => mediaQuery.removeEventListener("change", handleChange); }, []);
  useEffect(() => { document.body.style.overflow = mobileOpen ? "hidden" : ""; return () => { document.body.style.overflow = ""; }; }, [mobileOpen]);

  useEffect(() => {
    if (!ready) return;
    if (!token) { router.replace("/login"); return; }
    if (!currentAccountSet) router.replace("/select-account-set");
  }, [currentAccountSet, ready, router, token]);
  useEffect(() => {
    setOpen((current) => {
      const next: Record<string, boolean> = {};
      for (const item of menus) {
        if (!item.children?.length) continue;
        if (resolveActiveMenu(pathname, item).active) next[item.title] = true;
      }
      let changed = Object.keys(next).length !== Object.keys(current).length;
      if (!changed) changed = Object.keys(current).some((key) => current[key] !== next[key]);
      return changed ? next : current;
    });
  }, [pathname]);

  if (!ready) return <div className="grid min-h-screen place-items-center text-slate-500">正在加载汤圆财税...</div>;
  if (!token || !currentAccountSet) return null;
  const years = Array.from({ length: 5 }, (_, index) => new Date().getFullYear() - 2 + index);
  return <div className="min-h-screen bg-slate-100 text-slate-800">
    {mobileOpen && <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setMobileOpen(false)} aria-hidden="true" />}
    <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-[#152238] text-slate-200 transition-all duration-200 ${mobileOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 ${sideCollapsed ? "lg:w-20" : "lg:w-64"}`}>
      <div className="flex h-16 items-center justify-between border-b border-white/10 px-5"><Link href="/dashboard" className="font-semibold tracking-wide text-white">{sideCollapsed ? "汤圆" : "汤圆财税"}</Link><div className="flex items-center gap-1"><button onClick={() => setMobileOpen(false)} className="lg:hidden" aria-label="关闭菜单"><X size={20}/></button><button onClick={() => setCollapsed(!collapsed)} className="hidden lg:inline-flex" aria-label="折叠菜单">{collapsed ? <Menu size={18}/> : <X size={18}/>}</button></div></div>
      <nav className="space-y-1 p-3">{menus.map((item) => { const Icon = item.icon; const { active, activeChildHref } = resolveActiveMenu(pathname, item); return <div key={item.title}>{item.href ? <Link href={item.href} className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm ${active ? "bg-sky-500 text-white" : "hover:bg-white/10"}`}><Icon size={18}/>{!sideCollapsed && item.title}</Link> : <><button onClick={() => setOpen({ [item.title]: !open[item.title] })} className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm ${active ? "text-sky-300" : "hover:bg-white/10"}`}><Icon size={18}/>{!sideCollapsed && <><span className="flex-1 text-left">{item.title}</span>{open[item.title] ? <ChevronDown size={15}/> : <ChevronRight size={15}/>}</>}</button>{!sideCollapsed && open[item.title] && <div className="ml-7 mt-1 space-y-1">{item.children?.map((child) => <Link key={child.href} href={child.href} className={`block rounded-md px-3 py-2 text-sm ${child.href === activeChildHref ? "bg-white/10 text-sky-300" : "text-slate-400 hover:text-white"}`}>{child.title}</Link>)}</div>}</>}</div>; })}</nav>
    </aside>
    <div className={`lg:transition-all ${collapsed ? "lg:ml-20" : "lg:ml-64"}`}><header className="sticky top-0 z-20 border-b bg-white shadow-sm">
      <div className="flex h-14 items-center gap-2 px-3 lg:h-16 lg:px-6"><button onClick={() => setMobileOpen(true)} className="shrink-0 rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden" aria-label="打开菜单"><Menu size={22}/></button><select value={currentAccountSet.id} onChange={(event) => selectAccountSet(event.target.value)} className="min-w-0 flex-1 truncate rounded-md border px-2 py-2 text-sm font-medium lg:w-auto lg:flex-none lg:max-w-[280px]">{accountSets.map((item) => <option key={item.id} value={item.id}>{item.companyName}</option>)}</select><div className="hidden items-center gap-2 lg:flex"><select value={currentPeriod.year} onChange={(event) => setPeriod(Number(event.target.value), currentPeriod.month)} className="rounded-md border px-2 py-2 text-sm">{years.map((year) => <option key={year}>{year}</option>)}</select><select value={currentPeriod.month} onChange={(event) => setPeriod(currentPeriod.year, Number(event.target.value))} className="rounded-md border px-2 py-2 text-sm">{Array.from({ length: 12 }, (_, index) => index + 1).map((month) => <option key={month} value={month}>第{month}期</option>)}</select></div>
      <div className="flex shrink-0 items-center gap-1 lg:gap-3"><div className="relative"><button onClick={() => setMessages(!messages)} className="rounded-full p-2 hover:bg-slate-100"><Bell size={19}/></button>{messages && <div className="absolute right-0 mt-2 w-72 rounded-lg border bg-white p-4 shadow-xl"><p className="font-medium">消息中心</p><p className="mt-3 text-sm text-slate-500">当前期间凭证尚未结账。</p><p className="mt-2 text-sm text-slate-500">欢迎使用汤圆财税。</p></div>}</div><div className="relative"><button onClick={() => setProfile(!profile)} className="flex items-center gap-2 rounded-full bg-slate-100 px-2 py-2 text-sm lg:px-3"><span className="grid h-7 w-7 place-items-center rounded-full bg-sky-500 text-white">{currentUser?.realName.slice(0, 1)}</span><span className="hidden sm:inline">{currentUser?.realName}</span><ChevronDown size={14} className="hidden sm:block"/></button>{profile && <div className="absolute right-0 mt-2 w-44 rounded-lg border bg-white py-2 shadow-xl">{[["个人设置", "/personal/personal-setting"], ["修改密码", "/personal/change-password"], ["修改手机", "/personal/change-phone-number"], ["绑定微信", "/personal/binding-webchat"]].map(([title, href]) => <Link key={href} href={href} className="block px-4 py-2 text-sm hover:bg-slate-50">{title}</Link>)}<button onClick={async () => { await logout(); router.replace("/login"); }} className="flex w-full items-center gap-2 border-t px-4 py-2 text-sm text-red-600 hover:bg-red-50"><LogOut size={15}/>退出登录</button></div>}</div></div></div>
      <div className="flex items-center gap-2 border-t px-3 py-1.5 lg:hidden"><select value={currentPeriod.year} onChange={(event) => setPeriod(Number(event.target.value), currentPeriod.month)} className="min-w-0 flex-1 rounded-md border px-2 py-2 text-sm">{years.map((year) => <option key={year}>{year}</option>)}</select><select value={currentPeriod.month} onChange={(event) => setPeriod(currentPeriod.year, Number(event.target.value))} className="min-w-0 flex-1 rounded-md border px-2 py-2 text-sm">{Array.from({ length: 12 }, (_, index) => index + 1).map((month) => <option key={month} value={month}>第{month}期</option>)}</select></div>
    </header><main className="p-4 lg:p-6">{children}</main></div>
  </div>;
}
