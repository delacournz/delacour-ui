import { afterEach, beforeEach, describe, expect, mock, spyOn, test } from "bun:test";
import { createElement, Fragment, type ReactNode } from "react";
import {
	collectTableHeaderLabels,
	resolveCellAccessibilityLabel,
	resolveCellLayout,
	resolveTableColumn,
	resolveTableContentWidth,
	resolveTableEdgeFade,
	resolveTableFadeToken,
	resolveTableRowAccessibilityLabel,
	resolveTableRowTone,
	resolveTableSortAccessibility,
	resolveTableSortGlyph,
	splitTableBodyChildren,
	splitTableCaption,
	TABLE_ALIGNS,
	TABLE_EDGE_FADE_RAMP,
	TABLE_ROW_TONES,
	TABLE_SIZES,
	TABLE_VARIANTS,
	tableVariants,
} from "./table.variants";

let warn: ReturnType<typeof spyOn>;

beforeEach(() => {
	warn = spyOn(console, "warn").mockImplementation(mock(() => undefined));
});

afterEach(() => {
	warn.mockRestore();
});

describe("resolveTableColumn", () => {
	test("defaults an empty or missing column to flex 1 at the start", () => {
		expect(resolveTableColumn()).toEqual({ align: "start", flex: 1, kind: "flex" });
		expect(resolveTableColumn({})).toEqual({ align: "start", flex: 1, kind: "flex" });
	});

	test("reads a bare width as a fixed column", () => {
		expect(resolveTableColumn({ width: 72 })).toEqual({ align: "start", kind: "fixed", width: 72 });
	});

	test("reads a bare flex as a flex column", () => {
		expect(resolveTableColumn({ flex: 2, align: "end" })).toEqual({ align: "end", flex: 2, kind: "flex" });
	});

	test("keeps an explicit kind", () => {
		expect(resolveTableColumn({ kind: "fixed", width: 40, align: "center" })).toEqual({
			align: "center",
			kind: "fixed",
			width: 40,
		});
		expect(resolveTableColumn({ kind: "flex", flex: 3 })).toEqual({ align: "start", flex: 3, kind: "flex" });
	});

	test("rejects a width of zero or less, warns, and falls back to flex 1", () => {
		expect(resolveTableColumn({ width: 0 })).toEqual({ align: "start", flex: 1, kind: "flex" });
		expect(resolveTableColumn({ width: -10, align: "end" })).toEqual({ align: "end", flex: 1, kind: "flex" });
		expect(warn).toHaveBeenCalledTimes(2);
	});

	test("rejects a non-finite width", () => {
		expect(resolveTableColumn({ width: Number.NaN })).toEqual({ align: "start", flex: 1, kind: "flex" });
		expect(warn).toHaveBeenCalledTimes(1);
	});

	test("rejects a flex of zero or less, falling back to 1", () => {
		expect(resolveTableColumn({ flex: 0 })).toEqual({ align: "start", flex: 1, kind: "flex" });
		expect(warn).toHaveBeenCalledTimes(1);
	});

	test("does not warn on a valid column", () => {
		resolveTableColumn({ width: 1 });
		resolveTableColumn({ flex: 0.5 });
		expect(warn).not.toHaveBeenCalled();
	});
});

describe("resolveCellLayout", () => {
	const columns = [{ flex: 2 }, { width: 72, align: "end" }, { kind: "flex", align: "center" }] as const;

	test("reads column N by cell index", () => {
		expect(resolveCellLayout(columns, 0)).toEqual({ align: "start", style: { flex: 2 } });
		expect(resolveCellLayout(columns, 1)).toEqual({ align: "end", style: { width: 72 } });
		expect(resolveCellLayout(columns, 2)).toEqual({ align: "center", style: { flex: 1 } });
	});

	test("falls back to flex 1 at the start past the end of the columns", () => {
		expect(resolveCellLayout(columns, 3)).toEqual({ align: "start", style: { flex: 1 } });
		expect(resolveCellLayout(undefined, 0)).toEqual({ align: "start", style: { flex: 1 } });
		expect(resolveCellLayout([], 5)).toEqual({ align: "start", style: { flex: 1 } });
	});

	test("an override's align replaces only the align", () => {
		expect(resolveCellLayout(columns, 1, { align: "start" })).toEqual({ align: "start", style: { width: 72 } });
	});

	test("an override's width makes the cell fixed", () => {
		expect(resolveCellLayout(columns, 0, { width: 48 })).toEqual({ align: "start", style: { width: 48 } });
	});

	test("an override's flex makes the cell flex", () => {
		expect(resolveCellLayout(columns, 1, { flex: 3 })).toEqual({ align: "end", style: { flex: 3 } });
	});

	test("an override applies past the end of the columns too", () => {
		expect(resolveCellLayout(columns, 9, { width: 20, align: "end" })).toEqual({
			align: "end",
			style: { width: 20 },
		});
	});

	test("an invalid override width falls back to flex 1", () => {
		expect(resolveCellLayout(columns, 1, { width: 0 })).toEqual({ align: "end", style: { flex: 1 } });
	});
});

