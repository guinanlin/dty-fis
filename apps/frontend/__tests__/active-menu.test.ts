import { resolveActiveMenu, type FinanceMenuItem } from "@/components/finance/active-menu";

const menus = [
  { title: "主页", href: "/dashboard" },
  { title: "凭证", children: [{ title: "新增凭证", href: "/voucher/form" }, { title: "凭证列表", href: "/voucher" }] },
  {
    title: "帐薄",
    children: [
      { title: "明细账", href: "/account-book/detailed" },
      { title: "总账", href: "/account-book/general-ledger" },
      { title: "科目余额", href: "/account-book/subject-balance" },
      { title: "科目汇总", href: "/account-book/subject-summary" },
      { title: "核算项目明细账", href: "/account-book/auxiliary-accounting-detail" },
      { title: "核算项目余额", href: "/account-book/auxiliary-accounting-balance" },
    ],
  },
  { title: "报表", href: "/report" },
  { title: "结账", href: "/check-out/list", match: "/check-out/" },
  {
    title: "设置",
    children: [
      { title: "账套", href: "/account" },
      { title: "科目", href: "/subject" },
      { title: "期初", href: "/initial" },
      { title: "币别", href: "/currency" },
      { title: "凭证字", href: "/voucher-word" },
      { title: "辅助核算", href: "/assisting-accounting/accounting-category", match: "/assisting-accounting/" },
      { title: "权限设置", href: "/permission-setting" },
    ],
  },
] satisfies FinanceMenuItem[];

type Expectation = { pathname: string; activeTitle: string | null; activeChildHref: string | null };

const matrix: Expectation[] = [
  { pathname: "/voucher", activeTitle: "凭证", activeChildHref: "/voucher" },
  { pathname: "/voucher/form", activeTitle: "凭证", activeChildHref: "/voucher/form" },
  { pathname: "/voucher/form/v-100", activeTitle: "凭证", activeChildHref: "/voucher" },
  { pathname: "/voucher-word", activeTitle: "设置", activeChildHref: "/voucher-word" },
  { pathname: "/account-book/detailed", activeTitle: "帐薄", activeChildHref: "/account-book/detailed" },
  { pathname: "/account-book/general-ledger", activeTitle: "帐薄", activeChildHref: "/account-book/general-ledger" },
  { pathname: "/account-book/subject-balance", activeTitle: "帐薄", activeChildHref: "/account-book/subject-balance" },
  { pathname: "/account-book/subject-summary", activeTitle: "帐薄", activeChildHref: "/account-book/subject-summary" },
  { pathname: "/account-book/auxiliary-accounting-detail", activeTitle: "帐薄", activeChildHref: "/account-book/auxiliary-accounting-detail" },
  { pathname: "/account-book/auxiliary-accounting-balance", activeTitle: "帐薄", activeChildHref: "/account-book/auxiliary-accounting-balance" },
  { pathname: "/report", activeTitle: "报表", activeChildHref: null },
  { pathname: "/report/view/1", activeTitle: "报表", activeChildHref: null },
  { pathname: "/report/template", activeTitle: "报表", activeChildHref: null },
  { pathname: "/report/template/form/new", activeTitle: "报表", activeChildHref: null },
  { pathname: "/report/template/form/tpl-9", activeTitle: "报表", activeChildHref: null },
  { pathname: "/check-out/list", activeTitle: "结账", activeChildHref: null },
  { pathname: "/check-out/un-check", activeTitle: "结账", activeChildHref: null },
  { pathname: "/check-out/carry-forward/2025/1", activeTitle: "结账", activeChildHref: null },
  { pathname: "/check-out/check/2025/1", activeTitle: "结账", activeChildHref: null },
  { pathname: "/account", activeTitle: "设置", activeChildHref: "/account" },
  { pathname: "/subject", activeTitle: "设置", activeChildHref: "/subject" },
  { pathname: "/initial", activeTitle: "设置", activeChildHref: "/initial" },
  { pathname: "/currency", activeTitle: "设置", activeChildHref: "/currency" },
  { pathname: "/assisting-accounting/accounting-category", activeTitle: "设置", activeChildHref: "/assisting-accounting/accounting-category" },
  { pathname: "/permission-setting", activeTitle: "设置", activeChildHref: "/permission-setting" },
  { pathname: "/assisting-accounting/custom/cat-1", activeTitle: "设置", activeChildHref: "/assisting-accounting/accounting-category" },
  { pathname: "/dashboard", activeTitle: "主页", activeChildHref: null },
  { pathname: "/template/manager", activeTitle: null, activeChildHref: null },
  { pathname: "/template/design", activeTitle: null, activeChildHref: null },
];

function resolveAll(pathname: string) {
  return menus.map((item) => ({ item, result: resolveActiveMenu(pathname, item) }));
}

describe("resolveActiveMenu", () => {
  it.each(matrix)("$pathname highlights $activeTitle $activeChildHref", ({ pathname, activeTitle, activeChildHref }) => {
    const resolved = resolveAll(pathname);
    const active = resolved.filter((entry) => entry.result.active);
    expect(active.map((entry) => entry.item.title)).toEqual(activeTitle ? [activeTitle] : []);
    const childHrefs = resolved.map((entry) => entry.result.activeChildHref).filter((href): href is string => href !== null);
    expect(childHrefs).toEqual(activeChildHref ? [activeChildHref] : []);
    for (const entry of resolved) {
      if (!entry.item.children) {
        expect(entry.result.activeChildHref).toBeNull();
        continue;
      }
      const lit = entry.item.children.filter((child) => child.href === entry.result.activeChildHref);
      expect(lit.length).toBeLessThanOrEqual(1);
      expect(entry.result.active).toBe(entry.result.activeChildHref !== null);
    }
  });

  it("does not light 凭证 from /voucher-word or 设置 from /account-book/detailed", () => {
    expect(resolveActiveMenu("/voucher-word", menus[1])).toEqual({ active: false, activeChildHref: null });
    expect(resolveActiveMenu("/voucher", menus.find((item) => item.title === "设置")!)).toEqual({ active: false, activeChildHref: null });
    expect(resolveActiveMenu("/account-book/detailed", menus.find((item) => item.title === "设置")!)).toEqual({ active: false, activeChildHref: null });
    expect(resolveActiveMenu("/account", menus.find((item) => item.title === "帐薄")!)).toEqual({ active: false, activeChildHref: null });
  });
});
