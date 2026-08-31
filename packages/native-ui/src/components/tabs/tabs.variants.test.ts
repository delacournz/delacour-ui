import { describe, expect, test } from "bun:test";
import { declaredTokens } from "../../styles/theme-tokens.test";
import { ICON_SIZE_TOKENS } from "../../styles/tokens";
import { TEXT_SIZES } from "../text/text.variants";
import {
	isTriggerOrderConsistent,
	resolveContentAccessibility,
	resolveInitialValue,
	resolveMeasurementTracks,
	resolvePagerTranslate,
	resolvePanOrigin,
	resolvePanPosition,
	resolveReconcileMode,
	resolveScrollOffset,
	resolveSeparatorIndices,
	resolveSeparatorOpacity,
	resolveSettleIndex,
	resolveTabIndex,
	resolveTabOrder,
	resolveTabSelectedness,
	resolveTabsTriggerState,
	resolveVisualIndex,
	shouldEmitTabChange,
	TABS_DEFAULT_SCROLL_ALIGN,
	TABS_DEFAULT_SIZE,
	TABS_DEFAULT_VARIANT,
	TABS_FOREGROUND_TOKEN,
	TABS_LABEL_TEXT_SIZE,
	TABS_PAN,
	TABS_SCROLL_ALIGNS,
	TABS_SCROLL_INSET,
	TABS_SEPARATOR_FADE,
	TABS_SETTLE_SPRING,
	TABS_SIZES,
	TABS_VARIANTS,
	TABS_VISUAL_HYSTERESIS,
	tabsVariants,
} from "./tabs.variants";

const LIGHT = declaredTokens("light");
const DARK = declaredTokens("dark");

/** Tailwind's own spacing scale, in points. `p-1` is four. */
const SPACING_STEP_PX = 4;

/** A slot's class string, with `tv`'s empty-slot `undefined` flattened. */
function cls(value: string | undefined): string {
	return value ?? "";
}

/** The gap step a class string sets — `gap-2.5` yields 2.5. */
function gapStep(value: string): number {
	return Number(value.match(/\bgap-(\d+(?:\.\d+)?)\b/)?.[1]);
}

/** The `min-h-*` step a class string sets — `min-h-11` yields 11. */
function minHeightStep(value: string): number {
	return Number(value.match(/\bmin-h-(\d+(?:\.\d+)?)\b/)?.[1]);
}

/** The `p-*` step a class string sets — `p-0.5` yields 0.5. */
function paddingStep(value: string): number {
	return Number(value.match(/\bp-(\d+(?:\.\d+)?)\b/)?.[1]);
}

/** The `rounded-*` step a class string names — `rounded-xl` yields `xl`. */
function radiusStep(value: string): string {
	return value.match(/\brounded-([\w]+)\b/)?.[1] ?? "";
}

/** Every `text-<colour>` a class string names, ignoring the type scale. */
function textColors(value: string): string[] {
	return [...value.matchAll(/\btext-([a-z][\w-]*)\b/g)]
		.map(([, name]) => name)
		.filter((name) => !TEXT_SIZES.includes(name as (typeof TEXT_SIZES)[number]));
}

type Cell = {
	isDisabled: boolean;
	isScrollable: boolean;
	size: (typeof TABS_SIZES)[number];
	variant: (typeof TABS_VARIANTS)[number];
};

/** Every combination of the axes that paint a tab bar, as `tv` props. */
function everyCell(): Cell[] {
	const cells: Cell[] = [];
	for (const variant of TABS_VARIANTS) {
		for (const size of TABS_SIZES) {
			for (const isDisabled of [false, true]) {
				for (const isScrollable of [false, true]) {
					cells.push({ isDisabled, isScrollable, size, variant });
				}
			}
		}
	}
	return cells;
}

const CELLS = everyCell();

describe("the token readers", () => {
	test("find both theme variants", () => {
		expect(LIGHT.size).toBeGreaterThan(0);
		expect(DARK.size).toBeGreaterThan(0);
	});
});

describe("the matrix", () => {
	test("covers every axis", () => {
		expect(CELLS).toHaveLength(TABS_VARIANTS.length * TABS_SIZES.length * 2 * 2);
	});
});

describe("the root slot", () => {
	test("never takes a width, so a Tabs can be content-sized inside a row", () => {
		for (const cell of CELLS) expect(cls(tabsVariants(cell).root())).not.toMatch(/\bw-/);
	});

	test("paints no surface — the track is the list's", () => {
		for (const cell of CELLS) expect(cls(tabsVariants(cell).root())).not.toMatch(/\bbg-/);
	});

	test("steps its gap with size", () => {
		const gaps = TABS_SIZES.map((size) => gapStep(cls(tabsVariants({ size }).root())));
		expect(new Set(gaps).size).toBe(TABS_SIZES.length);
		expect([...gaps]).toEqual([...gaps].sort((a, b) => a - b));
	});

	test("merges an incoming className last", () => {
		expect(tabsVariants({ size: "md" }).root({ className: "gap-10" })).toContain("gap-10");
		expect(tabsVariants({ size: "md" }).root({ className: "gap-10" })).not.toContain("gap-4");
	});
});

