import {
  accountSets,
  assistingCategories,
  assistingValues,
  currencies,
  dashboardByAccountSet,
  financeReportTemplates,
  initialBalances,
  periods,
  permissions,
  reportTemplates,
  subjects,
  users,
  vouchers,
  voucherTemplates,
  voucherWords,
  invoices,
  invoiceTemplates,
  assetCategories,
  assetCards,
  assetChanges,
} from "./seed";
import type {
  AccountSet,
  AccountSetUser,
  AssistingCategory,
  CarryForwardItem,
  CheckoutCheckRow,
  Currency,
  FinanceReportTemplate,
  GeneralLedgerRow,
  LedgerLine,
  PageResult,
  ReportTemplate,
  ReportListItem,
  ReportRow,
  SubjectBalanceRow,
  SubjectSummaryRow,
  Subject,
  User,
  Voucher,
  VoucherInput,
  VoucherQuery,
  VoucherTemplate,
  VoucherWord,
  Invoice,
  InvoiceTab,
  InvoiceTemplate,
  TaxBurdenInput,
  TaxBurdenResult,
  AssetCategory,
  AssetCard,
  AssetChangeRecord,
  DepreciationDetailRow,
  DepreciationSummaryRow,
  DepreciationVoucherItem,
} from "./types";

const wait = <T>(value: T, delay = 140) =>
  new Promise<T>((resolve) => setTimeout(() => resolve(value), delay));
const createId = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

function upsert<T extends { id: string }>(items: T[], value: T) {
  const index = items.findIndex((item) => item.id === value.id);
  if (index >= 0) items[index] = value;
  else items.push(value);
  return value;
}

export const accountSet = {
  listByUser: (userId: string) =>
    wait(
      permissions
        .filter((item) => item.userId === userId)
        .map((permission) => ({
          ...accountSets.find((item) => item.id === permission.accountSetId)!,
          role: permission.role,
        })),
      40,
    ),
  init: (id: string) =>
    wait(accountSets.find((item) => item.id === id) ?? null),
  save: async (
    value: Partial<AccountSet> & Pick<AccountSet, "companyName">,
    userId: string,
  ) => {
    const isNew = !value.id;
    const saved: AccountSet = {
      id: value.id ?? createId("account"),
      companyName: value.companyName,
      creditCode: value.creditCode ?? "",
      accountingStandards: value.accountingStandards ?? "小企业会计准则",
      industry: value.industry ?? "IT·通信·电子·互联网",
      vatType: value.vatType ?? "小规模纳税人",
      address: value.address ?? "",
      enableDate: value.enableDate ?? new Date().toISOString().slice(0, 10),
      currentPeriod: value.currentPeriod ?? {
        year: new Date().getFullYear(),
        month: new Date().getMonth() + 1,
      },
      encoding: value.encoding ?? "4-2-2-2",
      voucherReviewed: value.voucherReviewed ?? true,
      creatorId: value.creatorId ?? userId,
      enabled: value.enabled ?? true,
    };
    upsert(accountSets, saved);
    if (
      !permissions.some(
        (item) => item.userId === userId && item.accountSetId === saved.id,
      )
    )
      permissions.push({ userId, accountSetId: saved.id, role: "Manager" });
    if (isNew) {
      subjects
        .filter((item) => item.accountSetId === "a1")
        .forEach((item) =>
          subjects.push({
            ...item,
            id: `${saved.id}-s-${item.code}`,
            accountSetId: saved.id,
            parentId: item.parentId
              ? item.parentId.replace("a1-", `${saved.id}-`)
              : undefined,
            assistAccountingIds: [],
          }),
        );
      ["记", "收", "付", "转"].forEach((word, index) =>
        voucherWords.push({
          id: `${saved.id}-vw-${word}`,
          accountSetId: saved.id,
          name: `${word}字`,
          word,
          printTitle: `${word}账凭证`,
          isDefault: index === 0,
          annualNumbering: false,
        }),
      );
      currencies.push({
        id: `${saved.id}-CNY`,
        accountSetId: saved.id,
        code: "CNY",
        name: "人民币",
        exchangeRate: 1,
        isBase: true,
      });
    }
    return wait(saved);
  },
  list: () => wait(accountSets),
  setEnabled: async (id: string, enabled: boolean) => {
    const item = accountSets.find((entry) => entry.id === id);
    if (!item) throw new Error("账套不存在");
    item.enabled = enabled;
    return wait(item);
  },
  delete: async (id: string) => {
    if (vouchers.some((item) => item.accountSetId === id))
      throw new Error("账套已有业务数据，不能删除，可选择停用");
    const index = accountSets.findIndex((item) => item.id === id);
    if (index >= 0) accountSets.splice(index, 1);
    return wait(index >= 0);
  },
};

export const home = {
  voucherCount: async (accountSetId: string) =>
    (await wait(dashboardByAccountSet[accountSetId])).voucherCount,
  chart: {
    revenueProfit: async (accountSetId: string) =>
      (await wait(dashboardByAccountSet[accountSetId])).revenueProfitByMonth,
    cost: async (accountSetId: string) =>
      (await wait(dashboardByAccountSet[accountSetId])).costData,
    cash: async (accountSetId: string) =>
      (await wait(dashboardByAccountSet[accountSetId])).cashData,
  },
  dashboard: (accountSetId: string) =>
    wait(dashboardByAccountSet[accountSetId]),
};

export const subject = {
  tree: (accountSetId: string) =>
    wait(subjects.filter((item) => item.accountSetId === accountSetId)),
  list: (accountSetId: string, category?: Subject["category"]) =>
    wait(
      subjects.filter(
        (item) =>
          item.accountSetId === accountSetId &&
          (!category || item.category === category),
      ),
    ),
  save: (value: Subject) => {
    const parent = value.parentId
      ? subjects.find((item) => item.id === value.parentId)
      : undefined;
    const saved = {
      ...value,
      level: parent ? parent.level + 1 : value.level || 1,
      balanceDirection: parent?.balanceDirection ?? value.balanceDirection,
      code:
        parent && !value.code.startsWith(parent.code)
          ? `${parent.code}${value.code}`
          : value.code,
    };
    return wait(upsert(subjects, saved));
  },
  delete: async (id: string) => {
    if (
      vouchers.some((item) =>
        item.details.some((detail) => detail.subjectId === id),
      ) ||
      initialBalances.some(
        (item) =>
          item.subjectId === id && (item.debitAmount || item.creditAmount),
      )
    )
      throw new Error("该科目已被凭证或期初余额使用，不能删除");
    if (subjects.some((item) => item.parentId === id))
      throw new Error("请先删除下级科目");
    const index = subjects.findIndex((item) => item.id === id);
    if (index >= 0) subjects.splice(index, 1);
    return wait(index >= 0);
  },
  import: (rows: Subject[]) => {
    rows.forEach((row) => upsert(subjects, row));
    return wait(rows);
  },
  search: (accountSetId: string, keyword = "") =>
    wait(
      subjects.filter(
        (item) =>
          item.accountSetId === accountSetId &&
          item.status &&
          `${item.code} ${item.name}`
            .toLowerCase()
            .includes(keyword.toLowerCase()),
      ),
    ),
};

export const initialBalance = {
  list: (accountSetId: string) =>
    wait(initialBalances.filter((item) => item.accountSetId === accountSetId)),
  save: (value: (typeof initialBalances)[number]) =>
    wait(upsert(initialBalances, value)),
  saveAll: async (values: typeof initialBalances) => {
    values.forEach((value) => upsert(initialBalances, value));
    return wait(values);
  },
  trialBalance: async (accountSetId: string) => {
    const rows = initialBalances.filter(
      (item) => item.accountSetId === accountSetId,
    );
    const debit = rows.reduce((sum, item) => sum + item.debitAmount, 0);
    const credit = rows.reduce((sum, item) => sum + item.creditAmount, 0);
    return wait({ debit, credit, balanced: Math.abs(debit - credit) < 0.001 });
  },
};