describe("resolveTableRowTone", () => {
	test("selected wins over striped", () => {
		expect(resolveTableRowTone({ index: 1, isSelected: true, striped: true })).toBe("selected");
		expect(resolveTableRowTone({ index: 0, isSelected: true, striped: false })).toBe("selected");
	});

	test("stripes every second row, starting with the second", () => {
		const tones = [0, 1, 2, 3].map((index) => resolveTableRowTone({ index, striped: true }));
		expect(tones).toEqual(["plain", "striped", "plain", "striped"]);
	});

	test("never stripes when striping is off", () => {
		expect(resolveTableRowTone({ index: 1, striped: false })).toBe("plain");
	});

	test("a row with no index is plain", () => {
		expect(resolveTableRowTone({ striped: true })).toBe("plain");
	});

	test("returns only known tones", () => {
		for (const index of [0, 1]) {
			for (const striped of [true, false]) {
				for (const isSelected of [true, false]) {
					expect(TABLE_ROW_TONES).toContain(resolveTableRowTone({ index, isSelected, striped }));
				}
			}
		}
	});
});

describe("resolveTableSortGlyph", () => {
	const onPress = () => undefined;

	test("a head with no sort draws nothing", () => {
		expect(resolveTableSortGlyph(undefined)).toBe("none");
	});

	test("a sortable, unsorted head draws the dimmed both-ways glyph", () => {
		expect(resolveTableSortGlyph({ onPress })).toBe("unsorted");
	});

	test("a sorted head draws its direction", () => {
		expect(resolveTableSortGlyph({ direction: "asc", onPress })).toBe("asc");
		expect(resolveTableSortGlyph({ direction: "desc", onPress })).toBe("desc");
	});
});

describe("resolveTableSortAccessibility", () => {
	const onPress = () => undefined;

	test("a head with no sort is not a button", () => {
		expect(resolveTableSortAccessibility(undefined)).toEqual({ isSortable: false });
	});

	test("announces the sort state as the head's value", () => {
		expect(resolveTableSortAccessibility({ onPress })).toEqual({ isSortable: true, valueText: "not sorted" });
		expect(resolveTableSortAccessibility({ direction: "asc", onPress })).toEqual({
			isSortable: true,
			valueText: "sorted ascending",
		});
		expect(resolveTableSortAccessibility({ direction: "desc", onPress })).toEqual({
			isSortable: true,
			valueText: "sorted descending",
		});
	});
});

describe("resolveCellAccessibilityLabel", () => {
	test("prefixes the value with its column's header", () => {
		expect(resolveCellAccessibilityLabel("Qty", 3)).toBe("Qty, 3");
		expect(resolveCellAccessibilityLabel("Item", "Coffee")).toBe("Item, Coffee");
	});

	test("reads the value alone when there is no header", () => {
		expect(resolveCellAccessibilityLabel(undefined, "Coffee")).toBe("Coffee");
		expect(resolveCellAccessibilityLabel("   ", "Coffee")).toBe("Coffee");
	});

	test("leaves a cell whose value is not text to speak for itself", () => {
		expect(resolveCellAccessibilityLabel("Qty", undefined)).toBeUndefined();
	});

	test("reads zero as a value, not as nothing", () => {
		expect(resolveCellAccessibilityLabel("Qty", 0)).toBe("Qty, 0");
	});
});

