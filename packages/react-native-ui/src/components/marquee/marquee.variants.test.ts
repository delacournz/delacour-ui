import { describe, expect, test } from "bun:test";
import {
	advanceMarqueeOffset,
	clampFrameDelta,
	MARQUEE_DEFAULT_FADE_SIZE,
	MARQUEE_DEFAULT_SPEED,
	MARQUEE_DIRECTIONS,
	MARQUEE_GAPS,
	MARQUEE_MAX_COPIES,
	MARQUEE_MAX_FRAME_MS,
	marqueeVariants,
	resolveMarqueeAxis,
	resolveMarqueeCopies,
	resolveMarqueeDuration,
	resolveMarqueeFade,
	resolveMarqueeHeld,
	resolveMarqueePause,
	resolveMarqueeSign,
	resolveMarqueeSpeed,
	resolveMarqueeTranslation,
	resolveMarqueeVelocity,
} from "./marquee.variants";

describe("resolveMarqueeAxis", () => {
	test("left and right travel horizontally, up and down vertically", () => {
		expect(resolveMarqueeAxis("left")).toBe("horizontal");
		expect(resolveMarqueeAxis("right")).toBe("horizontal");
		expect(resolveMarqueeAxis("up")).toBe("vertical");
		expect(resolveMarqueeAxis("down")).toBe("vertical");
	});
});

describe("resolveMarqueeSign", () => {
	test("left and up translate negatively, right and down positively", () => {
		expect(resolveMarqueeSign("left")).toBe(-1);
		expect(resolveMarqueeSign("up")).toBe(-1);
		expect(resolveMarqueeSign("right")).toBe(1);
		expect(resolveMarqueeSign("down")).toBe(1);
	});
});

describe("resolveMarqueeVelocity", () => {
	test("signs the speed by the direction", () => {
		expect(resolveMarqueeVelocity("left", 40)).toBe(-40);
		expect(resolveMarqueeVelocity("up", 40)).toBe(-40);
		expect(resolveMarqueeVelocity("right", 40)).toBe(40);
		expect(resolveMarqueeVelocity("down", 40)).toBe(40);
	});

	test("a speed of zero or less holds still rather than reversing", () => {
		for (const direction of MARQUEE_DIRECTIONS) {
			expect(resolveMarqueeVelocity(direction, 0)).toBe(0);
			expect(resolveMarqueeVelocity(direction, -20)).toBe(0);
		}
	});

	test("a non-finite speed holds still", () => {
		expect(resolveMarqueeVelocity("left", Number.NaN)).toBe(0);
		expect(resolveMarqueeVelocity("left", Number.POSITIVE_INFINITY)).toBe(0);
	});
});

describe("resolveMarqueeDuration", () => {
	test("is one period at the speed, in ms", () => {
		expect(resolveMarqueeDuration(400, 40)).toBe(10000);
	});

	test("never ends at speed zero", () => {
		expect(resolveMarqueeDuration(400, 0)).toBe(Number.POSITIVE_INFINITY);
	});

	test("an unmeasured period takes no time", () => {
		expect(resolveMarqueeDuration(0, 40)).toBe(0);
	});
});

describe("resolveMarqueeCopies", () => {
	test("fills the container plus one period", () => {
		expect(resolveMarqueeCopies(390, 120)).toBe(5);
	});

	test("never fewer than two once measured", () => {
		expect(resolveMarqueeCopies(390, 500)).toBe(2);
	});

	test("one copy while unmeasured", () => {
		expect(resolveMarqueeCopies(390, 0)).toBe(1);
		expect(resolveMarqueeCopies(390, -1)).toBe(1);
	});

	test("caps a tiny period", () => {
		expect(resolveMarqueeCopies(390, 0.5)).toBe(MARQUEE_MAX_COPIES);
		expect(MARQUEE_MAX_COPIES).toBe(12);
	});

	test("an unmeasured container still gets two once the period is known", () => {
		expect(resolveMarqueeCopies(0, 120)).toBe(2);
	});
});

