import { describe, expect, test } from "bun:test";
import { declaredTokens } from "../../styles/theme-tokens.test";
import { OVERLAY_MOTION, OVERLAY_SCRIM_TOKEN, overlayVariants } from "./overlay.variants";

const LIGHT = declaredTokens("light");
const DARK = declaredTokens("dark");

describe("overlayVariants", () => {
	test("the scrim fills its parent in the overlay token", () => {
		const scrim = overlayVariants().scrim();
		expect(scrim).toContain("absolute");
		expect(scrim).toContain("inset-0");
		expect(scrim).toContain(`bg-${OVERLAY_SCRIM_TOKEN}`);
	});

	test("a caller's className reaches the scrim and wins", () => {
		expect(overlayVariants().scrim({ className: "bg-black/30" })).toContain("bg-black/30");
		expect(overlayVariants().scrim({ className: "bg-black/30" })).not.toContain(`bg-${OVERLAY_SCRIM_TOKEN}`);
	});

	test("the scrim token exists in both themes", () => {
		expect(LIGHT.has(OVERLAY_SCRIM_TOKEN)).toBe(true);
		expect(DARK.has(OVERLAY_SCRIM_TOKEN)).toBe(true);
	});
});

describe("OVERLAY_MOTION", () => {
	test("is finite, so an E2E runner's settle wait always ends", () => {
		expect(Number.isFinite(OVERLAY_MOTION.enterMs)).toBe(true);
		expect(Number.isFinite(OVERLAY_MOTION.exitMs)).toBe(true);
	});

	test("leaves faster than it arrives", () => {
		expect(OVERLAY_MOTION.exitMs).toBeLessThan(OVERLAY_MOTION.enterMs);
		expect(OVERLAY_MOTION.exitMs).toBeGreaterThan(0);
	});
});
