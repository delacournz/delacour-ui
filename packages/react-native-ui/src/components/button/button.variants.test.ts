import { describe, expect, test } from "bun:test";
import { BUTTON_RADIUS_TOKENS, ICON_SIZE_TOKENS } from "../../styles/tokens";
import {
	BUTTON_FOREGROUND_TOKEN,
	BUTTON_GROUP_ORIENTATIONS,
	BUTTON_GROUP_POSITIONS,
	BUTTON_GROUP_SEPARATOR_ORIENTATION,
	BUTTON_ICON_SIZES,
	BUTTON_LABEL_SIZES,
	BUTTON_SIZES,
	BUTTON_SPINNER_PLACEMENTS,
	BUTTON_VARIANTS,
	type ButtonIconSize,
	type ButtonLabelSize,
	buttonVariants,
	resolveButtonFeedback,
	resolveButtonLayout,
	resolveGroupedButtonSize,
	resolveGroupPositions,
	resolveGroupSeams,
	resolveSpinnerSwapIndex,
} from "./button.variants";

/**
 * Each square size beside the labelled step it is built from.
 *
 * Written out rather than derived by stripping the prefix, so the test asserts
 * the pairing instead of restating the naming scheme it is meant to check.
 */
const SQUARE_PAIRS = [
	["icon-sm", "sm"],
	["icon-md", "md"],
	["icon-lg", "lg"],
] as const satisfies readonly (readonly [ButtonIconSize, ButtonLabelSize])[];

/**
 * Group shapes the two child walks are swept over together.
 *
 * `true` is a member, `false` a separator. Covers the empty group, a lone
 * member, both ends, a run with middles, and separators leading, trailing,
 * doubled and between — the arrangements a caller actually writes.
 */
const SHAPES: readonly boolean[][] = [
	[],
	[true],
	[false],
	[true, true],
	[true, false, true],
	[true, true, true],
	[false, true, false],
	[false, false],
	[true, false, false, true],
	[true, true, false, true, true],
	[false, true, true, false],
	[true, true, true, true, true],
];

/** The `--spacing-button-*` token a root class string sets its height from. */
function heightToken(cls: string): string | undefined {
	return cls.match(/\bh-(button-[\w-]+)\b/)?.[1];
}

/** The `--spacing-button-*` token a root class string sets its width from. */
function widthToken(cls: string): string | undefined {
	return cls.match(/\bw-(button-[\w-]+)\b/)?.[1];
}

/** The `--radius-*` token a root class string sets its corners from. */
function radiusToken(cls: string): string | undefined {
	return cls.match(/\brounded-([\w-]+)\b/)?.[1];
}

/**
 * Position of a slot's `size-icon-*` token on the shared icon scale.
 *
 * Compares by step rather than by points, so the test says what it means and
 * survives a token being retuned in `tokens.css`. `tokens.test.ts` keeps the
 * array ordered, and asserts the icon actually fits inside the button height.
 */
function iconStep(cls: string): number {
	const token = cls.match(/\bsize-(icon-[\w-]+)\b/)?.[1];
	return ICON_SIZE_TOKENS.indexOf(token as (typeof ICON_SIZE_TOKENS)[number]);
}