describe("advanceMarqueeOffset", () => {
	test("wraps past the period", () => {
		expect(advanceMarqueeOffset(390, 1000, 40, 400)).toBe(30);
	});

	test("negative velocity wraps from zero to the far end", () => {
		expect(advanceMarqueeOffset(0, 250, -40, 400)).toBe(390);
	});

	test("dt of zero is the identity", () => {
		expect(advanceMarqueeOffset(123, 0, 40, 400)).toBe(123);
	});

	test("a period of zero returns zero, never NaN", () => {
		expect(advanceMarqueeOffset(10, 16, 40, 0)).toBe(0);
	});

	test("stays inside [0, period) whatever it is handed", () => {
		for (const offset of [-1000, -1, 0, 1, 399.9, 400, 1000]) {
			const next = advanceMarqueeOffset(offset, 16, -120, 400);
			expect(next).toBeGreaterThanOrEqual(0);
			expect(next).toBeLessThan(400);
		}
	});
});

describe("resolveMarqueeTranslation", () => {
	test("the picture at one period equals the picture at zero, for every direction", () => {
		for (const direction of MARQUEE_DIRECTIONS) {
			expect(resolveMarqueeTranslation(400, 400, direction)).toBe(resolveMarqueeTranslation(0, 400, direction));
		}
	});

	test("always sits within one period behind the leading edge", () => {
		for (const direction of MARQUEE_DIRECTIONS) {
			for (const offset of [0, 1, 100, 399, 400, 401, -1]) {
				const translation = resolveMarqueeTranslation(offset, 400, direction);
				expect(translation).toBeLessThanOrEqual(0);
				expect(translation).toBeGreaterThanOrEqual(-400);
			}
		}
	});

	test("left moves toward negative as the strip runs at negative velocity", () => {
		const start = resolveMarqueeTranslation(0, 400, "left");
		const next = resolveMarqueeTranslation(advanceMarqueeOffset(0, 100, -40, 400), 400, "left");
		expect(start).toBe(0);
		expect(next).toBeCloseTo(-4);
	});

	test("right moves toward positive as the strip runs at positive velocity", () => {
		const start = resolveMarqueeTranslation(0, 400, "right");
		const next = resolveMarqueeTranslation(advanceMarqueeOffset(0, 100, 40, 400), 400, "right");
		expect(start).toBe(-400);
		expect(next).toBeCloseTo(-396);
	});

	test("an unmeasured period translates nowhere", () => {
		for (const direction of MARQUEE_DIRECTIONS) {
			expect(resolveMarqueeTranslation(10, 0, direction)).toBe(0);
		}
	});
});

describe("clampFrameDelta", () => {
	test("caps a long frame so a backgrounded app does not teleport the strip", () => {
		expect(clampFrameDelta(5000)).toBe(64);
		expect(MARQUEE_MAX_FRAME_MS).toBe(64);
	});

	test("passes an ordinary frame through", () => {
		expect(clampFrameDelta(16.7)).toBe(16.7);
	});

	test("never runs backwards or on NaN", () => {
		expect(clampFrameDelta(-5)).toBe(0);
		expect(clampFrameDelta(Number.NaN)).toBe(0);
	});
});

describe("resolveMarqueeFade", () => {
	test("none draws nothing", () => {
		expect(resolveMarqueeFade({ kind: "none" })).toBeNull();
	});

	test("edges default to 24pt into the background", () => {
		expect(resolveMarqueeFade({ kind: "edges" })).toEqual({ color: "background", size: MARQUEE_DEFAULT_FADE_SIZE });
		expect(MARQUEE_DEFAULT_FADE_SIZE).toBe(24);
	});

	test("edges keep a given size and colour", () => {
		expect(resolveMarqueeFade({ color: "card", kind: "edges", size: 40 })).toEqual({ color: "card", size: 40 });
	});

	test("a zero or negative size draws nothing", () => {
		expect(resolveMarqueeFade({ kind: "edges", size: 0 })).toBeNull();
		expect(resolveMarqueeFade({ kind: "edges", size: -4 })).toBeNull();
	});
});

