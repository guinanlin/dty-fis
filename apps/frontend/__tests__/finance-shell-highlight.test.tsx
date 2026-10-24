import { resolveActiveMenu } from "@/components/finance/active-menu";
describe("FinanceShell menu resolution", () => {
  const item = { title: "凭证", children: [{ title: "列表", href: "/voucher" }, { title: "新增", href: "/voucher/form" }] };
  it("prefers exact child routes", () => { expect(resolveActiveMenu("/voucher", item).activeChildHref).toBe("/voucher"); });
  it("falls back to the parent route for nested form routes", () => { expect(resolveActiveMenu("/voucher/form/1", item).activeChildHref).toBe("/voucher"); });
  it("does not activate unrelated routes", () => { expect(resolveActiveMenu("/report", item).active).toBe(false); });
});
