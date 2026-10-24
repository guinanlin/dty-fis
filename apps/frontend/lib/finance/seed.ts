import type {
  AccountSet,
  AccountSetPeriod,
  AssistingCategory,
  AssistingValue,
  Currency,
  HomeDashboard,
  FinanceReportTemplate,
  InitialBalance,
  Permission,
  ReportTemplate,
  Subject,
  SubjectBalance,
  User,
  Voucher,
  VoucherTemplate,
  VoucherWord,
  Invoice,
  InvoiceTemplate,
  AssetCategory,
  AssetCard,
  AssetChangeRecord,
} from "./types";

const now = new Date();
export const currentPeriod = {
  year: now.getFullYear(),
  month: now.getMonth() + 1,
};

export const users: User[] = [
  {
    id: "u1",
    username: "admin",
    password: "123456",
    realName: "管理员",
    mobile: "13800000001",
    email: "admin@ty.local",
  },
  {
    id: "u2",
    username: "张三",
    password: "123456",
    realName: "张三",
    mobile: "13800000002",
    email: "zhangsan@ty.local",
  },
  {
    id: "u3",
    username: "李四",
    password: "123456",
    realName: "李四",
    mobile: "13800000003",
    email: "lisi@ty.local",
  },
];

export const accountSets: AccountSet[] = [
  {
    id: "a1",
    companyName: "杭州云鑫科技有限公司账套",
    creditCode: "91330100MA2FXY001",
    accountingStandards: "小企业会计准则",
    industry: "IT·通信·电子·互联网",
    vatType: "小规模纳税人",
    address: "浙江省杭州市",
    enableDate: "2024-01-01",
    currentPeriod,
    encoding: "4-2-2-2",
    voucherReviewed: true,
    creatorId: "u1",
  },
  {
    id: "a2",
    companyName: "上海澜海贸易有限公司",
    creditCode: "91310100MA2FXY002",
    accountingStandards: "小企业会计准则",
    industry: "贸易·批发·零售·租赁业",
    vatType: "一般纳税人",
    address: "上海市浦东新区",
    enableDate: "2025-01-01",
    currentPeriod,
    encoding: "4-2-2-2",
    voucherReviewed: true,
    creatorId: "u1",
  },
  {
    id: "a3",
    companyName: "深圳星辰网络科技有限公司",
    creditCode: "91440300MA2FXY003",
    accountingStandards: "企业会计准则",
    industry: "IT·通信·电子·互联网",
    vatType: "一般纳税人",
    address: "广东省深圳市",
    enableDate: "2025-06-01",
    currentPeriod,
    encoding: "4-2-2-2",
    voucherReviewed: false,
    creatorId: "u2",
  },
];

export const assetCategories: AssetCategory[] = accountSets.flatMap((a) =>
  [
    "房屋建筑物",
    "机器机械生产设备",
    "器具工具家具",
    "运输工具",
    "电子设备",
    "其他固定资产",
  ].map((name, i) => ({
    id: `${a.id}-asset-cat-${i + 1}`,
    accountSetId: a.id,
    code: `00${i + 1}`,
    name,
    depreciationMethod: "average" as const,
    usefulLifeMonths: [240, 120, 60, 48, 36, 60][i],
    residualRate: 5,
    fixedAssetSubjectCode: "1601",
    accumulatedDepreciationSubjectCode: "1602",
  })),
);
const assetSpecs = [
  ["001", "拖车", "004", "运输部", "2021-10-01", 20000, 9104.09, 395.83, 48],
  ["002", "货车", "004", "运输部", "2022-01-01", 100000, 0, 1979.17, 48],
  ["003", "办公桌", "003", "仓储部", "2023-01-01", 3000, 0, 50, 60],
  ["004", "电脑", "005", "财务部", "2023-01-01", 4000, 0, 105.56, 36],
  ["005", "拖车", "004", "运输部", "2023-02-01", 20000, 0, 395.83, 48],
  ["006", "拖车", "004", "运输部", "2023-03-01", 20000, 0, 395.83, 48],
  ["007", "拖车", "004", "运输部", "2023-04-01", 20000, 0, 395.83, 48],
  ["008", "办公桌", "003", "仓储部", "2023-01-01", 6000, 0, 100, 60],
] as const;
export const assetCards: AssetCard[] = accountSets.flatMap((a) =>
  assetSpecs.map(
    ([
      code,
      name,
      categoryCode,
      department,
      startUseDate,
      originalValue,
      openingAccumulatedDepreciation,
      monthlyDepreciation,
      usefulLifeMonths,
    ]) => ({
      id: `${a.id}-asset-${code}`,
      accountSetId: a.id,
      code,
      name,
      categoryCode,
      department,
      startUseDate,
      entryPeriod: `${currentPeriod.year}-${String(currentPeriod.month).padStart(2, "0")}`,
      originalValue,
      openingAccumulatedDepreciation,
      endingAccumulatedDepreciation: openingAccumulatedDepreciation,
      monthlyDepreciation,
      usefulLifeMonths,
      depreciatedMonths: Math.floor(
        openingAccumulatedDepreciation / monthlyDepreciation,
      ),
      residualValue: originalValue * 0.05,
      impairmentProvision: 0,
      netValue: originalValue - openingAccumulatedDepreciation,
      depreciationExpenseSubject: "6602 管理费用-折旧",
      status: "使用中",
      acquisitionMethod: "购入",
      location: "杭州仓库",
    }),
  ),
);
export const assetChanges: AssetChangeRecord[] = assetCards
  .filter((a) => a.accountSetId === "a1")
  .slice(0, 3)
  .map((a, i) => ({
    id: `${a.id}-change-${i}`,
    accountSetId: a.accountSetId,
    assetCode: a.code,
    assetName: a.name,
    changeItem: "原值调整",
    beforeValue: String(a.originalValue),
    afterValue: String(a.originalValue),
    period: `${currentPeriod.year}-${String(currentPeriod.month).padStart(2, "0")}`,
    modifier: "管理员",
    changedAt: new Date().toISOString(),
  }));