export const voucher = {
  page: (
    queryOrAccountSetId: VoucherQuery | string,
    year?: number,
    month?: number,
    legacyPage = 1,
    legacySize = 10,
  ): Promise<PageResult<Voucher>> => {
    const query: VoucherQuery =
      typeof queryOrAccountSetId === "string"
        ? {
            accountSetId: queryOrAccountSetId,
            periodYear: year,
            periodMonth: month,
            page: legacyPage,
            size: legacySize,
          }
        : queryOrAccountSetId;
    const page = query.page ?? 1;
    const size = query.size ?? 10;
    const keyword = query.keyword?.trim().toLowerCase();
    const filtered = vouchers.filter(
      (item) =>
        item.accountSetId === query.accountSetId &&
        (!query.periodYear || item.year === query.periodYear) &&
        (!query.periodMonth || item.month === query.periodMonth) &&
        (!query.wordId || item.voucherWordId === query.wordId) &&
        (!query.status ||
          query.status === "all" ||
          item.status === query.status) &&
        (!keyword ||
          `${item.word}-${item.number} ${item.remark ?? ""} ${item.details.map((detail) => `${detail.summary} ${detail.subjectCode} ${detail.subjectName}`).join(" ")}`
            .toLowerCase()
            .includes(keyword)),
    );
    return wait({
      content: filtered.slice((page - 1) * size, page * size),
      page,
      size,
      total: filtered.length,
      totalPages: Math.ceil(filtered.length / size),
    });
  },
  getDetail: (id: string) =>
    wait(vouchers.find((item) => item.id === id) ?? null),
  maxNumber: (
    accountSetId: string,
    year: number,
    month: number,
    wordId: string,
  ) =>
    wait(
      Math.max(
        0,
        ...vouchers
          .filter(
            (item) =>
              item.accountSetId === accountSetId &&
              item.year === year &&
              item.month === month &&
              item.voucherWordId === wordId,
          )
          .map((item) => item.number),
      ),
    ),
  save: async (value: VoucherInput | Voucher) => {
    if (!value.details.length) throw new Error("亲，凭证明细不能为空！");
    const debit = value.details.reduce(
      (sum, item) => sum + Number(item.debitAmount || 0),
      0,
    );
    const credit = value.details.reduce(
      (sum, item) => sum + Number(item.creditAmount || 0),
      0,
    );
    if (debit <= 0 || Math.abs(debit - credit) > 0.001)
      throw new Error("亲，借贷不平衡！");
    value.details.forEach((item, index) => {
      if (!item.summary) throw new Error(`亲，第${index + 1}行，请输入摘要！`);
      if (!item.subjectId)
        throw new Error(`亲，第${index + 1}行，请输入科目！`);
    });
    const id = value.id || createId("voucher");
    const word = voucherWords.find((item) => item.id === value.voucherWordId);
    const number =
      value.number ||
      (await voucher.maxNumber(
        value.accountSetId,
        value.year,
        value.month,
        value.voucherWordId,
      )) + 1;
    const saved: Voucher = {
      ...value,
      id,
      number,
      word: value.word || word?.word || "记",
      details: value.details.map((item) => ({
        ...item,
        id: item.id || createId("detail"),
        voucherId: id,
      })),
    };
    upsert(vouchers, saved);
    return wait(saved);
  },
  audit: async (ids: string[], userId: string) => {
    vouchers
      .filter((item) => ids.includes(item.id))
      .forEach((item) => {
        item.status = "audited";
        item.auditedBy = userId;
      });
    return wait(true);
  },
  cancelAudit: async (ids: string[]) => {
    vouchers
      .filter((item) => ids.includes(item.id))
      .forEach((item) => {
        item.status = "draft";
        item.auditedBy = undefined;
      });
    return wait(true);
  },
  delete: async (id: string) => {
    const index = vouchers.findIndex((item) => item.id === id);
    if (index < 0) return wait(false);
    if (vouchers[index].status === "posted")
      throw new Error("已记账凭证不可删除");
    vouchers.splice(index, 1);
    return wait(true);
  },
  batchDelete: async (ids: string[]) => {
    for (const id of ids) await voucher.delete(id);
    return wait(true);
  },
  void: async (id: string) => {
    const item = vouchers.find((entry) => entry.id === id);
    if (!item) throw new Error("凭证不存在");
    item.status = "void";
    item.auditedBy = undefined;
    return wait(item);
  },
  copy: async (id: string) => {
    const source = vouchers.find((item) => item.id === id);
    if (!source) throw new Error("凭证不存在");
    return voucher.save({
      ...source,
      id: undefined,
      number: undefined,
      status: "draft",
      auditedBy: undefined,
      date: new Date().toISOString().slice(0, 10),
      details: source.details.map((item) => ({
        ...item,
        id: undefined,
        voucherId: undefined,
      })),
    });
  },
  dataUsageCount: (subjectId: string) =>
    wait(
      vouchers
        .flatMap((item) => item.details)
        .filter((item) => item.subjectId === subjectId).length,
    ),
  carryForward: (accountSetId: string, year: number, month: number) =>
    wait(
      vouchers.filter(
        (item) =>
          item.accountSetId === accountSetId &&
          item.year === year &&
          item.month === month &&
          item.sourceType === "carry-forward",
      ),
    ),
};

const round2 = (n: number) => Math.round(n * 100) / 100;
const expenseSubjectForDepartment = (department: string) =>
  department === "运输部" || department === "仓储部" ? "6601" : "6602";