describe("buttonVariants root slot", () => {
	test("defaults to the primary md variant", () => {
		const cls = buttonVariants().root();
		expect(cls).toContain("bg-primary");
		expect(cls).toContain("h-button-md");
	});

	test("clips, so a pressed row fades to the edge of its own box", () => {
		expect(buttonVariants().root()).toContain("overflow-hidden");
	});

	test("gives every variant a distinct root treatment", () => {
		const seen = new Set(BUTTON_VARIANTS.map((variant) => buttonVariants({ variant }).root()));
		expect(seen.size).toBe(BUTTON_VARIANTS.length);
	});

	test("maps each variant to its surface", () => {
		expect(buttonVariants({ variant: "primary" }).root()).toContain("bg-primary");
		expect(buttonVariants({ variant: "secondary" }).root()).toContain("bg-secondary");
		expect(buttonVariants({ variant: "tertiary" }).root()).toContain("bg-tertiary");
		expect(buttonVariants({ variant: "destructive" }).root()).toContain("bg-destructive");
		expect(buttonVariants({ variant: "destructive-soft" }).root()).toContain("bg-destructive-soft");
	});

	test("outline draws a border, ghost does not", () => {
		expect(buttonVariants({ variant: "outline" }).root()).toContain("border-border");
		expect(buttonVariants({ variant: "outline" }).root()).toContain("bg-transparent");
		expect(buttonVariants({ variant: "ghost" }).root()).toContain("bg-transparent");
		expect(buttonVariants({ variant: "ghost" }).root()).toContain("border-transparent");
	});

	test("gives every labelled size a distinct height", () => {
		const seen = new Set(BUTTON_LABEL_SIZES.map((size) => heightToken(buttonVariants({ size }).root())));
		expect(seen.size).toBe(BUTTON_LABEL_SIZES.length);
		expect(buttonVariants({ size: "sm" }).root()).toContain("h-button-sm");
		expect(buttonVariants({ size: "md" }).root()).toContain("h-button-md");
		expect(buttonVariants({ size: "lg" }).root()).toContain("h-button-lg");
	});

	test("an icon size swaps horizontal padding for a square width", () => {
		for (const size of BUTTON_ICON_SIZES) {
			const square = buttonVariants({ size }).root();
			expect(square).toMatch(/\bw-button-(sm|md|lg)\b/);
			expect(square).not.toMatch(/\bpx-\d/);
		}
		for (const size of BUTTON_LABEL_SIZES) {
			const labelled = buttonVariants({ size }).root();
			expect(labelled).toMatch(/\bpx-\d/);
			expect(labelled).not.toMatch(/\bw-button-/);
		}
	});

	test("rounds by default, at the corner token paired with its size", () => {
		expect(radiusToken(buttonVariants().root())).toBe("button-md");
		for (const size of BUTTON_LABEL_SIZES) {
			expect(radiusToken(buttonVariants({ size }).root())).toBe(`button-${size}`);
		}
	});

	test("names a corner token the CSS actually declares", () => {
		for (const size of BUTTON_LABEL_SIZES) {
			expect(BUTTON_RADIUS_TOKENS).toContain(`button-${size}`);
		}
	});

	// The corner belongs to the size axis and nothing else, so no variant, and
	// no state, can leave a second `rounded-*` behind for tailwind-merge to
	// pick between.
	test("carries exactly one corner, whatever else is set", () => {
		for (const variant of BUTTON_VARIANTS) {
			for (const size of BUTTON_SIZES) {
				const cls = buttonVariants({ isDisabled: true, isLoading: true, size, variant }).root();
				expect(cls.match(/\brounded-[\w-]+\b/g)).toHaveLength(1);
			}
		}
	});

	test("lets a caller square it off through className", () => {
		expect(radiusToken(buttonVariants().root({ className: "rounded-lg" }))).toBe("lg");
		expect(radiusToken(buttonVariants({ size: "lg" }).root({ className: "rounded-none" }))).toBe("none");
	});

	test("adds the disabled treatment only when disabled", () => {
		expect(buttonVariants({ isDisabled: true }).root()).toContain("opacity-50");
		expect(buttonVariants({ isDisabled: false }).root()).not.toContain("opacity-50");
	});

	test("loading does not dim on its own, and dims only when asked", () => {
		expect(buttonVariants({ isLoading: true }).root()).not.toContain("opacity-50");
		expect(buttonVariants({ isDimmedWhileLoading: true }).root()).not.toContain("opacity-50");
		expect(buttonVariants({ isDimmedWhileLoading: true, isLoading: true }).root()).toContain("opacity-50");
	});

	test("disabled still dims regardless of loading state", () => {
		expect(buttonVariants({ isDisabled: true, isLoading: true }).root()).toContain("opacity-50");
		expect(buttonVariants({ isDimmedWhileLoading: false, isDisabled: true, isLoading: true }).root()).toContain(
			"opacity-50"
		);
	});

	test("neither loading flag touches the root's text colour rule", () => {
		expect(buttonVariants({ isDimmedWhileLoading: true, isLoading: true }).root()).not.toMatch(/\btext-(?!center\b)/);
	});

	test("merges an incoming className last", () => {
		expect(buttonVariants().root({ className: "bg-info" })).toContain("bg-info");
	});
});

