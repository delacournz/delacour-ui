import { describe, expect, test } from "bun:test";
import { declarationCount } from "../../styles/theme-tokens.test";
import {
	buildMaskPath,
	resolveAdjacent,
	resolveCardPlacement,
	resolveCurrentOrder,
	resolveHoleRect,
	resolveMaskHole,
	resolveOverlayInsets,
	resolveRelativeRect,
	resolveScrimRects,
	resolveStepIndex,
	resolveStepOptions,
	resolveTourAnnouncement,
	resolveTourFooter,
	resolveTourLabels,
	resolveTourProgressLabel,
	resolveTourTestIDs,
	resolveTourTransitionDuration,
	sortSteps,
	TOUR_CARD_GAP,
	TOUR_CARD_MAX_WIDTH,
	TOUR_DEFAULT_LABELS,
	TOUR_DEFAULT_PADDING,
	TOUR_DEFAULT_PLACEMENT,
	TOUR_DEFAULT_RADIUS,
	TOUR_DEFAULT_SHAPE,
	TOUR_GUTTER,
	TOUR_PLACEMENTS,
	TOUR_SCRIM_TOKEN,
	TOUR_SHAPES,
	TOUR_TRANSITION_MS,
	tourVariants,
} from "./tour.variants";

const WINDOW = { width: 390, height: 844 };
const INSETS = { top: 47, bottom: 34, left: 0, right: 0 };

/** A slot's class string, with `tv`'s empty-slot `undefined` flattened. */
function cls(value: string | undefined): string {
	return value ?? "";
}

describe("constants", () => {
	test("the axes and defaults are the ones the docs name", () => {
		expect(TOUR_SHAPES).toEqual(["rect", "circle"]);
		expect(TOUR_PLACEMENTS).toEqual(["auto", "top", "bottom"]);
		expect(TOUR_DEFAULT_SHAPE).toBe("rect");
		expect(TOUR_DEFAULT_PLACEMENT).toBe("auto");
		expect(TOUR_DEFAULT_PADDING).toBe(8);
		expect(TOUR_DEFAULT_RADIUS).toBe(12);
		expect(TOUR_TRANSITION_MS).toBe(280);
	});

	test("the scrim token is declared in both themes", () => {
		expect(TOUR_SCRIM_TOKEN).toBe("overlay");
		expect(declarationCount(TOUR_SCRIM_TOKEN)).toBe(2);
	});

	test("the gap and gutter are positive and the card fits a small phone", () => {
		expect(TOUR_CARD_GAP).toBeGreaterThan(0);
		expect(TOUR_GUTTER).toBeGreaterThan(0);
		expect(TOUR_CARD_MAX_WIDTH).toBeGreaterThanOrEqual(320 - 2 * TOUR_GUTTER);
	});
});

describe("sortSteps", () => {
	test("orders by `order`, whatever order they registered in, without mutating", () => {
		const steps = [{ order: 3 }, { order: 1 }, { order: 2 }];
		expect(sortSteps(steps).map((s) => s.order)).toEqual([1, 2, 3]);
		expect(steps.map((s) => s.order)).toEqual([3, 1, 2]);
	});

	test("orders need not be contiguous", () => {
		expect(sortSteps([{ order: 20 }, { order: 5 }, { order: 10 }]).map((s) => s.order)).toEqual([5, 10, 20]);
	});
});

describe("resolveStepIndex", () => {
	test("the index of an order in the sorted list, or -1", () => {
		expect(resolveStepIndex([1, 2, 5], 1)).toBe(0);
		expect(resolveStepIndex([1, 2, 5], 5)).toBe(2);
		expect(resolveStepIndex([1, 2, 5], 3)).toBe(-1);
		expect(resolveStepIndex([], 1)).toBe(-1);
	});
});

describe("resolveAdjacent", () => {
	test("next and back walk the sorted orders", () => {
		expect(resolveAdjacent([1, 2, 5], 2, "next")).toBe(5);
		expect(resolveAdjacent([1, 2, 5], 2, "back")).toBe(1);
	});

	test("undefined off either end", () => {
		expect(resolveAdjacent([1, 2, 5], 5, "next")).toBeUndefined();
		expect(resolveAdjacent([1, 2, 5], 1, "back")).toBeUndefined();
	});

	test("an order that is not a step has no neighbour", () => {
		expect(resolveAdjacent([1, 2, 5], 3, "next")).toBeUndefined();
	});
});