const monthsInServiceThisYear = (
  endYear: number,
  endMonth: number,
  start: string,
) => {
  const [startYear, startMonth] = start.slice(0, 7).split("-").map(Number);
  if (startYear > endYear) return 0;
  return Math.min(
    12,
    Math.max(0, endYear === startYear ? endMonth - startMonth + 1 : 12),
  );
};
export const asset = {
  categories: {
    list: (accountSetId: string) =>
      wait(assetCategories.filter((x) => x.accountSetId === accountSetId)),
    save: (x: AssetCategory) => wait(upsert(assetCategories, x)),
    delete: async (id: string) => {
      if (
        assetCards.some(
          (x) =>
            x.categoryCode === assetCategories.find((c) => c.id === id)?.code,
        )
      )
        throw new Error("该类别已被资产卡片引用，不能删除");
      const i = assetCategories.findIndex((x) => x.id === id);
      if (i >= 0) assetCategories.splice(i, 1);
      return wait(i >= 0);
    },
  },
  cards: {
    list: (
      accountSetId: string,
      filters: {
        categoryCode?: string;
        department?: string;
        keyword?: string;
        includeCleared?: boolean;
      } = {},
    ) =>
      wait(
        assetCards.filter(
          (x) =>
            x.accountSetId === accountSetId &&
            (!filters.categoryCode ||
              x.categoryCode === filters.categoryCode) &&
            (!filters.department || x.department === filters.department) &&
            (filters.includeCleared || x.status !== "已清理") &&
            (!filters.keyword ||
              `${x.code} ${x.name}`.includes(filters.keyword)),
        ),
      ),
    save: async (x: AssetCard, modifier = "管理员") => {
      const old = assetCards.find((y) => y.id === x.id);
      if (old)
        (
          [
            "originalValue",
            "department",
            "categoryCode",
            "usefulLifeMonths",
            "openingAccumulatedDepreciation",
          ] as const
        ).forEach((key) => {
          if (old[key] !== x[key])
            assetChanges.push({
              id: createId("asset-change"),
              accountSetId: x.accountSetId,
              assetCode: x.code,
              assetName: x.name,
              changeItem: key,
              beforeValue: String(old[key]),
              afterValue: String(x[key]),
              period: x.entryPeriod,
              modifier,
              changedAt: new Date().toISOString(),
            });
        });
      x.residualValue = round2(x.originalValue * 0.05);
      x.monthlyDepreciation = round2(
        (x.originalValue * 0.95) / x.usefulLifeMonths,
      );
      x.netValue = round2(
        x.originalValue -
          x.endingAccumulatedDepreciation -
          x.impairmentProvision,
      );
      return wait(upsert(assetCards, x));
    },
    delete: async (id: string) => {
      const x = assetCards.find((y) => y.id === id);
      if (x && x.endingAccumulatedDepreciation > 0)
        throw new Error("已计提折旧的资产不能删除");
      const i = assetCards.findIndex((y) => y.id === id);
      if (i >= 0) assetCards.splice(i, 1);
      return wait(i >= 0);
    },
    clear: async (id: string) => {
      const x = assetCards.find((y) => y.id === id);
      if (!x) throw new Error("资产不存在");
      x.status = "已清理";
      assetChanges.push({
        id: createId("asset-change"),
        accountSetId: x.accountSetId,
        assetCode: x.code,
        assetName: x.name,
        changeItem: "清理",
        beforeValue: "使用中",
        afterValue: "已清理",
        period: x.entryPeriod,
        modifier: "管理员",
        changedAt: new Date().toISOString(),
      });
      return wait(x);
    },
  },
  changes: {
    list: (accountSetId: string) =>
      wait(assetChanges.filter((x) => x.accountSetId === accountSetId)),
  },
  calculateMonthlyDepreciation: (
    originalValue: number,
    usefulLifeMonths: number,
    residualRate = 5,
  ) => round2((originalValue * (1 - residualRate / 100)) / usefulLifeMonths),
  periodDepreciation: (x: AssetCard, year: number, month: number) => {
    if (
      x.status === "已清理" ||
      x.endingAccumulatedDepreciation >= x.originalValue - x.residualValue ||
      `${year}-${String(month).padStart(2, "0")}` <= x.startUseDate.slice(0, 7)
    )
      return 0;
    return round2(
      Math.min(
        x.monthlyDepreciation,
        x.originalValue - x.residualValue - x.endingAccumulatedDepreciation,
      ),
    );
  },
  report: async (accountSetId: string, year: number, month: number) =>
    (await asset.cards.list(accountSetId, { includeCleared: true })).map(
      (x) => {
        const current = asset.periodDepreciation(x, year, month);
        const ending = round2(x.openingAccumulatedDepreciation + current);
        return {
          ...x,
          currentDepreciation: current,
          endingAccumulatedDepreciation: ending,
          netValue: round2(x.originalValue - ending - x.impairmentProvision),
        };
      },
    ),
  depreciation: {
    preview: async (accountSetId: string, year: number, month: number) => {
      const cardRows = await asset.report(accountSetId, year, month);
      const groups = new Map<string, number>();
      cardRows.forEach((row) => {
        if (row.currentDepreciation <= 0) return;
        const code = expenseSubjectForDepartment(row.department);
        groups.set(
          code,
          round2((groups.get(code) ?? 0) + row.currentDepreciation),
        );
      });
      const voucherLines = [...groups.entries()].map(
        ([subjectCode, debitAmount]) => {
          const subject = subjects.find(
            (item) =>
              item.accountSetId === accountSetId && item.code === subjectCode,
          )!;
          return {
            id: `${accountSetId}-${year}-${month}-${subjectCode}`,
            summary: "计提固定资产折旧",
            subjectCode,
            subjectName: `${subject.name}-折旧`,
            debitAmount,
            creditAmount: 0,
          };
        },
      );
      const debitTotal = round2(
        voucherLines.reduce((sum, item) => sum + item.debitAmount, 0),
      );
      const creditTotal = debitTotal;
      const accumulated = subjects.find(
        (item) => item.accountSetId === accountSetId && item.code === "1602",
      )!;
      voucherLines.push({
        id: `${accountSetId}-${year}-${month}-1602`,
        summary: "计提固定资产折旧",
        subjectCode: "1602",
        subjectName: accumulated.name,
        debitAmount: 0,
        creditAmount: creditTotal,
      });
      return {
        cardRows,
        voucherLines,
        debitTotal,
        creditTotal,
        balanced: debitTotal === creditTotal,
      };
    },
    vouchers: (accountSetId: string): DepreciationVoucherItem[] =>
      vouchers
        .filter(
          (item) =>
            item.accountSetId === accountSetId &&
            item.remark?.startsWith("[资产折旧]") &&
            item.status !== "void",
        )
        .map((item) => ({
          id: item.id,
          word: item.word,
          number: item.number,
          voucherWordLabel: `${item.word}-${item.number}`,
          year: item.year,
          month: item.month,
          date: item.date,
          summary:
            item.details.find((detail) => detail.summary)?.summary ??
            "计提固定资产折旧",
          debitTotal: round2(
            item.details.reduce((sum, detail) => sum + detail.debitAmount, 0),
          ),
          creditTotal: round2(
            item.details.reduce((sum, detail) => sum + detail.creditAmount, 0),
          ),
          status: item.status,
        }))
        .sort(
          (a, b) => b.year - a.year || b.month - a.month || b.number - a.number,
        ),
    detail: async (
      accountSetId: string,
      startYear: number,
      startMonth: number,
      endYear: number,
      endMonth: number,
      opts: {
        byDepartment: boolean;
        includeCleared: boolean;
        showChanges: boolean;
      },
    ) => {
      const cards = await asset.cards.list(accountSetId, {
        includeCleared: true,
      });
      const requestedStartKey = startYear * 100 + startMonth;
      const requestedEndKey = endYear * 100 + endMonth;
      if (requestedStartKey > requestedEndKey) {
        [startYear, endYear] = [endYear, startYear];
        [startMonth, endMonth] = [endMonth, startMonth];
      }
      const endKey = endYear * 100 + endMonth;
      const startKey = startYear * 100 + startMonth;
      return cards
        .filter((card) => opts.includeCleared || card.status !== "已清理")
        .filter((card) => {
          const cardKey = Number(
            card.startUseDate.slice(0, 7).replace("-", ""),
          );
          return cardKey <= endKey && endKey >= startKey;
        })
        .map((card): DepreciationDetailRow => {
          const currentDepreciation = asset.periodDepreciation(
            card,
            endYear,
            endMonth,
          );
          const endingAccumulatedDepreciation = round2(
            card.openingAccumulatedDepreciation + currentDepreciation,
          );
          const changes = assetChanges
            .filter((change) => change.assetCode === card.code)
            .map(
              (change) =>
                `${change.period} ${change.changeItem} ${change.beforeValue}→${change.afterValue}`,
            );
          return {
            id: card.id,
            code: card.code,
            name: card.name,
            categoryCode: card.categoryCode,
            categoryName:
              assetCategories.find(
                (category) =>
                  category.accountSetId === accountSetId &&
                  category.code === card.categoryCode,
              )?.name ?? card.categoryCode,
            department: card.department,
            originalValue: card.originalValue,
            openingAccumulatedDepreciation: card.openingAccumulatedDepreciation,
            currentDepreciation,
            yearDepreciation: round2(
              card.monthlyDepreciation *
                monthsInServiceThisYear(endYear, endMonth, card.startUseDate),
            ),
            endingAccumulatedDepreciation,
            impairmentProvision: card.impairmentProvision,
            netValue: round2(
              card.originalValue -
                endingAccumulatedDepreciation -
                card.impairmentProvision,
            ),
            status: card.status,
            changeInfo: opts.showChanges ? changes.join("；") : undefined,
          };
        });
    },
    summary: async (accountSetId: string, year: number, month: number) => {
      const cards = await asset.cards.list(accountSetId, {
        includeCleared: true,
      });
      return assetCategories
        .filter((category) => category.accountSetId === accountSetId)
        .map((category): DepreciationSummaryRow => {
          const rows = cards.filter(
            (card) => card.categoryCode === category.code,
          );
          const added = rows.filter(
            (card) =>
              card.entryPeriod === `${year}-${String(month).padStart(2, "0")}`,
          );
          const openingOriginalValue = rows.reduce(
            (sum, card) =>
              sum +
              card.originalValue -
              (added.includes(card) ? card.originalValue : 0),
            0,
          );
          const decreasedOriginalValue = rows
            .filter((card) => card.status === "已清理")
            .reduce((sum, card) => sum + card.originalValue, 0);
          const openingAccumulatedDepreciation = rows.reduce(
            (sum, card) => sum + card.openingAccumulatedDepreciation,
            0,
          );
          const currentDepreciation = rows.reduce(
            (sum, card) => sum + asset.periodDepreciation(card, year, month),
            0,
          );
          const impairment = rows.reduce(
            (sum, card) => sum + card.impairmentProvision,
            0,
          );
          const endingOriginalValue = round2(
            openingOriginalValue +
              added.reduce((sum, card) => sum + card.originalValue, 0) -
              decreasedOriginalValue,
          );
          const endingAccumulatedDepreciation = round2(
            openingAccumulatedDepreciation + currentDepreciation,
          );
          return {
            categoryCode: category.code,
            categoryName: category.name,
            openingOriginalValue: round2(openingOriginalValue),
            addedOriginalValue: round2(
              added.reduce((sum, card) => sum + card.originalValue, 0),
            ),
            decreasedOriginalValue: round2(decreasedOriginalValue),
            endingOriginalValue,
            openingAccumulatedDepreciation: round2(
              openingAccumulatedDepreciation,
            ),
            currentDepreciation: round2(currentDepreciation),
            endingAccumulatedDepreciation,
            openingNetValue: round2(
              openingOriginalValue -
                openingAccumulatedDepreciation -
                impairment,
            ),
            endingNetValue: round2(
              endingOriginalValue - endingAccumulatedDepreciation - impairment,
            ),
          };
        });
    },
  },
  generateDepreciationVoucher: async (
    accountSetId: string,
    year: number,
    month: number,
  ) => {
    const remark = `[资产折旧]${year}-${String(month).padStart(2, "0")}`;
    if (
      vouchers.some(
        (x) =>
          x.accountSetId === accountSetId &&
          x.remark === remark &&
          x.status !== "void",
      )
    )
      throw new Error("该期间已生成折旧凭证");
    const rows = await asset.report(accountSetId, year, month);
    const groups = new Map<string, number>();
    rows.forEach((row) => {
      if (row.currentDepreciation > 0)
        groups.set(
          expenseSubjectForDepartment(row.department),
          round2(
            (groups.get(expenseSubjectForDepartment(row.department)) ?? 0) +
              row.currentDepreciation,
          ),
        );
    });
    const word =
      voucherWords.find(
        (x) => x.accountSetId === accountSetId && x.isDefault,
      ) ?? voucherWords.find((x) => x.accountSetId === accountSetId)!;
    const depreciation = subjects.find(
      (x) => x.accountSetId === accountSetId && x.code === "1602",
    )!;
    const details = [...groups.entries()].map(([code, amount], index) => {
      const subjectItem = subjects.find(
        (x) => x.accountSetId === accountSetId && x.code === code,
      )!;
      return {
        id: `${remark}-${index}`,
        voucherId: "",
        summary: "计提固定资产折旧",
        subjectId: subjectItem.id,
        subjectCode: subjectItem.code,
        subjectName: `${subjectItem.name}-折旧`,
        debitAmount: amount,
        creditAmount: 0,
        assistAccountings: {},
        currencyId: `${accountSetId}-CNY`,
        exchangeRate: 1,
      };
    });
    const total = round2(details.reduce((sum, x) => sum + x.debitAmount, 0));
    if (!total) throw new Error("本期没有可计提的折旧");
    const saved = await voucher.save({
      accountSetId,
      voucherWordId: word.id,
      word: word.word,
      year,
      month,
      date: `${year}-${String(month).padStart(2, "0")}-28`,
      attachmentCount: 0,
      status: "draft",
      sourceType: "manual",
      remark,
      createdBy: "u1",
      details: [
        ...details,
        {
          id: `${remark}-credit`,
          voucherId: "",
          summary: "计提固定资产折旧",
          subjectId: depreciation.id,
          subjectCode: depreciation.code,
          subjectName: depreciation.name,
          debitAmount: 0,
          creditAmount: details.reduce((sum, x) => sum + x.debitAmount, 0),
          assistAccountings: {},
          currencyId: `${accountSetId}-CNY`,
          exchangeRate: 1,
        },
      ],
    });
    rows.forEach((row) => {
      const source = assetCards.find((x) => x.id === row.id);
      if (source) {
        source.endingAccumulatedDepreciation =
          row.endingAccumulatedDepreciation;
        source.depreciatedMonths += row.currentDepreciation > 0 ? 1 : 0;
        source.netValue = row.netValue;
      }
    });
    return wait(saved);
  },
  deleteDepreciationVoucher: async (
    accountSetId: string,
    year: number,
    month: number,
  ) => {
    const remark = `[资产折旧]${year}-${String(month).padStart(2, "0")}`;
    const item = vouchers.find(
      (x) =>
        x.accountSetId === accountSetId &&
        x.remark === remark &&
        x.status !== "void",
    );
    if (!item) return wait(false);
    const index = vouchers.findIndex((x) => x.id === item.id);
    vouchers.splice(index, 1);
    return wait(true);
  },
};

