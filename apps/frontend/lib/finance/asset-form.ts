import type { AssetDepreciationMethod } from "./types";

export type FormDepreciationMethod = AssetDepreciationMethod | "none";
export const methodLabels: Record<FormDepreciationMethod, string> = {
  average: "平均年限法",
  workload: "工作量法",
  "double-declining": "双倍余额递减法",
  "sum-of-years": "年数总和法",
  none: "不折旧",
};
export const methodDescriptions: Record<FormDepreciationMethod, string> = {
  average: "按预计使用期数平均分摊",
  workload: "按实际工作量计提直至提足",
  "double-declining": "前期折旧高逐年递减",
  "sum-of-years": "按剩余年限占总年限和的比例计提",
  none: "不计提折旧",
};
const round2 = (value: number) => Math.round(value * 100) / 100;
export function nextAssetCode(codes: string[]) {
  const width = Math.max(3, ...codes.map((code) => code.length));
  const max = codes.reduce((n, code) => Math.max(n, Number(code) || 0), 0);
  return String(max + 1).padStart(width, "0");
}
export const entryPeriodText = (year: number, month: number) =>
  `${year}年${month}期`;
export const defaultDateForPeriod = (year: number, month: number) =>
  `${year}-${String(month).padStart(2, "0")}-01`;
export const expenseSubjectCodeForDepartment = (department: string) =>
  department === "运输部" || department === "仓储部" ? "6601" : "6602";
export function calculateMonthlyDepreciation(p: {
  method: FormDepreciationMethod;
  usefulLifeMonths: number;
  depreciatedMonths: number;
  originalValue: number;
  residualRate: number;
  openingAccumulatedDepreciation: number;
  impairmentProvision: number;
}) {
  const {
    method,
    usefulLifeMonths: n,
    depreciatedMonths,
    originalValue,
    residualRate,
    openingAccumulatedDepreciation,
    impairmentProvision,
  } = p;
  if (method === "none" || n <= 0) return 0;
  const netDepreciable =
    originalValue * (1 - residualRate / 100) -
    openingAccumulatedDepreciation -
    impairmentProvision;
  if (method === "double-declining")
    return round2(
      ((originalValue - openingAccumulatedDepreciation - impairmentProvision) *
        2) /
        n,
    );
  if (method === "sum-of-years")
    return round2(
      (Math.max(0, n - depreciatedMonths) / ((n * (n + 1)) / 2)) *
        netDepreciable,
    );
  // 工作量法没有工作量字段，使用剩余期数平均分摊作为可解释兜底。
  const remaining = n - depreciatedMonths;
  return remaining > 0 ? round2(netDepreciable / remaining) : 0;
}
export function validateAssetCardForm(values: Record<string, unknown>) {
  const errors: Record<string, string> = {};
  const required = [
    "assetCode",
    "name",
    "categoryCode",
    "department",
    "startUseDate",
    "depreciationMethod",
    "fixedAssetSubjectCode",
    "purchaseCounterpartSubjectCode",
    "accumulatedDepreciationSubjectCode",
    "depreciationExpenseSubjectCode",
  ];
  required.forEach((key) => {
    if (!String(values[key] ?? "").trim()) errors[key] = "此字段为必填项";
  });
  if (!(Number(values.usefulLifeMonths) > 0))
    errors.usefulLifeMonths = "预计期数必须大于0";
  if (
    !Number.isFinite(Number(values.originalValue)) ||
    Number(values.originalValue) < 0
  )
    errors.originalValue = "原值需为不小于0的数字";
  if (
    !Number.isFinite(Number(values.residualRate)) ||
    Number(values.residualRate) < 0 ||
    Number(values.residualRate) > 100
  )
    errors.residualRate = "残值率需在0-100之间";
  if (Number(values.monthlyDepreciation) < 0)
    errors.monthlyDepreciation = "月折旧额需大于等于0";
  if (Number(values.depreciatedMonths) >= Number(values.usefulLifeMonths))
    errors.depreciatedMonths = "已折旧期间需小于预计使用期数";
  if (values.quantity !== undefined && Number(values.quantity) < 1)
    errors.quantity = "数量需大于等于1";
  return errors;
}
export const defaultSubjectCodes = () => ({
  fixedAssetSubjectCode: "1601",
  accumulatedDepreciationSubjectCode: "1602",
  taxSubjectCode: "22210101",
  disposalSubjectCode: "1606",
  impairmentSubjectCode: "1603",
  impairmentCounterpartSubjectCode: "6701",
  purchaseCounterpartSubjectCode: "1002",
});
