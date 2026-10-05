import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
	clampPage,
	formatCompact,
	formatCompactAccessibilityValue,
	formatEllipsisLabel,
	formatPageLabel,
	formatPaginationStatus,
	PAGINATION_DEFAULT_BOUNDARIES,
	PAGINATION_DEFAULT_PAGE_JUMP,
	PAGINATION_DEFAULT_SIBLINGS,
	PAGINATION_DEFAULT_SIZE,
	PAGINATION_DEFAULT_VARIANT,
	PAGINATION_HIT_SLOP,
	PAGINATION_MIN_TARGET,
	PAGINATION_SIZES,
	PAGINATION_VARIANTS,
	type PaginationToken,
	paginationVariants,
	resolveControlForeground,
	resolveControlGlyph,
	resolveControlState,
	resolveEllipsisTarget,
	resolveItemForeground,
	resolvePageCorrection,
	resolvePaginationRange,
	resolvePaginationRunLength,
	resolvePaginationStatus,
	shouldEmitPage,
} from "./pagination.variants";

const TOKENS_CSS = readFileSync(join(import.meta.dirname, "../../styles/tokens.css"), "utf-8");
const THEME_CSS = readFileSync(join(import.meta.dirname, "../../styles/theme.css"), "utf-8");

/** A slot's class string, with `tv`'s empty-slot `undefined` flattened. */
function cls(value: string | undefined): string {
	return value ?? "";
}

/** The run as a string — `1 2 3 … 24` — so a failing table reads at a glance. */
function show(tokens: readonly PaginationToken[]): string {
	return tokens
		.map((token) => (token.kind === "page" ? String(token.page) : token.direction === 1 ? "»" : "«"))
		.join(" ");
}

/** The page numbers in a run, in order. */
function pages(tokens: readonly PaginationToken[]): number[] {
	return tokens.flatMap((token) => (token.kind === "page" ? [token.page] : []));
}

/** The pixel value of a `--spacing-button-*` token in tokens.css. */
function buttonSpacingPx(size: string): number {
	const found = TOKENS_CSS.match(new RegExp(`--spacing-button-${size}:\\s*(\\d+)px`))?.[1];
	if (found === undefined) throw new Error(`no --spacing-button-${size} in tokens.css`);
	return Number(found);
}

/** The step a `prefix-N` class sets — `gap-2` with `gap` yields 2. */
function step(value: string, prefix: string): number {
	const found = value.match(new RegExp(`(?:^|\\s)${prefix}-(\\d+(?:\\.\\d+)?)(?:\\s|$)`))?.[1];
	if (found === undefined) throw new Error(`no ${prefix}-* in "${value}"`);
	return Number(found);
}

describe("constants", () => {
	test("the axes are the ones the docs name", () => {
		expect(PAGINATION_VARIANTS).toEqual(["numbers", "compact", "simple"]);
		expect(PAGINATION_SIZES).toEqual(["sm", "md"]);
	});

	test("the defaults are the spec's", () => {
		expect(PAGINATION_DEFAULT_VARIANT).toBe("numbers");
		expect(PAGINATION_DEFAULT_SIZE).toBe("md");
		expect(PAGINATION_DEFAULT_SIBLINGS).toBe(1);
		expect(PAGINATION_DEFAULT_BOUNDARIES).toBe(1);
		expect(PAGINATION_DEFAULT_PAGE_JUMP).toBe(5);
	});

	test("the named defaults match tv's defaultVariants", () => {
		const fromDefaults = paginationVariants();
		const named = paginationVariants({ size: PAGINATION_DEFAULT_SIZE });
		for (const slot of ["root", "run", "item", "itemLabel", "control", "ellipsis", "compact"] as const) {
			expect(cls(fromDefaults[slot]())).toBe(cls(named[slot]()));
		}
	});
});

describe("clampPage", () => {
	test.each([
		[3, 10, 3],
		[0, 10, 1],
		[-4, 10, 1],
		[11, 10, 10],
		[2.6, 10, 3],
		[Number.NaN, 10, 1],
		[Number.POSITIVE_INFINITY, 10, 10],
		[5, 0, 1],
		[5, -3, 1],
		[1, 1, 1],
	])("clampPage(%p, %p) → %p", (page, count, expected) => {
		expect(clampPage(page, count)).toBe(expected);
	});

	test("a NaN count clamps to the one page that always exists", () => {
		expect(clampPage(4, Number.NaN)).toBe(1);
	});
});