function crudService<T extends { id: string; accountSetId: string }>(
  items: T[],
) {
  return {
    list: (accountSetId: string) =>
      wait(items.filter((item) => item.accountSetId === accountSetId)),
    save: (value: T) => wait(upsert(items, value)),
    delete: async (id: string) => {
      const index = items.findIndex((item) => item.id === id);
      if (index >= 0) items.splice(index, 1);
      return wait(index >= 0);
    },
  };
}

export const assistCategory = {
  ...crudService<AssistingCategory>(assistingCategories),
  values: (categoryId: string) =>
    wait(assistingValues.filter((item) => item.categoryId === categoryId)),
  saveValue: (value: (typeof assistingValues)[number]) =>
    wait(upsert(assistingValues, value)),
  deleteValue: async (id: string) => {
    const index = assistingValues.findIndex((item) => item.id === id);
    if (index >= 0) assistingValues.splice(index, 1);
    return wait(index >= 0);
  },
};
export const currency = {
  ...crudService<Currency>(currencies),
  save: async (value: Currency) => {
    if (value.isBase)
      currencies
        .filter((item) => item.accountSetId === value.accountSetId)
        .forEach((item) => {
          item.isBase = false;
        });
    return wait(upsert(currencies, value));
  },
};
export const voucherWord = {
  ...crudService<VoucherWord>(voucherWords),
  save: async (value: VoucherWord) => {
    if (value.isDefault)
      voucherWords
        .filter((item) => item.accountSetId === value.accountSetId)
        .forEach((item) => {
          item.isDefault = false;
        });
    return wait(upsert(voucherWords, value));
  },
};