describe("the list slot — the track", () => {
	test("paints a track on primary and on nothing else", () => {
		for (const cell of CELLS) {
			const list = cls(tabsVariants(cell).list());
			if (cell.variant === "primary") expect(list).toMatch(/\bbg-/);
			else expect(list).not.toMatch(/\bbg-/);
		}
	});

	test("clips, so the capsule cannot round its corners past the track's", () => {
		for (const cell of CELLS) expect(cls(tabsVariants(cell).list())).toContain("overflow-hidden");
	});

	test("pads only where there is a track to pad", () => {
		for (const cell of CELLS) {
			const list = cls(tabsVariants(cell).list());
			if (cell.variant === "primary") expect(list).toMatch(/\bp-/);
			else expect(list).not.toMatch(/\bp-/);
		}
	});

	test("carries no text colour, in any cell", () => {
		for (const cell of CELLS) expect(textColors(cls(tabsVariants(cell).list()))).toHaveLength(0);
	});

	test("never carries the row's own layout, which would flatten the capsule's inset", () => {
		// The track and the row have to be two elements. An absolutely positioned
		// indicator resolves its insets against its parent's padding box, so a track
		// that was also the row would hand the capsule the track's full height while
		// the triggers sat inside the padding — the capsule and the track then have
		// the same radius, offset sideways, and their curves cross at the ends.
		for (const cell of CELLS) {
			expect(cls(tabsVariants(cell).list())).not.toContain("flex-row");
			expect(cls(tabsVariants(cell).list())).not.toContain("items-stretch");
		}
	});
});

describe("the row slot", () => {
	test("lays the triggers out on one row, stretched to a common height", () => {
		for (const cell of CELLS) {
			const row = cls(tabsVariants(cell).row());
			expect(row).toContain("flex-row");
			expect(row).toContain("items-stretch");
		}
	});

	test("steps its gap with size", () => {
		const gaps = TABS_SIZES.map((size) => gapStep(cls(tabsVariants({ size }).row())));
		expect(new Set(gaps).size).toBe(TABS_SIZES.length);
		expect([...gaps]).toEqual([...gaps].sort((a, b) => a - b));
	});

	test("paints no surface of its own", () => {
		for (const cell of CELLS) expect(cls(tabsVariants(cell).row())).not.toMatch(/\bbg-/);
	});
});

describe("the indicator slot", () => {
	test("is absolutely positioned in every cell", () => {
		for (const cell of CELLS) expect(cls(tabsVariants(cell).indicator())).toContain("absolute");
	});

	test("names a fill in every cell", () => {
		for (const cell of CELLS) expect(cls(tabsVariants(cell).indicator())).toMatch(/\bbg-/);
	});

	test("claims neither a width nor a horizontal offset, which the animated style owns", () => {
		for (const cell of CELLS) {
			const indicator = cls(tabsVariants(cell).indicator());
			expect(indicator).not.toMatch(/\bw-/);
			expect(indicator).not.toMatch(/\bleft-/);
			expect(indicator).not.toMatch(/\bright-/);
			expect(indicator).not.toMatch(/\binset-x-/);
		}
	});

	test("claims no transform, which the animated style owns", () => {
		for (const cell of CELLS) {
			const indicator = cls(tabsVariants(cell).indicator());
			expect(indicator).not.toMatch(/\btranslate-/);
			expect(indicator).not.toMatch(/\bscale-/);
		}
	});

	test("spans the trigger on primary, and only its bottom edge on secondary", () => {
		for (const cell of CELLS) {
			const indicator = cls(tabsVariants(cell).indicator());
			if (cell.variant === "secondary") {
				expect(indicator).toContain("bottom-0");
				expect(indicator).toMatch(/\bh-/);
			} else {
				expect(indicator).toContain("inset-y-0");
			}
		}
	});

	test("carries no text colour, in any cell", () => {
		for (const cell of CELLS) expect(textColors(cls(tabsVariants(cell).indicator()))).toHaveLength(0);
	});
});

describe("the trigger slot", () => {
	test("never carries an opacity, which Pressable's animated style would overwrite", () => {
		for (const cell of CELLS) expect(cls(tabsVariants(cell).trigger())).not.toMatch(/\bopacity-/);
	});

	test("floors its height rather than fixing it", () => {
		for (const cell of CELLS) {
			const trigger = cls(tabsVariants(cell).trigger());
			expect(trigger).toMatch(/\bmin-h-/);
			expect(trigger).not.toMatch(/(?<!min-)\bh-\d/);
		}
	});

	test("gives every size a distinct floor, increasing with it", () => {
		const floors = TABS_SIZES.map((size) => minHeightStep(cls(tabsVariants({ size }).trigger())));
		expect(new Set(floors).size).toBe(TABS_SIZES.length);
		expect([...floors]).toEqual([...floors].sort((a, b) => a - b));
	});

	test("clears the platform hit target at the default size", () => {
		const floor = minHeightStep(cls(tabsVariants({ size: TABS_DEFAULT_SIZE }).trigger()));
		expect(floor * SPACING_STEP_PX).toBeGreaterThanOrEqual(44);
	});

	test("fills the row when the list does not scroll", () => {
		for (const cell of CELLS) {
			const trigger = cls(tabsVariants(cell).trigger());
			if (cell.isScrollable) expect(trigger).not.toContain("flex-1");
			else expect(trigger).toContain("flex-1");
		}
	});

	test("paints no surface of its own, in any cell", () => {
		for (const cell of CELLS) expect(cls(tabsVariants(cell).trigger())).not.toMatch(/\bbg-/);
	});

	test("carries no text colour, in any cell", () => {
		for (const cell of CELLS) expect(textColors(cls(tabsVariants(cell).trigger()))).toHaveLength(0);
	});

	test("steps its gap with size", () => {
		const gaps = TABS_SIZES.map((size) => gapStep(cls(tabsVariants({ size }).trigger())));
		expect(new Set(gaps).size).toBe(TABS_SIZES.length);
		expect([...gaps]).toEqual([...gaps].sort((a, b) => a - b));
	});
});