describe("resolveButtonLayout", () => {
	test("shows no spinner when not loading, whatever the placement", () => {
		for (const spinnerPlacement of BUTTON_SPINNER_PLACEMENTS) {
			expect(resolveButtonLayout({ spinnerPlacement })).toEqual({ isSpinnerOnly: false, spinnerSide: null });
		}
	});

	test("places the spinner on the side it was asked for", () => {
		expect(resolveButtonLayout({ isLoading: true, spinnerPlacement: "start" }).spinnerSide).toBe("start");
		expect(resolveButtonLayout({ isLoading: true, spinnerPlacement: "end" }).spinnerSide).toBe("end");
	});

	test("defaults to a start-placed spinner", () => {
		expect(resolveButtonLayout({ isLoading: true }).spinnerSide).toBe("start");
	});

	test("only replaces the content and says nothing about the footprint", () => {
		expect(resolveButtonLayout({ isLoading: true, spinnerPlacement: "only" })).toEqual({
			isSpinnerOnly: true,
			spinnerSide: null,
		});
	});

	test("never shows both a side spinner and replaced content", () => {
		for (const spinnerPlacement of BUTTON_SPINNER_PLACEMENTS) {
			const layout = resolveButtonLayout({ isLoading: true, spinnerPlacement });
			expect(layout.isSpinnerOnly && layout.spinnerSide !== null).toBe(false);
		}
	});
});

describe("loading leaves the footprint alone", () => {
	// The bug this guards: a loading button that squared itself would defeat the
	// parent's `alignItems: stretch` and snap a full-width button to a small box
	// flush against the left edge the moment work began.
	test("draws every size exactly as it does when idle", () => {
		for (const size of BUTTON_SIZES) {
			expect(buttonVariants({ isLoading: true, size }).root()).toBe(buttonVariants({ size }).root());
		}
	});

	test("a labelled button keeps its padding and takes no fixed width", () => {
		for (const size of BUTTON_LABEL_SIZES) {
			const cls = buttonVariants({ isLoading: true, size }).root();
			expect(cls).toMatch(/\bpx-\d/);
			expect(cls).not.toMatch(/\bw-button-/);
		}
	});

	test("an icon-sized button keeps its square width", () => {
		for (const size of BUTTON_ICON_SIZES) {
			const cls = buttonVariants({ isLoading: true, size }).root();
			expect(cls).toMatch(/\bw-button-(sm|md|lg)\b/);
			expect(cls).not.toMatch(/\bpx-\d/);
		}
	});

	// `spinnerPlacement` reaches the content and nothing else — there is no path
	// from it to the root's class string, which is what makes the above hold for
	// `only` as well as for a side-placed spinner.
	test("no placement is visible to the root", () => {
		for (const spinnerPlacement of BUTTON_SPINNER_PLACEMENTS) {
			const layout = resolveButtonLayout({ isLoading: true, spinnerPlacement });
			expect(Object.keys(layout).sort()).toEqual(["isSpinnerOnly", "spinnerSide"]);
		}
	});
});

describe("buttonVariants label slot", () => {
	test("carries the text colour, which the root must not", () => {
		for (const variant of BUTTON_VARIANTS) {
			expect(buttonVariants({ variant }).label()).toMatch(/\btext-/);
			expect(buttonVariants({ variant }).root()).not.toMatch(/\btext-(?!center\b)/);
		}
	});

	test("pairs each surface with its own foreground", () => {
		expect(buttonVariants({ variant: "primary" }).label()).toContain("text-primary-foreground");
		expect(buttonVariants({ variant: "secondary" }).label()).toContain("text-secondary-foreground");
		expect(buttonVariants({ variant: "tertiary" }).label()).toContain("text-tertiary-foreground");
		expect(buttonVariants({ variant: "destructive" }).label()).toContain("text-destructive-foreground");
		expect(buttonVariants({ variant: "destructive-soft" }).label()).toContain("text-destructive-soft-foreground");
		expect(buttonVariants({ variant: "outline" }).label()).toContain("text-foreground");
		expect(buttonVariants({ variant: "ghost" }).label()).toContain("text-foreground");
	});

	test("scales label text with size", () => {
		expect(buttonVariants({ size: "sm" }).label()).toContain("text-button-sm");
		expect(buttonVariants({ size: "md" }).label()).toContain("text-button-md");
		expect(buttonVariants({ size: "lg" }).label()).toContain("text-button-lg");
	});

	// A square holds an icon, but `Button.Label` is still styled outside one —
	// and a caller composing text into an icon button gets the paired step
	// rather than the default.
	test("an icon size carries its step's label treatment", () => {
		for (const [square, step] of SQUARE_PAIRS) {
			expect(buttonVariants({ size: square }).label()).toBe(buttonVariants({ size: step }).label());
		}
	});
});

