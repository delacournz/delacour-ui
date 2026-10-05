import { describe, expect, test } from "bun:test";
import { encodeQr } from "./qr-code.encode";
import {
	countAffectedCodewords,
	fitLogoToEcc,
	planQrCode,
	regionClearsNoReservedModules,
	resolveLogoRegion,
} from "./qr-code.logo";
import { placeData } from "./qr-code.matrix";
import { totalCodewords } from "./qr-code.tables";
import { readQr } from "./qr-code.test-helpers";

/** Pinned from the implementation's own answer — a change here is a change in what scans. */
const V1_H_02_FIT = { version: 1, fraction: 0.2, clearsLogo: true };

describe("resolveLogoRegion", () => {
	test("centred, with the code's parity so it sits symmetrically", () => {
		expect(resolveLogoRegion(21, 0.2)).toEqual({ start: 8, side: 5 });
		expect(resolveLogoRegion(25, 0.2)).toEqual({ start: 10, side: 5 });
		expect(resolveLogoRegion(57, 0.3)).toEqual({ start: 19, side: 19 });
	});

	test("clamps the fraction to 0.1–0.3", () => {
		expect(resolveLogoRegion(57, 0.9)).toEqual(resolveLogoRegion(57, 0.3));
		expect(resolveLogoRegion(57, 0)).toEqual(resolveLogoRegion(57, 0.1));
		expect(resolveLogoRegion(57, Number.NaN)).toEqual(resolveLogoRegion(57, 0.2));
	});
});

describe("countAffectedCodewords", () => {
	test("counts each codeword under the region once, and never a function module", () => {
		const { owner } = placeData(new Array(totalCodewords(1)).fill(0), 1);
		expect(countAffectedCodewords(owner, 21, { start: 19, side: 2 })).toBe(1);
		expect(countAffectedCodewords(owner, 21, { start: 0, side: 7 })).toBe(0);
	});

	test("a bigger region never affects fewer codewords", () => {
		const { owner } = placeData(new Array(totalCodewords(7)).fill(0), 7);
		let previous = 0;
		for (const fraction of [0.1, 0.15, 0.2, 0.25, 0.3]) {
			const count = countAffectedCodewords(owner, 45, resolveLogoRegion(45, fraction));
			expect(count).toBeGreaterThanOrEqual(previous);
			previous = count;
		}
	});
});

describe("regionClearsNoReservedModules", () => {
	test("a small centred logo is clear of every reserved area", () => {
		expect(regionClearsNoReservedModules(7, resolveLogoRegion(45, 0.2))).toBe(true);
	});

	test("a 0.3 logo on version 1 reaches the format strip", () => {
		expect(regionClearsNoReservedModules(1, resolveLogoRegion(21, 0.3))).toBe(false);
	});
});

describe("fitLogoToEcc", () => {
	test("H with a 0.2 logo fits from version 2 up", () => {
		for (const version of [2, 5, 10, 25, 40]) {
			expect(fitLogoToEcc({ version, errorCorrection: "H", fraction: 0.2 })).toEqual({
				version,
				fraction: 0.2,
				clearsLogo: true,
			});
		}
	});

	test("regression: version 1 at H with 0.2 is pinned to what the fit computes", () => {
		expect(fitLogoToEcc({ version: 1, errorCorrection: "H", fraction: 0.2 })).toEqual(V1_H_02_FIT);
	});

	test("too big for the level raises the version before it shrinks the logo", () => {
		const fit = fitLogoToEcc({ version: 1, errorCorrection: "H", fraction: 0.3 });
		expect(fit.clearsLogo).toBe(true);
		expect(fit.version > 1 || fit.fraction < 0.3).toBe(true);
	});

	test("L cannot afford a 0.3 logo at all, and says so rather than punching a hole", () => {
		const fit = fitLogoToEcc({ version: 3, errorCorrection: "L", fraction: 0.3, maxVersion: 3 });
		expect(fit.fraction).toBeLessThan(0.3);
	});
});

describe("planQrCode", () => {
	test("no logo: the plain encode, no region", () => {
		const plan = planQrCode("https://delacour.co.nz", { errorCorrection: "M" }, null);
		expect(plan.result).toEqual(encodeQr("https://delacour.co.nz", { errorCorrection: "M" }));
		expect(plan.region).toBeNull();
	});

	test("a logo forces H, clears the centre, and the code still reads", () => {
		const plan = planQrCode("https://delacour.co.nz/docs/native/components/qr-code", { errorCorrection: "L" }, 0.3);
		if (!plan.result.ok || !plan.region) throw new Error("expected a planned logo");
		const { matrix } = plan.result;
		expect(matrix.errorCorrection).toBe("H");

		const damaged = matrix.modules.slice();
		const { start, side } = plan.region;
		for (let row = start; row < start + side; row++) {
			for (let col = start; col < start + side; col++) {
				if ((matrix.owner[row * matrix.size + col] ?? -1) >= 0) damaged[row * matrix.size + col] ^= 1;
			}
		}
		const read = readQr(damaged, matrix.size, { correct: true });
		expect(read.value).toBe("https://delacour.co.nz/docs/native/components/qr-code");
	});
});
