import { describe, expect, test } from "bun:test";
import {
	DIRECTIONS,
	type DirectionValue,
	directionSign,
	logicalDelta,
	mirrorX,
	physicalSide,
	resolveDirection,
} from "./direction.variants";

describe("DIRECTIONS", () => {
	test("is exactly ltr then rtl", () => {
		expect([...DIRECTIONS]).toEqual(["ltr", "rtl"]);
	});
});

describe("resolveDirection", () => {
	test("an own direction wins over the parent and the system", () => {
		expect(resolveDirection("rtl", "ltr", false)).toBe("rtl");
		expect(resolveDirection("ltr", "rtl", true)).toBe("ltr");
	});

	test("with no own direction, the parent's is inherited", () => {
		expect(resolveDirection(undefined, "rtl", false)).toBe("rtl");
		expect(resolveDirection(undefined, "ltr", true)).toBe("ltr");
	});

	test("with neither, the system decides", () => {
		expect(resolveDirection(undefined, null, true)).toBe("rtl");
		expect(resolveDirection(undefined, null, false)).toBe("ltr");
	});
});

describe("directionSign", () => {
	test("is 1 in ltr and -1 in rtl", () => {
		expect(directionSign("ltr")).toBe(1);
		expect(directionSign("rtl")).toBe(-1);
	});
});

describe("physicalSide", () => {
	test("start and end swap sides in rtl", () => {
		expect(physicalSide("start", "rtl")).toBe("right");
		expect(physicalSide("end", "rtl")).toBe("left");
		expect(physicalSide("start", "ltr")).toBe("left");
		expect(physicalSide("end", "ltr")).toBe("right");
	});
});

describe("mirrorX", () => {
	test("is the identity in ltr", () => {
		expect(mirrorX(10, 100, "ltr")).toBe(10);
	});

	test("measures from the right edge in rtl", () => {
		expect(mirrorX(10, 100, "rtl")).toBe(90);
	});

	test("a zero-width span stays at zero", () => {
		expect(mirrorX(0, 0, "rtl")).toBe(0);
	});

	test("is an involution in both directions", () => {
		for (const dir of DIRECTIONS) {
			for (const [x, width] of [
				[0, 0],
				[10, 100],
				[37.5, 240],
				[100, 100],
			] as const) {
				expect(mirrorX(mirrorX(x, width, dir), width, dir)).toBe(x);
			}
		}
	});
});

describe("logicalDelta", () => {
	test("negates a physical delta in rtl only", () => {
		expect(logicalDelta(12, "rtl")).toBe(-12);
		expect(logicalDelta(12, "ltr")).toBe(12);
	});

	test("agrees with directionSign", () => {
		const dirs: readonly DirectionValue[] = DIRECTIONS;
		for (const dir of dirs) {
			expect(logicalDelta(5, dir)).toBe(5 * directionSign(dir));
		}
	});
});
