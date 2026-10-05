import { describe, expect, test } from "bun:test";
import { declaredTokens } from "../../styles/theme-tokens.test";
import { AVATAR_SIZE_POINTS } from "../avatar/avatar.variants";
import {
	PAGE_HEADER_ALIGNS,
	PAGE_HEADER_COVER_HEIGHT,
	PAGE_HEADER_RING_WIDTH,
	PAGE_HEADER_STATS_LAYOUTS,
	PAGE_HEADER_TOKENS,
	PAGE_HEADER_VARIANTS,
	pageHeaderVariants,
	resolvePageHeaderAvatarSize,
	resolvePageHeaderCoverHeight,
	resolvePageHeaderCoverOffset,
	resolvePageHeaderOverlap,
	resolvePageHeaderRing,
	resolvePageHeaderTopPadding,
} from "./page-header.variants";

const LIGHT = declaredTokens("light");
const DARK = declaredTokens("dark");

/** Every slot's class string for one combination of axes. */
function allSlots(props: Parameters<typeof pageHeaderVariants>[0]): string[] {
	const slots = pageHeaderVariants(props);
	return Object.values(slots).map((slot) => slot() ?? "");
}

function everyCombination(): Parameters<typeof pageHeaderVariants>[0][] {
	const combos: Parameters<typeof pageHeaderVariants>[0][] = [];
	for (const variant of PAGE_HEADER_VARIANTS) {
		for (const align of PAGE_HEADER_ALIGNS) {
			for (const layout of PAGE_HEADER_STATS_LAYOUTS) {
				for (const isBleeding of [true, false]) {
					combos.push({ variant, align, layout, isBleeding });
				}
			}
		}
	}
	return combos;
}

describe("resolvePageHeaderAvatarSize", () => {
	test("a centred header leads with the 96-point face", () => {
		expect(resolvePageHeaderAvatarSize("center")).toBe("2xl");
	});

	test("a leading-edge header uses the 64-point face", () => {
		expect(resolvePageHeaderAvatarSize("start")).toBe("xl");
	});

	test("an explicit size wins", () => {
		expect(resolvePageHeaderAvatarSize("start", "lg")).toBe("lg");
		expect(resolvePageHeaderAvatarSize("center", "sm")).toBe("sm");
	});
});

describe("resolvePageHeaderOverlap", () => {
	test("lifts the ringed face by half itself, so its middle sits on the cover's edge", () => {
		expect(resolvePageHeaderOverlap({ avatarSize: "2xl", ringWidth: 4, hasCover: true })).toBe(-52);
		expect(resolvePageHeaderOverlap({ avatarSize: "xl", ringWidth: 4, hasCover: true })).toBe(
			-(AVATAR_SIZE_POINTS.xl / 2 + 4)
		);
	});

	test("does nothing with no cover to lap", () => {
		expect(resolvePageHeaderOverlap({ avatarSize: "2xl", ringWidth: 4, hasCover: false })).toBe(0);
		expect(resolvePageHeaderOverlap({ avatarSize: "2xl", ringWidth: 4, hasCover: false, isOverlapping: true })).toBe(0);
	});

	test("an explicit opt-out wins over a cover", () => {
		expect(resolvePageHeaderOverlap({ avatarSize: "2xl", ringWidth: 4, hasCover: true, isOverlapping: false })).toBe(0);
	});
});

describe("resolvePageHeaderCoverHeight", () => {
	test("a page cover grows by the inset it sits under", () => {
		expect(resolvePageHeaderCoverHeight({ variant: "page", height: 128, topInset: 59, isInsetAware: true })).toBe(187);
	});

	test("unless told not to", () => {
		expect(resolvePageHeaderCoverHeight({ variant: "page", height: 128, topInset: 59, isInsetAware: false })).toBe(128);
	});

	test("a card never extends under the status bar", () => {
		expect(resolvePageHeaderCoverHeight({ variant: "card", height: 128, topInset: 59, isInsetAware: true })).toBe(128);
	});

	test("a negative height or inset is clamped to nothing", () => {
		expect(resolvePageHeaderCoverHeight({ variant: "page", height: -10, topInset: -5, isInsetAware: true })).toBe(0);
	});
});

