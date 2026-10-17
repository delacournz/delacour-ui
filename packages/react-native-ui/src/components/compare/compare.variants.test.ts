import { describe, expect, test } from "bun:test";
import { declarationCount } from "../../styles/theme-tokens.test";
import { ICON_SIZES } from "../icon/icon.variants";
import {
	COMPARE_ANYWHERE_ACTIVE_OFFSET,
	COMPARE_ANYWHERE_FAIL_OFFSET,
	COMPARE_COLORS,
	COMPARE_DEFAULT_COLOR,
	COMPARE_DEFAULT_GRAB,
	COMPARE_DEFAULT_ORIENTATION,
	COMPARE_DEFAULT_POSITION,
	COMPARE_DEFAULT_SIZE,
	COMPARE_GRAB_SCALE,
	COMPARE_GRIP_ICON_SIZE,
	COMPARE_HANDLE_BAND,
	COMPARE_HANDLE_SPRING,
	COMPARE_HAPTIC_DEAD_BAND,
	COMPARE_LABEL_FADE,
	COMPARE_ORIENTATIONS,
	COMPARE_SIZES,
	COMPARE_SNAP_THRESHOLD,
	COMPARE_STEP,
	clampPosition,
	compareVariants,
	isWithinGrabBand,
	quantizePosition,
	resolveCompareHandleClasses,
	resolveCompareLabelClass,
	resolveCompareLabelOpacity,
	resolveCompareValueText,
	resolveCoveredLayer,
	resolvePositionFromGesture,
	resolveReleaseVelocity,
	resolveRevealTransforms,
	shouldTickCompareHaptic,
	snapPosition,
	stepPosition,
} from "./compare.variants";

/** A slot's class string, with `tv`'s empty-slot `undefined` flattened. */
function cls(value: string | undefined): string {
	return value ?? "";
}

/** The bare colour a `bg-*` class names — `bg-success` yields `success`. */
function backgroundToken(value: string): string | undefined {
	return value.match(/\bbg-([\w-]+)\b/)?.[1];
}

/** The `w-*` / `h-*` step a class string sets — `w-5` yields 5. */
function step(value: string, axis: "w" | "h"): number {
	return Number(value.match(new RegExp(`\\b${axis}-(\\d+(?:\\.\\d+)?)\\b`))?.[1]);
}

/** The `px-*` / `py-*` step a class string sets — `px-3` yields 3. */
function paddingStep(value: string, axis: "x" | "y"): number {
	return Number(value.match(new RegExp(`\\bp${axis}-(\\d+(?:\\.\\d+)?)\\b`))?.[1]);
}

/** Tailwind's spacing scale is quarter-rem steps, so a step is four points. */
const POINTS_PER_STEP = 4;

/** Floating-point equality to a tolerance well below anything a screen can draw. */
function near(actual: number, expected: number): void {
	expect(Math.abs(actual - expected)).toBeLessThan(1e-9);
}

describe("the theme reader", () => {
	// Every token assertion below is worthless if the parse silently found nothing.
	test("finds both variants of the theme", () => {
		expect(declarationCount("primary")).toBe(2);
	});
});

describe("the axes", () => {
	test("name Slider's six colours, three sizes and two orientations", () => {
		expect([...COMPARE_COLORS]).toEqual(["default", "primary", "success", "warning", "destructive", "info"]);
		expect([...COMPARE_SIZES]).toEqual(["sm", "md", "lg"]);
		expect([...COMPARE_ORIENTATIONS]).toEqual(["horizontal", "vertical"]);
	});

	test("default to the middle of a horizontal frame, grabbed by the handle", () => {
		expect(COMPARE_DEFAULT_POSITION).toBe(0.5);
		expect(COMPARE_DEFAULT_ORIENTATION).toBe("horizontal");
		expect(COMPARE_DEFAULT_COLOR).toBe("default");
		expect(COMPARE_DEFAULT_SIZE).toBe("md");
		expect(COMPARE_DEFAULT_GRAB).toBe("handle");
		expect(COMPARE_SNAP_THRESHOLD).toBe(0.04);
		expect(COMPARE_STEP).toBe(0.1);
	});

	test("give every size a grip glyph on the icon scale", () => {
		for (const size of COMPARE_SIZES) {
			expect(ICON_SIZES).toContain(COMPARE_GRIP_ICON_SIZE[size]);
		}
	});
});

