import { describe, expect, test } from "bun:test";
import { declaredTokens } from "../../styles/theme-tokens.test";
import {
	MESSAGE_SCROLLER_CONTENT_CLASS,
	MESSAGE_SCROLLER_JUMP_PLACEMENTS,
	MESSAGE_SCROLLER_JUMP_TIMING_MS,
	type MessageScrollerJumpPlacement,
	messageScrollerVariants,
	resolveJumpButtonMotion,
} from "./message-scroller.variants";

const LIGHT = declaredTokens("light");
const DARK = declaredTokens("dark");

const SLOTS = [
	"root",
	"content",
	"jumpButtonContainer",
	"jumpButton",
	"jumpLabel",
	"jumpCount",
	"jumpCountLabel",
	"dateSeparator",
	"dateLabel",
	"dateRule",
	"unreadDivider",
	"unreadLabel",
	"unreadRule",
	"loadingOlder",
] as const;

type Slot = (typeof SLOTS)[number];

/** The slots that render a `View` — text colour on any of them would not reach its `Text`. */
const VIEW_SLOTS: readonly Slot[] = [
	"root",
	"content",
	"jumpButtonContainer",
	"jumpButton",
	"jumpCount",
	"dateSeparator",
	"dateRule",
	"unreadDivider",
	"unreadRule",
	"loadingOlder",
];

function slotClass(slot: Slot, placement?: MessageScrollerJumpPlacement): string {
	return messageScrollerVariants({ placement })[slot]();
}

function everyClass(): string[] {
	return MESSAGE_SCROLLER_JUMP_PLACEMENTS.flatMap((placement) => SLOTS.map((slot) => slotClass(slot, placement)));
}

/** Colour tokens a class string names, e.g. `bg-card` → `card`, `bg-primary/40` → `primary`. */
function colourTokens(cls: string): string[] {
	const tokens: string[] = [];
	for (const [, , token] of cls.matchAll(/\b(bg|text|border)-([a-z-]+?)(?:\/\d+)?(?=\s|$)/g)) {
		if (token && !/^(xs|sm|base|lg|xl|\dxl|center|left|right)$/.test(token)) tokens.push(token);
	}
	return tokens;
}

describe("the theme.css reader", () => {
	test("finds both variants", () => {
		expect(LIGHT.size).toBeGreaterThan(0);
		expect(DARK.size).toBeGreaterThan(0);
	});
});

describe("placement", () => {
	test("is center and end", () => {
		expect([...MESSAGE_SCROLLER_JUMP_PLACEMENTS]).toEqual(["center", "end"]);
	});

	test("defaults to end", () => {
		expect(messageScrollerVariants().jumpButtonContainer()).toContain("justify-end");
	});

	test("center centres the button across the list", () => {
		expect(slotClass("jumpButtonContainer", "center")).toContain("justify-center");
		expect(slotClass("jumpButtonContainer", "center")).not.toContain("justify-end");
	});

	test("end parks it at the trailing gutter", () => {
		expect(slotClass("jumpButtonContainer", "end")).toContain("justify-end");
	});

	test("both float over the list rather than taking a row in it", () => {
		for (const placement of MESSAGE_SCROLLER_JUMP_PLACEMENTS) {
			const cls = slotClass("jumpButtonContainer", placement);
			expect(cls).toContain("absolute");
			expect(cls).toContain("inset-x-0");
			expect(cls).toContain("bottom-3");
		}
	});
});

describe("slots", () => {
	test("no slot aligns itself, so the caller's parent decides", () => {
		for (const cls of everyClass()) expect(cls).not.toMatch(/\bself-/);
	});

	test("the root never clips — the jump button and a row's entrance must not be cut off", () => {
		expect(slotClass("root")).not.toContain("overflow-hidden");
		expect(slotClass("root")).toContain("flex-1");
	});

	test("the content gutter matches the screen's chat list, and adds no vertical padding", () => {
		expect(MESSAGE_SCROLLER_CONTENT_CLASS).toBe("px-screen-gutter");
		expect(slotClass("content")).toBe("px-screen-gutter");
	});

	test("the jump button is a pill with a 44pt touch target", () => {
		const cls = slotClass("jumpButton");
		expect(cls).toContain("h-9");
		expect(cls).toContain("rounded-full");
		expect(cls).toContain("border-border");
		expect(cls).toContain("bg-card");
		expect(cls).toContain("min-w-11");
	});

	test("the count chip is primary on primary-foreground", () => {
		expect(slotClass("jumpCount")).toContain("bg-primary");
		expect(slotClass("jumpCountLabel")).toContain("text-primary-foreground");
	});

	test("the date separator is muted and spaced", () => {
		expect(slotClass("dateSeparator")).toContain("py-3");
		expect(slotClass("dateLabel")).toContain("text-xs");
		expect(slotClass("dateLabel")).toContain("text-muted-foreground");
		expect(slotClass("dateRule")).toContain("bg-border");
		expect(slotClass("dateRule")).toContain("h-px");
	});

	test("the unread divider is primary", () => {
		expect(slotClass("unreadLabel")).toContain("text-primary");
		expect(slotClass("unreadRule")).toContain("bg-primary/40");
	});

	test("text colour sits on text slots only", () => {
		for (const slot of VIEW_SLOTS) {
			const cls = slotClass(slot);
			for (const token of colourTokens(cls)) expect(cls).not.toContain(`text-${token}`);
		}
	});

	test("nothing draws a shadow", () => {
		// No component in this package does; React Native's shadow props differ by platform.
		for (const cls of everyClass()) expect(cls).not.toMatch(/\bshadow/);
	});

	test("every colour it names is declared in both themes", () => {
		const tokens = new Set(everyClass().flatMap(colourTokens));
		expect(tokens.size).toBeGreaterThan(0);
		for (const token of tokens) {
			expect(LIGHT.has(token)).toBe(true);
			expect(DARK.has(token)).toBe(true);
		}
	});
});

describe("resolveJumpButtonMotion", () => {
	test("slides up into place when motion is allowed", () => {
		expect(resolveJumpButtonMotion({ isVisible: true, isCalm: false })).toEqual({ opacity: 1, translateY: 0 });
		expect(resolveJumpButtonMotion({ isVisible: false, isCalm: false })).toEqual({ opacity: 0, translateY: 8 });
	});

	test("only fades under calm motion", () => {
		expect(resolveJumpButtonMotion({ isVisible: false, isCalm: true })).toEqual({ opacity: 0, translateY: 0 });
		expect(resolveJumpButtonMotion({ isVisible: true, isCalm: true })).toEqual({ opacity: 1, translateY: 0 });
	});

	test("runs on a 160 ms timing", () => {
		expect(MESSAGE_SCROLLER_JUMP_TIMING_MS).toBe(160);
	});
});
