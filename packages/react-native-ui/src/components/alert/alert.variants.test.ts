import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
	ALERT_FOREGROUND_TOKEN,
	ALERT_SIZES,
	ALERT_STATUSES,
	ALERT_SURFACE_PADDING,
	ALERT_TINTED_STATUSES,
	ALERT_VARIANTS,
	alertVariants,
	resolveAlertLiveRegion,
	resolveAlertSurfaceVariant,
	resolveAlertTinted,
} from "./alert.variants";

/** Every root class string the variant function can produce, one per combination. */
function everyRoot(): string[] {
	return ALERT_VARIANTS.flatMap((variant) =>
		ALERT_STATUSES.flatMap((status) => ALERT_SIZES.map((size) => alertVariants({ size, status, variant }).root()))
	);
}

describe("alertVariants root slot", () => {
	test("lays the indicator, content and close control out in a row, aligned to the top", () => {
		for (const cls of everyRoot()) {
			expect(cls).toContain("flex-row");
			expect(cls).toContain("items-start");
		}
	});

	test("tints a soft alert with its status's soft fill", () => {
		expect(alertVariants({ status: "info", variant: "soft" }).root()).toContain("bg-info-soft");
		expect(alertVariants({ status: "success", variant: "soft" }).root()).toContain("bg-success-soft");
		expect(alertVariants({ status: "warning", variant: "soft" }).root()).toContain("bg-warning-soft");
		expect(alertVariants({ status: "destructive", variant: "soft" }).root()).toContain("bg-destructive-soft");
	});

	// A tinted fill is its own edge. A grey card hairline around a red wash
	// reads as two components stacked, not one.
	test("a tinted alert hides the surface's hairline", () => {
		for (const status of ALERT_TINTED_STATUSES) {
			expect(alertVariants({ status, variant: "soft" }).root()).toContain("border-transparent");
		}
	});

	// The fill is the Surface's: a neutral alert, or any alert on the surface
	// variant, names no background of its own, so the ladder decides it.
	test("paints no fill of its own where the surface ladder decides", () => {
		for (const status of ALERT_STATUSES) {
			expect(alertVariants({ status, variant: "surface" }).root()).not.toMatch(/\bbg-/);
		}
		expect(alertVariants({ status: "default", variant: "soft" }).root()).not.toMatch(/\bbg-/);
	});

	test("gives every tinted status a distinct surface", () => {
		const seen = new Set(ALERT_TINTED_STATUSES.map((status) => alertVariants({ status, variant: "soft" }).root()));
		expect(seen.size).toBe(ALERT_TINTED_STATUSES.length);
	});

	test("steps its gap up with size", () => {
		expect(alertVariants({ size: "sm" }).root()).toContain("gap-2");
		expect(alertVariants({ size: "md" }).root()).toContain("gap-3");
		expect(alertVariants({ size: "lg" }).root()).toContain("gap-3.5");
	});

	// Rule 1: a React Native View does not cascade colour to a Text descendant.
	test("carries no text colour on the root", () => {
		for (const cls of everyRoot()) {
			expect(cls).not.toMatch(/\btext-/);
		}
	});

	// Surface owns the padding; a second one here would fight it through the merge.
	test("sets no padding of its own", () => {
		for (const cls of everyRoot()) {
			expect(cls).not.toMatch(/(^|\s)p[xy]?-/);
		}
	});

	test("merges an incoming className last", () => {
		expect(alertVariants().root({ className: "mt-4" })).toContain("mt-4");
		expect(alertVariants({ status: "info" }).root({ className: "bg-card" })).not.toContain("bg-info-soft");
	});
});

describe("alertVariants text slots", () => {
	test("the title is coloured by the status, from the same token the icon reads", () => {
		for (const status of ALERT_STATUSES) {
			expect(alertVariants({ status }).title()).toContain(`text-${ALERT_FOREGROUND_TOKEN[status]}`);
		}
	});

	test("the description is always muted", () => {
		for (const status of ALERT_STATUSES) {
			expect(alertVariants({ status }).description()).toContain("text-muted-foreground");
		}
	});

	test("the title is heavier than the description", () => {
		expect(alertVariants().title()).toContain("font-semibold");
		expect(alertVariants().description()).not.toContain("font-semibold");
	});

	test("steps both text sizes up with the alert", () => {
		expect(alertVariants({ size: "sm" }).title()).toContain("text-sm");
		expect(alertVariants({ size: "md" }).title()).toContain("text-base");
		expect(alertVariants({ size: "lg" }).title()).toContain("text-lg");
		expect(alertVariants({ size: "sm" }).description()).toContain("text-xs");
		expect(alertVariants({ size: "md" }).description()).toContain("text-sm");
		expect(alertVariants({ size: "lg" }).description()).toContain("text-base");
	});

	// A fixed height clips wrapped text at a large accessibility step.
	test("no slot carries a fixed height", () => {
		for (const size of ALERT_SIZES) {
			const slots = alertVariants({ size });
			for (const cls of [slots.root(), slots.content(), slots.title(), slots.description(), slots.action()]) {
				expect(cls).not.toMatch(/(^|\s)h-/);
			}
		}
	});
});