export const permissionService = {
  list: (accountSetId: string): Promise<AccountSetUser[]> =>
    wait(
      permissions
        .filter((item) => item.accountSetId === accountSetId)
        .map((item) => ({
          user: users.find((user) => user.id === item.userId)!,
          role: item.role,
        })),
    ),
  updateRole: async (
    accountSetId: string,
    userId: string,
    role: AccountSetUser["role"],
  ) => {
    const item = permissions.find(
      (entry) => entry.accountSetId === accountSetId && entry.userId === userId,
    );
    if (item) item.role = role;
    else permissions.push({ accountSetId, userId, role });
    return wait(true);
  },
  addUser: async (
    accountSetId: string,
    userId: string,
    role: AccountSetUser["role"],
  ) => {
    if (!users.some((item) => item.id === userId))
      throw new Error("用户不存在");
    if (
      !permissions.some(
        (item) => item.accountSetId === accountSetId && item.userId === userId,
      )
    )
      permissions.push({ accountSetId, userId, role });
    return wait(true);
  },
};

export const voucherTemplateService = {
  list: (accountSetId: string) =>
    wait(voucherTemplates.filter((item) => item.accountSetId === accountSetId)),
  detail: (id: string) =>
    wait(voucherTemplates.find((item) => item.id === id) ?? null),
  save: (value: VoucherTemplate) => wait(upsert(voucherTemplates, value)),
  delete: async (id: string) => {
    const index = voucherTemplates.findIndex((item) => item.id === id);
    if (index >= 0) voucherTemplates.splice(index, 1);
    return wait(index >= 0);
  },
};

const dateKey = (year: number, month: number) => year * 12 + month;
const validVouchers = (accountSetId: string) =>
  vouchers.filter(
    (item) => item.accountSetId === accountSetId && item.status !== "void",
  );
const openingFor = (subjectItem: Subject) =>
  initialBalances.find((item) => item.subjectId === subjectItem.id);
const movements = (
  accountSetId: string,
  year: number,
  month: number,
  through = false,
) =>
  validVouchers(accountSetId).filter((item) =>
    through
      ? dateKey(item.year, item.month) <= dateKey(year, month)
      : item.year === year && item.month === month,
  );

function calculateSubjectBalances(
  accountSetId: string,
  year: number,
  month: number,
  level?: number,
): SubjectBalanceRow[] {
  const rows = subjects
    .filter(
      (item) =>
        item.accountSetId === accountSetId && (!level || item.level <= level),
    )
    .map((subjectItem) => {
      const initial = openingFor(subjectItem);
      const priorDetails = validVouchers(accountSetId)
        .filter((item) => dateKey(item.year, item.month) < dateKey(year, month))
        .flatMap((item) => item.details)
        .filter((item) => item.subjectId === subjectItem.id);
      const currentDetails = movements(accountSetId, year, month)
        .flatMap((item) => item.details)
        .filter((item) => item.subjectId === subjectItem.id);
      const openingNet =
        Number(initial?.debitAmount || 0) -
        Number(initial?.creditAmount || 0) +
        priorDetails.reduce(
          (sum, item) => sum + item.debitAmount - item.creditAmount,
          0,
        );
      const periodDebit = currentDetails.reduce(
        (sum, item) => sum + item.debitAmount,
        0,
      );
      const periodCredit = currentDetails.reduce(
        (sum, item) => sum + item.creditAmount,
        0,
      );
      const closingNet = openingNet + periodDebit - periodCredit;
      return {
        id: `${subjectItem.id}-${year}-${month}`,
        subjectId: subjectItem.id,
        subjectCode: subjectItem.code,
        subjectName: subjectItem.name,
        category: subjectItem.category,
        balanceDirection: subjectItem.balanceDirection,
        level: subjectItem.level,
        openingDebit: Math.max(openingNet, 0),
        openingCredit: Math.max(-openingNet, 0),
        periodDebit,
        periodCredit,
        closingDebit: Math.max(closingNet, 0),
        closingCredit: Math.max(-closingNet, 0),
      };
    });
  const retained = rows.find((item) => item.subjectCode === "4104");
  if (retained) {
    const assets = rows
      .filter((item) => item.category === "资产")
      .reduce((sum, item) => sum + item.closingDebit - item.closingCredit, 0);
    const liabilities = rows
      .filter((item) => item.category === "负债" || item.category === "权益")
      .reduce((sum, item) => sum + item.closingCredit - item.closingDebit, 0);
    const adjustment = assets - liabilities;
    if (adjustment >= 0) retained.periodCredit += adjustment;
    else retained.periodDebit += Math.abs(adjustment);
    const net =
      retained.openingDebit -
      retained.openingCredit +
      retained.periodDebit -
      retained.periodCredit;
    retained.closingDebit = Math.max(net, 0);
    retained.closingCredit = Math.max(-net, 0);
  }
  return rows;
}