describe("buttonVariants content slots", () => {
	test("centre their subtree", () => {
		expect(buttonVariants().startContent()).toContain("items-center");
		expect(buttonVariants().endContent()).toContain("items-center");
	});

	test("do not vary, so a slot outside a Button is still styled", () => {
		for (const size of BUTTON_SIZES) {
			expect(buttonVariants({ size }).startContent()).toBe(buttonVariants().startContent());
			expect(buttonVariants({ size }).endContent()).toBe(buttonVariants().endContent());
		}
	});

	test("merge an incoming className", () => {
		expect(buttonVariants().startContent({ className: "gap-1" })).toContain("gap-1");
	});
});

describe("resolveSpinnerSwapIndex", () => {
	test("takes the leading icon at the start and the trailing one at the end", () => {
		const icons = [true, false, true];
		expect(resolveSpinnerSwapIndex(icons, "start")).toBe(0);
		expect(resolveSpinnerSwapIndex(icons, "end")).toBe(2);
	});

	// The bug this guards: a button with one leading icon and spinnerPlacement
	// "end" used to swap that icon, drawing the spinner at the start — the
	// opposite of what the caller asked for.
	test("leaves an icon on the other side alone", () => {
		expect(resolveSpinnerSwapIndex([true, false], "end")).toBeNull();
		expect(resolveSpinnerSwapIndex([false, true], "start")).toBeNull();
	});

	// An icon that is not at either edge is not the side's icon either, so the
	// spinner is inserted rather than taking a glyph out of the middle.
	test("ignores an icon boxed in by other children", () => {
		expect(resolveSpinnerSwapIndex([false, true, false], "start")).toBeNull();
		expect(resolveSpinnerSwapIndex([false, true, false], "end")).toBeNull();
	});

	// With nothing to replace the spinner is inserted instead, which is what the
	// button did for every case before the swap existed.
	test("reports nothing to swap when no child is an icon", () => {
		expect(resolveSpinnerSwapIndex([false, false], "start")).toBeNull();
		expect(resolveSpinnerSwapIndex([], "end")).toBeNull();
	});

	test("takes a lone icon for either side when it is the only child", () => {
		expect(resolveSpinnerSwapIndex([true], "start")).toBe(0);
		expect(resolveSpinnerSwapIndex([true], "end")).toBe(0);
	});
});

describe("buttonVariants icon slot", () => {
	test("gives every labelled size a distinct icon token, increasing with it", () => {
		const steps = BUTTON_LABEL_SIZES.map((size) => iconStep(buttonVariants({ size }).icon()));
		expect(steps).not.toContain(-1);
		expect(new Set(steps).size).toBe(BUTTON_LABEL_SIZES.length);
		expect([...steps]).toEqual([...steps].sort((a, b) => a - b));
	});

	// The button indexes the shared icon scale at its own step name, which is
	// what makes a composed Icon and the Spinner that replaces it the same box.
	test("names the icon token matching the button's own size", () => {
		for (const size of BUTTON_LABEL_SIZES) {
			expect(buttonVariants({ size }).icon()).toBe(`size-icon-${size}`);
		}
	});

	// An icon takes a colour value rather than a class — the slot sizes it only.
	test("carries no colour", () => {
		for (const size of BUTTON_SIZES) {
			expect(buttonVariants({ size }).icon()).not.toMatch(/\b(bg|text|border)-/);
		}
	});
});

describe("BUTTON_FOREGROUND_TOKEN", () => {
	test("names a foreground for every variant", () => {
		// Load-bearing for the Spinner's colour as well as the Icon's: a variant
		// missing here would leave a composed spinner untinted.
		for (const variant of BUTTON_VARIANTS) {
			expect(typeof BUTTON_FOREGROUND_TOKEN[variant]).toBe("string");
			expect(BUTTON_FOREGROUND_TOKEN[variant].length).toBeGreaterThan(0);
		}
	});
});

