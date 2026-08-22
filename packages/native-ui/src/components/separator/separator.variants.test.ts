import { describe, expect, test } from "bun:test";
import { SEPARATOR_ORIENTATIONS, separatorVariants } from "./separator.variants";

describe("separatorVariants", () => {
	test("defaults to a horizontal rule", () => {
		const cls = separatorVariants();
		expect(cls).toContain("h-px");
	});

	test("gives every orientation a distinct treatment", () => {
		const seen = new Set(SEPARATOR_ORIENTATIONS.map((orientation) => separatorVariants({ orientation })));
		expect(seen.size).toBe(SEPARATOR_ORIENTATIONS.length);
	});

	test("swaps which axis is the hairline", () => {
		const horizontal = separatorVariants({ orientation: "horizontal" });
		expect(horizontal).toContain("h-px");
		expect(horizontal).not.toContain("w-px");

		const vertical = separatorVariants({ orientation: "vertical" });
		expect(vertical).toContain("w-px");
		expect(vertical).not.toContain("h-px");
	});

	// Yoga resolves a percentage length against the parent's content box and then
	// adds the margins on top, so an inset `w-full` line runs past the far edge —
	// a gap down one side and none down the other. Stretching subtracts them.
	test("stretches to its parent rather than claiming its full length", () => {
		for (const orientation of SEPARATOR_ORIENTATIONS) {
			const cls = separatorVariants({ orientation });
			expect(cls).toContain("self-stretch");
			expect(cls).not.toMatch(/\b[wh]-full\b/);
		}
	});

	test("draws in the border token at every orientation", () => {
		for (const orientation of SEPARATOR_ORIENTATIONS) {
			expect(separatorVariants({ orientation })).toContain("bg-border");
		}
	});

	// A separator is a line, never a label — a `text-*` utility here would be dead.
	test("carries no text treatment", () => {
		for (const orientation of SEPARATOR_ORIENTATIONS) {
			expect(separatorVariants({ orientation })).not.toMatch(/\btext-/);
		}
	});

	test("merges an incoming className last", () => {
		expect(separatorVariants({ className: "mx-4" })).toContain("mx-4");
		expect(separatorVariants({ className: "bg-input" })).not.toContain("bg-border");
	});
});
