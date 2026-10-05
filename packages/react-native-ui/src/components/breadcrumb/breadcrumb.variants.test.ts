import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { TEXT_SIZES } from "../text/text.variants";
import {
	BREADCRUMB_DEFAULT_SIZE,
	BREADCRUMB_GLYPH_COLOR,
	BREADCRUMB_LINK_HIT_SLOP,
	BREADCRUMB_MIN_TOUCH_TARGET,
	BREADCRUMB_SIZES,
	BREADCRUMB_TEXT_SIZE,
	type BreadcrumbChildKind,
	breadcrumbVariants,
	resolveBreadcrumbCollapse,
	resolveBreadcrumbEllipsisLabel,
	resolveBreadcrumbOverflow,
	resolveBreadcrumbSeparatorGlyph,
	resolveBreadcrumbSequence,
} from "./breadcrumb.variants";

const THEME_CSS = readFileSync(join(import.meta.dirname, "../../styles/theme.css"), "utf-8");

/** Tailwind v4's default line heights, in points, for the text utility each `Text` size emits. */
const LINE_HEIGHT_PX: Record<string, number> = { sm: 20, md: 24 };

function cls(value: string | undefined): string {
	return value ?? "";
}

describe("resolveBreadcrumbCollapse", () => {
	test("no maxItems never collapses", () => {
		expect(resolveBreadcrumbCollapse({ count: 12 })).toEqual({ kind: "all" });
	});

	test("a count at or under the max never collapses", () => {
		expect(resolveBreadcrumbCollapse({ count: 4, maxItems: 4 })).toEqual({ kind: "all" });
		expect(resolveBreadcrumbCollapse({ count: 2, maxItems: 4 })).toEqual({ kind: "all" });
	});

	test("over the max keeps one before and one after by default", () => {
		expect(resolveBreadcrumbCollapse({ count: 6, maxItems: 4 })).toEqual({
			kind: "collapsed",
			visibleBefore: [0],
			hidden: [1, 2, 3, 4],
			visibleAfter: [5],
		});
	});

	test("before and after widen the visible ends", () => {
		expect(resolveBreadcrumbCollapse({ count: 7, maxItems: 4, before: 2, after: 2 })).toEqual({
			kind: "collapsed",
			visibleBefore: [0, 1],
			hidden: [2, 3, 4],
			visibleAfter: [5, 6],
		});
	});

	test("before + after reaching the count is clamped so one item is still hidden", () => {
		const result = resolveBreadcrumbCollapse({ count: 5, maxItems: 3, before: 3, after: 3 });
		expect(result.kind).toBe("collapsed");
		if (result.kind !== "collapsed") return;
		expect(result.hidden.length).toBeGreaterThanOrEqual(1);
		expect(result.visibleAfter.at(-1)).toBe(4);
		expect([...result.visibleBefore, ...result.hidden, ...result.visibleAfter]).toEqual([0, 1, 2, 3, 4]);
	});

	test("after overflowing the count keeps the last item and hides the rest before it", () => {
		expect(resolveBreadcrumbCollapse({ count: 4, maxItems: 2, before: 0, after: 9 })).toEqual({
			kind: "collapsed",
			visibleBefore: [],
			hidden: [0],
			visibleAfter: [1, 2, 3],
		});
	});

	test("zero before shows only the trailing items", () => {
		expect(resolveBreadcrumbCollapse({ count: 5, maxItems: 3, before: 0 })).toEqual({
			kind: "collapsed",
			visibleBefore: [],
			hidden: [0, 1, 2, 3],
			visibleAfter: [4],
		});
	});

	test("negative before/after read as zero, and the last item always stays", () => {
		expect(resolveBreadcrumbCollapse({ count: 5, maxItems: 3, before: -2, after: -1 })).toEqual({
			kind: "collapsed",
			visibleBefore: [],
			hidden: [0, 1, 2, 3],
			visibleAfter: [4],
		});
		expect(resolveBreadcrumbCollapse({ count: 5, maxItems: 3, after: 0 })).toEqual({
			kind: "collapsed",
			visibleBefore: [0],
			hidden: [1, 2, 3],
			visibleAfter: [4],
		});
	});

	test("fractional before/after floor", () => {
		expect(resolveBreadcrumbCollapse({ count: 6, maxItems: 3, before: 1.8, after: 1.2 })).toEqual({
			kind: "collapsed",
			visibleBefore: [0],
			hidden: [1, 2, 3, 4],
			visibleAfter: [5],
		});
	});

	test("one item cannot hide anything, whatever the max", () => {
		expect(resolveBreadcrumbCollapse({ count: 1, maxItems: 0 })).toEqual({ kind: "all" });
		expect(resolveBreadcrumbCollapse({ count: 0, maxItems: 0 })).toEqual({ kind: "all" });
	});
});

