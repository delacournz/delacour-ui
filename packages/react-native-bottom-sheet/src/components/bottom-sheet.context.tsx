import { createContext, type RefObject, useContext } from "react";
import type { AnimateTo, SheetAnimation } from "../animation/animation.types";
import type { DetachedOptions, ReduceMotionMode, ScrollableType, SheetEvent, SheetStepOverride } from "../core";
import type { SheetPans } from "../gesture/gesture.types";
import type { SheetKeyboardRegistry } from "../keyboard/use-sheet-keyboard";
import type { ContainerLayout } from "../layout/use-container-layout";
import type { ScrollableHandle } from "../scrollable/scrollable.types";
import type { SheetGeometry, SheetSharedState } from "../state/state.types";
import type { SheetIntentDispatch } from "../state/use-sheet-intents";
import type { SheetStepController } from "../steps/steps.types";
import type { BottomSheetAnimatedValue, BottomSheetContextValue } from "./bottom-sheet.types";

/** Who writes `contentHeight`: `Content`'s own layout, or a `Steps` body animating it. */
export type ContentHeightSource = "content" | "steps";

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
	/** The root's `bottomInset`, for a part that reserves the resting safe-area band on the JS side. */
	bottomInset: number;
	/** The overlay tells the panel it exists, for `accessibilityViewIsModal`. */
	hasOverlay: boolean;
	setHasOverlay: (has: boolean) => void;
	/** A handle sets this on mount; a container with none reports a zero handle height. */
	handleMounted: RefObject<boolean>;
	/** A sticky footer sets this on mount; the dynamic snap point counts it and the body reserves space for it. */
	hasFooter: boolean;
	setHasFooter: (has: boolean) => void;
	/** Where `useBottomSheetTextInput` registers its field. */
	keyboard: SheetKeyboardRegistry;
	enableHandlePanningGesture: boolean;
	/** The root's prop, for the scroll lock: with no content pan there is nothing for a lock to hand a drag to. */
	enableContentPanningGesture: boolean;
	titleId: string;
	descriptionId: string;
	/**
	 * A scrollable built with `createBottomSheetScrollable` registers itself on
	 * focus and withdraws on blur; the sheet's content pan reads the type it
	 * wrote. One scrollable at a time — the last to focus wins.
	 */
	setScrollableRef: (ref: RefObject<ScrollableHandle | null>, type: ScrollableType) => void;
	removeScrollableRef: (ref: RefObject<ScrollableHandle | null>) => void;
	/** The id the registry knows this sheet by, from `useId`. */
	sheetId: string;
	stackBehavior: "push" | "replace";
	/** The resolved `detached` prop: `null` when attached. The panel and the body read it on the JS side. */
	detached: DetachedOptions | null;
	/** The root's `animation` and `overrideReduceMotion`, for a part that animates in step with the sheet. */
	animation: SheetAnimation | undefined;
	overrideReduceMotion: ReduceMotionMode | undefined;
	/**
	 * `Content` measures itself into `contentHeight` only while this reads
	 * `content`; a `Steps` body sets `steps` and drives the value itself.
	 */
	contentHeightSource: RefObject<ContentHeightSource>;
	setContentHeightSource: (source: ContentHeightSource) => void;
	/**
	 * What the current step asks of the root: its `snapPoints` in place of the
	 * prop, and `dismissible: false` to hold off pan-down-to-close and the
	 * overlay's press. `null` with no `Steps` body.
	 */
	stepOverride: SheetStepOverride | null;
	setStepOverride: (override: SheetStepOverride | null) => void;
	/**
	 * The `Steps` body's controller, so `useSheetStep` reaches it from a
	 * `Footer` written beside the body. The ref is written during `Steps`'s
	 * render, so a footer rendered after it in the same pass already sees it;
	 * the state is set from a layout effect and is what re-renders a consumer
	 * that did not.
	 */
	stepControllerRef: RefObject<SheetStepController<string, unknown, SheetEvent> | null>;
	stepController: SheetStepController<string, unknown, SheetEvent> | null;
	setStepController: (controller: SheetStepController<string, unknown, SheetEvent> | null) => void;
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