export const permissions: Permission[] = [
  { userId: "u1", accountSetId: "a1", role: "Manager" },
  { userId: "u1", accountSetId: "a2", role: "Manager" },
  { userId: "u2", accountSetId: "a1", role: "Making" },
  { userId: "u2", accountSetId: "a3", role: "Manager" },
  { userId: "u3", accountSetId: "a1", role: "View" },
  { userId: "u3", accountSetId: "a2", role: "Making" },
];

const subjectRows: Array<
  [string, string, Subject["category"], Subject["balanceDirection"], string?]
> = [
  ["1001", "库存现金", "资产", "借"],
  ["1002", "银行存款", "资产", "借"],
  ["1012", "其他货币资金", "资产", "借"],
  ["1101", "交易性金融资产", "资产", "借"],
  ["1121", "应收票据", "资产", "借"],
  ["1122", "应收账款", "资产", "借"],
  ["1123", "预付账款", "资产", "借"],
  ["1131", "应收股利", "资产", "借"],
  ["1221", "其他应收款", "资产", "借"],
  ["1401", "材料采购", "资产", "借"],
  ["1403", "原材料", "资产", "借"],
  ["1405", "库存商品", "资产", "借", "件"],
  ["1601", "固定资产", "资产", "借"],
  ["1602", "累计折旧", "资产", "贷"],
  ["1603", "固定资产减值准备", "资产", "借"],
  ["1606", "固定资产清理", "资产", "借"],
  ["1701", "无形资产", "资产", "借"],
  ["2001", "短期借款", "负债", "贷"],
  ["2201", "应付票据", "负债", "贷"],
  ["2202", "应付账款", "负债", "贷"],
  ["2203", "预收账款", "负债", "贷"],
  ["2211", "应付职工薪酬", "负债", "贷"],
  ["2221", "应交税费", "负债", "贷"],
  ["22210101", "应交税费—应交增值税（进项税额）", "负债", "贷"],
  ["2241", "其他应付款", "负债", "贷"],
  ["2501", "长期借款", "负债", "贷"],
  ["4001", "实收资本", "权益", "贷"],
  ["4002", "资本公积", "权益", "贷"],
  ["4101", "盈余公积", "权益", "贷"],
  ["4103", "本年利润", "权益", "贷"],
  ["4104", "利润分配", "权益", "贷"],
  ["5001", "生产成本", "成本", "借"],
  ["5101", "制造费用", "成本", "借"],
  ["6001", "主营业务收入", "损益", "贷"],
  ["6051", "其他业务收入", "损益", "贷"],
  ["6111", "投资收益", "损益", "贷"],
  ["6301", "营业外收入", "损益", "贷"],
  ["6401", "主营业务成本", "损益", "借"],
  ["6402", "其他业务成本", "损益", "借"],
  ["6403", "税金及附加", "损益", "借"],
  ["6601", "销售费用", "损益", "借"],
  ["6602", "管理费用", "损益", "借"],
  ["6603", "财务费用", "损益", "借"],
  ["6711", "营业外支出", "损益", "借"],
  ["6701", "资产减值损失", "损益", "借"],
  ["6801", "所得税费用", "损益", "借"],
];

