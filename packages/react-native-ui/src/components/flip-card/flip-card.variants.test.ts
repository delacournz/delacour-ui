import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { SURFACE_PADDINGS, SURFACE_VARIANTS } from "../surface/surface.variants";
import {
	FLIP_CARD_AXES,
	FLIP_CARD_FACES,
	FLIP_CARD_HAPTIC_HYSTERESIS,
	FLIP_CARD_MOTION,
	FLIP_CARD_PRESSED_SCALE,
	FLIP_CARD_RUBBER_BAND,
	FLIP_CARD_TRIGGERS,
	FLIP_CARD_VELOCITY_THRESHOLD,
	faceFromRotation,
	faceRotation,
	flipCardVariants,
	isFlipCardFaceName,
	normalizeRotation,
	oppositeFace,
	resolveFaceA11y,
	resolveFaceOpacity,
	resolveFaceTransform,
	resolveFlipCardActions,
	resolveFlipCardClasses,
	resolveFlipCardTriggerHint,
	resolveFlipFaces,
	resolveFlipTarget,
	resolveRubberBand,
	resolveSwipeVelocity,
	rotationFromDrag,
	shouldTickFlipHaptic,
} from "./flip-card.variants";

/** Every angle from 0 to 720 in steps of 7.3 — enough to land on both sides of every boundary. */
function sweep(): number[] {
	const angles: number[] = [];
	for (let angle = 0; angle <= 720; angle += 7.3) angles.push(angle);
	return angles;
}

describe("tuples", () => {
	test("faces, axes and triggers", () => {
		expect(FLIP_CARD_FACES).toEqual(["front", "back"]);
		expect(FLIP_CARD_AXES).toEqual(["x", "y"]);
		expect(FLIP_CARD_TRIGGERS).toEqual(["press", "swipe", "manual"]);
	});
});

describe("normalizeRotation", () => {
	test.each([
		[0, 0],
		[180, 180],
		[360, 0],
		[-90, 270],
		[540, 180],
		[-360, 0],
	])("%p → %p", (input, expected) => {
		expect(normalizeRotation(input)).toBe(expected);
	});
});

describe("resolveFlipFaces", () => {
	test.each([
		[0, true],
		[89.9, true],
		[90, false],
		[180, false],
		[269.9, false],
		[270, true],
		[360, true],
	])("%p → front visible %p", (rotation, frontVisible) => {
		expect(resolveFlipFaces(rotation)).toEqual({ backVisible: !frontVisible, frontVisible });
	});

	// The failure this rules out is a frame with both faces drawn, or neither.
	test("exactly one face is visible at every angle", () => {
		for (const angle of sweep()) {
			const { frontVisible, backVisible } = resolveFlipFaces(angle);
			expect(frontVisible !== backVisible).toBe(true);
		}
	});
});

describe("faceFromRotation", () => {
	test("the nearer face", () => {
		expect(faceFromRotation(0)).toBe("front");
		expect(faceFromRotation(89)).toBe("front");
		expect(faceFromRotation(90)).toBe("back");
		expect(faceFromRotation(180)).toBe("back");
		expect(faceFromRotation(-10)).toBe("front");
	});

	test("agrees with resolveFlipFaces at every angle", () => {
		for (const angle of sweep()) {
			expect(faceFromRotation(angle) === "front").toBe(resolveFlipFaces(angle).frontVisible);
		}
	});
});

describe("faceRotation / oppositeFace", () => {
	test("front rests at 0, back at 180", () => {
		expect(faceRotation("front")).toBe(0);
		expect(faceRotation("back")).toBe(180);
	});

	test("toggles", () => {
		expect(oppositeFace("front")).toBe("back");
		expect(oppositeFace("back")).toBe("front");
	});
});

describe("resolveFlipTarget", () => {
	test("settles by position without velocity", () => {
		expect(resolveFlipTarget(80, 0)).toBe(0);
		expect(resolveFlipTarget(100, 0)).toBe(180);
	});

	test("a fast flick wins over position", () => {
		expect(resolveFlipTarget(80, 900)).toBe(180);
		expect(resolveFlipTarget(100, -900)).toBe(0);
	});

	test("the threshold is respected on both sides of it", () => {
		const under = FLIP_CARD_VELOCITY_THRESHOLD - 1;
		expect(resolveFlipTarget(20, under)).toBe(0);
		expect(resolveFlipTarget(20, FLIP_CARD_VELOCITY_THRESHOLD)).toBe(180);
		expect(resolveFlipTarget(160, -under)).toBe(180);
		expect(resolveFlipTarget(160, -FLIP_CARD_VELOCITY_THRESHOLD)).toBe(0);
	});

	test("exactly 90 and still stays on the side it started from", () => {
		expect(resolveFlipTarget(90, 0)).toBe(0);
		expect(resolveFlipTarget(90, 0, 0)).toBe(0);
		expect(resolveFlipTarget(90, 0, 180)).toBe(180);
	});

	test("a rubber-banded rotation past an edge settles back to that edge", () => {
		expect(resolveFlipTarget(-20, 0)).toBe(0);
		expect(resolveFlipTarget(200, 0)).toBe(180);
	});
});

