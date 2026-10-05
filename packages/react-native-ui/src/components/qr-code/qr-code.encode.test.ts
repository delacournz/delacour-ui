import { describe, expect, test } from "bun:test";
import { QR_ERROR_CORRECTIONS, type QrErrorCorrection, type QrMatrix } from "./qr-code.constants";
import {
	characterCountBits,
	encodeBitStream,
	encodeQr,
	encodeUtf8,
	interleave,
	selectMode,
	selectVersion,
} from "./qr-code.encode";
import { QR_FIXTURES } from "./qr-code.fixtures";
import { blockLayout, byteCapacity, dataCodewords } from "./qr-code.tables";
import { matrixToRows, readQr } from "./qr-code.test-helpers";

function encoded(value: string, options?: Parameters<typeof encodeQr>[1]): QrMatrix {
	const result = encodeQr(value, options);
	if (!result.ok) throw new Error(`expected "${value.slice(0, 20)}" to encode: ${result.error.kind}`);
	return result.matrix;
}

describe("selectMode", () => {
	test("digits, the 45-character set, and everything else", () => {
		expect(selectMode("0123")).toBe("numeric");
		expect(selectMode("HELLO WORLD")).toBe("alphanumeric");
		expect(selectMode("HTTPS://X.CO/$%*+-./:")).toBe("alphanumeric");
		expect(selectMode("hello")).toBe("byte");
		expect(selectMode("12 34")).toBe("alphanumeric");
		expect(selectMode("é")).toBe("byte");
	});
});

describe("characterCountBits", () => {
	test("each mode's width across the three version bands", () => {
		expect([1, 9, 10, 26, 27, 40].map((version) => characterCountBits("byte", version))).toEqual([
			8, 8, 16, 16, 16, 16,
		]);
		expect([1, 9, 10, 26, 27, 40].map((version) => characterCountBits("numeric", version))).toEqual([
			10, 10, 12, 12, 14, 14,
		]);
		expect([1, 9, 10, 26, 27, 40].map((version) => characterCountBits("alphanumeric", version))).toEqual([
			9, 9, 11, 11, 13, 13,
		]);
	});
});

describe("encodeUtf8", () => {
	test("ASCII is one byte, é two, € three, an emoji four", () => {
		expect(encodeUtf8("A")).toEqual([0x41]);
		expect(encodeUtf8("é")).toEqual([0xc3, 0xa9]);
		expect(encodeUtf8("€")).toEqual([0xe2, 0x82, 0xac]);
		expect(encodeUtf8("😀")).toEqual([0xf0, 0x9f, 0x98, 0x80]);
	});
});

describe("encodeBitStream", () => {
	test("01234567, 1-M", () => {
		expect(encodeBitStream("01234567", "numeric", 1, "M")).toEqual([
			16, 32, 12, 86, 97, 128, 236, 17, 236, 17, 236, 17, 236, 17, 236, 17,
		]);
	});

	test("HELLO WORLD, 1-M and 1-Q", () => {
		expect(encodeBitStream("HELLO WORLD", "alphanumeric", 1, "M")).toEqual([
			32, 91, 11, 120, 209, 114, 220, 77, 67, 64, 236, 17, 236, 17, 236, 17,
		]);
		const quartile = encodeBitStream("HELLO WORLD", "alphanumeric", 1, "Q");
		expect(quartile).toHaveLength(13);
		expect(quartile.at(-1)).toBe(236);
	});

	test("byte A, 1-L", () => {
		const stream = encodeBitStream("A", "byte", 1, "L");
		expect(stream.slice(0, 5)).toEqual([64, 20, 16, 236, 17]);
		expect(stream).toHaveLength(19);
	});

	test("always fills the version's data capacity exactly", () => {
		for (const level of QR_ERROR_CORRECTIONS) {
			expect(encodeBitStream("hi", "byte", 3, level)).toHaveLength(dataCodewords(3, level));
		}
	});
});

describe("selectVersion", () => {
	test("the smallest version that holds the value", () => {
		expect(selectVersion("HELLO WORLD", "M", 1, 40)).toEqual({ ok: true, version: 1, mode: "alphanumeric" });
		expect(selectVersion("a".repeat(14), "M", 1, 40)).toEqual({ ok: true, version: 1, mode: "byte" });
		expect(selectVersion("a".repeat(15), "M", 1, 40)).toEqual({ ok: true, version: 2, mode: "byte" });
		expect(selectVersion("a".repeat(2953), "L", 1, 40)).toEqual({ ok: true, version: 40, mode: "byte" });
	});

	test("honours the floor", () => {
		expect(selectVersion("a", "M", 5, 40)).toEqual({ ok: true, version: 5, mode: "byte" });
	});

	test("one byte over the top fails with the capacity it missed", () => {
		expect(selectVersion("a".repeat(2954), "L", 1, 40)).toEqual({
			ok: false,
			units: 2954,
			capacity: byteCapacity(40, "L"),
		});
	});
});