export const subjects: Subject[] = accountSets.flatMap((accountSet) =>
  subjectRows.map(([code, name, category, balanceDirection, unit]) => ({
    id: `${accountSet.id}-s-${code}`,
    accountSetId: accountSet.id,
    code,
    name,
    category,
    balanceDirection,
    level: 1,
    unit,
    assistAccountingIds: ["1122", "1123"].includes(code)
      ? [`${accountSet.id}-ac-客户`]
      : [],
    status: true,
    systemDefault: true,
  })),
);

export const currencies: Currency[] = accountSets.flatMap((a) =>
  [
    ["CNY", "人民币", 1, true],
    ["USD", "美元", 7.2, false],
    ["EUR", "欧元", 7.8, false],
    ["HKD", "港币", 0.92, false],
  ].map(([code, name, exchangeRate, isBase]) => ({
    id: `${a.id}-${code}`,
    accountSetId: a.id,
    code: String(code),
    name: String(name),
    exchangeRate: Number(exchangeRate),
    isBase: Boolean(isBase),
  })),
);

export const voucherWords: VoucherWord[] = accountSets.flatMap((a) =>
  ["记", "收", "付", "转"].map((word, index) => ({
    id: `${a.id}-vw-${word}`,
    accountSetId: a.id,
    name: `${word}字`,
    word,
    printTitle: `${word === "记" ? "记账" : word === "收" ? "收款" : word === "付" ? "付款" : "转账"}凭证`,
    isDefault: index === 0,
    annualNumbering: false,
  })),
);

export const assistingCategories: AssistingCategory[] = accountSets.flatMap(
  (a) =>
    ["客户", "供应商", "部门", "员工", "项目"].map((name) => ({
      id: `${a.id}-ac-${name}`,
      accountSetId: a.id,
      name,
      systemDefault: true,
      customColumns: [],
    })),
);

export const assistingValues: AssistingValue[] = assistingCategories.flatMap(
  (category, index) =>
    Array.from({ length: 3 }, (_, item) => ({
      id: `${category.id}-v${item + 1}`,
      categoryId: category.id,
      code: `${index + 1}${item + 1}`.padStart(3, "0"),
      name: `${category.name}${item + 1}`,
      remark: "示例数据",
      customValues: {},
    })),
);

const voucherSpecs = [
  ["收", "收到客户货款", "1002", "1122", 68000],
  ["付", "支付供应商货款", "2202", "1002", 42000],
  ["记", "确认软件服务收入", "1122", "6001", 96000],
  ["付", "支付员工工资", "2211", "1002", 35500],
  ["记", "计提本月工资", "6602", "2211", 35500],
  ["付", "报销市场推广费", "6601", "1002", 12800],
  ["记", "计提固定资产折旧", "6602", "1602", 5200],
  ["收", "收到银行利息", "1002", "6603", 860],
  ["付", "购买办公用品", "6602", "1001", 2360],
  ["记", "结转主营业务成本", "6401", "1405", 34000],
  ["收", "现金销售收入", "1001", "6001", 12800],
  ["转", "确认应交税费", "6403", "2221", 4200],
];

