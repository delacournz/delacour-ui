import { describe, expect, test } from "bun:test";
import { createElement, Fragment, type ReactNode } from "react";
import { SURFACE_FILLED_VARIANTS } from "../surface/surface.variants";
import {
	CARD_FOOTER_VARIANTS,
	CARD_PLANES,
	CARD_SIZES,
	cardVariants,
	resolveCardFooterFill,
	splitCardHeaderChildren,
} from "./card.variants";

/** Every slot the variant function can produce, one call per combination. */
function everyCombination(): ReturnType<typeof cardVariants>[] {
	return CARD_SIZES.flatMap((size) =>
		CARD_PLANES.flatMap((plane) =>
			CARD_FOOTER_VARIANTS.flatMap((footer) =>
				SURFACE_FILLED_VARIANTS.map((footerFill) => cardVariants({ footer, footerFill, plane, size }))
			)
		)
	);
}

/** The numeric step of the first `${prefix}-N` utility in a class string. */
function step(cls: string, prefix: string): string | undefined {
	return cls.match(new RegExp(`(?:^|\\s)${prefix}-(\\d+(?:\\.5)?)(?:\\s|$)`))?.[1];
}

describe("cardVariants root slot", () => {
	// The padding lives on the parts, so the root carries only the vertical
	// rhythm between them — horizontal padding here would stop a bled image
	// reaching the card's side edges.
	test("carries no horizontal padding at any size", () => {
		for (const size of CARD_SIZES) {
			const cls = cardVariants({ size }).root();
			expect(cls).not.toMatch(/(^|\s)(p|px|pl|pr)-/);
		}
	});

	test("spaces its parts by the same step it pads its top and bottom", () => {
		for (const size of CARD_SIZES) {
			const cls = cardVariants({ size }).root();
			expect(step(cls, "pt")).toBeDefined();
			expect(step(cls, "pb")).toBe(step(cls, "pt"));
			expect(step(cls, "gap")).toBe(step(cls, "pt"));
		}
	});

	// The card sits on a `padding="none"` surface, whose root carries `p-0`.
	// Uniwind resolves that shorthand over a `py-*` on the same view, so the
	// card's vertical padding vanished on a device; the longhands hold.
	test("pads top and bottom with longhands, never the py shorthand", () => {
		for (const size of CARD_SIZES) {
			expect(cardVariants({ size }).root()).not.toMatch(/(^|\s)py-/);
		}
	});

	// Rule 1: a React Native View does not cascade colour to a Text descendant.
	test("carries no text treatment on the root, header, content or footer", () => {
		for (const slots of everyCombination()) {
			for (const cls of [slots.root(), slots.header(), slots.content(), slots.footer()]) {
				expect(cls).not.toMatch(/(^|\s)text-/);
			}
		}
	});

	test("merges an incoming className last", () => {
		expect(cardVariants().root({ className: "pt-0" })).toContain("pt-0");
		expect(cardVariants().root({ className: "gap-8" })).not.toMatch(/(^|\s)gap-4(\s|$)/);
	});
});

describe("cardVariants size", () => {
	test("defaults to md", () => {
		expect(cardVariants().root()).toBe(cardVariants({ size: "md" }).root());
		expect(cardVariants().title()).toBe(cardVariants({ size: "md" }).title());
	});

	test("matches Surface's padding steps: 3, 4 and 6", () => {
		expect(step(cardVariants({ size: "sm" }).root(), "pt")).toBe("3");
		expect(step(cardVariants({ size: "md" }).root(), "pt")).toBe("4");
		expect(step(cardVariants({ size: "lg" }).root(), "pt")).toBe("6");
	});

	// The header, the body and the footer have to line up on one inset, or the
	// title sits a few points off the button beneath it.
	test("header, content and footer share one horizontal inset, equal to the vertical one", () => {
		for (const size of CARD_SIZES) {
			const slots = cardVariants({ size });
			const inset = step(slots.root(), "pt");
			expect(step(slots.header(), "px")).toBe(inset);
			expect(step(slots.content(), "px")).toBe(inset);
			expect(step(slots.footer(), "px")).toBe(inset);
		}
	});

	test("steps the title and description type scale with the size", () => {
		expect(cardVariants({ size: "sm" }).title()).toContain("text-sm");
		expect(cardVariants({ size: "md" }).title()).toContain("text-base");
		expect(cardVariants({ size: "lg" }).title()).toContain("text-lg");
		expect(cardVariants({ size: "sm" }).description()).toContain("text-xs");
		expect(cardVariants({ size: "md" }).description()).toContain("text-sm");
		expect(cardVariants({ size: "lg" }).description()).toContain("text-base");
	});

	test("gives every size a distinct root", () => {
		const seen = new Set(CARD_SIZES.map((size) => cardVariants({ size }).root()));
		expect(seen.size).toBe(CARD_SIZES.length);
	});
});

