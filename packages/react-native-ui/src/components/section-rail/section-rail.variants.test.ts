import { describe, expect, test } from "bun:test";
import { declaredTokens } from "../../styles/theme-tokens.test";
import {
	resolveAdjacentSection,
	resolveBarLength,
	resolveItemIndent,
	resolvePanelAnchor,
	resolvePanelTransformOrigin,
	resolveRailPlacementStyle,
	resolveScrubIndex,
	SECTION_RAIL_ALIGNS,
	SECTION_RAIL_DEFAULT_ALIGN,
	SECTION_RAIL_DEFAULT_CLOSE_DELAY,
	SECTION_RAIL_DEFAULT_MAX_WIDTH,
	SECTION_RAIL_DEFAULT_OFFSET,
	SECTION_RAIL_DEFAULT_PLACEMENT,
	SECTION_RAIL_MAX_LEVEL,
	SECTION_RAIL_PLACEMENTS,
	sectionRailVariants,
	shouldEmitSection,
} from "./section-rail.variants";

const NO_INSETS = { top: 0, bottom: 0, left: 0, right: 0 } as const;
const INSETS = { top: 59, bottom: 34, left: 4, right: 8 } as const;

/** A slot's class string, with `tv`'s empty-slot `undefined` flattened. */
function cls(value: string | undefined): string {
	return value ?? "";
}

describe("constants", () => {
	test("the axes are the ones the docs name", () => {
		expect(SECTION_RAIL_PLACEMENTS).toEqual(["end", "start"]);
		expect(SECTION_RAIL_ALIGNS).toEqual(["center", "bottom"]);
	});

	test("the defaults are the spec's", () => {
		expect(SECTION_RAIL_DEFAULT_PLACEMENT).toBe("end");
		expect(SECTION_RAIL_DEFAULT_ALIGN).toBe("center");
		expect(SECTION_RAIL_DEFAULT_CLOSE_DELAY).toBe(300);
		expect(SECTION_RAIL_DEFAULT_OFFSET).toBe(12);
		expect(SECTION_RAIL_DEFAULT_MAX_WIDTH).toBe("78%");
	});

	test("the named defaults match tv's defaultVariants", () => {
		const fromDefaults = sectionRailVariants();
		const named = sectionRailVariants({
			align: SECTION_RAIL_DEFAULT_ALIGN,
			isActive: false,
			placement: SECTION_RAIL_DEFAULT_PLACEMENT,
		});
		for (const slot of ["root", "trigger", "bar", "content", "item", "itemLabel"] as const) {
			expect(cls(fromDefaults[slot]())).toBe(cls(named[slot]()));
		}
	});
});

describe("resolveBarLength", () => {
	test("each level is one step shorter", () => {
		expect(resolveBarLength(0)).toBe("w-4");
		expect(resolveBarLength(1)).toBe("w-3");
		expect(resolveBarLength(2)).toBe("w-2");
	});

	test("deeper levels clamp at the shortest bar", () => {
		expect(resolveBarLength(3)).toBe("w-2");
		expect(resolveBarLength(9)).toBe("w-2");
	});

	test("a negative or fractional level reads as the nearest real one", () => {
		expect(resolveBarLength(-1)).toBe("w-4");
		expect(resolveBarLength(1.6)).toBe("w-3");
	});
});

describe("resolveItemIndent", () => {
	test("each level indents one step further", () => {
		expect(resolveItemIndent(0)).toBe("ps-3");
		expect(resolveItemIndent(1)).toBe("ps-6");
		expect(resolveItemIndent(2)).toBe("ps-9");
	});

	test("clamps at the same level the bars do, so the rail and the panel never disagree", () => {
		for (let level = -2; level <= SECTION_RAIL_MAX_LEVEL + 3; level++) {
			const deeper = level + 1;
			const barsDiffer = resolveBarLength(level) !== resolveBarLength(deeper);
			const indentsDiffer = resolveItemIndent(level) !== resolveItemIndent(deeper);
			expect(indentsDiffer).toBe(barsDiffer);
		}
	});

	test("the indent wins over the item slot's own start padding", () => {
		const item = sectionRailVariants().item({ className: resolveItemIndent(2) });
		expect(item).toContain("ps-9");
		expect(item).not.toMatch(/(?:^|\s)px-3(?:\s|$)/);
	});
});