describe("resolveCurrentOrder", () => {
	test("a step that exists is the answer", () => {
		expect(resolveCurrentOrder([1, 2, 3], 2)).toBe(2);
	});

	test("no step, or one that is not registered, falls back to the lowest order", () => {
		expect(resolveCurrentOrder([4, 9], undefined)).toBe(4);
		expect(resolveCurrentOrder([4, 9], 7)).toBe(4);
	});

	test("undefined with no steps at all", () => {
		expect(resolveCurrentOrder([], 1)).toBeUndefined();
	});
});

describe("resolveStepOptions", () => {
	const root = { padding: 8, radius: 12, shape: "rect", placement: "auto" } as const;

	test("a step's own value wins; an omitted one inherits the tour's", () => {
		expect(resolveStepOptions(root, { shape: "circle" })).toEqual({ ...root, shape: "circle" });
		expect(resolveStepOptions(root, { padding: 0, placement: "top" })).toEqual({
			...root,
			padding: 0,
			placement: "top",
		});
		expect(resolveStepOptions(root, {})).toEqual(root);
	});
});

describe("resolveHoleRect", () => {
	const target = { x: 100, y: 200, width: 80, height: 40 };

	test("rect: the target grown by the padding on every side, with the radius", () => {
		expect(resolveHoleRect({ target, padding: 8, shape: "rect", radius: 12 })).toEqual({
			x: 92,
			y: 192,
			width: 96,
			height: 56,
			radius: 12,
		});
	});

	test("rect: the radius never exceeds half the shorter side", () => {
		expect(resolveHoleRect({ target, padding: 0, shape: "rect", radius: 100 }).radius).toBe(20);
	});

	test("circle: a square around the larger side, centred, radius half of it", () => {
		expect(resolveHoleRect({ target, padding: 8, shape: "circle", radius: 12 })).toEqual({
			x: 92,
			y: 172,
			width: 96,
			height: 96,
			radius: 48,
		});
	});

	test("negative padding is treated as none", () => {
		expect(resolveHoleRect({ target, padding: -4, shape: "rect", radius: 0 })).toEqual({ ...target, radius: 0 });
	});
});

describe("resolveRelativeRect", () => {
	test("subtracts the overlay's own window origin", () => {
		expect(resolveRelativeRect({ x: 50, y: 300, width: 10, height: 20 }, { x: 0, y: 100 })).toEqual({
			x: 50,
			y: 200,
			width: 10,
			height: 20,
		});
	});
});

describe("resolveOverlayInsets", () => {
	test("a full-window overlay keeps the device insets", () => {
		expect(resolveOverlayInsets({ insets: INSETS, origin: { x: 0, y: 0 }, size: WINDOW, window: WINDOW })).toEqual(
			INSETS
		);
	});

	test("an overlay below the status bar and above the tab bar loses what it does not overlap", () => {
		expect(
			resolveOverlayInsets({
				insets: INSETS,
				origin: { x: 0, y: 100 },
				size: { width: 390, height: 660 },
				window: WINDOW,
			})
		).toEqual({ top: 0, bottom: 0, left: 0, right: 0 });
	});

	test("a partial overlap keeps the remainder", () => {
		expect(
			resolveOverlayInsets({
				insets: INSETS,
				origin: { x: 0, y: 20 },
				size: { width: 390, height: 814 },
				window: WINDOW,
			})
		).toEqual({ top: 27, bottom: 24, left: 0, right: 0 });
	});
});

