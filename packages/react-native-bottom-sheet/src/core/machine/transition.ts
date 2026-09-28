/**
 * The one step of a sheet machine: a snapshot and an event in, the next
 * snapshot or a typed refusal out.
 *
 * A refusal is data, not an exception. A `NEXT` the guard rejects is the
 * normal case for a form with an empty field, and the caller wants to know
 * which edge said no rather than catch something.
 */
import { err, ok } from "../result";
import type {
	SheetEvent,
	SheetMachineSnapshot,
	SheetStates,
	SheetTransitionObject,
	SheetTransitionResult,
	SheetTransitionTarget,
} from "./machine.types";

/** A bare state name widened to the object form; an object returned as is. */
export function resolveTarget<S extends string, C, E extends SheetEvent>(
	target: SheetTransitionTarget<S, C, E>
): SheetTransitionObject<S, C, E> {
	return typeof target === "string" ? { target } : target;
}

/**
 * The transition `states[value].on[event.type]`, seen with the whole event
 * union. Per-type narrowing is the author's contract with `on`; at the moment
 * of dispatch the event's `type` has already selected the handler that was
 * written for it, so widening back to `E` here loses nothing.
 */
function transitionFor<S extends string, C, E extends SheetEvent>(
	states: SheetStates<S, C, E>,
	value: S,
	type: E["type"]
): SheetTransitionTarget<S, C, E> | undefined {
	const on = states[value].on as { [T in E["type"]]?: SheetTransitionTarget<S, C, E> } | undefined;
	return on?.[type];
}

export function transition<S extends string, C, E extends SheetEvent>(
	states: SheetStates<S, C, E>,
	snapshot: SheetMachineSnapshot<S, C>,
	event: E
): SheetTransitionResult<S, C> {
	const from = snapshot.value;
	const found = transitionFor(states, from, event.type);
	if (found === undefined) return err({ code: "no-transition", from, event: event.type });

	const { target, guard, assign } = resolveTarget(found);
	if (guard !== undefined && !guard(snapshot.context, event)) {
		return err({ code: "guard-rejected", from, to: target, event: event.type });
	}

	const context = assign === undefined ? snapshot.context : assign(snapshot.context, event);
	const history = target === from ? snapshot.history : [...snapshot.history, from];
	return ok({ value: target, context, history });
}
