import { describe, expect, test } from "bun:test";
import { declaredTokens } from "../../styles/theme-tokens.test";
import {
	resolveTooltipAccessibility,
	resolveTooltipDuration,
	shouldTooltipActivate,
	TOOLTIP_DEFAULTS,
	TOOLTIP_DURATION,
	TOOLTIP_ENTER_DISTANCE,
	TOOLTIP_VARIANTS,
	tooltipVariants,
} from "./tooltip.variants";

const LIGHT = declaredTokens("light");
const DARK = declaredTokens("dark");

/** `border-t` and friends set a width, not a colour, and name no token. */
const STRUCTURAL_BORDER_SUFFIXES = new Set(["t", "b", "l", "r", "x", "y", "s", "e"]);

/** Tailwind's own size steps share the `text-` prefix with colours and name no token. */
const TEXT_SIZES = new Set(["xs", "sm", "base", "lg", "xl", "2xl", "3xl", "4xl"]);

/** Every theme token a class string paints with, with any `/alpha` suffix dropped. */
function colorTokens(cls: string): string[] {
	const tokens: string[] = [];
	for (const [, utility, token] of cls.matchAll(/\b(bg|border|text)-([a-z][\w-]*)(?:\/\d+)?\b/g)) {
		if (utility === "border" && STRUCTURAL_BORDER_SUFFIXES.has(token)) continue;
		if (utility === "text" && TEXT_SIZES.has(token)) continue;
		tokens.push(token);
	}
	return tokens;
}

/** The slots this component declares, pinned so a new one has to be added before the sweeps can miss it. */
const SLOT_NAMES = ["content", "arrow", "text", "title", "description"] as const;

describe("tooltipVariants — slots", () => {
	test("declares every slot in both variants", () => {
		for (const variant of TOOLTIP_VARIANTS) {
			const slots = tooltipVariants({ variant });
			for (const name of SLOT_NAMES) expect(typeof slots[name]).toBe("function");
		}
	});

	test("every token a slot paints with exists in both themes", () => {
		for (const variant of TOOLTIP_VARIANTS) {
			const slots = tooltipVariants({ variant });
			for (const name of SLOT_NAMES) {
				for (const token of colorTokens(slots[name]() ?? "")) {
					expect(LIGHT.has(token)).toBe(true);
					expect(DARK.has(token)).toBe(true);
				}
			}
		}
	});

	test("the default variant is inverted", () => {
		expect(tooltipVariants().content()).toBe(tooltipVariants({ variant: "inverted" }).content());
	});

	test("a caller's className wins on the panel", () => {
		const content = tooltipVariants().content({ className: "px-4" });
		expect(content).toContain("px-4");
		expect(content).not.toMatch(/\bpx-2\b/);
	});
});

describe("tooltipVariants — inverted", () => {
	const slots = tooltipVariants({ variant: "inverted" });

	test("the panel is the foreground colour, a small corner and compact padding, with no border", () => {
		const content = slots.content();
		expect(content).toContain("bg-foreground");
		expect(content).toContain("rounded-md");
		expect(content).toMatch(/\bpx-2\b/);
		expect(content).toMatch(/\bpy-1\b/);
		expect(content).not.toMatch(/\bborder\b/);
	});

	test("the arrow wears the panel's fill and no border", () => {
		const arrow = slots.arrow();
		expect(arrow).toContain("bg-foreground");
		expect(arrow).not.toMatch(/\bborder-border\b/);
	});

	test("every piece of text is drawn in the background colour, so it reads on the inverted fill", () => {
		expect(slots.text()).toContain("text-background");
		expect(slots.title()).toContain("text-background");
		expect(colorTokens(slots.description())).toEqual(["background"]);
	});
});

describe("tooltipVariants — surface", () => {
	const slots = tooltipVariants({ variant: "surface" });

	test("the panel is a popover surface with a hairline, the card corner and room for two lines", () => {
		const content = slots.content();
		expect(content).toContain("bg-popover");
		expect(content).toContain("border");
		expect(content).toContain("border-border");
		expect(content).toContain("rounded-lg");
		expect(content).toMatch(/\bgap-\d/);
	});

	test("the arrow is the panel's fill with the panel's border on two edges", () => {
		const arrow = slots.arrow();
		expect(arrow).toContain("bg-popover");
		expect(arrow).toContain("border-border");
		expect(arrow).toContain("border-b");
		expect(arrow).toContain("border-r");
	});

	test("text and title sit on the popover foreground; the description is muted", () => {
		expect(slots.text()).toContain("text-popover-foreground");
		expect(slots.title()).toContain("text-popover-foreground");
		expect(slots.description()).toContain("text-muted-foreground");
	});
});