describe("resolveScrubIndex", () => {
	const tops = [0, 10, 20, 30] as const;
	const heights = [3, 3, 3, 3] as const;

	test("no rows is no index", () => {
		expect(resolveScrubIndex(10, [], [])).toBe(-1);
	});

	test("a finger on a bar picks that bar", () => {
		expect(resolveScrubIndex(1, tops, heights)).toBe(0);
		expect(resolveScrubIndex(21, tops, heights)).toBe(2);
	});

	test("a finger in a gap picks the nearer bar", () => {
		expect(resolveScrubIndex(5, tops, heights)).toBe(0);
		expect(resolveScrubIndex(8, tops, heights)).toBe(1);
	});

	test("the midpoint between two bars belongs to the lower one", () => {
		expect(resolveScrubIndex(6.5, tops, heights)).toBe(1);
	});

	test("clamps to the ends past either edge", () => {
		expect(resolveScrubIndex(-40, tops, heights)).toBe(0);
		expect(resolveScrubIndex(400, tops, heights)).toBe(3);
	});

	test("one row is always that row", () => {
		expect(resolveScrubIndex(-5, [12], [3])).toBe(0);
		expect(resolveScrubIndex(50, [12], [3])).toBe(0);
	});
});

describe("shouldEmitSection", () => {
	test("a different section emits", () => {
		expect(shouldEmitSection("intro", "setup")).toBe(true);
		expect(shouldEmitSection(undefined, "setup")).toBe(true);
	});

	test("the current section, or nothing, does not", () => {
		expect(shouldEmitSection("intro", "intro")).toBe(false);
		expect(shouldEmitSection("intro", undefined)).toBe(false);
	});
});

describe("resolveAdjacentSection", () => {
	const order = ["intro", "setup", "setup-ios", "faq"] as const;

	test("steps forward and back", () => {
		expect(resolveAdjacentSection(order, "setup", 1)).toBe("setup-ios");
		expect(resolveAdjacentSection(order, "setup", -1)).toBe("intro");
	});

	test("stops at the ends rather than wrapping", () => {
		expect(resolveAdjacentSection(order, "faq", 1)).toBeUndefined();
		expect(resolveAdjacentSection(order, "intro", -1)).toBeUndefined();
	});

	test("from no section, forward is the first and back is nothing", () => {
		expect(resolveAdjacentSection(order, undefined, 1)).toBe("intro");
		expect(resolveAdjacentSection(order, "missing", 1)).toBe("intro");
		expect(resolveAdjacentSection(order, undefined, -1)).toBeUndefined();
	});

	test("an empty rail has nowhere to go", () => {
		expect(resolveAdjacentSection([], "intro", 1)).toBeUndefined();
	});
});

describe("resolveRailPlacementStyle", () => {
	test("end and center: the end edge clears its inset by the offset, the column centres", () => {
		expect(resolveRailPlacementStyle("end", "center", NO_INSETS, 12, false)).toEqual({
			alignItems: "flex-end",
			justifyContent: "center",
			paddingBottom: 0,
			paddingEnd: 12,
			paddingStart: 0,
			paddingTop: 0,
		});
	});

	test("bottom align offsets the bottom edge too", () => {
		expect(resolveRailPlacementStyle("end", "bottom", INSETS, 12, false)).toEqual({
			alignItems: "flex-end",
			justifyContent: "flex-end",
			paddingBottom: 34 + 12,
			paddingEnd: 8 + 12,
			paddingStart: 4,
			paddingTop: 59,
		});
	});

	test("start placement moves the offset to the start edge", () => {
		const style = resolveRailPlacementStyle("start", "center", INSETS, 12, false);
		expect(style.alignItems).toBe("flex-start");
		expect(style.paddingStart).toBe(4 + 12);
		expect(style.paddingEnd).toBe(8);
	});

	test("right-to-left reads the inset from the physical edge the logical one lands on", () => {
		const end = resolveRailPlacementStyle("end", "center", INSETS, 12, true);
		expect(end.paddingEnd).toBe(4 + 12);
		expect(end.paddingStart).toBe(8);
		const start = resolveRailPlacementStyle("start", "center", INSETS, 12, true);
		expect(start.paddingStart).toBe(8 + 12);
		expect(start.paddingEnd).toBe(4);
	});
});

