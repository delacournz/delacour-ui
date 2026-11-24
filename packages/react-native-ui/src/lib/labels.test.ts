import { describe, expect, test } from "bun:test";
import {
	areLabelsShallowEqual,
	DELACOUR_DEFAULT_LABELS,
	type DelacourLabelOverrides,
	mergeLabelOverrides,
	resolveLabels,
} from "./labels";

describe("DELACOUR_DEFAULT_LABELS", () => {
	test("breadcrumb is today's English", () => {
		const labels = DELACOUR_DEFAULT_LABELS.breadcrumb;
		expect(labels.list).toBe("Breadcrumb");
		expect(labels.currentPage).toBe("current page");
		expect(labels.ellipsis(undefined, true)).toBe("Show hidden levels");
		expect(labels.ellipsis(1, true)).toBe("Show 1 hidden level");
		expect(labels.ellipsis(3, true)).toBe("Show 3 hidden levels");
		expect(labels.ellipsis(undefined, false)).toBe("Hidden levels");
		expect(labels.ellipsis(1, false)).toBe("1 hidden level");
		expect(labels.ellipsis(4, false)).toBe("4 hidden levels");
	});

	test("carousel is today's English", () => {
		const labels = DELACOUR_DEFAULT_LABELS.carousel;
		expect(labels.previous).toBe("Previous slide");
		expect(labels.next).toBe("Next slide");
		expect(labels.position(2, 5)).toBe("2 of 5");
	});

	test("kpi is today's English", () => {
		const labels = DELACOUR_DEFAULT_LABELS.kpi;
		expect(labels.up).toBe("Up");
		expect(labels.down).toBe("Down");
		expect(labels.flat).toBe("No change");
		expect(labels.percent("7.8")).toBe("7.8 percent");
		expect(labels.noTrendData).toBe("No trend data");
		expect(labels.sparkline(12, "4", "9")).toBe("Trend over 12 points, from 4 to 9");
		expect(labels.loading).toBe("Loading");
	});

	test("motion is today's English", () => {
		expect(DELACOUR_DEFAULT_LABELS.motion).toEqual({ pause: "Pause animation", resume: "Resume animation" });
	});

	test("pagination is today's English", () => {
		const labels = DELACOUR_DEFAULT_LABELS.pagination;
		expect(labels.list).toBe("Pagination");
		expect(labels.previous).toBe("Previous");
		expect(labels.next).toBe("Next");
		expect(labels.previousPage).toBe("Previous page");
		expect(labels.nextPage).toBe("Next page");
		expect(labels.page(3)).toBe("Page 3");
		expect(labels.pageOf(3, 12)).toBe("Page 3 of 12");
		expect(labels.jump(1, 5)).toBe("Jump forward 5 pages");
		expect(labels.jump(-1, 1)).toBe("Jump back 1 page");
		expect(labels.status({ from: 41, to: 60, total: 472 })).toBe("41–60 of 472");
	});
});

describe("resolveLabels", () => {
	test("no overrides gives the defaults", () => {
		expect(resolveLabels("pagination", undefined, undefined)).toEqual(DELACOUR_DEFAULT_LABELS.pagination);
	});

	test("the provider overrides a default", () => {
		const provider: DelacourLabelOverrides = { pagination: { next: "Suivant" } };
		const labels = resolveLabels("pagination", provider, undefined);
		expect(labels.next).toBe("Suivant");
		expect(labels.previous).toBe("Previous");
	});

	test("the component prop overrides the provider", () => {
		const provider: DelacourLabelOverrides = { pagination: { next: "Suivant", previous: "Précédent" } };
		const labels = resolveLabels("pagination", provider, { next: "Weiter" });
		expect(labels.next).toBe("Weiter");
		expect(labels.previous).toBe("Précédent");
	});

	test("an explicit undefined never clobbers a default or the provider", () => {
		const provider: DelacourLabelOverrides = { pagination: { next: "Suivant", previous: undefined } };
		const labels = resolveLabels("pagination", provider, { next: undefined });
		expect(labels.next).toBe("Suivant");
		expect(labels.previous).toBe("Previous");
	});

	test("function-valued labels survive the merge", () => {
		const page = (n: number): string => `Seite ${n}`;
		const labels = resolveLabels("pagination", { pagination: { page } }, undefined);
		expect(labels.page).toBe(page);
		expect(labels.page(2)).toBe("Seite 2");
		expect(labels.pageOf(2, 4)).toBe("Page 2 of 4");
	});

	test("another component's overrides do not leak", () => {
		const labels = resolveLabels("carousel", { pagination: { next: "Suivant" } }, undefined);
		expect(labels).toEqual(DELACOUR_DEFAULT_LABELS.carousel);
	});

	test("the defaults are never mutated", () => {
		resolveLabels("kpi", { kpi: { up: "Hausse" } }, { down: "Baisse" });
		expect(DELACOUR_DEFAULT_LABELS.kpi.up).toBe("Up");
		expect(DELACOUR_DEFAULT_LABELS.kpi.down).toBe("Down");
	});
});

describe("mergeLabelOverrides", () => {
	test("an inner provider overrides an outer one per key, and keeps the rest", () => {
		const outer: DelacourLabelOverrides = {
			pagination: { next: "Suivant", previous: "Précédent" },
			kpi: { up: "Hausse" },
		};
		const inner: DelacourLabelOverrides = { pagination: { next: "Weiter", previous: undefined } };
		const merged = mergeLabelOverrides(outer, inner);
		expect(merged.pagination?.next).toBe("Weiter");
		expect(merged.pagination?.previous).toBe("Précédent");
		expect(merged.kpi?.up).toBe("Hausse");
	});

	test("an absent inner map returns the outer one unchanged", () => {
		const outer: DelacourLabelOverrides = { kpi: { up: "Hausse" } };
		expect(mergeLabelOverrides(outer, undefined)).toBe(outer);
	});
});

describe("areLabelsShallowEqual", () => {
	const page = (n: number): string => `Seite ${n}`;

	test("two literals with the same keys and values are equal", () => {
		expect(areLabelsShallowEqual({ next: "Weiter", page }, { next: "Weiter", page })).toBe(true);
	});

	test("a changed value is not equal", () => {
		expect(areLabelsShallowEqual({ next: "Weiter" }, { next: "Suivant" })).toBe(false);
	});

	test("a new function is not equal, even with the same body", () => {
		expect(areLabelsShallowEqual({ page }, { page: (n: number) => `Seite ${n}` })).toBe(false);
	});

	test("an added or removed key is not equal", () => {
		expect(areLabelsShallowEqual({ next: "Weiter" }, { next: "Weiter", previous: "Zurück" })).toBe(false);
		expect(areLabelsShallowEqual({ next: "Weiter", previous: "Zurück" }, { next: "Weiter" })).toBe(false);
	});

	test("undefined against undefined is equal; against an object it is not", () => {
		expect(areLabelsShallowEqual(undefined, undefined)).toBe(true);
		expect(areLabelsShallowEqual(undefined, {})).toBe(false);
		expect(areLabelsShallowEqual({}, undefined)).toBe(false);
	});
});