describe("resolveTableRowAccessibilityLabel", () => {
	test("joins the cell labels, skipping cells with none", () => {
		expect(resolveTableRowAccessibilityLabel(["Item, Coffee", undefined, "Total, $4"])).toBe("Item, Coffee, Total, $4");
	});

	test("returns undefined when no cell has a label", () => {
		expect(resolveTableRowAccessibilityLabel([undefined, ""])).toBeUndefined();
	});
});

describe("resolveTableContentWidth", () => {
	test("does nothing without a minWidth", () => {
		expect(resolveTableContentWidth(undefined, 390)).toEqual({ isScrollable: false });
	});

	test("scrolls when minWidth is wider than the container", () => {
		expect(resolveTableContentWidth(640, 390)).toEqual({ contentWidth: 640, isScrollable: true });
	});

	test("fills the container when it is wider than minWidth", () => {
		expect(resolveTableContentWidth(320, 390)).toEqual({ contentWidth: 390, isScrollable: false });
	});

	test("before the container is measured, holds minWidth without scrolling", () => {
		expect(resolveTableContentWidth(640, 0)).toEqual({ contentWidth: 640, isScrollable: false });
	});
});

describe("resolveTableEdgeFade", () => {
	const metrics = { contentWidth: 640, viewportWidth: 320 };

	test("hides the start fade at rest and shows the end fade", () => {
		expect(resolveTableEdgeFade({ ...metrics, offset: 0 })).toEqual({ end: 1, start: 0 });
	});

	test("shows both in the middle", () => {
		expect(resolveTableEdgeFade({ ...metrics, offset: 160 })).toEqual({ end: 1, start: 1 });
	});

	test("hides the end fade at the far end", () => {
		expect(resolveTableEdgeFade({ ...metrics, offset: 320 })).toEqual({ end: 0, start: 1 });
	});

	test("ramps over TABLE_EDGE_FADE_RAMP points", () => {
		const half = resolveTableEdgeFade({ ...metrics, offset: TABLE_EDGE_FADE_RAMP / 2 });
		expect(half.start).toBeCloseTo(0.5);
	});

	test("draws neither when the content fits", () => {
		expect(resolveTableEdgeFade({ contentWidth: 300, offset: 0, viewportWidth: 320 })).toEqual({ end: 0, start: 0 });
	});

	test("clamps an overscroll", () => {
		expect(resolveTableEdgeFade({ ...metrics, offset: -40 })).toEqual({ end: 1, start: 0 });
		expect(resolveTableEdgeFade({ ...metrics, offset: 400 })).toEqual({ end: 0, start: 1 });
	});
});

describe("resolveTableFadeToken", () => {
	test("an outline table fades into its own card", () => {
		expect(resolveTableFadeToken({ plane: "secondary", variant: "outline" })).toBe("card");
	});

	test("a plain table fades into the surface it sits on", () => {
		expect(resolveTableFadeToken({ plane: "default", variant: "plain" })).toBe("card");
		expect(resolveTableFadeToken({ plane: "secondary", variant: "plain" })).toBe("secondary");
		expect(resolveTableFadeToken({ plane: "tertiary", variant: "plain" })).toBe("tertiary");
	});

	test("a plain table on no surface fades into the page", () => {
		expect(resolveTableFadeToken({ plane: null, variant: "plain" })).toBe("background");
	});
});

function Header({ children }: { children?: ReactNode }): ReactNode {
	return children;
}
function Row({ children }: { children?: ReactNode }): ReactNode {
	return children;
}
function Head({ children }: { children?: ReactNode }): ReactNode {
	return children;
}
function Body({ children }: { children?: ReactNode }): ReactNode {
	return children;
}
function Empty({ children }: { children?: ReactNode }): ReactNode {
	return children;
}
function Caption({ children }: { children?: ReactNode }): ReactNode {
	return children;
}

const is =
	(type: unknown) =>
	(node: ReactNode): boolean =>
		typeof node === "object" && node !== null && "type" in node && node.type === type;

const predicates = { isHead: is(Head), isHeader: is(Header), isRow: is(Row) };

