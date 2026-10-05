import { describe, expect, test } from "bun:test";
import { declaredTokens } from "../../styles/theme-tokens.test";
import {
	POST_FILL_PATHS,
	POST_MEDIA_SCRIMS,
	POST_SIZES,
	POST_STAT_TONES,
	POST_VARIANTS,
	postVariants,
	resolveMediaScrim,
	resolveNextVote,
	resolvePostAvatarSize,
	resolvePostLayout,
	resolveScrimStops,
	resolveStatDirection,
	resolveStatTone,
	resolveVoteTone,
} from "./post.variants";

const LIGHT = declaredTokens("light");
const DARK = declaredTokens("dark");

/** Every slot of one resolved variant combination, as class strings. */
function allSlots(props: Parameters<typeof postVariants>[0]): string[] {
	const slots = postVariants(props);
	return Object.values(slots)
		.map((slot) => slot())
		.filter((cls): cls is string => typeof cls === "string");
}

/** Every slot's class string across the whole variant matrix. */
function everySlotClass(): string[] {
	const classes: string[] = [];
	const votes = ["none", "up", "down"] as const;
	for (const variant of POST_VARIANTS) {
		for (const size of POST_SIZES) {
			for (const tone of POST_STAT_TONES) {
				for (const vote of votes) {
					classes.push(...allSlots({ variant, size, tone, vote, active: true }));
					classes.push(...allSlots({ variant, size, tone, vote, active: false }));
				}
			}
		}
	}
	return classes;
}

/** Every theme colour token a class string names (`text-x`, `bg-x`, `border-x`). */
function colourTokens(cls: string): string[] {
	const tokens: string[] = [];
	for (const match of cls.matchAll(/\b(?:text|bg|border)-([a-z][a-z-]*)\b/g)) {
		const token = match[1] as string;
		if (/^(xs|sm|base|lg|xl|\d?xl|transparent|white|black|center|left|right)$/.test(token)) continue;
		tokens.push(token);
	}
	return tokens;
}

describe("resolveNextVote", () => {
	test.each([
		[null, "up", "up"],
		["up", "up", null],
		["up", "down", "down"],
		["down", "down", null],
		[null, "down", "down"],
		["down", "up", "up"],
	] as const)("(%p, %p) -> %p", (current, pressed, expected) => {
		expect(resolveNextVote(current, pressed)).toBe(expected);
	});
});

describe("resolveStatDirection", () => {
	test.each([
		[215, 216, "up"],
		[216, 215, "down"],
		[5, 5, "none"],
		["Save", 3, "none"],
		[3, "Save", "none"],
		[undefined, 3, "none"],
		[Number.NaN, 3, "none"],
		[3, Number.POSITIVE_INFINITY, "none"],
	] as const)("(%p, %p) -> %p", (prev, next, expected) => {
		expect(resolveStatDirection(prev, next)).toBe(expected);
	});
});

describe("resolvePostLayout", () => {
	test("compact has no media and puts the handle inline", () => {
		expect(resolvePostLayout("compact")).toEqual({
			hasMedia: false,
			handleInline: true,
			mediaScrimDefault: "none",
			authorOverMedia: false,
		});
	});

	test("media lays the author over the picture under a top scrim", () => {
		expect(resolvePostLayout("media")).toEqual({
			hasMedia: true,
			handleInline: false,
			mediaScrimDefault: "top",
			authorOverMedia: true,
		});
	});

	test("feed and vote are plain cards with media", () => {
		for (const variant of ["feed", "vote"] as const) {
			expect(resolvePostLayout(variant)).toEqual({
				hasMedia: true,
				handleInline: false,
				mediaScrimDefault: "none",
				authorOverMedia: false,
			});
		}
	});
});

describe("resolveMediaScrim", () => {
	test("defaults by variant", () => {
		expect(resolveMediaScrim("media")).toBe("top");
		expect(resolveMediaScrim("feed")).toBe("none");
		expect(resolveMediaScrim("vote")).toBe("none");
	});

	test("an explicit scrim wins", () => {
		expect(resolveMediaScrim("media", "none")).toBe("none");
		expect(resolveMediaScrim("feed", "both")).toBe("both");
	});
});

describe("resolveScrimStops", () => {
	test("each scrim names which edges darken", () => {
		expect(resolveScrimStops("none")).toEqual({ top: false, bottom: false });
		expect(resolveScrimStops("top")).toEqual({ top: true, bottom: false });
		expect(resolveScrimStops("bottom")).toEqual({ top: false, bottom: true });
		expect(resolveScrimStops("both")).toEqual({ top: true, bottom: true });
	});

	test("covers every scrim", () => {
		for (const scrim of POST_MEDIA_SCRIMS) expect(resolveScrimStops(scrim)).toBeDefined();
	});
});

describe("resolveStatTone", () => {
	test("unlit is always muted", () => {
		for (const tone of POST_STAT_TONES) expect(resolveStatTone(tone, false)).toBe("muted-foreground");
	});

	test("lit tones", () => {
		expect(resolveStatTone("like", true)).toBe("destructive");
		expect(resolveStatTone("save", true)).toBe("primary");
		expect(resolveStatTone("repost", true)).toBe("success");
		expect(resolveStatTone("neutral", true)).toBe("foreground");
	});

	test("every token exists in both themes", () => {
		for (const tone of POST_STAT_TONES) {
			for (const active of [true, false]) {
				const token = resolveStatTone(tone, active);
				expect(LIGHT.has(token)).toBe(true);
				expect(DARK.has(token)).toBe(true);
			}
		}
	});
});

