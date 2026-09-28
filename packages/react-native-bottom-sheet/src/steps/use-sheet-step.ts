import type { SheetEvent } from "../core";
import { useOptionalSheetStep as useOptionalUntyped, useSheetStep as useUntyped } from "./steps.context";
import type { SheetStepController } from "./steps.types";

/**
 * The controller of the nearest `BottomSheet.Steps` — or the one registered
 * with the enclosing `BottomSheet`, for a part written beside the body such
 * as a `Footer` — with the machine's generics asserted back on.
 *
 * A context cannot carry `<S, C, E>` through `createContext`, so the hook in
 * `steps.context.tsx` returns the untyped controller and this one narrows it
 * the way a typed selector would: `useSheetStep<Step, Context, Event>()` is
 * the caller's promise that the enclosing `Steps` runs that machine.
 */
export function useSheetStep<
	S extends string = string,
	C = unknown,
	E extends SheetEvent = SheetEvent,
>(): SheetStepController<S, C, E> {
	return useUntyped() as unknown as SheetStepController<S, C, E>;
}

export function useOptionalSheetStep<
	S extends string = string,
	C = unknown,
	E extends SheetEvent = SheetEvent,
>(): SheetStepController<S, C, E> | null {
	return useOptionalUntyped() as unknown as SheetStepController<S, C, E> | null;
}