describe("clampPosition", () => {
	test("passes a position inside the frame through", () => {
		expect(clampPosition(0.5)).toBe(0.5);
	});

	test("clamps to the frame", () => {
		expect(clampPosition(-1)).toBe(0);
		expect(clampPosition(2)).toBe(1);
	});

	test("never propagates NaN", () => {
		expect(clampPosition(Number.NaN)).toBe(0);
		expect(clampPosition(Number.NaN, 0.2, 0.8)).toBe(0.2);
	});

	test("clamps to caller bounds", () => {
		expect(clampPosition(0.9, 0.2, 0.8)).toBe(0.8);
		expect(clampPosition(0.1, 0.2, 0.8)).toBe(0.2);
	});
});

describe("resolvePositionFromGesture", () => {
	test("reads a horizontal touch from the left", () => {
		expect(resolvePositionFromGesture({ along: 150, size: 300, orientation: "horizontal", isRtl: false })).toBe(0.5);
		expect(resolvePositionFromGesture({ along: 75, size: 300, orientation: "horizontal", isRtl: false })).toBe(0.25);
	});

	test("reads a vertical touch from the top", () => {
		expect(resolvePositionFromGesture({ along: 50, size: 200, orientation: "vertical", isRtl: false })).toBe(0.25);
	});

	test("mirrors a horizontal touch under RTL, and leaves a vertical one alone", () => {
		expect(resolvePositionFromGesture({ along: 75, size: 300, orientation: "horizontal", isRtl: true })).toBe(0.75);
		expect(resolvePositionFromGesture({ along: 50, size: 200, orientation: "vertical", isRtl: true })).toBe(0.25);
	});

	test("guards an unmeasured frame", () => {
		expect(resolvePositionFromGesture({ along: 50, size: 0, orientation: "horizontal", isRtl: false })).toBe(0);
		expect(resolvePositionFromGesture({ along: 50, size: -10, orientation: "vertical", isRtl: false })).toBe(0);
	});

	test("clamps a touch dragged off the frame", () => {
		expect(resolvePositionFromGesture({ along: -40, size: 300, orientation: "horizontal", isRtl: false })).toBe(0);
		expect(resolvePositionFromGesture({ along: 400, size: 300, orientation: "horizontal", isRtl: false })).toBe(1);
	});

	// One rule, two axes: the vertical branch must not drift into a second,
	// hand-written reading of the touch.
	test("is the same rule on both axes", () => {
		for (const fraction of [0, 0.1, 0.33, 0.5, 0.9, 1]) {
			const size = 240;
			const horizontal = resolvePositionFromGesture({
				along: fraction * size,
				size,
				orientation: "horizontal",
				isRtl: false,
			});
			const vertical = resolvePositionFromGesture({
				along: fraction * size,
				size,
				orientation: "vertical",
				isRtl: false,
			});
			expect(vertical).toBe(horizontal);
		}
	});
});

describe("snapPosition", () => {
	test("lands on a point inside the threshold", () => {
		expect(snapPosition(0.52, [0.5], 0.04)).toBe(0.5);
	});

	test("leaves a position outside the threshold alone", () => {
		expect(snapPosition(0.56, [0.5], 0.04)).toBe(0.56);
	});

	test("does nothing without points", () => {
		expect(snapPosition(0.52, [], 0.04)).toBe(0.52);
	});

	test("includes the threshold's edge", () => {
		expect(snapPosition(0.54, [0.5], 0.04)).toBe(0.5);
	});

	test("picks the nearer point, then the lower on a tie", () => {
		expect(snapPosition(0.52, [0.5, 0.55], 0.04)).toBe(0.5);
		expect(snapPosition(0.54, [0.5, 0.55], 0.04)).toBe(0.55);
		expect(snapPosition(0.375, [0.5, 0.25], 0.125)).toBe(0.25);
	});
});

