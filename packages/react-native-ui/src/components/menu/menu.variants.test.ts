import { describe, expect, test } from "bun:test";
import { declaredTokens } from "../../styles/theme-tokens.test";
import {
	MENU_DEFAULT_MIN_WIDTH,
	MENU_DEFAULT_OFFSET,
	MENU_EDGE_MARGIN,
	MENU_ENTER_SCALE,
	MENU_MOTION,
	MENU_PRESS,
	type MenuPlacementInput,
	menuVariants,
	resolveCloseOnSelect,
	resolveMenuItemAccessibility,
	resolveMenuOrigin,
	resolveMenuPhysicalAlign,
	resolveMenuPlacement,
	resolveMenuWidth,
	resolveRadioNext,
} from "./menu.variants";

const WINDOW = { height: 800, width: 400 };
const INSETS = { bottom: 34, left: 0, right: 0, top: 47 };

/** A 120×40 trigger near the top-left, opening a 200×240 panel below it. */
function input(overrides: Partial<MenuPlacementInput> = {}): MenuPlacementInput {
	return {
		align: "start",
		anchor: { height: 40, width: 120, x: 16, y: 100 },
		content: { height: 240, width: 200 },
		insets: INSETS,
		isRTL: false,
		offset: MENU_DEFAULT_OFFSET,
		placement: "bottom",
		window: WINDOW,
		...overrides,
	};
}

describe("resolveMenuPlacement — vertical", () => {
	test("opens below the anchor, offset from its bottom edge", () => {
		const result = resolveMenuPlacement(input());
		expect(result.placement).toBe("bottom");
		expect(result.top).toBe(100 + 40 + MENU_DEFAULT_OFFSET);
	});

	test("the room below is what is left inside the safe area and the margin", () => {
		const result = resolveMenuPlacement(input());
		expect(result.maxHeight).toBe(800 - 34 - MENU_EDGE_MARGIN - (100 + 40 + MENU_DEFAULT_OFFSET));
	});

	test("flips above when there is no room below", () => {
		const result = resolveMenuPlacement(input({ anchor: { height: 40, width: 120, x: 16, y: 650 } }));
		expect(result.placement).toBe("top");
		expect(result.top).toBe(650 - MENU_DEFAULT_OFFSET - 240);
	});

	test("measures the bottom edge for an upward panel, so it grows away from the anchor", () => {
		const result = resolveMenuPlacement(input({ anchor: { height: 40, width: 120, x: 16, y: 650 } }));
		expect(result.bottom).toBe(800 - (650 - MENU_DEFAULT_OFFSET));
	});

	test("a requested top placement stays on top when it fits", () => {
		const result = resolveMenuPlacement(input({ anchor: { height: 40, width: 120, x: 16, y: 500 }, placement: "top" }));
		expect(result.placement).toBe("top");
	});

	test("a requested top placement flips below when there is no room above", () => {
		const result = resolveMenuPlacement(input({ placement: "top" }));
		expect(result.placement).toBe("bottom");
	});

	test("with no room on either side, picks the larger side and caps the height", () => {
		const tall = { height: 900, width: 200 };
		const nearTop = resolveMenuPlacement(input({ content: tall }));
		expect(nearTop.placement).toBe("bottom");
		expect(nearTop.maxHeight).toBeLessThan(900);

		const nearBottom = resolveMenuPlacement(
			input({ anchor: { height: 40, width: 120, x: 16, y: 600 }, content: tall })
		);
		expect(nearBottom.placement).toBe("top");
		expect(nearBottom.maxHeight).toBe(600 - MENU_DEFAULT_OFFSET - (47 + MENU_EDGE_MARGIN));
		// Capped: the panel's top lands on the safe-area edge plus the margin, never above it.
		expect(nearBottom.top).toBe(47 + MENU_EDGE_MARGIN);
	});

	test("never reports a negative height", () => {
		const result = resolveMenuPlacement(
			input({ anchor: { height: 800, width: 120, x: 16, y: 0 }, content: { height: 100, width: 200 } })
		);
		expect(result.maxHeight).toBeGreaterThanOrEqual(0);
	});

	test("the panel's top and bottom edges agree with its capped height", () => {
		for (const y of [60, 200, 400, 600, 720]) {
			const result = resolveMenuPlacement(input({ anchor: { height: 40, width: 120, x: 16, y } }));
			const height = Math.min(240, result.maxHeight);
			expect(result.top + height + result.bottom).toBeCloseTo(800, 6);
		}
	});
});

