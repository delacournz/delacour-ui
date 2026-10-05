import { describe, expect, test } from "bun:test";
import { QR_MASKS } from "./qr-code.constants";
import {
	applyMask,
	chooseMask,
	maskPredicate,
	penaltyRule1,
	penaltyRule2,
	penaltyRule3,
	penaltyRule4,
	scorePenalty,
} from "./qr-code.mask";
import { buildFunctionMap } from "./qr-code.matrix";

/** A square grid from rows of `#` (dark) and `.` (light). */
function grid(rows: readonly string[]): { modules: Uint8Array; size: number } {
	const size = rows.length;
	const modules = new Uint8Array(size * size);
	rows.forEach((row, r) => {
		for (let c = 0; c < size; c++) modules[r * size + c] = row[c] === "#" ? 1 : 0;
	});
	return { modules, size };
}

/** A checkerboard scores zero on rules 1–3, so one feature can be isolated on it. */
function checker(size: number): string[] {
	return Array.from({ length: size }, (_, r) =>
		Array.from({ length: size }, (_, c) => ((r + c) % 2 === 0 ? "#" : ".")).join("")
	);
}

describe("maskPredicate", () => {
	test("each of the eight patterns at a few cells", () => {
		const cases: [number, number, number, boolean][] = [
			[0, 0, 0, true],
			[0, 0, 1, false],
			[1, 1, 0, false],
			[1, 2, 5, true],
			[2, 4, 3, true],
			[2, 4, 4, false],
			[3, 1, 2, true],
			[3, 1, 1, false],
			[4, 0, 2, true],
			[4, 0, 3, false],
			[4, 2, 3, true],
			[5, 0, 7, true],
			[5, 1, 1, false],
			[6, 1, 1, false],
			[6, 2, 2, false],
			[6, 0, 5, true],
			[7, 0, 0, true],
			[7, 1, 1, true],
			[7, 0, 1, false],
		];
		for (const [mask, row, col, dark] of cases) {
			expect(maskPredicate(mask as 0, row, col)).toBe(dark);
		}
	});
});

describe("applyMask", () => {
	test("is an involution and never touches a function module", () => {
		const { size, isFunction } = buildFunctionMap(2);
		const modules = new Uint8Array(size * size).map((_, index) => ((index * 7) % 3 === 0 ? 1 : 0));
		for (const mask of QR_MASKS) {
			const once = applyMask(modules, isFunction, size, mask);
			expect(applyMask(once, isFunction, size, mask)).toEqual(modules);
			for (let index = 0; index < size * size; index++) {
				if (isFunction[index]) expect(once[index]).toBe(modules[index] ?? -1);
			}
		}
	});
});

describe("penaltyRule1", () => {
	test("a checkerboard scores nothing", () => {
		const { modules, size } = grid(checker(8));
		expect(penaltyRule1(modules, size)).toBe(0);
	});

	test("a run of five scores 3, six scores 4", () => {
		const five = checker(10);
		five[1] = "#####.#.#.";
		expect(penaltyRule1(grid(five).modules, 10)).toBe(3);
		const six = checker(10);
		six[1] = "######.#.#";
		expect(penaltyRule1(grid(six).modules, 10)).toBe(4);
	});

	test("columns count as well as rows", () => {
		const { modules, size } = grid(checker(10));
		for (let row = 0; row < 5; row++) modules[row * size + 1] = 1;
		expect(penaltyRule1(modules, size)).toBeGreaterThanOrEqual(3);
	});
});

describe("penaltyRule2", () => {
	test("each 2x2 block of one colour scores 3", () => {
		const { modules, size } = grid(["##.#.#", "##.#.#", ...checker(6).slice(2)]);
		expect(penaltyRule2(modules, size)).toBe(3);
	});

	test("a solid 3x3 holds four blocks — 12", () => {
		const { modules, size } = grid(["###.#.", "###.#.", "###.#.", ...checker(6).slice(3)]);
		expect(penaltyRule2(modules, size)).toBe(12);
	});
});

describe("penaltyRule3", () => {
	test("a finder-like run with four light modules after it scores 40", () => {
		const rows = Array.from({ length: 11 }, () => ".#.#.#.#.#.");
		rows[0] = "#.###.#....";
		const { modules, size } = grid(rows);
		expect(penaltyRule3(modules, size)).toBe(40);
	});

	test("the mirrored pattern scores too", () => {
		const rows = Array.from({ length: 11 }, () => ".#.#.#.#.#.");
		rows[0] = "....#.###.#";
		const { modules, size } = grid(rows);
		expect(penaltyRule3(modules, size)).toBe(40);
	});
});

describe("penaltyRule4", () => {
	function share(size: number, dark: number): number {
		const modules = new Uint8Array(size * size);
		for (let index = 0; index < dark; index++) modules[index] = 1;
		return penaltyRule4(modules, size);
	}

	test("50% -> 0, 45% -> 10, 100% -> 100", () => {
		expect(share(10, 50)).toBe(0);
		expect(share(10, 45)).toBe(10);
		expect(share(10, 55)).toBe(10);
		expect(share(10, 47)).toBe(0);
		expect(share(10, 100)).toBe(100);
	});
});

describe("scorePenalty / chooseMask", () => {
	test("the score is the sum of the four rules", () => {
		const { modules, size } = grid(checker(12));
		expect(scorePenalty(modules, size)).toBe(
			penaltyRule1(modules, size) +
				penaltyRule2(modules, size) +
				penaltyRule3(modules, size) +
				penaltyRule4(modules, size)
		);
	});

	test("picks the lowest penalty, and the lowest index on a tie", () => {
		const scores = [50, 20, 20, 90, 30, 20, 70, 80];
		const picked = chooseMask((mask) => scores[mask] ?? 0);
		expect(picked).toBe(1);
	});
});