describe("resolveSwipeVelocity", () => {
	test("points per second become degrees per second over the half-turn distance", () => {
		expect(resolveSwipeVelocity(1000, 200)).toBe(900);
		expect(resolveSwipeVelocity(-1000, 200)).toBe(-900);
	});

	test("no distance, no velocity", () => {
		expect(resolveSwipeVelocity(1000, 0)).toBe(0);
		expect(resolveSwipeVelocity(1000, -5)).toBe(0);
	});
});

describe("rotationFromDrag", () => {
	test("a half-distance drag is a quarter turn", () => {
		expect(rotationFromDrag(0, 100, 200)).toBe(90);
		expect(rotationFromDrag(180, -100, 200)).toBe(90);
	});

	test("does not clamp — the rubber band does that", () => {
		expect(rotationFromDrag(0, -50, 200)).toBe(-45);
		expect(rotationFromDrag(180, 50, 200)).toBe(225);
	});

	test("a zero or negative distance holds the start", () => {
		expect(rotationFromDrag(0, 100, 0)).toBe(0);
		expect(rotationFromDrag(180, 100, -1)).toBe(180);
	});
});

describe("resolveRubberBand", () => {
	test("inside [0, 180] is unchanged", () => {
		for (const angle of [0, 1, 45, 90, 179.5, 180]) expect(resolveRubberBand(angle)).toBe(angle);
	});

	test("past 0 is damped toward the edge", () => {
		const banded = resolveRubberBand(-30);
		expect(banded).toBeLessThan(0);
		expect(banded).toBeGreaterThan(-30);
	});

	test("symmetric about 180", () => {
		expect(resolveRubberBand(210) - 180).toBeCloseTo(-resolveRubberBand(-30), 10);
	});

	test("monotonic past each edge", () => {
		let previous = 0;
		for (let overshoot = 1; overshoot < 2000; overshoot += 13) {
			const banded = resolveRubberBand(-overshoot);
			expect(banded).toBeLessThan(previous);
			previous = banded;
		}
	});

	test("never travels further than the band beyond the edge", () => {
		for (const overshoot of [10, 100, 1000, 1e6]) {
			expect(resolveRubberBand(-overshoot)).toBeGreaterThan(-FLIP_CARD_RUBBER_BAND);
			expect(resolveRubberBand(180 + overshoot)).toBeLessThan(180 + FLIP_CARD_RUBBER_BAND);
		}
		expect(resolveRubberBand(-1e6, 10)).toBeGreaterThan(-10);
	});
});

describe("shouldTickFlipHaptic", () => {
	test("ticks crossing 90 either way", () => {
		expect(shouldTickFlipHaptic(80, 100)).toBe(true);
		expect(shouldTickFlipHaptic(100, 80)).toBe(true);
		expect(shouldTickFlipHaptic(0, 180)).toBe(true);
		expect(shouldTickFlipHaptic(180, 0)).toBe(true);
	});

	test("does not tick on one side", () => {
		expect(shouldTickFlipHaptic(10, 20)).toBe(false);
		expect(shouldTickFlipHaptic(170, 120)).toBe(false);
	});

	test("does not tick parked on 90", () => {
		expect(shouldTickFlipHaptic(90, 90)).toBe(false);
	});

	// The root stores the side it last ticked on as 0 or 180, so a finger
	// jittering inside the band around 90 never buzzes twice.
	test("a jitter inside the hysteresis band does not tick", () => {
		const inside = FLIP_CARD_HAPTIC_HYSTERESIS - 0.5;
		expect(shouldTickFlipHaptic(0, 90 + inside)).toBe(false);
		expect(shouldTickFlipHaptic(180, 90 - inside)).toBe(false);
		expect(shouldTickFlipHaptic(0, 90 + FLIP_CARD_HAPTIC_HYSTERESIS)).toBe(true);
		expect(shouldTickFlipHaptic(180, 90 - FLIP_CARD_HAPTIC_HYSTERESIS - 0.01)).toBe(true);
	});
});