describe("resolveMenuPlacement — horizontal", () => {
	test("start aligns the panel's left edge with the anchor's", () => {
		expect(resolveMenuPlacement(input()).left).toBe(16);
	});

	test("end aligns the right edges", () => {
		const result = resolveMenuPlacement(input({ align: "end", anchor: { height: 40, width: 120, x: 260, y: 100 } }));
		expect(result.left).toBe(260 + 120 - 200);
	});

	test("center centres the panel on the anchor", () => {
		const result = resolveMenuPlacement(input({ align: "center", anchor: { height: 40, width: 120, x: 140, y: 100 } }));
		expect(result.left).toBe(140 + 60 - 100);
	});

	test("clamps inside the left edge plus the margin", () => {
		const result = resolveMenuPlacement(input({ align: "center", anchor: { height: 40, width: 40, x: 0, y: 100 } }));
		expect(result.left).toBe(MENU_EDGE_MARGIN);
	});

	test("clamps inside the right edge plus the margin", () => {
		const result = resolveMenuPlacement(input({ anchor: { height: 40, width: 40, x: 360, y: 100 } }));
		expect(result.left).toBe(400 - MENU_EDGE_MARGIN - 200);
	});

	test("clamps inside the horizontal safe area too", () => {
		const result = resolveMenuPlacement(
			input({ anchor: { height: 40, width: 40, x: 0, y: 100 }, insets: { ...INSETS, left: 44, right: 44 } })
		);
		expect(result.left).toBe(44 + MENU_EDGE_MARGIN);
	});

	test("a panel wider than the room pins to the leading edge", () => {
		const result = resolveMenuPlacement(input({ content: { height: 240, width: 500 } }));
		expect(result.left).toBe(MENU_EDGE_MARGIN);
	});

	test("start and end swap under RTL", () => {
		const anchor = { height: 40, width: 120, x: 260, y: 100 };
		const rtlStart = resolveMenuPlacement(input({ anchor, isRTL: true }));
		const ltrEnd = resolveMenuPlacement(input({ align: "end", anchor }));
		expect(rtlStart.left).toBe(ltrEnd.left);

		const rtlEnd = resolveMenuPlacement(input({ align: "end", anchor, isRTL: true }));
		const ltrStart = resolveMenuPlacement(input({ anchor }));
		expect(rtlEnd.left).toBe(ltrStart.left);
	});

	test("center is the same under RTL", () => {
		const anchor = { height: 40, width: 120, x: 140, y: 100 };
		expect(resolveMenuPlacement(input({ align: "center", anchor, isRTL: true })).left).toBe(
			resolveMenuPlacement(input({ align: "center", anchor })).left
		);
	});
});

describe("resolveMenuPlacement — a zero-size anchor", () => {
	const point = { height: 0, width: 0, x: 180, y: 300 };

	test("opens below the point with no special case", () => {
		const result = resolveMenuPlacement(input({ anchor: point }));
		expect(result.placement).toBe("bottom");
		expect(result.top).toBe(300 + MENU_DEFAULT_OFFSET);
		expect(result.left).toBe(180);
	});

	test("flips above the point near the bottom", () => {
		const result = resolveMenuPlacement(input({ anchor: { ...point, y: 700 } }));
		expect(result.placement).toBe("top");
		expect(result.top).toBe(700 - MENU_DEFAULT_OFFSET - 240);
	});

	test("end-aligns its right edge to the point", () => {
		expect(resolveMenuPlacement(input({ align: "end", anchor: { ...point, x: 300 } })).left).toBe(300 - 200);
	});

	test("clamps a point at the screen's corner", () => {
		const result = resolveMenuPlacement(input({ anchor: { height: 0, width: 0, x: 400, y: 800 } }));
		expect(result.placement).toBe("top");
		expect(result.left).toBe(400 - MENU_EDGE_MARGIN - 200);
	});
});