describe("collectTableHeaderLabels", () => {
	test("reads the string children of each head, by index", () => {
		const children = [
			createElement(
				Header,
				{ key: "h" },
				createElement(
					Row,
					null,
					createElement(Head, { key: 0 }, "Item"),
					createElement(Head, { key: 1 }, "Qty"),
					createElement(Head, { key: 2 }, createElement(Fragment))
				)
			),
			createElement(Body, { key: "b" }),
		];
		expect(collectTableHeaderLabels(children, predicates)).toEqual(["Item", "Qty", undefined]);
	});

	test("joins a head's mixed text children", () => {
		const header = createElement(Header, null, createElement(Row, null, createElement(Head, null, "Total ", 2026)));
		expect(collectTableHeaderLabels(header, predicates)).toEqual(["Total 2026"]);
	});

	test("returns an empty list without a header", () => {
		expect(collectTableHeaderLabels(createElement(Body), predicates)).toEqual([]);
	});
});

describe("splitTableBodyChildren", () => {
	const isEmpty = is(Empty);

	test("hides the empty state while there are rows", () => {
		const rows = [createElement(Row, { key: "a" }), createElement(Row, { key: "b" })];
		const { rows: out, empty } = splitTableBodyChildren([...rows, createElement(Empty, { key: "e" })], isEmpty);
		expect(out).toHaveLength(2);
		expect(empty).toBeNull();
	});

	test("shows the empty state when there are no rows", () => {
		const { rows, empty } = splitTableBodyChildren([[], null, false, createElement(Empty, { key: "e" })], isEmpty);
		expect(rows).toHaveLength(0);
		expect(empty).not.toBeNull();
	});

	test("with neither, renders nothing", () => {
		const { rows, empty } = splitTableBodyChildren([], isEmpty);
		expect(rows).toHaveLength(0);
		expect(empty).toBeNull();
	});
});

describe("splitTableCaption", () => {
	test("lifts the captions out of the rest, keeping order", () => {
		const header = createElement(Header, { key: "h" });
		const caption = createElement(Caption, { key: "c" });
		const body = createElement(Body, { key: "b" });
		const { content, captions } = splitTableCaption([header, caption, body], is(Caption));
		expect(content).toHaveLength(2);
		expect(captions).toHaveLength(1);
	});
});

describe("tableVariants root slot", () => {
	test("plain draws no border", () => {
		expect(tableVariants({ variant: "plain" }).root()).not.toMatch(/\bborder-border\b/);
	});

	test("outline is a card-like hairline that clips", () => {
		const cls = tableVariants({ variant: "outline" }).root();
		expect(cls).toContain("border-border");
		expect(cls).toContain("rounded-lg");
		expect(cls).toContain("overflow-hidden");
		expect(cls).toContain("bg-card");
	});

	test("every variant is distinct", () => {
		const seen = new Set(TABLE_VARIANTS.map((variant) => tableVariants({ variant }).root()));
		expect(seen.size).toBe(TABLE_VARIANTS.length);
	});

	test("carries no text treatment", () => {
		for (const variant of TABLE_VARIANTS) {
			expect(tableVariants({ variant }).root()).not.toMatch(/\btext-/);
		}
	});

	test("merges an incoming className last", () => {
		expect(tableVariants().root({ className: "mb-4" })).toContain("mb-4");
	});
});

describe("tableVariants row slot", () => {
	test("lays cells out horizontally with a hairline under each row", () => {
		const cls = tableVariants().row();
		expect(cls).toContain("flex-row");
		expect(cls).toContain("border-b");
		expect(cls).toContain("border-border");
	});

	test("drops the hairline after the last row", () => {
		expect(tableVariants({ isLast: true }).row()).toContain("border-b-0");
		expect(tableVariants({ isLast: false }).row()).not.toContain("border-b-0");
	});

	test("paints each tone", () => {
		expect(tableVariants({ tone: "plain" }).row()).not.toMatch(/\bbg-/);
		expect(tableVariants({ tone: "striped" }).row()).toContain("bg-muted/50");
		expect(tableVariants({ tone: "selected" }).row()).toContain("bg-accent");
	});

	test("gives each size its own row height", () => {
		const seen = new Set(TABLE_SIZES.map((size) => tableVariants({ size }).row()));
		expect(seen.size).toBe(TABLE_SIZES.length);
		for (const size of TABLE_SIZES) expect(tableVariants({ size }).row()).toMatch(/\bmin-h-\d/);
	});

	// The disabled fade lands on the cells, never the row — see Radio's AGENTS.md.
	test("never fades the row itself", () => {
		for (const tone of TABLE_ROW_TONES) {
			expect(tableVariants({ tone }).row()).not.toMatch(/\bopacity-/);
		}
	});

	test("carries no text treatment", () => {
		for (const tone of TABLE_ROW_TONES) {
			expect(tableVariants({ tone }).row()).not.toMatch(/\btext-/);
		}
	});
});