describe("alertVariants layout slots", () => {
	// Without flex-1 a long description pushes the close control off the edge.
	test("the content takes the remaining width", () => {
		expect(alertVariants().content()).toContain("flex-1");
	});

	test("the action row wraps rather than overflowing", () => {
		expect(alertVariants().action()).toContain("flex-row");
		expect(alertVariants().action()).toContain("flex-wrap");
	});

	test("the icon indexes the shared icon scale at every size", () => {
		expect(alertVariants({ size: "sm" }).icon()).toBe("size-icon-sm");
		expect(alertVariants({ size: "md" }).icon()).toBe("size-icon-md");
		expect(alertVariants({ size: "lg" }).icon()).toBe("size-icon-lg");
	});

	// The glyph sits level with the title's first line rather than with the top
	// of the box, so the indicator carries the line height as its own height.
	test("the indicator is as tall as the title's first line", () => {
		expect(alertVariants({ size: "sm" }).indicator()).toContain("h-5");
		expect(alertVariants({ size: "md" }).indicator()).toContain("h-6");
		expect(alertVariants({ size: "lg" }).indicator()).toContain("h-7");
	});
});

describe("ALERT_FOREGROUND_TOKEN", () => {
	test("a status names its soft foreground; the neutral alert names the page's", () => {
		expect(ALERT_FOREGROUND_TOKEN).toEqual({
			default: "foreground",
			info: "info-soft-foreground",
			success: "success-soft-foreground",
			warning: "warning-soft-foreground",
			destructive: "destructive-soft-foreground",
		});
	});

	// A token no theme declares compiles to nothing and the icon falls back to
	// whatever colour it inherited.
	test("every token is declared in both themes and aliased", () => {
		const css = readFileSync(join(import.meta.dir, "../../styles/theme.css"), "utf8");
		for (const token of Object.values(ALERT_FOREGROUND_TOKEN)) {
			expect(css).toContain(`--color-${token}: var(--${token})`);
			expect(css.split(`--${token}:`).length - 1).toBeGreaterThanOrEqual(2);
		}
	});
});

describe("ALERT_SURFACE_PADDING", () => {
	test("maps each size onto the surface's own padding step", () => {
		expect(ALERT_SURFACE_PADDING).toEqual({ sm: "sm", md: "md", lg: "lg" });
	});
});

describe("resolveAlertTinted", () => {
	test("only a soft alert with a status is tinted", () => {
		for (const status of ALERT_TINTED_STATUSES) {
			expect(resolveAlertTinted({ status, variant: "soft" })).toBe(true);
			expect(resolveAlertTinted({ status, variant: "surface" })).toBe(false);
		}
		expect(resolveAlertTinted({ status: "default", variant: "soft" })).toBe(false);
	});
});

describe("resolveAlertSurfaceVariant", () => {
	// A tinted alert paints over a card-shaped surface, so what nests in it
	// steps from `default` like anything else on a card.
	test("a tinted alert pins the surface to the card", () => {
		for (const status of ALERT_TINTED_STATUSES) {
			expect(resolveAlertSurfaceVariant({ status, variant: "soft" })).toBe("default");
		}
	});

	// Left undefined, the surface steps from whatever it sits in, so an alert
	// inside a card never vanishes into the card.
	test("an untinted alert leaves the fill to the ladder", () => {
		expect(resolveAlertSurfaceVariant({ status: "default", variant: "soft" })).toBeUndefined();
		for (const status of ALERT_STATUSES) {
			expect(resolveAlertSurfaceVariant({ status, variant: "surface" })).toBeUndefined();
		}
	});
});

describe("resolveAlertLiveRegion", () => {
	// Android announces a live region when its content changes. A failure
	// interrupts; news waits its turn.
	test("a warning or a failure interrupts, anything else waits", () => {
		expect(resolveAlertLiveRegion("destructive")).toBe("assertive");
		expect(resolveAlertLiveRegion("warning")).toBe("assertive");
		expect(resolveAlertLiveRegion("default")).toBe("polite");
		expect(resolveAlertLiveRegion("info")).toBe("polite");
		expect(resolveAlertLiveRegion("success")).toBe("polite");
	});
});
