import { describe, expect, test } from "bun:test";
import { declaredTokens } from "../../styles/theme-tokens.test";
import { ICON_SIZE_TOKENS } from "../../styles/tokens";
import {
	AVATAR_BADGE_PLACEMENTS,
	AVATAR_COLORS,
	AVATAR_FOREGROUND_TOKEN,
	AVATAR_SIZE_POINTS,
	AVATAR_SIZES,
	AVATAR_VARIANTS,
	avatarVariants,
	resolveAvatarInteractive,
	resolveAvatarOverlap,
	resolveAvatarSize,
} from "./avatar.variants";

const LIGHT = declaredTokens("light");
const DARK = declaredTokens("dark");

/** The `size-N` step a class string sets its edge from, in points (Tailwind's 4pt spacing unit). */
function edgeOf(cls: string): number {
	return Number(cls.match(/\bsize-(\d+)\b/)?.[1]) * 4;
}

/** The `text-*` colour token a class string resolves to, minus the prefix. */
function colorToken(cls: string): string | undefined {
	return cls.match(/\btext-((?:[a-z]+-)*(?:foreground|background))\b/)?.[1];
}

/** The `bg-*` token a class string fills with, minus the prefix. */
function fillToken(cls: string): string | undefined {
	return cls.match(/\bbg-([a-z-]+)\b/)?.[1];
}

/** Position of a slot's `size-icon-*` token on the shared icon scale. */
function iconStep(cls: string): number {
	const token = cls.match(/\bsize-(icon-[\w-]+)\b/)?.[1];
	return ICON_SIZE_TOKENS.indexOf(token as (typeof ICON_SIZE_TOKENS)[number]);
}

const TEXT_SCALE = ["text-xs", "text-sm", "text-base", "text-lg", "text-xl", "text-2xl"] as const;
function textStep(cls: string): number {
	return TEXT_SCALE.findIndex((step) => new RegExp(`\\b${step}\\b`).test(cls));
}

describe("sizes", () => {
	test("the face's class and AVATAR_SIZE_POINTS agree at every size", () => {
		// The group computes its overlap in points; a class that drifted from the
		// number would slide faces too far or not far enough.
		for (const size of AVATAR_SIZES) {
			expect(edgeOf(avatarVariants({ size }).face())).toBe(AVATAR_SIZE_POINTS[size]);
		}
	});

	test("the scale ascends", () => {
		const points = AVATAR_SIZES.map((size) => AVATAR_SIZE_POINTS[size]);
		expect([...points].sort((a, b) => a - b)).toEqual(points);
		expect(new Set(points).size).toBe(points.length);
	});

	test("the fallback text and glyph grow with the face", () => {
		const text = AVATAR_SIZES.map((size) => textStep(avatarVariants({ size }).fallbackLabel()));
		const icons = AVATAR_SIZES.map((size) => iconStep(avatarVariants({ size }).icon()));
		for (const step of [...text, ...icons]) expect(step).toBeGreaterThanOrEqual(0);
		expect([...text].sort((a, b) => a - b)).toEqual(text);
		expect([...icons].sort((a, b) => a - b)).toEqual(icons);
	});

	test("the overflow tile is the same edge as a face", () => {
		for (const size of AVATAR_SIZES) {
			const slots = avatarVariants({ size });
			expect(edgeOf(slots.overflow())).toBe(edgeOf(slots.face()));
		}
	});
});

describe("colour matrix", () => {
	test("every variant × colour cell is distinct", () => {
		const seen = new Set<string>();
		for (const variant of AVATAR_VARIANTS) {
			for (const color of AVATAR_COLORS) {
				const slots = avatarVariants({ variant, color });
				seen.add(`${slots.face()}|${slots.fallbackLabel()}`);
			}
		}
		expect(seen.size).toBe(AVATAR_VARIANTS.length * AVATAR_COLORS.length);
	});

	test("every cell fills its face and colours its label", () => {
		for (const variant of AVATAR_VARIANTS) {
			for (const color of AVATAR_COLORS) {
				const slots = avatarVariants({ variant, color });
				expect(fillToken(slots.face())).toBeDefined();
				expect(colorToken(slots.fallbackLabel())).toBeDefined();
			}
		}
	});

	test("AVATAR_FOREGROUND_TOKEN names the token the label resolves to", () => {
		// A glyph fallback and a text fallback must be the same shade.
		for (const variant of AVATAR_VARIANTS) {
			for (const color of AVATAR_COLORS) {
				expect(AVATAR_FOREGROUND_TOKEN[variant][color]).toBe(
					colorToken(avatarVariants({ variant, color }).fallbackLabel()) ?? ""
				);
			}
		}
	});

	test("every token the matrix names is declared in both themes", () => {
		for (const variant of AVATAR_VARIANTS) {
			for (const color of AVATAR_COLORS) {
				const slots = avatarVariants({ variant, color });
				for (const token of [fillToken(slots.face()), colorToken(slots.fallbackLabel())]) {
					expect(LIGHT.has(token ?? "")).toBe(true);
					expect(DARK.has(token ?? "")).toBe(true);
				}
			}
		}
	});
});

