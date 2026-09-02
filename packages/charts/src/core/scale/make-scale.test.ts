import { describe, expect, test } from "bun:test";
import { makeScale } from "./make-scale";
import { scaleValue } from "./scale";

describe("makeScale", () => {
	test("keeps the domain it was given when nicing is off", () => {
		const scale = makeScale({ kind: "linear", domain: [3, 97], range: [0, 300] });
		expect(scale.domain).toEqual([3, 97]);
		expect(scale.range).toEqual([0, 300]);
	});

	test("rounds the domain out to tick values when nicing is on", () => {
		const scale = makeScale({ kind: "linear", domain: [3, 97], range: [0, 300], nice: true });
		expect(scale.domain[0]).toBeLessThanOrEqual(3);
		expect(scale.domain[1]).toBeGreaterThanOrEqual(97);
		expect(scale.domain).toEqual([0, 100]);
	});

	test("honours a requested tick count when nicing", () => {
		const scale = makeScale({ kind: "linear", domain: [0.7, 9.3], range: [0, 300], nice: 2 });
		expect(scale.domain[0]).toBeLessThanOrEqual(0.7);
		expect(scale.domain[1]).toBeGreaterThanOrEqual(9.3);
	});

	test("returns a descriptor holding numbers only, so a worklet can read it", () => {
		const scale = makeScale({ kind: "time", domain: [0, 86_400_000], range: [0, 240] });
		expect(JSON.parse(JSON.stringify(scale))).toEqual(scale as unknown as Record<string, unknown>);
		for (const bound of [...scale.domain, ...scale.range]) expect(typeof bound).toBe("number");
	});

	test("nices a time domain onto a calendar boundary", () => {
		const start = Date.UTC(2026, 0, 1, 4, 37);
		const end = Date.UTC(2026, 0, 3, 19, 12);
		const scale = makeScale({ kind: "time", domain: [start, end], range: [0, 300], nice: true });
		expect(scale.domain[0]).toBeLessThanOrEqual(start);
		expect(scale.domain[1]).toBeGreaterThanOrEqual(end);
	});

	test("carries the log base through", () => {
		const scale = makeScale({ kind: "log", domain: [1, 1024], range: [0, 300], base: 2 });
		expect(scale.kind === "log" && scale.base).toBe(2);
	});

	test("floors a log domain above zero rather than emitting -Infinity", () => {
		const scale = makeScale({ kind: "log", domain: [0, 100], range: [0, 300] });
		expect(scale.domain[0]).toBeGreaterThan(0);
		expect(Number.isFinite(scaleValue(scale, 50))).toBe(true);
	});

	test("substitutes zero for a non-finite bound rather than poisoning every point", () => {
		const scale = makeScale({ kind: "linear", domain: [Number.NaN, 100], range: [0, 300] });
		expect(Number.isFinite(scale.domain[0])).toBe(true);
		expect(Number.isFinite(scaleValue(scale, 50))).toBe(true);
	});
});
