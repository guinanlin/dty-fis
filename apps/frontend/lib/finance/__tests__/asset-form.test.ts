import {
  calculateMonthlyDepreciation,
  nextAssetCode,
  validateAssetCardForm,
} from "@/lib/finance/asset-form";

describe("asset form logic", () => {
  test("calculates supported depreciation methods", () => {
    expect(
      calculateMonthlyDepreciation({
        method: "average",
        usefulLifeMonths: 10,
        depreciatedMonths: 2,
        originalValue: 1000,
        residualRate: 10,
        openingAccumulatedDepreciation: 100,
        impairmentProvision: 0,
      }),
    ).toBe(100);
    expect(
      calculateMonthlyDepreciation({
        method: "average",
        usefulLifeMonths: 10,
        depreciatedMonths: 10,
        originalValue: 1000,
        residualRate: 5,
        openingAccumulatedDepreciation: 0,
        impairmentProvision: 0,
      }),
    ).toBe(0);
    expect(
      calculateMonthlyDepreciation({
        method: "none",
        usefulLifeMonths: 10,
        depreciatedMonths: 0,
        originalValue: 1000,
        residualRate: 5,
        openingAccumulatedDepreciation: 0,
        impairmentProvision: 0,
      }),
    ).toBe(0);
    expect(
      calculateMonthlyDepreciation({
        method: "double-declining",
        usefulLifeMonths: 10,
        depreciatedMonths: 0,
        originalValue: 1000,
        residualRate: 5,
        openingAccumulatedDepreciation: 0,
        impairmentProvision: 0,
      }),
    ).toBe(200);
    expect(
      calculateMonthlyDepreciation({
        method: "sum-of-years",
        usefulLifeMonths: 4,
        depreciatedMonths: 1,
        originalValue: 1000,
        residualRate: 0,
        openingAccumulatedDepreciation: 0,
        impairmentProvision: 0,
      }),
    ).toBe(300);
  });
  test("generates codes and validates fields", () => {
    expect(nextAssetCode(["001", "008"])).toBe("009");
    expect(nextAssetCode([])).toBe("001");
    expect(
      validateAssetCardForm({
        originalValue: 1,
        residualRate: 101,
        usefulLifeMonths: 2,
        depreciatedMonths: 2,
        monthlyDepreciation: 0,
      }),
    ).toMatchObject({
      assetCode: "此字段为必填项",
      residualRate: "残值率需在0-100之间",
      depreciatedMonths: "已折旧期间需小于预计使用期数",
    });
    const valid = {
      assetCode: "001",
      name: "电脑",
      categoryCode: "005",
      department: "财务部",
      startUseDate: "2026-10-01",
      depreciationMethod: "average",
      usefulLifeMonths: 36,
      originalValue: 100,
      residualRate: 5,
      monthlyDepreciation: 2,
      fixedAssetSubjectCode: "1601",
      purchaseCounterpartSubjectCode: "1002",
      accumulatedDepreciationSubjectCode: "1602",
      depreciationExpenseSubjectCode: "6602",
    };
    expect(validateAssetCardForm(valid)).toEqual({});
  });
});