describe("resolvePanelAnchor", () => {
	test("the panel grows from the rail's edge, centred or from the bottom corner", () => {
		expect(resolvePanelAnchor("end", "center")).toEqual({ horizontal: "end", vertical: "center" });
		expect(resolvePanelAnchor("end", "bottom")).toEqual({ horizontal: "end", vertical: "bottom" });
		expect(resolvePanelAnchor("start", "bottom")).toEqual({ horizontal: "start", vertical: "bottom" });
	});
});

describe("resolvePanelTransformOrigin", () => {
	test("maps the logical corner onto the physical one", () => {
		expect(resolvePanelTransformOrigin({ horizontal: "end", vertical: "bottom" }, false)).toBe("100% 100%");
		expect(resolvePanelTransformOrigin({ horizontal: "end", vertical: "center" }, false)).toBe("100% 50%");
		expect(resolvePanelTransformOrigin({ horizontal: "start", vertical: "bottom" }, false)).toBe("0% 100%");
	});

	test("flips in right-to-left", () => {
		expect(resolvePanelTransformOrigin({ horizontal: "end", vertical: "bottom" }, true)).toBe("0% 100%");
		expect(resolvePanelTransformOrigin({ horizontal: "start", vertical: "center" }, true)).toBe("100% 50%");
	});
});

describe("sectionRailVariants", () => {
	test("the root lets touches through to the screen beneath", () => {
		expect(sectionRailVariants().root()).toContain("absolute");
		expect(sectionRailVariants().root()).toContain("inset-0");
	});

	test("the trigger is at least a 44pt target", () => {
		expect(sectionRailVariants().trigger()).toContain("min-w-11");
	});

	test("bars hang from the rail's edge", () => {
		expect(sectionRailVariants({ placement: "end" }).trigger()).toContain("items-end");
		expect(sectionRailVariants({ placement: "start" }).trigger()).toContain("items-start");
	});

	test("an active bar is the foreground; a resting one is muted", () => {
		expect(sectionRailVariants().bar()).toContain("bg-muted-foreground/40");
		expect(sectionRailVariants().barFill()).toContain("bg-foreground");
	});

	test("an active item is the foreground at medium weight; a resting one is muted", () => {
		const active = sectionRailVariants({ isActive: true }).itemLabel();
		const resting = sectionRailVariants({ isActive: false }).itemLabel();
		expect(active).toContain("text-foreground");
		expect(active).toContain("font-medium");
		expect(resting).toContain("text-muted-foreground");
		expect(resting).not.toContain("font-medium");
	});

	test("the label colour sits on the label, never the row (rule 1)", () => {
		for (const isActive of [false, true]) {
			expect(sectionRailVariants({ isActive }).item()).not.toMatch(/(?:^|\s)text-/);
		}
	});

	test("rows are at least 44pt tall", () => {
		expect(sectionRailVariants().item()).toContain("min-h-11");
	});

	test("every colour token the slots name is declared in both themes", () => {
		const tokens = new Set<string>();
		for (const isActive of [false, true]) {
			const slots = sectionRailVariants({ isActive });
			for (const slot of ["bar", "barFill", "content", "item", "itemLabel", "scrim"] as const) {
				for (const [, token] of cls(slots[slot]()).matchAll(/(?:^|\s)(?:bg|text|border)-([a-z-]+?)(?:\/\d+)?(?=\s|$)/g)) {
					if (token !== undefined) tokens.add(token);
				}
			}
		}
		const colourTokens = [...tokens].filter((token) => !/^(?:\d|transparent|none)/.test(token));
		expect(colourTokens.length).toBeGreaterThan(0);
		for (const variant of ["light", "dark"] as const) {
			const declared = declaredTokens(variant);
			for (const token of colourTokens) expect(declared.has(token)).toBe(true);
		}
	});
});