describe("resolveMarqueeSpeed", () => {
	test("the strip's own speed wins, then the group's, then the default", () => {
		expect(resolveMarqueeSpeed(10, 30)).toBe(10);
		expect(resolveMarqueeSpeed(undefined, 30)).toBe(30);
		expect(resolveMarqueeSpeed(undefined, undefined)).toBe(MARQUEE_DEFAULT_SPEED);
		expect(MARQUEE_DEFAULT_SPEED).toBe(40);
	});
});

describe("resolveMarqueePause", () => {
	test("inside a group the group's pause wins, so one press stills every row", () => {
		expect(resolveMarqueePause({ kind: "none" }, { kind: "press" })).toEqual({ kind: "press" });
	});

	test("outside a group the strip's own pause applies, defaulting to press", () => {
		expect(resolveMarqueePause({ kind: "none" }, undefined)).toEqual({ kind: "none" });
		expect(resolveMarqueePause(undefined, undefined)).toEqual({ kind: "press" });
	});
});

describe("resolveMarqueeHeld", () => {
	test("press holds only while a finger is down", () => {
		expect(resolveMarqueeHeld({ kind: "press" }, true)).toBe(true);
		expect(resolveMarqueeHeld({ kind: "press" }, false)).toBe(false);
	});

	test("controlled follows its flag and ignores the finger", () => {
		expect(resolveMarqueeHeld({ isPaused: true, kind: "controlled" }, false)).toBe(true);
		expect(resolveMarqueeHeld({ isPaused: false, kind: "controlled" }, true)).toBe(false);
	});

	test("none never holds", () => {
		expect(resolveMarqueeHeld({ kind: "none" }, true)).toBe(false);
	});
});

describe("marqueeVariants", () => {
	test("the root clips", () => {
		expect(marqueeVariants({ axis: "horizontal" }).root()).toContain("overflow-hidden");
	});

	test("the root lays out along the axis so the track keeps its full length", () => {
		expect(marqueeVariants({ axis: "horizontal" }).root()).toContain("flex-row");
		expect(marqueeVariants({ axis: "vertical" }).root()).toContain("flex-col");
		expect(marqueeVariants({ axis: "horizontal" }).track()).toContain("shrink-0");
	});

	test("the track lays copies along the axis", () => {
		expect(marqueeVariants({ axis: "horizontal" }).track()).toContain("flex-row");
		expect(marqueeVariants({ axis: "vertical" }).track()).toContain("flex-col");
	});

	test("a horizontal copy carries its gap as trailing right padding, never a gap", () => {
		for (const gap of MARQUEE_GAPS) {
			const copy = marqueeVariants({ axis: "horizontal", gap }).copy();
			expect(copy).toMatch(/\bpr-\d/);
			expect(copy).not.toMatch(/\bpb-/);
			expect(copy).not.toMatch(/\bgap-/);
		}
	});

	test("a vertical copy carries its gap as trailing bottom padding, never a gap", () => {
		for (const gap of MARQUEE_GAPS) {
			const copy = marqueeVariants({ axis: "vertical", gap }).copy();
			expect(copy).toMatch(/\bpb-\d/);
			expect(copy).not.toMatch(/\bpr-/);
			expect(copy).not.toMatch(/\bgap-/);
		}
	});

	test("each gap step is a distinct, ascending padding", () => {
		const steps = MARQUEE_GAPS.map(
			(gap) =>
				marqueeVariants({ axis: "horizontal", gap })
					.copy()
					.match(/\bpr-(\d+)/)?.[1]
		);
		expect(steps.map(Number)).toEqual([0, 1, 2, 4, 6, 8]);
	});

	test("the default gap is md", () => {
		expect(marqueeVariants({ axis: "horizontal" }).copy()).toContain("pr-4");
	});
});
