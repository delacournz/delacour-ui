import { describe, expect, test } from "bun:test";
import {
	advanceRotation,
	CIRCULAR_TEXT_DEFAULT_SPEED,
	CIRCULAR_TEXT_DIRECTIONS,
	CIRCULAR_TEXT_SIDES,
	countGlyphs,
	resolveBaselineRadius,
	resolveCirclePath,
	resolveCircularTextIssue,
	resolveCircumference,
	resolveGlyphAngles,
	resolveGlyphPosition,
	resolveRepeatCount,
	resolveRingBox,
	resolveRingLabel,
	resolveRingLength,
	resolveRingText,
	resolveSpan,
	resolveSpinVelocity,
} from "./circular-text.variants";

/** The numbers a path string carries, in order — so an assertion reads geometry rather than text. */
function numbers(d: string): number[] {
	return (d.match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number);
}

/** Every `A` command's seven arguments. */
function arcs(d: string): number[][] {
	return [...d.matchAll(/A ([^MA]+)/g)].map((match) => numbers(match[1] ?? ""));
}

describe("resolveCircumference", () => {
	test("is 2πr", () => {
		expect(resolveCircumference(50)).toBeCloseTo(314.159, 3);
		expect(resolveCircumference(1)).toBeCloseTo(2 * Math.PI, 9);
	});
});

describe("resolveBaselineRadius", () => {
	test("radius is the text's centreline, so the baseline sits on the side the glyph feet point to", () => {
		expect(resolveBaselineRadius(72, 12, "outside")).toBeLessThan(72);
		expect(resolveBaselineRadius(72, 12, "inside")).toBeGreaterThan(72);
	});

	test("both sides keep the band centred on the same radius", () => {
		const outside = 72 - resolveBaselineRadius(72, 12, "outside");
		const inside = resolveBaselineRadius(72, 12, "inside") - 72;
		expect(outside).toBeCloseTo(inside, 9);
	});
});

describe("resolveRingBox", () => {
	test("is wider than the circle on both sides, by an amount that grows with the type", () => {
		for (const side of CIRCULAR_TEXT_SIDES) {
			expect(resolveRingBox(72, 12, side)).toBeGreaterThan(144);
			expect(resolveRingBox(72, 24, side)).toBeGreaterThan(resolveRingBox(72, 12, side));
		}
	});

	test("is a whole number of points, so the Svg never lands on a half pixel", () => {
		expect(Number.isInteger(resolveRingBox(50.3, 13, "outside"))).toBe(true);
	});

	test("leaves room for the ascenders outside and the descenders inside", () => {
		for (const side of CIRCULAR_TEXT_SIDES) {
			const box = resolveRingBox(72, 16, side);
			const baseline = resolveBaselineRadius(72, 16, side);
			const reach = side === "outside" ? baseline + 16 * 0.9 : baseline + 16 * 0.2;
			expect(box / 2).toBeGreaterThanOrEqual(reach);
		}
	});
});

describe("resolveSpan", () => {
	test("full spans the circle from 12 o'clock and fixes its length", () => {
		expect(resolveSpan({ kind: "full" })).toEqual({ startAngle: 0, sweep: 360, hasLength: true });
	});

	test("an arc centres on the top by default", () => {
		expect(resolveSpan({ kind: "arc", sweep: 120 })).toEqual({ startAngle: -60, sweep: 120, hasLength: true });
	});

	test("an arc keeps an explicit start", () => {
		expect(resolveSpan({ kind: "arc", sweep: 90, startAngle: 135 })).toEqual({
			startAngle: 135,
			sweep: 90,
			hasLength: true,
		});
	});

	test("an arc's sweep is clamped into (0, 360]", () => {
		expect(resolveSpan({ kind: "arc", sweep: 720 }).sweep).toBe(360);
		expect(resolveSpan({ kind: "arc", sweep: -90 }).sweep).toBe(90);
		expect(resolveSpan({ kind: "arc", sweep: 0 }).sweep).toBeGreaterThan(0);
	});

	test("natural runs the whole circle at natural advance", () => {
		expect(resolveSpan({ kind: "natural" })).toEqual({ startAngle: 0, sweep: 360, hasLength: false });
		expect(resolveSpan({ kind: "natural", startAngle: 90 }).startAngle).toBe(90);
	});
});

describe("resolveRingLength", () => {
	test("is the arc length of the sweep at the baseline", () => {
		expect(resolveRingLength(50, 360)).toBeCloseTo(resolveCircumference(50), 9);
		expect(resolveRingLength(50, 90)).toBeCloseTo(resolveCircumference(50) / 4, 9);
	});
});

