import { createContext, type ReactElement, type ReactNode, use } from "react";
import type { SharedValue } from "react-native-reanimated";
import type { HapticFeedback } from "../pressable";
import type { SplitViewVariant } from "./split-view.variants";

/** What `useSplitView()` hands a custom child: the settled stop, and the way to change it. */
export type SplitViewContextValue = {
	/** Index into the stops, ascending by height. Settled — never the live drag. */
	snapIndex: number;
	snapCount: number;
	variant: SplitViewVariant;
	isDisabled: boolean;
	/** Animate to stop `index`, clamped to range. */
	snapTo: (index: number) => void;
};

/**
 * What the parts read on top of the public state. Internal: never re-exported
 * from `index.ts`, so the live shared values stay out of the public surface.
 */
export type SplitViewPartContextValue = SplitViewContextValue & {
	/** The top pane's live height, points, on the UI thread. */
	top: SharedValue<number>;
	/** The root's height, points. `0` until measured — the top pane flexes until then. */
	extent: SharedValue<number>;
	/** Every stop as a top-pane height, ascending. Zeros until measured. */
	heights: readonly number[];
	haptic: false | HapticFeedback;
	/** Whether a finger is on the drag row — the grip darkens while it is. */
	isActive: boolean;
	setActive: (isActive: boolean) => void;
	/** Stops a settle in flight, from a worklet. */
	interrupt: () => void;
	/** Animates `top` to stop `index` from a worklet, carrying `velocity`; jumps under Reduce Motion. */
	settle: (index: number, velocity: number) => void;
	/** Reports the stop a drag settled on. Called once per release, never per frame. */
	commitDrag: (index: number) => void;
	/** The tap and activate path: next stop, wrapping, announced when a screen reader is on and `announce` is set. */
	cycle: (announce: boolean) => void;
};

const SplitViewContext = createContext<SplitViewPartContextValue | null>(null);

/**
 * Supplies one split view's state to its own parts.
 *
 * Lives in its own module, importing nothing but React and types, so a part can
 * read it without importing `./split-view` — which would close a cycle.
 */
export function SplitViewProvider({
	value,
	children,
}: {
	value: SplitViewPartContextValue;
	children: ReactNode;
}): ReactElement {
	return <SplitViewContext value={value}>{children}</SplitViewContext>;
}
SplitViewProvider.displayName = "DelacourUI.SplitView.Provider";

/** The enclosing split view's state, or null outside a `<SplitView>`. */
export function useSplitViewContext(): SplitViewContextValue | null {
	return use(SplitViewContext);
}

/**
 * Reads the enclosing split view's settled stop, and `snapTo` to change it.
 *
 * For a button that expands the map, a readout of the stop, a toolbar that
 * hides at the smallest stop. Throws outside a `<SplitView>`.
 */
export function useSplitView(): SplitViewContextValue {
	const context = use(SplitViewContext);
	if (!context) {
		throw new Error("useSplitView must be called inside a <SplitView>.");
	}
	return context;
}

/** Internal: the live state, for a part that cannot work without its root. */
export function useSplitViewPart(component: string): SplitViewPartContextValue {
	const context = use(SplitViewContext);
	if (!context) {
		throw new Error(`${component} must be rendered inside a <SplitView>.`);
	}
	return context;
}
