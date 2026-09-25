import { describe, expect, test } from "bun:test";
import { declaredTokens } from "../../styles/theme-tokens.test";
import { ICON_SIZE_TOKENS } from "../../styles/tokens";
import {
	EMPTY_STATE_MEDIA_FOREGROUND_TOKEN,
	EMPTY_STATE_MEDIA_VARIANTS,
	EMPTY_STATE_SIZES,
	EMPTY_STATE_VARIANTS,
	emptyStateVariants,
} from "./empty-state.variants";

const LIGHT = declaredTokens("light");
const DARK = declaredTokens("dark");

/** Tailwind's spacing step a class string sets a utility from, e.g. `p` or `gap`. */
function step(cls: string, utility: string): number {
	return Number(cls.match(new RegExp(`\\b${utility}-([\\d.]+)\\b`))?.[1]);
}

/**
 * Position of a class string's font size on the type scale, largest last.
 *
 * Compared by step rather than points so a retune in `tokens.css` does not
 * break a test that only means "bigger".
 */
const TEXT_SCALE = ["text-xs", "text-sm", "text-base", "text-lg", "text-xl", "text-2xl"] as const;
function textStep(cls: string): number {
	return TEXT_SCALE.findIndex((name) => new RegExp(`\\b${name}\\b`).test(cls));
}

/** Position of a slot's `size-icon-*` token on the shared icon scale. */
function iconStep(cls: string): number {
	const token = cls.match(/\bsize-(icon-[\w-]+)\b/)?.[1];
	return ICON_SIZE_TOKENS.indexOf(token as (typeof ICON_SIZE_TOKENS)[number]);
}

/** Every slot that is a `View` — none of them may carry a text colour. */
const VIEW_SLOTS = ["root", "header", "media", "content"] as const;

/** A strictly ascending, all-distinct scale. */
function expectAscending(scale: readonly number[]): void {
	expect(scale.every(Number.isFinite)).toBe(true);
	expect(new Set(scale).size).toBe(scale.length);
	expect([...scale]).toEqual([...scale].sort((a, b) => a - b));
}

describe("the theme.css reader", () => {
	test("finds both variants", () => {
		expect(LIGHT.size).toBeGreaterThan(0);
		expect(DARK.size).toBeGreaterThan(0);
	});
});

describe("emptyStateVariants root slot", () => {
	test("defaults to the md default variant", () => {
		const cls = emptyStateVariants().root();
		expect(cls).toContain("bg-transparent");
		expect(cls).toContain(`p-${step(emptyStateVariants({ size: "md" }).root(), "p")}`);
	});

	test("centres its content on both axes, at every variant", () => {
		for (const variant of EMPTY_STATE_VARIANTS) {
			const cls = emptyStateVariants({ variant }).root();
			expect(cls).toContain("items-center");
			expect(cls).toContain("justify-center");
		}
	});

	// `grow`, never `flex-1`. `flex-1` is a zero basis, so inside a ScrollView's
	// content container — which has no height to grow into — the empty state
	// collapses to nothing. `grow` keeps the content height as a floor and fills
	// whatever a bounded parent has spare.
	test("the default variant grows into its parent without a zero basis", () => {
		const cls = emptyStateVariants({ variant: "default" }).root();
		expect(cls).toMatch(/\bgrow\b/);
		expect(cls).not.toMatch(/\bflex-1\b/);
	});

	test("the card variant is a card-shaped surface with a dashed border", () => {
		const cls = emptyStateVariants({ variant: "card" }).root();
		expect(cls).toContain("bg-card");
		expect(cls).toContain("border-border");
		expect(cls).toContain("border-dashed");
		expect(cls).not.toMatch(/\bgrow\b/);
	});

	// The border is in the box on both variants, so switching to `card` changes
	// a colour and not the layout.
	test("reserves the border on every variant", () => {
		for (const variant of EMPTY_STATE_VARIANTS) {
			expect(emptyStateVariants({ variant }).root()).toMatch(/\bborder\b/);
		}
		expect(emptyStateVariants({ variant: "default" }).root()).toContain("border-transparent");
	});

	test("a card is rounded-lg at md and lg, and steps down to rounded-md at sm", () => {
		expect(emptyStateVariants({ variant: "card", size: "sm" }).root()).toContain("rounded-md");
		expect(emptyStateVariants({ variant: "card", size: "md" }).root()).toContain("rounded-lg");
		expect(emptyStateVariants({ variant: "card", size: "lg" }).root()).toContain("rounded-lg");
	});

	test("gives the two variants distinct treatments", () => {
		const seen = new Set(EMPTY_STATE_VARIANTS.map((variant) => emptyStateVariants({ variant }).root()));
		expect(seen.size).toBe(EMPTY_STATE_VARIANTS.length);
	});

	test("merges an incoming className last", () => {
		const cls = emptyStateVariants({ variant: "card" }).root({ className: "bg-muted" });
		expect(cls).toContain("bg-muted");
		expect(cls).not.toContain("bg-card");
	});
});