describe("resolvePageHeaderCoverOffset", () => {
	test("inside a Screen, a page cover is pulled up under the scrollable's top spacer", () => {
		expect(resolvePageHeaderCoverOffset({ variant: "page", isInsetAware: true, isInScreen: true, topInset: 103 })).toBe(
			-103
		);
	});

	test("outside a Screen there is no spacer to pull under", () => {
		expect(resolvePageHeaderCoverOffset({ variant: "page", isInsetAware: true, isInScreen: false, topInset: 59 })).toBe(
			0
		);
	});

	test("a card, or an inset-blind cover, stays where it is", () => {
		expect(resolvePageHeaderCoverOffset({ variant: "card", isInsetAware: true, isInScreen: true, topInset: 103 })).toBe(
			0
		);
		expect(
			resolvePageHeaderCoverOffset({ variant: "page", isInsetAware: false, isInScreen: true, topInset: 103 })
		).toBe(0);
	});
});

describe("resolvePageHeaderTopPadding", () => {
	test("a coverless page outside a Screen clears the status bar itself", () => {
		expect(resolvePageHeaderTopPadding({ variant: "page", hasCover: false, isInScreen: false, safeAreaTop: 59 })).toBe(
			59
		);
	});

	test("inside a Screen the scrollable's spacer already does", () => {
		expect(resolvePageHeaderTopPadding({ variant: "page", hasCover: false, isInScreen: true, safeAreaTop: 59 })).toBe(
			0
		);
	});

	test("a cover, or a card, never needs it", () => {
		expect(resolvePageHeaderTopPadding({ variant: "page", hasCover: true, isInScreen: false, safeAreaTop: 59 })).toBe(
			0
		);
		expect(resolvePageHeaderTopPadding({ variant: "card", hasCover: false, isInScreen: false, safeAreaTop: 59 })).toBe(
			0
		);
	});
});

describe("resolvePageHeaderRing", () => {
	test("the ring is the fill the header sits on", () => {
		expect(resolvePageHeaderRing("card")).toBe("bg-card");
		expect(resolvePageHeaderRing("page")).toBe("bg-background");
	});

	test("matches the avatarRing slot", () => {
		for (const variant of PAGE_HEADER_VARIANTS) {
			expect(pageHeaderVariants({ variant }).avatarRing()).toContain(resolvePageHeaderRing(variant));
		}
	});

	test("PAGE_HEADER_RING_WIDTH is the ring slot's padding", () => {
		// The overlap is computed from the number; a class that drifted would lift
		// the face off-centre against the cover's edge.
		const ring = pageHeaderVariants().avatarRing();
		const step = Number(ring.match(/\bp-([\d.]+)\b/)?.[1]);
		expect(step * 4).toBe(PAGE_HEADER_RING_WIDTH);
	});

	test("the default cover height is 128 points", () => {
		expect(PAGE_HEADER_COVER_HEIGHT).toBe(128);
	});
});

