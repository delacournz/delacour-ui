import { describe, expect, test } from "bun:test";
import {
	type AnchoredInput,
	type PopoverPlacement,
	resolveAnchoredPosition,
	resolveEnterTranslate,
	resolvePopoverWidth,
	resolveTransformOrigin,
} from "./popover.position";

/** A 400 × 800 window with a notch and a home indicator. */
const BOUNDS = { width: 400, height: 800, insets: { top: 50, right: 0, bottom: 30, left: 0 } };
const PAD = 8;

/** A 100 × 40 trigger in the middle of the screen. */
const MIDDLE = { x: 150, y: 380, width: 100, height: 40 };

function input(overrides: Partial<AnchoredInput> = {}): AnchoredInput {
	return {
		anchor: MIDDLE,
		content: { width: 200, height: 100 },
		bounds: BOUNDS,
		placement: "bottom",
		align: "center",
		offset: 8,
		alignOffset: 0,
		collisionPadding: PAD,
		arrowInset: 16,
		isRTL: false,
		...overrides,
	};
}

describe("resolveAnchoredPosition — placements", () => {
	test("bottom sits below the anchor by the offset, centred", () => {
		const position = resolveAnchoredPosition(input());
		expect(position.placement).toBe("bottom");
		expect(position.y).toBe(380 + 40 + 8);
		expect(position.x).toBe(150 + 50 - 100);
	});

	test("top sits above the anchor by the offset", () => {
		const position = resolveAnchoredPosition(input({ placement: "top" }));
		expect(position.placement).toBe("top");
		expect(position.y).toBe(380 - 8 - 100);
		expect(position.x).toBe(100);
	});

	test("right sits beside the anchor, centred vertically", () => {
		const position = resolveAnchoredPosition(
			input({
				placement: "right",
				anchor: { x: 20, y: 380, width: 40, height: 40 },
				content: { width: 120, height: 60 },
			})
		);
		expect(position.placement).toBe("right");
		expect(position.x).toBe(20 + 40 + 8);
		expect(position.y).toBe(380 + 20 - 30);
	});

	test("left sits before the anchor", () => {
		const position = resolveAnchoredPosition(
			input({
				placement: "left",
				anchor: { x: 340, y: 380, width: 40, height: 40 },
				content: { width: 120, height: 60 },
			})
		);
		expect(position.placement).toBe("left");
		expect(position.x).toBe(340 - 8 - 120);
		expect(position.y).toBe(370);
	});
});

describe("resolveAnchoredPosition — align", () => {
	test("start lines the panel's leading edge up with the anchor's", () => {
		expect(resolveAnchoredPosition(input({ align: "start" })).x).toBe(150);
	});

	test("end lines the trailing edges up", () => {
		expect(resolveAnchoredPosition(input({ align: "end" })).x).toBe(250 - 200);
	});

	test("center centres on the anchor", () => {
		expect(resolveAnchoredPosition(input({ align: "center" })).x).toBe(100);
	});

	test("on a side placement start is the top edge and end the bottom", () => {
		const side = { placement: "right" as const, anchor: { x: 20, y: 380, width: 40, height: 40 } };
		expect(resolveAnchoredPosition(input({ ...side, align: "start" })).y).toBe(380);
		expect(resolveAnchoredPosition(input({ ...side, align: "end" })).y).toBe(420 - 100);
	});

	test("start and end mirror under RTL on top and bottom", () => {
		expect(resolveAnchoredPosition(input({ align: "start", isRTL: true })).x).toBe(250 - 200);
		expect(resolveAnchoredPosition(input({ align: "end", isRTL: true })).x).toBe(150);
	});

	test("RTL does not mirror a side placement's align", () => {
		const side = { placement: "right" as const, anchor: { x: 20, y: 380, width: 40, height: 40 }, isRTL: true };
		expect(resolveAnchoredPosition(input({ ...side, align: "start" })).y).toBe(380);
	});

	test("alignOffset nudges inward from the aligned edge", () => {
		expect(resolveAnchoredPosition(input({ align: "start", alignOffset: 10 })).x).toBe(160);
		expect(resolveAnchoredPosition(input({ align: "end", alignOffset: 10 })).x).toBe(40);
		expect(resolveAnchoredPosition(input({ align: "center", alignOffset: 10 })).x).toBe(110);
	});

	test("alignOffset follows the logical direction under RTL", () => {
		expect(resolveAnchoredPosition(input({ align: "start", alignOffset: 10, isRTL: true })).x).toBe(40);
	});
});