describe("interleave", () => {
	test("5-Q takes a column from each block, then the long blocks' extra byte", () => {
		const layout = blockLayout(5, "Q");
		const data = [
			Array.from({ length: layout.short.data }, (_, index) => 100 + index),
			Array.from({ length: layout.short.data }, (_, index) => 200 + index),
			Array.from({ length: layout.long.data }, (_, index) => 300 + index),
			Array.from({ length: layout.long.data }, (_, index) => 400 + index),
		];
		const ec = data.map((_, block) => Array.from({ length: 18 }, (_, index) => block * 1000 + index));
		const out = interleave(data, ec);
		expect(out.slice(0, 4)).toEqual([100, 200, 300, 400]);
		expect(out.slice(56, 62)).toEqual([114, 214, 314, 414, 315, 415]);
		expect(out.slice(62, 66)).toEqual([0, 1000, 2000, 3000]);
		expect(out).toHaveLength(134);
	});
});

describe("encodeQr", () => {
	test("an empty value is an error, not a blank code", () => {
		expect(encodeQr("")).toEqual({ ok: false, error: { kind: "empty" } });
	});

	test("an impossible option is reported by name", () => {
		expect(encodeQr("x", { mask: 9 as 0 })).toEqual({
			ok: false,
			error: { kind: "invalid-option", option: "mask", value: 9 },
		});
		expect(encodeQr("x", { minVersion: 0 })).toEqual({
			ok: false,
			error: { kind: "invalid-option", option: "minVersion", value: 0 },
		});
		expect(encodeQr("x", { maxVersion: 41 })).toEqual({
			ok: false,
			error: { kind: "invalid-option", option: "maxVersion", value: 41 },
		});
		expect(encodeQr("x", { minVersion: 5, maxVersion: 3 })).toEqual({
			ok: false,
			error: { kind: "invalid-option", option: "maxVersion", value: 3 },
		});
	});

	test("too long carries the size and the capacity", () => {
		expect(encodeQr("a".repeat(4000))).toEqual({
			ok: false,
			error: { kind: "too-long", bytes: 4000, capacity: byteCapacity(40, "M"), errorCorrection: "M" },
		});
	});

	test("size is 17 + 4 * version", () => {
		for (const minVersion of [1, 6, 7, 21, 40]) {
			const matrix = encoded("size", { minVersion });
			expect(matrix.version).toBe(minVersion);
			expect(matrix.size).toBe(17 + 4 * minVersion);
			expect(matrix.modules).toHaveLength(matrix.size * matrix.size);
			expect(matrix.owner).toHaveLength(matrix.size * matrix.size);
		}
	});

	test("defaults to M and the auto mask", () => {
		const matrix = encoded("https://delacour.co.nz");
		expect(matrix.errorCorrection).toBe("M");
		expect(matrix.mode).toBe("byte");
	});

	test("is deterministic, and auto equals the explicit mask it picked", () => {
		const first = encoded("determinism", { errorCorrection: "Q" });
		const second = encoded("determinism", { errorCorrection: "Q" });
		expect(second.modules).toEqual(first.modules);
		const explicit = encoded("determinism", { errorCorrection: "Q", mask: first.mask });
		expect(explicit.modules).toEqual(first.modules);
	});

	test("boostEcc raises the level while the version still holds the value", () => {
		const plain = encoded("HELLO WORLD", { errorCorrection: "L" });
		const boosted = encoded("HELLO WORLD", { errorCorrection: "L", boostEcc: true });
		expect(boosted.version).toBe(plain.version);
		expect(boosted.errorCorrection).toBe("Q");
	});
});

describe("golden matrices from an independent encoder", () => {
	for (const fixture of QR_FIXTURES) {
		test(fixture.name, () => {
			const matrix = encoded(fixture.value, {
				errorCorrection: fixture.errorCorrection,
				minVersion: fixture.version,
				mask: fixture.mask,
			});
			expect(matrix.version).toBe(fixture.version);
			expect(matrix.mode).toBe(fixture.mode);
			expect(matrixToRows(matrix)).toEqual(fixture.rows);
		});
	}
});

describe("round trip — every block has zero syndromes and the data reads back", () => {
	const LEVELS: readonly QrErrorCorrection[] = QR_ERROR_CORRECTIONS;
	const VERSIONS = [1, 2, 6, 7, 14, 21, 32, 40] as const;
	const ALPHABETS = ["0123456789", "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 $%*+-./:", "abcdefxyz/?=&é€😀"] as const;

	/** A deterministic generator — a failure must reproduce. */
	function payload(seed: number, alphabet: string, length: number): string {
		const characters = Array.from(alphabet);
		let state = seed * 2654435761;
		let out = "";
		for (let index = 0; index < length; index++) {
			state = (state * 1103515245 + 12345) >>> 0;
			out += characters[state % characters.length];
		}
		return out;
	}

	let seed = 1;
	for (const level of LEVELS) {
		for (const version of VERSIONS) {
			test(`${version}-${level}`, () => {
				for (let sample = 0; sample < 6; sample++) {
					const alphabet = ALPHABETS[sample % ALPHABETS.length] ?? "";
					const length = 1 + ((seed * 37) % Math.max(1, Math.min(60, byteCapacity(version, level) / 4)));
					const value = payload(seed++, alphabet, length);
					const matrix = encoded(value, { errorCorrection: level, minVersion: version });
					const read = readQr(matrix.modules, matrix.size);
					expect(read.errorCorrection).toBe(level);
					expect(read.mask).toBe(matrix.mask);
					expect(read.syndromesClean).toBe(true);
					expect(read.value).toBe(value);
				}
			});
		}
	}
});