describe("stepPosition", () => {
	const bounds = { min: 0, max: 1 };

	test("moves by one step", () => {
		expect(stepPosition(0.5, 1, 0.1, bounds)).toBe(0.6);
		expect(stepPosition(0.5, -1, 0.1, bounds)).toBe(0.4);
	});

	test("lands exactly on a bound", () => {
		expect(stepPosition(0.95, 1, 0.1, bounds)).toBe(1);
		expect(stepPosition(0.04, -1, 0.1, bounds)).toBe(0);
	});

	test("does not drift: ten steps of a tenth from 0 reach exactly 1", () => {
		let position = 0;
		for (let index = 0; index < 10; index++) position = stepPosition(position, 1, 0.1, bounds);
		expect(position).toBe(1);
	});

	test("respects caller bounds", () => {
		expect(stepPosition(0.75, 1, 0.1, { min: 0.2, max: 0.8 })).toBe(0.8);
	});
});

describe("resolveRevealTransforms", () => {
	const size = 300;

	test("keeps the mask and its content in register at every position", () => {
		for (const position of [0, 0.1, 0.25, 0.5, 0.75, 1]) {
			for (const orientation of COMPARE_ORIENTATIONS) {
				for (const isRtl of [false, true]) {
					const { maskOffset, innerOffset } = resolveRevealTransforms(position, size, orientation, isRtl);
					near(maskOffset + innerOffset, 0);
				}
			}
		}
	});

	test("moves nothing at position 1, where Before covers the frame", () => {
		const { maskOffset, innerOffset, handleOffset } = resolveRevealTransforms(1, size, "horizontal", false);
		near(maskOffset, 0);
		near(innerOffset, 0);
		expect(handleOffset).toBe(size);
	});

	test("slides the mask a whole frame off at position 0", () => {
		const { maskOffset, handleOffset } = resolveRevealTransforms(0, size, "horizontal", false);
		expect(maskOffset).toBe(-size);
		expect(handleOffset).toBe(0);
	});

	test("puts the seam at the position's share of the frame", () => {
		expect(resolveRevealTransforms(0.25, size, "horizontal", false)).toEqual({
			maskOffset: -225,
			innerOffset: 225,
			handleOffset: 75,
		});
	});

	test("uses the same numbers on the vertical axis", () => {
		expect(resolveRevealTransforms(0.25, size, "vertical", false)).toEqual(
			resolveRevealTransforms(0.25, size, "horizontal", false)
		);
	});

	test("negates the horizontal offsets under RTL, and measures the seam from the right", () => {
		const ltr = resolveRevealTransforms(0.25, size, "horizontal", false);
		const rtl = resolveRevealTransforms(0.25, size, "horizontal", true);
		expect(rtl.maskOffset).toBe(-ltr.maskOffset);
		expect(rtl.innerOffset).toBe(-ltr.innerOffset);
		expect(rtl.handleOffset).toBe(size - ltr.handleOffset);
	});

	test("ignores RTL on the vertical axis", () => {
		expect(resolveRevealTransforms(0.25, size, "vertical", true)).toEqual(
			resolveRevealTransforms(0.25, size, "vertical", false)
		);
	});

	test("draws nothing out of place before the frame is measured", () => {
		expect(resolveRevealTransforms(0.5, 0, "horizontal", false)).toEqual({
			maskOffset: 0,
			innerOffset: 0,
			handleOffset: 0,
		});
	});
});

describe("isWithinGrabBand", () => {
	test("accepts a touch on the band", () => {
		expect(isWithinGrabBand(100, 110, 44)).toBe(true);
	});

	test("rejects a touch beside it", () => {
		expect(isWithinGrabBand(100, 140, 44)).toBe(false);
	});

	test("includes the band's edge", () => {
		expect(isWithinGrabBand(100, 122, 44)).toBe(true);
		expect(isWithinGrabBand(100, 78, 44)).toBe(true);
		expect(isWithinGrabBand(100, 122.01, 44)).toBe(false);
	});
});