export const vouchers: Voucher[] = accountSets.flatMap((accountSet) =>
  voucherSpecs.map(([word, summary, debitCode, creditCode, amount], index) => {
    const debit = subjects.find(
      (s) => s.accountSetId === accountSet.id && s.code === debitCode,
    )!;
    const credit = subjects.find(
      (s) => s.accountSetId === accountSet.id && s.code === creditCode,
    )!;
    const id = `${accountSet.id}-v-${index + 1}`;
    const makeDetail = (
      subject: Subject,
      debitAmount: number,
      creditAmount: number,
      suffix: string,
    ) => ({
      id: `${id}-${suffix}`,
      voucherId: id,
      summary: String(summary),
      subjectId: subject.id,
      subjectCode: subject.code,
      subjectName: subject.name,
      debitAmount,
      creditAmount,
      assistAccountings: {},
      currencyId: `${accountSet.id}-CNY`,
      exchangeRate: 1,
    });
    return {
      id,
      accountSetId: accountSet.id,
      voucherWordId: `${accountSet.id}-vw-${word}`,
      word: String(word),
      number: index + 1,
      year: currentPeriod.year,
      month: currentPeriod.month,
      date: `${currentPeriod.year}-${String(currentPeriod.month).padStart(2, "0")}-${String(Math.min(index + 2, 28)).padStart(2, "0")}`,
      attachmentCount: index % 3,
      status: index < 8 ? "audited" : "draft",
      sourceType: index === 9 ? "carry-forward" : "manual",
      createdBy: accountSet.creatorId,
      auditedBy: index < 8 ? "u1" : undefined,
      details: [
        makeDetail(debit, Number(amount), 0, "d"),
        makeDetail(credit, 0, Number(amount), "c"),
      ],
    };
  }),
);

export const subjectBalances: SubjectBalance[] = subjects.map(
  (subject, index) => {
    const opening =
      subject.balanceDirection === "借" ? 100000 + index * 1200 : 0;
    const creditOpening =
      subject.balanceDirection === "贷" ? 100000 + index * 1200 : 0;
    const relevant = vouchers
      .flatMap((v) => v.details)
      .filter((d) => d.subjectId === subject.id);
    const currentDebit = relevant.reduce((sum, d) => sum + d.debitAmount, 0);
    const currentCredit = relevant.reduce((sum, d) => sum + d.creditAmount, 0);
    return {
      id: `${subject.id}-balance`,
      accountSetId: subject.accountSetId,
      subjectId: subject.id,
      year: currentPeriod.year,
      month: currentPeriod.month,
      openingDebit: opening,
      openingCredit: creditOpening,
      currentDebit,
      currentCredit,
      endingDebit: Math.max(0, opening + currentDebit - currentCredit),
      endingCredit: Math.max(0, creditOpening + currentCredit - currentDebit),
    };
  },
);

export const initialBalances: InitialBalance[] = subjects.map((subject) => ({
  id: `${subject.id}-initial`,
  accountSetId: subject.accountSetId,
  subjectId: subject.id,
  debitAmount: subject.balanceDirection === "借" ? 100000 : 0,
  creditAmount: subject.balanceDirection === "贷" ? 100000 : 0,
  cumulativeDebit: 0,
  cumulativeCredit: 0,
  quantity: 0,
  assistValueIds: [],
}));

export const periods: AccountSetPeriod[] = accountSets.flatMap((accountSet) =>
  Array.from({ length: 12 }, (_, offset) => {
    const date = new Date(
      currentPeriod.year,
      currentPeriod.month - 1 - offset,
      1,
    );
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    return {
      id: `${accountSet.id}-${year}-${month}`,
      accountSetId: accountSet.id,
      year,
      month,
      status: offset === 0 ? "open" : "closed",
      closedAt:
        offset === 0
          ? undefined
          : `${year}-${String(month).padStart(2, "0")}-28`,
    };
  }),
);

export const reportTemplates: ReportTemplate[] = accountSets.flatMap((a) => [
  {
    id: `${a.id}-report-balance`,
    accountSetId: a.id,
    name: "资产负债表",
    type: "balance-sheet" as const,
    cells: [],
  },
  {
    id: `${a.id}-report-profit`,
    accountSetId: a.id,
    name: "利润表",
    type: "profit" as const,
    cells: [],
  },
  {
    id: `${a.id}-report-cash`,
    accountSetId: a.id,
    name: "现金流量表",
    type: "cash-flow" as const,
    cells: [],
  },
]);

