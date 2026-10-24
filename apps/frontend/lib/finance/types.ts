export type Role = "Manager" | "Making" | "View";
export type BalanceDirection = "借" | "贷";
export type VoucherStatus = "draft" | "audited" | "posted" | "void";
export type CheckStatus = "open" | "closed";

export type AssetDepreciationMethod =
  | "average"
  | "workload"
  | "double-declining"
  | "sum-of-years";
export interface AssetCategory {
  id: string;
  accountSetId: string;
  code: string;
  name: string;
  depreciationMethod: AssetDepreciationMethod;
  usefulLifeMonths: number;
  residualRate: number;
  fixedAssetSubjectCode: string;
  accumulatedDepreciationSubjectCode: string;
  remark?: string;
}
export interface AssetCard {
  id: string;
  accountSetId: string;
  code: string;
  name: string;
  categoryCode: string;
  department: string;
  startUseDate: string;
  entryPeriod: string;
  originalValue: number;
  openingAccumulatedDepreciation: number;
  endingAccumulatedDepreciation: number;
  monthlyDepreciation: number;
  usefulLifeMonths: number;
  depreciatedMonths: number;
  residualValue: number;
  impairmentProvision: number;
  netValue: number;
  depreciationExpenseSubject: string;
  status: "使用中" | "已清理";
  acquisitionMethod: "购入" | "自建" | "投资投入" | "盘盈";
  location: string;
  remark?: string;
}
export interface AssetChangeRecord {
  id: string;
  accountSetId: string;
  assetCode: string;
  assetName: string;
  changeItem: string;
  beforeValue: string;
  afterValue: string;
  period: string;
  modifier: string;
  changedAt: string;
}

export interface User {
  id: string;
  username: string;
  password: string;
  realName: string;
  mobile: string;
  email: string;
  avatarUrl?: string;
}

export interface Permission {
  userId: string;
  accountSetId: string;
  role: Role;
}

export interface AccountSet {
  id: string;
  companyName: string;
  creditCode: string;
  accountingStandards: string;
  industry: string;
  vatType: string;
  address: string;
  enableDate: string;
  currentPeriod: { year: number; month: number };
  encoding: string;
  voucherReviewed: boolean;
  creatorId: string;
  enabled?: boolean;
}

export interface AccountSetPeriod {
  id: string;
  accountSetId: string;
  year: number;
  month: number;
  status: CheckStatus;
  closedAt?: string;
}

export interface Subject {
  id: string;
  accountSetId: string;
  code: string;
  name: string;
  category: "资产" | "负债" | "权益" | "成本" | "损益";
  balanceDirection: BalanceDirection;
  level: number;
  parentId?: string;
  unit?: string;
  assistAccountingIds: string[];
  status: boolean;
  systemDefault: boolean;
}

export interface VoucherDetail {
  id: string;
  voucherId: string;
  summary: string;
  subjectId: string;
  subjectCode: string;
  subjectName: string;
  subjectPath?: string;
  balanceDirection?: BalanceDirection;
  debitAmount: number;
  creditAmount: number;
  assistAccountings: Record<string, string>;
  currencyId: string;
  exchangeRate: number;
  quantity?: number;
  price?: number;
}

export interface VoucherQuery {
  accountSetId: string;
  page?: number;
  size?: number;
  periodYear?: number;
  periodMonth?: number;
  wordId?: string;
  keyword?: string;
  status?: VoucherStatus | "all";
}

export interface VoucherInput extends Omit<
  Voucher,
  "id" | "number" | "details"
> {
  id?: string;
  number?: number;
  details: Array<
    Omit<VoucherDetail, "id" | "voucherId"> & {
      id?: string;
      voucherId?: string;
    }
  >;
}

export interface Voucher {
  id: string;
  accountSetId: string;
  voucherWordId: string;
  word: string;
  number: number;
  year: number;
  month: number;
  date: string;
  attachmentCount: number;
  status: VoucherStatus;
  sourceType: "manual" | "carry-forward" | "import";
  remark?: string;
  createdBy: string;
  auditedBy?: string;
  details: VoucherDetail[];
}

export interface SubjectBalance {
  id: string;
  accountSetId: string;
  subjectId: string;
  year: number;
  month: number;
  openingDebit: number;
  openingCredit: number;
  currentDebit: number;
  currentCredit: number;
  endingDebit: number;
  endingCredit: number;
  quantity?: number;
}

export interface SubjectBalanceRow {
  id: string;
  subjectId: string;
  subjectCode: string;
  subjectName: string;
  category: Subject["category"];
  balanceDirection: BalanceDirection;
  level: number;
  openingDebit: number;
  openingCredit: number;
  periodDebit: number;
  periodCredit: number;
  closingDebit: number;
  closingCredit: number;
}

export interface LedgerLine {
  id: string;
  voucherId?: string;
  date: string;
  voucherLabel: string;
  summary: string;
  subjectId: string;
  subjectCode: string;
  subjectName: string;
  debitAmount: number;
  creditAmount: number;
  direction: BalanceDirection;
  balance: number;
}

export interface GeneralLedgerRow extends SubjectBalanceRow {
  year: number;
  month: number;
  summary: "期初余额" | "本期合计" | "本年累计" | "期末余额";
}

export interface SubjectSummaryRow {
  id: string;
  word: string;
  voucherCount: number;
  debitAmount: number;
  creditAmount: number;
}