describe("resolveMaskHole", () => {
	test("a rect hole passes through unchanged", () => {
		expect(resolveMaskHole({ x: 10, y: 20, width: 30, height: 40, radius: 5 })).toEqual({
			x: 10,
			y: 20,
			width: 30,
			height: 40,
			radius: 5,
		});
	});

	test("a zero radius stays a square-cornered rect", () => {
		expect(resolveMaskHole({ x: 0, y: 0, width: 10, height: 10, radius: 0 }).radius).toBe(0);
	});

	test("circle: radius half the side is kept, so the corners meet", () => {
		expect(resolveMaskHole({ x: 10, y: 10, width: 40, height: 40, radius: 20 }).radius).toBe(20);
	});

	test("a radius past half the shorter side is clamped, so the corners never cross", () => {
		expect(resolveMaskHole({ x: 0, y: 0, width: 20, height: 10, radius: 50 }).radius).toBe(5);
	});

	test("a negative radius is clamped to square corners", () => {
		expect(resolveMaskHole({ x: 0, y: 0, width: 20, height: 10, radius: -3 }).radius).toBe(0);
	});

	test("a negative size, mid-flight or unmeasured, collapses to an empty hole at its origin", () => {
		expect(resolveMaskHole({ x: 5, y: 6, width: -4, height: -2, radius: 8 })).toEqual({
			x: 5,
			y: 6,
			width: 0,
			height: 0,
			radius: 0,
		});
	});
});

describe("buildMaskPath", () => {
	test("rect: the outer window then a rounded hole, both closed", () => {
		const path = buildMaskPath({ width: 100, height: 200 }, { x: 10, y: 20, width: 30, height: 40, radius: 5 });
		expect(path).toBe(
			"M0 0H100V200H0Z" + "M15 20H35A5 5 0 0 1 40 25V55A5 5 0 0 1 35 60H15A5 5 0 0 1 10 55V25A5 5 0 0 1 15 20Z"
		);
	});

	test("a zero radius still draws a valid rect", () => {
		const path = buildMaskPath({ width: 100, height: 100 }, { x: 0, y: 0, width: 10, height: 10, radius: 0 });
		expect(path).toBe("M0 0H100V100H0ZM0 0H10A0 0 0 0 1 10 0V10A0 0 0 0 1 10 10H0A0 0 0 0 1 0 10V0A0 0 0 0 1 0 0Z");
	});

	test("circle: radius half the side draws two arcs and no straight edges", () => {
		const path = buildMaskPath({ width: 100, height: 100 }, { x: 10, y: 10, width: 40, height: 40, radius: 20 });
		expect(path).toBe(
			"M0 0H100V100H0ZM30 10H30A20 20 0 0 1 50 30V30A20 20 0 0 1 30 50H30A20 20 0 0 1 10 30V30A20 20 0 0 1 30 10Z"
		);
	});

	test("a radius past half the side is clamped, so the arcs never cross", () => {
		const path = buildMaskPath({ width: 100, height: 100 }, { x: 0, y: 0, width: 20, height: 10, radius: 50 });
		expect(path).toContain("A5 5");
	});

	test("rounds to two decimals, so an animating hole is not a wall of digits", () => {
		const path = buildMaskPath({ width: 100, height: 100 }, { x: 1 / 3, y: 2 / 3, width: 10, height: 10, radius: 0 });
		expect(path).toContain("M0.33 0.67");
	});
});

describe("resolveScrimRects", () => {
	test("four rects tile the window around the hole and never overlap it", () => {
		const hole = { x: 100, y: 200, width: 80, height: 40, radius: 0 };
		const [top, bottom, start, end] = resolveScrimRects(WINDOW, hole);
		expect(top).toEqual({ x: 0, y: 0, width: 390, height: 200 });
		expect(bottom).toEqual({ x: 0, y: 240, width: 390, height: 604 });
		expect(start).toEqual({ x: 0, y: 200, width: 100, height: 40 });
		expect(end).toEqual({ x: 180, y: 200, width: 210, height: 40 });
	});

	test("a hole past the window edge never yields a negative size", () => {
		const hole = { x: -20, y: -10, width: 100, height: 50, radius: 0 };
		for (const rect of resolveScrimRects(WINDOW, hole)) {
			expect(rect.width).toBeGreaterThanOrEqual(0);
			expect(rect.height).toBeGreaterThanOrEqual(0);
		}
	});
});