export const financeReportTemplates: FinanceReportTemplate[] =
  accountSets.flatMap((accountSet) => [
    {
      id: `${accountSet.id}-tpl-balance`,
      accountSetId: accountSet.id,
      name: "标准资产负债表",
      category: "资产负债表",
      description: "适用于企业会计准则的标准资产负债表",
      items: [
        {
          id: `${accountSet.id}-ti-1`,
          rowCode: 1,
          rowTitle: "货币资金",
          level: 1,
          section: "资产",
          formula: "期末余额(1001+1002+1012)",
          valueType: "期末余额",
        },
        {
          id: `${accountSet.id}-ti-2`,
          rowCode: 2,
          rowTitle: "应收账款",
          level: 1,
          section: "资产",
          formula: "期末余额(1122)",
          valueType: "期末余额",
        },
        {
          id: `${accountSet.id}-ti-3`,
          rowCode: 20,
          rowTitle: "应付账款",
          level: 1,
          section: "负债",
          formula: "期末余额(2202)",
          valueType: "期末余额",
        },
        {
          id: `${accountSet.id}-ti-4`,
          rowCode: 30,
          rowTitle: "实收资本",
          level: 1,
          section: "所有者权益",
          formula: "期末余额(4001)",
          valueType: "期末余额",
        },
      ],
    },
    {
      id: `${accountSet.id}-tpl-profit`,
      accountSetId: accountSet.id,
      name: "标准利润表",
      category: "利润表",
      description: "按月展示收入、成本费用及净利润",
      items: [
        {
          id: `${accountSet.id}-pi-1`,
          rowCode: 1,
          rowTitle: "营业收入",
          level: 1,
          section: "利润",
          formula: "本期发生额(6001+6051)",
          valueType: "本期发生额",
        },
        {
          id: `${accountSet.id}-pi-2`,
          rowCode: 2,
          rowTitle: "营业成本",
          level: 1,
          section: "利润",
          formula: "本期发生额(6401+6402)",
          valueType: "本期发生额",
        },
      ],
    },
  ]);

export const voucherTemplates: VoucherTemplate[] = accountSets.map(
  (accountSet) => ({
    id: `${accountSet.id}-vt-office`,
    accountSetId: accountSet.id,
    name: "办公费用报销",
    type: "日常支出",
    details: [
      {
        id: `${accountSet.id}-vtd-1`,
        summary: "报销办公费用",
        subjectId: `${accountSet.id}-s-6602`,
        subjectCode: "6602",
        subjectName: "管理费用",
        debitAmount: 0,
        creditAmount: 0,
        amountEditable: true,
      },
      {
        id: `${accountSet.id}-vtd-2`,
        summary: "支付办公费用",
        subjectId: `${accountSet.id}-s-1001`,
        subjectCode: "1001",
        subjectName: "库存现金",
        debitAmount: 0,
        creditAmount: 0,
        amountEditable: true,
      },
    ],
  }),
);

export const dashboardByAccountSet: Record<string, HomeDashboard> =
  Object.fromEntries(
    accountSets.map((accountSet, accountIndex) => [
      accountSet.id,
      {
        voucherCount: vouchers.filter((v) => v.accountSetId === accountSet.id)
          .length,
        cashData: [
          { name: "库存现金", value: 28600 + accountIndex * 8000 },
          { name: "银行存款", value: 468000 + accountIndex * 50000 },
          { name: "其他货币资金", value: 36000 + accountIndex * 5000 },
        ],
        costData: [
          { name: "销售费用", value: 12800 + accountIndex * 2000 },
          { name: "管理费用", value: 43060 + accountIndex * 3000 },
          { name: "财务费用", value: 860 + accountIndex * 200 },
        ],
        revenueProfitByMonth: Array.from({ length: 12 }, (_, month) => ({
          month: month + 1,
          主营业务收入: 62 + month * 7 + accountIndex * 6,
          本年利润: 10 + month * 2 + accountIndex,
        })),
      },
    ]),
  );

