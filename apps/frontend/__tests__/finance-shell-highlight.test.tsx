import { fireEvent, render, screen, within } from "@testing-library/react";
import "@testing-library/jest-dom";
import React from "react";
import { FinanceShell } from "@/components/finance/FinanceShell";

const mockNav = { pathname: "/dashboard" };

jest.mock("next/navigation", () => ({
  usePathname: () => mockNav.pathname,
  useRouter: () => ({ replace: jest.fn(), push: jest.fn(), back: jest.fn() }),
}));

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string }) => <a href={href} {...props}>{children}</a>,
}));

jest.mock("../lib/finance/auth-context", () => ({
  useFinApp: () => ({
    ready: true,
    token: "mock-token-u1",
    currentUser: { id: "u1", username: "admin", realName: "管理员" },
    accountSets: [{ id: "a1", companyName: "杭州云鑫科技有限公司账套" }],
    currentAccountSet: { id: "a1", companyName: "杭州云鑫科技有限公司账套" },
    currentPeriod: { year: 2026, month: 10 },
    selectAccountSet: jest.fn(),
    setPeriod: jest.fn(),
    logout: jest.fn(async () => undefined),
  }),
}));

const matrix: { pathname: string; label: string | null; parent: string | null }[] = [
  { pathname: "/voucher", label: "凭证列表", parent: "凭证" },
  { pathname: "/voucher/form", label: "新增凭证", parent: "凭证" },
  { pathname: "/voucher/form/v-100", label: "凭证列表", parent: "凭证" },
  { pathname: "/voucher-word", label: "凭证字", parent: "设置" },
  { pathname: "/account-book/detailed", label: "明细账", parent: "帐薄" },
  { pathname: "/account-book/general-ledger", label: "总账", parent: "帐薄" },
  { pathname: "/account-book/subject-balance", label: "科目余额", parent: "帐薄" },
  { pathname: "/account-book/subject-summary", label: "科目汇总", parent: "帐薄" },
  { pathname: "/account-book/auxiliary-accounting-detail", label: "核算项目明细账", parent: "帐薄" },
  { pathname: "/account-book/auxiliary-accounting-balance", label: "核算项目余额", parent: "帐薄" },
  { pathname: "/report", label: "报表", parent: null },
  { pathname: "/report/view/1", label: "报表", parent: null },
  { pathname: "/report/template", label: "报表", parent: null },
  { pathname: "/report/template/form/new", label: "报表", parent: null },
  { pathname: "/report/template/form/tpl-9", label: "报表", parent: null },
  { pathname: "/check-out/list", label: "结账", parent: null },
  { pathname: "/check-out/un-check", label: "结账", parent: null },
  { pathname: "/check-out/carry-forward/2025/1", label: "结账", parent: null },
  { pathname: "/check-out/check/2025/1", label: "结账", parent: null },
  { pathname: "/account", label: "账套", parent: "设置" },
  { pathname: "/subject", label: "科目", parent: "设置" },
  { pathname: "/initial", label: "期初", parent: "设置" },
  { pathname: "/currency", label: "币别", parent: "设置" },
  { pathname: "/assisting-accounting/accounting-category", label: "辅助核算", parent: "设置" },
  { pathname: "/permission-setting", label: "权限设置", parent: "设置" },
  { pathname: "/assisting-accounting/custom/cat-1", label: "辅助核算", parent: "设置" },
  { pathname: "/dashboard", label: "主页", parent: null },
  { pathname: "/template/manager", label: null, parent: null },
  { pathname: "/template/design", label: null, parent: null },
];

function classTokens(element: Element) {
  return element.getAttribute("class")?.split(/\s+/) ?? [];
}

function highlightedLinks(nav: HTMLElement) {
  return within(nav)
    .getAllByRole("link")
    .filter((link) => {
      const tokens = classTokens(link);
      return tokens.includes("bg-sky-500") || (tokens.includes("bg-white/10") && tokens.includes("text-sky-300"));
    });
}

function litGroups(nav: HTMLElement) {
  return within(nav)
    .getAllByRole("button")
    .filter((button) => classTokens(button).includes("text-sky-300"))
    .map((button) => button.textContent?.trim() ?? "");
}