describe("a square size and the step it is built from", () => {
	test("is as wide as it is tall at every size", () => {
		// Both axes name the same button token, so the square cannot drift the
		// way two hand-picked numbers could.
		for (const [square] of SQUARE_PAIRS) {
			const cls = buttonVariants({ size: square }).root();
			const token = heightToken(cls);
			expect(token).toBeDefined();
			expect(widthToken(cls)).toBe(token);
		}
	});

	// The pairing, not the points: a square names its step's height, corner and
	// icon token, so retuning a token in `tokens.css` moves both together and a
	// composed Icon stays the same box as the Spinner that replaces it.
	test("names its step's height, corner and icon token", () => {
		for (const [square, step] of SQUARE_PAIRS) {
			const squareRoot = buttonVariants({ size: square }).root();
			const stepRoot = buttonVariants({ size: step }).root();
			expect(heightToken(squareRoot)).toBe(heightToken(stepRoot));
			expect(radiusToken(squareRoot)).toBe(radiusToken(stepRoot));
			expect(buttonVariants({ size: square }).icon()).toBe(buttonVariants({ size: step }).icon());
		}
	});

	test("covers every icon size, and the two families do not overlap", () => {
		expect(SQUARE_PAIRS.map(([square]) => square)).toEqual([...BUTTON_ICON_SIZES]);
		expect(new Set<string>(BUTTON_SIZES).size).toBe(BUTTON_SIZES.length);
	});
});

/** Every `rounded-*` class a root string carries, in emission order. */
function radiusClasses(cls: string): string[] {
	return cls.match(/\brounded-[\w-]+\b/g) ?? [];
}

describe("a joined member's corner", () => {
	test("replaces the size corner rather than layering a squaring class on it", () => {
		// The layered form would work at runtime — Uniwind arbitrates a className
		// string per style property in token order, and React Native puts a
		// per-corner radius above the uniform one. It is tailwind-merge that makes
		// it a trap: the all-corner group annihilates every side group emitted
		// before it, so a `rounded-button-*` surviving on the size axis would
		// delete the squaring pair the moment `tv` emitted it second.
		for (const size of BUTTON_SIZES) {
			for (const orientation of BUTTON_GROUP_ORIENTATIONS) {
				for (const groupPosition of ["first", "middle", "last"] as const) {
					const cls = buttonVariants({ groupPosition, orientation, size }).root();
					expect(cls).not.toMatch(/\brounded-button-/);
				}
			}
		}
	});

	test("draws the same corner alone as it does as a group of one", () => {
		// A group that renders one button conditionally must not look different
		// from the button on its own.
		for (const size of BUTTON_SIZES) {
			const step = size.replace(/^icon-/, "");
			for (const orientation of BUTTON_GROUP_ORIENTATIONS) {
				expect(radiusClasses(buttonVariants({ groupPosition: "only", orientation, size }).root())).toEqual([
					`rounded-button-${step}`,
				]);
				expect(radiusClasses(buttonVariants({ groupPosition: "none", orientation, size }).root())).toEqual([
					`rounded-button-${step}`,
				]);
			}
		}
	});

	test("squares the pair of corners crossing the seam, at every position", () => {
		// Keyed on the step rather than the size, because a square size draws the
		// same corner as the labelled step it is built from — `icon-md` is `md`'s
		// height, and a corner is half a height.
		const expected: Record<string, Record<string, (step: string) => string[]>> = {
			horizontal: {
				first: (step) => [`rounded-s-button-${step}`, "rounded-e-none"],
				last: (step) => [`rounded-e-button-${step}`, "rounded-s-none"],
				middle: () => ["rounded-none"],
			},
			vertical: {
				first: (step) => [`rounded-t-button-${step}`, "rounded-b-none"],
				last: (step) => [`rounded-b-button-${step}`, "rounded-t-none"],
				middle: () => ["rounded-none"],
			},
		};

		for (const orientation of BUTTON_GROUP_ORIENTATIONS) {
			for (const groupPosition of ["first", "middle", "last"] as const) {
				for (const size of BUTTON_SIZES) {
					const step = size.replace(/^icon-/, "");
					expect(radiusClasses(buttonVariants({ groupPosition, orientation, size }).root())).toEqual(
						expected[orientation][groupPosition](step)
					);
				}
			}
		}
	});

	test("draws the same corner at a square size as at the step it is built from", () => {
		// The pairing the compound cells rest on: a square button is the labelled
		// step with its padding traded for a width, so its corner cannot differ.
		for (const [square, label] of SQUARE_PAIRS) {
			for (const orientation of BUTTON_GROUP_ORIENTATIONS) {
				for (const groupPosition of BUTTON_GROUP_POSITIONS) {
					expect(radiusClasses(buttonVariants({ groupPosition, orientation, size: square }).root())).toEqual(
						radiusClasses(buttonVariants({ groupPosition, orientation, size: label }).root())
					);
				}
			}
		}
	});

	test("never mixes a physical corner with a logical one", () => {
		// React Native resolves a physical corner above a logical one, so a stray
		// `rounded-t-*` on a horizontal member would silently outrank the
		// `rounded-s-*` beside it and round the wrong edge.
		for (const size of BUTTON_SIZES) {
			for (const groupPosition of BUTTON_GROUP_POSITIONS) {
				const horizontal = buttonVariants({ groupPosition, orientation: "horizontal", size }).root();
				expect(horizontal).not.toMatch(/\brounded-[trbl]-/);

				const vertical = buttonVariants({ groupPosition, orientation: "vertical", size }).root();
				expect(vertical).not.toMatch(/\brounded-[se]-/);
			}
		}
	});

	test("names corner tokens the CSS actually declares", () => {
		const named = new Set<string>();
		for (const size of BUTTON_SIZES) {
			for (const orientation of BUTTON_GROUP_ORIENTATIONS) {
				for (const groupPosition of BUTTON_GROUP_POSITIONS) {
					for (const cls of radiusClasses(buttonVariants({ groupPosition, orientation, size }).root())) {
						named.add(cls.replace(/^rounded-(?:[sebtrl]-)?/, ""));
					}
				}
			}
		}

		const tokens = [...named].filter((token) => token !== "none");
		expect(tokens.length).toBeGreaterThan(0);
		expect(tokens.filter((token) => !(BUTTON_RADIUS_TOKENS as readonly string[]).includes(token))).toEqual([]);
	});

	test("still lets a caller square it off through className", () => {
		// The property the whole replacement design exists to keep: an all-corner
		// class from the caller beats the pair, at every position, in one class.
		for (const orientation of BUTTON_GROUP_ORIENTATIONS) {
			for (const groupPosition of BUTTON_GROUP_POSITIONS) {
				const cls = buttonVariants({ groupPosition, orientation }).root({ className: "rounded-lg" });
				expect(radiusClasses(cls)).toEqual(["rounded-lg"]);
			}
		}
	});
});

