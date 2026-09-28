import type { ComponentRef, ReactNode, Ref } from "react";
import type { View, ViewProps } from "react-native";
import type { SheetAnimation } from "../animation/animation.types";
import type {
	SheetEvent,
	SheetMachine,
	SheetMachineSnapshot,
	SheetStepDirection,
	SheetStepTransition,
	SheetTransitionError,
} from "../core";

/**
 * What `useSheetMachine` returns and `BottomSheet.Steps` takes.
 *
 * A snapshot plus the verbs: `send` an event, ask whether one `can` be sent,
 * test the current step with `matches`. `direction` is which way the last
 * change of step read, for the transition the body animates. An XState
 * adapter is any object with this shape — nothing checks its identity.
 */
export type SheetStepController<S extends string, C, E extends SheetEvent> = SheetMachineSnapshot<S, C> & {
	/** The machine the controller runs, for `nodeOf` and `steps`. */
	machine: SheetMachine<S, C, E>;
	/** The steps in declaration order. */
	steps: readonly S[];
	/** Which way the last change of step went. `forward` until one happens. */
	direction: SheetStepDirection;
	send: (event: E) => void;
	/** Whether `send` would move — for disabling a Next button. */
	can: (event: E) => boolean;
	matches: (step: S) => boolean;
	/** Back to `machine.initial`. `Steps` calls it after a close when `resetOnClose`. */
	reset: () => void;
};

export type UseSheetMachineOptions<S extends string, C, E extends SheetEvent> = {
	/** A transition succeeded: the snapshot it left and the one it reached. */
	onTransition?: (from: SheetMachineSnapshot<S, C>, to: SheetMachineSnapshot<S, C>, event: E) => void;
	/** A transition was refused. The snapshot is unchanged. */
	onRejected?: (error: SheetTransitionError<S>, event: E) => void;
};

export type BottomSheetStepsProps<S extends string, C, E extends SheetEvent> = Omit<ViewProps, "children"> & {
	children?: ReactNode;
	ref?: Ref<ComponentRef<typeof View>>;
	controller: SheetStepController<S, C, E>;
	/** How one step gives way to the next. @default "crossfade" */
	transition?: SheetStepTransition;
	/** The spring or timing for the height and the transition. The root's `animation` when omitted. */
	animation?: SheetAnimation;
	/** Send the controller back to its initial step once the sheet has closed. @default true */
	resetOnClose?: boolean;
	/** Extra space between the steps and a sticky footer. @default 0 */
	footerGap?: number;
};

export type BottomSheetStepProps<S extends string = string> = ViewProps & {
	ref?: Ref<ComponentRef<typeof View>>;
	/** The step this body belongs to — a key of the machine's `states`. */
	name: S;
};
