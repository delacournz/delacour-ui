import { describe, expect, test } from "bun:test";
import { declaredTokens } from "../../styles/theme-tokens.test";
import { BADGE_FOREGROUND_TOKEN, badgeVariants } from "../badge/badge.variants";
import {
	ANIMATED_BADGE_COLOR,
	ANIMATED_BADGE_SIZES,
	ANIMATED_BADGE_STATUSES,
	PULSE_CYCLE_MS,
	PULSE_MAX_SCALE,
	PULSE_MIN_OPACITY,
	RESIZE_SPRING,
	ROLL_DISTANCE,
	ROLL_IN_SPRING,
	ROLL_OUT_MS,
	resolveAnimatedBadgeForeground,
	resolveAnimatedBadgeGlyphKind,
	resolveAnimatedBadgeKey,
	resolveAnimatedBadgeMotion,
	resolveAnimatedBadgeSlots,
	resolveAnimatedBadgeText,
} from "./animated-badge.variants";

const LIGHT = declaredTokens("light");
const DARK = declaredTokens("dark");

/** Tailwind's spacing step a class string sets its gap from. */
function gapOf(cls: string): string | undefined {
	return cls.match(/\bgap-([\d.]+)\b/)?.[1];
}

describe("the theme.css reader", () => {
	test("finds both variants", () => {
		expect(LIGHT.size).toBeGreaterThan(0);
		expect(DARK.size).toBeGreaterThan(0);
	});
});

describe("ANIMATED_BADGE_COLOR", () => {
	test("maps every status to a badge colour", () => {
		for (const status of ANIMATED_BADGE_STATUSES) {
			expect(ANIMATED_BADGE_COLOR[status]).toBeTruthy();
		}
	});

	// The package's token vocabulary is shadcn's: `destructive`, never `danger`.
	test("maps destructive to destructive", () => {
		expect(ANIMATED_BADGE_COLOR.destructive).toBe("destructive");
		expect(Object.values(ANIMATED_BADGE_COLOR)).not.toContain("danger");
	});

	test("paints neutral and loading on the badge's neutral fill", () => {
		expect(ANIMATED_BADGE_COLOR.neutral).toBe("default");
		expect(ANIMATED_BADGE_COLOR.loading).toBe("default");
	});

	test("maps each semantic status to the colour of the same name", () => {
		for (const status of ["info", "success", "warning"] as const) {
			expect(ANIMATED_BADGE_COLOR[status]).toBe(status);
		}
	});
});

describe("resolveAnimatedBadgeForeground", () => {
	// A glyph and the label beside it must be one shade, so the badge reads the
	// soft row of Badge's own map rather than keeping a second one that can drift.
	test("is the soft badge's foreground for each status", () => {
		for (const status of ANIMATED_BADGE_STATUSES) {
			expect(resolveAnimatedBadgeForeground(status)).toBe(BADGE_FOREGROUND_TOKEN.soft[ANIMATED_BADGE_COLOR[status]]);
		}
	});

	test("names only tokens both themes declare", () => {
		for (const status of ANIMATED_BADGE_STATUSES) {
			const token = resolveAnimatedBadgeForeground(status);
			expect(LIGHT.has(token)).toBe(true);
			expect(DARK.has(token)).toBe(true);
		}
	});
});