describe("a joined member's seam", () => {
	test("overlaps the member before it, on the axis the group runs along", () => {
		expect(buttonVariants({ isSeamed: true, orientation: "horizontal" }).root()).toContain("-ms-px");
		expect(buttonVariants({ isSeamed: true, orientation: "vertical" }).root()).toContain("-mt-px");
	});

	test("overlaps on one axis only", () => {
		for (const orientation of BUTTON_GROUP_ORIENTATIONS) {
			const cls = buttonVariants({ isSeamed: true, orientation }).root();
			expect(cls.match(/\B-(?:ms|mt)-px\b/g)).toHaveLength(1);
		}
	});

	test("does not overlap when it is not seamed", () => {
		for (const orientation of BUTTON_GROUP_ORIENTATIONS) {
			for (const groupPosition of BUTTON_GROUP_POSITIONS) {
				const cls = buttonVariants({ groupPosition, isSeamed: false, orientation }).root();
				expect(cls).not.toMatch(/\B-(?:ms|mt)-px\b/);
			}
		}
	});

	test("never drops a border to close the seam", () => {
		// The base reserves `border border-transparent` so switching variant never
		// resizes the box. Dropping a point of border would make a member narrower
		// than its neighbours and shift its centred content half a point.
		for (const orientation of BUTTON_GROUP_ORIENTATIONS) {
			for (const groupPosition of BUTTON_GROUP_POSITIONS) {
				const cls = buttonVariants({ groupPosition, isSeamed: true, orientation }).root();
				expect(cls).not.toMatch(/\bborder-(?:[sebtrl]-)?0\b/);
			}
		}
	});
});