describe("shouldTickCompareHaptic", () => {
	test("ticks crossing a snap point", () => {
		expect(shouldTickCompareHaptic(0.45, 0.55, [0.5], 0, 1)).toBe(true);
	});

	test("ticks crossing back the other way", () => {
		expect(shouldTickCompareHaptic(0.55, 0.45, [0.5], 0, 1)).toBe(true);
	});

	test("stays quiet between points", () => {
		expect(shouldTickCompareHaptic(0.31, 0.32, [0.5], 0, 1)).toBe(false);
		expect(shouldTickCompareHaptic(0.31, 0.32, [], 0, 1)).toBe(false);
	});

	test("ticks once on arriving at a point slowly, not on every frame inside it", () => {
		const half = COMPARE_HAPTIC_DEAD_BAND / 2;
		expect(shouldTickCompareHaptic(0.5 - half * 3, 0.5 - half / 2, [0.5], 0, 1)).toBe(true);
		expect(shouldTickCompareHaptic(0.5 - half / 2, 0.5 + half / 2, [0.5], 0, 1)).toBe(false);
		expect(shouldTickCompareHaptic(0.5 + half / 2, 0.5 + half * 3, [0.5], 0, 1)).toBe(false);
	});

	test("ticks on reaching either bound, and not on leaving it", () => {
		expect(shouldTickCompareHaptic(0.97, 1, [], 0, 1)).toBe(true);
		expect(shouldTickCompareHaptic(0.03, 0, [], 0, 1)).toBe(true);
		expect(shouldTickCompareHaptic(1, 0.98, [], 0, 1)).toBe(false);
		expect(shouldTickCompareHaptic(1, 1, [], 0, 1)).toBe(false);
	});

	test("treats caller bounds as the ends", () => {
		expect(shouldTickCompareHaptic(0.75, 0.8, [], 0.2, 0.8)).toBe(true);
	});
});

describe("resolveCompareValueText", () => {
	test("reads the Before layer's share", () => {
		expect(resolveCompareValueText(0.5)).toBe("50 percent before");
		expect(resolveCompareValueText(0.254)).toBe("25 percent before");
	});

	test("names a lone layer outright", () => {
		expect(resolveCompareValueText(0)).toBe("Showing only after");
		expect(resolveCompareValueText(1)).toBe("Showing only before");
	});

	test("substitutes the caller's names", () => {
		expect(resolveCompareValueText(0.5, { before: "Original" })).toBe("50 percent Original");
		expect(resolveCompareValueText(0, { before: "Original", after: "Edited" })).toBe("Showing only Edited");
	});
});

describe("resolveCoveredLayer", () => {
	test("names the layer with nothing showing", () => {
		expect(resolveCoveredLayer(0)).toBe("before");
		expect(resolveCoveredLayer(1)).toBe("after");
		expect(resolveCoveredLayer(0.5)).toBeNull();
	});
});

describe("quantizePosition", () => {
	test("rounds to the percent React is told about", () => {
		expect(quantizePosition(0.123456)).toBe(0.12);
		expect(quantizePosition(0.125)).toBe(0.13);
		expect(quantizePosition(1)).toBe(1);
	});
});

describe("resolveCompareLabelOpacity", () => {
	test("shows a side's label while that side is uncovered", () => {
		expect(resolveCompareLabelOpacity("before", 0.5)).toBe(1);
		expect(resolveCompareLabelOpacity("after", 0.5)).toBe(1);
	});

	test("fades a label out as its side is covered", () => {
		expect(resolveCompareLabelOpacity("before", 0)).toBe(0);
		expect(resolveCompareLabelOpacity("after", 1)).toBe(0);
		near(resolveCompareLabelOpacity("before", COMPARE_LABEL_FADE / 2), 0.5);
		near(resolveCompareLabelOpacity("after", 1 - COMPARE_LABEL_FADE / 2), 0.5);
	});
});

