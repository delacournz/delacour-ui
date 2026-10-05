import { describe, expect, test } from "bun:test";
import { declaredTokens } from "../../styles/theme-tokens.test";
import {
	resolvePanelDirection,
	resolvePanelMaxHeight,
	resolvePlacementStyle,
	resolveRevealed,
	resolveRingDashOffset,
	resolveRingGeometry,
	resolveSectionColor,
	resolveSectionColorToken,
	resolveSectionLabel,
	resolveSectionProgressAccessibilityValue,
	SECTION_PROGRESS_COLORS,
	SECTION_PROGRESS_DEFAULT_COLOR,
	SECTION_PROGRESS_DEFAULT_PLACEMENT,
	SECTION_PROGRESS_ITEM_HEIGHT,
	SECTION_PROGRESS_PANEL_PADDING,
	SECTION_PROGRESS_PANEL_ROWS,
	SECTION_PROGRESS_PLACEMENTS,
	SECTION_PROGRESS_RING_SIZE,
	SECTION_PROGRESS_RING_STROKE,
	sectionProgressVariants,
	shouldEmitSection,
} from "./section-progress.variants";

const SPACING_STEP_PX = 4;

/** A slot's class string, with `tv`'s empty-slot `undefined` flattened. */
function cls(value: string | undefined): string {
	return value ?? "";
}

/** The step a `prefix-N` class sets — `h-11` with `h` yields 11. */
function step(value: string, prefix: string): number {
	const found = value.match(new RegExp(`(?:^|\\s)${prefix}-(\\d+(?:\\.\\d+)?)(?:\\s|$)`))?.[1];
	if (found === undefined) throw new Error(`no ${prefix}-* in "${value}"`);
	return Number(found);
}

const ITEMS = [
	{ value: "intro", title: "Introduction", color: undefined },
	{ value: "pricing", title: "Pricing", color: "success" as const },
	{ value: "faq", title: "Questions", color: undefined },
];

const INSETS = { top: 47, bottom: 34, left: 0, right: 0 };

describe("constants", () => {
	test("the axes are the ones the docs name", () => {
		expect(SECTION_PROGRESS_PLACEMENTS).toEqual([
			"bottom-center",
			"top-center",
			"bottom-start",
			"bottom-end",
			"top-start",
			"top-end",
		]);
		expect(SECTION_PROGRESS_COLORS).toEqual(["foreground", "primary", "success", "warning", "info", "destructive"]);
	});

	test("the defaults are bottom-center and foreground", () => {
		expect(SECTION_PROGRESS_DEFAULT_PLACEMENT).toBe("bottom-center");
		expect(SECTION_PROGRESS_DEFAULT_COLOR).toBe("foreground");
	});

	test("the named default placement matches tv's defaultVariants", () => {
		const fromDefaults = sectionProgressVariants();
		const named = sectionProgressVariants({ placement: SECTION_PROGRESS_DEFAULT_PLACEMENT });
		for (const slot of ["root", "stack", "pill", "panel", "list"] as const) {
			expect(cls(fromDefaults[slot]())).toBe(cls(named[slot]()));
		}
	});
});

describe("resolveRingGeometry", () => {
	test("the radius keeps the stroke inside the box", () => {
		const { radius } = resolveRingGeometry(SECTION_PROGRESS_RING_SIZE, SECTION_PROGRESS_RING_STROKE);
		expect(radius).toBe((SECTION_PROGRESS_RING_SIZE - SECTION_PROGRESS_RING_STROKE) / 2);
	});

	test("the circumference is 2πr", () => {
		const { radius, circumference } = resolveRingGeometry(20, 2);
		expect(radius).toBe(9);
		expect(circumference).toBeCloseTo(2 * Math.PI * 9);
	});

	test("the ring is 20pt, as the spec draws it", () => {
		expect(SECTION_PROGRESS_RING_SIZE).toBe(20);
	});
});