describe("tableVariants cell slot", () => {
	test("pads every size, and sm tighter than md", () => {
		const sm = tableVariants({ size: "sm" }).cell();
		const md = tableVariants({ size: "md" }).cell();
		expect(sm).toMatch(/\bpx-\d/);
		expect(md).toMatch(/\bpx-\d/);
		expect(sm).not.toBe(md);
	});

	test("aligns its content by column", () => {
		expect(tableVariants({ align: "start" }).cell()).toContain("items-start");
		expect(tableVariants({ align: "center" }).cell()).toContain("items-center");
		expect(tableVariants({ align: "end" }).cell()).toContain("items-end");
	});

	test("fades the content of a disabled row", () => {
		expect(tableVariants({ isDisabled: true }).cell()).toContain("opacity-50");
		expect(tableVariants({ isDisabled: false }).cell()).not.toContain("opacity-50");
	});

	test("lets a flex cell shrink below its content", () => {
		expect(tableVariants().cell()).toContain("min-w-0");
	});
});

describe("tableVariants text slots", () => {
	test("align the text with the column", () => {
		expect(tableVariants({ align: "start" }).cellText()).toContain("text-left");
		expect(tableVariants({ align: "center" }).cellText()).toContain("text-center");
		expect(tableVariants({ align: "end" }).cellText()).toContain("text-right");
		expect(tableVariants({ align: "end" }).headText()).toContain("text-right");
	});

	test("set figures in tabular numerals", () => {
		expect(tableVariants().cellText()).toContain("tabular-nums");
		expect(tableVariants().headText()).toContain("tabular-nums");
	});

	test("a cell steps its type with the table's size", () => {
		expect(tableVariants({ size: "sm" }).cellText()).toContain("text-sm");
		expect(tableVariants({ size: "md" }).cellText()).toContain("text-base");
	});

	test("a selected row's text reads on the accent", () => {
		expect(tableVariants({ tone: "selected" }).cellText()).toContain("text-accent-foreground");
		expect(tableVariants({ tone: "plain" }).cellText()).toContain("text-foreground");
	});

	test("a head is muted until it is the sorted column", () => {
		expect(tableVariants({ isSorted: false }).headText()).toContain("text-muted-foreground");
		expect(tableVariants({ isSorted: true }).headText()).toContain("text-foreground");
		expect(tableVariants({ isSorted: true }).headText()).not.toContain("text-muted-foreground");
	});
});

describe("tableVariants sort glyph", () => {
	test("an unsorted sortable head's glyph is dimmed", () => {
		expect(tableVariants({ isSorted: false }).sortIcon()).toContain("opacity-");
		expect(tableVariants({ isSorted: true }).sortIcon()).not.toContain("opacity-");
	});

	test("the sort trigger runs the label and glyph in a row, justified by column", () => {
		expect(tableVariants({ align: "end" }).sort()).toContain("flex-row");
		expect(tableVariants({ align: "end" }).sort()).toContain("justify-end");
	});
});

describe("tableVariants caption and empty slots", () => {
	test("the caption is muted", () => {
		expect(tableVariants().caption()).toContain("text-muted-foreground");
	});

	test("the empty state is centred and padded", () => {
		const cls = tableVariants().empty();
		expect(cls).toContain("items-center");
		expect(cls).toMatch(/\bpy-\d/);
	});
});

describe("tableVariants edge fades", () => {
	test("pin to each edge and never take touches' place", () => {
		expect(tableVariants().fadeStart()).toContain("left-0");
		expect(tableVariants().fadeEnd()).toContain("right-0");
		expect(tableVariants().fadeStart()).toContain("absolute");
	});
});

describe("table axes", () => {
	test("exposes its tuples", () => {
		expect(TABLE_SIZES).toEqual(["sm", "md"]);
		expect(TABLE_VARIANTS).toEqual(["plain", "outline"]);
		expect(TABLE_ALIGNS).toEqual(["start", "center", "end"]);
	});
});
