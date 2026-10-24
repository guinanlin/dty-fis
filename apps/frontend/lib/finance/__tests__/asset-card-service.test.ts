import { asset } from "@/lib/finance/service";

test("creates an asset card without applying legacy save defaults", async () => {
  const card = await asset.cards.create({
    accountSetId: "a1",
    code: "009",
    name: "测试资产",
    categoryCode: "005",
    department: "财务部",
    startUseDate: "2026-10-01",
    originalValue: 1000,
    openingAccumulatedDepreciation: 100,
    impairmentProvision: 20,
    usefulLifeMonths: 36,
    depreciatedMonths: 2,
    monthlyDepreciation: 24.44,
    residualRate: 5,
    location: "测试地点",
    fixedAssetSubjectCode: "1601",
    purchaseCounterpartSubjectCode: "1002",
    accumulatedDepreciationSubjectCode: "1602",
    depreciationExpenseSubjectCode: "6602",
  });
  const rows = await asset.cards.list("a1", { includeCleared: true });
  expect(rows).toContainEqual(
    expect.objectContaining({
      code: "009",
      netValue: 880,
      monthlyDepreciation: 24.44,
      status: "使用中",
    }),
  );
  expect(card.residualValue).toBe(50);
});