describe("FinanceShell menu highlight", () => {
  it.each(matrix)("$pathname highlights $label", ({ pathname, label, parent }) => {
    mockNav.pathname = pathname;
    const view = render(<FinanceShell><div>content</div></FinanceShell>);
    const nav = screen.getByRole("navigation");
    const active = highlightedLinks(nav);
    if (!label) {
      expect(active).toHaveLength(0);
      expect(litGroups(nav)).toEqual([]);
    } else {
      expect(active).toHaveLength(1);
      expect(active[0]).toHaveAccessibleName(label);
      expect(litGroups(nav)).toEqual(parent ? [parent] : []);
    }
    view.unmount();
  });

  it("keeps a single child highlighted after clicking a submenu link", () => {
    mockNav.pathname = "/account-book/detailed";
    render(<FinanceShell><div>content</div></FinanceShell>);
    const nav = screen.getByRole("navigation");
    fireEvent.click(within(nav).getByRole("link", { name: /^明细账$/ }));
    fireEvent.click(within(nav).getByRole("link", { name: /^总账$/ }));
    const active = highlightedLinks(nav);
    expect(active).toHaveLength(1);
    expect(active[0]).toHaveAccessibleName("明细账");
    expect(litGroups(nav)).toEqual(["帐薄"]);
  });

  it("highlights only the submenu the click navigates to", () => {
    mockNav.pathname = "/voucher";
    const view = render(<FinanceShell><div>content</div></FinanceShell>);
    const nav = screen.getByRole("navigation");
    fireEvent.click(within(nav).getByRole("link", { name: /^新增凭证$/ }));
    mockNav.pathname = "/voucher/form";
    view.rerender(<FinanceShell><div>content</div></FinanceShell>);
    const active = highlightedLinks(screen.getByRole("navigation"));
    expect(active).toHaveLength(1);
    expect(active[0]).toHaveAccessibleName("新增凭证");
    expect(litGroups(screen.getByRole("navigation"))).toEqual(["凭证"]);
  });

  it("reopens a collapsed group when the pathname enters that group", () => {
    mockNav.pathname = "/voucher";
    const view = render(<FinanceShell><div>content</div></FinanceShell>);
    const nav = screen.getByRole("navigation");
    fireEvent.click(within(nav).getByRole("button", { name: /^凭证$/ }));
    expect(within(nav).queryByRole("link", { name: /^凭证列表$/ })).not.toBeInTheDocument();
    mockNav.pathname = "/voucher/form/v-100";
    view.rerender(<FinanceShell><div>content</div></FinanceShell>);
    const nextNav = screen.getByRole("navigation");
    expect(within(nextNav).getByRole("link", { name: /^凭证列表$/ })).toBeInTheDocument();
    const active = highlightedLinks(nextNav);
    expect(active).toHaveLength(1);
    expect(active[0]).toHaveAccessibleName("凭证列表");
  });

  it("starts with all groups collapsed on a standalone page", () => {
    mockNav.pathname = "/dashboard";
    render(<FinanceShell><div>content</div></FinanceShell>);
    const nav = screen.getByRole("navigation");
    expect(within(nav).queryByRole("link", { name: /^凭证列表$/ })).not.toBeInTheDocument();
    expect(within(nav).queryByRole("link", { name: /^明细账$/ })).not.toBeInTheDocument();
    expect(within(nav).queryByRole("link", { name: /^账套$/ })).not.toBeInTheDocument();
  });

  it("opens only the current-route group", () => {
    mockNav.pathname = "/voucher";
    render(<FinanceShell><div>content</div></FinanceShell>);
    const nav = screen.getByRole("navigation");
    expect(within(nav).getByRole("link", { name: /^凭证列表$/ })).toBeInTheDocument();
    expect(within(nav).queryByRole("link", { name: /^明细账$/ })).not.toBeInTheDocument();
    expect(within(nav).queryByRole("link", { name: /^账套$/ })).not.toBeInTheDocument();
    expect(litGroups(nav)).toEqual(["凭证"]);
  });

  it("uses accordion behavior for manual toggles", () => {
    mockNav.pathname = "/voucher";
    render(<FinanceShell><div>content</div></FinanceShell>);
    const nav = screen.getByRole("navigation");
    fireEvent.click(within(nav).getByRole("button", { name: /^设置$/ }));
    expect(within(nav).getByRole("link", { name: /^账套$/ })).toBeInTheDocument();
    expect(within(nav).queryByRole("link", { name: /^凭证列表$/ })).not.toBeInTheDocument();
  });

  it("collapses all groups when navigating to a standalone page", () => {
    mockNav.pathname = "/account";
    const view = render(<FinanceShell><div>content</div></FinanceShell>);
    mockNav.pathname = "/report";
    view.rerender(<FinanceShell><div>content</div></FinanceShell>);
    const nav = screen.getByRole("navigation");
    expect(within(nav).queryByRole("link", { name: /^凭证列表$/ })).not.toBeInTheDocument();
    expect(within(nav).queryByRole("link", { name: /^明细账$/ })).not.toBeInTheDocument();
    expect(within(nav).queryByRole("link", { name: /^账套$/ })).not.toBeInTheDocument();
  });
});