describe("resolveCardPlacement", () => {
	const base = {
		cardHeight: 160,
		window: WINDOW,
		insets: INSETS,
		gap: 12,
		gutter: 16,
		maxWidth: 360,
	};

	test("auto: below the hole when it fits", () => {
		const hole = { x: 20, y: 100, width: 80, height: 40, radius: 8 };
		const placement = resolveCardPlacement({ ...base, hole, preference: "auto" });
		expect(placement.side).toBe("bottom");
		expect(placement.top).toBe(152);
	});

	test("auto: above when the card would run past the bottom safe area", () => {
		const hole = { x: 20, y: 700, width: 80, height: 40, radius: 8 };
		const placement = resolveCardPlacement({ ...base, hole, preference: "auto" });
		expect(placement.side).toBe("top");
		expect(placement.top).toBe(700 - 12 - 160);
	});

	test("top is honoured when it fits", () => {
		const hole = { x: 20, y: 400, width: 80, height: 40, radius: 8 };
		expect(resolveCardPlacement({ ...base, hole, preference: "top" })).toMatchObject({ side: "top", top: 228 });
	});

	test("an explicit side that cannot fit flips to the side that can", () => {
		const nearTop = { x: 20, y: 60, width: 80, height: 40, radius: 8 };
		expect(resolveCardPlacement({ ...base, hole: nearTop, preference: "top" }).side).toBe("bottom");
		const nearBottom = { x: 20, y: 720, width: 80, height: 40, radius: 8 };
		expect(resolveCardPlacement({ ...base, hole: nearBottom, preference: "bottom" }).side).toBe("top");
	});

	test("when neither side fits, the roomier side wins and the card is clamped into the safe area", () => {
		const tall = { x: 20, y: 200, width: 80, height: 500, radius: 8 };
		const placement = resolveCardPlacement({ ...base, hole: tall, preference: "auto" });
		expect(placement.side).toBe("top");
		expect(placement.top).toBe(INSETS.top + 12);
	});

	test("width is the window less both gutters, capped", () => {
		const hole = { x: 20, y: 100, width: 80, height: 40, radius: 8 };
		expect(resolveCardPlacement({ ...base, hole, preference: "auto" }).width).toBe(358);
		const wide = resolveCardPlacement({ ...base, hole, preference: "auto", window: { width: 1024, height: 768 } });
		expect(wide.width).toBe(360);
	});

	test("centred on the hole and clamped to the gutters", () => {
		const wide = { width: 1024, height: 768 };
		const centred = resolveCardPlacement({
			...base,
			window: wide,
			hole: { x: 480, y: 100, width: 64, height: 40 },
			preference: "auto",
		});
		expect(centred.left).toBe(512 - 180);

		const atStart = resolveCardPlacement({
			...base,
			window: wide,
			hole: { x: 0, y: 100, width: 40, height: 40 },
			preference: "auto",
		});
		expect(atStart.left).toBe(16);

		const atEnd = resolveCardPlacement({
			...base,
			window: wide,
			hole: { x: 1000, y: 100, width: 24, height: 40 },
			preference: "auto",
		});
		expect(atEnd.left).toBe(1024 - 16 - 360);
	});

	test("the horizontal gutter clears the side insets", () => {
		const landscape = resolveCardPlacement({
			...base,
			window: { width: 844, height: 390 },
			insets: { top: 0, bottom: 21, left: 47, right: 47 },
			hole: { x: 0, y: 50, width: 40, height: 40 },
			preference: "auto",
		});
		expect(landscape.left).toBe(47 + 16);
	});
});

describe("resolveTourLabels", () => {
	test("defaults are English, and a partial override keeps the rest", () => {
		expect(TOUR_DEFAULT_LABELS.next).toBe("Next");
		expect(TOUR_DEFAULT_LABELS.back).toBe("Back");
		expect(TOUR_DEFAULT_LABELS.skip).toBe("Skip");
		expect(TOUR_DEFAULT_LABELS.finish).toBe("Done");
		const labels = resolveTourLabels({ next: "Weiter" });
		expect(labels.next).toBe("Weiter");
		expect(labels.back).toBe("Back");
		expect(resolveTourLabels(undefined)).toEqual(TOUR_DEFAULT_LABELS);
	});
});

describe("resolveTourProgressLabel", () => {
	test("1-based current of total", () => {
		expect(resolveTourProgressLabel(2, 5, TOUR_DEFAULT_LABELS)).toBe("2 of 5");
	});

	test("reads a caller's formatter", () => {
		expect(resolveTourProgressLabel(1, 3, resolveTourLabels({ progress: (c, t) => `${c}/${t}` }))).toBe("1/3");
	});
});

