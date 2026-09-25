import { describe, expect, test } from "bun:test";
import type { SheetStates } from "./machine.types";
import { resolveTarget, transition } from "./transition";

type Event = { type: "GO" } | { type: "SET"; n: number };
type Context = { n: number };
const states: SheetStates<"one" | "two", Context, Event> = {
	one: {
		on: {
			GO: "two",
			SET: { target: "one", assign: (_context, event) => ({ n: event.n }) },
		},
	},
	two: { on: { GO: { target: "one", guard: (context) => context.n > 0 } } },
};

describe("transition", () => {
	test("resolveTarget widens a bare state name to a transition object", () => {
		expect(resolveTarget("two")).toEqual({ target: "two" });
		const object = { target: "two" as const, guard: () => true };
		expect(resolveTarget(object)).toBe(object);
	});

	test("moves between states and records the origin", () => {
		expect(transition(states, { value: "one", context: { n: 0 }, history: [] }, { type: "GO" })).toEqual({
			success: true,
			data: { value: "two", context: { n: 0 }, history: ["one"] },
		});
	});

	test("applies assign with the narrowed event", () => {
		expect(transition(states, { value: "one", context: { n: 0 }, history: [] }, { type: "SET", n: 4 })).toEqual({
			success: true,
			data: { value: "one", context: { n: 4 }, history: [] },
		});
	});

	test("reports guard-rejected with both ends of the edge", () => {
		expect(transition(states, { value: "two", context: { n: 0 }, history: ["one"] }, { type: "GO" })).toEqual({
			success: false,
			error: { code: "guard-rejected", from: "two", to: "one", event: "GO" },
		});
	});

	test("reports no-transition for an unhandled event", () => {
		expect(transition(states, { value: "two", context: { n: 1 }, history: [] }, { type: "SET", n: 1 })).toEqual({
			success: false,
			error: { code: "no-transition", from: "two", event: "SET" },
		});
	});
});