describe("resolvePaginationRunLength", () => {
	test("is 2 × boundaries + 2 × siblings + 3", () => {
		expect(resolvePaginationRunLength(1, 1)).toBe(7);
		expect(resolvePaginationRunLength(0, 0)).toBe(3);
		expect(resolvePaginationRunLength(2, 2)).toBe(11);
		expect(resolvePaginationRunLength(1, 0)).toBe(5);
	});

	test("negative and fractional settings are floored at zero", () => {
		expect(resolvePaginationRunLength(-1, -2)).toBe(3);
		expect(resolvePaginationRunLength(1.8, 1.2)).toBe(7);
	});
});

describe("resolvePaginationRange", () => {
	test("no pages draws no run", () => {
		expect(resolvePaginationRange({ boundaries: 1, count: 0, page: 1, siblings: 1 })).toEqual([]);
	});

	test("one page is one item", () => {
		expect(show(resolvePaginationRange({ boundaries: 1, count: 1, page: 1, siblings: 1 }))).toBe("1");
	});

	test("a count that fits is every page, with no ellipsis", () => {
		expect(show(resolvePaginationRange({ boundaries: 1, count: 5, page: 3, siblings: 1 }))).toBe("1 2 3 4 5");
		expect(show(resolvePaginationRange({ boundaries: 1, count: 7, page: 1, siblings: 1 }))).toBe("1 2 3 4 5 6 7");
	});

	test.each([
		[1, "1 2 3 4 5 » 24"],
		[2, "1 2 3 4 5 » 24"],
		[4, "1 2 3 4 5 » 24"],
		[5, "1 « 4 5 6 » 24"],
		[12, "1 « 11 12 13 » 24"],
		[20, "1 « 19 20 21 » 24"],
		[21, "1 « 20 21 22 23 24"],
		[24, "1 « 20 21 22 23 24"],
	])("count 24, page %p → %s", (page, expected) => {
		expect(show(resolvePaginationRange({ boundaries: 1, count: 24, page, siblings: 1 }))).toBe(expected);
	});

	test.each([
		[1, "1 2 3 4 5 6 7 8 9 » 100"],
		[50, "1 « 47 48 49 50 51 52 53 » 100"],
		[100, "1 « 92 93 94 95 96 97 98 99 100"],
	])("siblings 3, count 100, page %p → %s", (page, expected) => {
		expect(show(resolvePaginationRange({ boundaries: 1, count: 100, page, siblings: 3 }))).toBe(expected);
	});

	test.each([
		[1, "1 2 3 4 »"],
		[50, "« 49 50 51 »"],
		[100, "« 97 98 99 100"],
	])("boundaries 0, siblings 1, count 100, page %p → %s", (page, expected) => {
		// With no boundary, the slot an end page would take is the ellipsis's — or
		// the end page itself, when the window sits against that end.
		expect(show(resolvePaginationRange({ boundaries: 0, count: 100, page, siblings: 1 }))).toBe(expected);
	});

	test("siblings 0 keeps just the current page between the ellipses", () => {
		expect(show(resolvePaginationRange({ boundaries: 1, count: 100, page: 50, siblings: 0 }))).toBe("1 « 50 » 100");
	});

	test("boundaries 2 keeps two pages at each end", () => {
		expect(show(resolvePaginationRange({ boundaries: 2, count: 100, page: 50, siblings: 1 }))).toBe(
			"1 2 « 49 50 51 » 99 100"
		);
	});

	test("an out-of-range page is drawn as its clamp", () => {
		expect(resolvePaginationRange({ boundaries: 1, count: 24, page: 99, siblings: 1 })).toEqual(
			resolvePaginationRange({ boundaries: 1, count: 24, page: 24, siblings: 1 })
		);
		expect(resolvePaginationRange({ boundaries: 1, count: 24, page: -2, siblings: 1 })).toEqual(
			resolvePaginationRange({ boundaries: 1, count: 24, page: 1, siblings: 1 })
		);
	});

	const COUNTS = [0, 1, 5, 7, 24, 100];
	const SETTINGS = [0, 1, 2];

	describe("invariants, across counts 0/1/5/7/24/100 × siblings 0–2 × boundaries 0–2 × every page", () => {
		for (const count of COUNTS) {
			for (const siblings of SETTINGS) {
				for (const boundaries of SETTINGS) {
					const label = `count ${count}, siblings ${siblings}, boundaries ${boundaries}`;
					const runs = Array.from({ length: Math.max(1, count) }, (_, index) => ({
						page: index + 1,
						tokens: resolvePaginationRange({ boundaries, count, page: index + 1, siblings }),
					}));
					const fixed = resolvePaginationRunLength(siblings, boundaries);

					test(`${label}: the length is constant across every page`, () => {
						const expected = count === 0 ? 0 : Math.min(count, fixed);
						for (const run of runs) expect(run.tokens.length).toBe(expected);
					});

					test(`${label}: the current page is always drawn`, () => {
						if (count === 0) return;
						for (const run of runs) expect(pages(run.tokens)).toContain(run.page);
					});

					test(`${label}: pages ascend, within 1…count, and the ends are drawn whenever boundaries are`, () => {
						for (const run of runs) {
							const drawn = pages(run.tokens);
							expect(drawn).toEqual([...drawn].sort((a, b) => a - b));
							expect(new Set(drawn).size).toBe(drawn.length);
							for (const page of drawn) {
								expect(page).toBeGreaterThanOrEqual(1);
								expect(page).toBeLessThanOrEqual(count);
							}
							if (count > 0 && boundaries > 0) {
								expect(drawn[0]).toBe(1);
								expect(drawn.at(-1)).toBe(count);
							}
						}
					});

					test(`${label}: an ellipsis never hides a single page, and only an ellipsis hides any`, () => {
						for (const run of runs) {
							const { tokens } = run;
							for (let index = 0; index < tokens.length; index++) {
								const token = tokens[index];
								if (token?.kind !== "ellipsis") continue;
								const before = index === 0 ? 0 : pageAt(tokens, index - 1);
								const after = index === tokens.length - 1 ? count + 1 : pageAt(tokens, index + 1);
								expect(after - before - 1).toBeGreaterThanOrEqual(2);
								expect(token.direction).toBe(after <= run.page ? -1 : 1);
							}
							for (let index = 1; index < tokens.length; index++) {
								const previous = tokens[index - 1];
								const current = tokens[index];
								if (previous?.kind === "page" && current?.kind === "page") {
									expect(current.page).toBe(previous.page + 1);
								}
							}
						}
					});
				}
			}
		}
	});
});

