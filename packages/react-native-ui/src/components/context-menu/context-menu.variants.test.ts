import { describe, expect, test } from "bun:test";
import { declaredTokens } from "../../styles/theme-tokens.test";
import { MENU_DEFAULT_MIN_WIDTH, resolveMenuPlacement, resolveMenuWidth } from "../menu/menu.variants";
import {
	CONTEXT_MENU_ACCESSIBILITY_ACTIONS,
	CONTEXT_MENU_CONTENT_DEFAULTS,
	CONTEXT_MENU_HOLD,
	CONTEXT_MENU_PREVIEW_SCALE,
	contextMenuVariants,
	resolveContextAnchor,
	resolveContextMenuAccessibility,
	resolveHoldConfig,
} from "./context-menu.variants";

const TARGET = { height: 120, width: 300, x: 24, y: 200 };
const POINT = { x: 140, y: 260 };

describe("resolveContextAnchor", () => {
	test("point mode, by the finger, is a zero-size rect at the press", () => {
		expect(
			resolveContextAnchor({
				hasPreview: false,
				invokedBy: "pointer",
				mode: "point",
				point: POINT,
				targetRect: TARGET,
			})
		).toEqual({ height: 0, width: 0, x: 140, y: 260 });
	});

	test("target mode anchors to the measured wrapper", () => {
		expect(
			resolveContextAnchor({
				hasPreview: false,
				invokedBy: "pointer",
				mode: "target",
				point: POINT,
				targetRect: TARGET,
			})
		).toEqual(TARGET);
	});

	test("a preview forces the target, so the panel opens outside the lifted copy", () => {
		expect(
			resolveContextAnchor({
				hasPreview: true,
				invokedBy: "pointer",
				mode: "point",
				point: POINT,
				targetRect: TARGET,
			})
		).toEqual(TARGET);
	});

	test("a screen-reader open forces the target — there is no pointer coordinate", () => {
		expect(
			resolveContextAnchor({
				hasPreview: false,
				invokedBy: "accessibility",
				mode: "point",
				point: null,
				targetRect: TARGET,
			})
		).toEqual(TARGET);
	});

	test("point mode without a point falls back to the target", () => {
		expect(
			resolveContextAnchor({
				hasPreview: false,
				invokedBy: "pointer",
				mode: "point",
				point: null,
				targetRect: TARGET,
			})
		).toEqual(TARGET);
	});

	test("returns a fresh rect, never the caller's object", () => {
		const result = resolveContextAnchor({
			hasPreview: false,
			invokedBy: "pointer",
			mode: "target",
			point: null,
			targetRect: TARGET,
		});
		expect(result).not.toBe(TARGET);
	});
});

describe("resolveHoldConfig", () => {
	test("defaults to a 350ms hold and 12pt of drift", () => {
		expect(resolveHoldConfig({})).toEqual({ delay: 350, slop: 12 });
		expect(CONTEXT_MENU_HOLD).toEqual({ delay: 350, minDelay: 150, slop: 12 });
	});

	test("keeps values above the floors", () => {
		expect(resolveHoldConfig({ delay: 600, slop: 20 })).toEqual({ delay: 600, slop: 20 });
	});

	test("floors the delay at 150ms, so a tap cannot open the menu", () => {
		expect(resolveHoldConfig({ delay: 40 }).delay).toBe(150);
	});

	test("floors the slop at zero", () => {
		expect(resolveHoldConfig({ slop: -5 }).slop).toBe(0);
	});

	test("a non-finite value takes the default", () => {
		expect(resolveHoldConfig({ delay: Number.NaN, slop: Number.POSITIVE_INFINITY })).toEqual({
			delay: 350,
			slop: 12,
		});
	});
});

describe("resolveContextMenuAccessibility", () => {
	test("a trigger with onPress is a button", () => {
		expect(resolveContextMenuAccessibility({ hasPress: true, isDisabled: false, isOpen: false }).role).toBe("button");
	});

	test("a trigger without onPress claims no role", () => {
		expect(resolveContextMenuAccessibility({ hasPress: false, isDisabled: false, isOpen: false }).role).toBe("none");
	});

	test("offers activate and a labelled long-press", () => {
		expect(CONTEXT_MENU_ACCESSIBILITY_ACTIONS).toEqual([
			{ name: "activate" },
			{ label: "Show menu", name: "longpress" },
		]);
	});

	test("announces disabled and expanded", () => {
		expect(resolveContextMenuAccessibility({ hasPress: true, isDisabled: true, isOpen: true }).state).toEqual({
			disabled: true,
			expanded: true,
		});
	});

	test("activate runs onPress when there is one, else opens", () => {
		const withPress = resolveContextMenuAccessibility({ hasPress: true, isDisabled: false, isOpen: false });
		const without = resolveContextMenuAccessibility({ hasPress: false, isDisabled: false, isOpen: false });
		expect(withPress.onAction("activate")).toBe("press");
		expect(without.onAction("activate")).toBe("open");
	});

	test("longpress opens", () => {
		const a11y = resolveContextMenuAccessibility({ hasPress: true, isDisabled: false, isOpen: false });
		expect(a11y.onAction("longpress")).toBe("open");
	});

	test("disabled does nothing, for either action", () => {
		const a11y = resolveContextMenuAccessibility({ hasPress: true, isDisabled: true, isOpen: false });
		expect(a11y.onAction("activate")).toBe("none");
		expect(a11y.onAction("longpress")).toBe("none");
	});

	test("an unknown action does nothing", () => {
		const a11y = resolveContextMenuAccessibility({ hasPress: true, isDisabled: false, isOpen: false });
		expect(a11y.onAction("magicTap")).toBe("none");
	});
});

