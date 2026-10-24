import { asset } from "@/lib/finance/service";
import { assetCards } from "@/lib/finance/seed";

describe("fixed assets", () => {
  it("calculates straight-line monthly depreciation", () => {
    expect(asset.calculateMonthlyDepreciation(20000, 48, 5)).toBe(395.83);
    expect(asset.calculateMonthlyDepreciation(3000, 60, 5)).toBe(47.5);
    expect(asset.calculateMonthlyDepreciation(4000, 36, 5)).toBe(105.56);
  });
  it("applies addition, disposal and fully depreciated rules", () => {
    const base = assetCards.find((x) => x.accountSetId === "a1" && x.code === "001")!;
    expect(asset.periodDepreciation({ ...base, startUseDate: "2026-10-01" }, 2026, 10)).toBe(0);
    expect(asset.periodDepreciation({ ...base, startUseDate: "2026-09-01" }, 2026, 10)).toBe(base.monthlyDepreciation);
    expect(asset.periodDepreciation({ ...base, endingAccumulatedDepreciation: base.originalValue - base.residualValue }, 2026, 10)).toBe(0);
    expect(asset.periodDepreciation({ ...base, status: "已清理" }, 2026, 10)).toBe(0);
  });
  it("generates a balanced voucher, blocks duplicates and regenerates after deletion", async () => {
    const year = 2099; const month = 1; const created = await asset.generateDepreciationVoucher("a1", year, month);
    const debit = created.details.reduce((sum, x) => sum + x.debitAmount, 0); const credit = created.details.reduce((sum, x) => sum + x.creditAmount, 0);
    expect(debit).toBeGreaterThan(0); expect(debit).toBe(credit);
    await expect(asset.generateDepreciationVoucher("a1", year, month)).rejects.toThrow("已生成");
    await expect(asset.deleteDepreciationVoucher("a1", year, month)).resolves.toBe(true);
    await expect(asset.generateDepreciationVoucher("a1", year, month)).resolves.toBeTruthy(); await asset.deleteDepreciationVoucher("a1", year, month);
  });
  it("keeps report reconciliation", async () => {
    const row = (await asset.report("a1", 2098, 12)).find((x) => x.code === "001")!;
    expect(row.endingAccumulatedDepreciation).toBe(row.openingAccumulatedDepreciation + row.currentDepreciation);
    expect(row.netValue).toBe(row.originalValue - row.endingAccumulatedDepreciation - row.impairmentProvision);
  });
});