/** The page at an index the invariants know to be a page. */
function pageAt(tokens: readonly PaginationToken[], index: number): number {
	const token = tokens[index];
	if (token?.kind !== "page") throw new Error(`token ${index} is not a page`);
	return token.page;
}

describe("resolveEllipsisTarget", () => {
	test.each([
		[10, 1, 5, 24, 15],
		[10, -1, 5, 24, 5],
		[22, 1, 5, 24, 24],
		[3, -1, 5, 24, 1],
		[3, 1, 0, 24, 3],
		[3, 1, 2.5, 24, 6],
	] as const)("page %p, direction %p, jump %p, count %p → %p", (page, direction, jump, count, expected) => {
		expect(resolveEllipsisTarget(page, direction, jump, count)).toBe(expected);
	});
});

describe("resolveControlState", () => {
	test.each([
		[1, 10, { canNext: true, canPrevious: false }],
		[5, 10, { canNext: true, canPrevious: true }],
		[10, 10, { canNext: false, canPrevious: true }],
		[1, 1, { canNext: false, canPrevious: false }],
		[1, 0, { canNext: false, canPrevious: false }],
		[40, 10, { canNext: false, canPrevious: true }],
	])("page %p of %p → %p", (page, count, expected) => {
		expect(resolveControlState(page, count)).toEqual(expected);
	});
});

describe("shouldEmitPage", () => {
	test("only a different page is a change", () => {
		expect(shouldEmitPage(3, 4)).toBe(true);
		expect(shouldEmitPage(3, 3)).toBe(false);
	});
});

describe("resolvePageCorrection", () => {
	test("an in-range page needs none", () => {
		expect(resolvePageCorrection(3, 10)).toBeUndefined();
		expect(resolvePageCorrection(1, 0)).toBeUndefined();
	});

	test("an out-of-range page is corrected to its clamp", () => {
		expect(resolvePageCorrection(12, 10)).toBe(10);
		expect(resolvePageCorrection(0, 10)).toBe(1);
		expect(resolvePageCorrection(Number.NaN, 10)).toBe(1);
		expect(resolvePageCorrection(4, 0)).toBe(1);
	});
});

describe("resolvePaginationStatus", () => {
	test.each([
		[{ page: 1, pageSize: 20, total: 472 }, { from: 1, to: 20, total: 472 }],
		[{ page: 3, pageSize: 20, total: 472 }, { from: 41, to: 60, total: 472 }],
		[{ page: 24, pageSize: 20, total: 472 }, { from: 461, to: 472, total: 472 }],
		[{ page: 99, pageSize: 20, total: 472 }, { from: 461, to: 472, total: 472 }],
		[{ page: 0, pageSize: 20, total: 472 }, { from: 1, to: 20, total: 472 }],
		[{ page: 1, pageSize: 20, total: 0 }, { from: 0, to: 0, total: 0 }],
		[{ page: 1, pageSize: 0, total: 30 }, { from: 0, to: 0, total: 0 }],
		[{ page: 1, pageSize: 50, total: 7 }, { from: 1, to: 7, total: 7 }],
	])("%p → %p", (input, expected) => {
		expect(resolvePaginationStatus(input)).toEqual(expected);
	});
});