describe("resolveTourAnnouncement", () => {
	test("step position, title and description, in reading order", () => {
		expect(
			resolveTourAnnouncement({
				current: 2,
				total: 5,
				title: "Search",
				description: "Find anything.",
				labels: TOUR_DEFAULT_LABELS,
			})
		).toBe("Step 2 of 5. Search. Find anything.");
	});

	test("no description, no trailing sentence", () => {
		expect(resolveTourAnnouncement({ current: 1, total: 1, title: "Search", labels: TOUR_DEFAULT_LABELS })).toBe(
			"Step 1 of 1. Search."
		);
	});

	test("a title that already ends in punctuation is not doubled", () => {
		expect(resolveTourAnnouncement({ current: 1, total: 2, title: "Ready?", labels: TOUR_DEFAULT_LABELS })).toBe(
			"Step 1 of 2. Ready?"
		);
	});
});

describe("resolveTourFooter", () => {
	test("Back is hidden on the first step", () => {
		expect(resolveTourFooter({ index: 0, total: 3, hasSkip: true }).hasBack).toBe(false);
		expect(resolveTourFooter({ index: 1, total: 3, hasSkip: true }).hasBack).toBe(true);
	});

	test("the last step finishes, and drops Skip — Done already ends the tour", () => {
		expect(resolveTourFooter({ index: 2, total: 3, hasSkip: true })).toEqual({
			hasBack: true,
			hasSkip: false,
			isLast: true,
		});
	});

	test("hasSkip: false hides Skip everywhere", () => {
		expect(resolveTourFooter({ index: 0, total: 3, hasSkip: false }).hasSkip).toBe(false);
	});

	test("a one-step tour has no Back and no Skip", () => {
		expect(resolveTourFooter({ index: 0, total: 1, hasSkip: true })).toEqual({
			hasBack: false,
			hasSkip: false,
			isLast: true,
		});
	});
});

describe("resolveTourTransitionDuration", () => {
	test("reduce motion jumps the hole", () => {
		expect(resolveTourTransitionDuration({ isReducedMotion: false, isFirst: false })).toBe(TOUR_TRANSITION_MS);
		expect(resolveTourTransitionDuration({ isReducedMotion: true, isFirst: false })).toBe(0);
	});

	test("the first hole of an opening never travels in from nowhere", () => {
		expect(resolveTourTransitionDuration({ isReducedMotion: false, isFirst: true })).toBe(0);
	});
});

describe("tourVariants", () => {
	test("the card is a hairlined card surface at the card corner", () => {
		const card = cls(tourVariants().card());
		for (const c of ["bg-card", "rounded-lg", "border", "border-border", "p-4"]) {
			expect(card.split(" ")).toContain(c);
		}
	});

	test("a caller's card class merges over the slot", () => {
		expect(cls(tourVariants().card({ className: "p-6" })).split(" ")).toContain("p-6");
		expect(cls(tourVariants().card({ className: "p-6" })).split(" ")).not.toContain("p-4");
	});

	test("every slot the spec names exists", () => {
		const slots = tourVariants();
		for (const slot of ["root", "scrim", "card", "header", "title", "description", "footer", "progress"] as const) {
			expect(typeof slots[slot]).toBe("function");
		}
	});

	test("the root fills its parent so an interactive overlay can sit inside it", () => {
		expect(cls(tourVariants().root()).split(" ")).toContain("flex-1");
	});

	test("the card is absolutely positioned, so placement is a style and not layout", () => {
		expect(cls(tourVariants().card()).split(" ")).toContain("absolute");
	});
});

describe("resolveTourTestIDs", () => {
	test("derives the card and each action from the tour's testID", () => {
		expect(resolveTourTestIDs("onboarding")).toEqual({
			card: "onboarding-card",
			next: "onboarding-next",
			back: "onboarding-back",
			skip: "onboarding-skip",
		});
	});

	test("leaves every one unset when the tour has none", () => {
		expect(resolveTourTestIDs(undefined)).toEqual({
			card: undefined,
			next: undefined,
			back: undefined,
			skip: undefined,
		});
	});
});