describe("pageHeaderVariants", () => {
	test("a card root is clipped by its corner; a page root is neither", () => {
		const card = pageHeaderVariants({ variant: "card" }).root();
		const page = pageHeaderVariants({ variant: "page" }).root();
		expect(card).toContain("rounded-lg");
		expect(card).toContain("overflow-hidden");
		expect(page).not.toContain("rounded-lg");
		expect(page).not.toContain("overflow-hidden");
	});

	test("a page root bleeds past the screen gutter only when asked", () => {
		expect(pageHeaderVariants({ variant: "page", isBleeding: true }).root()).toContain("-mx-screen-gutter");
		expect(pageHeaderVariants({ variant: "page", isBleeding: false }).root()).not.toContain("-mx-screen-gutter");
		expect(pageHeaderVariants({ variant: "card", isBleeding: true }).root()).not.toContain("-mx-screen-gutter");
	});

	test("page content sits on the screen gutter", () => {
		const slots = pageHeaderVariants({ variant: "page" });
		for (const slot of [slots.content(), slots.actions(), slots.stats()]) {
			expect(slot).toContain("px-screen-gutter");
		}
	});

	test("no combination casts a shadow, overrides its parent's alignment or names a theme", () => {
		for (const combo of everyCombination()) {
			for (const cls of allSlots(combo)) {
				expect(cls).not.toMatch(/\bshadow-/);
				expect(cls).not.toMatch(/\bself-/);
				expect(cls).not.toMatch(/\bdark:/);
			}
		}
	});

	test("the title owns its text treatment; the root carries none", () => {
		for (const align of PAGE_HEADER_ALIGNS) {
			const slots = pageHeaderVariants({ align });
			expect(slots.title()).toMatch(/\btext-/);
			expect(slots.root()).not.toMatch(/\btext-/);
			expect(slots.content()).not.toMatch(/\btext-/);
			expect(slots.stats()).not.toMatch(/\btext-/);
		}
	});

	test("center centres the column and its text; start sits on the leading edge", () => {
		const center = pageHeaderVariants({ align: "center" });
		expect(center.root()).toContain("items-center");
		expect(center.content()).toContain("items-center");
		expect(center.title()).toContain("text-center");
		expect(center.description()).toContain("text-center");
		expect(center.actions()).toContain("justify-center");

		const start = pageHeaderVariants({ align: "start" });
		expect(start.root()).toContain("items-start");
		expect(start.content()).toContain("items-start");
		expect(start.title()).not.toContain("text-center");
		expect(start.actions()).toContain("justify-start");
	});

	test("stacked stats are equal-width cells, so the middle one stays under the title", () => {
		for (const align of PAGE_HEADER_ALIGNS) {
			const slots = pageHeaderVariants({ align, layout: "stacked" });
			expect(slots.stat()).toContain("flex-1");
			expect(slots.stats()).toContain("w-full");
		}
		expect(pageHeaderVariants({ layout: "inline" }).stat()).not.toContain("flex-1");
	});

	test("inline stats run value and label together", () => {
		const slots = pageHeaderVariants({ layout: "inline" });
		expect(slots.stat()).toContain("flex-row");
		expect(slots.stats()).toContain("gap-4");
	});

	test("full-width parts never collapse in a centred column", () => {
		const slots = pageHeaderVariants({ align: "center" });
		for (const slot of [slots.cover(), slots.content(), slots.actions(), slots.stats()]) {
			expect(slot).toContain("w-full");
		}
	});

	test("the divider is a hairline on the border token", () => {
		for (const layout of PAGE_HEADER_STATS_LAYOUTS) {
			const divider = pageHeaderVariants({ layout }).divider();
			expect(divider).toContain("w-px");
			expect(divider).toContain("bg-border");
		}
	});

	test("the cover clips its picture and paints a fallback under it", () => {
		const slots = pageHeaderVariants();
		expect(slots.cover()).toContain("overflow-hidden");
		expect(slots.coverFallback()).toContain("absolute");
	});
});

describe("tokens", () => {
	test("every token the header names is declared in both themes", () => {
		for (const token of PAGE_HEADER_TOKENS) {
			expect(LIGHT.has(token)).toBe(true);
			expect(DARK.has(token)).toBe(true);
		}
	});

	test("every colour class the slots use is in PAGE_HEADER_TOKENS", () => {
		const named = new Set<string>(PAGE_HEADER_TOKENS);
		for (const combo of everyCombination()) {
			for (const cls of allSlots(combo)) {
				for (const [, token] of cls.matchAll(
					/\b(?:bg|border|text)-((?:[a-z]+-)*(?:background|foreground|card|border|primary))\b/g
				)) {
					expect(named.has(token ?? "")).toBe(true);
				}
			}
		}
	});
});