describe("labels", () => {
	test("status reads as a range of a total", () => {
		expect(formatPaginationStatus({ from: 1, to: 20, total: 472 })).toBe("1–20 of 472");
		expect(formatPaginationStatus({ from: 0, to: 0, total: 0 })).toBe("0–0 of 0");
	});

	test("compact reads as page over count", () => {
		expect(formatCompact(3, 12)).toBe("3 / 12");
		expect(formatCompactAccessibilityValue(3, 12)).toBe("Page 3 of 12");
	});

	test("an item and an ellipsis name what they do", () => {
		expect(formatPageLabel(3)).toBe("Page 3");
		expect(formatEllipsisLabel(1, 5)).toBe("Jump forward 5 pages");
		expect(formatEllipsisLabel(-1, 5)).toBe("Jump back 5 pages");
		expect(formatEllipsisLabel(1, 1)).toBe("Jump forward 1 page");
	});
});

describe("resolveControlGlyph", () => {
	test("previous points to the start and next to the end, mirrored under RTL", () => {
		expect(resolveControlGlyph("previous", false)).toBe("left");
		expect(resolveControlGlyph("next", false)).toBe("right");
		expect(resolveControlGlyph("previous", true)).toBe("right");
		expect(resolveControlGlyph("next", true)).toBe("left");
	});
});

describe("paginationVariants", () => {
	test("the current page is filled primary and its label primary-foreground", () => {
		const current = paginationVariants({ isCurrent: true });
		expect(cls(current.fill())).toContain("bg-primary");
		expect(cls(current.itemLabel())).toContain("text-primary-foreground");
	});

	test("every other page is ghost on the foreground", () => {
		const other = paginationVariants({ isCurrent: false });
		expect(cls(other.item())).not.toContain("bg-");
		expect(cls(other.itemLabel())).toContain("text-foreground");
		expect(cls(other.itemLabel())).not.toContain("text-primary-foreground");
	});

	test("disabled fades the element itself", () => {
		for (const slot of ["item", "control", "ellipsis", "compact"] as const) {
			expect(cls(paginationVariants({ isDisabled: true })[slot]())).toContain("opacity-50");
			expect(cls(paginationVariants({ isDisabled: false })[slot]())).not.toContain("opacity-");
		}
	});

	test("the root never fades — the parts do, so a disabled end control is not faded twice", () => {
		expect(cls(paginationVariants({ isDisabled: true }).root())).not.toContain("opacity-");
		expect(cls(paginationVariants({ isDisabled: true }).run())).not.toContain("opacity-");
	});

	test("each size's item edge is the button token of the same name", () => {
		for (const size of PAGINATION_SIZES) {
			const slots = paginationVariants({ size });
			expect(cls(slots.item())).toContain(`h-button-${size}`);
			expect(cls(slots.item())).toContain(`min-w-button-${size}`);
			expect(cls(slots.control())).toContain(`h-button-${size}`);
			expect(cls(slots.control())).toContain(`min-w-button-${size}`);
			expect(cls(slots.ellipsis())).toContain(`h-button-${size}`);
			expect(cls(slots.ellipsis())).toContain(`min-w-button-${size}`);
		}
	});

	test("every target reaches 44pt once its hit slop is added", () => {
		for (const size of PAGINATION_SIZES) {
			expect(buttonSpacingPx(size) + 2 * PAGINATION_HIT_SLOP[size]).toBeGreaterThanOrEqual(PAGINATION_MIN_TARGET);
		}
	});

	test("the gap between targets is at least the slop either side, so neighbouring slops never overlap", () => {
		for (const size of PAGINATION_SIZES) {
			const gapPx = step(cls(paginationVariants({ size }).run()), "gap") * 4;
			expect(gapPx).toBeGreaterThanOrEqual(2 * PAGINATION_HIT_SLOP[size]);
		}
	});
});

describe("colour tokens", () => {
	test("item labels and glyphs name tokens theme.css declares, and the label class agrees", () => {
		for (const isCurrent of [false, true]) {
			const token = resolveItemForeground(isCurrent);
			expect(THEME_CSS).toContain(`--${token}:`);
			expect(cls(paginationVariants({ isCurrent }).itemLabel())).toContain(`text-${token}`);
		}
	});

	test("the control glyph names a declared token, and the control label agrees", () => {
		const token = resolveControlForeground();
		expect(THEME_CSS).toContain(`--${token}:`);
		expect(cls(paginationVariants().controlLabel())).toContain(`text-${token}`);
	});
});
