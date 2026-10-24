import { calculateTaxBurden, invoice } from "@/lib/finance/service";
import { invoices } from "@/lib/finance/seed";

describe("invoice business rules", () => {
  test("invoice line tax and total are consistent", () => {
    const item = invoices.find((entry) => entry.digitalNumber === "26132000000334092027")!;
    expect(item.lines[0].amount * item.lines[0].taxRate).toBeCloseTo(item.tax, 2);
    expect(item.amount + item.tax).toBe(item.total);
  });
  test("tax burden uses output minus certified input", () => {
    const result = calculateTaxBurden(invoices.filter((item) => item.accountSetId === "a1"), { unbilled: 0, deductions: 0, otherOutput: 0, otherInput: 0, transferOut: 0, unclaimedInput: 0, openingCredit: 0, relief: 0, creditItems: 0, customItems: 0, targetRate: .03 });
    expect(result.outputTax).toBeCloseTo(1196.98, 2);
    expect(result.inputTax).toBeCloseTo(195, 2);
    expect(result.payable).toBeCloseTo(1001.98, 2);
  });
  test("generating voucher is idempotent", async () => {
    const item = invoices.find((entry) => entry.id === "a1-inv-1")!;
    item.voucherId = undefined;
    const voucher = await invoice.generateVoucher(item.id, "u1");
    expect(voucher.word).toBe("记");
    await expect(invoice.generateVoucher(item.id, "u1")).rejects.toThrow("不可重复");
    item.voucherId = undefined;
  });
});
