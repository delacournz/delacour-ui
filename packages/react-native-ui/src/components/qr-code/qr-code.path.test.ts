import { describe, expect, test } from "bun:test";
import type { QrMatrix } from "./qr-code.constants";
import { encodeQr } from "./qr-code.encode";
import { buildQrPath, resolveRenderScale } from "./qr-code.path";

/** A bare matrix from rows of `#` / `.`, for the path builder's geometry only. */
function matrixOf(rows: readonly string[]): QrMatrix {
	const size = rows.length;
	const modules = new Uint8Array(size * size);
	rows.forEach((row, r) => {
		for (let c = 0; c < size; c++) modules[r * size + c] = row[c] === "#" ? 1 : 0;
	});
	return {
		version: 1,
		errorCorrection: "M",
		mask: 0,
		mode: "byte",
		size,
		modules,
		owner: new Int16Array(size * size).fill(0),
	};
}

/** A version-1-sized matrix, dark only at `cells`, all clear of the finders. */
function sparse(cells: readonly (readonly [number, number])[]): QrMatrix {
	const rows = Array.from({ length: 21 }, (_, r) =>
		Array.from({ length: 21 }, (_, c) => (cells.some(([cr, cc]) => cr === r && cc === c) ? "#" : ".")).join("")
	);
	return matrixOf(rows);
}

function count(haystack: string, needle: RegExp): number {
	return haystack.match(needle)?.length ?? 0;
}

describe("buildQrPath — square", () => {
	test("a 2x2 dark block is one rect, merged both ways", () => {
		expect(buildQrPath(matrixOf(["##", "##"]), "square", 0)).toBe("M0 0h2v2h-2z");
	});

	test("the quiet zone offsets every rect", () => {
		expect(buildQrPath(matrixOf(["##", "##"]), "square", 4)).toBe("M4 4h2v2h-2z");
	});

	test("an L of three modules is two rects", () => {
		expect(buildQrPath(matrixOf(["##", "#."]), "square", 0)).toBe("M0 0h2v1h-2zM0 1h1v1h-1z");
	});

	test("a gap in a row splits it into two runs", () => {
		expect(count(buildQrPath(matrixOf(["#.#", "...", "..."]), "square", 0), /M/g)).toBe(2);
	});

	test("a cleared region drops its modules", () => {
		const path = buildQrPath(matrixOf(["###", "###", "###"]), "square", 0, { start: 1, side: 1 });
		expect(path).toBe("M0 0h3v1h-3zM0 1h1v1h-1zM2 1h1v1h-1zM0 2h3v1h-3z");
	});
});

describe("buildQrPath — rounded", () => {
	const MODULE_ARC = /a\.5 \.5/g;

	test("an isolated module is a pill with four arcs", () => {
		const path = buildQrPath(sparse([[10, 10]]), "rounded", 0);
		expect(count(path, MODULE_ARC)).toBe(4);
	});

	test("a neighbour removes the arcs on the shared side", () => {
		const path = buildQrPath(
			sparse([
				[10, 10],
				[10, 11],
			]),
			"rounded",
			0
		);
		expect(count(path, MODULE_ARC)).toBe(4);
	});

	test("a module inside a solid block has no arcs at all", () => {
		const block: [number, number][] = [];
		for (let r = 9; r < 12; r++) for (let c = 9; c < 12; c++) block.push([r, c]);
		expect(count(buildQrPath(sparse(block), "rounded", 0), MODULE_ARC)).toBe(4);
	});
});

describe("buildQrPath — dots", () => {
	test("one circle per data module, two arcs each", () => {
		const path = buildQrPath(
			sparse([
				[10, 10],
				[10, 11],
				[12, 9],
			]),
			"dots",
			0
		);
		expect(count(path, /a\.42 \.42/g)).toBe(6);
	});
});

describe("buildQrPath — finders and hygiene", () => {
	const result = encodeQr("https://delacour.co.nz", { errorCorrection: "M" });
	if (!result.ok) throw new Error("fixture failed to encode");
	const { matrix } = result;

	test.each(["rounded", "dots"] as const)("%s draws each finder as a ring and a core, never as modules", (style) => {
		const path = buildQrPath(matrix, style, 4);
		expect(count(path, /M4 5\.75/g)).toBe(1);
		expect(path).toContain("a1.75 1.75");
		expect(path).toContain("a1 1");
	});

	test.each(["square", "rounded", "dots"] as const)("%s never emits NaN or undefined", (style) => {
		const path = buildQrPath(matrix, style, 4);
		expect(path).not.toMatch(/NaN|undefined|Infinity/);
		expect(path.length).toBeGreaterThan(0);
	});

	test("path length grows with the payload", () => {
		const small = buildQrPath(matrix, "square", 4).length;
		const bigger = encodeQr("x".repeat(200));
		if (!bigger.ok) throw new Error("fixture failed to encode");
		expect(buildQrPath(bigger.matrix, "square", 4).length).toBeGreaterThan(small);
	});
});

describe("resolveRenderScale", () => {
	test("the largest whole-device-pixel module that fits", () => {
		const { moduleDp, offset } = resolveRenderScale(192, 29, 3);
		expect(moduleDp).toBeCloseTo(19 / 3, 10);
		expect(moduleDp * 29).toBeLessThanOrEqual(192);
		expect(offset * 3).toBe(Math.floor(offset * 3));
		expect(offset).toBeCloseTo((192 - moduleDp * 29) / 2, 0);
	});

	test("every module edge lands on a device pixel", () => {
		for (const ratio of [1, 2, 3]) {
			const { moduleDp, offset } = resolveRenderScale(256, 37, ratio);
			for (let index = 0; index <= 37; index++) {
				const edge = (offset + index * moduleDp) * ratio;
				expect(Math.abs(edge - Math.round(edge))).toBeLessThan(1e-9);
			}
		}
	});

	test("never a module smaller than one device pixel", () => {
		expect(resolveRenderScale(20, 185, 1).moduleDp).toBe(1);
	});
});