export const accountBook = {
  subjectBalance: (
    accountSetId: string,
    year: number,
    month: number,
    level?: number,
    _includeAssist = false,
  ) => wait(calculateSubjectBalances(accountSetId, year, month, level)),
  detailedAccounts: async (
    accountSetId: string,
    year: number,
    month: number,
    subjectId: string,
    assistKeyword = "",
  ): Promise<LedgerLine[]> => {
    const subjectItem = subjects.find((item) => item.id === subjectId);
    if (!subjectItem) return wait([]);
    const balance = calculateSubjectBalances(accountSetId, year, month).find(
      (item) => item.subjectId === subjectId,
    );
    let running =
      Number(balance?.openingDebit || 0) - Number(balance?.openingCredit || 0);
    const opening: LedgerLine = {
      id: `opening-${subjectId}-${year}-${month}`,
      date: `${year}-${String(month).padStart(2, "0")}-01`,
      voucherLabel: "",
      summary: "本期期初余额",
      subjectId,
      subjectCode: subjectItem.code,
      subjectName: subjectItem.name,
      debitAmount: 0,
      creditAmount: 0,
      direction: running >= 0 ? "借" : "贷",
      balance: Math.abs(running),
    };
    const lines = movements(accountSetId, year, month)
      .flatMap((item) =>
        item.details
          .filter(
            (detail) =>
              detail.subjectId === subjectId &&
              (!assistKeyword ||
                Object.values(detail.assistAccountings).some((value) =>
                  value.includes(assistKeyword),
                )),
          )
          .map((detail) => ({ item, detail })),
      )
      .sort(
        (a, b) =>
          a.item.date.localeCompare(b.item.date) ||
          a.item.number - b.item.number,
      )
      .map(({ item, detail }) => {
        running += detail.debitAmount - detail.creditAmount;
        return {
          id: detail.id,
          voucherId: item.id,
          date: item.date,
          voucherLabel: `${item.word}-${item.number}`,
          summary: detail.summary,
          subjectId,
          subjectCode: detail.subjectCode,
          subjectName: detail.subjectName,
          debitAmount: detail.debitAmount,
          creditAmount: detail.creditAmount,
          direction: running >= 0 ? ("借" as const) : ("贷" as const),
          balance: Math.abs(running),
        };
      });
    return wait([opening, ...lines]);
  },
  generalLedger: (
    accountSetId: string,
    subjectId: string,
    year: number,
    month?: number,
  ): Promise<GeneralLedgerRow[]> => {
    const months = month
      ? [month]
      : Array.from({ length: 12 }, (_, index) => index + 1);
    return wait(
      months.flatMap((periodMonth) => {
        const row = calculateSubjectBalances(
          accountSetId,
          year,
          periodMonth,
        ).find((item) => item.subjectId === subjectId);
        if (!row) return [];
        return [
          {
            ...row,
            id: `${row.id}-open`,
            year,
            month: periodMonth,
            summary: "期初余额",
          },
          {
            ...row,
            id: `${row.id}-period`,
            year,
            month: periodMonth,
            summary: "本期合计",
          },
          {
            ...row,
            id: `${row.id}-close`,
            year,
            month: periodMonth,
            summary: "期末余额",
          },
        ] as GeneralLedgerRow[];
      }),
    );
  },
  subjectSummary: (
    accountSetId: string,
    year: number,
    month: number,
  ): Promise<SubjectSummaryRow[]> => {
    const periodRows = movements(accountSetId, year, month);
    return wait(
      voucherWords
        .filter((item) => item.accountSetId === accountSetId)
        .map((word) => {
          const wordVouchers = periodRows.filter(
            (item) => item.voucherWordId === word.id,
          );
          return {
            id: word.id,
            word: word.word,
            voucherCount: wordVouchers.length,
            debitAmount: wordVouchers
              .flatMap((item) => item.details)
              .reduce((sum, item) => sum + item.debitAmount, 0),
            creditAmount: wordVouchers
              .flatMap((item) => item.details)
              .reduce((sum, item) => sum + item.creditAmount, 0),
          };
        }),
    );
  },
  assistBalance: async (
    accountSetId: string,
    categoryId: string,
    year: number,
    month: number,
  ) => {
    const base = calculateSubjectBalances(accountSetId, year, month);
    return wait(
      assistingValues
        .filter((item) => item.categoryId === categoryId)
        .map((assist) => {
          const relevant = movements(accountSetId, year, month)
            .flatMap((item) => item.details)
            .filter((item) => item.assistAccountings[categoryId] === assist.id);
          const periodDebit = relevant.reduce(
            (sum, item) => sum + item.debitAmount,
            0,
          );
          const periodCredit = relevant.reduce(
            (sum, item) => sum + item.creditAmount,
            0,
          );
          const subjectRow =
            base.find((item) =>
              relevant.some((detail) => detail.subjectId === item.subjectId),
            ) ?? base[0];
          return {
            ...subjectRow,
            id: `${assist.id}-${year}-${month}`,
            assistValueId: assist.id,
            assistCode: assist.code,
            assistName: assist.name,
            openingDebit: 0,
            openingCredit: 0,
            periodDebit,
            periodCredit,
            closingDebit: Math.max(periodDebit - periodCredit, 0),
            closingCredit: Math.max(periodCredit - periodDebit, 0),
          };
        }),
    );
  },
  assistDetail: async (
    accountSetId: string,
    categoryId: string,
    assistValueId: string,
    year: number,
    month: number,
  ) => {
    const matching = movements(accountSetId, year, month).flatMap((item) =>
      item.details
        .filter(
          (detail) => detail.assistAccountings[categoryId] === assistValueId,
        )
        .map((detail) => ({ item, detail })),
    );
    let running = 0;
    return wait(
      matching.map(({ item, detail }) => {
        running += detail.debitAmount - detail.creditAmount;
        return {
          id: detail.id,
          voucherId: item.id,
          date: item.date,
          voucherLabel: `${item.word}-${item.number}`,
          summary: detail.summary,
          subjectId: detail.subjectId,
          subjectCode: detail.subjectCode,
          subjectName: detail.subjectName,
          debitAmount: detail.debitAmount,
          creditAmount: detail.creditAmount,
          direction: running >= 0 ? ("借" as const) : ("贷" as const),
          balance: Math.abs(running),
        };
      }),
    );
  },
};

const generatedReports: Record<
  string,
  { generatedAt: string; rows: ReportRow[] }
> = {};
const reportNames = [
  "资产负债表",
  "利润表",
  "现金流量表",
  "所有者权益变动表",
] as const;
const amountByCodes = (
  rows: SubjectBalanceRow[],
  codes: string[],
  field: "closing" | "period",
) =>
  rows
    .filter((item) => codes.includes(item.subjectCode))
    .reduce(
      (sum, item) =>
        sum +
        (field === "closing"
          ? item.closingDebit - item.closingCredit
          : item.periodCredit - item.periodDebit),
      0,
    );

function buildReport(
  reportId: number,
  accountSetId: string,
  year: number,
  month: number,
): ReportRow[] {
  const balances = calculateSubjectBalances(accountSetId, year, month);
  const previous = calculateSubjectBalances(
    accountSetId,
    month === 1 ? year - 1 : year,
    month === 1 ? 12 : month - 1,
  );
  const row = (
    lineCode: number,
    lineName: string,
    section: string,
    periodAmount: number,
    priorAmount: number,
    level = 1,
    emphasis = false,
  ): ReportRow => ({
    id: `${reportId}-${lineCode}`,
    lineCode,
    lineName,
    section,
    periodAmount,
    priorAmount,
    level,
    emphasis,
  });
  if (reportId === 1) {
    const assetItems = [
      row(
        1,
        "货币资金",
        "资产",
        amountByCodes(balances, ["1001", "1002", "1012"], "closing"),
        amountByCodes(previous, ["1001", "1002", "1012"], "closing"),
      ),
      row(
        2,
        "应收账款",
        "资产",
        amountByCodes(balances, ["1122"], "closing"),
        amountByCodes(previous, ["1122"], "closing"),
      ),
      row(
        3,
        "预付账款",
        "资产",
        amountByCodes(balances, ["1123"], "closing"),
        amountByCodes(previous, ["1123"], "closing"),
      ),
      row(
        4,
        "存货",
        "资产",
        amountByCodes(balances, ["1403", "1405"], "closing"),
        amountByCodes(previous, ["1403", "1405"], "closing"),
      ),
      row(
        5,
        "固定资产净额",
        "资产",
        amountByCodes(balances, ["1601", "1602"], "closing"),
        amountByCodes(previous, ["1601", "1602"], "closing"),
      ),
    ];
    const liabilityItems = [
      row(
        20,
        "短期借款",
        "负债",
        -amountByCodes(balances, ["2001"], "closing"),
        -amountByCodes(previous, ["2001"], "closing"),
      ),
      row(
        21,
        "应付账款",
        "负债",
        -amountByCodes(balances, ["2202"], "closing"),
        -amountByCodes(previous, ["2202"], "closing"),
      ),
      row(
        22,
        "应付职工薪酬",
        "负债",
        -amountByCodes(balances, ["2211"], "closing"),
        -amountByCodes(previous, ["2211"], "closing"),
      ),
      row(
        23,
        "应交税费",
        "负债",
        -amountByCodes(balances, ["2221"], "closing"),
        -amountByCodes(previous, ["2221"], "closing"),
      ),
      row(
        30,
        "实收资本",
        "所有者权益",
        -amountByCodes(balances, ["4001"], "closing"),
        -amountByCodes(previous, ["4001"], "closing"),
      ),
      row(
        31,
        "未分配利润",
        "所有者权益",
        -amountByCodes(balances, ["4103", "4104"], "closing"),
        -amountByCodes(previous, ["4103", "4104"], "closing"),
      ),
    ];
    const assetTotal = balances
      .filter((item) => item.category === "资产")
      .reduce((sum, item) => sum + item.closingDebit - item.closingCredit, 0);
    const priorAssetTotal = previous
      .filter((item) => item.category === "资产")
      .reduce((sum, item) => sum + item.closingDebit - item.closingCredit, 0);
    return [
      ...assetItems,
      row(19, "资产合计", "资产", assetTotal, priorAssetTotal, 0, true),
      ...liabilityItems,
      row(
        40,
        "负债和所有者权益合计",
        "所有者权益",
        assetTotal,
        priorAssetTotal,
        0,
        true,
      ),
    ];
  }
  if (reportId === 2 || reportId === 4) {
    const revenue = amountByCodes(balances, ["6001", "6051", "6301"], "period");
    const cost = -amountByCodes(balances, ["6401", "6402", "6403"], "period");
    const expenses = -amountByCodes(
      balances,
      ["6601", "6602", "6603", "6711", "6801"],
      "period",
    );
    return [
      row(1, "营业收入", "利润", revenue, revenue * 0.92),
      row(2, "营业成本及税金", "利润", cost, cost * 0.9),
      row(3, "期间费用", "利润", expenses, expenses * 0.88),
      row(
        4,
        "利润总额",
        "利润",
        revenue - cost - expenses,
        (revenue - cost - expenses) * 0.9,
        0,
        true,
      ),
      row(
        5,
        "净利润",
        "利润",
        revenue - cost - expenses,
        (revenue - cost - expenses) * 0.9,
        0,
        true,
      ),
    ];
  }
  const cash = amountByCodes(balances, ["1001", "1002", "1012"], "closing");
  const priorCash = amountByCodes(
    previous,
    ["1001", "1002", "1012"],
    "closing",
  );
  return [
    row(
      1,
      "销售商品、提供劳务收到的现金",
      "经营活动",
      Math.max(cash - priorCash, 0),
      Math.max(priorCash * 0.08, 0),
    ),
    row(
      10,
      "经营活动产生的现金流量净额",
      "经营活动",
      cash - priorCash,
      priorCash * 0.05,
      0,
      true,
    ),
    row(20, "投资活动产生的现金流量净额", "投资活动", 0, 0, 0, true),
    row(30, "筹资活动产生的现金流量净额", "筹资活动", 0, 0, 0, true),
    row(40, "期末现金及现金等价物余额", "现金", cash, priorCash, 0, true),
  ];
}