describe("resolveMenuPhysicalAlign", () => {
	test("maps logical to physical, swapping under RTL", () => {
		expect(resolveMenuPhysicalAlign("start", false)).toBe("left");
		expect(resolveMenuPhysicalAlign("end", false)).toBe("right");
		expect(resolveMenuPhysicalAlign("start", true)).toBe("right");
		expect(resolveMenuPhysicalAlign("end", true)).toBe("left");
		expect(resolveMenuPhysicalAlign("center", true)).toBe("center");
	});
});

describe("resolveMenuOrigin", () => {
	const size = { height: 200, width: 200 };
	const shift = ((1 - MENU_ENTER_SCALE) * 200) / 2;

	test("a panel below grows from its top edge", () => {
		expect(resolveMenuOrigin({ ...size, align: "left", placement: "bottom" })).toEqual({ x: -shift, y: -shift });
	});

	test("a panel above grows from its bottom edge", () => {
		expect(resolveMenuOrigin({ ...size, align: "right", placement: "top" })).toEqual({ x: shift, y: shift });
	});

	test("a centred panel has no horizontal shift", () => {
		expect(resolveMenuOrigin({ ...size, align: "center", placement: "bottom" }).x).toBe(0);
	});
});

describe("resolveMenuWidth", () => {
	test("defaults to the trigger's width, floored at the default", () => {
		expect(resolveMenuWidth({ triggerWidth: 120 })).toBe(MENU_DEFAULT_MIN_WIDTH);
		expect(resolveMenuWidth({ triggerWidth: 320 })).toBe(320);
	});

	test("an explicit width wins over the trigger", () => {
		expect(resolveMenuWidth({ triggerWidth: 320, width: 224 })).toBe(224);
	});

	test("minWidth floors an explicit width too", () => {
		expect(resolveMenuWidth({ minWidth: 260, triggerWidth: 0, width: 224 })).toBe(260);
	});

	test("maxWidth caps whatever else it resolved to", () => {
		expect(resolveMenuWidth({ maxWidth: 300, triggerWidth: 380 })).toBe(300);
		expect(resolveMenuWidth({ maxWidth: 300, minWidth: 400, triggerWidth: 0 })).toBe(300);
	});

	test("a zero-size anchor (no trigger) still gets the default", () => {
		expect(resolveMenuWidth({ triggerWidth: 0 })).toBe(MENU_DEFAULT_MIN_WIDTH);
	});
});

describe("resolveRadioNext", () => {
	test("selects the chosen value", () => {
		expect(resolveRadioNext("comfortable", "compact")).toBe("compact");
		expect(resolveRadioNext(undefined, "compact")).toBe("compact");
	});

	test("re-choosing the selected value keeps it: a radio never clears", () => {
		expect(resolveRadioNext("compact", "compact")).toBe("compact");
	});
});

describe("resolveCloseOnSelect", () => {
	test("an item and a radio close; a checkbox and a sub-trigger stay open", () => {
		expect(resolveCloseOnSelect("item")).toBe(true);
		expect(resolveCloseOnSelect("radio")).toBe(true);
		expect(resolveCloseOnSelect("checkbox")).toBe(false);
		expect(resolveCloseOnSelect("sub-trigger")).toBe(false);
	});

	test("an explicit value wins", () => {
		expect(resolveCloseOnSelect("item", false)).toBe(false);
		expect(resolveCloseOnSelect("checkbox", true)).toBe(true);
		expect(resolveCloseOnSelect("radio", false)).toBe(false);
	});
});

describe("resolveMenuItemAccessibility", () => {
	test("a plain item announces only whether it is disabled", () => {
		expect(resolveMenuItemAccessibility({ isDisabled: false, kind: "item" })).toEqual({ disabled: false });
		expect(resolveMenuItemAccessibility({ isDisabled: true, kind: "item" })).toEqual({ disabled: true });
	});

	test("a checkbox announces checked", () => {
		expect(resolveMenuItemAccessibility({ isChecked: true, isDisabled: false, kind: "checkbox" })).toEqual({
			checked: true,
			disabled: false,
		});
	});

	test("a radio announces selected", () => {
		expect(resolveMenuItemAccessibility({ isDisabled: false, isSelected: false, kind: "radio" })).toEqual({
			disabled: false,
			selected: false,
		});
	});

	test("a sub-trigger announces expanded", () => {
		expect(resolveMenuItemAccessibility({ isDisabled: false, isExpanded: true, kind: "sub-trigger" })).toEqual({
			disabled: false,
			expanded: true,
		});
	});
});

