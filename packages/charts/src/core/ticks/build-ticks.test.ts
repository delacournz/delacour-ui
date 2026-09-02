import { describe, expect, test } from "bun:test";
import { scaleValue } from "../scale/scale";
import type { ScaleDescriptor } from "../scale/scale.types";
import { buildTicks } from "./build-ticks";

const linear: ScaleDescriptor = { kind: "linear", domain: [0, 100], range: [0, 300] };

describe("buildTicks", () => {
	test("positions every tick through the same scale the marks use", () => {
		for (const tick of buildTicks(linear, { count: 5 })) {
			expect(tick.position).toBe(scaleValue(linear, tick.value));
		}
	});

	test("defaults to five-ish ticks", () => {
		expect(buildTicks(linear).length).toBeGreaterThan(0);
	});

	test("uses explicit values instead of generating any, downsampled to count", () => {
		const ticks = buildTicks(linear, { values: [0, 10, 20, 30, 40, 50], count: 3 });
		expect(ticks).toHaveLength(3);
		expect(ticks[0]?.value).toBe(0);
		expect(ticks.at(-1)?.value).toBe(50);
	});

	test("generates time ticks for a time scale", () => {
		const start = new Date(2026, 0, 1).getTime();
		const time: ScaleDescriptor = { kind: "time", domain: [start, start + 7 * 86_400_000], range: [0, 300] };
		const ticks = buildTicks(time, { count: 7 });
		expect(ticks.length).toBeGreaterThan(0);
		for (const tick of ticks) expect(new Date(tick.value).getHours()).toBe(0);
	});

	test("returns an empty axis rather than NaN positions for an unusable log domain", () => {
		const broken: ScaleDescriptor = { kind: "log", domain: [0, 100], range: [0, 300], base: 10 };
		expect(buildTicks(broken, { count: 5 })).toEqual([]);
	});
});