describe("resolveBreadcrumbOverflow", () => {
	test("defaults to collapse with a max and wrap without", () => {
		expect(resolveBreadcrumbOverflow({ maxItems: 3 })).toBe("collapse");
		expect(resolveBreadcrumbOverflow({})).toBe("wrap");
	});

	test("an explicit overflow wins", () => {
		expect(resolveBreadcrumbOverflow({ maxItems: 3, overflow: "scroll" })).toBe("scroll");
		expect(resolveBreadcrumbOverflow({ overflow: "collapse" })).toBe("collapse");
	});
});

describe("resolveBreadcrumbSequence", () => {
	const items = (n: number): BreadcrumbChildKind[] => Array.from({ length: n }, () => "item");

	test("a separator between every pair, none after the last", () => {
		expect(resolveBreadcrumbSequence(items(3), { kind: "all" })).toEqual([
			{ kind: "child", index: 0 },
			{ kind: "separator", key: "separator-1" },
			{ kind: "child", index: 1 },
			{ kind: "separator", key: "separator-2" },
			{ kind: "child", index: 2 },
		]);
	});

	test("one item draws no separator", () => {
		expect(resolveBreadcrumbSequence(items(1), { kind: "all" })).toEqual([{ kind: "child", index: 0 }]);
	});

	test("a manual separator suppresses the automatic one beside it", () => {
		expect(resolveBreadcrumbSequence(["item", "separator", "item", "item"], { kind: "all" })).toEqual([
			{ kind: "child", index: 0 },
			{ kind: "child", index: 1 },
			{ kind: "child", index: 2 },
			{ kind: "separator", key: "separator-3" },
			{ kind: "child", index: 3 },
		]);
	});

	test("a collapsed trail puts the ellipsis where the hidden run was", () => {
		const collapse = resolveBreadcrumbCollapse({ count: 5, maxItems: 3 });
		expect(resolveBreadcrumbSequence(items(5), collapse)).toEqual([
			{ kind: "child", index: 0 },
			{ kind: "separator", key: "separator-ellipsis" },
			{ kind: "ellipsis", hidden: [1, 2, 3] },
			{ kind: "separator", key: "separator-4" },
			{ kind: "child", index: 4 },
		]);
	});

	test("a collapse with nothing before leads with the ellipsis", () => {
		const collapse = resolveBreadcrumbCollapse({ count: 4, maxItems: 2, before: 0 });
		expect(resolveBreadcrumbSequence(items(4), collapse)).toEqual([
			{ kind: "ellipsis", hidden: [0, 1, 2] },
			{ kind: "separator", key: "separator-3" },
			{ kind: "child", index: 3 },
		]);
	});

	test("manual separators trailing a hidden item go with it", () => {
		const collapse = resolveBreadcrumbCollapse({ count: 4, maxItems: 2 });
		const kinds: BreadcrumbChildKind[] = ["item", "separator", "item", "separator", "item", "separator", "item"];
		expect(resolveBreadcrumbSequence(kinds, collapse)).toEqual([
			{ kind: "child", index: 0 },
			{ kind: "child", index: 1 },
			{ kind: "ellipsis", hidden: [1, 2] },
			{ kind: "separator", key: "separator-6" },
			{ kind: "child", index: 6 },
		]);
	});

	test("other children render in place with no separator of their own", () => {
		expect(resolveBreadcrumbSequence(["item", "other", "item"], { kind: "all" })).toEqual([
			{ kind: "child", index: 0 },
			{ kind: "child", index: 1 },
			{ kind: "separator", key: "separator-2" },
			{ kind: "child", index: 2 },
		]);
	});
});

describe("resolveBreadcrumbSeparatorGlyph", () => {
	test("points along the reading direction", () => {
		expect(resolveBreadcrumbSeparatorGlyph(false)).toBe("chevron-right");
		expect(resolveBreadcrumbSeparatorGlyph(true)).toBe("chevron-left");
	});
});