describe("resolveCirclePath", () => {
	test("a full outside circle starts at 12 o'clock, draws two arcs and ends where it began", () => {
		const d = resolveCirclePath(100, 100, 50, 0, 360, "outside");
		expect(d.startsWith("M 100 50 ")).toBe(true);
		const [first, second] = arcs(d);
		expect(arcs(d)).toHaveLength(2);
		expect(first?.slice(5)).toEqual([100, 150]);
		expect(second?.slice(5)).toEqual([100, 50]);
	});

	test("outside travels clockwise, so the glyph tops face away from the centre", () => {
		for (const arc of arcs(resolveCirclePath(100, 100, 50, 0, 360, "outside"))) expect(arc[4]).toBe(1);
	});

	test("inside travels counterclockwise, so the glyph tops face the centre", () => {
		for (const arc of arcs(resolveCirclePath(100, 100, 50, 0, 360, "inside"))) expect(arc[4]).toBe(0);
	});

	test("a full circle honours its start angle", () => {
		expect(resolveCirclePath(100, 100, 50, 90, 360, "outside").startsWith("M 150 100 ")).toBe(true);
	});

	test("a partial arc is one A command, large-arc only past 180°", () => {
		const quarter = arcs(resolveCirclePath(100, 100, 50, 0, 90, "outside"));
		const most = arcs(resolveCirclePath(100, 100, 50, 0, 270, "outside"));
		expect(quarter).toHaveLength(1);
		expect(quarter[0]?.[3]).toBe(0);
		expect(most[0]?.[3]).toBe(1);
	});

	test("an outside arc runs from its start to its end", () => {
		const d = resolveCirclePath(100, 100, 50, 0, 90, "outside");
		expect(d.startsWith("M 100 50 ")).toBe(true);
		expect(arcs(d)[0]?.slice(5)).toEqual([150, 100]);
	});

	test("an inside arc covers the same stretch of circle, travelling the other way", () => {
		const d = resolveCirclePath(100, 100, 50, 0, 90, "inside");
		expect(d.startsWith("M 150 100 ")).toBe(true);
		expect(arcs(d)[0]?.slice(5)).toEqual([100, 50]);
		expect(arcs(d)[0]?.[4]).toBe(0);
	});

	test("prints no negative zero and no float noise", () => {
		const d = resolveCirclePath(100, 100, 50, 180, 360, "outside");
		expect(d).not.toContain("-0 ");
		expect(d).not.toMatch(/\d\.\d{4,}/);
	});
});

describe("resolveRingText", () => {
	test("repeats with the separator after every copy", () => {
		expect(resolveRingText("A", 3, " • ")).toBe("A • A • A • ");
	});

	test("one copy is the caller's text exactly — their own trailing separator is theirs to keep", () => {
		expect(resolveRingText("A", 1, " • ")).toBe("A");
		expect(resolveRingText("A • ", 1, " • ")).toBe("A • ");
	});

	test("does not double a separator the text already ends with", () => {
		expect(resolveRingText("DELACOUR • UI • ", 2, " • ")).toBe("DELACOUR • UI • DELACOUR • UI • ");
	});

	test("a count below one, or fractional, is floored to at least one copy", () => {
		expect(resolveRingText("A", 0, " • ")).toBe("A");
		expect(resolveRingText("A", 2.7, "-")).toBe("A-A-");
	});
});

describe("resolveRepeatCount", () => {
	test("never below one", () => {
		expect(resolveRepeatCount(10, 40, 16, 3)).toBe(1);
		expect(resolveRepeatCount(0, 0, 0, 0)).toBe(1);
	});

	test("estimates from an average advance and never overshoots it, so spacing stays positive", () => {
		const circumference = resolveCircumference(72);
		const count = resolveRepeatCount(circumference, 8, 12, 3);
		expect(count * 11 * 0.58 * 12).toBeLessThanOrEqual(circumference);
		expect((count + 1) * 11 * 0.58 * 12).toBeGreaterThan(circumference);
	});

	test("grows with the circle", () => {
		expect(resolveRepeatCount(1000, 5, 12, 3)).toBeGreaterThan(resolveRepeatCount(300, 5, 12, 3));
	});
});

describe("countGlyphs", () => {
	test("counts code points, not UTF-16 units", () => {
		expect(countGlyphs("A • B")).toBe(5);
		expect(countGlyphs("★★")).toBe(2);
		expect(countGlyphs("𝒜")).toBe(1);
	});
});