describe("resolveFaceTransform", () => {
	test("perspective is always first", () => {
		for (const face of FLIP_CARD_FACES) {
			for (const axis of FLIP_CARD_AXES) {
				for (const rotation of [0, 45, 90, 180]) {
					expect(resolveFaceTransform(face, axis, rotation, 1000)[0]).toEqual({ perspective: 1000 });
				}
			}
		}
	});

	test("the front turns by the rotation", () => {
		expect(resolveFaceTransform("front", "y", 0, 800)).toEqual([{ perspective: 800 }, { rotateY: "0deg" }]);
		expect(resolveFaceTransform("front", "y", 45, 800)).toEqual([{ perspective: 800 }, { rotateY: "45deg" }]);
	});

	// The back is pre-rotated half a turn, so at rest on 180 it is flat and reads
	// the right way round rather than mirrored.
	test("the back is pre-rotated half a turn", () => {
		expect(resolveFaceTransform("back", "y", 180, 1000)[1]).toEqual({ rotateY: "0deg" });
		expect(resolveFaceTransform("back", "y", 0, 1000)[1]).toEqual({ rotateY: "-180deg" });
		expect(resolveFaceTransform("back", "y", 90, 1000)[1]).toEqual({ rotateY: "-90deg" });
	});

	test("axis x uses rotateX", () => {
		expect(resolveFaceTransform("front", "x", 30, 1000)).toEqual([{ perspective: 1000 }, { rotateX: "30deg" }]);
		expect(resolveFaceTransform("back", "x", 180, 1000)).toEqual([{ perspective: 1000 }, { rotateX: "0deg" }]);
	});
});

describe("resolveFaceOpacity", () => {
	test("the 90° rule, outside calm motion", () => {
		expect(resolveFaceOpacity("front", 0, false)).toBe(1);
		expect(resolveFaceOpacity("back", 0, false)).toBe(0);
		expect(resolveFaceOpacity("front", 89.9, false)).toBe(1);
		expect(resolveFaceOpacity("front", 90, false)).toBe(0);
		expect(resolveFaceOpacity("back", 90, false)).toBe(1);
		expect(resolveFaceOpacity("back", 180, false)).toBe(1);
	});

	test("the two faces always sum to one, in either mode", () => {
		for (const isCalm of [false, true]) {
			for (const angle of sweep().filter((value) => value <= 180)) {
				expect(resolveFaceOpacity("front", angle, isCalm) + resolveFaceOpacity("back", angle, isCalm)).toBeCloseTo(
					1,
					10
				);
			}
		}
	});

	// Calm motion has no turn to hide behind, so the faces crossfade across the
	// same 0→180 travel instead of swapping at the edge-on frame.
	test("calm motion crossfades linearly", () => {
		expect(resolveFaceOpacity("front", 0, true)).toBe(1);
		expect(resolveFaceOpacity("back", 0, true)).toBe(0);
		expect(resolveFaceOpacity("front", 90, true)).toBe(0.5);
		expect(resolveFaceOpacity("back", 90, true)).toBe(0.5);
		expect(resolveFaceOpacity("front", 180, true)).toBe(0);
		expect(resolveFaceOpacity("back", 180, true)).toBe(1);
	});

	test("calm motion clamps a rotation outside the half turn", () => {
		expect(resolveFaceOpacity("front", -20, true)).toBe(1);
		expect(resolveFaceOpacity("back", 220, true)).toBe(1);
	});
});

describe("resolveFaceA11y", () => {
	test("exactly one face is hidden, and it is not the target", () => {
		for (const face of FLIP_CARD_FACES) {
			const a11y = resolveFaceA11y(face);
			expect(a11y.front.hidden !== a11y.back.hidden).toBe(true);
			expect(a11y[face].hidden).toBe(false);
		}
	});
});

describe("resolveFlipCardActions", () => {
	test("press and swipe expose activate; manual leaves it to a trigger", () => {
		expect(resolveFlipCardActions("press")).toEqual([{ label: "Flip card", name: "activate" }]);
		expect(resolveFlipCardActions("swipe")).toEqual([{ label: "Flip card", name: "activate" }]);
		expect(resolveFlipCardActions("manual")).toEqual([]);
	});

	// A gesture-only card is unreachable to a screen reader. Every trigger with a
	// gesture on the root must offer a non-gesture path beside it.
	test("every gesture trigger has a non-gesture path", () => {
		for (const trigger of FLIP_CARD_TRIGGERS.filter((value) => value !== "manual")) {
			expect(resolveFlipCardActions(trigger).length).toBeGreaterThan(0);
		}
	});
});

describe("FLIP_CARD_MOTION", () => {
	test("snappy is stiffer than default, which is stiffer than gentle", () => {
		expect(FLIP_CARD_MOTION.snappy.stiffness).toBeGreaterThan(FLIP_CARD_MOTION.default.stiffness);
		expect(FLIP_CARD_MOTION.default.stiffness).toBeGreaterThan(FLIP_CARD_MOTION.gentle.stiffness);
	});
});

