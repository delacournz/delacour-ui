import { describe, expect, test } from "bun:test";
import { createElement, type ReactNode } from "react";
import { declaredTokens } from "../../styles/theme-tokens.test";
import {
	partitionStackChildren,
	resolveBehindTransform,
	resolveDragOffset,
	resolveDragProgress,
	resolveExitOffset,
	resolveMountedWindow,
	resolveStackDepth,
	resolveStackRelease,
	resolveStampOpacity,
	STACK_CARD_DIRECTIONS,
	STACK_CARD_LAYOUTS,
	STACK_CARD_STAMP_COLORS,
	type StackCardChildKind,
	stackCardVariants,
} from "./stack-card.variants";

const LIGHT = declaredTokens("light");
const DARK = declaredTokens("dark");

const SIZE = { height: 400, width: 300 };
const BOTH = ["left", "right"] as const;
const ALL = STACK_CARD_DIRECTIONS;

describe("partitionStackChildren", () => {
	function Stamp(): null {
		return null;
	}
	function Empty(): null {
		return null;
	}
	function Actions(): null {
		return null;
	}
	function Card(): null {
		return null;
	}
	const kindOf = (node: ReactNode): StackCardChildKind => {
		if (typeof node !== "object" || node === null || !("type" in node)) return "card";
		if (node.type === Stamp) return "stamp";
		if (node.type === Empty) return "empty";
		if (node.type === Actions) return "actions";
		return "card";
	};

	test("sorts children by kind, keeping the cards in order", () => {
		const children = [
			createElement(Stamp, { key: "s1" }),
			createElement(Card, { key: "a" }),
			createElement(Card, { key: "b" }),
			createElement(Empty, { key: "e" }),
			createElement(Stamp, { key: "s2" }),
			createElement(Card, { key: "c" }),
			createElement(Actions, { key: "x" }),
		];
		const { stamps, cards, empty, actions } = partitionStackChildren(children, kindOf);
		expect(stamps).toHaveLength(2);
		expect(cards.map((card) => (card as { key: string }).key)).toEqual([".$a", ".$b", ".$c"]);
		expect(empty).not.toBeNull();
		expect(actions).not.toBeNull();
	});

	test("anything it does not recognise is a card, so a wrapped card still counts", () => {
		function MyCard(): null {
			return null;
		}
		const { cards } = partitionStackChildren([createElement(MyCard, { key: "m" })], kindOf);
		expect(cards).toHaveLength(1);
	});

	test("drops null and false holes", () => {
		const { cards } = partitionStackChildren([null, false, createElement(Card, { key: "a" })], kindOf);
		expect(cards).toHaveLength(1);
	});

	test("with no empty or actions, both are null", () => {
		const { empty, actions } = partitionStackChildren([createElement(Card, { key: "a" })], kindOf);
		expect(empty).toBeNull();
		expect(actions).toBeNull();
	});

	test("the first empty and the first actions win", () => {
		const first = createElement(Empty, { key: "first" });
		const { empty } = partitionStackChildren([first, createElement(Empty, { key: "second" })], kindOf);
		expect((empty as { key: string }).key).toBe(".$first");
	});
});

describe("resolveStackRelease", () => {
	const base = { ...SIZE, directions: BOTH, threshold: 0.3, vx: 0, vy: 0, x: 0, y: 0 };

	test("a short drag springs back", () => {
		expect(resolveStackRelease({ ...base, x: 50 })).toBeNull();
	});

	test("a drag past the threshold throws that way", () => {
		expect(resolveStackRelease({ ...base, x: 100 })).toBe("right");
		expect(resolveStackRelease({ ...base, x: -100 })).toBe("left");
	});

	test("the threshold is a fraction of the card's own size", () => {
		expect(resolveStackRelease({ ...base, x: 89 })).toBeNull();
		expect(resolveStackRelease({ ...base, x: 90 })).toBe("right");
	});

	test("momentum counts: a flick throws from a short drag", () => {
		expect(resolveStackRelease({ ...base, vx: 800, x: 20 })).toBe("right");
	});

	test("a flick back toward the centre cancels a long drag", () => {
		expect(resolveStackRelease({ ...base, vx: -800, x: 100 })).toBeNull();
	});

	test("the dominant axis wins", () => {
		const all = { ...base, directions: ALL };
		expect(resolveStackRelease({ ...all, x: 100, y: 200 })).toBe("down");
		expect(resolveStackRelease({ ...all, x: 200, y: -130 })).toBe("right");
		expect(resolveStackRelease({ ...all, x: 0, y: -130 })).toBe("up");
	});

	test("the dominant axis is measured against each axis's own size", () => {
		const all = { ...base, directions: ALL };
		// 120 of 300 wide beats 150 of 400 tall.
		expect(resolveStackRelease({ ...all, x: 120, y: 150 })).toBe("right");
	});

	test("a disallowed direction gives null", () => {
		expect(resolveStackRelease({ ...base, y: 300 })).toBeNull();
		expect(resolveStackRelease({ ...base, directions: ["right"], x: -200 })).toBeNull();
	});

	test("an unmeasured card never throws", () => {
		expect(resolveStackRelease({ ...base, height: 0, width: 0, x: 500 })).toBeNull();
	});
});

