import { describe, expect, test } from "bun:test";
import { filterInvoices, formatMoney, INVOICES, outstandingTotal } from "./invoices";

describe("formatMoney", () => {
	test("formats cents as dollars with separators", () => {
		expect(formatMoney(123456)).toBe("$1,234.56");
		expect(formatMoney(5)).toBe("$0.05");
		expect(formatMoney(0)).toBe("$0.00");
	});
});

describe("outstandingTotal", () => {
	test("sums only unpaid and overdue", () => {
		const total = outstandingTotal(INVOICES);
		const expected = INVOICES.filter((i) => i.status === "unpaid" || i.status === "overdue").reduce(
			(sum, i) => sum + i.amountCents,
			0
		);
		expect(total).toBe(expected);
	});
});

describe("filterInvoices", () => {
	test("all returns everything", () => expect(filterInvoices(INVOICES, "all")).toHaveLength(INVOICES.length));
	test("narrows by status", () => {
		for (const invoice of filterInvoices(INVOICES, "paid")) expect(invoice.status).toBe("paid");
	});
});