describe("the icon slot", () => {
	test("indexes the shared icon scale rather than carrying a private number", () => {
		for (const cell of CELLS) expect(cls(tabsVariants(cell).icon())).toMatch(/\bsize-icon-[\w-]+\b/);
	});

	test("steps the glyph with the bar, and keeps every step on that scale", () => {
		const steps = TABS_SIZES.map((size) => cls(tabsVariants({ size }).icon()).match(/\bsize-(icon-[\w-]+)\b/)?.[1]);
		expect(new Set(steps).size).toBe(TABS_SIZES.length);
		for (const step of steps) {
			expect(ICON_SIZE_TOKENS).toContain(step as (typeof ICON_SIZE_TOKENS)[number]);
		}
	});
});

describe("the label slot", () => {
	test("restates no type scale", () => {
		for (const cell of CELLS) {
			const label = cls(tabsVariants(cell).label());
			expect(label).not.toMatch(/\bfont-/);
			for (const size of TEXT_SIZES) expect(label).not.toContain(`text-${size}`);
		}
	});

	test("names no colour at all, in any cell", () => {
		// The label's colour fades between two tokens on the UI thread, so it is an
		// animated style. A class here would be a second source for one colour, and
		// a class and a style disagreeing for a frame is what `Checkbox`'s animated
		// border exists to avoid. `TABS_FOREGROUND_TOKEN` is the matrix instead.
		for (const cell of CELLS) expect(textColors(cls(tabsVariants(cell).label()))).toHaveLength(0);
	});

	test("fades when the trigger is disabled, and only then", () => {
		for (const cell of CELLS) {
			const label = cls(tabsVariants(cell).label());
			if (cell.isDisabled) expect(label).toMatch(/\bopacity-/);
			else expect(label).not.toMatch(/\bopacity-/);
		}
	});

	test("merges an incoming className last", () => {
		expect(tabsVariants().label({ className: "shrink-0" })).toContain("shrink-0");
	});
});

describe("the separator slot", () => {
	test("names no colour — the line itself is a Separator", () => {
		for (const cell of CELLS) {
			expect(cls(tabsVariants(cell).separator())).not.toMatch(/\bbg-/);
			expect(textColors(cls(tabsVariants(cell).separator()))).toHaveLength(0);
		}
	});

	test("claims no opacity, which the fade owns", () => {
		for (const cell of CELLS) expect(cls(tabsVariants(cell).separator())).not.toMatch(/\bopacity-/);
	});

	test("lays its rule out on a row, or the rule has no length at all", () => {
		// A vertical `Separator` is `self-stretch w-px` and takes its length from
		// the cross axis of whatever holds it. In a column that axis is horizontal,
		// so the rule comes out full width and zero height and draws nothing —
		// found on a simulator, and invisible to every other assertion here.
		for (const cell of CELLS) expect(cls(tabsVariants(cell).separator())).toContain("flex-row");
	});

	test("steps its height with size", () => {
		const heights = TABS_SIZES.map((size) => Number(cls(tabsVariants({ size }).separator()).match(/\bh-(\d+)\b/)?.[1]));
		expect(new Set(heights).size).toBe(TABS_SIZES.length);
		expect([...heights]).toEqual([...heights].sort((a, b) => a - b));
	});
});

describe("the pager slots", () => {
	test("clip the viewport, so a neighbouring panel cannot paint outside it", () => {
		for (const cell of CELLS) expect(cls(tabsVariants(cell).pager())).toContain("overflow-hidden");
	});

	test("lay the panels out as one stretched row", () => {
		for (const cell of CELLS) {
			const row = cls(tabsVariants(cell).pageRow());
			expect(row).toContain("flex-row");
			expect(row).toContain("items-stretch");
		}
	});

	test("size every page to one viewport and stop it shrinking", () => {
		for (const cell of CELLS) {
			const page = cls(tabsVariants(cell).page());
			expect(page).toContain("w-full");
			expect(page).toContain("shrink-0");
		}
	});
});

describe("the variant matrix", () => {
	test("gives every variant a treatment of its own, across the track, the indicator and the selected label", () => {
		const treatments = TABS_VARIANTS.map((variant) => {
			const slots = tabsVariants({ variant });
			const tokens = TABS_FOREGROUND_TOKEN[variant];
			return [cls(slots.list()), cls(slots.indicator()), tokens.selected, tokens.unselected].join("|");
		});
		expect(new Set(treatments).size).toBe(TABS_VARIANTS.length);
	});
});