describe("resolveDragOffset", () => {
	test("an allowed direction follows the finger one to one", () => {
		expect(resolveDragOffset({ directions: BOTH, translationX: 80, translationY: 30 })).toEqual({
			x: 80,
			y: 30 * 0.25,
		});
	});

	test("a disallowed direction still gives a little, at a quarter", () => {
		expect(resolveDragOffset({ directions: ["right"], translationX: -80, translationY: 0 })).toEqual({
			x: -20,
			y: 0,
		});
	});

	test("with all four allowed nothing resists", () => {
		expect(resolveDragOffset({ directions: ALL, translationX: -40, translationY: 60 })).toEqual({ x: -40, y: 60 });
	});
});

describe("resolveDragProgress", () => {
	test("is zero at rest and one at the threshold", () => {
		expect(resolveDragProgress({ ...SIZE, threshold: 0.3, x: 0, y: 0 })).toBe(0);
		expect(resolveDragProgress({ ...SIZE, threshold: 0.3, x: 90, y: 0 })).toBe(1);
		expect(resolveDragProgress({ ...SIZE, threshold: 0.3, x: 45, y: 0 })).toBeCloseTo(0.5);
	});

	test("takes the furthest axis and clamps", () => {
		expect(resolveDragProgress({ ...SIZE, threshold: 0.3, x: 10, y: -60 })).toBeCloseTo(0.5);
		expect(resolveDragProgress({ ...SIZE, threshold: 0.3, x: 900, y: 0 })).toBe(1);
	});

	test("is zero before the card is measured", () => {
		expect(resolveDragProgress({ height: 0, threshold: 0.3, width: 0, x: 90, y: 0 })).toBe(0);
	});
});

describe("resolveStampOpacity", () => {
	const at = (x: number, y: number, direction: (typeof ALL)[number]) =>
		resolveStampOpacity({ ...SIZE, direction, threshold: 0.3, x, y });

	test("rises with progress toward its own direction", () => {
		expect(at(0, 0, "right")).toBe(0);
		expect(at(45, 0, "right")).toBeCloseTo(0.5);
		expect(at(90, 0, "right")).toBe(1);
		expect(at(400, 0, "right")).toBe(1);
	});

	test("stays dark for the opposite direction", () => {
		expect(at(90, 0, "left")).toBe(0);
		expect(at(-90, 0, "left")).toBe(1);
	});

	test("stays dark when the other axis is the one winning", () => {
		expect(at(60, 200, "right")).toBe(0);
		expect(at(60, 200, "down")).toBe(1);
		expect(at(0, -120, "up")).toBe(1);
	});
});

describe("resolveBehindTransform", () => {
	test("stack steps each card down and smaller", () => {
		expect(resolveBehindTransform({ depth: 2, layout: "stack", position: 1, progress: 0 })).toEqual({
			opacity: 1,
			rotate: 0,
			scale: 0.96,
			translateY: 8,
		});
		const second = resolveBehindTransform({ depth: 2, layout: "stack", position: 2, progress: 0 });
		expect(second.translateY).toBe(16);
		expect(second.scale).toBeCloseTo(0.92);
	});

	test("at full progress a card is exactly where the one ahead of it was", () => {
		for (const layout of STACK_CARD_LAYOUTS) {
			for (const position of [1, 2, 3]) {
				const moved = resolveBehindTransform({ depth: 2, layout, position, progress: 1 });
				const ahead = resolveBehindTransform({ depth: 2, layout, position: position - 1, progress: 0 });
				expect(moved.translateY).toBeCloseTo(ahead.translateY);
				expect(moved.scale).toBeCloseTo(ahead.scale);
				expect(moved.rotate).toBeCloseTo(ahead.rotate);
				expect(moved.opacity).toBeCloseTo(ahead.opacity);
			}
		}
	});

	test("the top position is the identity, so the card behind lands with nothing to correct", () => {
		for (const layout of STACK_CARD_LAYOUTS) {
			expect(resolveBehindTransform({ depth: 2, layout, position: 0, progress: 0 })).toEqual({
				opacity: 1,
				rotate: 0,
				scale: 1,
				translateY: 0,
			});
		}
	});

	test("fan alternates its rotation", () => {
		const one = resolveBehindTransform({ depth: 3, layout: "fan", position: 1, progress: 0 });
		const two = resolveBehindTransform({ depth: 3, layout: "fan", position: 2, progress: 0 });
		expect(one.rotate).toBe(3);
		expect(two.rotate).toBe(-6);
		expect(one.translateY).toBe(0);
	});

	test("flat hides every card behind", () => {
		expect(resolveBehindTransform({ depth: 2, layout: "flat", position: 1, progress: 0 }).opacity).toBe(0);
	});

	test("the card one past the visible depth waits hidden and fades in", () => {
		expect(resolveBehindTransform({ depth: 2, layout: "stack", position: 3, progress: 0 }).opacity).toBe(0);
		expect(resolveBehindTransform({ depth: 2, layout: "stack", position: 3, progress: 0.5 }).opacity).toBeCloseTo(0.5);
		expect(resolveBehindTransform({ depth: 0, layout: "stack", position: 1, progress: 0 }).opacity).toBe(0);
	});

	test("clamps progress", () => {
		const over = resolveBehindTransform({ depth: 2, layout: "stack", position: 1, progress: 4 });
		expect(over.translateY).toBe(0);
	});
});

