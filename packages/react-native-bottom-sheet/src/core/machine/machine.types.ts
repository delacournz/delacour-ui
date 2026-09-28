/**
 * The vocabulary of the sheet state machine.
 *
 * A machine is a plain description — states, the events each handles, and
 * where they lead — and a snapshot is a plain value. Nothing here holds state;
 * `transition` takes a snapshot and returns the next one, which is what lets
 * `useSheetMachine` be a `useReducer` and an XState user substitute their own
 * controller.
 */
import type { Result } from "../result";
import type { DetentSpec } from "../sheet.types";

/** The least an event can be. Discriminate on `type`; carry anything else. */
export type SheetEvent = { type: string };

/** Which way a step change reads, for the transition the body animates. */
export type SheetStepDirection = "forward" | "back";

/**
 * A transition spelled out: where it goes, whether it may, and what it does to
 * context on the way. `assign` returns a new context and never mutates the one
 * it was given.
 */
export type SheetTransitionObject<S extends string, C, E extends SheetEvent> = {
	target: S;
	guard?: (context: C, event: E) => boolean;
	assign?: (context: C, event: E) => C;
};

/** A transition as written — a bare target, or the object above. */
export type SheetTransitionTarget<S extends string, C, E extends SheetEvent> = S | SheetTransitionObject<S, C, E>;

/**
 * One step. `on` maps an event type to its transition, and the handler for a
 * given `type` sees only that member of the event union. The sheet-facing
 * fields override the root configuration while the step is current.
 */
export type SheetStateNode<S extends string, C, E extends SheetEvent> = {
	on?: { [T in E["type"]]?: SheetTransitionTarget<S, C, Extract<E, { type: T }>> };
	snapPoints?: readonly DetentSpec[];
	dismissible?: boolean;
	direction?: SheetStepDirection;
};

/** Every step, keyed by name. Declaration order is step order. */
export type SheetStates<S extends string, C, E extends SheetEvent> = { [K in S]: SheetStateNode<S, C, E> };

export type SheetMachineConfig<S extends string, C, E extends SheetEvent> = {
	id?: string;
	initial: S;
	context: C;
	states: SheetStates<S, C, E>;
};

/** Where a machine is: the current step, its context and the steps that led here. */
export type SheetMachineSnapshot<S extends string, C> = {
	value: S;
	context: C;
	history: readonly S[];
};

export type SheetTransitionError<S extends string> =
	| { code: "no-transition"; from: S; event: string }
	| { code: "guard-rejected"; from: S; to: S; event: string };

export type SheetTransitionResult<S extends string, C> = Result<SheetMachineSnapshot<S, C>, SheetTransitionError<S>>;

export type SheetMachine<S extends string, C, E extends SheetEvent> = {
	config: SheetMachineConfig<S, C, E>;
	initial: SheetMachineSnapshot<S, C>;
	/** The next snapshot, or why there is none. Never throws, never mutates. */
	transition: (snapshot: SheetMachineSnapshot<S, C>, event: E) => SheetTransitionResult<S, C>;
	/** Whether `transition` would succeed — for disabling a Next button. */
	can: (snapshot: SheetMachineSnapshot<S, C>, event: E) => boolean;
	/** The steps in declaration order. */
	steps: readonly S[];
	/** The target's explicit `direction`, else declaration order. */
	directionOf: (from: S, to: S) => SheetStepDirection;
	nodeOf: (step: S) => SheetStateNode<S, C, E>;
};