describe("the track and its capsule", () => {
	test("round both fully, so the capsule is concentric at any padding", () => {
		// A pill inside a pill is concentric whatever the gap, which is why there is
		// no radius arithmetic in this component and no per-size radius maps to keep
		// in step. Checkbox subtracts a border width from a named step precisely
		// because a rounded *rectangle* does not get this for free.
		for (const size of TABS_SIZES) {
			expect(radiusStep(cls(tabsVariants({ size, variant: "primary" }).list()))).toBe("full");
			expect(radiusStep(cls(tabsVariants({ size, variant: "primary" }).indicator()))).toBe("full");
		}
	});

	test("name no numeric radius step, at any size", () => {
		for (const size of TABS_SIZES) {
			expect(cls(tabsVariants({ size, variant: "primary" }).list())).not.toMatch(/\brounded-(xs|sm|md|lg|xl|2xl)\b/);
			expect(cls(tabsVariants({ size, variant: "primary" }).indicator())).not.toMatch(
				/\brounded-(xs|sm|md|lg|xl|2xl)\b/
			);
		}
	});

	test("pad the track, and step that padding with size", () => {
		const steps = TABS_SIZES.map((size) => paddingStep(cls(tabsVariants({ size, variant: "primary" }).list())));
		for (const step of steps) expect(step).toBeGreaterThan(0);
		expect([...steps]).toEqual([...steps].sort((a, b) => a - b));
	});

	test("paints the capsule on a surface that sits above the track", () => {
		// `card` cannot do this job — it is darker than `muted` in the dark theme, so
		// the capsule would read as sunken rather than raised. See theme.css.
		const indicator = cls(tabsVariants({ variant: "primary" }).indicator());
		expect(indicator).toContain("bg-elevated");
		expect(cls(tabsVariants({ variant: "primary" }).list())).toContain("bg-muted");
	});

	test("declares both of those surfaces in both themes", () => {
		// A token missing from one variant resolves to nothing and the capsule is
		// drawn in whatever the fallback happens to be — silent, and visible in one
		// theme only. The reader `badge.variants.test.ts` uses.
		for (const token of ["elevated", "muted"]) {
			expect(LIGHT.has(token)).toBe(true);
			expect(DARK.has(token)).toBe(true);
		}
	});
});

describe("TABS_FOREGROUND_TOKEN", () => {
	test("names a token for every variant, selected and not", () => {
		for (const variant of TABS_VARIANTS) {
			expect(TABS_FOREGROUND_TOKEN[variant].selected.length).toBeGreaterThan(0);
			expect(TABS_FOREGROUND_TOKEN[variant].unselected.length).toBeGreaterThan(0);
		}
	});

	test("gives the selected end a colour of its own, in every variant", () => {
		// Two ends collapsing means the label crossfades from a colour to itself and
		// selecting a tab changes nothing about its text.
		for (const variant of TABS_VARIANTS) {
			expect(TABS_FOREGROUND_TOKEN[variant].selected).not.toBe(TABS_FOREGROUND_TOKEN[variant].unselected);
		}
	});

	test("is the only place either colour is named", () => {
		// If a colour ever reappears on the `label` slot, the fade and the class
		// become two sources for one value. This is the test that catches it.
		for (const cell of CELLS) expect(textColors(cls(tabsVariants(cell).label()))).toHaveLength(0);
	});

	test("declares every token it names in both themes", () => {
		for (const variant of TABS_VARIANTS) {
			for (const token of [TABS_FOREGROUND_TOKEN[variant].selected, TABS_FOREGROUND_TOKEN[variant].unselected]) {
				expect(LIGHT.has(token)).toBe(true);
				expect(DARK.has(token)).toBe(true);
			}
		}
	});
});

describe("TABS_LABEL_TEXT_SIZE", () => {
	test("covers every tabs size with a size Text actually has", () => {
		for (const size of TABS_SIZES) {
			expect(TEXT_SIZES).toContain(TABS_LABEL_TEXT_SIZE[size]);
		}
	});

	test("grows with the bar", () => {
		const steps = TABS_SIZES.map((size) => TEXT_SIZES.indexOf(TABS_LABEL_TEXT_SIZE[size]));
		expect(new Set(steps).size).toBe(TABS_SIZES.length);
		expect([...steps]).toEqual([...steps].sort((a, b) => a - b));
	});
});

describe("the gap ladder", () => {
	test("binds a label to the glyph beside it before the trigger beside that", () => {
		for (const size of TABS_SIZES) {
			const trigger = gapStep(cls(tabsVariants({ size }).trigger()));
			const row = gapStep(cls(tabsVariants({ size }).row()));
			const root = gapStep(cls(tabsVariants({ size }).root()));
			expect(trigger).toBeLessThan(row);
			expect(row).toBeLessThan(root);
		}
	});
});

describe("the defaults", () => {
	test("the named constants are the ones tv falls back to", () => {
		expect(cls(tabsVariants().list())).toBe(cls(tabsVariants({ variant: TABS_DEFAULT_VARIANT }).list()));
		expect(cls(tabsVariants().trigger())).toBe(cls(tabsVariants({ size: TABS_DEFAULT_SIZE }).trigger()));
	});

	test("the default scroll alignment is one the resolver handles", () => {
		expect(TABS_SCROLL_ALIGNS).toContain(TABS_DEFAULT_SCROLL_ALIGN);
	});
});