describe("resolveCompareLabelClass", () => {
	test("pins Before to the leading edge and After to the trailing one", () => {
		expect(
			resolveCompareLabelClass({ side: "before", placement: "start", orientation: "horizontal", isRtl: false })
		).toBe("left-3 top-3");
		expect(resolveCompareLabelClass({ side: "after", placement: "end", orientation: "horizontal", isRtl: false })).toBe(
			"right-3 bottom-3"
		);
		expect(
			resolveCompareLabelClass({ side: "before", placement: "start", orientation: "vertical", isRtl: false })
		).toBe("top-3 left-3");
		expect(resolveCompareLabelClass({ side: "after", placement: "end", orientation: "vertical", isRtl: false })).toBe(
			"bottom-3 right-3"
		);
	});

	test("mirrors the horizontal edges under RTL", () => {
		expect(
			resolveCompareLabelClass({ side: "before", placement: "start", orientation: "horizontal", isRtl: true })
		).toBe("right-3 top-3");
		expect(resolveCompareLabelClass({ side: "before", placement: "start", orientation: "vertical", isRtl: true })).toBe(
			"top-3 right-3"
		);
	});
});

describe("the handle", () => {
	// The capsule's short side plus the band's padding is one number, and it has
	// to clear 44pt at every size — split across two variants, a retune of the
	// capsule silently shrinks the target.
	test("brings every size up to the 44pt band, capsule plus padding", () => {
		expect(COMPARE_HANDLE_BAND).toBe(44);
		for (const size of COMPARE_SIZES) {
			const horizontal = resolveCompareHandleClasses({ color: "default", size, orientation: "horizontal" });
			expect((step(horizontal.capsule, "w") + 2 * paddingStep(horizontal.handle, "x")) * POINTS_PER_STEP).toBe(
				COMPARE_HANDLE_BAND
			);
			const vertical = resolveCompareHandleClasses({ color: "default", size, orientation: "vertical" });
			expect((step(vertical.capsule, "h") + 2 * paddingStep(vertical.handle, "y")) * POINTS_PER_STEP).toBe(
				COMPARE_HANDLE_BAND
			);
		}
	});

	test("sizes the capsule 28 / 36 / 44 along the cross axis", () => {
		const expected = { sm: 28, md: 36, lg: 44 } as const;
		for (const size of COMPARE_SIZES) {
			const horizontal = resolveCompareHandleClasses({ color: "default", size, orientation: "horizontal" });
			const vertical = resolveCompareHandleClasses({ color: "default", size, orientation: "vertical" });
			expect(step(horizontal.capsule, "h") * POINTS_PER_STEP).toBe(expected[size]);
			expect(step(vertical.capsule, "w") * POINTS_PER_STEP).toBe(expected[size]);
		}
	});

	test("paints the capsule and the divider in one token, and the glyph in its foreground", () => {
		for (const color of COMPARE_COLORS) {
			const classes = resolveCompareHandleClasses({ color, size: "md", orientation: "horizontal" });
			const token = backgroundToken(classes.capsule);
			expect(token).toBeDefined();
			expect(backgroundToken(classes.divider)).toBe(token);
			expect(classes.glyphColor).toBe(token === "foreground" ? "background" : `${token}-foreground`);
			expect(declarationCount(token as string)).toBe(2);
			expect(declarationCount(classes.glyphColor)).toBe(2);
		}
	});

	test("keeps the four semantic colours distinct from each other and the neutrals", () => {
		const tokens = (["success", "warning", "destructive", "info"] as const).map((color) =>
			backgroundToken(resolveCompareHandleClasses({ color, size: "md", orientation: "horizontal" }).capsule)
		);
		expect(new Set(tokens).size).toBe(4);
		expect(tokens).not.toContain("foreground");
		expect(tokens).not.toContain("primary");
	});

	// A 2pt rule in the capsule's colour vanishes against imagery of the same
	// colour, so a background hairline either side has to be there at every colour.
	test("edges the divider with a background hairline at every colour and orientation", () => {
		for (const color of COMPARE_COLORS) {
			const horizontal = resolveCompareHandleClasses({ color, size: "md", orientation: "horizontal" });
			expect(horizontal.divider).toMatch(/\bborder-x\b/);
			expect(horizontal.divider).toMatch(/\bborder-background\b/);
			expect(horizontal.divider).toMatch(/\bw-1\b/);
			const vertical = resolveCompareHandleClasses({ color, size: "md", orientation: "vertical" });
			expect(vertical.divider).toMatch(/\bborder-y\b/);
			expect(vertical.divider).toMatch(/\bborder-background\b/);
			expect(vertical.divider).toMatch(/\bh-1\b/);
		}
	});

	test("draws no shadow anywhere", () => {
		const axes = COMPARE_COLORS.flatMap((color) =>
			COMPARE_SIZES.flatMap((size) =>
				COMPARE_ORIENTATIONS.flatMap((orientation) =>
					[false, true].map((isDisabled) => compareVariants({ color, size, orientation, isDisabled }))
				)
			)
		);
		for (const slots of axes) {
			const classes = [
				slots.root(),
				slots.layer(),
				slots.mask(),
				slots.inner(),
				slots.handle(),
				slots.divider(),
				slots.capsule(),
				slots.label(),
			];
			for (const slot of classes) {
				expect(cls(slot)).not.toMatch(/\b(shadow|elevation)-/);
			}
		}
	});

	test("fades when disabled", () => {
		expect(cls(compareVariants({ isDisabled: true }).handle())).toMatch(/\bopacity-50\b/);
		expect(cls(compareVariants({ isDisabled: false }).handle())).not.toMatch(/\bopacity-/);
	});
});