describe("resolveRingDashOffset", () => {
	test("empty at 0, full at 1, half at 0.5", () => {
		expect(resolveRingDashOffset(0, 100)).toBe(100);
		expect(resolveRingDashOffset(1, 100)).toBe(0);
		expect(resolveRingDashOffset(0.5, 100)).toBe(50);
	});

	test("clamps overscroll at both ends", () => {
		expect(resolveRingDashOffset(-0.2, 100)).toBe(100);
		expect(resolveRingDashOffset(1.4, 100)).toBe(0);
	});

	test("a NaN progress draws an empty ring rather than a broken one", () => {
		expect(resolveRingDashOffset(Number.NaN, 100)).toBe(100);
	});
});

describe("resolveRevealed", () => {
	test("hidden until the scroll reaches revealAt", () => {
		expect(resolveRevealed(0, 64, false)).toBe(false);
		expect(resolveRevealed(63, 64, false)).toBe(false);
		expect(resolveRevealed(64, 64, false)).toBe(true);
	});

	test("latches: once shown it stays, even back at the top", () => {
		expect(resolveRevealed(0, 64, true)).toBe(true);
	});

	test("revealAt 0 is always visible", () => {
		expect(resolveRevealed(0, 0, false)).toBe(true);
		expect(resolveRevealed(-20, 0, false)).toBe(true);
	});
});

describe("resolvePlacementStyle", () => {
	test("bottom placements sit offset above the bottom inset", () => {
		const style = resolvePlacementStyle("bottom-center", INSETS, 16);
		expect(style.bottom).toBe(50);
		expect(style.top).toBeUndefined();
	});

	test("top placements sit offset below the top inset", () => {
		const style = resolvePlacementStyle("top-end", INSETS, 16);
		expect(style.top).toBe(63);
		expect(style.bottom).toBeUndefined();
	});

	test("the horizontal gutter is symmetric, so start and end mirror under RTL", () => {
		const style = resolvePlacementStyle("bottom-start", { ...INSETS, left: 44, right: 0 }, 16);
		expect(style.start).toBe(60);
		expect(style.end).toBe(60);
	});

	test("the edge picks the cross-axis alignment", () => {
		expect(resolvePlacementStyle("bottom-center", INSETS, 16).alignItems).toBe("center");
		expect(resolvePlacementStyle("top-center", INSETS, 16).alignItems).toBe("center");
		expect(resolvePlacementStyle("bottom-start", INSETS, 16).alignItems).toBe("flex-start");
		expect(resolvePlacementStyle("top-start", INSETS, 16).alignItems).toBe("flex-start");
		expect(resolvePlacementStyle("bottom-end", INSETS, 16).alignItems).toBe("flex-end");
		expect(resolvePlacementStyle("top-end", INSETS, 16).alignItems).toBe("flex-end");
	});
});

describe("resolvePanelDirection", () => {
	test("a bottom pill opens up, a top pill opens down", () => {
		for (const placement of SECTION_PROGRESS_PLACEMENTS) {
			expect(resolvePanelDirection(placement)).toBe(placement.startsWith("bottom") ? "up" : "down");
		}
	});
});

describe("resolvePanelMaxHeight", () => {
	test("six rows plus the list's padding", () => {
		expect(SECTION_PROGRESS_PANEL_ROWS).toBe(6);
		expect(resolvePanelMaxHeight()).toBe(SECTION_PROGRESS_ITEM_HEIGHT * 6 + SECTION_PROGRESS_PANEL_PADDING * 2);
	});

	test("the row height is the item slot's height", () => {
		expect(step(cls(sectionProgressVariants().item()), "min-h") * SPACING_STEP_PX).toBe(SECTION_PROGRESS_ITEM_HEIGHT);
	});

	test("the padding is the list slot's vertical padding", () => {
		expect(step(cls(sectionProgressVariants().list()), "py") * SPACING_STEP_PX).toBe(SECTION_PROGRESS_PANEL_PADDING);
	});

	test("rows are a touch target tall", () => {
		expect(SECTION_PROGRESS_ITEM_HEIGHT).toBeGreaterThanOrEqual(44);
	});
});

