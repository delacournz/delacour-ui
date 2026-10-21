import { describe, expect, test } from "bun:test";
import { resolveSkiaNativeId, SKIA_NATIVE_ID_FLOOR } from "./skia-native-id";

describe("resolveSkiaNativeId", () => {
	test("moves a fresh runtime's counter off Skia's starting id", () => {
		expect(resolveSkiaNativeId(1000, 0)).toBe(SKIA_NATIVE_ID_FLOOR);
		expect(resolveSkiaNativeId(1000, 0.5)).toBeGreaterThan(SKIA_NATIVE_ID_FLOOR);
	});

	test("keeps the ids a runtime already handed out behind the new counter", () => {
		expect(resolveSkiaNativeId(1003, 0)).toBe(SKIA_NATIVE_ID_FLOOR + 3);
	});

	test("leaves a counter that is already seeded alone, so two copies seed once", () => {
		const seeded = resolveSkiaNativeId(1000, 0.25);
		expect(resolveSkiaNativeId(seeded, 0.75)).toBe(seeded);
		expect(resolveSkiaNativeId(seeded + 12, 0.75)).toBe(seeded + 12);
	});

	test("spreads runtimes far enough apart that one's ids never reach the next's", () => {
		const a = resolveSkiaNativeId(1000, 0.1);
		const b = resolveSkiaNativeId(1000, 0.1 + 1 / 100_000);
		expect(b - a).toBeGreaterThanOrEqual(10_000);
	});

	test("stays inside a signed 32-bit int, which Skia's native side casts ids to", () => {
		expect(resolveSkiaNativeId(1000, 0.999_999_999)).toBeLessThan(2 ** 31 - 1_000_000);
	});
});
