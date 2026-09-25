import { useCallback, useMemo, useRef, useState } from "react";
import type { SheetEvent, SheetMachine, SheetMachineSnapshot, SheetStepDirection } from "../core";
import type { SheetStepController, UseSheetMachineOptions } from "./steps.types";

type MachineState<S extends string, C> = { snapshot: SheetMachineSnapshot<S, C>; direction: SheetStepDirection };

/**
 * Runs a sheet machine as React state.
 *
 * `send` is `machine.transition` over the latest snapshot: a success becomes
 * the new state and `onTransition` hears about it, a refusal leaves the state
 * alone and `onRejected` hears why. The latest snapshot lives in a ref as
 * well as in state, so two `send`s in one tick chain rather than both reading
 * the render they were made in.
 *
 * Not a `useReducer`, on purpose: a reducer has to be pure and React may run
 * it twice, and `onRejected` is a side effect a caller wants exactly once.
 *
 * `can` and `matches` close over the rendered snapshot, not the ref, and are
 * rebuilt with it: the React Compiler memoises `can({ type: "NEXT" })` on the
 * identity of `can`, and a stable `can` reading a ref returned the answer
 * from the render it was first called in — the Next button never unlocked.
 * `send` and `reset` stay stable; they are actions, not questions.
 */
export function useSheetMachine<S extends string, C, E extends SheetEvent>(
	machine: SheetMachine<S, C, E>,
	options: UseSheetMachineOptions<S, C, E> = {}
): SheetStepController<S, C, E> {
	const [state, setState] = useState<MachineState<S, C>>({ snapshot: machine.initial, direction: "forward" });
	const latest = useRef(state);
	const callbacks = useRef(options);
	callbacks.current = options;

	const send = useCallback(
		(event: E) => {
			const from = latest.current.snapshot;
			const result = machine.transition(from, event);
			if (!result.success) {
				callbacks.current.onRejected?.(result.error, event);
				return;
			}
			const to = result.data;
			const direction = to.value === from.value ? latest.current.direction : machine.directionOf(from.value, to.value);
			latest.current = { snapshot: to, direction };
			setState(latest.current);
			callbacks.current.onTransition?.(from, to, event);
		},
		[machine]
	);

	const reset = useCallback(() => {
		latest.current = { snapshot: machine.initial, direction: "back" };
		setState(latest.current);
	}, [machine]);

	const { snapshot, direction } = state;
	return useMemo<SheetStepController<S, C, E>>(
		() => ({
			...snapshot,
			machine,
			steps: machine.steps,
			direction,
			send,
			can: (event) => machine.can(snapshot, event),
			matches: (step) => snapshot.value === step,
			reset,
		}),
		[snapshot, direction, machine, send, reset]
	);
}