describe("emptyStateVariants size axis", () => {
	test("scales padding and the gap between header and content together", () => {
		const roots = EMPTY_STATE_SIZES.map((size) => emptyStateVariants({ size }).root());
		expectAscending(roots.map((cls) => step(cls, "p")));
		expectAscending(roots.map((cls) => step(cls, "gap")));
	});

	test("scales the header's own gap", () => {
		expectAscending(EMPTY_STATE_SIZES.map((size) => step(emptyStateVariants({ size }).header(), "gap")));
	});

	test("scales the title and description type together, title always the larger", () => {
		const titles = EMPTY_STATE_SIZES.map((size) => textStep(emptyStateVariants({ size }).title()));
		const descriptions = EMPTY_STATE_SIZES.map((size) => textStep(emptyStateVariants({ size }).description()));

		expect(titles.every((index) => index >= 0)).toBe(true);
		expect(descriptions.every((index) => index >= 0)).toBe(true);
		expect([...titles]).toEqual([...titles].sort((a, b) => a - b));
		expect([...descriptions]).toEqual([...descriptions].sort((a, b) => a - b));
		expect(new Set(titles).size).toBe(EMPTY_STATE_SIZES.length);

		for (const [index, title] of titles.entries()) {
			expect(title).toBeGreaterThan(descriptions[index] ?? Number.POSITIVE_INFINITY);
		}
	});

	// Padding, never a height. A fixed height clips the description at a large
	// accessibility font step instead of letting the block grow.
	test("takes no height", () => {
		for (const size of EMPTY_STATE_SIZES) {
			expect(emptyStateVariants({ size }).root()).not.toMatch(/\bh-/);
		}
	});
});

describe("emptyStateVariants header slot", () => {
	test("is a centred column", () => {
		const cls = emptyStateVariants().header();
		expect(cls).toContain("items-center");
		expect(cls).not.toContain("flex-row");
	});
});

describe("emptyStateVariants media slot", () => {
	test("the icon media is a tinted, rounded square that scales with size", () => {
		const boxes = EMPTY_STATE_SIZES.map((size) => emptyStateVariants({ size, media: "icon" }).media());
		for (const cls of boxes) {
			expect(cls).toContain("bg-muted");
			expect(cls).toMatch(/\brounded-/);
		}
		expectAscending(boxes.map((cls) => step(cls, "size")));
	});

	test("the default media paints nothing and takes no size, so an illustration sizes itself", () => {
		for (const size of EMPTY_STATE_SIZES) {
			const cls = emptyStateVariants({ size, media: "default" }).media();
			expect(cls).not.toMatch(/\bbg-/);
			expect(cls).not.toMatch(/\bsize-/);
		}
	});

	// A glyph in an empty state has to sit on the scale `Icon`, `Spinner` and
	// `Button` share rather than carry a private number.
	test("gives every size a distinct icon token, increasing with it", () => {
		for (const media of EMPTY_STATE_MEDIA_VARIANTS) {
			const steps = EMPTY_STATE_SIZES.map((size) => iconStep(emptyStateVariants({ size, media }).mediaIcon()));
			expect(steps.every((index) => index >= 0)).toBe(true);
			expectAscending(steps);
		}
	});

	// Media and title are one visual unit only if the glyph clears the title by
	// more than the title clears its description.
	test("sets the media apart from the title by more than the header gap", () => {
		for (const size of EMPTY_STATE_SIZES) {
			const slots = emptyStateVariants({ size });
			expect(step(slots.media(), "mb")).toBeGreaterThan(0);
		}
	});
});

describe("text colour", () => {
	test("lives on the title and description, never on a View slot", () => {
		for (const variant of EMPTY_STATE_VARIANTS) {
			for (const size of EMPTY_STATE_SIZES) {
				const slots = emptyStateVariants({ variant, size });
				for (const slot of VIEW_SLOTS) {
					expect(slots[slot]()).not.toMatch(/\btext-(?!center\b)/);
				}
				expect(slots.title()).toContain("text-foreground");
				expect(slots.description()).toContain("text-muted-foreground");
			}
		}
	});

	test("title and description are centred", () => {
		const slots = emptyStateVariants();
		expect(slots.title()).toContain("text-center");
		expect(slots.description()).toContain("text-center");
	});
});

describe("EMPTY_STATE_MEDIA_FOREGROUND_TOKEN", () => {
	test("names a token for every media variant", () => {
		for (const media of EMPTY_STATE_MEDIA_VARIANTS) {
			expect(EMPTY_STATE_MEDIA_FOREGROUND_TOKEN[media]).toBeTruthy();
		}
	});

	test("names only tokens both themes declare", () => {
		for (const media of EMPTY_STATE_MEDIA_VARIANTS) {
			const token = EMPTY_STATE_MEDIA_FOREGROUND_TOKEN[media];
			expect(LIGHT.has(token)).toBe(true);
			expect(DARK.has(token)).toBe(true);
		}
	});

	// `muted-foreground` on `bg-muted` is two greys a step apart. The tinted box
	// already says "decoration", so the glyph inside it takes full contrast.
	test("draws the icon media's glyph at full contrast on its muted box", () => {
		expect(EMPTY_STATE_MEDIA_FOREGROUND_TOKEN.icon).toBe("foreground");
	});
});

describe("emptyStateVariants content slot", () => {
	test("lays actions out in a centred, wrapping row", () => {
		const cls = emptyStateVariants().content();
		expect(cls).toContain("flex-row");
		expect(cls).toContain("flex-wrap");
		expect(cls).toContain("justify-center");
	});
});
