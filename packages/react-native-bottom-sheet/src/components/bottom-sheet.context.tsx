import { createContext, type RefObject, useContext } from "react";
import type { AnimateTo } from "../animation/animation.types";
import type { SheetPans } from "../gesture/gesture.types";
import type { ContainerLayout } from "../layout/use-container-layout";
import type { SheetGeometry, SheetSharedState } from "../state/state.types";
import type { SheetIntentDispatch } from "../state/use-sheet-intents";
import type { BottomSheetAnimatedValue, BottomSheetContextValue } from "./bottom-sheet.types";

const OUTSIDE = (hook: string): Error =>
	new Error(
		`[@delacour/react-native-bottom-sheet] ${hook} outside <BottomSheet>. Every part reads its sheet from context.`
	);

/** The open state and the imperative methods, for triggers, close buttons and consumers. */
export const BottomSheetContext = createContext<BottomSheetContextValue | null>(null);
BottomSheetContext.displayName = "DelacourBottomSheet.Context";

export function useBottomSheet(): BottomSheetContextValue {
	const value = useContext(BottomSheetContext);
	if (value === null) throw OUTSIDE("useBottomSheet");
	return value;
}

export function useOptionalBottomSheet(): BottomSheetContextValue | null {
	return useContext(BottomSheetContext);
}

/** The shared values a skin animates against — the position, the index, every measured height. */
export const BottomSheetAnimatedContext = createContext<BottomSheetAnimatedValue | null>(null);
BottomSheetAnimatedContext.displayName = "DelacourBottomSheet.AnimatedContext";

export function useBottomSheetAnimated(): BottomSheetAnimatedValue {
	const value = useContext(BottomSheetAnimatedContext);
	if (value === null) throw OUTSIDE("useBottomSheetAnimated");
	return value;
}

export function useOptionalBottomSheetAnimated(): BottomSheetAnimatedValue | null {
	return useContext(BottomSheetAnimatedContext);
}

/**
 * Everything the parts share and a consumer should not need: the raw state,
 * the geometry, the pans, the portal's mount flag and the accessibility ids.
 * Exported for a part written outside this package — a skin's `Footer`, a
 * scrollable built with `createBottomSheetScrollable` — never for an app.
 */
export type BottomSheetInternalValue = {
	state: SheetSharedState;
	geometry: SheetGeometry;
	pans: SheetPans;
	animateTo: AnimateTo;
	dispatch: SheetIntentDispatch;
	containerLayout: ContainerLayout;
	/** Whether the portal's children are mounted: open, closing, or kept. */
	presented: boolean;
	keepMounted: boolean;
	topInset: number;
	/** The overlay tells the panel it exists, for `accessibilityViewIsModal`. */
	hasOverlay: boolean;
	setHasOverlay: (has: boolean) => void;
	/** A handle sets this on mount; a container with none reports a zero handle height. */
	handleMounted: RefObject<boolean>;
	enableHandlePanningGesture: boolean;
	titleId: string;
	descriptionId: string;
};

export const BottomSheetInternalContext = createContext<BottomSheetInternalValue | null>(null);
BottomSheetInternalContext.displayName = "DelacourBottomSheet.InternalContext";

export function useBottomSheetInternal(): BottomSheetInternalValue {
	const value = useContext(BottomSheetInternalContext);
	if (value === null) throw OUTSIDE("useBottomSheetInternal");
	return value;
}

export function useOptionalBottomSheetInternal(): BottomSheetInternalValue | null {
	return useContext(BottomSheetInternalContext);
}