describe("resolveAnimatedBadgeSlots", () => {
	// A badge and an animated badge of the same size must sit level in a row.
	test("matches Badge's soft slots at every status and size", () => {
		for (const status of ANIMATED_BADGE_STATUSES) {
			for (const size of ANIMATED_BADGE_SIZES) {
				const badge = badgeVariants({ variant: "soft", color: ANIMATED_BADGE_COLOR[status], size });
				const slots = resolveAnimatedBadgeSlots({ status, size });
				expect(slots.root).toBe(badge.root());
				expect(slots.label).toBe(badge.label());
				expect(slots.icon).toBe(badge.icon());
			}
		}
	});

	test("takes no height, so the label grows with OS font scaling", () => {
		for (const status of ANIMATED_BADGE_STATUSES) {
			for (const size of ANIMATED_BADGE_SIZES) {
				expect(resolveAnimatedBadgeSlots({ status, size }).root).not.toMatch(/\bh-/);
			}
		}
	});

	// Tinted fill only. The reserved border stays transparent.
	test("paints no ring", () => {
		for (const status of ANIMATED_BADGE_STATUSES) {
			const root = resolveAnimatedBadgeSlots({ status, size: "md" }).root;
			expect(root).toContain("border-transparent");
		}
	});

	// The moving unit holds glyph and label, so it has to restate the gap the
	// root would otherwise have put between them.
	test("spaces the content row by the root's own gap", () => {
		for (const size of ANIMATED_BADGE_SIZES) {
			const slots = resolveAnimatedBadgeSlots({ status: "info", size });
			expect(gapOf(slots.content)).toBeDefined();
			expect(gapOf(slots.content)).toBe(gapOf(slots.root));
			expect(slots.content).toContain("flex-row");
		}
	});

	test("merges caller classes last", () => {
		const slots = resolveAnimatedBadgeSlots({
			status: "info",
			size: "md",
			className: "bg-success",
			labelClassName: "text-success-foreground",
		});
		expect(slots.root).toContain("bg-success");
		expect(slots.root).not.toContain("bg-info-soft");
		expect(slots.label).toContain("text-success-foreground");
		expect(slots.label).not.toContain("text-info-soft-foreground");
	});

	test("defaults to md", () => {
		expect(resolveAnimatedBadgeSlots({ status: "info" }).root).toBe(
			badgeVariants({ variant: "soft", color: "info", size: "md" }).root()
		);
	});
});

describe("resolveAnimatedBadgeText", () => {
	test("reads a string, a number and an array of either", () => {
		expect(resolveAnimatedBadgeText("Live")).toBe("Live");
		expect(resolveAnimatedBadgeText(3)).toBe("3");
		expect(resolveAnimatedBadgeText([3, " reviews"])).toBe("3 reviews");
	});

	test("is undefined for anything that is not text", () => {
		expect(resolveAnimatedBadgeText(undefined)).toBeUndefined();
		expect(resolveAnimatedBadgeText(null)).toBeUndefined();
		expect(resolveAnimatedBadgeText(true)).toBeUndefined();
		expect(resolveAnimatedBadgeText({ type: "Text", props: {}, key: null })).toBeUndefined();
		expect(resolveAnimatedBadgeText(["a", { type: "Text", props: {}, key: null }])).toBeUndefined();
	});
});

describe("resolveAnimatedBadgeKey", () => {
	test("keys a text label on status and words", () => {
		expect(resolveAnimatedBadgeKey({ status: "info", children: "Building" })).toBe("info:Building");
		expect(resolveAnimatedBadgeKey({ status: "info", children: 4 })).toBe("info:4");
		expect(resolveAnimatedBadgeKey({ status: "info", children: [4, " reviews"] })).toBe("info:4 reviews");
	});

	test("contentKey wins over the words", () => {
		expect(resolveAnimatedBadgeKey({ status: "info", children: "Building", contentKey: 7 })).toBe("info:7");
		expect(resolveAnimatedBadgeKey({ status: "info", children: "Building", contentKey: "a" })).toBe("info:a");
	});

	test("a non-text label keys on status alone", () => {
		const element = { type: "Text", props: {}, key: null };
		expect(resolveAnimatedBadgeKey({ status: "warning", children: element })).toBe("warning");
	});

	test("a status change changes the key even with the same words", () => {
		expect(resolveAnimatedBadgeKey({ status: "info", children: "Sync" })).not.toBe(
			resolveAnimatedBadgeKey({ status: "success", children: "Sync" })
		);
	});

	test("the same inputs give the same key, so a re-render does not roll", () => {
		expect(resolveAnimatedBadgeKey({ status: "info", children: ["a", "b"] })).toBe(
			resolveAnimatedBadgeKey({ status: "info", children: ["a", "b"] })
		);
	});
});