describe("the frame", () => {
	test("clips to Surface's corner step and has no intrinsic size", () => {
		const root = cls(compareVariants({}).root());
		expect(root).toMatch(/\boverflow-hidden\b/);
		expect(root).toMatch(/\brounded-lg\b/);
		expect(root).not.toMatch(/\b(h|aspect)-/);
	});

	test("lets a caller's class win", () => {
		expect(cls(compareVariants({}).root({ className: "rounded-none" }))).not.toMatch(/\brounded-lg\b/);
	});

	test("stacks After under Before under the handle, whatever order the children come in", () => {
		const slots = compareVariants({});
		expect(cls(slots.layer())).toMatch(/\babsolute\b/);
		expect(cls(slots.mask())).toMatch(/\boverflow-hidden\b/);
		const z = (value: string) => Number(value.match(/\bz-(\d+)\b/)?.[1]);
		expect(z(cls(slots.layer()))).toBeLessThan(z(cls(slots.mask())));
		expect(z(cls(slots.mask()))).toBeLessThan(z(cls(slots.handle())));
		expect(z(cls(slots.handle()))).toBeLessThan(z(cls(slots.label())));
	});
});

describe("motion", () => {
	test("grows the grabbed capsule a little, from rest", () => {
		expect(COMPARE_GRAB_SCALE).toEqual({ rest: 1, grabbed: 1.08 });
	});

	test("releases on the spec's spring", () => {
		expect(COMPARE_HANDLE_SPRING).toEqual({ damping: 20, stiffness: 220, mass: 0.6 });
	});

	test("lets a scroll win on the cross axis before the seam does", () => {
		expect(COMPARE_ANYWHERE_ACTIVE_OFFSET).toBeLessThan(COMPARE_ANYWHERE_FAIL_OFFSET);
	});
});

describe("resolveReleaseVelocity", () => {
	test("converts points per second to positions per second along the axis", () => {
		expect(resolveReleaseVelocity(600, 300, "horizontal", false)).toBe(2);
		expect(resolveReleaseVelocity(-150, 300, "vertical", false)).toBe(-0.5);
	});

	test("negates a horizontal fling under RTL, where Before grows leftward", () => {
		expect(resolveReleaseVelocity(600, 300, "horizontal", true)).toBe(-2);
		expect(resolveReleaseVelocity(600, 300, "vertical", true)).toBe(2);
	});

	test("an unmeasured frame or a non-finite fling releases at rest", () => {
		expect(resolveReleaseVelocity(600, 0, "horizontal", false)).toBe(0);
		expect(resolveReleaseVelocity(Number.NaN, 300, "horizontal", false)).toBe(0);
	});
});