describe("resolveFlipCardClasses", () => {
	test("the front defaults to the card fill, the back to secondary", () => {
		expect(resolveFlipCardClasses({ face: "front" }).variant).toBe("default");
		expect(resolveFlipCardClasses({ face: "back" }).variant).toBe("secondary");
	});

	test("an explicit variant and padding win", () => {
		const resolved = resolveFlipCardClasses({ face: "back", padding: "lg", variant: "tertiary" });
		expect(resolved.variant).toBe("tertiary");
		expect(resolved.padding).toBe("lg");
	});

	test("padding defaults to md", () => {
		expect(resolveFlipCardClasses({ face: "front" }).padding).toBe("md");
	});

	test("the back fills the footprint the front sets", () => {
		expect(resolveFlipCardClasses({ face: "back" }).wrapper).toContain("absolute");
		expect(resolveFlipCardClasses({ face: "back" }).wrapper).toContain("inset-0");
		expect(resolveFlipCardClasses({ face: "front" }).wrapper).not.toContain("absolute");
	});

	test("no shadow anywhere", () => {
		for (const face of FLIP_CARD_FACES) {
			for (const variant of SURFACE_VARIANTS) {
				for (const padding of SURFACE_PADDINGS) {
					const resolved = resolveFlipCardClasses({ face, padding, variant });
					expect(`${resolved.wrapper} ${resolved.surface}`).not.toMatch(/shadow/);
				}
			}
		}
		expect(flipCardVariants().root()).not.toMatch(/shadow/);
	});

	test("a caller className lands on the surface", () => {
		expect(resolveFlipCardClasses({ className: "items-center", face: "front" }).surface).toContain("items-center");
	});
});

describe("FLIP_CARD_PRESSED_SCALE", () => {
	test("a press dips the card a little, never grows it", () => {
		expect(FLIP_CARD_PRESSED_SCALE).toBeLessThan(1);
		expect(FLIP_CARD_PRESSED_SCALE).toBeGreaterThanOrEqual(0.95);
	});
});

describe("resolveFlipCardTriggerHint", () => {
	test("names the face a press goes to", () => {
		expect(resolveFlipCardTriggerHint("back")).toBe("Shows the back");
		expect(resolveFlipCardTriggerHint("front")).toBe("Shows the front");
	});
});

describe("flipCardVariants trigger slot", () => {
	test("an icon-only trigger is a square button footprint", () => {
		const cls = flipCardVariants({ isIconOnly: true }).trigger();
		expect(cls).toContain("size-button-md");
		expect(cls).toContain("rounded-button-md");
	});

	test("a trigger with children leaves its shape to them", () => {
		expect(flipCardVariants({ isIconOnly: false }).trigger()).not.toContain("size-button-md");
	});

	test("a caller className wins", () => {
		expect(flipCardVariants({ isIconOnly: true }).trigger({ className: "size-button-lg" })).toContain("size-button-lg");
		expect(flipCardVariants({ isIconOnly: true }).trigger({ className: "size-button-lg" })).not.toContain(
			"size-button-md"
		);
	});
});

describe("flipCardVariants container slot", () => {
	test("stacks the card above anything that is not a face", () => {
		expect(flipCardVariants().container()).toContain("gap-");
	});
});

describe("isFlipCardFaceName", () => {
	test("matches the two faces by displayName, which survives a rewritten element type", () => {
		expect(isFlipCardFaceName("DelacourUI.FlipCard.Front")).toBe(true);
		expect(isFlipCardFaceName("DelacourUI.FlipCard.Back")).toBe(true);
	});

	test("anything else renders beneath the card", () => {
		expect(isFlipCardFaceName("DelacourUI.FlipCard.Trigger")).toBe(false);
		expect(isFlipCardFaceName("DelacourUI.Text")).toBe(false);
		expect(isFlipCardFaceName(undefined)).toBe(false);
	});
});

describe("worklet hygiene", () => {
	// The worklets plugin captures identifiers a worklet's body reads, not those in its
	// parameter defaults — `max = FLIP_CARD_RUBBER_BAND` threw "Property doesn't exist"
	// on the UI thread the first time a swipe card was dragged.
	test("no worklet reads a module binding from a parameter default", () => {
		const source = readFileSync(join(import.meta.dirname, "flip-card.variants.ts"), "utf8");
		const offenders = [...source.matchAll(/export function (\w+)\(([^)]*)\)[^{]*\{\s*"worklet";/g)]
			.filter(([, , params]) => /=\s*[A-Za-z_]/.test(params ?? ""))
			.map(([, name]) => name);
		expect(offenders).toEqual([]);
	});
});