describe("resolveAnimatedBadgeGlyphKind", () => {
	test("loading draws a spinner", () => {
		expect(resolveAnimatedBadgeGlyphKind({ status: "loading", hasCustomIcon: false })).toBe("spinner");
	});

	test("every other status draws its icon", () => {
		for (const status of ANIMATED_BADGE_STATUSES.filter((s) => s !== "loading")) {
			expect(resolveAnimatedBadgeGlyphKind({ status, hasCustomIcon: false })).toBe("icon");
		}
	});

	test("showIcon false draws nothing, whatever the status", () => {
		for (const status of ANIMATED_BADGE_STATUSES) {
			expect(resolveAnimatedBadgeGlyphKind({ status, showIcon: false, hasCustomIcon: false })).toBe("none");
		}
	});

	// An explicit glyph is the caller's word, and it beats the default — loading included.
	test("a custom icon draws that icon", () => {
		for (const status of ANIMATED_BADGE_STATUSES) {
			expect(resolveAnimatedBadgeGlyphKind({ status, hasCustomIcon: true })).toBe("icon");
		}
	});
});

describe("resolveAnimatedBadgeMotion", () => {
	const base = { isReduceMotion: false, isMotionCalm: false, status: "info", animateLayout: true } as const;

	test("runs everything by default, with no pulse off loading", () => {
		expect(resolveAnimatedBadgeMotion(base)).toEqual({ roll: true, resize: "spring", layout: true, pulse: false });
	});

	test("pulse defaults on for loading", () => {
		expect(resolveAnimatedBadgeMotion({ ...base, status: "loading" }).pulse).toBe(true);
	});

	test("an explicit pulse={false} on loading wins", () => {
		expect(resolveAnimatedBadgeMotion({ ...base, status: "loading", pulse: false }).pulse).toBe(false);
	});

	test("an explicit pulse on any status pulses", () => {
		expect(resolveAnimatedBadgeMotion({ ...base, pulse: true }).pulse).toBe(true);
	});

	test("reduce motion cuts every motion over", () => {
		expect(resolveAnimatedBadgeMotion({ ...base, status: "loading", isReduceMotion: true })).toEqual({
			roll: false,
			resize: "instant",
			layout: false,
			pulse: false,
		});
	});

	// Calm is for a test runner waiting on the screen to settle. A roll settles;
	// a pulse never does.
	test("calm motion alone stills the pulse and keeps the finite motions", () => {
		expect(resolveAnimatedBadgeMotion({ ...base, status: "loading", isMotionCalm: true })).toEqual({
			roll: true,
			resize: "spring",
			layout: true,
			pulse: false,
		});
	});

	test("animateLayout={false} drops only the layout transition", () => {
		expect(resolveAnimatedBadgeMotion({ ...base, animateLayout: false })).toEqual({
			roll: true,
			resize: "spring",
			layout: false,
			pulse: false,
		});
	});
});

describe("motion constants", () => {
	// The exit is the wait before the new word shows. Long, and the badge lags the state it reports.
	test("the exit is quick", () => {
		expect(ROLL_OUT_MS).toBeGreaterThan(0);
		expect(ROLL_OUT_MS).toBeLessThan(200);
	});

	// A few points of travel reads as a roll. The capsule's width reads as a slide.
	test("the roll travels a few points, not the capsule", () => {
		expect(ROLL_DISTANCE).toBeGreaterThan(0);
		expect(ROLL_DISTANCE).toBeLessThanOrEqual(12);
	});

	test("the springs are damped and stiff enough to settle", () => {
		for (const spring of [ROLL_IN_SPRING, RESIZE_SPRING]) {
			expect(spring.damping).toBeGreaterThan(0);
			expect(spring.stiffness).toBeGreaterThan(0);
			expect(spring.mass).toBeGreaterThan(0);
		}
	});

	test("the pulse is slow and gentle", () => {
		expect(PULSE_CYCLE_MS).toBeGreaterThanOrEqual(1000);
		expect(PULSE_MIN_OPACITY).toBeGreaterThanOrEqual(0.4);
		expect(PULSE_MIN_OPACITY).toBeLessThan(1);
		expect(PULSE_MAX_SCALE).toBeGreaterThan(1);
		expect(PULSE_MAX_SCALE).toBeLessThanOrEqual(1.2);
	});
});