describe("resolveSectionLabel", () => {
	test("the active section's title", () => {
		expect(resolveSectionLabel(ITEMS, "pricing")).toBe("Pricing");
	});

	test("the first title before any section is active, or for an unknown value", () => {
		expect(resolveSectionLabel(ITEMS, undefined)).toBe("Introduction");
		expect(resolveSectionLabel(ITEMS, "missing")).toBe("Introduction");
	});

	test("empty with no items", () => {
		expect(resolveSectionLabel([], "intro")).toBe("");
	});
});

describe("resolveSectionColor", () => {
	test("the active item's colour, or the default", () => {
		expect(resolveSectionColor(ITEMS, "pricing")).toBe("success");
		expect(resolveSectionColor(ITEMS, "intro")).toBe("foreground");
		expect(resolveSectionColor(ITEMS, undefined)).toBe("foreground");
	});
});

describe("resolveSectionProgressAccessibilityValue", () => {
	test("title and rounded percent", () => {
		expect(resolveSectionProgressAccessibilityValue("Pricing", 0.42)).toBe("Pricing, 42 percent");
		expect(resolveSectionProgressAccessibilityValue("Pricing", 0.426)).toBe("Pricing, 43 percent");
	});

	test("clamps, and drops an empty title", () => {
		expect(resolveSectionProgressAccessibilityValue("", 1.3)).toBe("100 percent");
		expect(resolveSectionProgressAccessibilityValue("Intro", -1)).toBe("Intro, 0 percent");
	});
});

describe("resolveSectionColorToken", () => {
	test("every colour names a token both themes declare", () => {
		for (const color of SECTION_PROGRESS_COLORS) {
			const token = resolveSectionColorToken(color);
			expect(declaredTokens("light").has(token)).toBe(true);
			expect(declaredTokens("dark").has(token)).toBe(true);
		}
	});

	test("the marker paints with the same token", () => {
		for (const color of SECTION_PROGRESS_COLORS) {
			expect(cls(sectionProgressVariants({ color }).itemMarker())).toContain(`bg-${resolveSectionColorToken(color)}`);
		}
	});
});

describe("shouldEmitSection", () => {
	test("re-picking the active section does not emit", () => {
		expect(shouldEmitSection("intro", "intro")).toBe(false);
		expect(shouldEmitSection("intro", "pricing")).toBe(true);
		expect(shouldEmitSection(undefined, "intro")).toBe(true);
	});
});

describe("sectionProgressVariants", () => {
	test("the root lets touches through to the screen", () => {
		expect(cls(sectionProgressVariants().root())).toContain("absolute");
		expect(cls(sectionProgressVariants().root())).toContain("inset-0");
	});

	test("the panel stacks above a bottom pill and below a top one", () => {
		expect(cls(sectionProgressVariants({ placement: "bottom-center" }).panel())).toContain("flex-col-reverse");
		expect(cls(sectionProgressVariants({ placement: "top-end" }).panel())).not.toContain("flex-col-reverse");
	});

	test("the panel is a card surface", () => {
		const panel = cls(sectionProgressVariants().panel());
		for (const utility of ["bg-card", "border", "border-border", "rounded-lg"]) {
			expect(panel.split(" ")).toContain(utility);
		}
	});

	test("the active item reads stronger, and its label owns its colour (rule 1)", () => {
		const active = sectionProgressVariants({ isActive: true });
		const idle = sectionProgressVariants({ isActive: false });
		expect(cls(active.item())).toContain("bg-muted");
		expect(cls(idle.item())).not.toContain("bg-muted");
		expect(cls(active.itemLabel())).toContain("text-foreground");
		expect(cls(idle.itemLabel())).toContain("text-muted-foreground");
		expect(cls(active.item())).not.toMatch(/(^|\s)text-/);
	});

	test("the pill label owns its colour, the pill does not (rule 1)", () => {
		const slots = sectionProgressVariants();
		expect(cls(slots.label())).toContain("text-foreground");
		expect(cls(slots.pill())).not.toMatch(/(^|\s)text-/);
	});

	test("the scrim covers the whole container", () => {
		expect(cls(sectionProgressVariants().scrim())).toContain("inset-0");
	});

	test("a caller className merges onto the root", () => {
		expect(cls(sectionProgressVariants().root({ className: "z-50" }))).toContain("z-50");
	});
});