describe("resolveRingLabel", () => {
	test("strips the separators so they are not read aloud", () => {
		expect(resolveRingLabel("DELACOUR • UI • ", " • ")).toBe("DELACOUR UI");
	});

	test("collapses whitespace and survives a whitespace separator", () => {
		expect(resolveRingLabel("  SCROLL   DOWN  ", " ")).toBe("SCROLL DOWN");
	});

	test("leaves text with no separator alone", () => {
		expect(resolveRingLabel("Loading", " • ")).toBe("Loading");
	});
});

describe("resolveSpinVelocity", () => {
	test("direction owns the sign", () => {
		expect(resolveSpinVelocity("clockwise", 24)).toBe(24);
		expect(resolveSpinVelocity("counterclockwise", 24)).toBe(-24);
		expect(resolveSpinVelocity("clockwise", -24)).toBe(24);
		expect(resolveSpinVelocity("counterclockwise", -24)).toBe(-24);
	});

	test("the default speed is a slow turn", () => {
		expect(CIRCULAR_TEXT_DEFAULT_SPEED).toBe(24);
	});
});

describe("advanceRotation", () => {
	test("integrates degrees per second and wraps at 360", () => {
		expect(advanceRotation(350, 1000, 24)).toBeCloseTo(14, 9);
	});

	test("a negative velocity wraps up from zero", () => {
		expect(advanceRotation(0, 500, -24)).toBeCloseTo(348, 9);
	});

	test("no time, no movement", () => {
		expect(advanceRotation(123, 0, 24)).toBe(123);
	});

	test("always lands in [0, 360), over many frames either way", () => {
		for (const velocity of [24, -24, 720, -720]) {
			let rotation = 0;
			for (let frame = 0; frame < 600; frame += 1) {
				rotation = advanceRotation(rotation, 16.6667, velocity);
				expect(rotation).toBeGreaterThanOrEqual(0);
				expect(rotation).toBeLessThan(360);
				expect(Object.is(rotation, -0)).toBe(false);
			}
		}
	});
});

describe("resolveGlyphAngles", () => {
	test("equal advances step by advance / radius", () => {
		const angles = resolveGlyphAngles([10, 10, 10], 50, 0, "clockwise");
		angles.forEach((angle, index) => {
			expect(angle).toBeCloseTo(((index * 10) / 50) * (180 / Math.PI), 9);
		});
	});

	test("is monotonic, and reversed counterclockwise", () => {
		const clockwise = resolveGlyphAngles([8, 12, 6, 9], 40, 30, "clockwise");
		const counter = resolveGlyphAngles([8, 12, 6, 9], 40, 30, "counterclockwise");
		for (let index = 1; index < clockwise.length; index += 1) {
			expect(clockwise[index] ?? 0).toBeGreaterThan(clockwise[index - 1] ?? 0);
			expect(counter[index] ?? 0).toBeLessThan(counter[index - 1] ?? 0);
		}
		expect(clockwise[0]).toBe(30);
		expect(counter[0]).toBe(30);
	});
});

describe("resolveGlyphPosition", () => {
	test("0° is top centre, upright", () => {
		const position = resolveGlyphPosition(0, 50, 100, 100);
		expect(position.x).toBeCloseTo(100, 9);
		expect(position.y).toBeCloseTo(50, 9);
		expect(position.rotation).toBe(0);
	});

	test("90° is the right edge, turned a quarter", () => {
		const position = resolveGlyphPosition(90, 50, 100, 100);
		expect(position.x).toBeCloseTo(150, 9);
		expect(position.y).toBeCloseTo(100, 9);
		expect(position.rotation).toBe(90);
	});
});

describe("resolveCircularTextIssue", () => {
	test("a ring needs a size and some text", () => {
		expect(resolveCircularTextIssue(0, "A")).not.toBeNull();
		expect(resolveCircularTextIssue(-4, "A")).not.toBeNull();
		expect(resolveCircularTextIssue(Number.NaN, "A")).not.toBeNull();
		expect(resolveCircularTextIssue(40, "")).not.toBeNull();
		expect(resolveCircularTextIssue(40, "   ")).not.toBeNull();
		expect(resolveCircularTextIssue(40, "A")).toBeNull();
	});
});

describe("the exported tuples", () => {
	test("name both directions and both sides", () => {
		expect([...CIRCULAR_TEXT_DIRECTIONS]).toEqual(["clockwise", "counterclockwise"]);
		expect([...CIRCULAR_TEXT_SIDES]).toEqual(["outside", "inside"]);
	});
});