describe("content defaults", () => {
	test("differ from Menu's: bottom, start, 8pt, at least 280 wide, with a scrim", () => {
		expect(CONTEXT_MENU_CONTENT_DEFAULTS).toEqual({
			align: "start",
			hasScrim: true,
			minWidth: 280,
			offset: 8,
			placement: "bottom",
		});
	});

	test("a point anchor resolves to the 280 floor, not Menu's 200", () => {
		const width = resolveMenuWidth({ minWidth: CONTEXT_MENU_CONTENT_DEFAULTS.minWidth, triggerWidth: 0 });
		expect(width).toBe(280);
		expect(width).toBeGreaterThan(MENU_DEFAULT_MIN_WIDTH);
	});

	test("a wide target keeps its own width", () => {
		expect(resolveMenuWidth({ minWidth: CONTEXT_MENU_CONTENT_DEFAULTS.minWidth, triggerWidth: 340 })).toBe(340);
	});

	test("the panel sits 8pt below a point", () => {
		const result = resolveMenuPlacement({
			align: CONTEXT_MENU_CONTENT_DEFAULTS.align,
			anchor: { height: 0, width: 0, x: 140, y: 260 },
			content: { height: 200, width: 280 },
			insets: { bottom: 34, left: 0, right: 0, top: 47 },
			isRTL: false,
			offset: CONTEXT_MENU_CONTENT_DEFAULTS.offset,
			placement: CONTEXT_MENU_CONTENT_DEFAULTS.placement,
			window: { height: 800, width: 400 },
		});
		expect(result.placement).toBe("bottom");
		expect(result.top).toBe(268);
	});

	test("a panel under a tall target flips above it, clear of the target", () => {
		const target = { height: 300, width: 360, x: 20, y: 420 };
		const result = resolveMenuPlacement({
			align: CONTEXT_MENU_CONTENT_DEFAULTS.align,
			anchor: target,
			content: { height: 200, width: 360 },
			insets: { bottom: 34, left: 0, right: 0, top: 47 },
			isRTL: false,
			offset: CONTEXT_MENU_CONTENT_DEFAULTS.offset,
			placement: CONTEXT_MENU_CONTENT_DEFAULTS.placement,
			window: { height: 800, width: 400 },
		});
		expect(result.placement).toBe("top");
		expect(result.top + 200).toBeLessThanOrEqual(target.y - CONTEXT_MENU_CONTENT_DEFAULTS.offset);
	});
});

describe("preview", () => {
	test("lifts by 3%, which the 8pt offset clears for any target under ~530pt tall", () => {
		expect(CONTEXT_MENU_PREVIEW_SCALE).toBe(1.03);
		const grow = ((CONTEXT_MENU_PREVIEW_SCALE - 1) * 530) / 2;
		expect(grow).toBeLessThan(CONTEXT_MENU_CONTENT_DEFAULTS.offset);
	});
});

describe("contextMenuVariants", () => {
	test("rows are taller than Menu's", () => {
		expect(contextMenuVariants().item()).toContain("min-h-12");
	});

	test("the trigger does not shrink to its child", () => {
		expect(contextMenuVariants().trigger()).not.toMatch(/self-start|items-start/);
	});

	test("the preview is absolute and casts a shadow", () => {
		const preview = contextMenuVariants().preview();
		expect(preview).toContain("absolute");
		expect(preview).toMatch(/shadow-/);
	});

	test("merges a caller's class", () => {
		expect(contextMenuVariants().trigger({ className: "rounded-lg" })).toContain("rounded-lg");
	});

	test("no slot carries a text colour", () => {
		const slots = contextMenuVariants();
		for (const name of ["trigger", "preview", "item"] as const) {
			expect(slots[name]()).not.toMatch(/\btext-/);
		}
	});
});

describe("context menu colour tokens", () => {
	const LIGHT = declaredTokens("light");
	const DARK = declaredTokens("dark");

	test("every token is declared in both themes", () => {
		const slots = contextMenuVariants();
		for (const name of ["trigger", "preview", "item"] as const) {
			for (const [, token] of slots[name]().matchAll(/\b(?:bg|border)-([a-z][\w-]*)/g)) {
				if (token === undefined) continue;
				expect({ inLight: LIGHT.has(token), token }).toEqual({ inLight: true, token });
				expect({ inDark: DARK.has(token), token }).toEqual({ inDark: true, token });
			}
		}
	});
});