describe("buttonVariants group slot", () => {
	test("runs along the axis it is given", () => {
		expect(buttonVariants({ orientation: "horizontal" }).group()).toContain("flex-row");
		expect(buttonVariants({ orientation: "vertical" }).group()).toContain("flex-col");
	});

	test("runs along one axis only", () => {
		for (const orientation of BUTTON_GROUP_ORIENTATIONS) {
			const cls = buttonVariants({ orientation }).group();
			expect(cls.match(/\bflex-(?:row|col)\b/g)).toHaveLength(1);
		}
	});

	test("holds no gap", () => {
		// A gap is the seam this component exists to close.
		for (const orientation of BUTTON_GROUP_ORIENTATIONS) {
			expect(buttonVariants({ orientation }).group()).not.toMatch(/\bgap-/);
		}
	});

	test("does not clip", () => {
		// A clip would square off the very corners the position compounds just
		// rounded, and would have to restate the group's own corner to avoid it.
		for (const orientation of BUTTON_GROUP_ORIENTATIONS) {
			expect(buttonVariants({ orientation }).group()).not.toContain("overflow-hidden");
		}
	});

	test("paints no disabled state of its own", () => {
		// A disabled group publishes `isDisabled` and each member fades itself. A
		// group fading too would compound down to a quarter opacity.
		for (const orientation of BUTTON_GROUP_ORIENTATIONS) {
			expect(buttonVariants({ isDisabled: true, orientation }).group()).not.toMatch(/\bopacity-/);
		}
	});

	test("keeps a separator from being squeezed away by flexible members", () => {
		expect(buttonVariants().groupSeparator()).toContain("shrink-0");
	});

	test("leaves a separator's thickness to the separator", () => {
		// The line is a `Separator`, which owns its own hairline on its own axis.
		expect(buttonVariants().groupSeparator()).not.toMatch(/\b[wh]-px\b/);
	});
});

describe("BUTTON_GROUP_SEPARATOR_ORIENTATION", () => {
	test("crosses the axis the group runs along", () => {
		// A rule drawn along the run would be invisible — it would sit under the
		// members rather than between them.
		expect(BUTTON_GROUP_SEPARATOR_ORIENTATION.horizontal).toBe("vertical");
		expect(BUTTON_GROUP_SEPARATOR_ORIENTATION.vertical).toBe("horizontal");
	});

	test("names an axis the group itself knows", () => {
		for (const orientation of BUTTON_GROUP_ORIENTATIONS) {
			expect(BUTTON_GROUP_ORIENTATIONS).toContain(BUTTON_GROUP_SEPARATOR_ORIENTATION[orientation]);
		}
	});
});

describe("resolveGroupPositions", () => {
	test("holds no position for an empty group", () => {
		expect(resolveGroupPositions([])).toEqual([]);
	});

	test("calls a lone member `only`", () => {
		expect(resolveGroupPositions([true])).toEqual(["only"]);
	});

	test("gives a pair the two ends and no middle", () => {
		expect(resolveGroupPositions([true, true])).toEqual(["first", "last"]);
	});

	test("fills everything between the ends with middles", () => {
		expect(resolveGroupPositions([true, true, true])).toEqual(["first", "middle", "last"]);
		expect(resolveGroupPositions([true, true, true, true, true])).toEqual([
			"first",
			"middle",
			"middle",
			"middle",
			"last",
		]);
	});

	test("does not let a separator consume a position", () => {
		// A separator is a rule, not a segment, so the buttons either side of one
		// are still the first and the last and keep their rounded outer corners.
		expect(resolveGroupPositions([true, false, true])).toEqual(["first", null, "last"]);
		expect(resolveGroupPositions([true, false, false, true])).toEqual(["first", null, null, "last"]);
	});

	test("ignores a separator at either edge", () => {
		expect(resolveGroupPositions([false, true, false])).toEqual([null, "only", null]);
	});

	test("holds no position for a group of separators", () => {
		expect(resolveGroupPositions([false, false])).toEqual([null, null]);
	});

	test("places exactly as many members as it was given", () => {
		for (const shape of SHAPES) {
			const placed = resolveGroupPositions(shape).filter((position) => position !== null);
			expect(placed).toHaveLength(shape.filter(Boolean).length);
		}
	});

	test("never names both an `only` and an end", () => {
		// The invariant a rounded group rests on: either one member draws both
		// outer corners, or two members draw one each.
		for (const shape of SHAPES) {
			const placed = resolveGroupPositions(shape);
			const only = placed.filter((position) => position === "only").length;
			const first = placed.filter((position) => position === "first").length;
			const last = placed.filter((position) => position === "last").length;

			expect(only).toBeLessThanOrEqual(1);
			expect(first).toBe(last);
			expect(first).toBeLessThanOrEqual(1);
			if (only === 1) expect(first).toBe(0);
		}
	});
});