describe("structure", () => {
	test("the face clips and the root does not", () => {
		// A badge pinned to the corner hangs outside the circle; clipping the root
		// would cut it in half.
		const slots = avatarVariants();
		expect(slots.face()).toContain("overflow-hidden");
		expect(slots.face()).toContain("rounded-full");
		expect(slots.root()).not.toContain("overflow-hidden");
	});

	test("the root sizes to its content and is not stretched by a column", () => {
		expect(avatarVariants().root()).toContain("self-start");
	});

	test("no view slot carries a text colour", () => {
		// A React Native View does not cascade colour to a Text descendant.
		const slots = avatarVariants();
		for (const slot of [slots.root(), slots.face(), slots.badge(), slots.group(), slots.groupItem()]) {
			expect(colorToken(slot)).toBeUndefined();
		}
	});

	test("a disabled avatar fades", () => {
		expect(avatarVariants({ isDisabled: true }).root()).toContain("opacity-50");
		expect(avatarVariants({ isDisabled: false }).root()).not.toContain("opacity-50");
	});

	test("a group ring is the page background, so it reads on any surface", () => {
		// The overflow tile is wrapped in the same item, so it wears the same ring
		// and lines up with the faces rather than sitting four points smaller.
		expect(avatarVariants().groupItem()).toContain("border-background");
		expect(avatarVariants().overflow()).not.toContain("border");
	});

	test("every badge placement pins to a different corner", () => {
		const classes = AVATAR_BADGE_PLACEMENTS.map((placement) => avatarVariants({ placement }).badge());
		expect(new Set(classes).size).toBe(AVATAR_BADGE_PLACEMENTS.length);
		for (const cls of classes) expect(cls).toContain("absolute");
	});

	test("the presence dot grows with the face", () => {
		const dots = AVATAR_SIZES.map((size) =>
			Number(
				avatarVariants({ size })
					.dot()
					.match(/\bsize-([\d.]+)\b/)?.[1]
			)
		);
		for (const dot of dots) expect(Number.isFinite(dot)).toBe(true);
		expect([...dots].sort((a, b) => a - b)).toEqual(dots);
	});
});

describe("resolveAvatarSize", () => {
	test("the avatar's own size wins", () => {
		expect(resolveAvatarSize({ size: "sm", groupSize: "xl" })).toBe("sm");
	});

	test("then the enclosing group's", () => {
		expect(resolveAvatarSize({ groupSize: "lg" })).toBe("lg");
	});

	test("then md", () => {
		expect(resolveAvatarSize({})).toBe("md");
	});
});

describe("resolveAvatarOverlap", () => {
	test("defaults to a third of the face, rounded", () => {
		for (const size of AVATAR_SIZES) {
			expect(resolveAvatarOverlap({ size })).toBe(Math.round(AVATAR_SIZE_POINTS[size] / 3));
		}
	});

	test("an explicit overlap wins, and 0 closes the stack into a row", () => {
		expect(resolveAvatarOverlap({ size: "md", overlap: 6 })).toBe(6);
		expect(resolveAvatarOverlap({ size: "md", overlap: 0 })).toBe(0);
	});

	test("never slides a face further than its own edge, nor backwards", () => {
		expect(resolveAvatarOverlap({ size: "md", overlap: 999 })).toBe(AVATAR_SIZE_POINTS.md);
		expect(resolveAvatarOverlap({ size: "md", overlap: -4 })).toBe(0);
		expect(resolveAvatarOverlap({ size: "md", overlap: Number.NaN })).toBe(Math.round(AVATAR_SIZE_POINTS.md / 3));
	});
});

describe("resolveAvatarInteractive", () => {
	test("is inert with no handler", () => {
		expect(resolveAvatarInteractive({})).toBe(false);
	});

	test("becomes pressable with either handler", () => {
		expect(resolveAvatarInteractive({ onPress: () => {} })).toBe(true);
		expect(resolveAvatarInteractive({ onLongPress: () => {} })).toBe(true);
	});
});