describe("resolveTooltipDuration", () => {
	test("passes a positive duration through", () => {
		expect(resolveTooltipDuration(800, { isScreenReaderEnabled: false })).toBe(800);
	});

	test("0 means stay until dismissed", () => {
		expect(resolveTooltipDuration(0, { isScreenReaderEnabled: false })).toBe(0);
	});

	test("an omitted duration is the default", () => {
		expect(resolveTooltipDuration(undefined, { isScreenReaderEnabled: false })).toBe(TOOLTIP_DURATION);
	});

	test("a negative or non-finite duration falls back to the default rather than hiding at once", () => {
		expect(resolveTooltipDuration(-1, { isScreenReaderEnabled: false })).toBe(TOOLTIP_DURATION);
		expect(resolveTooltipDuration(Number.NaN, { isScreenReaderEnabled: false })).toBe(TOOLTIP_DURATION);
		expect(resolveTooltipDuration(Number.POSITIVE_INFINITY, { isScreenReaderEnabled: false })).toBe(TOOLTIP_DURATION);
	});

	test("with a screen reader on it never times out — whoever opened it reads at their own pace", () => {
		expect(resolveTooltipDuration(800, { isScreenReaderEnabled: true })).toBe(0);
		expect(resolveTooltipDuration(undefined, { isScreenReaderEnabled: true })).toBe(0);
	});
});

describe("shouldTooltipActivate", () => {
	test("a long-press tooltip opens on a long press and ignores the tap", () => {
		expect(shouldTooltipActivate({ openOn: "longPress", gesture: "longPress", isScreenReaderEnabled: false })).toBe(
			true
		);
		expect(shouldTooltipActivate({ openOn: "longPress", gesture: "press", isScreenReaderEnabled: false })).toBe(false);
	});

	test("a press tooltip opens on a tap and ignores the long press", () => {
		expect(shouldTooltipActivate({ openOn: "press", gesture: "press", isScreenReaderEnabled: false })).toBe(true);
		expect(shouldTooltipActivate({ openOn: "press", gesture: "longPress", isScreenReaderEnabled: false })).toBe(false);
	});

	test("with a screen reader on, a long press never opens it — the label already reached the trigger", () => {
		expect(shouldTooltipActivate({ openOn: "longPress", gesture: "longPress", isScreenReaderEnabled: true })).toBe(
			false
		);
	});

	test("with a screen reader on, a press tooltip still opens, for a partially sighted user", () => {
		expect(shouldTooltipActivate({ openOn: "press", gesture: "press", isScreenReaderEnabled: true })).toBe(true);
	});
});

describe("resolveTooltipAccessibility", () => {
	test("no label, nothing to add", () => {
		expect(resolveTooltipAccessibility({})).toEqual({});
		expect(resolveTooltipAccessibility({ label: "", triggerLabel: "Share" })).toEqual({});
	});

	test("a trigger with no label of its own is named by the tooltip", () => {
		expect(resolveTooltipAccessibility({ label: "Share" })).toEqual({ accessibilityLabel: "Share" });
		expect(resolveTooltipAccessibility({ label: "Share", triggerLabel: "" })).toEqual({ accessibilityLabel: "Share" });
	});

	test("a trigger that already has a label keeps it, and the tooltip becomes its hint", () => {
		expect(resolveTooltipAccessibility({ label: "Copies a link to the clipboard", triggerLabel: "Share" })).toEqual({
			accessibilityHint: "Copies a link to the clipboard",
		});
	});

	test("a label identical to the trigger's is not read twice", () => {
		expect(resolveTooltipAccessibility({ label: "Share", triggerLabel: "Share" })).toEqual({});
	});
});

describe("constants", () => {
	test("defaults match the documented API", () => {
		expect(TOOLTIP_DEFAULTS).toEqual({
			placement: "top",
			align: "center",
			offset: 6,
			alignOffset: 0,
			width: "content-fit",
			variant: "inverted",
			openOn: "longPress",
		});
		expect(TOOLTIP_DURATION).toBe(1500);
	});

	test("the entrance is a short slide from the resolved side", () => {
		expect(TOOLTIP_ENTER_DISTANCE).toBe(4);
	});
});