describe("TABS_SETTLE_SPRING", () => {
	test("describes a spring that actually springs", () => {
		expect(TABS_SETTLE_SPRING.mass).toBeGreaterThan(0);
		expect(TABS_SETTLE_SPRING.stiffness).toBeGreaterThan(0);
		expect(TABS_SETTLE_SPRING.damping).toBeGreaterThan(0);
		expect(TABS_SETTLE_SPRING.damping).toBeLessThan(
			2 * Math.sqrt(TABS_SETTLE_SPRING.stiffness * TABS_SETTLE_SPRING.mass)
		);
	});

	test("names no clamp, which belongs to a branch of SpringConfig this one is not on", () => {
		expect("clamp" in TABS_SETTLE_SPRING).toBe(false);
	});
});

describe("TABS_PAN", () => {
	test("gives a sideways drag a head start over a vertical one", () => {
		expect(TABS_PAN.activateX).toBeLessThan(TABS_PAN.failY);
	});

	test("sets a positive fling threshold and a bounded overscroll", () => {
		expect(TABS_PAN.flingVelocity).toBeGreaterThan(0);
		expect(TABS_PAN.overscroll).toBeGreaterThan(0);
		expect(TABS_PAN.overscroll).toBeLessThan(1);
	});
});

describe("the remaining tuning constants", () => {
	test("TABS_VISUAL_HYSTERESIS stays under the half-tab that would freeze it", () => {
		expect(TABS_VISUAL_HYSTERESIS).toBeGreaterThanOrEqual(0);
		expect(TABS_VISUAL_HYSTERESIS).toBeLessThan(0.5);
	});

	test("TABS_SEPARATOR_FADE holds before it ramps", () => {
		expect(TABS_SEPARATOR_FADE.hold).toBeLessThan(TABS_SEPARATOR_FADE.distance);
	});

	test("TABS_SCROLL_INSET always leaves a sliver of the neighbour", () => {
		expect(TABS_SCROLL_INSET).toBeGreaterThan(0);
	});
});

describe("resolveTabOrder", () => {
	test("reads the panels' values in source order", () => {
		expect(resolveTabOrder(["a", "b"], ["b", "a"])).toEqual(["a", "b"]);
	});

	test("falls back to registration when there are no panels", () => {
		expect(resolveTabOrder([], ["x", "y"])).toEqual(["x", "y"]);
	});

	test("reports no order when there is neither", () => {
		expect(resolveTabOrder([], [])).toEqual([]);
	});

	test("returns a copy, so a caller cannot mutate the source", () => {
		const panels = ["a"];
		expect(resolveTabOrder(panels, [])).not.toBe(panels);
	});
});

describe("resolveTabIndex", () => {
	test("finds a value's place", () => {
		expect(resolveTabIndex(["a", "b", "c"], "b")).toBe(1);
	});

	test("reports -1 for a value no tab claims", () => {
		expect(resolveTabIndex(["a"], "z")).toBe(-1);
	});

	test("reports -1 with nothing selected", () => {
		expect(resolveTabIndex(["a"], null)).toBe(-1);
		expect(resolveTabIndex(["a"], undefined)).toBe(-1);
	});
});

describe("resolveInitialValue", () => {
	test("takes the caller's default when given one", () => {
		expect(resolveInitialValue(["a", "b"], "b")).toBe("b");
	});

	test("starts on the first tab otherwise, so the indicator always has somewhere to sit", () => {
		expect(resolveInitialValue(["a", "b"], undefined)).toBe("a");
	});

	test("reports null only when there are no tabs at all", () => {
		expect(resolveInitialValue([], undefined)).toBe(null);
	});

	test("respects an explicit null default", () => {
		expect(resolveInitialValue(["a"], null)).toBe(null);
	});
});

describe("shouldEmitTabChange", () => {
	test("reports a real change", () => {
		expect(shouldEmitTabChange("a", "b")).toBe(true);
		expect(shouldEmitTabChange(null, "a")).toBe(true);
	});

	test("stays quiet for a re-press of the current tab", () => {
		expect(shouldEmitTabChange("a", "a")).toBe(false);
	});
});

describe("resolveMeasurementTracks", () => {
	test("builds three arrays of equal length once every tab has measured", () => {
		const tracks = resolveMeasurementTracks(["a", "b"], { a: { width: 40, x: 0 }, b: { width: 60, x: 44 } });
		expect(tracks).toEqual({ index: [0, 1], width: [40, 60], x: [0, 44] });
	});

	test("reports nothing while any tab is still unmeasured", () => {
		expect(resolveMeasurementTracks(["a", "b"], { a: { width: 40, x: 0 } })).toBe(null);
	});

	test("reports nothing with no tabs at all", () => {
		expect(resolveMeasurementTracks([], {})).toBe(null);
	});

	test("pads a single tab to the two points interpolate needs", () => {
		const tracks = resolveMeasurementTracks(["a"], { a: { width: 40, x: 8 } });
		expect(tracks).toEqual({ index: [0, 1], width: [40, 40], x: [8, 8] });
	});

	test("keeps the three arrays the same length, whatever the tab count", () => {
		const measured = { a: { width: 1, x: 0 }, b: { width: 2, x: 1 }, c: { width: 3, x: 3 } };
		const tracks = resolveMeasurementTracks(["a", "b", "c"], measured);
		expect(tracks?.index).toHaveLength(3);
		expect(tracks?.width).toHaveLength(3);
		expect(tracks?.x).toHaveLength(3);
	});
});

