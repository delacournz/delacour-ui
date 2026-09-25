import { createContext, useContext } from "react";
import type { LayoutChangeEvent } from "react-native";
import type { SharedValue } from "react-native-reanimated";
import { useOptionalBottomSheetInternal } from "../components/bottom-sheet.context";
import type { SheetEvent, SheetStepDirection, SheetStepTransition } from "../core";
import type { SheetStepController } from "./steps.types";

const OUTSIDE = (hook: string): Error =>
	new Error(
		`[@delacour/react-native-bottom-sheet] ${hook} outside <BottomSheet.Steps>. A step reads its controller from context.`
	);

/**
 * The controller `BottomSheet.Steps` was given, for every descendant — a
 * step's own buttons, a title that names the step. A `Footer` written beside
 * the body rather than inside it is not a descendant, so `Steps` also
 * registers the controller with the root and `useSheetStep` falls back to
 * that: anywhere inside the `BottomSheet` works once the body has mounted.
 *
 * Typed loosely at the context boundary: a provider cannot carry the machine's
 * generics through `createContext`, so `useSheetStep<S, C, E>()` asserts them
 * back at the call site, the way a typed selector would.
 */
export const SheetStepContext = createContext<SheetStepController<string, unknown, SheetEvent> | null>(null);
SheetStepContext.displayName = "DelacourBottomSheet.StepContext";

/** Untyped at the boundary; `use-sheet-step.ts` puts the machine's generics back. */
export function useSheetStep(): SheetStepController<string, unknown, SheetEvent> {
	const value = useContext(SheetStepContext);
	const registered = useOptionalBottomSheetInternal()?.stepControllerRef.current ?? null;
	const controller = value ?? registered;
	if (controller === null) throw OUTSIDE("useSheetStep");
	return controller;
}

export function useOptionalSheetStep(): SheetStepController<string, unknown, SheetEvent> | null {
	const value = useContext(SheetStepContext);
	const registered = useOptionalBottomSheetInternal()?.stepControllerRef.current ?? null;
	return value ?? registered;
}

/**
 * What `Steps` tells each `Step`: whether it is the one arriving or the one
 * leaving, how far the change has run, and where to report its height.
 * Internal to the folder.
 */
export type StepsLayoutValue = {
	/** The step the machine is on. */
	active: string;
	/** The step on its way out during a transition, `null` otherwise. */
	outgoing: string | null;
	direction: SheetStepDirection;
	transition: SheetStepTransition;
	/** `0` at the start of a change, `1` once the incoming step is fully in. */
	progress: SharedValue<number>;
	/** The frame's width, for `slide`. */
	width: SharedValue<number>;
	/** The active step's measured height, from its `onLayout`. */
	onActiveLayout: (event: LayoutChangeEvent) => void;
};

export const StepsLayoutContext = createContext<StepsLayoutValue | null>(null);
StepsLayoutContext.displayName = "DelacourBottomSheet.StepsLayoutContext";

export function useStepsLayout(): StepsLayoutValue {
	const value = useContext(StepsLayoutContext);
	if (value === null) throw OUTSIDE("BottomSheet.Step");
	return value;
}

export function useOptionalStepsLayout(): StepsLayoutValue | null {
	return useContext(StepsLayoutContext);
}