export interface AssistBalanceRow extends SubjectBalanceRow {
  assistValueId: string;
  assistCode: string;
  assistName: string;
}

export interface Currency {
  id: string;
  accountSetId: string;
  code: string;
  name: string;
  exchangeRate: number;
  isBase: boolean;
}

export interface VoucherWord {
  id: string;
  accountSetId: string;
  name: string;
  word: string;
  printTitle: string;
  isDefault: boolean;
  annualNumbering: boolean;
}

export interface AssistingCategory {
  id: string;
  accountSetId: string;
  name: string;
  systemDefault: boolean;
  customColumns: string[];
}

export interface AssistingValue {
  id: string;
  categoryId: string;
  code: string;
  name: string;
  remark?: string;
  customValues: Record<string, string>;
}

export interface InitialBalance {
  id: string;
  accountSetId: string;
  subjectId: string;
  debitAmount: number;
  creditAmount: number;
  cumulativeDebit: number;
  cumulativeCredit: number;
  quantity?: number;
  assistValueIds: string[];
}

export interface ReportFormula {
  subjectCodes: string[];
  operation: "+" | "-";
  accessRule: "net" | "debit" | "credit" | "balance";
}

export interface ReportCell {
  id: string;
  title: string;
  lineNumber: number;
  level: number;
  bold: boolean;
  formulas: ReportFormula[];
}

export interface ReportTemplate {
  id: string;
  accountSetId: string;
  name: string;
  type: "balance-sheet" | "profit" | "cash-flow";
  cells: ReportCell[];
}

export type ReportCategory =
  | "资产负债表"
  | "利润表"
  | "现金流量表"
  | "所有者权益变动表";

export interface ReportRow {
  id: string;
  lineCode: number;
  lineName: string;
  section: string;
  periodAmount: number;
  priorAmount: number;
  level: number;
  emphasis?: boolean;
}

export interface ReportListItem {
  id: string;
  reportId: number;
  name: ReportCategory;
  year: number;
  month: number;
  status: "已生成" | "未生成";
  generatedAt?: string;
}

export interface ReportTemplateItem {
  id: string;
  rowCode: number;
  rowTitle: string;
  level: number;
  section: string;
  formula: string;
  valueType: "期初余额" | "期末余额" | "本期发生额" | "上年同期" | "表内公式";
}

export interface FinanceReportTemplate {
  id: string;
  accountSetId: string;
  name: string;
  category: ReportCategory;
  description: string;
  items: ReportTemplateItem[];
}

export interface VoucherTemplateDetail {
  id: string;
  summary: string;
  subjectId: string;
  subjectCode: string;
  subjectName: string;
  debitAmount: number;
  creditAmount: number;
  amountEditable: boolean;
}

export interface VoucherTemplate {
  id: string;
  accountSetId: string;
  name: string;
  type: "日常支出" | "采购" | "销售" | "工资" | "税金" | "折旧和摊销";
  details: VoucherTemplateDetail[];
}

export interface AccountSetUser {
  user: User;
  role: Role;
}

export interface HomeDashboard {
  voucherCount: number;
  cashData: Array<{ name: string; value: number }>;
  costData: Array<{ name: string; value: number }>;
  revenueProfitByMonth: Array<{
    month: number;
    主营业务收入: number;
    本年利润: number;
  }>;
}

export interface PageResult<T> {
  content: T[];
  page: number;
  size: number;
  total: number;
  totalPages: number;
}

export interface CheckoutCheckRow {
  key: "opening" | "balance" | "report" | "number" | "audit" | "profit";
  name: string;
  passed: boolean;
  message: string;
}

export interface CarryForwardItem {
  subjectId: string;
  subjectCode: string;
  subjectName: string;
  debitAmount: number;
  creditAmount: number;
  netAmount: number;
}

export type InvoiceTab = "output" | "input" | "receipt";
export type InvoiceStatus = "正常" | "作废" | "红冲";
export interface InvoiceLine {
  name: string;
  model: string;
  unit: string;
  quantity: number;
  price: number;
  amount: number;
  taxRate: number;
  tax: number;
}
export interface Invoice {
  id: string;
  accountSetId: string;
  tab: InvoiceTab;
  date: string;
  type: string;
  code: string;
  number: string;
  digitalNumber?: string;
  partner: string;
  amount: number;
  tax: number;
  total: number;
  status: InvoiceStatus;
  imageUrl?: string;
  templateId?: string;
  voucherId?: string;
  certification?: "未勾选" | "已勾选" | "已认证";
  certificationPeriod?: string;
  lines: InvoiceLine[];
  remark?: string;
}
export interface InvoiceTemplate {
  id: string;
  accountSetId: string;
  tab: InvoiceTab;
  name: string;
  isDefault: boolean;
  description: string;
  entries: Array<{
    direction: BalanceDirection;
    subjectCode: string;
    subjectName: string;
    formula: "amount" | "tax" | "total";
  }>;
}
export interface TaxBurdenInput {
  unbilled: number;
  deductions: number;
  otherOutput: number;
  otherInput: number;
  transferOut: number;
  unclaimedInput: number;
  openingCredit: number;
  relief: number;
  creditItems: number;
  customItems: number;
  targetRate: number;
}
export interface TaxBurdenResult {
  outputTax: number;
  inputTax: number;
  payable: number;
  endingCredit: number;
  rate: number;
  surcharge: number;
  salesAmount: number;
}