describe("resolveAnchoredPosition — flip", () => {
	test("flips above when there is no room below and more above", () => {
		const anchor = { x: 150, y: 700, width: 100, height: 40 };
		const position = resolveAnchoredPosition(input({ anchor }));
		expect(position.placement).toBe("top");
		expect(position.y).toBe(700 - 8 - 100);
	});

	test("flips below when there is no room above", () => {
		const anchor = { x: 150, y: 60, width: 100, height: 40 };
		expect(resolveAnchoredPosition(input({ anchor, placement: "top" })).placement).toBe("bottom");
	});

	test("flips a side placement across the anchor", () => {
		const anchor = { x: 340, y: 380, width: 40, height: 40 };
		expect(resolveAnchoredPosition(input({ anchor, placement: "right" })).placement).toBe("left");
	});

	test("does not flip when the opposite side is worse", () => {
		const anchor = { x: 150, y: 120, width: 100, height: 40 };
		const tall = { width: 200, height: 700 };
		expect(resolveAnchoredPosition(input({ anchor, content: tall })).placement).toBe("bottom");
	});

	test("does not flip when the preferred side has room", () => {
		const anchor = { x: 150, y: 600, width: 100, height: 40 };
		expect(resolveAnchoredPosition(input({ anchor })).placement).toBe("bottom");
	});
});

describe("resolveAnchoredPosition — shift", () => {
	test("shifts right to stay off the left edge", () => {
		const anchor = { x: 0, y: 380, width: 40, height: 40 };
		expect(resolveAnchoredPosition(input({ anchor })).x).toBe(PAD);
	});

	test("shifts left to stay off the right edge", () => {
		const anchor = { x: 360, y: 380, width: 40, height: 40 };
		expect(resolveAnchoredPosition(input({ anchor })).x).toBe(400 - PAD - 200);
	});

	test("respects horizontal safe-area insets", () => {
		const bounds = { ...BOUNDS, insets: { ...BOUNDS.insets, left: 44 } };
		const anchor = { x: 0, y: 380, width: 40, height: 40 };
		expect(resolveAnchoredPosition(input({ anchor, bounds })).x).toBe(44 + PAD);
	});

	test("shifts a side placement down off the top edge, into the safe area", () => {
		const anchor = { x: 20, y: 52, width: 40, height: 40 };
		const position = resolveAnchoredPosition(input({ anchor, placement: "right" }));
		expect(position.y).toBe(50 + PAD);
	});

	test("shifts a side placement up off the bottom edge", () => {
		const anchor = { x: 20, y: 740, width: 40, height: 40 };
		const position = resolveAnchoredPosition(input({ anchor, placement: "right" }));
		expect(position.y).toBe(800 - 30 - PAD - 100);
	});

	test("a panel wider than the safe span pins to its leading edge", () => {
		const position = resolveAnchoredPosition(input({ content: { width: 500, height: 100 } }));
		expect(position.x).toBe(PAD);
	});

	test("never leaves the screen in any placement or corner", () => {
		const corners = [
			{ x: 0, y: 50, width: 44, height: 44 },
			{ x: 356, y: 50, width: 44, height: 44 },
			{ x: 0, y: 726, width: 44, height: 44 },
			{ x: 356, y: 726, width: 44, height: 44 },
		];
		const placements: PopoverPlacement[] = ["top", "bottom", "left", "right"];
		for (const anchor of corners) {
			for (const placement of placements) {
				const position = resolveAnchoredPosition(input({ anchor, placement, content: { width: 220, height: 160 } }));
				const height = Math.min(160, position.maxHeight);
				expect(position.x).toBeGreaterThanOrEqual(PAD);
				expect(position.x + 220).toBeLessThanOrEqual(400 - PAD);
				expect(position.y).toBeGreaterThanOrEqual(50 + PAD);
				expect(position.y + height).toBeLessThanOrEqual(800 - 30 - PAD);
			}
		}
	});
});

describe("resolveAnchoredPosition — maxHeight", () => {
	test("is the room on the resolved side when none is asked for", () => {
		const position = resolveAnchoredPosition(input());
		expect(position.maxHeight).toBe(800 - 30 - PAD - (380 + 40 + 8));
	});

	test("is the asked-for cap when it fits", () => {
		expect(resolveAnchoredPosition(input({ maxHeight: 120 })).maxHeight).toBe(120);
	});

	test("clamps the asked-for cap to the room", () => {
		const anchor = { x: 150, y: 600, width: 100, height: 40 };
		const position = resolveAnchoredPosition(input({ anchor, maxHeight: 500, content: { width: 200, height: 80 } }));
		expect(position.placement).toBe("bottom");
		expect(position.maxHeight).toBe(800 - 30 - PAD - 648);
	});

	test("a too-tall panel on the side with more room is clamped to it and stays on screen", () => {
		const anchor = { x: 150, y: 120, width: 100, height: 40 };
		const position = resolveAnchoredPosition(input({ anchor, content: { width: 200, height: 900 } }));
		expect(position.maxHeight).toBe(800 - 30 - PAD - 168);
		expect(position.y).toBe(168);
	});

	test("a top panel taller than its room is clamped and still meets the anchor", () => {
		const anchor = { x: 150, y: 700, width: 100, height: 40 };
		const position = resolveAnchoredPosition(input({ anchor, content: { width: 200, height: 900 } }));
		expect(position.placement).toBe("top");
		expect(position.maxHeight).toBe(700 - 8 - (50 + PAD));
		expect(position.y).toBe(50 + PAD);
	});

	test("a side placement is capped by the safe height", () => {
		const position = resolveAnchoredPosition(
			input({ placement: "right", anchor: { x: 20, y: 380, width: 40, height: 40 } })
		);
		expect(position.maxHeight).toBe(800 - 50 - 30 - 2 * PAD);
	});

	test("is never negative", () => {
		const anchor = { x: 150, y: 900, width: 100, height: 40 };
		expect(resolveAnchoredPosition(input({ anchor })).maxHeight).toBeGreaterThanOrEqual(0);
	});
});