describe("isTriggerOrderConsistent", () => {
	test("accepts triggers laid out left to right in panel order", () => {
		expect(isTriggerOrderConsistent([0, 44, 96])).toBe(true);
	});

	test("catches a bar whose triggers were written in a different order", () => {
		expect(isTriggerOrderConsistent([96, 0, 44])).toBe(false);
	});

	test("catches every trigger reporting a wrapper-relative zero", () => {
		expect(isTriggerOrderConsistent([0, 0, 0])).toBe(false);
	});

	test("accepts a single trigger, and none at all", () => {
		expect(isTriggerOrderConsistent([12])).toBe(true);
		expect(isTriggerOrderConsistent([])).toBe(true);
	});
});

describe("resolveReconcileMode", () => {
	test("does nothing when the target is already the selection", () => {
		expect(resolveReconcileMode({ selectedIndex: 1, selectedValue: "b", targetIndex: 1, targetValue: "b" })).toBe(
			"none"
		);
	});

	test("does nothing when a controlled parent rejects the change", () => {
		expect(resolveReconcileMode({ selectedIndex: 0, selectedValue: "a", targetIndex: 0, targetValue: "a" })).toBe(
			"none"
		);
	});

	test("does nothing when nothing is selected", () => {
		expect(resolveReconcileMode({ selectedIndex: -1, selectedValue: null, targetIndex: 2, targetValue: "c" })).toBe(
			"none"
		);
	});

	test("springs to a tab the user chose", () => {
		expect(resolveReconcileMode({ selectedIndex: 1, selectedValue: "b", targetIndex: 0, targetValue: "a" })).toBe(
			"spring"
		);
	});

	test("jumps when the same tab moved because the list changed", () => {
		expect(resolveReconcileMode({ selectedIndex: 2, selectedValue: "b", targetIndex: 1, targetValue: "b" })).toBe(
			"jump"
		);
	});
});

describe("resolveContentAccessibility", () => {
	test("leaves the selected panel readable", () => {
		expect(resolveContentAccessibility(true)).toEqual({
			accessibilityElementsHidden: false,
			importantForAccessibility: "auto",
		});
	});

	test("hides every other panel on both platforms", () => {
		expect(resolveContentAccessibility(false)).toEqual({
			accessibilityElementsHidden: true,
			importantForAccessibility: "no-hide-descendants",
		});
	});
});

describe("resolveSeparatorIndices", () => {
	test("maps a pair of values onto their places", () => {
		expect(resolveSeparatorIndices(["a", "b", "c"], ["b", "c"])).toEqual({ left: 1, right: 2 });
	});

	test("reports -1 for a value no tab claims", () => {
		expect(resolveSeparatorIndices(["a"], ["a", "z"])).toEqual({ left: 0, right: -1 });
	});
});

describe("resolveTabsTriggerState", () => {
	test("resolves isDisabled nearest-first across all nine combinations", () => {
		const expected: Record<string, boolean> = {
			"undefined|undefined": false,
			"undefined|true": true,
			"undefined|false": false,
			"true|undefined": true,
			"true|true": true,
			"true|false": true,
			"false|undefined": false,
			"false|true": false,
			"false|false": false,
		};
		for (const own of [undefined, true, false]) {
			for (const root of [undefined, true, false]) {
				expect(resolveTabsTriggerState({ own, root }).isDisabled).toBe(expected[`${own}|${root}`]);
			}
		}
	});

	test("lets one trigger opt out of a disabled bar", () => {
		expect(resolveTabsTriggerState({ own: false, root: true }).isDisabled).toBe(false);
	});

	test("lets one trigger disable itself inside a bar that names nothing", () => {
		expect(resolveTabsTriggerState({ own: true }).isDisabled).toBe(true);
	});
});

describe("resolvePagerTranslate", () => {
	test("moves the row left as the position advances", () => {
		expect(resolvePagerTranslate(1, 390)).toBe(-390);
		expect(resolvePagerTranslate(2, 390)).toBe(-780);
	});

	test("leaves the first panel at rest", () => {
		// `toBeCloseTo` rather than `toBe`: negating zero yields `-0`, which is a
		// perfectly good translation and a failing `Object.is` comparison.
		expect(resolvePagerTranslate(0, 390)).toBeCloseTo(0);
	});

	test("tracks a fractional position", () => {
		expect(resolvePagerTranslate(0.5, 390)).toBe(-195);
	});
});

describe("resolvePanOrigin", () => {
	test("cancels out the travel that happened before the pan activated", () => {
		// A pan activates only after the finger has crossed `activateX`, but
		// `translationX` counts from touch-down. Feeding the origin straight back
		// through `resolvePanPosition` has to return the position the pager was
		// already at, or every drag jumps sideways on its first frame.
		const position = 1;
		const translationX = -TABS_PAN.activateX;
		const pageWidth = 100;
		const origin = resolvePanOrigin(position, translationX, pageWidth);
		expect(resolvePanPosition({ count: 3, pageWidth, startPosition: origin, translationX })).toBeCloseTo(position);
	});

	test("round-trips from a fractional position, so a mid-spring grab does not jump", () => {
		const position = 1.37;
		const translationX = 24;
		const pageWidth = 390;
		const origin = resolvePanOrigin(position, translationX, pageWidth);
		expect(resolvePanPosition({ count: 4, pageWidth, startPosition: origin, translationX })).toBeCloseTo(position);
	});

	test("stands still before the viewport has measured", () => {
		expect(resolvePanOrigin(2, 50, 0)).toBe(2);
	});
});