export const report = {
  list: (
    accountSetId: string,
    year: number,
    month: number,
  ): Promise<ReportListItem[]> =>
    wait(
      reportNames.map((name, index) => {
        const key = `${accountSetId}-${year}-${month}-${index + 1}`;
        return {
          id: key,
          reportId: index + 1,
          name,
          year,
          month,
          status: generatedReports[key] ? "已生成" : "未生成",
          generatedAt: generatedReports[key]?.generatedAt,
        };
      }),
    ),
  generate: async (
    reportId: number,
    accountSetId: string,
    year: number,
    month: number,
  ) => {
    const rows = buildReport(reportId, accountSetId, year, month);
    generatedReports[`${accountSetId}-${year}-${month}-${reportId}`] = {
      generatedAt: new Date().toISOString(),
      rows,
    };
    return wait(rows);
  },
  data: async (
    reportId: number,
    accountSetId: string,
    year: number,
    month: number,
  ) =>
    generatedReports[`${accountSetId}-${year}-${month}-${reportId}`]?.rows ??
    report.generate(reportId, accountSetId, year, month),
  template: {
    list: (accountSetId: string) =>
      wait(
        financeReportTemplates.filter(
          (item) => item.accountSetId === accountSetId,
        ),
      ),
    detail: (id: string) =>
      wait(financeReportTemplates.find((item) => item.id === id) ?? null),
    save: (value: FinanceReportTemplate) =>
      wait(upsert(financeReportTemplates, value)),
    delete: async (id: string) => {
      const index = financeReportTemplates.findIndex((item) => item.id === id);
      if (index >= 0) financeReportTemplates.splice(index, 1);
      return wait(index >= 0);
    },
    formulaOptions: () =>
      wait([
        "取科目期初余额",
        "取科目期末余额",
        "取科目本期借方发生额",
        "取科目本期贷方发生额",
        "取上年同期金额",
        "SUM(A1:B2)",
      ]),
  },
  legacyTemplates: {
    ...crudService<ReportTemplate>(reportTemplates),
    view: (id: string) =>
      wait(reportTemplates.find((item) => item.id === id) ?? null),
  },
};

export const checkout = {
  list: (accountSetId: string) =>
    wait(periods.filter((item) => item.accountSetId === accountSetId)),
  preview: async (
    accountSetId: string,
    year: number,
    month: number,
  ): Promise<CheckoutCheckRow[]> => {
    const periodVouchers = vouchers.filter(
      (item) =>
        item.accountSetId === accountSetId &&
        item.year === year &&
        item.month === month &&
        item.status !== "void",
    );
    const balanced = periodVouchers.every(
      (item) =>
        Math.abs(
          item.details.reduce(
            (sum, detail) => sum + detail.debitAmount - detail.creditAmount,
            0,
          ),
        ) < 0.001,
    );
    const numbers = periodVouchers
      .map((item) => item.number)
      .sort((a, b) => a - b);
    const continuous = numbers.every(
      (number, index) => index === 0 || number - numbers[index - 1] <= 1,
    );
    const unaudited = periodVouchers.filter(
      (item) => item.status === "draft",
    ).length;
    const hasCarryForward = periodVouchers.some(
      (item) => item.sourceType === "carry-forward",
    );
    return wait([
      {
        key: "opening",
        name: "期初检查",
        passed: true,
        message: "期初余额已录入",
      },
      {
        key: "balance",
        name: "期末检查",
        passed: balanced,
        message: balanced ? "借贷平衡" : "存在借贷不平衡凭证",
      },
      {
        key: "report",
        name: "报表检查",
        passed: balanced,
        message: balanced ? "资产负债表平衡" : "资产负债表不平衡",
      },
      {
        key: "number",
        name: "断号检查",
        passed: continuous,
        message: continuous ? "凭证号连续" : "凭证号存在断号",
      },
      {
        key: "audit",
        name: "审核检查",
        passed: unaudited === 0,
        message: unaudited ? `仍有 ${unaudited} 张未审核凭证` : "凭证均已审核",
      },
      {
        key: "profit",
        name: "损益结转",
        passed: hasCarryForward,
        message: hasCarryForward ? "损益已结转" : "尚未生成结转损益凭证",
      },
    ]);
  },
  check: async (accountSetId: string, year: number, month: number) => {
    const rows = await checkout.preview(accountSetId, year, month);
    return { balanced: rows.every((item) => item.passed), rows, year, month };
  },
  checkOut: async (accountSetId: string, year: number, month: number) => {
    const rows = await checkout.preview(accountSetId, year, month);
    if (rows.some((item) => !item.passed))
      throw new Error("结账检查未全部通过");
    const period = periods.find(
      (item) =>
        item.accountSetId === accountSetId &&
        item.year === year &&
        item.month === month,
    );
    if (!period) throw new Error("期间不存在");
    period.status = "closed";
    period.closedAt = new Date().toISOString();
    return wait(period);
  },
  unCheck: async (accountSetId: string, year: number, month: number) => {
    const period = periods.find(
      (item) =>
        item.accountSetId === accountSetId &&
        item.year === year &&
        item.month === month,
    );
    if (period) period.status = "open";
    return wait(period ?? null);
  },
  carryForward: async (
    accountSetId: string,
    year: number,
    month: number,
  ): Promise<CarryForwardItem[]> => {
    const profitSubjects = subjects.filter(
      (item) =>
        item.accountSetId === accountSetId &&
        item.category === "损益" &&
        item.code !== "4103",
    );
    return wait(
      profitSubjects
        .map((subjectItem) => {
          const details = vouchers
            .filter(
              (item) =>
                item.accountSetId === accountSetId &&
                item.year === year &&
                item.month === month &&
                item.status !== "void" &&
                item.sourceType !== "carry-forward",
            )
            .flatMap((item) => item.details)
            .filter((item) => item.subjectId === subjectItem.id);
          const debitAmount = details.reduce(
            (sum, item) => sum + item.debitAmount,
            0,
          );
          const creditAmount = details.reduce(
            (sum, item) => sum + item.creditAmount,
            0,
          );
          return {
            subjectId: subjectItem.id,
            subjectCode: subjectItem.code,
            subjectName: subjectItem.name,
            debitAmount,
            creditAmount,
            netAmount: creditAmount - debitAmount,
          };
        })
        .filter((item) => Math.abs(item.netAmount) > 0.001),
    );
  },
  confirmCarryForward: async (
    accountSetId: string,
    year: number,
    month: number,
    userId: string,
  ) => {
    const existing = vouchers.find(
      (item) =>
        item.accountSetId === accountSetId &&
        item.year === year &&
        item.month === month &&
        item.sourceType === "carry-forward",
    );
    if (existing) return wait(existing);
    const items = await checkout.carryForward(accountSetId, year, month);
    const profit = subjects.find(
      (item) => item.accountSetId === accountSetId && item.code === "4103",
    );
    if (!profit || !items.length) throw new Error("没有需要结转的损益发生额");
    const details = items.map((item) => ({
      summary: `第${month}期 结转损益`,
      subjectId: item.subjectId,
      subjectCode: item.subjectCode,
      subjectName: item.subjectName,
      subjectPath: `${item.subjectCode} ${item.subjectName}`,
      balanceDirection: subjects.find((entry) => entry.id === item.subjectId)
        ?.balanceDirection,
      debitAmount: item.netAmount > 0 ? item.netAmount : 0,
      creditAmount: item.netAmount < 0 ? Math.abs(item.netAmount) : 0,
      assistAccountings: {},
      currencyId: `${accountSetId}-CNY`,
      exchangeRate: 1,
    }));
    const debit = details.reduce((sum, item) => sum + item.debitAmount, 0);
    const credit = details.reduce((sum, item) => sum + item.creditAmount, 0);
    details.push({
      summary: `第${month}期 结转损益`,
      subjectId: profit.id,
      subjectCode: profit.code,
      subjectName: profit.name,
      subjectPath: `${profit.code} ${profit.name}`,
      balanceDirection: profit.balanceDirection,
      debitAmount: Math.max(0, credit - debit),
      creditAmount: Math.max(0, debit - credit),
      assistAccountings: {},
      currencyId: `${accountSetId}-CNY`,
      exchangeRate: 1,
    });
    return voucher.save({
      accountSetId,
      voucherWordId: `${accountSetId}-vw-转`,
      word: "转",
      year,
      month,
      date: `${year}-${String(month).padStart(2, "0")}-${new Date(year, month, 0).getDate()}`,
      attachmentCount: 0,
      status: "draft",
      sourceType: "carry-forward",
      createdBy: userId,
      details,
    });
  },
};