describe("cardVariants title and description", () => {
	test("the title is the X-foreground token of the plane it sits on", () => {
		expect(cardVariants({ plane: "default" }).title()).toContain("text-card-foreground");
		expect(cardVariants({ plane: "secondary" }).title()).toContain("text-secondary-foreground");
		expect(cardVariants({ plane: "tertiary" }).title()).toContain("text-tertiary-foreground");
		expect(cardVariants({ plane: "none" }).title()).toContain("text-foreground");
	});

	test("the title is semibold at every size", () => {
		for (const size of CARD_SIZES) {
			expect(cardVariants({ size }).title()).toContain("font-semibold");
		}
	});

	test("the description sits on the muted token on every plane", () => {
		for (const plane of CARD_PLANES) {
			expect(cardVariants({ plane }).description()).toContain("text-muted-foreground");
		}
	});

	// Two colour classes on one Text and tailwind-merge keeps only the last —
	// which would be a page colour, not the plane's.
	test("the title carries exactly one text colour", () => {
		for (const slots of everyCombination()) {
			const colours = slots
				.title()
				.split(/\s+/)
				.filter((name) => /^text-(card|secondary|tertiary|foreground|muted)/.test(name));
			expect(colours).toHaveLength(1);
		}
	});
});

describe("cardVariants header", () => {
	test("lays the text column and the action out in a row", () => {
		const slots = cardVariants();
		expect(slots.header()).toContain("flex-row");
		expect(slots.headerText()).toContain("flex-1");
		expect(slots.action()).toContain("shrink-0");
	});
});

describe("cardVariants footer", () => {
	test("defaults to the plain row of actions", () => {
		expect(cardVariants().footer()).toBe(cardVariants({ footer: "default" }).footer());
		expect(cardVariants().footer()).toContain("flex-row");
		expect(cardVariants().footer()).not.toContain("border-t");
	});

	test("a band draws a rule across its top and a fill of its own", () => {
		for (const footerFill of SURFACE_FILLED_VARIANTS) {
			const cls = cardVariants({ footer: "band", footerFill }).footer();
			expect(cls).toContain("border-t");
			expect(cls).toContain("border-border");
			expect(cls).toMatch(/(^|\s)bg-/);
		}
	});

	test("only a band paints a fill", () => {
		for (const footerFill of SURFACE_FILLED_VARIANTS) {
			expect(cardVariants({ footer: "default", footerFill }).footer()).not.toMatch(/(^|\s)bg-/);
		}
	});

	test("maps each band fill to its surface token", () => {
		expect(cardVariants({ footer: "band", footerFill: "default" }).footer()).toContain("bg-card");
		expect(cardVariants({ footer: "band", footerFill: "secondary" }).footer()).toContain("bg-secondary");
		expect(cardVariants({ footer: "band", footerFill: "tertiary" }).footer()).toContain("bg-tertiary");
	});

	// A band is set INTO the card: it pulls down over the root's bottom padding
	// by exactly that padding, and restates it inside, so it meets the card's
	// bottom edge and its own content keeps the same breathing room.
	test("a band cancels the root's bottom padding and restates it inside", () => {
		for (const size of CARD_SIZES) {
			const inset = step(cardVariants({ size }).root(), "pb");
			const cls = cardVariants({ footer: "band", size }).footer();
			expect(cls).toMatch(new RegExp(`(^|\\s)-mb-${inset?.replace(".", "\\.")}(\\s|$)`));
			expect(step(cls, "py")).toBe(inset);
		}
	});
});

describe("resolveCardFooterFill", () => {
	test("a band is a step from the card's own fill, never the same one", () => {
		for (const plane of SURFACE_FILLED_VARIANTS) {
			expect(resolveCardFooterFill(plane)).not.toBe(plane);
		}
	});

	test("a card on the default fill gets a secondary band", () => {
		expect(resolveCardFooterFill("default")).toBe("secondary");
	});

	// A transparent card on the page paints nothing, so its band steps from the
	// page itself — the card fill, a step above it.
	test("a card with no plane of its own gets a default band", () => {
		expect(resolveCardFooterFill(null)).toBe("default");
	});
});

describe("splitCardHeaderChildren", () => {
	function Action(): null {
		return null;
	}
	const isAction = (node: ReactNode): boolean =>
		typeof node === "object" && node !== null && "type" in node && node.type === Action;

	test("puts everything in the text column when there is no action", () => {
		const { text, actions } = splitCardHeaderChildren(["Title", createElement(Fragment, null, "x")], isAction);
		expect(text).toHaveLength(2);
		expect(actions).toHaveLength(0);
	});

	test("lifts every action out of the text column, keeping order", () => {
		const first = createElement(Action, { key: "a" });
		const second = createElement(Action, { key: "b" });
		const { text, actions } = splitCardHeaderChildren([first, "Title", second, "Description"], isAction);
		expect(text).toEqual(["Title", "Description"]);
		expect(actions).toHaveLength(2);
	});

	// A conditional action leaves `false` behind; it must not count as text.
	test("drops the nulls and booleans a conditional child leaves behind", () => {
		const { text, actions } = splitCardHeaderChildren(["Title", false, null, undefined], isAction);
		expect(text).toEqual(["Title"]);
		expect(actions).toHaveLength(0);
	});
});