describe("resolvePanPosition", () => {
	const base = { count: 3, pageWidth: 100, startPosition: 1 };

	test("follows the finger one page at a time", () => {
		expect(resolvePanPosition({ ...base, translationX: -50 })).toBeCloseTo(1.5);
		expect(resolvePanPosition({ ...base, translationX: 50 })).toBeCloseTo(0.5);
	});

	test("stands still before the viewport has measured", () => {
		expect(resolvePanPosition({ ...base, pageWidth: 0, translationX: -50 })).toBe(1);
	});

	test("resists rather than stopping dead before the first tab", () => {
		const dragged = resolvePanPosition({ ...base, startPosition: 0, translationX: 200 });
		expect(dragged).toBeLessThan(0);
		expect(dragged).toBeGreaterThan(-TABS_PAN.overscroll);
	});

	test("resists rather than stopping dead past the last tab", () => {
		const dragged = resolvePanPosition({ ...base, startPosition: 2, translationX: -200 });
		expect(dragged).toBeGreaterThan(2);
		expect(dragged).toBeLessThan(2 + TABS_PAN.overscroll);
	});

	test("never lets an unbounded drag escape the overscroll bound", () => {
		const dragged = resolvePanPosition({ ...base, startPosition: 2, translationX: -100000 });
		expect(dragged).toBeLessThan(2 + TABS_PAN.overscroll);
	});
});

describe("resolveSettleIndex", () => {
	const base = { count: 4, startIndex: 1, velocity: 0 };

	test("stays put for a drag shorter than half a page", () => {
		expect(resolveSettleIndex({ ...base, position: 1.3 })).toBe(1);
	});

	test("advances for a drag past the midpoint", () => {
		expect(resolveSettleIndex({ ...base, position: 1.7 })).toBe(2);
	});

	test("advances on a flick that never crossed the midpoint", () => {
		expect(resolveSettleIndex({ ...base, position: 1.1, velocity: TABS_PAN.flingVelocity })).toBe(2);
	});

	test("retreats on a flick the other way", () => {
		expect(resolveSettleIndex({ ...base, position: 0.9, velocity: -TABS_PAN.flingVelocity })).toBe(0);
	});

	test("never skips a tab, however fast the flick", () => {
		expect(resolveSettleIndex({ ...base, position: 1.05, velocity: 50 })).toBe(2);
	});

	test("cannot settle past the last tab", () => {
		expect(resolveSettleIndex({ ...base, count: 2, position: 1.4, startIndex: 1, velocity: 50 })).toBe(1);
	});

	test("cannot settle before the first", () => {
		expect(resolveSettleIndex({ ...base, position: 0.1, startIndex: 0, velocity: -50 })).toBe(0);
	});

	test("steps over a disabled tab in the direction of travel", () => {
		expect(resolveSettleIndex({ ...base, isEnabled: [true, true, false, true], position: 1.8, startIndex: 1 })).toBe(3);
	});

	test("turns back when the direction of travel runs out of enabled tabs", () => {
		expect(resolveSettleIndex({ ...base, isEnabled: [true, true, false, false], position: 2.2, startIndex: 1 })).toBe(
			1
		);
	});

	test("never settles on an index no tab has, when the last tabs are disabled", () => {
		const settled = resolveSettleIndex({
			...base,
			isEnabled: [true, true, true, false],
			position: 2.8,
			startIndex: 2,
		});
		expect(settled).toBeLessThanOrEqual(3);
		expect(settled).toBeGreaterThanOrEqual(0);
		expect(settled).toBe(2);
	});

	test("never settles below zero, when the first tabs are disabled", () => {
		const settled = resolveSettleIndex({
			...base,
			isEnabled: [false, true, true, true],
			position: 0.2,
			startIndex: 1,
		});
		expect(settled).toBeGreaterThanOrEqual(0);
		expect(settled).toBe(1);
	});

	test("settles on 0 with no tabs at all", () => {
		expect(resolveSettleIndex({ ...base, count: 0, position: 0 })).toBe(0);
	});
});

describe("resolveTabSelectedness", () => {
	test("reads fully selected when the pager sits on the tab", () => {
		expect(resolveTabSelectedness(1, 1)).toBe(1);
	});

	test("reads not selected at all once a whole tab away", () => {
		expect(resolveTabSelectedness(0, 1)).toBe(0);
		expect(resolveTabSelectedness(0, 3)).toBe(0);
	});

	test("splits evenly between two neighbours at the midpoint of a drag", () => {
		expect(resolveTabSelectedness(0, 0.5)).toBeCloseTo(0.5);
		expect(resolveTabSelectedness(1, 0.5)).toBeCloseTo(0.5);
	});

	test("is symmetric, so approaching from either side fades the same", () => {
		expect(resolveTabSelectedness(1, 0.7)).toBeCloseTo(resolveTabSelectedness(1, 1.3));
	});

	test("stays within 0 and 1 across a rubber-banded overscroll", () => {
		for (const position of [-TABS_PAN.overscroll, 0, 0.25, 1, 2.5, 3 + TABS_PAN.overscroll]) {
			const value = resolveTabSelectedness(1, position);
			expect(value).toBeGreaterThanOrEqual(0);
			expect(value).toBeLessThanOrEqual(1);
		}
	});

	test("reads nothing for a tab no panel claims", () => {
		expect(resolveTabSelectedness(-1, 0)).toBe(0);
	});
});