describe("resolveGroupSeams", () => {
	test("finds no seam in an empty group", () => {
		expect(resolveGroupSeams([])).toEqual([]);
	});

	test("never overlaps the first member", () => {
		// There is nothing behind it to overlap, and pulling it back a point would
		// misalign the group with everything above it.
		expect(resolveGroupSeams([true])).toEqual([false]);
		expect(resolveGroupSeams([true, true, true])).toEqual([false, true, true]);
	});

	test("does not overlap a member that follows a separator", () => {
		// A one-point rule under a one-point overlap is an invisible rule.
		expect(resolveGroupSeams([true, false, true])).toEqual([false, false, false]);
	});

	test("never overlaps a separator itself", () => {
		expect(resolveGroupSeams([true, false, true])[1]).toBe(false);
	});

	test("agrees with resolveGroupPositions about who is a member", () => {
		for (const shape of SHAPES) {
			const positions = resolveGroupPositions(shape);
			const seams = resolveGroupSeams(shape);

			for (const [index, seamed] of seams.entries()) {
				if (seamed) expect(positions[index]).not.toBeNull();
				// An end that draws a rounded outer corner is never pulled back.
				if (positions[index] === "first" || positions[index] === "only") expect(seamed).toBe(false);
			}
		}
	});
});

describe("resolveButtonFeedback", () => {
	test("presses with a scale when it stands alone", () => {
		expect(resolveButtonFeedback(undefined, undefined, false)).toBe("scale");
	});

	test("presses with a fade when it is joined", () => {
		// A scaling member pulls its own edges in while its neighbours hold still,
		// so the seam the group exists to close tears open for the length of the
		// press. A fade moves no geometry.
		expect(resolveButtonFeedback(undefined, undefined, true)).toBe("fade");
	});

	test("lets the group name a treatment for all of its members", () => {
		expect(resolveButtonFeedback(undefined, "scale", true)).toBe("scale");
	});

	test("lets a member outrank its group", () => {
		expect(resolveButtonFeedback("scale-fade", "scale", true)).toBe("scale-fade");
		expect(resolveButtonFeedback("scale", undefined, true)).toBe("scale");
	});

	test("honours an explicit `none` rather than reading it as unset", () => {
		// `none` is a value, not an absence — a `||` ladder here would swallow it.
		expect(resolveButtonFeedback("none", "scale", true)).toBe("none");
		expect(resolveButtonFeedback(undefined, "none", true)).toBe("none");
	});
});

describe("resolveGroupedButtonSize", () => {
	test("keeps its own size when it stands alone", () => {
		for (const size of BUTTON_SIZES) {
			expect(resolveGroupedButtonSize(size, undefined)).toBe(size);
		}
		expect(resolveGroupedButtonSize(undefined, undefined)).toBe("md");
	});

	test("takes the group's step, so members line up", () => {
		// Controls of different heights do not join, so the step is the group's
		// to give and a member cannot argue with it — whichever shape either side
		// happens to name.
		for (const [square, label] of SQUARE_PAIRS) {
			expect(resolveGroupedButtonSize("lg", label)).toBe(label);
			expect(resolveGroupedButtonSize("icon-lg", label)).toBe(square);
			expect(resolveGroupedButtonSize("lg", square)).toBe(label);
			expect(resolveGroupedButtonSize("icon-lg", square)).toBe(square);
		}
	});

	test("keeps its own shape, so a square member stays square", () => {
		// The shape is the member's to keep. Resolving the whole prop to the
		// group's value would make a square member impossible inside a run — the
		// icon button ending a split button would grow a label's padding and lose
		// its width.
		for (const [square, label] of SQUARE_PAIRS) {
			expect(resolveGroupedButtonSize(square, label)).toBe(square);
			expect(resolveGroupedButtonSize(label, square)).toBe(label);
		}
	});

	test("crosses a member's shape with the group's step", () => {
		expect(resolveGroupedButtonSize("icon-lg", "sm")).toBe("icon-sm");
		expect(resolveGroupedButtonSize("lg", "icon-sm")).toBe("sm");
	});

	test("inherits the group's shape when the member names no size", () => {
		expect(resolveGroupedButtonSize(undefined, "icon-lg")).toBe("icon-lg");
		expect(resolveGroupedButtonSize(undefined, "sm")).toBe("sm");
	});

	test("always names a size the variants actually declare", () => {
		for (const own of [...BUTTON_SIZES, undefined]) {
			for (const group of [...BUTTON_SIZES, undefined]) {
				expect(BUTTON_SIZES as readonly string[]).toContain(resolveGroupedButtonSize(own, group));
			}
		}
	});
});