describe("resolveVoteTone", () => {
	test("the cast direction tints", () => {
		expect(resolveVoteTone(null)).toBe("muted-foreground");
		expect(resolveVoteTone("up")).toBe("warning-soft-foreground");
		expect(resolveVoteTone("down")).toBe("info-soft-foreground");
	});

	test("every vote token exists in both themes", () => {
		for (const vote of [null, "up", "down"] as const) {
			expect(LIGHT.has(resolveVoteTone(vote))).toBe(true);
			expect(DARK.has(resolveVoteTone(vote))).toBe(true);
		}
	});

	test("the pill tints with the cast arrow", () => {
		const none = postVariants({ vote: "none" }).votes();
		const up = postVariants({ vote: "up" }).votes();
		const down = postVariants({ vote: "down" }).votes();
		expect(new Set([none, up, down]).size).toBe(3);
		expect(up).toMatch(/\bbg-warning-soft\b/);
		expect(down).toMatch(/\bbg-info-soft\b/);
	});
});

describe("resolvePostAvatarSize", () => {
	test("sm steps the face down", () => {
		expect(resolvePostAvatarSize("default", "feed")).toBe("md");
		expect(resolvePostAvatarSize("sm", "feed")).toBe("sm");
	});

	test("compact is always the small face", () => {
		expect(resolvePostAvatarSize("default", "compact")).toBe("sm");
	});
});

describe("POST_FILL_PATHS", () => {
	test("every path is non-empty SVG path data", () => {
		for (const path of Object.values(POST_FILL_PATHS)) {
			expect(path).toMatch(/^M[\d.\sMCLHVZcvlhzm-]+$/);
		}
	});
});

describe("postVariants", () => {
	test("every tone x active cell has a colour on the value", () => {
		for (const tone of POST_STAT_TONES) {
			for (const active of [true, false]) {
				expect(postVariants({ tone, active }).statValue()).toMatch(
					/\btext-[a-z-]*foreground|text-(destructive|primary|success)\b/
				);
			}
		}
	});

	test("lit and unlit values differ for every tone but neutral's colour", () => {
		for (const tone of POST_STAT_TONES) {
			const lit = postVariants({ tone, active: true }).statValue();
			const unlit = postVariants({ tone, active: false }).statValue();
			expect(lit).not.toBe(unlit);
		}
	});

	test("compact hides the media slot", () => {
		const display = /(^|\s)hidden(\s|$)/;
		expect(postVariants({ variant: "compact" }).media()).toMatch(display);
		for (const variant of ["feed", "vote", "media"] as const) {
			expect(postVariants({ variant }).media()).not.toMatch(display);
		}
	});

	test("the root never aligns itself", () => {
		for (const variant of POST_VARIANTS) {
			for (const size of POST_SIZES) {
				expect(postVariants({ variant, size }).root()).not.toMatch(/\bself-/);
			}
		}
	});

	test("feed, vote and compact are bordered cards; media is not", () => {
		for (const variant of ["feed", "vote", "compact"] as const) {
			const root = postVariants({ variant }).root();
			expect(root).toMatch(/\bborder\b/);
			expect(root).toMatch(/\bbg-card\b/);
			expect(root).toMatch(/\brounded-lg\b/);
		}
		const media = postVariants({ variant: "media" }).root();
		expect(media).not.toMatch(/\bborder\b/);
		expect(media).toMatch(/\boverflow-hidden\b/);
	});

	test("media lays the header over the picture", () => {
		expect(postVariants({ variant: "media" }).header()).toMatch(/\babsolute\b/);
		expect(postVariants({ variant: "feed" }).header()).not.toMatch(/\babsolute\b/);
	});

	test("text over a photograph is white; everywhere else it is a token", () => {
		expect(postVariants({ variant: "media" }).authorName()).toMatch(/\btext-white\b/);
		expect(postVariants({ variant: "feed" }).authorName()).toMatch(/\btext-foreground\b/);
		expect(postVariants({ variant: "feed" }).authorHandle()).toMatch(/\btext-muted-foreground\b/);
	});

	test("sm steps the body text down", () => {
		expect(postVariants({ size: "default" }).body()).toMatch(/\btext-base\b/);
		expect(postVariants({ size: "sm" }).body()).toMatch(/\btext-sm\b/);
	});

	test("no slot uses dark: or a raw palette colour", () => {
		for (const cls of everySlotClass()) {
			expect(cls).not.toMatch(/\bdark:/);
			expect(cls).not.toMatch(/-(slate|gray|zinc|neutral|stone|red|blue|green|amber|emerald|rose)-\d{2,3}\b/);
		}
	});

	test("every colour token a slot names exists in both themes", () => {
		for (const token of new Set(everySlotClass().flatMap(colourTokens))) {
			expect({ token, light: LIGHT.has(token) }).toEqual({ token, light: true });
			expect({ token, dark: DARK.has(token) }).toEqual({ token, dark: true });
		}
	});

	test("only the value and score text slots carry colour among the stat parts' views", () => {
		const slots = postVariants({ tone: "like", active: true });
		expect(slots.stat()).not.toMatch(/\btext-/);
		expect(slots.votes()).not.toMatch(/\btext-(?!xs|sm|base)/);
	});
});