describe("motion constants", () => {
	test("enter is slower than exit, and both are short", () => {
		expect(MENU_MOTION.enterMs).toBe(160);
		expect(MENU_MOTION.exitMs).toBe(120);
		expect(MENU_ENTER_SCALE).toBe(0.96);
	});

	test("the press fill fades in faster than it fades out", () => {
		expect(MENU_PRESS.inMs).toBe(90);
		expect(MENU_PRESS.outMs).toBe(160);
		expect(MENU_PRESS.scale).toBe(0.98);
	});
});

describe("menuVariants", () => {
	test("the panel surface is the popover token, never the scrim", () => {
		const slots = menuVariants();
		expect(slots.background()).toContain("bg-popover");
		expect(slots.background()).not.toContain("bg-overlay");
		expect(slots.content()).toContain("rounded-lg");
		expect(slots.content()).toContain("border-border");
	});

	test("the scrim is the overlay token", () => {
		expect(menuVariants().scrim()).toContain("bg-overlay");
	});

	test("the backdrop layer fills the screen and paints nothing of its own", () => {
		const backdrop = menuVariants().backdrop();
		expect(backdrop).toContain("absolute");
		expect(backdrop).toContain("inset-0");
		expect(backdrop).not.toMatch(/\b(bg|text)-/);
	});

	test("a row is at least a touch target tall", () => {
		expect(menuVariants().item()).toContain("min-h-11");
	});

	test("destructive paints the label and the pressed fill", () => {
		const slots = menuVariants({ variant: "destructive" });
		expect(slots.itemLabel()).toContain("text-destructive");
		expect(slots.itemFill()).toContain("bg-destructive-soft");
		expect(menuVariants().itemLabel()).toContain("text-popover-foreground");
		expect(menuVariants().itemFill()).toContain("bg-accent");
	});

	test("disabled fades the row", () => {
		expect(menuVariants({ isDisabled: true }).item()).toContain("opacity-50");
		expect(menuVariants().item()).not.toContain("opacity-50");
	});

	test("an inset label reserves the icon column", () => {
		expect(menuVariants({ isInset: true }).label()).not.toBe(menuVariants().label());
	});

	test("no slot worn by a View carries a text colour", () => {
		const slots = menuVariants({ variant: "destructive" });
		for (const name of ["content", "background", "item", "itemFill", "subContent", "scrim", "backdrop"] as const) {
			expect(slots[name]()).not.toMatch(/\btext-/);
		}
	});
});

describe("menu colour tokens", () => {
	const LIGHT = declaredTokens("light");
	const DARK = declaredTokens("dark");
	const SLOT_NAMES = [
		"content",
		"background",
		"scrim",
		"item",
		"itemFill",
		"itemLabel",
		"itemDescription",
		"itemShortcut",
		"itemIcon",
		"label",
		"indicator",
		"indicatorDot",
		"subContent",
	] as const;

	function colorTokens(cls: string): string[] {
		const structural = new Set(["t", "b", "l", "r", "x", "y", "s", "e"]);
		const tokens: string[] = [];
		for (const [, utility, token] of cls.matchAll(/\b(bg|border|text)-([a-z][\w-]*)(?:\/\d+)?\b/g)) {
			if (utility === "border" && token !== undefined && structural.has(token)) continue;
			if (utility === "text" && token !== undefined && /^(xs|sm|base|lg|xl|\dxl)$/.test(token)) continue;
			if (token !== undefined) tokens.push(token);
		}
		return tokens;
	}

	test("every token is declared in both themes", () => {
		for (const variant of ["default", "destructive"] as const) {
			const slots = menuVariants({ variant });
			for (const name of SLOT_NAMES) {
				for (const token of colorTokens(slots[name]())) {
					expect({ inLight: LIGHT.has(token), name, token }).toEqual({ inLight: true, name, token });
					expect({ inDark: DARK.has(token), name, token }).toEqual({ inDark: true, name, token });
				}
			}
		}
	});

	test("the reader found tokens at all", () => {
		expect(colorTokens(menuVariants().background())).toContain("popover");
		expect(colorTokens(menuVariants().itemDescription())).toContain("muted-foreground");
	});
});
