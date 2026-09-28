/**
 * A typed multi-step machine for a sheet body, with no XState in the graph.
 *
 * `defineSheetMachine` reads a config once and hands back the functions
 * `BottomSheet.Steps` and `useSheetMachine` need: `transition` and `can` for
 * the reducer, `steps` and `directionOf` for the animation, `nodeOf` for the
 * per-step `snapPoints` and `dismissible` overrides. Any object with the same
 * shape — an XState adapter, say — can stand in for it.
 */
import type { SheetEvent, SheetMachine, SheetMachineConfig, SheetStepDirection } from "./machine.types";
import { transition } from "./transition";

export function defineSheetMachine<S extends string, C, E extends SheetEvent>(
	config: SheetMachineConfig<S, C, E>
): SheetMachine<S, C, E> {
	const { states } = config;
	const steps = Object.keys(states) as S[];
	const indexOf = new Map(steps.map((step, index) => [step, index]));

	const directionOf = (from: S, to: S): SheetStepDirection => {
		const explicit = states[to].direction;
		if (explicit !== undefined) return explicit;
		return (indexOf.get(to) ?? 0) < (indexOf.get(from) ?? 0) ? "back" : "forward";
	};

	return {
		config,
		initial: { value: config.initial, context: config.context, history: [] },
		transition: (snapshot, event) => transition(states, snapshot, event),
		can: (snapshot, event) => transition(states, snapshot, event).success,
		steps,
		directionOf,
		nodeOf: (step) => states[step],
	};
}