describe("resolveBreadcrumbEllipsisLabel", () => {
	test("names the hidden count, singular for one", () => {
		expect(resolveBreadcrumbEllipsisLabel(3)).toBe("Show 3 hidden levels");
		expect(resolveBreadcrumbEllipsisLabel(1)).toBe("Show 1 hidden level");
	});
});

describe("breadcrumbVariants", () => {
	test("the default size is one of the sizes", () => {
		expect(BREADCRUMB_SIZES).toContain(BREADCRUMB_DEFAULT_SIZE);
		expect(BREADCRUMB_DEFAULT_SIZE).toBe("md");
	});

	test("each size hands its labels a real Text step: sm the caption step, md the body step", () => {
		for (const size of BREADCRUMB_SIZES) {
			expect(TEXT_SIZES).toContain(BREADCRUMB_TEXT_SIZE[size]);
		}
		expect(BREADCRUMB_TEXT_SIZE.sm).toBe("sm");
		expect(BREADCRUMB_TEXT_SIZE.md).toBe("md");
	});

	test("the separator glyph is icon-xs at sm and icon-sm at md", () => {
		expect(cls(breadcrumbVariants({ size: "sm" }).glyph())).toMatch(/\bsize-icon-xs\b/);
		expect(cls(breadcrumbVariants({ size: "md" }).glyph())).toMatch(/\bsize-icon-sm\b/);
	});

	test("link labels are muted and the page is foreground, medium", () => {
		const slots = breadcrumbVariants({});
		expect(cls(slots.linkLabel())).toMatch(/(^|\s)text-muted-foreground(\s|$)/);
		expect(cls(slots.page())).toMatch(/(^|\s)text-foreground(\s|$)/);
		expect(cls(slots.page())).toMatch(/\bfont-medium\b/);
	});

	test("every colour class and glyph token is one theme.css declares", () => {
		expect(THEME_CSS).toContain("--muted-foreground:");
		expect(THEME_CSS).toContain("--foreground:");
		expect(THEME_CSS).toContain("--color-muted-foreground:");
		expect(THEME_CSS).toContain("--color-foreground:");
		expect(THEME_CSS).toContain(`--${BREADCRUMB_GLYPH_COLOR}:`);
		expect(BREADCRUMB_GLYPH_COLOR).toBe("muted-foreground");
	});

	test("labels carry no text size of their own — the Text step owns it", () => {
		const slots = breadcrumbVariants({});
		expect(cls(slots.linkLabel())).not.toMatch(/\btext-(xs|sm|base|lg)\b/);
		expect(cls(slots.page())).not.toMatch(/\btext-(xs|sm|base|lg)\b/);
	});

	test("a disabled link fades", () => {
		expect(cls(breadcrumbVariants({ isDisabled: true }).link())).toMatch(/\bopacity-50\b/);
		expect(cls(breadcrumbVariants({ isDisabled: false }).link())).not.toMatch(/\bopacity-/);
	});

	test("scroll overflow never wraps; the others do", () => {
		expect(cls(breadcrumbVariants({ overflow: "scroll" }).list())).not.toMatch(/\bflex-wrap\b/);
		expect(cls(breadcrumbVariants({ overflow: "wrap" }).list())).toMatch(/\bflex-wrap\b/);
		expect(cls(breadcrumbVariants({ overflow: "collapse" }).list())).toMatch(/\bflex-wrap\b/);
	});

	test("caller classNames merge last", () => {
		expect(cls(breadcrumbVariants({}).linkLabel({ className: "text-primary" }))).toMatch(/\btext-primary\b/);
		expect(cls(breadcrumbVariants({}).linkLabel({ className: "text-primary" }))).not.toMatch(
			/\btext-muted-foreground\b/
		);
	});
});

describe("BREADCRUMB_LINK_HIT_SLOP", () => {
	test("lifts every link's line to the minimum touch target", () => {
		expect(BREADCRUMB_MIN_TOUCH_TARGET).toBe(44);
		for (const size of BREADCRUMB_SIZES) {
			const line = LINE_HEIGHT_PX[size];
			if (line === undefined) throw new Error(`no line height for ${size}`);
			const slop = BREADCRUMB_LINK_HIT_SLOP[size];
			expect(line + slop.top + slop.bottom).toBeGreaterThanOrEqual(BREADCRUMB_MIN_TOUCH_TARGET);
		}
	});
});