export function calculateTaxBurden(
  invoicesForPeriod: Invoice[],
  input: TaxBurdenInput,
): TaxBurdenResult {
  const output = invoicesForPeriod.filter(
    (item) => item.tab === "output" && item.status === "正常",
  );
  const red = invoicesForPeriod.filter(
    (item) => item.tab === "output" && item.status === "红冲",
  );
  const inputInvoices = invoicesForPeriod.filter(
    (item) =>
      item.tab === "input" &&
      item.status === "正常" &&
      (item.certification === "已认证" || item.certification === "已勾选"),
  );
  const outputTax =
    output.reduce((sum, item) => sum + item.tax, 0) -
    red.reduce((sum, item) => sum + item.tax, 0) +
    input.unbilled +
    input.otherOutput -
    input.deductions;
  const inputTax =
    inputInvoices.reduce((sum, item) => sum + item.tax, 0) +
    input.otherInput +
    input.creditItems -
    input.transferOut -
    input.unclaimedInput;
  const payable = Math.max(
    0,
    outputTax -
      inputTax -
      input.openingCredit -
      input.relief -
      input.creditItems -
      input.customItems,
  );
  const salesAmount = output.reduce((sum, item) => sum + item.amount, 0);
  return {
    outputTax,
    inputTax,
    payable,
    endingCredit: Math.max(0, inputTax + input.openingCredit - outputTax),
    rate: salesAmount ? payable / salesAmount : 0,
    surcharge: payable * 0.12,
    salesAmount,
  };
}

export const invoice = {
  list: (accountSetId: string, tab: InvoiceTab, keyword = "") =>
    wait(
      invoices.filter(
        (item) =>
          item.accountSetId === accountSetId &&
          item.tab === tab &&
          (!keyword ||
            `${item.partner} ${item.number} ${item.digitalNumber ?? ""}`.includes(
              keyword,
            )),
      ),
    ),
  save: (value: Invoice) => wait(upsert(invoices, value)),
  delete: async (id: string) => {
    const item = invoices.find((entry) => entry.id === id);
    if (item?.voucherId) throw new Error("已生成凭证的发票禁止删除");
    const index = invoices.findIndex((entry) => entry.id === id);
    if (index >= 0) invoices.splice(index, 1);
    return wait(index >= 0);
  },
  templates: {
    list: (accountSetId: string, tab?: InvoiceTab) =>
      wait(
        invoiceTemplates.filter(
          (item) =>
            item.accountSetId === accountSetId && (!tab || item.tab === tab),
        ),
      ),
    save: (value: InvoiceTemplate) => wait(upsert(invoiceTemplates, value)),
    delete: async (id: string) => {
      const item = invoiceTemplates.find((entry) => entry.id === id);
      if (item?.isDefault) throw new Error("默认模板不可删除");
      const index = invoiceTemplates.findIndex((entry) => entry.id === id);
      if (index >= 0) invoiceTemplates.splice(index, 1);
      return wait(index >= 0);
    },
  },
  generateVoucher: async (invoiceId: string, userId: string) => {
    const item = invoices.find((entry) => entry.id === invoiceId);
    if (!item) throw new Error("发票不存在");
    if (item.voucherId) throw new Error("同一发票不可重复生成凭证");
    const template =
      invoiceTemplates.find((entry) => entry.id === item.templateId) ??
      invoiceTemplates.find(
        (entry) =>
          entry.accountSetId === item.accountSetId &&
          entry.tab === item.tab &&
          entry.isDefault,
      );
    if (!template) throw new Error("未找到凭证模板");
    const details = template.entries.map((entry) => {
      const subjectItem = subjects.find(
        (subject) =>
          subject.accountSetId === item.accountSetId &&
          subject.code === entry.subjectCode,
      );
      if (!subjectItem) throw new Error(`缺少科目 ${entry.subjectCode}`);
      const amount =
        entry.formula === "amount"
          ? item.amount
          : entry.formula === "tax"
            ? item.tax
            : item.total;
      return {
        summary: `${item.partner} ${item.digitalNumber ?? item.number}`,
        subjectId: subjectItem.id,
        subjectCode: subjectItem.code,
        subjectName: subjectItem.name,
        debitAmount: entry.direction === "借" ? amount : 0,
        creditAmount: entry.direction === "贷" ? amount : 0,
        assistAccountings: {},
        currencyId: `${item.accountSetId}-CNY`,
        exchangeRate: 1,
      };
    });
    const saved = await voucher.save({
      accountSetId: item.accountSetId,
      voucherWordId: `${item.accountSetId}-vw-记`,
      word: "记",
      year: Number(item.date.slice(0, 4)),
      month: Number(item.date.slice(5, 7)),
      date: item.date,
      attachmentCount: 1,
      status: "draft",
      sourceType: "import",
      createdBy: userId,
      details,
    });
    item.voucherId = saved.id;
    return wait(saved);
  },
};