describe("resolveExitOffset", () => {
	test("throws past one and a half of the card's size", () => {
		expect(resolveExitOffset({ ...SIZE, direction: "right" })).toEqual({ x: 450, y: 0 });
		expect(resolveExitOffset({ ...SIZE, direction: "left" })).toEqual({ x: -450, y: 0 });
		expect(resolveExitOffset({ ...SIZE, direction: "up" })).toEqual({ x: 0, y: -600 });
		expect(resolveExitOffset({ ...SIZE, direction: "down" })).toEqual({ x: 0, y: 600 });
	});
});

describe("resolveMountedWindow", () => {
	test("one behind for undo, the visible depth, and one beyond", () => {
		expect(resolveMountedWindow({ count: 500, depth: 2, index: 10 })).toEqual([9, 14]);
	});

	test("clamps to the deck", () => {
		expect(resolveMountedWindow({ count: 500, depth: 2, index: 0 })).toEqual([0, 4]);
		expect(resolveMountedWindow({ count: 3, depth: 2, index: 2 })).toEqual([1, 3]);
		expect(resolveMountedWindow({ count: 3, depth: 2, index: 3 })).toEqual([2, 3]);
		expect(resolveMountedWindow({ count: 0, depth: 2, index: 0 })).toEqual([0, 0]);
	});

	test("costs the same for a deck of 500 as for a deck of 5", () => {
		const [from, to] = resolveMountedWindow({ count: 500, depth: 4, index: 250 });
		expect(to - from).toBe(7);
	});
});

describe("resolveStackDepth", () => {
	test("defaults to two", () => {
		expect(resolveStackDepth()).toBe(2);
		expect(resolveStackDepth(Number.NaN)).toBe(2);
	});

	test("clamps to 0..4 and rounds", () => {
		expect(resolveStackDepth(-1)).toBe(0);
		expect(resolveStackDepth(9)).toBe(4);
		expect(resolveStackDepth(2.6)).toBe(3);
	});
});

describe("stackCardVariants", () => {
	test("the card takes a card's look and fills the pile", () => {
		const card = stackCardVariants().card();
		for (const cls of ["bg-card", "border", "border-border", "rounded-lg", "absolute", "inset-0"]) {
			expect(card.split(" ")).toContain(cls);
		}
	});

	test("the pile takes the remaining height", () => {
		expect(stackCardVariants().pile()).toContain("flex-1");
	});

	test("every stamp colour borders the stamp and colours its label from one token", () => {
		for (const color of STACK_CARD_STAMP_COLORS) {
			const slots = stackCardVariants({ color });
			expect(slots.stamp()).toContain(`border-${color}`);
			expect(slots.stampLabel()).toContain(`text-${color}`);
		}
	});

	test("every stamp colour is declared in both themes", () => {
		for (const color of STACK_CARD_STAMP_COLORS) {
			expect(LIGHT.has(color)).toBe(true);
			expect(DARK.has(color)).toBe(true);
		}
	});

	test("text colour sits on the label, never on the stamp or the card (rule 1)", () => {
		for (const color of STACK_CARD_STAMP_COLORS) {
			const slots = stackCardVariants({ color });
			expect(slots.stamp()).not.toMatch(/\btext-/);
			expect(slots.card()).not.toMatch(/\btext-/);
		}
	});

	test("a stamp is placed on the side it answers for", () => {
		expect(stackCardVariants({ direction: "right" }).stamp()).toContain("left-");
		expect(stackCardVariants({ direction: "left" }).stamp()).toContain("right-");
		expect(stackCardVariants({ direction: "up" }).stamp()).toContain("bottom-");
		expect(stackCardVariants({ direction: "down" }).stamp()).toContain("top-");
	});

	test("the actions row is centred", () => {
		const actions = stackCardVariants().actions();
		expect(actions).toContain("flex-row");
		expect(actions).toContain("justify-center");
	});

	test("the empty slot centres inside the pile", () => {
		const empty = stackCardVariants().empty();
		expect(empty).toContain("absolute");
		expect(empty).toContain("items-center");
		expect(empty).toContain("justify-center");
	});
});