describe("resolveVisualIndex", () => {
	test("holds the current tab until the pager is most of the way to the next", () => {
		expect(resolveVisualIndex(1.4, 1, 3)).toBe(1);
	});

	test("swaps once the pager is past the midpoint and the hysteresis band", () => {
		expect(resolveVisualIndex(1.7, 1, 3)).toBe(2);
	});

	test("holds inside the band, which is what stops a midpoint flicker", () => {
		expect(resolveVisualIndex(1.5 + TABS_VISUAL_HYSTERESIS / 2, 1, 3)).toBe(1);
	});

	test("clamps to the tabs that exist", () => {
		expect(resolveVisualIndex(9, 1, 3)).toBe(2);
		expect(resolveVisualIndex(-9, 1, 3)).toBe(0);
	});

	test("reports 0 with no tabs at all", () => {
		expect(resolveVisualIndex(0, 0, 0)).toBe(0);
	});
});

describe("resolveSeparatorOpacity", () => {
	test("shows the rule while the pager is parked on either of its neighbours", () => {
		// The bar at rest shows every rule it has. The earlier shape hid the ones
		// flanking the active tab, which on a three-tab bar left exactly one visible
		// over on the far side and changed the set on every tab change.
		expect(resolveSeparatorOpacity(0, 0, 1)).toBe(1);
		expect(resolveSeparatorOpacity(1, 0, 1)).toBe(1);
	});

	test("hides it while the pager is crossing it", () => {
		expect(resolveSeparatorOpacity(0.5, 0, 1)).toBe(0);
	});

	test("dips and returns across a full swipe over it", () => {
		const ramp = [0, 0.25, 0.5, 0.75, 1].map((p) => resolveSeparatorOpacity(p, 0, 1));
		expect(ramp[0]).toBe(1);
		expect(ramp[2]).toBe(0);
		expect(ramp[4]).toBe(1);
		expect(ramp[1]).toBeLessThan(1);
		expect(ramp[1]).toBeCloseTo(ramp[3]);
	});

	test("stays fully visible for a gap the pager is nowhere near", () => {
		expect(resolveSeparatorOpacity(4, 0, 1)).toBe(1);
		expect(resolveSeparatorOpacity(-2, 0, 1)).toBe(1);
	});

	test("never leaves the 0 to 1 range, across a rubber-banded overscroll", () => {
		for (const position of [-TABS_PAN.overscroll, 0, 0.5, 1, 2, 3 + TABS_PAN.overscroll]) {
			const value = resolveSeparatorOpacity(position, 1, 2);
			expect(value).toBeGreaterThanOrEqual(0);
			expect(value).toBeLessThanOrEqual(1);
		}
	});

	test("stays visible for a pair naming a tab nothing claims", () => {
		expect(resolveSeparatorOpacity(0, -1, 1)).toBe(1);
		expect(resolveSeparatorOpacity(0, 0, -1)).toBe(1);
	});

	test("reads the pair in either order", () => {
		expect(resolveSeparatorOpacity(0.5, 1, 0)).toBe(0);
		expect(resolveSeparatorOpacity(0, 1, 0)).toBe(1);
	});
});

describe("resolveScrollOffset", () => {
	const base = { contentWidth: 1000, currentOffset: 120, viewportWidth: 400, width: 100, x: 450 };

	test("reports nothing to scroll for none", () => {
		expect(resolveScrollOffset({ ...base, align: "none" })).toBe(120);
	});

	test("puts the selected trigger at the leading edge for start", () => {
		expect(resolveScrollOffset({ ...base, align: "start" })).toBe(450 - TABS_SCROLL_INSET);
	});

	test("centres it for center", () => {
		expect(resolveScrollOffset({ ...base, align: "center" })).toBe(450 + 50 - 200);
	});

	test("puts it at the trailing edge for end", () => {
		expect(resolveScrollOffset({ ...base, align: "end" })).toBe(450 + 100 - 400 + TABS_SCROLL_INSET);
	});

	test("clamps at zero, so the first tab cannot scroll the row past its own start", () => {
		expect(resolveScrollOffset({ ...base, align: "center", x: 0 })).toBe(0);
	});

	test("clamps at the end, so the last tab cannot scroll past the content", () => {
		expect(resolveScrollOffset({ ...base, align: "center", x: 900 })).toBe(1000 - 400);
	});

	test("reports zero while the row is narrower than its viewport", () => {
		expect(resolveScrollOffset({ ...base, align: "center", contentWidth: 200 })).toBe(0);
	});

	test("leaves the bar alone before it has measured", () => {
		expect(resolveScrollOffset({ ...base, align: "center", viewportWidth: 0 })).toBe(120);
	});
});
