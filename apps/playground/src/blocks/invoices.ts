export type InvoiceStatus = "paid" | "unpaid" | "overdue" | "draft";
export type InvoiceFilter = InvoiceStatus | "all";

export type Invoice = {
	readonly id: string;
	readonly number: string;
	readonly customer: string;
	readonly issued: string;
	readonly amountCents: number;
	readonly status: InvoiceStatus;
};

export const INVOICES: readonly Invoice[] = [
	{ id: "i1", number: "INV-1042", customer: "Kauri Coffee", issued: "3 Oct", amountCents: 248000, status: "paid" },
	{ id: "i2", number: "INV-1041", customer: "Harbour Print", issued: "29 Sep", amountCents: 91550, status: "unpaid" },
	{ id: "i3", number: "INV-1040", customer: "Tui Studio", issued: "21 Sep", amountCents: 1250000, status: "overdue" },
	{ id: "i4", number: "INV-1039", customer: "Fernbird Labs", issued: "18 Sep", amountCents: 64000, status: "paid" },
	{ id: "i5", number: "INV-1038", customer: "Pōhutukawa Pty", issued: "12 Sep", amountCents: 377525, status: "draft" },
	{ id: "i6", number: "INV-1037", customer: "Kauri Coffee", issued: "2 Sep", amountCents: 248000, status: "paid" },
];

export const INVOICE_FILTERS: readonly InvoiceFilter[] = ["all", "paid", "unpaid", "overdue", "draft"];

export const INVOICE_FILTER_LABELS: Record<InvoiceFilter, string> = {
	all: "All",
	paid: "Paid",
	unpaid: "Unpaid",
	overdue: "Overdue",
	draft: "Draft",
};

/** Cents as dollars with thousands separators — a fixed locale so a fixture renders the same everywhere. */
export function formatMoney(cents: number): string {
	const dollars = Math.floor(cents / 100);
	const rest = String(cents % 100).padStart(2, "0");
	return `$${dollars.toLocaleString("en-NZ")}.${rest}`;
}

export function outstandingTotal(invoices: readonly Invoice[]): number {
	return invoices
		.filter((invoice) => invoice.status === "unpaid" || invoice.status === "overdue")
		.reduce((sum, invoice) => sum + invoice.amountCents, 0);
}

export function filterInvoices(invoices: readonly Invoice[], filter: InvoiceFilter): readonly Invoice[] {
	return filter === "all" ? invoices : invoices.filter((invoice) => invoice.status === filter);
}