describe("resolveAnchoredPosition — arrow", () => {
	test("points at the anchor's centre", () => {
		const position = resolveAnchoredPosition(input({ align: "start" }));
		expect(position.arrowOffset).toBe(200 - 150);
	});

	test("tracks the anchor after a shift", () => {
		const anchor = { x: 330, y: 380, width: 40, height: 40 };
		const position = resolveAnchoredPosition(input({ anchor }));
		expect(position.x).toBe(400 - PAD - 200);
		expect(position.x + position.arrowOffset).toBe(350);
	});

	test("is clamped clear of the leading corner", () => {
		const anchor = { x: 0, y: 380, width: 10, height: 40 };
		expect(resolveAnchoredPosition(input({ anchor })).arrowOffset).toBe(16);
	});

	test("is clamped clear of the trailing corner", () => {
		const anchor = { x: 390, y: 380, width: 10, height: 40 };
		expect(resolveAnchoredPosition(input({ anchor })).arrowOffset).toBe(200 - 16);
	});

	test("runs along the vertical edge on a side placement", () => {
		const anchor = { x: 20, y: 80, width: 40, height: 40 };
		const position = resolveAnchoredPosition(input({ anchor, placement: "right" }));
		expect(position.y).toBe(50 + PAD);
		expect(position.y + position.arrowOffset).toBe(100);
	});

	test("sits in the middle of a panel too small to clear both corners", () => {
		const position = resolveAnchoredPosition(input({ content: { width: 20, height: 20 } }));
		expect(position.arrowOffset).toBe(10);
	});
});

describe("resolvePopoverWidth", () => {
	const safe = { anchorWidth: 120, bounds: BOUNDS, collisionPadding: PAD };

	test('"trigger" is the anchor width', () => {
		expect(resolvePopoverWidth({ ...safe, width: "trigger" })).toEqual({ width: 120, maxWidth: 384 });
	});

	test('"content-fit" leaves the width to the content', () => {
		expect(resolvePopoverWidth({ ...safe, width: "content-fit" })).toEqual({ width: undefined, maxWidth: 384 });
	});

	test('"full" is the safe span', () => {
		expect(resolvePopoverWidth({ ...safe, width: "full" })).toEqual({ width: 384, maxWidth: 384 });
	});

	test("a number is taken as it is, capped to the safe span", () => {
		expect(resolvePopoverWidth({ ...safe, width: 240 })).toEqual({ width: 240, maxWidth: 384 });
		expect(resolvePopoverWidth({ ...safe, width: 900 })).toEqual({ width: 384, maxWidth: 384 });
	});

	test("minWidth raises a narrow trigger", () => {
		expect(resolvePopoverWidth({ ...safe, width: "trigger", minWidth: 260 })).toEqual({ width: 260, maxWidth: 384 });
	});

	test("minWidth is a floor for a content-fit panel", () => {
		expect(resolvePopoverWidth({ ...safe, width: "content-fit", minWidth: 200 })).toEqual({
			width: undefined,
			minWidth: 200,
			maxWidth: 384,
		});
	});

	test("the safe span subtracts horizontal insets", () => {
		const bounds = { ...BOUNDS, insets: { ...BOUNDS.insets, left: 44, right: 44 } };
		expect(resolvePopoverWidth({ ...safe, bounds, width: "full" }).width).toBe(400 - 88 - 2 * PAD);
	});
});

describe("motion geometry", () => {
	test("a panel below enters downward from the trigger", () => {
		expect(resolveEnterTranslate("bottom", 6)).toEqual({ x: 0, y: -6 });
		expect(resolveEnterTranslate("top", 6)).toEqual({ x: 0, y: 6 });
		expect(resolveEnterTranslate("right", 6)).toEqual({ x: -6, y: 0 });
		expect(resolveEnterTranslate("left", 6)).toEqual({ x: 6, y: 0 });
	});

	test("the transform origin is the arrow, on the edge facing the anchor", () => {
		const size = { width: 200, height: 100 };
		expect(resolveTransformOrigin("bottom", 40, size)).toEqual({ x: 40, y: 0 });
		expect(resolveTransformOrigin("top", 40, size)).toEqual({ x: 40, y: 100 });
		expect(resolveTransformOrigin("right", 30, size)).toEqual({ x: 0, y: 30 });
		expect(resolveTransformOrigin("left", 30, size)).toEqual({ x: 200, y: 30 });
	});
});
