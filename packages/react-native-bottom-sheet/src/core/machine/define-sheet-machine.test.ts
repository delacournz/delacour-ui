import { describe, expect, test } from "bun:test";
import { defineSheetMachine } from "./define-sheet-machine";
import type { SheetMachineSnapshot } from "./machine.types";

type Step = "details" | "confirm" | "success";
type Context = { name: string; agreed: boolean };
type Event =
	| { type: "NEXT" }
	| { type: "BACK" }
	| { type: "EDIT"; field: keyof Context; value: Context[keyof Context] }
	| { type: "RESET" };

const machine = defineSheetMachine<Step, Context, Event>({
	id: "checkout",
	initial: "details",
	context: { name: "", agreed: false },
	states: {
		details: {
			snapPoints: ["50%"],
			on: {
				NEXT: { target: "confirm", guard: (context) => context.name.length > 0 },
				EDIT: {
					target: "details",
					assign: (context, event) => ({ ...context, [event.field]: event.value }),
				},
			},
		},
		confirm: {
			on: {
				NEXT: { target: "success", guard: (context) => context.agreed },
				BACK: "details",
				EDIT: {
					target: "confirm",
					assign: (context, event) => ({ ...context, [event.field]: event.value }),
				},
			},
		},
		success: {
			snapPoints: [240],
			dismissible: false,
			on: { RESET: { target: "details", assign: () => ({ name: "", agreed: false }) } },
		},
	},
});

const filled: SheetMachineSnapshot<Step, Context> = {
	value: "details",
	context: { name: "Ada", agreed: false },
	history: [],
};

describe("defineSheetMachine", () => {
	test("initial snapshot is the configured initial state, context and an empty history", () => {
		expect(machine.initial).toEqual({ value: "details", context: { name: "", agreed: false }, history: [] });
		expect(machine.config.id).toBe("checkout");
	});

	test("steps are the states in declaration order", () => {
		expect(machine.steps).toEqual(["details", "confirm", "success"]);
	});

	test("nodeOf exposes per-step snapPoints and dismissible", () => {
		expect(machine.nodeOf("details").snapPoints).toEqual(["50%"]);
		expect(machine.nodeOf("details").dismissible).toBeUndefined();
		expect(machine.nodeOf("success").snapPoints).toEqual([240]);
		expect(machine.nodeOf("success").dismissible).toBe(false);
	});

	describe("transition", () => {
		test("succeeds on a bare string target and appends the origin to history", () => {
			const result = machine.transition({ ...filled, value: "confirm", history: ["details"] }, { type: "BACK" });
			expect(result).toEqual({
				success: true,
				data: { value: "details", context: filled.context, history: ["details", "confirm"] },
			});
		});

		test("fails with no-transition when the state does not handle the event", () => {
			expect(machine.transition(machine.initial, { type: "BACK" })).toEqual({
				success: false,
				error: { code: "no-transition", from: "details", event: "BACK" },
			});
		});

		test("fails with guard-rejected when the guard says no", () => {
			expect(machine.transition(machine.initial, { type: "NEXT" })).toEqual({
				success: false,
				error: { code: "guard-rejected", from: "details", to: "confirm", event: "NEXT" },
			});
		});

		test("passes a guard once context allows it", () => {
			const result = machine.transition(filled, { type: "NEXT" });
			expect(result.success).toBe(true);
			if (result.success) expect(result.data.value).toBe("confirm");
		});

		test("a self-target with assign keeps value, updates context and does not push history", () => {
			const result = machine.transition(machine.initial, { type: "EDIT", field: "name", value: "Ada" });
			expect(result).toEqual({
				success: true,
				data: { value: "details", context: { name: "Ada", agreed: false }, history: [] },
			});
		});

		test("assign never mutates the incoming snapshot", () => {
			const before = { value: "details" as const, context: { name: "", agreed: false }, history: [] as Step[] };
			const original = structuredClone(before);
			machine.transition(before, { type: "EDIT", field: "agreed", value: true });
			expect(before).toEqual(original);
		});

		test("history is not shared with the incoming snapshot", () => {
			const result = machine.transition(filled, { type: "NEXT" });
			if (!result.success) throw new Error("expected success");
			expect(result.data.history).not.toBe(filled.history);
			expect(filled.history).toEqual([]);
		});

		test("assign runs before the target is entered so a reset lands with fresh context", () => {
			const result = machine.transition(
				{ value: "success", context: { name: "Ada", agreed: true }, history: ["details", "confirm"] },
				{ type: "RESET" }
			);
			expect(result).toEqual({
				success: true,
				data: { value: "details", context: { name: "", agreed: false }, history: ["details", "confirm", "success"] },
			});
		});
	});

	describe("can", () => {
		test("is true only when transition would succeed", () => {
			expect(machine.can(machine.initial, { type: "NEXT" })).toBe(false);
			expect(machine.can(machine.initial, { type: "BACK" })).toBe(false);
			expect(machine.can(filled, { type: "NEXT" })).toBe(true);
			expect(machine.can(machine.initial, { type: "EDIT", field: "name", value: "x" })).toBe(true);
		});
	});

	describe("directionOf", () => {
		test("follows declaration order when the target declares no direction", () => {
			expect(machine.directionOf("details", "confirm")).toBe("forward");
			expect(machine.directionOf("confirm", "details")).toBe("back");
			expect(machine.directionOf("details", "success")).toBe("forward");
			expect(machine.directionOf("details", "details")).toBe("forward");
		});

		test("an explicit direction on the target node wins over index order", () => {
			const explicit = defineSheetMachine<"a" | "b" | "c", Record<string, never>, { type: "GO" }>({
				initial: "a",
				context: {},
				states: {
					a: { direction: "back", on: { GO: "b" } },
					b: { on: { GO: "c" } },
					c: { direction: "back", on: { GO: "a" } },
				},
			});
			expect(explicit.directionOf("b", "c")).toBe("back");
			expect(explicit.directionOf("c", "a")).toBe("back");
			expect(explicit.directionOf("a", "b")).toBe("forward");
		});
	});

	test("a full details → confirm → success run", () => {
		let snapshot = machine.initial;
		const send = (event: Event): void => {
			const result = machine.transition(snapshot, event);
			if (!result.success) throw new Error(`${result.error.code} on ${event.type} from ${result.error.from}`);
			snapshot = result.data;
		};

		expect(machine.can(snapshot, { type: "NEXT" })).toBe(false);
		send({ type: "EDIT", field: "name", value: "Ada" });
		send({ type: "NEXT" });
		expect(snapshot.value).toBe("confirm");
		expect(machine.can(snapshot, { type: "NEXT" })).toBe(false);
		send({ type: "EDIT", field: "agreed", value: true });
		send({ type: "NEXT" });
		expect(snapshot).toEqual({
			value: "success",
			context: { name: "Ada", agreed: true },
			history: ["details", "confirm"],
		});
		expect(machine.nodeOf(snapshot.value).dismissible).toBe(false);
	});
});