const invoiceLine = (
  name: string,
  amount: number,
  taxRate: number,
): Invoice["lines"][number] => ({
  name,
  model: "标准",
  unit: "项",
  quantity: 1,
  price: amount,
  amount,
  taxRate,
  tax: Number((amount * taxRate).toFixed(2)),
});
export const invoices: Invoice[] = [
  {
    id: "a1-inv-1",
    accountSetId: "a1",
    tab: "output",
    date: "2026-10-13",
    type: "电子普票",
    code: "",
    number: "260013340920",
    digitalNumber: "26132000000334092027",
    partner: "河北省通用职业培训学校",
    amount: 283.02,
    tax: 16.98,
    total: 300,
    status: "正常",
    lines: [invoiceLine("职业培训服务", 283.02, 0.06)],
  },
  {
    id: "a1-inv-2",
    accountSetId: "a1",
    tab: "output",
    date: "2026-10-08",
    type: "数电专票",
    code: "",
    number: "26132000000334092018",
    digitalNumber: "26132000000334092018",
    partner: "杭州智联信息技术有限公司",
    amount: 10000,
    tax: 1300,
    total: 11300,
    status: "正常",
    lines: [invoiceLine("软件服务", 10000, 0.13)],
  },
  {
    id: "a1-inv-3",
    accountSetId: "a1",
    tab: "output",
    date: "2026-10-05",
    type: "数电普票",
    code: "",
    number: "26132000000334092011",
    digitalNumber: "26132000000334092011",
    partner: "上海云帆客户",
    amount: 2000,
    tax: 120,
    total: 2120,
    status: "红冲",
    lines: [invoiceLine("咨询服务", 2000, 0.06)],
  },
  {
    id: "a1-inv-4",
    accountSetId: "a1",
    tab: "input",
    date: "2026-10-12",
    type: "增值税专用发票",
    code: "110026",
    number: "88990011",
    partner: "杭州办公用品有限公司",
    amount: 1500,
    tax: 195,
    total: 1695,
    status: "正常",
    certification: "已认证",
    certificationPeriod: "2026-10",
    lines: [invoiceLine("办公用品", 1500, 0.13)],
  },
  {
    id: "a1-inv-5",
    accountSetId: "a1",
    tab: "input",
    date: "2026-10-10",
    type: "普通发票",
    code: "",
    number: "5500123",
    partner: "杭州餐饮服务有限公司",
    amount: 800,
    tax: 0,
    total: 800,
    status: "正常",
    certification: "未勾选",
    lines: [invoiceLine("业务招待", 800, 0)],
  },
  {
    id: "a1-inv-6",
    accountSetId: "a1",
    tab: "receipt",
    date: "2026-10-09",
    type: "出租车票",
    code: "",
    number: "TAXI-0921",
    partner: "杭州市出租汽车",
    amount: 109.17,
    tax: 9.83,
    total: 119,
    status: "正常",
    lines: [invoiceLine("客运服务", 109.17, 0.09)],
  },
];
export const invoiceTemplates: InvoiceTemplate[] = accountSets.flatMap((a) => [
  {
    id: `${a.id}-inv-tpl-output`,
    accountSetId: a.id,
    tab: "output",
    name: "赊销模板",
    isDefault: true,
    description: "借应收账款；贷主营业务收入、销项税额",
    entries: [
      {
        direction: "借",
        subjectCode: "1122",
        subjectName: "应收账款",
        formula: "total",
      },
      {
        direction: "贷",
        subjectCode: "6001",
        subjectName: "主营业务收入",
        formula: "amount",
      },
      {
        direction: "贷",
        subjectCode: "2221",
        subjectName: "应交税费—销项税额",
        formula: "tax",
      },
    ],
  },
  {
    id: `${a.id}-inv-tpl-output-cash`,
    accountSetId: a.id,
    tab: "output",
    name: "现销模板",
    isDefault: false,
    description: "借银行存款；贷主营业务收入、销项税额",
    entries: [
      {
        direction: "借",
        subjectCode: "1002",
        subjectName: "银行存款",
        formula: "total",
      },
      {
        direction: "贷",
        subjectCode: "6001",
        subjectName: "主营业务收入",
        formula: "amount",
      },
      {
        direction: "贷",
        subjectCode: "2221",
        subjectName: "应交税费—销项税额",
        formula: "tax",
      },
    ],
  },
  {
    id: `${a.id}-inv-tpl-input`,
    accountSetId: a.id,
    tab: "input",
    name: "赊购模板",
    isDefault: true,
    description: "借库存商品、进项税额；贷应付账款",
    entries: [
      {
        direction: "借",
        subjectCode: "1405",
        subjectName: "库存商品",
        formula: "amount",
      },
      {
        direction: "借",
        subjectCode: "2221",
        subjectName: "应交税费—进项税额",
        formula: "tax",
      },
      {
        direction: "贷",
        subjectCode: "2202",
        subjectName: "应付账款",
        formula: "total",
      },
    ],
  },
  {
    id: `${a.id}-inv-tpl-receipt`,
    accountSetId: a.id,
    tab: "receipt",
    name: "费用小票模板",
    isDefault: true,
    description: "借管理费用；贷其他应付款",
    entries: [
      {
        direction: "借",
        subjectCode: "6602",
        subjectName: "管理费用",
        formula: "total",
      },
      {
        direction: "贷",
        subjectCode: "2241",
        subjectName: "其他应付款",
        formula: "total",
      },
    ],
  },
]);
